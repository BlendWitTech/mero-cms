import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRE_MODULE_KEY } from './require-module.decorator';
import { CORE_MODULES } from './setup.service';

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
    private cache: { modules: string[]; expires: number } | null = null;

    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredModule = this.reflector.getAllAndOverride<string>(REQUIRE_MODULE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No module requirement = always pass (core modules, auth, etc.)
        if (!requiredModule) return true;

        // Core modules are always enabled
        if (CORE_MODULES.includes(requiredModule)) return true;

        const enabledModules = await this.getEnabledModules();

        if (!enabledModules.includes(requiredModule)) {
            throw new ForbiddenException(`Module "${requiredModule}" is not enabled on this CMS`);
        }

        return true;
    }

    private async getEnabledModules(): Promise<string[]> {
        const now = Date.now();
        if (this.cache && now < this.cache.expires) {
            return this.cache.modules;
        }

        const setting = await (this.prisma as any).setting.findUnique({
            where: { key: 'enabled_modules' },
        });

        const modules: string[] = setting ? JSON.parse(setting.value) : [...CORE_MODULES];
        this.cache = { modules, expires: now + 30_000 };
        return modules;
    }

    // Call this to invalidate cache after module list changes
    invalidateCache() {
        this.cache = null;
    }
}
