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

            await this.auditLogService.log(user.id, 'LOGIN_SUCCESS', { email: user.email, method: 'password' });
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



    // ── Refresh token helpers ───────────────────────────────────────────────
    //
    // Access tokens stay short (15 min). Refresh tokens are stored as a
    // SHA-256 hash so a DB leak doesn't yield live bearer credentials.
    // Every refresh *rotates* the token: the old hash is marked revoked
    // and replaced by a new one sharing the same `family`. If a caller
    // ever presents a token whose hash is already marked revoked, we
    // treat that as replay (attacker stole it) and revoke the whole
    // family — forcing a real re-login on every device.

    private refreshTokenTtlMs(rememberMe: boolean): number {
        return rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    }

    private hashRefreshToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private async issueRefreshToken(userId: string, family: string, rememberMe: boolean) {
        const token = crypto.randomBytes(48).toString('hex');
        const tokenHash = this.hashRefreshToken(token);
        const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs(rememberMe));
        await (this.prisma as any).refreshToken.create({
            data: { tokenHash, family, userId, expiresAt },
        });
        return { token, expiresAt };
    }

    private signAccessToken(user: any, demoDbUrl?: string) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: (user as any).role?.name,
            forcePasswordChange: user.forcePasswordChange,
            demoDbUrl: demoDbUrl || undefined,
        };
        return this.jwtService.sign(payload, { expiresIn: '15m' });
    }

    /**
     * Rotate a refresh token. If the token is already revoked but exists, the
     * whole family is killed — classic replay detection.
     */
    async rotateRefreshToken(presentedToken: string) {
        const tokenHash = this.hashRefreshToken(presentedToken);
        const row = await (this.prisma as any).refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { role: true } } },
        });
        if (!row) throw new UnauthorizedException('Invalid refresh token');

        if (row.revokedAt) {
            // Replay detected — nuke the entire family.
            await (this.prisma as any).refreshToken.updateMany({
                where: { family: row.family, revokedAt: null },
                data: { revokedAt: new Date() },
            });
            await this.auditLogService.log(row.userId, 'REFRESH_TOKEN_REPLAY', { family: row.family }, 'DANGER');
            throw new UnauthorizedException('Refresh token replay detected — please log in again');
        }

        if (row.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        if (!row.user || row.user.status === 'DEACTIVATED') {
            throw new UnauthorizedException('Account no longer active');
        }

        // Rotate: mark old revoked, issue new in the same family.
        const isLongLived = row.expiresAt.getTime() - row.createdAt.getTime() > 8 * 24 * 60 * 60 * 1000;
        const { token: newToken, expiresAt } = await this.issueRefreshToken(row.userId, row.family, isLongLived);
        await (this.prisma as any).refreshToken.update({
            where: { id: row.id },
            data: { revokedAt: new Date(), replacedBy: this.hashRefreshToken(newToken) },
        });

        const access_token = this.signAccessToken(row.user);
        return { access_token, refresh_token: newToken, refresh_expires_at: expiresAt };
    }

    /**
     * Build a freshly-minted session (access + refresh) for a user who just
     * passed whatever gate they needed to pass — password login, 2FA verify,
     * forced-2FA enrolment, etc. Shared helper so every code path rotates
     * refresh tokens with the same invariants.
     */
    async buildSessionResponse(user: any, rememberMe: boolean = false, demoDbUrl?: string) {
        const access_token = this.signAccessToken(user, demoDbUrl);
        const family = crypto.randomUUID();
        const { token: refresh_token, expiresAt: refresh_expires_at } =
            await this.issueRefreshToken(user.id, family, rememberMe);
        return { access_token, refresh_token, refresh_expires_at };
    }

    async revokeRefreshToken(presentedToken: string) {
        if (!presentedToken) return { success: true };
        const tokenHash = this.hashRefreshToken(presentedToken);
        await (this.prisma as any).refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return { success: true };
    }

    async login(user: any, rememberMe: boolean = false, demoDbUrl?: string) {
        if (user.twoFactorEnabled) {
            const tempPayload = { email: user.email, sub: user.id, scope: '2fa_pending' };
            return {
                requires2fa: true,
                temp_token: this.jwtService.sign(tempPayload, { expiresIn: '5m' }),
            };
        }

        // Enforce 2FA for privileged roles if the policy is enabled.
        // Block login by returning a setup-required temp token the frontend
        // uses to walk the user through enrolment. The jwt strategy rejects
        // this scope on any protected route (see jwt.strategy.ts).
        const force2faSetting = await (this.prisma as any).setting.findUnique({
            where: { key: 'security_force_2fa_for_admins' },
        });
        if (force2faSetting?.value === 'true') {
            const roleName = (user.role?.name || '').toLowerCase();
            const isPrivileged = roleName === 'super admin' || roleName === 'admin';
            if (isPrivileged) {
                const tempPayload = { email: user.email, sub: user.id, scope: '2fa_setup_required' };
                return {
                    requires2faSetup: true,
                    temp_token: this.jwtService.sign(tempPayload, { expiresIn: '15m' }),
                };
            }
        }

        // Issue short-lived access token + rotating refresh token.
        const session = await this.buildSessionResponse(user, rememberMe, demoDbUrl);
        return {
            ...session,
            forcePasswordChange: user.forcePasswordChange,
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

        // Resolve the public site URL the same way SettingsService does
        // — DB setting first, then env vars, then localhost. We don't
        // inject SettingsService here to avoid pulling another foundational
        // module into auth's dependency graph; the inline lookup is fine
        // because we already read settings inline elsewhere in this file.
        const siteUrlRow = await (this.prisma as any).setting.findUnique({
            where: { key: 'site_url' },
        }).catch(() => null);
        const frontendUrl = (
            (siteUrlRow?.value as string) ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.APP_URL ||
            process.env.FRONTEND_URL ||
            'http://localhost:3000'
        ).trim().replace(/\/+$/, '');
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
