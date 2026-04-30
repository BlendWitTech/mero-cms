import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DemoProvisioningService } from './demo-provisioning.service';
import * as crypto from 'crypto';
import { PrismaClientManager } from '../prisma/prisma-client-manager';

@Injectable()
export class DemoService {
    constructor(
        private prisma: PrismaService,
        private authService: AuthService,
        private provisioningService: DemoProvisioningService,
    ) {}

    /**
     * Initiates the creation of a new isolated demo sandbox.
     * Returns the sessionId immediately while provisioning happens in the background.
     */
    async initiateProvisioning(packageId?: string) {
        if (process.env.DEMO_MODE !== 'true' && process.env.NODE_ENV !== 'development') {
            throw new UnauthorizedException('Demo provisioning only available in demo mode');
        }

        const sessionId = crypto.randomUUID();
        
        // This is non-blocking
        await this.provisioningService.provision(sessionId, packageId);

        return { sessionId };
    }

    /**
     * Finalizes the demo login for a READY session.
     */
    async getCompletionToken(sessionId: string) {
        const session = await this.prisma.demoSession.findUnique({
            where: { id: sessionId }
        });

        if (!session || session.status !== 'READY') {
            throw new UnauthorizedException('Session not ready or invalid');
        }

        const masterUrl = process.env.DATABASE_URL!;
        const dbUrl = masterUrl.replace(/\/[^\/]+$/, `/${session.databaseName}`);

        const user = await PrismaClientManager.runInContext(dbUrl, async () => {
            return this.prisma.user.findFirst({
                where: { email: 'admin@merocms.test' },
                include: { role: true },
            });
        });

        if (!user) {
             throw new UnauthorizedException('Demo admin account not found in sandbox.');
        }

        const loginResult = await this.authService.login(user, false, dbUrl);
        return {
            ...loginResult,
            sessionId,
            dbUrl,
        };
    }

    /**
     * Automatically logs in the demo admin account (Master DB).
     * Only available when DEMO_MODE=true.
     */
    async autoLogin() {
        if (process.env.DEMO_MODE !== 'true' && process.env.NODE_ENV !== 'development') {
            throw new UnauthorizedException('Auto-login only available in demo mode');
        }

        // Find the demo admin account seeded during setup
        const user = await this.prisma.user.findFirst({
            where: { email: 'admin@merocms.test' },
            include: { role: true },
        });

        if (!user) {
            throw new UnauthorizedException('Demo admin account not found. Please ensure the site was setup with demo content.');
        }

        return this.authService.login(user);
    }

    async getStatus() {
        const nextReset = await this.prisma.setting.findUnique({
            where: { key: 'demo_next_reset' }
        });

        return {
            demoMode: process.env.DEMO_MODE === 'true',
            nextResetAt: nextReset?.value || null,
            branch: process.env.DEMO_BRANCH || 'stable'
        };
    }
}
