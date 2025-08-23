import { useState } from 'react'

export default function Signup({ onSwap, onSuccess }: { onSwap?: () => void; onSuccess?: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    try { (window as any).__am_setTheme?.('light') } catch {}
    alert('UI-only signup: ' + email)
    onSuccess?.()
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-header">
        <div className="auth-logo">AM</div>
        <div>
          <div className="auth-title">Create account</div>
          <div className="auth-sub">Join your alliance's OS</div>
        </div>
      </div>

      <label>Display name
        <input value={name} placeholder="Commander" onChange={(e) => setName((e.target as HTMLInputElement).value)} />
      </label>
      <label>Email
        <input value={email} placeholder="you@alliance.example" onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
      </label>
      <label>Password
        <input type="password" placeholder="Choose a secure password" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} />
      </label>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }} />
        <div className="auth-actions">
          <button type="button" onClick={onSwap}>Have account? Sign in</button>
          <button type="submit">Create account</button>
        </div>
      </div>
    </form>
  )
}
