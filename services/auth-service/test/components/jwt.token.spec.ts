import jwt from 'jsonwebtoken';
import { JwtToken } from '../../src/components/jwt.token';

const payload = { sub: 'user-id', email: 'juan@test.com', role: 'USER' };

describe('JwtToken', () => {
    it('exposes the expiration in seconds from ACCESS_TOKEN_EXPIRE_MINUTES', () => {
        expect(JwtToken.expiresInSeconds).toBe(3600);
    });

    it('signs a token that verifies back to the same payload', () => {
        const token = JwtToken.sign(payload);

        expect(JwtToken.verify(token)).toEqual(payload);
    });

    it('sets the exp claim according to the configured lifetime', () => {
        const token = JwtToken.sign(payload);
        const decoded = jwt.decode(token) as jwt.JwtPayload;

        expect(decoded.exp! - decoded.iat!).toBe(3600);
    });

    it('rejects a token signed with another secret', () => {
        const forged = jwt.sign(payload, 'another_secret', { algorithm: 'HS256' });

        expect(() => JwtToken.verify(forged)).toThrow();
    });

    it('rejects an expired token', () => {
        const expired = jwt.sign(payload, 'test_jwt_secret', { algorithm: 'HS256', expiresIn: -10 });

        expect(() => JwtToken.verify(expired)).toThrow(jwt.TokenExpiredError);
    });

    it('rejects a token signed with a non-allowed algorithm', () => {
        const hs512 = jwt.sign(payload, 'test_jwt_secret', { algorithm: 'HS512' });

        expect(() => JwtToken.verify(hs512)).toThrow();
    });

    it('rejects a malformed token', () => {
        expect(() => JwtToken.verify('not-a-jwt')).toThrow();
    });
});
