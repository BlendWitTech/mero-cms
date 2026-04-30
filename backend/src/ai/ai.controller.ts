import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, PackageEnforcementGuard)
export class AiController {
    constructor(private readonly aiService: AiService) {}

    /**
     * Per-user rate limit on AI generation: 20 requests / 60s window.
     * AI calls hit a paid upstream (OpenAI/Anthropic) so an abusive caller
     * could otherwise run up a large bill. The package tier still caps
     * entitlement via RequireLimit — this is a second layer on top.
     */
    @Throttle({ default: { ttl: 60000, limit: 20 } })
    @Post('generate')
    @RequireLimit(PackageLimit.AI_STUDIO)
    async generate(@Body() data: { prompt: string; context?: string; preset?: string }) {
        const text = await this.aiService.generate(data.prompt, data.context, data.preset);
        return { text };
    }

    /**
     * Returns the preset catalogue the frontend renders in the AI Studio
     * picker. Gated behind AI_STUDIO so we don't even advertise presets to
     * users who can't use them.
     */
    @Get('templates')
    @RequireLimit(PackageLimit.AI_STUDIO)
    async listTemplates() {
        return this.aiService.listPresets();
    }
}
