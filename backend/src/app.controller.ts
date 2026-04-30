import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

const BOOT_TIME = Date.now();

let cachedVersion: string | undefined;
function readVersion(): string {
  if (cachedVersion) return cachedVersion;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
    cachedVersion = String(pkg.version ?? '0.0.0');
  } catch {
    cachedVersion = 'unknown';
  }
  return cachedVersion;
}

type CheckStatus = 'pass' | 'fail';
interface HealthCheck {
  status: CheckStatus;
  latencyMs?: number;
  message?: string;
}

interface HealthReport {
  status: 'ok' | 'degraded';
  uptimeSec: number;
  version: string;
  nodeVersion: string;
  timestamp: string;
  checks: {
    database: HealthCheck;
    uploads: HealthCheck;
  };
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Liveness probe — cheap, no external deps. Use for load-balancer health
   * routing. Returns 200 if the process is up, 503 if the event loop is
   * wedged (we never actually return anything except 200 here; the absence
   * of a response is the signal).
   */
  @Get('health/live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /**
   * Readiness probe — checks DB connectivity + uploads dir. Returns 503 if
   * any check fails so orchestrators (Kubernetes, Railway, Render) can drain
   * traffic correctly.
   */
  @Get('health')
  async health(@Res({ passthrough: true }) res: Response): Promise<HealthReport> {
    const dbCheck = await this.checkDatabase();
    const uploadsCheck = this.checkUploads();

    const anyFail = dbCheck.status === 'fail' || uploadsCheck.status === 'fail';
    const status: HealthReport['status'] = anyFail ? 'degraded' : 'ok';

    if (anyFail) res.status(HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status,
      uptimeSec: Math.floor((Date.now() - BOOT_TIME) / 1000),
      version: readVersion(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck,
        uploads: uploadsCheck,
      },
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Lightweight no-op query that proves the connection is up and the
      // query engine is responsive. Prisma is typed, so cast to any.
      await (this.prisma as any).$queryRaw`SELECT 1`;
      return { status: 'pass', latencyMs: Date.now() - start };
    } catch (err: any) {
      return {
        status: 'fail',
        latencyMs: Date.now() - start,
        message: err?.message ?? 'Database query failed',
      };
    }
  }

  private checkUploads(): HealthCheck {
    const start = Date.now();
    const dir = path.join(process.cwd(), 'uploads');
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      // Write + delete a tiny file to confirm write permission.
      const probe = path.join(dir, `.health-${process.pid}.tmp`);
      fs.writeFileSync(probe, 'ok');
      fs.unlinkSync(probe);
      return { status: 'pass', latencyMs: Date.now() - start };
    } catch (err: any) {
      return {
        status: 'fail',
        latencyMs: Date.now() - start,
        message: err?.message ?? 'Uploads dir write failed',
      };
    }
  }
}
