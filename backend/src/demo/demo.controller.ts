import { Controller, Post, Get, Body, Param, NotFoundException } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoSafe } from './demo-safe.decorator';
import { Public } from '../auth/public.decorator';
import { PACKAGES } from '../config/packages';
import { PrismaService } from '../prisma/prisma.service';

@Controller('demo')
export class DemoController {
    constructor(
        private demoService: DemoService,
        private prisma: PrismaService,
    ) {}

    @Public()
    @DemoSafe()
    @Post('start')
    async startDemo(@Body() body: { packageId: string }) {
        const pkg = PACKAGES.find(p => p.id === body.packageId);
        
        // Pass packageId to track which features to enable
        const { sessionId } = await this.demoService.initiateProvisioning(body.packageId);

        return {
            sessionId,
            package: pkg
        };
    }

    @Public()
    @Get('status/:id')
    async getStatus(@Param('id') id: string) {
        const session = await this.prisma.demoSession.findUnique({
            where: { id }
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const pkg = PACKAGES.find(p => p.id === session.packageId);

        // If it's ready, we also return the final login credentials/tokens
        let result: any = { 
            status: session.status,
            expiresAt: session.expiresAt,
            package: pkg
        };

        if (session.status === 'READY') {
            const authData = await this.demoService.getCompletionToken(id);
            const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL 
                ? process.env.NEXT_PUBLIC_SITE_URL.replace('localhost', '127.0.0.1')
                : 'http://127.0.0.1:3000';

            const adminEmail = process.env.DEMO_ADMIN_EMAIL;
            const adminPassword = process.env.DEMO_ADMIN_PASSWORD;

            if (!adminEmail || !adminPassword) {
                console.warn('[DEMO] Warning: DEMO_ADMIN_EMAIL or DEMO_ADMIN_PASSWORD not set in environment.');
            }

            result = {
                ...result,
                // Demo admin never has 2FA so login() always returns the
                // full session shape — cast to access the token.
                token: (authData as any).access_token,
                refresh_token: (authData as any).refresh_token,
                instanceUrl: dashboardUrl,
                loginUrl: `${dashboardUrl}/login?demo=1`,
                demoCredentials: {
                    adminEmail: adminEmail || 'admin@merocms.test',
                    adminPassword: adminPassword || 'demo1234'
                }
            };
        }

        return result;
    }

    @Public()
    @Get('global-status')
    async getGlobalStatus() {
        return this.demoService.getStatus();
    }
}
