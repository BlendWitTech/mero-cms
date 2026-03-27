import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[Prisma] Successfully connected to database.');
    } catch (error: any) {
      console.error('[Prisma] Failed to connect to database on startup:');
      console.error(error.message);
      // We don't rethrow here to allow the app to boot and show errors in logs
      // instead of a generic 502/crash during NestJS initialization.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
// Note: If tsc still complains about missing properties,
// we might need to cast to 'any' in services using it,
// or ensure the generated client is in the correct node_modules.
