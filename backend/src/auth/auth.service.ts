import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
        private mailService: MailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        const settings = await (this.prisma as any).setting.findMany();
        const settingsMap = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

        // Standardize keys: Backend uses 'lockout_threshold', Frontend toggle is 'security_failed_login_limit'
        const isLockoutEnabled = settingsMap['security_failed_login_limit'] === 'true';
        const threshold = parseInt(settingsMap['lockout_threshold'] || '5');
        const duration = parseInt(settingsMap['lockout_duration'] || '15'); // in minutes

        if (!user) return null;

        // Check for deactivation
        if (user.status === 'DEACTIVATED') {
            throw new UnauthorizedException('Your account has been deactivated. Please contact an administrator.');
        }

        // Check for lockout
        if (isLockoutEnabled && user.lockoutUntil && user.lockoutUntil > new Date()) {
            throw new UnauthorizedException(`Account is temporarily locked due to multiple failed login attempts. Please try again in ${duration} minutes.`);
        }

        if (await bcrypt.compare(pass, user.password)) {
            // Reset failed attempts and update lastActive on success
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lockoutUntil: null,
                    lastActive: new Date()
                },
            });

            await this.auditLogService.log(user.id, 'LOGIN_SUCCESS', { ip: 'unknown' });
            const { password, ...result } = user;
            return result;
        }

        // Increment failed attempts if lockout is enabled
        if (isLockoutEnabled) {
            const attempts = user.failedLoginAttempts + 1;
            const lockoutUntil = attempts >= threshold ? new Date(Date.now() + duration * 60 * 1000) : null;

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: attempts,
                    lockoutUntil
                },
            });
            await this.auditLogService.log(user.id, 'LOGIN_FAILURE', { attempts }, 'DANGER');
        } else {
            // Just log failure without incrementing lockout counters
            await this.auditLogService.log(user.id, 'LOGIN_FAILURE', { attempts: 'Lockout Disabled' }, 'WARNING');
        }

        return null;
    }



    async login(user: any, rememberMe: boolean = false) {
        if (user.twoFactorEnabled) {
            const tempPayload = { email: user.email, sub: user.id, scope: '2fa_pending' };
            return {
                requires2fa: true,
                temp_token: this.jwtService.sign(tempPayload, { expiresIn: '5m' }),
            };
        }

        const payload = {
            email: user.email,
            sub: user.id,
            role: (user as any).role.name,
            forcePasswordChange: user.forcePasswordChange
        };

        const jwtOptions = { expiresIn: rememberMe ? '30d' : '24h' };

        return {
            access_token: this.jwtService.sign(payload, jwtOptions as any),
            forcePasswordChange: user.forcePasswordChange
        };
    }

    async changePassword(userId: string, newPass: string) {
        const hashedPassword = await bcrypt.hash(newPass, 12);
        return (this.prisma as any).user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                forcePasswordChange: false
            },
        });
    }

    async register(userData: any) {
        let role = await (this.prisma as any).role.findFirst({ where: { name: 'Admin' } });
        if (!role) {
            role = await (this.prisma as any).role.create({
                data: {
                    name: 'Admin',
                    permissions: {},
                },
            });
        }

        const { email, password, name } = userData;
        return this.usersService.create({
            email,
            password,
            name,
            role: { connect: { id: role.id } },
        });
    }

    async registerWithInvitation(token: string, userData: { name: string; password: string }) {
        const invitation = await (this.prisma as any).invitation.findUnique({
            where: { token },
        });

        if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired invitation token.');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 12);

        let finalRoleId = invitation.roleId;

        // Fallback: If roleId is not a UUID, it might be a role name (legacy invitation)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(finalRoleId)) {
            this.logger.warn(`Legacy invitation detected for ${invitation.email}. roleId "${finalRoleId}" is not a UUID. Attempting name lookup.`);
            const role = await (this.prisma as any).role.findUnique({
                where: { name: finalRoleId }
            });
            if (role) {
                finalRoleId = role.id;
            } else {
                throw new BadRequestException(`Role "${finalRoleId}" no longer exists.`);
            }
        }

        const user = await this.prisma.user.create({
            data: {
                email: invitation.email,
                name: userData.name,
                password: hashedPassword,
                roleId: finalRoleId,
                ipWhitelist: invitation.ipWhitelist,
            },
        });

        await (this.prisma as any).invitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' },
        });

        await this.auditLogService.log(user.id, 'USER_REGISTERED_INVITATION', { email: user.email });

        return user;
    }
    async forgotPassword(email: string) {
        // Always return the same message to prevent user enumeration
        const user = await this.usersService.findOne(email);
        if (!user) return { message: 'If a user with that email exists, a reset link has been sent.' };

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await (this.prisma as any).user.update({
            where: { id: user.id },
            data: { passwordResetToken: token, passwordResetExpiry: expiry },
        });

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        try {
            await this.mailService.sendTemplatedMail(
                email,
                'Reset your password',
                `<h2 style="margin:0 0 12px;font-size:20px;font-weight:900;color:#1E1E1E;">Reset your password</h2>
                 <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">Click the button below to set a new password. This link expires in 1 hour.</p>
                 <a href="${resetLink}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">Reset Password</a>
                 <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;">If you didn't request this, you can safely ignore this email.</p>`,
                'Reset your password — link expires in 1 hour.',
            );
        } catch (err) {
            this.logger.error('Failed to send password reset email', err);
        }

        await this.auditLogService.log(user.id, 'PASSWORD_RESET_REQUEST', {}, 'WARNING');
        return { message: 'If a user with that email exists, a reset link has been sent.' };
    }

    async resetPassword(email: string, token: string, newPass: string) {
        const user = await this.usersService.findOne(email) as any;
        if (!user) throw new UnauthorizedException('Invalid or expired reset token.');

        if (
            !user.passwordResetToken ||
            user.passwordResetToken !== token ||
            !user.passwordResetExpiry ||
            user.passwordResetExpiry < new Date()
        ) {
            throw new UnauthorizedException('Invalid or expired reset token.');
        }

        const hashedPassword = await bcrypt.hash(newPass, 12);
        await (this.prisma as any).user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });

        await this.auditLogService.log(user.id, 'PASSWORD_RESET_SUCCESS');
        return { message: 'Password reset successfully.' };
    }
}
