import { Controller, Get, Body, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@Controller('settings')
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService,
        private readonly mailService: MailService,
    ) { }

    @Get()
    findAll() {
        return this.settingsService.findAll();
    }

    @Patch()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    updateMany(@Body() settings: Record<string, string>) {
        return this.settingsService.updateMany(settings);
    }

    @Post('clear-theme-cache')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async clearThemeCache() {
        try {
            return await this.settingsService.clearThemeCache();
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Failed to clear theme cache');
        }
    }

    @Post('test-email')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async testEmail(@Body() body: { to: string }) {
        try {
            await this.mailService.sendTemplatedMail(
                body.to,
                'SMTP Test — KTM Plots CMS',
                `<h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1E1E1E;">SMTP Working!</h2>
                 <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">Your email configuration is correctly set up. Emails from the system will be delivered to your recipients.</p>
                 <p style="margin:0;font-size:12px;color:#9CA3AF;">Sent from KTM Plots CMS · System Settings</p>`,
                'Your SMTP configuration is working correctly.',
            );
            return { success: true, message: `Test email sent to ${body.to}` };
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Failed to send test email');
        }
    }
}
