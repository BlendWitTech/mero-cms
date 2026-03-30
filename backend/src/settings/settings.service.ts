import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class SettingsService {
    constructor(
        private prisma: PrismaService,
        private webhooksService: WebhooksService,
    ) { }

    async findAll() {
        const settings = await (this.prisma as any).setting.findMany();
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    }

    async update(key: string, value: string) {
        return (this.prisma as any).setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    async updateMany(settings: Record<string, string>) {
        const updates = Object.entries(settings).map(([key, value]) =>
            this.update(key, value),
        );
        const result = await Promise.all(updates);
        this.webhooksService.dispatch('settings.updated', { keys: Object.keys(settings) }).catch(() => { });
        return result;
    }

    async clearThemeCache() {
        const themeUrl = process.env.THEME_URL || 'http://localhost:3002';
        const secret = process.env.REVALIDATE_SECRET || '';
        const url = `${themeUrl}/api/revalidate`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: secret ? { 'x-revalidate-secret': secret } : {},
            });
            if (!res.ok) {
                const body = await res.text();
                throw new Error(`Theme responded with ${res.status}: ${body}`);
            }
            return { success: true, message: 'Theme cache cleared successfully.' };
        } catch (err: any) {
            throw new Error(`Failed to clear theme cache: ${err.message}`);
        }
    }
}
