import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

function saveRawBody(req: Request & { rawBody?: Buffer }, _res: Response, buffer: Buffer) {
  if (buffer?.length) req.rawBody = Buffer.from(buffer);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: '10mb', verify: saveRawBody }));
  app.use(urlencoded({ limit: '10mb', extended: true, verify: saveRawBody }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableCors({ origin: '*' });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap();
