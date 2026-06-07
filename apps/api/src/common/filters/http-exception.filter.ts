import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@docgen/shared';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    if (status >= 500) {
      const err = exception instanceof Error ? exception : undefined;
      this.logger.error(
        [
          'Unhandled server error',
          `method=${request.method}`,
          `route=${request.originalUrl ?? request.url}`,
          `body=${this.safeJson(request.body)}`,
          `message=${err?.message ?? String(exception)}`,
          `stack=${err?.stack ?? 'No stack trace available'}`,
        ].join('\n'),
      );
    }

    const body: ApiResponse<null> = {
      data: null,
      error: {
        type: `https://httpstatuses.io/${status}`,
        title: message,
        status,
        detail: exception instanceof HttpException
          ? JSON.stringify(exception.getResponse())
          : undefined,
        instance: request.url,
      },
    };

    response.status(status).json(body);
  }

  private safeJson(value: unknown): string {
    try {
      return JSON.stringify(value, (_key, nested) => {
        if (typeof nested === 'string' && nested.length > 500) return `${nested.slice(0, 500)}...[truncated ${nested.length}]`;
        return nested;
      });
    } catch {
      return '[unserializable body]';
    }
  }
}
