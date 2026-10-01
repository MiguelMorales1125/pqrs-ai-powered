import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL.UNEXPECTED';
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        code = (res as any).error ? `HTTP.${(res as any).error.toUpperCase().replace(/\s+/g, '_')}` : `HTTP.${status}`;
        if (status === 400 && Array.isArray((res as any).message)) {
          code = 'VALIDATION.FAILED';
          details = (res as any).message;
          message = 'Validation failed';
        }
      } else if (typeof res === 'string') {
        message = res;
        code = `HTTP.${status}`;
      }
    } else if (exception instanceof Error) {
      console.error(`[Unhandled Exception] ${exception.message}`, exception.stack);
    }

    const traceId = (request as any).id || (request.headers['x-request-id'] as string) || `req_${randomUUID()}`;
    response.setHeader('X-Request-ID', traceId);

    response.status(status).json({
      code,
      message,
      details,
      traceId,
    });
  }
}
