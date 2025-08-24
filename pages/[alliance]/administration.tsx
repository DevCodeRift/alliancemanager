import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

export default function AllianceAdministration() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const { data: session } = useSession()
  const [info, setInfo] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!alliance) return
    ;(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}`)
        const j = await r.json()
        if (j.ok) setInfo(j.alliance)
      } finally { setLoading(false) }
    })()
  }, [alliance])

  if (!alliance) return <div>Loading…</div>

  const isOwner = info?.owner?.email && session?.user?.email && info.owner.email === session.user.email

  async function setModules(modules: any) {
    await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setModules', modules }) })
    setInfo((s: any) => ({ ...s, modules }))
  }

  const moduleKeys = ['war','membership','economy','administrative','recruitment','training','community']

  return (
    <div style={{ padding: 24 }}>
      <h2>{info?.name ?? alliance} administration</h2>
      <p style={{ color: 'var(--muted)' }}>Manage which modules your alliance can use.</p>

      <div style={{ marginTop: 12 }}>
        <div className="members-panel" style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>Module access</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Toggle modules below. Only the alliance owner may change these.</div>
            </div>
            {!isOwner && <div style={{ color: 'var(--muted)' }}>You are not the owner</div>}
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {moduleKeys.map(k => (
              <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>{k}</div>
                <input type="checkbox" disabled={!isOwner} checked={!!(info?.modules && info.modules[k])} onChange={(e) => {
                  const next = { ...(info?.modules || {}), [k]: e.target.checked }
                  setModules(next)
                }} />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
