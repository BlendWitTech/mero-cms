import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClientManager } from './prisma-client-manager';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor(private manager: PrismaClientManager) {}

  // Explicit getters for each model to ensure stability and correct context
  get user() { 
    console.log('[PrismaService] Accessing user model');
    return this.manager.getClient().user; 
  }
  get role() { return this.manager.getClient().role; }
  get setting() { return this.manager.getClient().setting; }
  get demoSession() { return (this.manager.getClient() as any).demoSession; }
  get post() { return this.manager.getClient().post; }
  get category() { return this.manager.getClient().category; }
  get tag() { return this.manager.getClient().tag; }
  get comment() { return (this.manager.getClient() as any).comment; }
  get media() { return this.manager.getClient().media; }
  get collection() { return this.manager.getClient().collection; }
  get collectionItem() { return this.manager.getClient().collectionItem; }
  get form() { return this.manager.getClient().form; }
  get formSubmission() { return this.manager.getClient().formSubmission; }
  get page() { return this.manager.getClient().page; }
  get menu() { return (this.manager.getClient() as any).menu; }
  get menuItem() { return (this.manager.getClient() as any).menuItem; }
  get lead() { return (this.manager.getClient() as any).lead; }
  get service() { return (this.manager.getClient() as any).service; }
  get teamMember() { return (this.manager.getClient() as any).teamMember; }
  get testimonial() { return (this.manager.getClient() as any).testimonial; }
  get activityLog() { return this.manager.getClient().activityLog; }
  get analyticsConfig() { return this.manager.getClient().analyticsConfig; }
  get webhook() { return this.manager.getClient().webhook; }
  get redirect() { return this.manager.getClient().redirect; }
  get robotsTxt() { return this.manager.getClient().robotsTxt; }
  get seoMeta() { return this.manager.getClient().seoMeta; }
  get notification() { return this.manager.getClient().notification; }
  get design() { return (this.manager.getClient() as any).design; }
  get invitation() { return this.manager.getClient().invitation; }
  get package() { return (this.manager.getClient() as any).package; }
  get apiKey() { return (this.manager.getClient() as any).apiKey; }
  get refreshToken() { return (this.manager.getClient() as any).refreshToken; }

  // Delegate core Prisma methods
  $connect() { return this.manager.getClient().$connect(); }
  $disconnect() { return this.manager.getClient().$disconnect(); }
  $queryRaw(q: any) { return (this.manager.getClient() as any).$queryRaw(q); }
  $executeRaw(q: any) { return (this.manager.getClient() as any).$executeRaw(q); }
  $transaction(args: any) { return (this.manager.getClient() as any).$transaction(args); }

  async onModuleInit() {
    // Master client will be initialized when first accessed
  }

  async onModuleDestroy() {
    await this.manager.onModuleDestroy();
  }
}
