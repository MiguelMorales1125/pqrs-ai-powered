import { useState, type FormEvent } from 'react'
import { ApiError } from './api/client.ts'
import { login } from './api/auth.ts'
import { clearSession, loadSession, saveSession, type Session } from './auth/session.ts'
import { TicketsView } from './tickets/TicketsView.tsx'

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError('Escribe un correo válido.')
      return
    }
    if (!password) {
      setError('Escribe tu contraseña.')
      return
    }

    setPending(true)
    setError('')
    try {
      const result = await login(nextEmail, password)
      const nextSession = { accessToken: result.accessToken, user: result.user }
      saveSession(nextSession)
      setSession(nextSession)
      setPassword('')
    } catch (caught) {
      setError(messageFor(caught))
    } finally {
      setPending(false)
    }
  }

  function logout() {
    clearSession()
    setSession(null)
  }

  return (
    <main className="grid min-h-svh place-items-center bg-stone-100 px-4 py-10 text-stone-900">
      {session ? (
        <TicketsView userId={session.user.id} email={session.user.email} onLogout={logout} />
      ) : (
        <section className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium tracking-wide text-teal-800">PQRS</p>
            <h1 className="mt-2 text-2xl font-semibold">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-stone-600">Entra con tu correo y contraseña.</p>
            <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
              <label className="block text-sm font-medium" htmlFor="email">
                Correo
                <input
                  id="email"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium" htmlFor="password">
                Contraseña
                <input
                  id="password"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error ? (
                <p id="login-error" className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                className="w-full rounded-lg bg-teal-800 px-3 py-2 font-medium text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
                type="submit"
                disabled={pending}
              >
                {pending ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
        </section>
      )}
    </main>
  )
}

function messageFor(caught: unknown) {
  if (caught instanceof ApiError && caught.message === 'Invalid email or password') {
    return 'Correo o contraseña incorrectos.'
  }
  if (caught instanceof ApiError) return caught.message
  return 'No se pudo iniciar sesión.'
}
