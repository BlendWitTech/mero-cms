import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Plugin Marketplace endpoints — gated behind PLUGIN_MARKETPLACE (Premium+).
 */
@Controller('plugins')
@UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
@RequireLimit(PackageLimit.PLUGIN_MARKETPLACE)
@RequirePermissions(Permission.SETTINGS_EDIT)
export class PluginsController {
    constructor(
        private readonly plugins: PluginsService,
        private readonly auditLog: AuditLogService,
    ) {}

    @Get()
    listInstalled() {
        return this.plugins.listInstalled();
    }

    @Get('marketplace')
    listMarketplace() {
        return this.plugins.listMarketplace();
    }

    @Post(':slug/install')
    async install(
        @Param('slug') slug: string,
        @Body() body: { licenseKey?: string },
        @Request() req: any,
    ) {
        const result = await this.plugins.install(slug, body?.licenseKey);
        await this.auditLog.log(req.user.id, 'PLUGIN_INSTALL', {
            slug,
            licensed: Boolean(body?.licenseKey),
            priceNPR: result.purchasedPriceNPR,
        });
        return result;
    }

    @Post(':slug/toggle')
    async toggle(
        @Param('slug') slug: string,
        @Body() body: { enabled: boolean },
        @Request() req: any,
    ) {
        const result = await this.plugins.toggle(slug, Boolean(body?.enabled));
        await this.auditLog.log(req.user.id, 'PLUGIN_TOGGLE', {
            slug,
            enabled: result.enabled,
        });
        return result;
    }

    @Delete(':slug')
    async uninstall(@Param('slug') slug: string, @Request() req: any) {
        const result = await this.plugins.uninstall(slug);
        await this.auditLog.log(req.user.id, 'PLUGIN_UNINSTALL', { slug }, 'WARNING');
        return result;
    }

    /**
     * Reinstall an installed plugin — re-runs gates, refreshes the
     * version pulled from the catalog, preserves the licenseKey so
     * paid plugins don't need re-purchasing. Streams progress events
     * through the shared SetupProgressService Subject so admin UI can
     * surface them in a terminal if it wants. Audit-logged as INFO
     * (not destructive — keeps all customer state).
     */
    @Post(':slug/reinstall')
    async reinstall(@Param('slug') slug: string, @Request() req: any) {
        const result = await this.plugins.reinstall(slug);
        await this.auditLog.log(req.user.id, 'PLUGIN_REINSTALL', {
            slug,
            version: result.version,
        }, 'INFO');
        return result;
    }

    /**
     * Initiate a paid plugin purchase. The signed-in admin's email is
     * used as the customer record on the Order; the provider can be
     * overridden in the request body (defaults to Khalti for the
     * Nepal market). Returns { redirectUrl, orderId } so the admin
     * UI can send the user off to the provider's hosted checkout.
     */
    @Post(':slug/purchase')
    async purchase(
        @Param('slug') slug: string,
        @Request() req: any,
        @Body() body: { provider?: 'khalti' | 'stripe' | 'esewa' } = {},
    ) {
        const email = req.user?.email;
        if (!email) {
            throw new BadRequestException('Authenticated user has no email; cannot initiate purchase.');
        }
        return this.plugins.initiatePurchase(slug, email, body.provider || 'khalti');
    }

    /**
     * Verify a plugin purchase by orderId after the customer returns
     * from the payment provider. Reads the Order row, confirms it's
     * paid, then installs the plugin with the issued licenseKey.
     */
    @Get(':slug/verify')
    async verify(
        @Param('slug') slug: string,
        @Query('orderId') orderId: string,
        @Request() req: any,
    ) {
        const result = await this.plugins.verifyPurchase(orderId, slug);
        await this.auditLog.log(req.user.id, 'PLUGIN_PURCHASE_VERIFIED', {
            slug,
            priceNPR: result.purchasedPriceNPR,
            licenseKey: result.licenseKey,
        });
        return result;
    }
}
