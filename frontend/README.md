# Frontend

Cliente web para iniciar sesión contra el servicio de autenticación.

React, Vite, TypeScript y Tailwind.

## Arranque

El auth-service debe estar en el puerto 8001.

```bash
cd frontend
npm install
npm run dev
```

La URL del servicio está en `.env.example` (`VITE_AUTH_API_URL`). Si no copias ese archivo a `.env`, el cliente usa `http://localhost:8001`.
