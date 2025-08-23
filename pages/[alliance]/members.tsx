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
    <div style={{ padding: 24 }}>
      <h2>{alliance} members</h2>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ marginRight: 8 }}>
              <label style={{ fontSize: 13, marginRight: 6 }}>Order:</label>
              <select value={order} onChange={(e) => setOrder(e.target.value as any)} style={{ padding: 6, borderRadius: 6 }}>
                <option value="name">Name</option>
                <option value="position">Alliance Position</option>
                <option value="cities">City Count</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, marginRight: 6 }}>Direction:</label>
              <select value={dir} onChange={(e) => setDir(e.target.value as any)} style={{ padding: 6, borderRadius: 6 }}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <input placeholder="Optional PnW API key (for position/cities sorting)" value={popKey} onChange={(e) => setPopKey(e.target.value)} style={{ width: 360, padding: 8, borderRadius: 6 }} />
              <button className="discord-btn" onClick={async () => {
                // refresh members with ordering
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

          <div style={{ marginBottom: 12 }}>
            {popResult && <div style={{ fontSize: 13 }}>{JSON.stringify(popResult)}</div>}
          </div>

          <h3>Verified ({data?.verified?.length ?? 0})</h3>
          {data?.verified?.length ? (
            <ul style={{ columns: 2 }}>{data.verified.map((u: any) => (
              <li key={u.id} style={{ marginBottom: 6 }}>
                <strong>{u.name ?? u.email}</strong>
                {u.pnw?.leader_name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{u.pnw?.leader_name} — {u.pnw?.nation_name}</div>}
                {u.pnw && order === 'position' && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Position ID: {u.pnw?.alliance_position_id}</div>}
                {u.pnw && order === 'cities' && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Cities: {u.pnw?.num_cities}</div>}
              </li>
            ))}</ul>
          ) : (
            <div>No verified members</div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Not Verified ({data?.notVerified?.length ?? 0})</h3>
          {data?.notVerified?.length ? (
            <ul style={{ columns: 2 }}>{data.notVerified.map((u: any) => (
              <li key={u.id} style={{ marginBottom: 6 }}>
                <strong>{u.name ?? u.email}</strong>
                {u.pnw?.leader_name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{u.pnw?.leader_name} — {u.pnw?.nation_name}</div>}
              </li>
            ))}</ul>
          ) : (
            <div>No unverified members</div>
          )}
        </div>
      </div>
    </div>
  )
}
