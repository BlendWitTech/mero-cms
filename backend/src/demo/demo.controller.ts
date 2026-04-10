import { Controller, Get, Post, Body } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoSafe } from './demo-safe.decorator';
import { Public } from '../auth/public.decorator';
import { PACKAGES } from '../config/packages';

@Controller('demo')
export class DemoController {
    constructor(private demoService: DemoService) {}

    /**
     * Simulation of starting a demo instance.
     * In this local environment, it simply returns the current instance URL 
     * and demo credentials for the requested package.
     */
    @Public()
    @DemoSafe()
    @Post('start')
    async startDemo(@Body() body: { packageId: string }) {
        const pkg = PACKAGES.find(p => p.id === body.packageId);
        
        // Return a mock demo session pointing to the current instance
        // In production, this would provision a clean container.
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

        return {
            instanceUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            sessionId: 'local-' + Math.random().toString(36).substring(7),
            expiresAt: expiresAt.toISOString(),
            demoCredentials: {
                adminEmail: 'admin@merocms.test',
                adminPassword: 'password123'
            },
            package: pkg
        };
    }

    /**
     * Returns a short-lived JWT for the demo admin user.
     * Only available when DEMO_MODE=true.
     */
    @Public()
    @DemoSafe()
    @Get('login')
    demoLogin() {
        return this.demoService.autoLogin();
    }
}
