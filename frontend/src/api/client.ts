const baseUrl = (import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8001').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function authRequest<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servicio de autenticación')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(errorMessage(payload))
  }
  return payload as T
}

function errorMessage(payload: unknown) {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string' &&
    payload.message
  ) {
    return payload.message
  }
  return 'No se pudo iniciar sesión'
}
