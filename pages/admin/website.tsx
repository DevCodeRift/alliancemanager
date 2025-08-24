import { useEffect, useState } from 'react'

export default function WebsiteAdmin() {
  const [alliances, setAlliances] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const r = await fetch('/api/debug/alliances')
        const j = await r.json()
        if (j.ok) setAlliances(j.alliances)
      } finally { setLoading(false) }
    })()
  }, [])

  async function toggleWhitelist(slug: string, value: boolean) {
    await fetch(`/api/alliance/${encodeURIComponent(slug)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setWhitelist', whitelisted: value }) })
    setAlliances((s) => s.map(a => a.slug === slug ? { ...a, whitelisted: value } : a))
  }

  async function setModules(slug: string, modules: any) {
    await fetch(`/api/alliance/${encodeURIComponent(slug)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setModules', modules }) })
    setAlliances((s) => s.map(a => a.slug === slug ? { ...a, modules } : a))
  }

  const moduleKeys = ['war','membership','economy','administrative','recruitment','training','community']

  return (
    <div style={{ padding: 24 }}>
      <h2>Website Administration</h2>
      <p>Manage whitelist and module grants for alliances.</p>
      <div style={{ marginTop: 12 }}>
        {loading ? 'Loading…' : (
          <div style={{ display: 'grid', gap: 12 }}>
            {alliances.map(a => (
              <div key={a.slug} className="members-panel" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{a.name} <span style={{ color: 'var(--muted)' }}>({a.slug})</span></div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>PNW ID: {String(a.pnwAllianceId || '')}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ color: 'var(--muted)' }}>Whitelist</label>
                  <input type="checkbox" checked={!!a.whitelisted} onChange={(e) => toggleWhitelist(a.slug, e.target.checked)} />
                  <div style={{ width: 8 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    {moduleKeys.map(k => (
                      <label key={k} style={{ fontSize: 12, color: 'var(--muted)' }}>
                        <input type="checkbox" checked={!!(a.modules && a.modules[k])} onChange={(e) => {
                          const next = { ...(a.modules || {}), [k]: e.target.checked }
                          setModules(a.slug, next)
                        }} /> {k}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
