export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message);
    }

    static badRequest(message: string, details?: unknown) {
        return new HttpError(400, 'VALIDATION.FAILED', message, details);
    }

    static unauthorized(message = 'Unauthorized') {
        return new HttpError(401, 'AUTH.UNAUTHORIZED', message);
    }

    static forbidden(message = 'Forbidden') {
        return new HttpError(403, 'AUTH.FORBIDDEN', message);
    }

    static notFound(message = 'Resource not found') {
        return new HttpError(404, 'HTTP.NOT_FOUND', message);
    }

    static conflict(message: string) {
        return new HttpError(409, 'HTTP.CONFLICT', message);
    }
}
