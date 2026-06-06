import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsageMiddleware } from './usage.middleware';

@Module({})
export class UsageModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UsageMiddleware).forRoutes('*');
  }
}
