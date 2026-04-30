import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { MediaService } from './media/media.service';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Boot-time secret bootstrap. Reads `backend/secrets.json` (created on first
 * boot) and, for each required secret, populates `process.env.*` if not
 * already set. Any missing secret is auto-generated, written back to disk
 * with restrictive permissions, and used for this run.
 *
 * Why this matters
 *   • Customers buying a one-time CMS license shouldn't need to edit env
 *     files. The first `npm start` generates good secrets and never asks
 *     them to think about it again.
 *   • secrets.json lives outside the database (it's the database's auth
 *     secret) and outside source control (.gitignore should cover it).
 *   • Power users / Docker deployers can still set JWT_SECRET +
 *     WEBHOOK_SECRET_KEY via env vars and skip the file entirely.
 *
 * Previously this function refused to boot on missing secrets — that's
 * still the behavior if the disk is read-only and we can't write
 * secrets.json. Otherwise we self-heal.
 */
/**
 * Resolve the directory where boot-time persistent state lives.
 *
 * For local dev that's the backend root (`process.cwd()`). For Docker
 * deployments, set `MERO_DATA_DIR=/app/data` and mount a named volume
 * there — secrets.json and setup.json then survive container rebuilds
 * (otherwise every `docker compose up --build` regenerates JWT_SECRET
 * and invalidates every existing session).
 */
function meroDataDir(): string {
  const fromEnv = (process.env.MERO_DATA_DIR || '').trim();
  if (fromEnv) {
    try {
      if (!fs.existsSync(fromEnv)) fs.mkdirSync(fromEnv, { recursive: true });
    } catch (err: any) {
      console.warn(`[boot] Could not create MERO_DATA_DIR=${fromEnv}: ${err?.message}. Falling back to cwd.`);
      return process.cwd();
    }
    return fromEnv;
  }
  return process.cwd();
}

function bootstrapSecrets() {
  const secretsPath = join(meroDataDir(), 'secrets.json');
  let onDisk: Record<string, string> = {};

  // Load existing secrets.json if present.
  try {
    if (fs.existsSync(secretsPath)) {
      onDisk = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
    }
  } catch (err: any) {
    console.warn(`[secrets] Could not read ${secretsPath}: ${err?.message}. Will regenerate.`);
    onDisk = {};
  }

  const required = ['JWT_SECRET', 'WEBHOOK_SECRET_KEY'];
  let dirty = false;

  for (const key of required) {
    // Already set via env? Take that — env always wins.
    if (process.env[key] && process.env[key]!.length >= 16) continue;

    // Already in secrets.json? Hydrate process.env from it.
    if (onDisk[key] && onDisk[key].length >= 16) {
      process.env[key] = onDisk[key];
      continue;
    }

    // Generate a new 64-char hex (32 bytes) secret.
    const generated = crypto.randomBytes(32).toString('hex');
    process.env[key] = generated;
    onDisk[key] = generated;
    dirty = true;
    console.log(`[secrets] Generated ${key} and wrote to secrets.json`);
  }

  if (dirty) {
    try {
      fs.writeFileSync(secretsPath, JSON.stringify(onDisk, null, 2), { mode: 0o600 });
    } catch (err: any) {
      console.error(
        `[FATAL] Could not write ${secretsPath}: ${err?.message}.\n` +
        `Generated secrets won't persist across restarts. Either:\n` +
        `  1. Make the backend directory writable, or\n` +
        `  2. Set JWT_SECRET and WEBHOOK_SECRET_KEY via environment variables.\n`,
      );
      process.exit(1);
    }
  }
}

/**
 * Read setup.json (written by the setup wizard) and hydrate environment
 * variables from it. Lets customers complete first-run setup in the
 * browser without ever editing .env. Env-set values always win — the
 * file only fills in gaps.
 *
 * We also stamp `process.env._DATABASE_URL_SOURCE` with where the URL
 * came from ('env' | 'setup.json' | 'unset') so the setup wizard can
 * detect environment-driven deployments and skip the (then-redundant)
 * database step. This is the source of truth for "is the database
 * already configured outside the wizard?" — see SetupService.getStatus.
 */
function bootstrapSetupConfig() {
  // Capture state BEFORE we hydrate from setup.json, so we can tell
  // env-driven deployments (Docker, Railway, .env file) apart from
  // wizard-driven ones (setup.json written by the previous run).
  const envHadDbUrl = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

  const setupPath = join(meroDataDir(), 'setup.json');
  let cfg: any = null;
  if (fs.existsSync(setupPath)) {
    try {
      cfg = JSON.parse(fs.readFileSync(setupPath, 'utf-8'));
    } catch (err: any) {
      console.warn(`[setup] Could not parse setup.json: ${err?.message}. Continuing.`);
    }
  }

  if (cfg?.database?.url && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = cfg.database.url;
    console.log('[setup] Loaded DATABASE_URL from setup.json');
  }
  if (cfg?.licenseKey && !process.env.LICENSE_KEY) {
    process.env.LICENSE_KEY = cfg.licenseKey;
    console.log('[setup] Loaded LICENSE_KEY from setup.json');
  }
  if (cfg?.siteUrl && !process.env.NEXT_PUBLIC_SITE_URL) {
    process.env.NEXT_PUBLIC_SITE_URL = cfg.siteUrl;
  }

  // Stamp the source. Env wins if it was set before we touched
  // setup.json. Otherwise it's setup.json (wizard-managed) or unset.
  if (envHadDbUrl) {
    process.env._DATABASE_URL_SOURCE = 'env';
  } else if (process.env.DATABASE_URL) {
    process.env._DATABASE_URL_SOURCE = 'setup.json';
  } else {
    process.env._DATABASE_URL_SOURCE = 'unset';
  }
}

async function bootstrap() {
  bootstrapSetupConfig();
  bootstrapSecrets();

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

  // Body size limits. Kept tight because multipart file uploads go through
  // multer (FileInterceptor), NOT express.json — so lowering this ceiling
  // does not break media/theme uploads. 2 MB is still plenty of room for
  // rich-text page bodies, theme-editor saves, and nested form payloads;
  // 10 MB was just inviting JSON-bomb DoS.
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))  // strip trailing slashes
    .filter(Boolean);

  // Set CORS_VERCEL_PROJECT in Railway to allow all Vercel preview deployments
  // of a specific project. e.g. "mero-cms-saas-frontend" matches
  // mero-cms-saas-frontend.vercel.app and mero-cms-saas-frontend-git-*.vercel.app
  // but NOT evil-mero-cms-saas-frontend.vercel.app (the old includes() check
  // would have let that one through).
  const vercelProject = (process.env.CORS_VERCEL_PROJECT || '').trim();
  let vercelRegex: RegExp | null = null;
  if (vercelProject) {
    // Escape any regex meta chars the project name might legally contain.
    const escaped = vercelProject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Anchored: subdomain must START with the project name. Branch previews
    // arrive as "{project}-git-{branch}-{team}.vercel.app" and commit previews
    // as "{project}-{hash}-{team}.vercel.app"; both start with {project}.
    vercelRegex = new RegExp(`^https://${escaped}(-[a-z0-9-]+)?\\.vercel\\.app$`, 'i');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server / curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (vercelRegex && vercelRegex.test(origin)) return callback(null, true);
      callback(null, false); // 403 Forbidden — not allowed
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Allow cross-origin access so the admin frontend (port 3000) can load images served by the API (port 3001)
  const setCorp = (_req: any, res: any, next: any) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  };

  // PRIVATE uploads: served only when request carries a valid, non-expired
  // HMAC signature from MediaService.signPrivateUrl. Mounted BEFORE the
  // public /uploads handler so requests to /uploads/private/* never fall
  // through to the static serve. Path-traversal is blocked by requiring
  // the basename to match the filename component we signed.
  const privateUploadsPath = join(uploadsPath, 'private');
  try {
    if (!require('fs').existsSync(privateUploadsPath)) {
      require('fs').mkdirSync(privateUploadsPath, { recursive: true });
    }
  } catch (e: any) {
    console.error('Failed to prepare private uploads directory:', e.message);
  }
  app.use('/uploads/private', (req: any, res: any, next: any) => {
    const raw = (req.path || req.url || '').replace(/^\/+/, '');
    const basename = raw.split('?')[0].split('/')[0];
    if (!basename || basename.includes('..')) {
      return res.status(400).send('Bad request');
    }
    const ok = MediaService.verifyPrivateSignature(basename, req.query.exp, req.query.sig);
    if (!ok) return res.status(403).send('Forbidden');
    next();
  }, setCorp, express.static(privateUploadsPath));

  app.use('/uploads', setCorp, express.static(uploadsPath));

  const designsPath = join(process.cwd(), 'designs');
  app.use('/designs', setCorp, express.static(designsPath));

  // Serve built-in theme preview images from the project root themes/ directory
  const builtInThemesPath = join(process.cwd(), '..', 'themes');
  app.use('/themes-preview', setCorp, express.static(builtInThemesPath));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Swagger — only expose in non-production or when explicitly enabled.
  // In production SWAGGER_ENABLED mode, gate /api/docs behind HTTP basic auth
  // so an unauthenticated caller can't enumerate the full API surface.
  const isProd = process.env.NODE_ENV === 'production';
  const swaggerEnabled = !isProd || process.env.SWAGGER_ENABLED === 'true';
  const prodSwaggerUser = process.env.SWAGGER_USER;
  const prodSwaggerPass = process.env.SWAGGER_PASSWORD;

  if (swaggerEnabled && isProd && (!prodSwaggerUser || !prodSwaggerPass)) {
    console.warn(
      '[Swagger] SWAGGER_ENABLED=true in production but SWAGGER_USER / SWAGGER_PASSWORD are not set — NOT exposing /api/docs. Set both to turn it on.',
    );
  }

  const willMountSwagger = swaggerEnabled && (!isProd || (prodSwaggerUser && prodSwaggerPass));

  if (willMountSwagger) {
    if (isProd) {
      // Basic auth middleware for /api/docs only.
      app.use('/api/docs', (req: any, res: any, next: any) => {
        const auth = req.headers.authorization || '';
        const expected = 'Basic ' + Buffer.from(`${prodSwaggerUser}:${prodSwaggerPass}`).toString('base64');
        if (auth === expected) return next();
        res.setHeader('WWW-Authenticate', 'Basic realm="Mero CMS API Docs"');
        res.status(401).send('Authentication required');
      });
    }

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
