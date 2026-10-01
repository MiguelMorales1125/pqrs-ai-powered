import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
    sub: string;
    email: string;
    role: string;
}

export class JwtToken {
    public static get expiresInSeconds(): number {
        return env.accessTokenExpireMinutes * 60;
    }

    public static sign(payload: TokenPayload): string {
        return jwt.sign(payload, env.jwtSecret, {
            algorithm: env.jwtAlgorithm,
            expiresIn: JwtToken.expiresInSeconds,
        });
    }

    public static verify(token: string): TokenPayload {
        const decoded = jwt.verify(token, env.jwtSecret, {
            algorithms: [env.jwtAlgorithm],
        }) as JwtPayload;

        return {
            sub: decoded.sub as string,
            email: decoded.email,
            role: decoded.role,
        };
    }
}
