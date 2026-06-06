import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayProxyHandler } from 'aws-lambda';
import express from 'express';
import { AppModule } from './app.module';

let cachedServer: ReturnType<typeof serverlessExpress>;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new (await import('./common/filters/http-exception.filter')).AllExceptionsFilter());
  app.useGlobalInterceptors(new (await import('./common/interceptors/response.interceptor')).ResponseInterceptor());
  app.enableCors();

  await app.init();
  cachedServer = serverlessExpress({ app: expressApp });
  return cachedServer;
}

export const authHandler: APIGatewayProxyHandler = async (event, context) => {
  const server = await bootstrap();
  return server(event, context, () => undefined) as any;
};

export const templatesHandler: APIGatewayProxyHandler = async (event, context) => {
  const server = await bootstrap();
  return server(event, context, () => undefined) as any;
};

export const documentsHandler: APIGatewayProxyHandler = async (event, context) => {
  const server = await bootstrap();
  return server(event, context, () => undefined) as any;
};

export const billingHandler: APIGatewayProxyHandler = async (event, context) => {
  const server = await bootstrap();
  return server(event, context, () => undefined) as any;
};
