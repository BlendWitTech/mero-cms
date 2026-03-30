import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- Security headers (Helmet) ---
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],   // Swagger UI needs inline
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Swagger iframes need this off
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  // Body size limits (prevent request flooding / large payload attacks)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global exception filter — strips stack traces in production
  app.useGlobalFilters(new GlobalExceptionFilter());

  const uploadsPath = join(process.cwd(), 'uploads');
  try {
    if (!require('fs').existsSync(uploadsPath)) {
      require('fs').mkdirSync(uploadsPath, { recursive: true });
    }
  } catch (e: any) {
    console.error('Failed to prepare uploads directory:', e.message);
  }

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))  // strip trailing slashes
    .filter(Boolean);

  // Set CORS_VERCEL_PROJECT in Railway to allow all Vercel preview deployments.
  // e.g. "blendwit-cms-saas-frontend" will allow any URL containing that string on .vercel.app
  const vercelProject = (process.env.CORS_VERCEL_PROJECT || '').trim();

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server / curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (vercelProject && origin.endsWith('.vercel.app') && origin.includes(vercelProject)) {
        return callback(null, true);
      }
      callback(null, false); // 403 Forbidden — not allowed
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use('/uploads', (req: any, res: any, next: any) => {
    next();
  }, express.static(uploadsPath));

  const designsPath = join(process.cwd(), 'designs');
  app.use('/designs', express.static(designsPath));

  // Serve built-in theme preview images from the project root themes/ directory
  const builtInThemesPath = join(process.cwd(), '..', 'themes');
  app.use('/themes-preview', express.static(builtInThemesPath));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Swagger — only expose in non-production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Mero CMS API')
      .setDescription('REST API for Mero CMS — admin and public endpoints')
      .setVersion('1.2.0')
      .addBearerAuth()
      .addTag('public', 'Public endpoints for themes (no auth required)')
      .addTag('auth', 'Authentication')
      .addTag('users', 'User management')
      .addTag('roles', 'Roles & permissions')
      .addTag('settings', 'Site settings')
      .addTag('media', 'Media library')
      .addTag('blogs', 'Blog posts')
      .addTag('categories', 'Blog categories')
      .addTag('tags', 'Blog tags')
      .addTag('comments', 'Post comments')
      .addTag('pages', 'Static pages')
      .addTag('menus', 'Navigation menus')
      .addTag('team', 'Team members')
      .addTag('services', 'Services')
      .addTag('testimonials', 'Testimonials')
      .addTag('leads', 'Lead capture')
      .addTag('collections', 'Custom content collections')
      .addTag('forms', 'Form builder & submissions')
      .addTag('themes', 'Theme management')
      .addTag('seo', 'SEO meta tags')
      .addTag('redirects', 'URL redirects')
      .addTag('analytics', 'Analytics')
      .addTag('sitemap', 'XML sitemap')
      .addTag('robots', 'Robots.txt')
      .addTag('notifications', 'Notifications')
      .addTag('audit-log', 'Audit log')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log(`[Swagger] API docs available at /api/docs`);
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
