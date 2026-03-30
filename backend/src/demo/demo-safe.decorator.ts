import { SetMetadata } from '@nestjs/common';

export const DEMO_SAFE_KEY = 'demoSafe';

/**
 * Mark an endpoint as safe in demo mode — DemoGuard will allow it
 * even if it would normally be blocked (e.g. the demo-reset endpoint itself).
 */
export const DemoSafe = () => SetMetadata(DEMO_SAFE_KEY, true);
