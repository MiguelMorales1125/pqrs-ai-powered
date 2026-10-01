import { NextFunction, Request, Response } from 'express';
import { JwtToken, TokenPayload } from '../components/jwt.token';
import { HttpError } from '../errors/http.error';
import { Role } from '../models/user.model';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next(HttpError.unauthorized('Missing Bearer token'));
    }

    try {
        req.user = JwtToken.verify(header.slice('Bearer '.length).trim());
        next();
    } catch {
        next(HttpError.unauthorized('Invalid or expired token'));
    }
}

export function authorize(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role as Role)) {
            return next(HttpError.forbidden('Insufficient permissions'));
        }
        next();
    };
}
