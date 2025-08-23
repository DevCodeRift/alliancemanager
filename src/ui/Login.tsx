import { signIn, signOut, useSession } from 'next-auth/react'

export default function Login() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="auth-card">Loading…</div>
  }

  if (session?.user) {
    return (
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">AM</div>
          <div>
            <div className="auth-title">Welcome back</div>
            <div className="auth-sub">Signed in as</div>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontWeight: 700 }}>{session.user.name || session.user.email}</div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="discord-btn" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">AM</div>
        <div>
          <div className="auth-title">Sign in with Discord</div>
          <div className="auth-sub">Only Discord login is allowed for this app</div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
        <button className="discord-btn" onClick={() => signIn('discord', { callbackUrl: '/' })}>
          Sign in with Discord
        </button>
      </div>
    </div>
  )
}
