import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccessControlModule } from './auth/access-control.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { InvitationsModule } from './invitations/invitations.module';
import { RolesModule } from './roles/roles.module';
import { BlogsModule } from './blogs/blogs.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { CommentsModule } from './comments/comments.module';
import { MediaModule } from './media/media.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { MailModule } from './mail/mail.module';
import { SeoMetaModule } from './seo-meta/seo-meta.module';
import { RedirectsModule } from './redirects/redirects.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SitemapModule } from './sitemap/sitemap.module';
import { RobotsModule } from './robots/robots.module';
import { MenusModule } from './menus/menus.module';
import { PagesModule } from './pages/pages.module';
import { ThemesModule } from './themes/themes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksModule } from './tasks/tasks.module';
import { SetupModule } from './setup/setup.module';
import { DemoModule } from './demo/demo.module';
import { PublicModule } from './public/public.module';
import { CollectionsModule } from './collections/collections.module';
import { FormsModule } from './forms/forms.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ModuleEnabledGuard } from './setup/module-enabled.guard';
import { TierGuard } from './auth/tier.guard';
import { LicenseService } from './auth/license.service';
import { TeamModule } from './team/team.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { ServicesModule } from './services/services.module';
import { LeadsModule } from './leads/leads.module';
import { PackagesModule } from './packages/packages.module';
import { DemoContextMiddleware } from './demo/demo-context.middleware';
import { AiModule } from './ai/ai.module';
import { PaymentsModule } from './payments/payments.module';
import { ThemeEditorModule } from './theme-editor/theme-editor.module';
import { PluginsModule } from './plugins/plugins.module';
import { DownloadsModule } from './downloads/downloads.module';
import { ContentSchedulerModule } from './content-scheduler/content-scheduler.module';
import { ApiKeysModule } from './api-keys/api-keys.module';


/**
 * Read ENABLED_MODULES once at startup.
 * Format: comma-separated optional module keys, e.g. "blogs,team,services"
 * Core modules (auth, users, roles, settings, media, etc.) are always loaded.
 *
 * Selective loading only applies when BOTH:
 *   - SETUP_COMPLETE=true  (setup wizard has run)
 *   - ENABLED_MODULES is non-empty (modules were explicitly selected)
 *
 * In dev / unconfigured state, ALL modules load so nothing breaks.
 */
const SETUP_COMPLETE = process.env.SETUP_COMPLETE === 'true';
const rawEnabled = (process.env.ENABLED_MODULES || '').trim();
const USE_SELECTIVE = SETUP_COMPLETE && rawEnabled.length > 0;

const ENABLED = new Set(
  rawEnabled.split(',').map(s => s.trim()).filter(Boolean),
);

/** Returns the modules array only when the key is enabled (or when not in selective mode). */
function when(...keys: string[]) {
  return (...mods: any[]): any[] => {
    if (!USE_SELECTIVE) return mods;
    return keys.some(k => ENABLED.has(k)) ? mods : [];
  };
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Global rate limit — catches unauthenticated attackers. Authenticated
    // read endpoints (/settings, /auth/profile, /public/site-data, etc.) are
    // polled frequently by the admin middleware + SettingsContext + theme
    // RSC, so the global cap has to leave room for legitimate usage. More
    // aggressive per-endpoint limits live as @Throttle overrides on login,
    // 2FA, register, forgot-password, reset-password, /ai/generate, etc.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    // ── Core modules — always loaded ──────────────────────────────────────────
    PrismaModule,
    UsersModule,
    AccessControlModule,
    AuthModule,
    RolesModule,
    SettingsModule,
    MediaModule,
    InvitationsModule,
    AuditLogModule,
    MailModule,
    NotificationsModule,
    TasksModule,
    SetupModule,
    DemoModule,
    PublicModule,
    PackagesModule,
    AiModule,
    PaymentsModule,
    DownloadsModule,
    // Theme system and navigation are fundamental CMS infrastructure
    ThemesModule,
    ThemeEditorModule,
    PluginsModule,
    ApiKeysModule,
    ContentSchedulerModule,
    MenusModule,
    PagesModule,
    CollectionsModule,
    WebhooksModule,
    ...when('forms')(FormsModule),

    // ── Optional modules — loaded only when ENABLED_MODULES contains the key ──

    // Blog ecosystem: enabling categories/tags/comments also loads BlogsModule
    // because those tables are bundled in blogs.prisma
    ...when('blogs', 'categories', 'tags', 'comments')(BlogsModule),
    ...when('blogs', 'categories')(CategoriesModule),
    ...when('blogs', 'tags')(TagsModule),
    ...when('blogs', 'comments')(CommentsModule),

    // Theme-specific and specialized content modules have been removed from the core
    // to keep the base CMS lightweight and truly modular.

    ...when('seo')(SeoMetaModule),
    ...when('redirects')(RedirectsModule),
    ...when('analytics')(AnalyticsModule),
    ...when('sitemap')(SitemapModule),
    ...when('robots')(RobotsModule),

    // Theme-related content modules
    ...when('team')(TeamModule),
    ...when('testimonials')(TestimonialsModule),
    ...when('services')(ServicesModule),
    ...when('leads')(LeadsModule),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LicenseService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: TierGuard },
    { provide: APP_GUARD, useClass: ModuleEnabledGuard },
  ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(DemoContextMiddleware)
            .forRoutes('*');
    }
}
