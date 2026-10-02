# Frontend

React and Vite client for registration, login, and PQRS ticket management.

## Local setup

The Auth Service should run on port `8001` and the PQRS Service on port `8002`.

```bash
npm ci
npm run dev
```

The API URLs are configured through `.env`:

```env
VITE_AUTH_API_URL=http://localhost:8001
VITE_PQRS_API_URL=http://localhost:8002
```

If these variables are not provided, the client uses the local URLs above.

After login, the client stores the access token in the session and sends it to the PQRS
Service as an `Authorization: Bearer <token>` header.

## Build

```bash
npm run build
```
