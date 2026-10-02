# PQRS Domain Microservice

Domain microservice responsible for:
- Managing PQRS requests lifecycle (CRUD operations).
- Ingesting incoming tickets and executing AI-driven triage (categorization, urgency detection, and summarization using Groq).
- Persisting state with PostgreSQL through Prisma ORM.

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `DATABASE_URL`, `JWT_SECRET`, and `GROQ_API_KEY` are properly defined.
`JWT_SECRET` must match the Auth Service value. The frontend sends the JWT returned by
the Auth Service in `Authorization: Bearer <token>` when calling this service.

### 3. Apply Database Migrations
```bash
npx prisma migrate dev --name init_tickets
```

### 4. Run the Service
```bash
# Development mode
npm run start:dev
```

- **API Endpoint:** `http://localhost:8002/api/v1/tickets`
- **Swagger Documentation:** `http://localhost:8002/docs`

### Authorization

All ticket endpoints require `Authorization: Bearer <token>`. The Auth Service
issues the JWT and this service validates it locally with the same `JWT_SECRET`.
Regular users can create and read their own tickets. Only `ADMIN` users can
list all tickets or update ticket status.

The triage worker uses BullMQ with Redis. RabbitMQ is not required by the
current implementation.
