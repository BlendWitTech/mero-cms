import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DemoModeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        if (process.env.DEMO_MODE !== 'true') {
            throw new ForbiddenException('This action is only available in demo mode');
        }
        return true;
    }
}
