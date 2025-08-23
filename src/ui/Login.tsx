import { signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function Login() {
  const { data: session, status } = useSession()
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<any | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // fetch user's linked status
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/user/me')
        const j = await res.json()
        if (!cancelled && j?.ok && j.user?.pnwLinked) {
          // indicate linked (user may still need to refresh details)
          setMessage('PnW key already linked')
        }
      } catch (e) {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (status === 'loading') {
    return <div className="auth-card">Loading…</div>
  }

  if (session?.user) {
        async function handleLink() {
      setLoading(true)
      setMessage(null)
          setDetails(null)
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
              setDetails(json.details || null)
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
          <div style={{ marginBottom: 8, fontSize: 12 }}>Link your Politics & War account by pasting the API key for your account (Account → API Key).</div>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your PnW API key (assigned to your nation)"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'inherit' }}
            />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button className="discord-btn" onClick={handleLink} disabled={loading || !apiKey}>
              {loading ? 'Linking…' : 'Link'}
            </button>
            <button style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: 6 }} onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button>
          </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="discord-btn" onClick={async () => {
                    const r = await fetch('/api/pnw/unlink', { method: 'POST' })
                    if (r.ok) {
                      setDetails(null)
                      setMessage('Unlinked')
                    } else {
                      setMessage('Failed to unlink')
                    }
                  }}>Unlink</button>
                </div>
          {message && <div style={{ marginTop: 8, fontSize: 13 }}>{message}</div>}

          {details && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Account details</div>
              <div style={{ padding: 8, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
                <div><strong>API key</strong>: {details.key ? `${details.key.slice(0,6)}...${details.key.slice(-4)}` : '—'}</div>
                <div><strong>Requests</strong>: {details.requests ?? '—'} / {details.max_requests ?? '—'}</div>
                <div><strong>Permission bits</strong>: {details.permission_bits ?? '—'}</div>
                <div style={{ marginTop: 8, fontWeight: 800 }}>{details.nation?.nation_name} (ID: {details.nation?.id})</div>
                <div>Leader: {details.nation?.leader_name}</div>
                <div>Alliance ID: {details.nation?.alliance_id ?? '—'}</div>
                <div>Score: {details.nation?.score ?? '—'}</div>
                <div>Last Active: {details.nation?.last_active ?? '—'}</div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>Resources</div>
                  <div>Money: {details.nation?.money ?? '—'}</div>
                  <div>Food: {details.nation?.food ?? '—'}</div>
                  <div>Steel: {details.nation?.steel ?? '—'}</div>
                  <div>Aluminum: {details.nation?.aluminum ?? '—'}</div>
                  <div>Gasoline: {details.nation?.gasoline ?? '—'}</div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>Cities ({details.nation?.num_cities ?? 0})</div>
                <div style={{ fontWeight: 700 }}>Cities ({details.nation?.num_cities ?? 0})</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {(details.nation?.cities || []).map((c: any) => (
                      <div key={c.id} style={{ padding: '4px 6px', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 4 }}>{c.id}</div>
                    ))}
                  </div>
                </div>
              </div>
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
