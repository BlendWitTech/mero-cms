import { Controller, Request, Post, UseGuards, Body, Get, BadRequestException } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SecurityService } from './security.service';
import { UsersService } from '../users/users.service';
import { LicenseService } from './license.service';
import { PackagesService } from '../packages/packages.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private securityService: SecurityService,
        private usersService: UsersService,
        private licenseService: LicenseService,
        private packagesService: PackagesService,
    ) { }

    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req, @Body() body: { rememberMe?: boolean }) {
        return this.authService.login(req.user, body.rememberMe);
    }

    @UseGuards(JwtAuthGuard)
    @Get('2fa/generate')
    async generate2fa(@Request() req) {
        const user = req.user;
        const secret = this.securityService.generateSecret();
        const qrCode = await this.securityService.generateQrCode(user.email, secret);

        // Temporarily store the secret in the user record (not enabled yet)
        await (this.usersService as any).updateTwoFactorSecret(user.id, secret);

        return { qrCode, secret };
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/enable')
    async enable2fa(@Body() body: { token: string }, @Request() req) {
        const userDetails = await this.usersService.findOne(req.user.email);
        if (!userDetails || !userDetails.twoFactorSecret) {
            return { success: false, message: '2FA not initialized. Generate QR code first.' };
        }
        const isValid = this.securityService.verifyToken(body.token, userDetails.twoFactorSecret);
        if (!isValid) return { success: false, message: 'Invalid token' };
        await (this.usersService as any).enableTwoFactor(req.user.id);
        return { success: true };
    }

    // TOTP codes are 6 digits — without a limit, an attacker who phishes a
    // tempToken could brute the 2FA code in minutes. 10 attempts per minute
    // per IP still leaves room for fat-fingering + retyping, but closes the
    // brute window.
    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @Post('2fa/verify')
    async verify2fa(@Body() body: { token: string; tempToken?: string }, @Request() req) {
        let userEmail = '';
        let userId = '';

        if (body.tempToken) {
            // Verify temp token manually since JwtGuard will reject it or we might not be logged in
            // Actually, we should probably make this endpoint Public or use a different Guard.
            // For simplicity, let's decode it here or rely on a custom handling.
            const decoded: any = this.authService['jwtService'].decode(body.tempToken); // Access jwtService if public
            if (!decoded || decoded.scope !== '2fa_pending') throw new Error('Invalid temp token');
            userEmail = decoded.email;
            userId = decoded.sub;
        } else {
            // Fallback for already logged in users enabling it?
            if (!req.user) throw new Error('Unauthorized');
            userEmail = req.user.email;
            userId = req.user.id;
        }

        const userDetails = await this.usersService.findOne(userEmail);
        if (!userDetails || !userDetails.twoFactorSecret) {
            return { success: false, message: '2FA not initialized' };
        }

        const isValid = this.securityService.verifyToken(body.token, userDetails.twoFactorSecret);

        if (!isValid) {
            return { success: false, message: 'Invalid token' };
        }

        // If it was a login attempt (tempToken present), hand back a full
        // session bundle (short access token + rotating refresh token).
        if (body.tempToken) {
            const session = await this.authService.buildSessionResponse(userDetails);
            return { success: true, ...session };
        }

        await (this.usersService as any).enableTwoFactor(userId);
        return { success: true };
    }

    /**
     * First step of the forced 2FA enrolment flow for privileged users who
     * login-blocked because `security_force_2fa_for_admins=true`. Accepts the
     * `2fa_setup_required` temp token issued by /auth/login and returns a
     * fresh TOTP QR code. Deliberately NOT guarded by JwtAuthGuard — that
     * guard rejects the scope on purpose.
     */
    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @Post('2fa/setup-start')
    async setup2faStart(@Body() body: { tempToken: string }) {
        const decoded: any = this.authService['jwtService'].decode(body.tempToken);
        if (!decoded || decoded.scope !== '2fa_setup_required') {
            throw new BadRequestException('Invalid or expired setup token');
        }
        const secret = this.securityService.generateSecret();
        const qrCode = await this.securityService.generateQrCode(decoded.email, secret);
        await (this.usersService as any).updateTwoFactorSecret(decoded.sub, secret);
        return { qrCode, secret };
    }

    /**
     * Second step: verify the TOTP, enable 2FA on the user, and hand back a
     * full access token. Completes the login that was blocked at step one.
     */
    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @Post('2fa/setup-complete')
    async setup2faComplete(@Body() body: { tempToken: string; token: string }) {
        const decoded: any = this.authService['jwtService'].decode(body.tempToken);
        if (!decoded || decoded.scope !== '2fa_setup_required') {
            throw new BadRequestException('Invalid or expired setup token');
        }
        const userDetails = await this.usersService.findOne(decoded.email);
        if (!userDetails || !userDetails.twoFactorSecret) {
            throw new BadRequestException('2FA not initialised — call setup-start first');
        }
        const valid = this.securityService.verifyToken(body.token, userDetails.twoFactorSecret);
        if (!valid) return { success: false, message: 'Invalid code' };

        await (this.usersService as any).enableTwoFactor(userDetails.id);

        // Hand back a full session (access + refresh) so the user lands signed-in.
        const session = await this.authService.buildSessionResponse(userDetails);
        return { success: true, ...session };
    }

    /**
     * Rotate a refresh token for a new short-lived access token.
     * No JwtAuthGuard — this endpoint's entire point is that the access
     * token has already expired.
     */
    @Throttle({ default: { ttl: 60000, limit: 30 } })
    @Post('refresh')
    async refresh(@Body() body: { refresh_token: string }) {
        if (!body?.refresh_token) throw new BadRequestException('refresh_token required');
        return this.authService.rotateRefreshToken(body.refresh_token);
    }

    /**
     * Logout — revokes the presented refresh token. Access tokens are
     * short-lived and will self-expire. Frontend should still clear its
     * stored tokens regardless of response.
     */
    @Post('logout')
    async logout(@Body() body: { refresh_token?: string }) {
        return this.authService.revokeRefreshToken(body?.refresh_token || '');
    }

    // Prevent drive-by mass account creation (bots, enumeration). Five
    // registrations per IP per 5 minutes matches the forgot-password tempo.
    @Throttle({ default: { ttl: 300000, limit: 5 } })
    @Post('register')
    async register(@Body() userData: any) {
        return this.authService.register(userData);
    }

    @Throttle({ default: { ttl: 300000, limit: 5 } })
    @Post('register-invited')
    async registerInvited(@Body() data: { token: string; name: string; password: string }) {
        try {
            return await this.authService.registerWithInvitation(data.token, {
                name: data.name,
                password: data.password,
            });
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Registration failed');
        }
    }

    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        // Middleware calls this on every protected-route load to validate
        // the access token; SkipThrottle is needed so navigating around the
        // admin doesn't trip the global 300/min cap.
        const user = await this.usersService.findOne(req.user.email);
        const usageData = await this.packagesService.getUsage();
        
        return {
            ...user,
            license: usageData ? {
                isValid: true,
                tier: usageData.package.tier,
                tierName: usageData.package.name,
                usage: usageData.usage,
                limits: usageData.limits,
            } : null,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(@Request() req, @Body('newPassword') newPass: string) {
        return this.authService.changePassword(req.user.id, newPass);
    }
    @Throttle({ default: { ttl: 300000, limit: 3 } })
    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    // Reset tokens are single-use but guessable token farming should still
    // be rate-limited. 5 attempts / 5 min matches forgot-password.
    @Throttle({ default: { ttl: 300000, limit: 5 } })
    @Post('reset-password')
    async resetPassword(@Body() body: any) {
        return this.authService.resetPassword(body.email, body.token, body.newPassword);
    }
}
