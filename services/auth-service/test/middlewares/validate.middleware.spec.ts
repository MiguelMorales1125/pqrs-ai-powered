import 'reflect-metadata';
import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '../../src/dto/create.user.dto';
import { UpdateRoleDto } from '../../src/dto/update.role.dto';
import { HttpError } from '../../src/errors/http.error';
import { validateBody } from '../../src/middlewares/validate.middleware';

async function run(dto: new () => object, body: unknown) {
    const req = { body } as Request;
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await validateBody(dto)(req, {} as Response, next);
    return { req, err: next.mock.calls[0][0] as unknown as HttpError | undefined };
}

describe('validateBody middleware', () => {
    it('accepts a valid body and replaces req.body with a DTO instance', async () => {
        const { req, err } = await run(CreateUserDto, { email: 'juan@test.com', password: 'password123' });

        expect(err).toBeUndefined();
        expect(req.body).toBeInstanceOf(CreateUserDto);
    });

    it('rejects an invalid email and a short password with details', async () => {
        const { err } = await run(CreateUserDto, { email: 'bad', password: '123' });

        expect(err).toBeInstanceOf(HttpError);
        expect(err!.status).toBe(400);
        expect(err!.code).toBe('VALIDATION.FAILED');
        expect(err!.details).toEqual(
            expect.arrayContaining([
                'email must be an email',
                'password must be longer than or equal to 8 characters',
            ]),
        );
    });

    it('rejects passwords longer than 72 characters (bcrypt limit)', async () => {
        const { err } = await run(CreateUserDto, { email: 'juan@test.com', password: 'a'.repeat(73) });

        expect(err!.status).toBe(400);
    });

    it('rejects unknown properties such as role on register', async () => {
        const { err } = await run(CreateUserDto, { email: 'juan@test.com', password: 'password123', role: 'ADMIN' });

        expect(err!.details).toContain('property role should not exist');
    });

    it('treats a missing body as empty and reports required fields', async () => {
        const { err } = await run(CreateUserDto, undefined);

        expect(err!.status).toBe(400);
    });

    it('only accepts known roles', async () => {
        expect((await run(UpdateRoleDto, { role: 'ADMIN' })).err).toBeUndefined();
        expect((await run(UpdateRoleDto, { role: 'GOD' })).err!.status).toBe(400);
    });
});
