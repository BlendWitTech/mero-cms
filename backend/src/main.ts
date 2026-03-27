import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    // e.g. "mero-cms-frontend" will allow any URL containing that string on .vercel.app
    const vercelProject = (process.env.CORS_VERCEL_PROJECT || '').trim();

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // server-to-server / curl
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (vercelProject && origin.endsWith('.vercel.app') && origin.includes(vercelProject)) {
          return callback(null, true);
        }
        console.warn(`[CORS] Request from unauthorized origin: ${origin}`);
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
    
    console.log(`[Server] Initialization complete. Listening on port ${process.env.PORT ?? 3001}`);
    await app.listen(process.env.PORT ?? 3001);
  } catch (error: any) {
    console.error(`[Server] Bootstrap failed: ${error.message}`);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}
bootstrap();
