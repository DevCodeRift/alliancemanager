import { signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const { data: session, status } = useSession()
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<any | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pnwLinked, setPnwLinked] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // wait for an authenticated session to avoid 401 race
    if (status !== 'authenticated') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/user/me')
        const j = await res.json()
        if (!cancelled && j?.ok) {
          if (j.user?.pnwLinked) {
            setPnwLinked(true)
            setMessage('PnW key already linked')
            // If allianceSlug present, immediately redirect to members page using router
            if (j.user?.allianceSlug) {
              router.replace(`/${encodeURIComponent(j.user.allianceSlug)}/members`)
              return
            }
          }
        }
      } catch (e) {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [session?.user])

  if (status === 'loading') {
    return <div className="auth-card">Loading…</div>
  }

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
  setPnwLinked(true)
  setMessage('Linked successfully')
          // redirect to alliance members page: prefer returned allianceSlug
          if (json.allianceSlug) {
              router.replace(`/${encodeURIComponent(json.allianceSlug)}/members`)
            } else {
              // fallback: poll /api/user/me for a short time until the allianceSlug becomes available
              const start = Date.now()
              const timeout = 5000 // ms
              let redirected = false
              while (Date.now() - start < timeout && !redirected) {
                try {
                  // small delay
                  await new Promise((r) => setTimeout(r, 500))
                  const me = await fetch('/api/user/me')
                  const meJ = await me.json()
                  if (meJ?.ok && meJ.user?.allianceSlug) {
                    router.replace(`/${encodeURIComponent(meJ.user.allianceSlug)}/members`)
                    redirected = true
                  }
                } catch (e) {
                  // ignore and retry until timeout
                }
              }
              // if not redirected after timeout, remain on page and show success message
            }
      }
    } catch (e: any) {
      setMessage(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
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

          <div style={{ marginTop: 8 }}>
            {message && <div style={{ marginTop: 8, fontSize: 13 }}>{message}</div>}

            {details && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'rgba(0,255,150,0.08)', color: '#bfffcf', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>API Linked</div>
                  <div style={{ fontWeight: 800 }}>{details.nation?.nation_name} — {details.nation?.leader_name}</div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <button className="discord-btn" onClick={async () => {
                    const r = await fetch('/api/pnw/unlink', { method: 'POST' })
                    if (r.ok) {
                      setDetails(null)
                      setPnwLinked(false)
                      setMessage('Unlinked')
                    } else {
                      setMessage('Failed to unlink')
                    }
                  }}>Unlink</button>
                </div>
              </div>
            )}
          </div>
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
