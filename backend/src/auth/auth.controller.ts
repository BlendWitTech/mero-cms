import { Controller, Request, Post, UseGuards, Body, Get, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SecurityService } from './security.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private securityService: SecurityService,
        private usersService: UsersService,
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

        // If it was a login attempt (tempToken present), return the full access token
        if (body.tempToken) {
            const payload = {
                email: userDetails.email,
                sub: userDetails.id,
                role: (userDetails as any).role.name,
                forcePasswordChange: userDetails.forcePasswordChange
            };
            // Use authService.login logic directly or refactor
            // We need to access jwtService to sign
            // Let's assume we can call a method in AuthService roughly.
            const accessToken = this.authService['jwtService'].sign(payload);
            return { success: true, access_token: accessToken };
        }

        await (this.usersService as any).enableTwoFactor(userId);
        return { success: true };
    }

    @Post('register')
    async register(@Body() userData: any) {
        return this.authService.register(userData);
    }

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

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.usersService.findOne(req.user.email);
        return user;
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

    @Post('reset-password')
    async resetPassword(@Body() body: any) {
        return this.authService.resetPassword(body.email, body.token, body.newPassword);
    }
}
