# Authentication Microservice

Independent service responsible for user identity, authentication, credential validation, and JWT token issuance.

**Stack:** Node.js + Express 5 + TypeScript, Prisma (PostgreSQL `auth_db`), bcrypt, JWT.

## Setup

```bash
cd services/auth-service
cp .env.example .env          # adjust values
npm install
npm run prisma:generate
npm run prisma:deploy         # apply migrations (use prisma:migrate while developing)
npm run seed                  # optional: creates the ADMIN user from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                   # http://localhost:8001
```

Production: `npm run build && npm start`.

## Endpoints

All routes are prefixed with `/api/v1` (except `/health`).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | – | Health check |
| POST | `/auth/register` | – | Register a user (`{ email, password }`, min 8 chars). Always created with role `USER` |
| POST | `/auth/login` | – | Returns `{ accessToken, tokenType, expiresIn, user }` |
| GET | `/auth/me` | Bearer | Current user profile |
| GET | `/auth/verify` | Bearer | Validates a token and returns its payload (for other services) |
| GET | `/users` | ADMIN | List users |
| GET | `/users/:id` | ADMIN | Get user by id |
| PATCH | `/users/:id/role` | ADMIN | Change role (`{ role: "USER" \| "ADMIN" }`) |

JWT payload: `{ sub: userId, email, role }`, signed with `JWT_SECRET` / `JWT_ALGORITHM`, valid for `ACCESS_TOKEN_EXPIRE_MINUTES`.
Other services can validate tokens locally with the same `JWT_SECRET`, or call `GET /api/v1/auth/verify`.

Errors follow the same shape as the PQRS service:

```json
{ "code": "AUTH.UNAUTHORIZED", "message": "Invalid email or password", "details": null, "traceId": "req_..." }
```
