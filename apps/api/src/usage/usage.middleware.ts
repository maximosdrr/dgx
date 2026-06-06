import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { UsageLog } from '../common/entities/usage-log.entity';
import { User } from '../common/entities/user.entity';

@Injectable()
export class UsageMiddleware implements NestMiddleware {
  constructor(private readonly em: EntityManager) {}

  async use(req: Request & { user?: { sub: string } }, _res: Response, next: NextFunction) {
    try {
      const em = this.em.fork();
      em.create(UsageLog, {
        endpoint: req.path,
        method: req.method,
        user: req.user?.sub ? em.getReference(User, req.user.sub) : undefined,
      });
      await em.flush();
    } catch {
      // Non-blocking
    }
    next();
  }
}
