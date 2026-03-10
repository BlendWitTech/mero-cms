import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsPath = join(process.cwd(), 'uploads');
  try {
    if (!require('fs').existsSync(uploadsPath)) {
      require('fs').mkdirSync(uploadsPath, { recursive: true });
    }
  } catch (e: any) {
    console.error('Failed to prepare uploads directory:', e.message);
  }

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002')
    .split(',')
    .map(o => o.trim());

  app.enableCors({
    origin: allowedOrigins,
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
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
