import { applyDecorators, UseGuards } from '@nestjs/common';
import { DemoModeGuard } from './demo-mode.guard';

export function DemoSafe() {
    return applyDecorators(UseGuards(DemoModeGuard));
}
