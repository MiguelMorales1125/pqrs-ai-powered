import type { SessionUser } from '../auth/session.ts'
import { authRequest } from './client.ts'

type LoginResponse = {
  accessToken: string
  user: SessionUser
}

export function login(email: string, password: string) {
  return authRequest<LoginResponse>('/api/v1/auth/login', { email, password })
}
