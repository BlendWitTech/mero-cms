import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClientManager } from '../prisma/prisma-client-manager';

@Injectable()
export class DemoContextMiddleware implements NestMiddleware {
  constructor() {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      // Decode JWT payload without verification (safe for context switching, guards handle security)
      const payloadPart = token.split('.')[1];
      if (payloadPart) {
        const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
        
        // If the JWT contains a demoDbUrl, run the request in that database context
        if (payload && payload.demoDbUrl) {
          return PrismaClientManager.runInContext(payload.demoDbUrl, () => next());
        }
      }
    } catch (e) {
      // Ignore decode errors, let guards handle it
    }

    next();
  }
}
