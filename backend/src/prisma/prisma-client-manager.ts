import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class PrismaClientManager implements OnModuleDestroy {
  private clients: Map<string, PrismaClient> = new Map();
  private static als = new AsyncLocalStorage<{ dbUrl?: string }>();

  /**
   * Run a function within a demo database context.
   */
  static runInContext<T>(dbUrl: string, fn: () => T): T {
    return this.als.run({ dbUrl }, fn);
  }

  /**
   * Get the current database URL from AsyncLocalStorage.
   */
  static getContextUrl(): string | undefined {
    return this.als.getStore()?.dbUrl;
  }

  /**
   * Get a PrismaClient for the current context (standard or demo).
   */
  getClient(): PrismaClient {
    const url = PrismaClientManager.getContextUrl();
    
    // Default client (Master DB)
    if (!url || url === process.env.DATABASE_URL) {
      return this.getMasterClient();
    }

    // Cached demo client
    if (this.clients.has(url)) {
      return this.clients.get(url)!;
    }

    // New demo client
    const client = new PrismaClient({
      datasources: {
        db: { url },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    this.clients.set(url, client);
    return client;
  }

  private masterClient: PrismaClient | null = null;
  private getMasterClient(): PrismaClient {
    if (!this.masterClient) {
      this.masterClient = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return this.masterClient;
  }

  async onModuleDestroy() {
    // Close all clients on shutdown
    const all = Array.from(this.clients.values());
    if (this.masterClient) all.push(this.masterClient);
    
    await Promise.all(all.map((c) => c.$disconnect()));
  }
}
