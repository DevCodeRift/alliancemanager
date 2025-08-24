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
  const [debugOpen, setDebugOpen] = useState(false)
  const [apiJson, setApiJson] = useState<any | null>(null)

  useEffect(() => {
    if (!alliance) return
    ;(async () => {
      setMembersLoading(true)
      try {
        const params = new URLSearchParams()
        if (order !== 'name') params.set('order', order)
        params.set('dir', dir)
        const res = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members?${params.toString()}`)
        const j = await res.json()
        if (j.ok) setData(j)
      } finally {
        setMembersLoading(false)
      }
    })()
  }, [alliance, order, dir])

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
            // manual fetch for debugging the API
            try {
              const params = new URLSearchParams()
              if (order !== 'name') params.set('order', order)
              params.set('dir', dir)
              const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members?${params.toString()}`)
              const j = await r.json()
              setApiJson(j)
              setDebugOpen(true)
            } catch (e) {
              setApiJson({ ok: false, error: String(e) })
              setDebugOpen(true)
            }
          }}>Fetch API JSON</button>
          <button className="discord-btn" onClick={() => setDebugOpen((s) => !s)}>{debugOpen ? 'Hide debug' : 'Show raw data'}</button>
          <button className="discord-btn" onClick={async () => {
            setMembersLoading(true)
            try {
              if (popKey) {
                // call refresh to persist snapshots, then fetch members
                await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: popKey }) })
              }
              const params = new URLSearchParams()
              if (order !== 'name') params.set('order', order)
              params.set('dir', dir)
              const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members?${params.toString()}`)
              const j = await r.json()
              if (j.ok) setData(j)
            } finally { setMembersLoading(false) }
          }}>{membersLoading ? 'Loading…' : 'Refresh'}</button>
          <button className="discord-btn" onClick={async () => {
            // sync using logged-in user's linked PnW key (server will use stored key if available)
            setMembersLoading(true)
            try {
              await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
              const params = new URLSearchParams()
              if (order !== 'name') params.set('order', order)
              params.set('dir', dir)
              const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members?${params.toString()}`)
              const j = await r.json()
              if (j.ok) setData(j)
            } finally { setMembersLoading(false) }
          }}>Sync with my linked key</button>
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
              {data.verified.map((u: any) => {
                const p = u.pnw || {}
                const displayName = u.name || u.email || p.nation_name || p.leader_name || `PNW#${p.id ?? u.pnwNationId ?? 'unknown'}`
                const leader = p.leader_name || u.pnwLeaderName || ''
                const nation = p.nation_name || u.pnwNationName || ''
                const positionName = p.alliance_position_info?.name || p.alliance_position || u.pnwAlliancePositionName || null
                const seniority = p.alliance_seniority ?? p.seniority ?? u.pnwAllianceSeniority ?? null
                const lastActiveRaw = p.last_active ?? u.pnwLastActive ?? null
                let lastActiveDisplay: string | null = null
                try {
                  if (lastActiveRaw) {
                    const d = typeof lastActiveRaw === 'string' || typeof lastActiveRaw === 'number' ? new Date(lastActiveRaw) : null
                    if (d && !isNaN(d.getTime())) lastActiveDisplay = d.toLocaleString()
                  }
                } catch (e) {
                  lastActiveDisplay = null
                }
                const cities = p.num_cities ?? u.pnwNumCities ?? null
                return (
                  <li key={u.id} className="member-card">
        <div className="member-info">
                      <div>
                        <div className="member-name">{displayName}</div>
          <div className="member-meta">{leader ? `${leader} — ${nation}` : (nation || '')}</div>
          {u.assignedRoles?.length ? <div className="member-meta">Roles: {u.assignedRoles.join(', ')}</div> : null}
          {u.allianceRoleLabel ? <div className="member-meta">Alliance: {u.allianceRoleLabel}</div> : null}
                        {positionName && <div className="member-meta">Position: {positionName}</div>}
                        {seniority != null && <div className="member-meta">Seniority: {seniority}</div>}
                        {lastActiveDisplay && <div className="member-meta">Last active: {lastActiveDisplay}</div>}
                        {cities != null && <div className="member-meta">Cities: {cities}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="badge">{order === 'cities' ? `${cities ?? '—'} cities` : (positionName || (p.alliance_position_id ?? u.pnwAlliancePositionId) || '—')}</div>
                    </div>
                  </li>
                )
              })}
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
              {data.notVerified.map((u: any) => {
                const p = u.pnw || {}
                const displayName = u.name || u.email || p.nation_name || p.leader_name || `PNW#${p.id ?? u.pnwNationId ?? 'unknown'}`
                const leader = p.leader_name || u.pnwLeaderName || ''
                const nation = p.nation_name || u.pnwNationName || ''
                return (
                  <li key={u.id} className="member-card">
                    <div>
                          <div className="member-name">{displayName}</div>
                          <div className="member-meta">{leader ? `${leader} — ${nation}` : (nation || '')}</div>
                          {u.assignedRoles?.length ? <div className="member-meta">Roles: {u.assignedRoles.join(', ')}</div> : null}
                          {u.allianceRoleLabel ? <div className="member-meta">Alliance: {u.allianceRoleLabel}</div> : null}
                        </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div>No unverified members</div>
          )}
        </div>
      </div>
      {debugOpen && (
        <div style={{ marginTop: 18, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', fontSize: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Raw API JSON</div>
          <pre style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{apiJson ? JSON.stringify(apiJson, null, 2) : 'No JSON fetched yet'}</pre>
        </div>
      )}
    </div>
  )
}
