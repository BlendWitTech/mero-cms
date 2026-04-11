import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class DemoService {
    constructor(
        private prisma: PrismaService,
        private authService: AuthService,
    ) {}

    /**
     * Automatically logs in the demo admin account.
     * Only available when DEMO_MODE=true.
     */
    async autoLogin() {
        if (process.env.DEMO_MODE !== 'true') {
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
}
