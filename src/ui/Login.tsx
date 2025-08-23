export default function Login({ onSwap, onSuccess }: { onSwap?: () => void; onSuccess?: () => void }) {
  const handleSignIn = () => {
    // Redirect to NextAuth sign-in (Discord only provider configured on the server)
    const params = new URLSearchParams({ callbackUrl: '/' })
    // NextAuth sign-in endpoint
    window.location.href = `/api/auth/signin/discord?${params.toString()}`
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
        <button className="discord-btn" onClick={handleSignIn}>
          Sign in with Discord
        </button>
      </div>

      <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12 }}>
        <button type="button" onClick={onSwap} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>Create account</button>
      </div>
    </div>
  )
}
