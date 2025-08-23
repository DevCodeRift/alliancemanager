import { useState } from 'react'

export default function Login({ onSwap, onSuccess }: { onSwap?: () => void; onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // UI-only: apply a sample alliance theme when "logging in"
    try { (window as any).__am_setTheme?.('allianceCrimson') } catch {}
    alert('UI-only login: ' + email)
    onSuccess?.()
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-header">
        <div className="auth-logo">AM</div>
        <div>
          <div className="auth-title">Sign in</div>
          <div className="auth-sub">Access your alliance dashboard</div>
        </div>
      </div>

      <label>Email
        <input value={email} placeholder="you@alliance.example" onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
      </label>
      <label>Password
        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} />
      </label>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <label style={{ cursor: 'pointer' }}><input type="checkbox" style={{ marginRight: 6 }} /> Remember me</label>
        </div>
        <div className="auth-actions">
          <button type="button" onClick={onSwap}>Create account</button>
          <button type="submit">Sign in</button>
        </div>
      </div>
    </form>
  )
}
