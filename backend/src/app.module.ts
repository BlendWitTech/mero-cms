import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { TeamModule } from './team/team.module';
import { ServicesModule } from './services/services.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { LeadsModule } from './leads/leads.module';
import { PlotsModule } from './plots/plots.module';
import { PlotCategoriesModule } from './plot-categories/plot-categories.module';
import { PagesModule } from './pages/pages.module';
import { ThemesModule } from './themes/themes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksModule } from './tasks/tasks.module';
import { SetupModule } from './setup/setup.module';
import { PublicModule } from './public/public.module';
import { ModuleEnabledGuard } from './setup/module-enabled.guard';

/**
 * Read ENABLED_MODULES once at startup.
 * Format: comma-separated optional module keys, e.g. "blogs,plots,team"
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
    PublicModule,
    // Theme system and navigation are fundamental CMS infrastructure
    ThemesModule,
    MenusModule,
    PagesModule,

    // ── Optional modules — loaded only when ENABLED_MODULES contains the key ──

    // Blog ecosystem: enabling categories/tags/comments also loads BlogsModule
    // because those tables are bundled in blogs.prisma
    ...when('blogs', 'categories', 'tags', 'comments')(BlogsModule),
    ...when('blogs', 'categories')(CategoriesModule),
    ...when('blogs', 'tags')(TagsModule),
    ...when('blogs', 'comments')(CommentsModule),

    // Plots ecosystem: land plot listings
    ...when('plots', 'plot-categories')(PlotsModule),
    ...when('plots', 'plot-categories')(PlotCategoriesModule),

    ...when('team')(TeamModule),
    ...when('services')(ServicesModule),
    ...when('testimonials')(TestimonialsModule),
    ...when('leads')(LeadsModule),

    ...when('seo')(SeoMetaModule),
    ...when('redirects')(RedirectsModule),
    ...when('analytics')(AnalyticsModule),
    ...when('sitemap')(SitemapModule),
    ...when('robots')(RobotsModule),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ModuleEnabledGuard,
    },
  ],
})
export class AppModule { }
