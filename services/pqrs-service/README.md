# PQRS Service

NestJS microservice responsible for the PQRS ticket lifecycle and asynchronous AI triage.

## Responsibilities

- Create and retrieve PQRS tickets.
- Persist ticket data in the `pqrs_db` PostgreSQL database.
- Enqueue triage jobs with BullMQ.
- Process triage jobs with Redis and Groq.
- Validate Auth Service JWTs at the API boundary.

## Local setup

```bash
npm ci
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

On Windows, copy `.env.example` to `.env` using File Explorer or PowerShell. Define
`DATABASE_URL`, `JWT_SECRET`, and `GROQ_API_KEY`. `JWT_SECRET` must be identical to the
value used by the Auth Service.

The API listens on `http://localhost:8002`. Swagger is available at
`http://localhost:8002/docs`.

## Authorization

Every ticket endpoint requires an `Authorization: Bearer <token>` header. The service
validates the token locally and derives the authenticated user from its `sub` claim.

- Regular users can create tickets and read their own tickets.
- Administrators can list all tickets.
- Administrators can update ticket status.
- A client-supplied `userId` is never trusted when creating a ticket.

## Redis and BullMQ

The service uses BullMQ with Redis for asynchronous triage. RabbitMQ is not part of the
current implementation. Redis is the queue backend required by BullMQ.

## Test and build

```bash
npm test
npm run build
```
