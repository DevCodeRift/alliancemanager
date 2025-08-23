import { signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function Login() {
  const { data: session, status } = useSession()
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [nations, setNations] = useState<any[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // nothing for now; could fetch user's linked status from a /api/user endpoint
  }, [])

  if (status === 'loading') {
    return <div className="auth-card">Loading…</div>
  }

  if (session?.user) {
    async function handleLink() {
      setLoading(true)
      setMessage(null)
      setNations(null)
      try {
        const res = await fetch('/api/pnw/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
        })
        const json = await res.json()
        if (!res.ok) {
          setMessage(json?.message || 'Failed to link key')
        } else {
          setNations(json.nations || [])
          setMessage('Linked successfully')
        }
      } catch (e: any) {
        setMessage(e?.message || 'Network error')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">AM</div>
          <div>
            <div className="auth-title">Welcome back</div>
            <div className="auth-sub">Signed in as</div>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center', fontWeight: 700 }}>{session.user.name || session.user.email}</div>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 12 }}>Link your Politics & War account (API key found at Account → API Key)</div>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="pnw API key"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'inherit' }}
            />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button className="discord-btn" onClick={handleLink} disabled={loading || !apiKey}>
              {loading ? 'Linking…' : 'Link'}
            </button>
            <button style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: 6 }} onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button>
          </div>
          {message && <div style={{ marginTop: 8, fontSize: 13 }}>{message}</div>}

          {nations && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Nation</div>
              {nations.length === 0 && <div>No nation data returned.</div>}
              {nations.map((n: any) => (
                <div key={n.id} style={{ padding: 8, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ fontWeight: 800 }}>{n.nation_name} (ID: {n.id})</div>
                  <div>Leader: {n.leader_name}</div>
                  <div>Alliance ID: {n.alliance_id ?? '—'}</div>
                  <div>Score: {n.score ?? '—'}</div>
                  <div>Last Active: {n.last_active ?? '—'}</div>
                </div>
              ))}
            </div>
          )}
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
