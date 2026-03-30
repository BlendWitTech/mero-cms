import { Controller, Get } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoSafe } from './demo-safe.decorator';

/**
 * Demo-only routes. This entire controller (and the DemoModule it belongs to)
 * is only loaded when DEMO_MODE=true.
 *
 * To remove demo features from a production build: delete src/demo/ entirely.
 */
@DemoSafe()
@Controller('auth')
export class DemoController {
    constructor(private demoService: DemoService) { }

    @Get('demo-login')
    demoLogin() {
        return this.demoService.autoLogin();
    }
}
