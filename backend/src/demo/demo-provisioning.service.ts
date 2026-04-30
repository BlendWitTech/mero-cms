import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

import { PACKAGES } from '../config/packages';
import { PrismaClientManager } from '../prisma/prisma-client-manager';

const execAsync = promisify(exec);

@Injectable()
export class DemoProvisioningService {
  private readonly logger = new Logger(DemoProvisioningService.name);
  private readonly logDir = path.join(process.cwd(), 'debug_logs');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeDebugLog(sessionId: string, message: string) {
    const logPath = path.join(this.logDir, `provision_${sessionId}.log`);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
  }

  /**
   * Orchestrates the creation of a new demo sandbox.
   * This is a non-blocking background task.
   */
  async provision(sessionId: string, packageId?: string): Promise<void> {
    const dbName = `mero_demo_${sessionId.replace(/-/g, '_')}`;
    const masterUrl = process.env.DATABASE_URL!;
    const dbUrl = masterUrl.replace(/\/[^\/]+$/, `/${dbName}`);

    await this.prisma.demoSession.upsert({
        where: { id: sessionId },
        update: { databaseName: dbName, status: 'PROVISIONING', packageId },
        create: {
            id: sessionId,
            packageId,
            databaseName: dbName,
            status: 'PROVISIONING',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }
    });

    this.writeDebugLog(sessionId, `Provisioning started for ${dbName} (Package: ${packageId})`);
    
    // Background execution
    this.runProvisioningSteps(sessionId, dbName, dbUrl, packageId).catch(err => {
        this.writeDebugLog(sessionId, `FATAL ERROR: ${err.message}\n${err.stack}`);
    });
  }

  private async runProvisioningSteps(sessionId: string, dbName: string, dbUrl: string, packageId?: string) {
    try {
      // 1. Create DB
      this.writeDebugLog(sessionId, "Step 1: Creating database...");
      await this.updateStatus(sessionId, 'INFRA_READY');
      await this.createDatabase(dbName);
      this.writeDebugLog(sessionId, "Database created successfully.");

      // 2. Push Schema
      this.writeDebugLog(sessionId, "Step 2: Pushing schema (npx prisma db push)...");
      await this.updateStatus(sessionId, 'MIGRATING');
      
      const pushResult = await execAsync(`npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        cwd: process.cwd(),
      });
      this.writeDebugLog(sessionId, `Push STDOUT: ${pushResult.stdout}`);
      this.writeDebugLog(sessionId, `Push STDERR: ${pushResult.stderr}`);

      // 3. Seed Data
      this.writeDebugLog(sessionId, "Step 3: Seeding data (npx ts-node prisma/seed-demo.ts)...");
      await this.updateStatus(sessionId, 'SEEDING');
      
      const seedResult = await execAsync(`npx ts-node prisma/seed-demo.ts`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        cwd: process.cwd(),
      });
      this.writeDebugLog(sessionId, `Seed STDOUT: ${seedResult.stdout}`);
      this.writeDebugLog(sessionId, `Seed STDERR: ${seedResult.stderr}`);

      // 4. Apply Package Settings
      if (packageId) {
        this.writeDebugLog(sessionId, `Step 4: Applying package features for ${packageId}...`);
        const pkg = PACKAGES.find(p => p.id === packageId);
        if (pkg) {
          await PrismaClientManager.runInContext(dbUrl, async () => {
             // Update settings in the sandbox DB
             const settingsToUpdate = [
               { key: 'license_tier', value: pkg.tier.toString() },
               { key: 'ai_enabled', value: pkg.aiEnabled.toString() },
               { key: 'site_title', value: `Mero CMS Demo (${pkg.name})` },
               { key: 'support_level', value: pkg.supportLevel },
             ];

             for (const s of settingsToUpdate) {
               await this.prisma.setting.upsert({
                 where: { key: s.key },
                 update: { value: s.value },
                 create: s,
               });
             }
          });
          this.writeDebugLog(sessionId, "Package settings applied successfully.");
        }
      }

      // 5. Finalize
      await this.updateStatus(sessionId, 'READY');
      this.writeDebugLog(sessionId, "Provisioning COMPLETED successfully.");

    } catch (error) {
      this.writeDebugLog(sessionId, `ERROR during provisioning: ${error.message}\n${error.stack}`);
      await this.updateStatus(sessionId, 'FAILED');
      await this.dropDatabase(dbName).catch(() => {});
    }
  }

  private async updateStatus(id: string, status: string) {
    await this.prisma.demoSession.update({
        where: { id },
        data: { status }
    });
  }

  private async createDatabase(dbName: string) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      await client.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await client.end();
    }
  }

  async dropDatabase(dbName: string) {
    if (!/^[a-z0-9_]+$/.test(dbName)) {
      throw new Error(`Invalid database name: ${dbName}`);
    }
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(
        `SELECT pg_terminate_backend(pg_stat_activity.pid)
         FROM pg_stat_activity
         WHERE pg_stat_activity.datname = $1
           AND pid <> pg_backend_pid()`,
        [dbName],
      );
      await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    } finally {
      await client.end();
    }
  }
}
