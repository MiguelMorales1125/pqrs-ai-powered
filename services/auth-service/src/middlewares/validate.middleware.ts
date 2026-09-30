import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http.error';

type ClassType<T> = new (...args: any[]) => T;

export function validateBody<T extends object>(dtoClass: ClassType<T>) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const dto = plainToInstance(dtoClass, req.body ?? {});
        const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

        if (errors.length > 0) {
            const details = errors.flatMap((e) => Object.values(e.constraints ?? {}));
            return next(HttpError.badRequest('Validation failed', details));
        }

        req.body = dto;
        next();
    };
}
