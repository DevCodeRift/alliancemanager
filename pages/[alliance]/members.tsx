import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function MembersPage() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [data, setData] = useState<any | null>(null)
  const [popLoading, setPopLoading] = useState(false)
  const [popResult, setPopResult] = useState<any | null>(null)
  const [popKey, setPopKey] = useState('')
  const [order, setOrder] = useState<'name' | 'position' | 'cities'>('name')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [membersLoading, setMembersLoading] = useState(false)

  useEffect(() => {
    if (!alliance) return
    ;(async () => {
      setMembersLoading(true)
      try {
        const q = new URLSearchParams({ order: order === 'name' ? '' : order, dir })
        const res = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members?${q.toString()}`)
        const j = await res.json()
        if (j.ok) setData(j)
      } finally {
        setMembersLoading(false)
      }
    })()
  }, [alliance])

  async function handlePopulate() {
    setPopLoading(true)
    setPopResult(null)
    try {
      const res = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/populate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: popKey || undefined }),
      })
      const j = await res.json()
      setPopResult(j)
      // refresh members
      const r2 = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members`)
      const j2 = await r2.json()
      if (j2.ok) setData(j2)
    } catch (e) {
      setPopResult({ ok: false, message: String(e) })
    } finally {
      setPopLoading(false)
    }
  }

  if (!alliance) return <div>Loading…</div>

  return (
    <div className="members-container">
      <div className="members-header">
        <div>
          <div className="members-title">{alliance} members</div>
          <div className="members-sub">Manage membership and verification for this alliance</div>
        </div>
        <div style={{ marginLeft: 'auto' }} className="count-badge">Total: {((data?.verified?.length ?? 0) + (data?.notVerified?.length ?? 0))}</div>
      </div>

      <div className="members-controls">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Order</label>
          <select value={order} onChange={(e) => setOrder(e.target.value as any)} style={{ padding: 8, borderRadius: 8 }}>
            <option value="name">Name</option>
            <option value="position">Alliance Position</option>
            <option value="cities">City Count</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Direction</label>
          <select value={dir} onChange={(e) => setDir(e.target.value as any)} style={{ padding: 8, borderRadius: 8 }}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <input placeholder="Optional PnW API key (for position/cities sorting)" value={popKey} onChange={(e) => setPopKey(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8 }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="discord-btn" onClick={async () => {
            setMembersLoading(true)
            try {
              const params = new URLSearchParams()
              if (order !== 'name') params.set('order', order)
              params.set('dir', dir)
              if (popKey) params.set('apiKey', popKey)
              const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members?${params.toString()}`)
              const j = await r.json()
              if (j.ok) setData(j)
            } finally { setMembersLoading(false) }
          }}>{membersLoading ? 'Loading…' : 'Refresh'}</button>
          <button className="discord-btn" onClick={handlePopulate} disabled={popLoading}>{popLoading ? 'Populating…' : 'Populate members'}</button>
        </div>
      </div>

      <div className="members-columns">
        <div className="members-column members-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 800 }}>Verified</div>
            <div className="count-badge">{data?.verified?.length ?? 0}</div>
          </div>
          {data?.verified?.length ? (
            <ul className="member-list">
              {data.verified.map((u: any) => (
                <li key={u.id} className="member-card">
                  <div className="member-info">
                    <div>
                      <div className="member-name">{u.name ?? u.email}</div>
                      <div className="member-meta">{u.pnw?.leader_name ? `${u.pnw?.leader_name} — ${u.pnw?.nation_name}` : ''}</div>
                      {u.pnw?.alliance_position_info?.name && <div className="member-meta">Position: {u.pnw?.alliance_position_info?.name}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {u.pnw && <div className="badge">{order === 'cities' ? `${u.pnw?.num_cities} cities` : (u.pnw?.alliance_position_info?.name || u.pnw?.alliance_position_id || '—')}</div>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>No verified members</div>
          )}
        </div>

        <div className="members-column members-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 800 }}>Not Verified</div>
            <div className="count-badge">{data?.notVerified?.length ?? 0}</div>
          </div>
          {data?.notVerified?.length ? (
            <ul className="member-list">
              {data.notVerified.map((u: any) => (
                <li key={u.id} className="member-card">
                  <div>
                    <div className="member-name">{u.name ?? u.email}</div>
                    <div className="member-meta">{u.pnw?.leader_name ? `${u.pnw?.leader_name} — ${u.pnw?.nation_name}` : ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>No unverified members</div>
          )}
        </div>
      </div>
    </div>
  )
}
