import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DemoModeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const isDemoMode = process.env.DEMO_MODE === 'true';
        const isDev = process.env.NODE_ENV === 'development';
        if (!isDemoMode && !isDev) {
            throw new ForbiddenException('This action is only available in demo mode');
        }
        return true;
    }
}
