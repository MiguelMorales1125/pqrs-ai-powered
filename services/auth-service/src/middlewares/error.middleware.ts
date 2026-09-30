import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http.error';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
    next(HttpError.notFound(`Cannot ${req.method} ${req.path}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
    if (res.headersSent) {
        return;
    }

    let status = 500;
    let code = 'INTERNAL.UNEXPECTED';
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (err instanceof HttpError) {
        ({ status, code, message, details } = err);
    } else if (err instanceof SyntaxError && 'body' in err) {
        status = 400;
        code = 'HTTP.BAD_REQUEST';
        message = 'Malformed JSON body';
    } else if (err instanceof Error) {
        console.error(`[Unhandled Exception] ${err.message}`, err.stack);
    }

    const traceId = (req.headers['x-request-id'] as string) || `req_${randomUUID()}`;
    res.setHeader('X-Request-ID', traceId);

    res.status(status).json({ code, message, details, traceId });
}
