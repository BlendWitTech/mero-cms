import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DemoService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Finds the first Admin user and issues a short-lived JWT.
     * No password required — this endpoint is only reachable when DEMO_MODE=true.
     */
    async autoLogin() {
        const adminRole = await (this.prisma as any).role.findFirst({
            where: { name: { in: ['Admin', 'SuperAdmin', 'Super Admin'] } },
        });
        const user = await (this.prisma as any).user.findFirst({
            where: adminRole ? { roleId: adminRole.id } : {},
            include: { role: true },
        });
        if (!user) throw new Error('No admin user found in demo database');

        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role?.name,
            forcePasswordChange: false,
        };
        return { access_token: this.jwtService.sign(payload, { expiresIn: '2h' }) };
    }
}
