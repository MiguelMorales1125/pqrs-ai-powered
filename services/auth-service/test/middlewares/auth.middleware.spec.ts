import { NextFunction, Request, Response } from 'express';
import { JwtToken } from '../../src/components/jwt.token';
import { HttpError } from '../../src/errors/http.error';
import { authenticate, authorize } from '../../src/middlewares/auth.middleware';

function mockRequest(headers: Record<string, string> = {}, user?: Request['user']): Request {
    return { headers, user } as unknown as Request;
}

const res = {} as Response;

describe('authenticate middleware', () => {
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        next = jest.fn();
    });

    it('attaches the token payload to req.user for a valid Bearer token', () => {
        const payload = { sub: 'user-id', email: 'juan@test.com', role: 'USER' };
        const req = mockRequest({ authorization: `Bearer ${JwtToken.sign(payload)}` });

        authenticate(req, res, next);

        expect(req.user).toEqual(payload);
        expect(next).toHaveBeenCalledWith();
    });

    it('fails with 401 when the Authorization header is missing', () => {
        authenticate(mockRequest(), res, next);

        const err = next.mock.calls[0][0] as unknown as HttpError;
        expect(err).toBeInstanceOf(HttpError);
        expect(err.status).toBe(401);
        expect(err.message).toBe('Missing Bearer token');
    });

    it('fails with 401 when the scheme is not Bearer', () => {
        authenticate(mockRequest({ authorization: 'Basic abc' }), res, next);

        expect((next.mock.calls[0][0] as unknown as HttpError).status).toBe(401);
    });

    it('fails with 401 when the token is invalid', () => {
        authenticate(mockRequest({ authorization: 'Bearer invalid.token.here' }), res, next);

        const err = next.mock.calls[0][0] as unknown as HttpError;
        expect(err.status).toBe(401);
        expect(err.message).toBe('Invalid or expired token');
    });
});

describe('authorize middleware', () => {
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        next = jest.fn();
    });

    it('lets through a user with an allowed role', () => {
        const req = mockRequest({}, { sub: 'id', email: 'a@test.com', role: 'ADMIN' });

        authorize('ADMIN')(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('fails with 403 when the role is not allowed', () => {
        const req = mockRequest({}, { sub: 'id', email: 'a@test.com', role: 'USER' });

        authorize('ADMIN')(req, res, next);

        expect((next.mock.calls[0][0] as unknown as HttpError).status).toBe(403);
    });

    it('fails with 403 when there is no authenticated user', () => {
        authorize('ADMIN')(mockRequest(), res, next);

        expect((next.mock.calls[0][0] as unknown as HttpError).status).toBe(403);
    });
});
