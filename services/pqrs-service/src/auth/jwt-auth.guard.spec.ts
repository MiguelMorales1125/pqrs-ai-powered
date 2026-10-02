import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
} from './jwt-auth.guard';

function contextWithAuthorization(authorization?: string) {
  const request = {
    headers: { authorization },
  } as AuthenticatedRequest;

  return {
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext,
    request,
  };
}

describe('JwtAuthGuard', () => {
  it('rejects requests without a bearer token', () => {
    const guard = new JwtAuthGuard({} as JwtService);
    const { context } = contextWithAuthorization();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('attaches the verified token payload to the request', () => {
    const payload = {
      sub: 'user-1',
      email: 'user@example.com',
      role: 'USER',
    };
    const jwtService = {
      verify: jest.fn().mockReturnValue(payload),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);
    const { context, request } = contextWithAuthorization('Bearer token');

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual(payload);
  });

  it('rejects invalid or expired tokens', () => {
    const jwtService = {
      verify: jest.fn().mockImplementation(() => {
        throw new Error('invalid token');
      }),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);
    const { context } = contextWithAuthorization('Bearer token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
