import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

type MemberRow = {
  id: string
  pnw?: {
    id?: number
    nation_name?: string
    leader_name?: string
    num_cities?: number
    last_active?: string
    vacation_mode_turns?: number
    beige_turns?: number
    color?: string
  } | null
  pnwApiKey?: string | null
}

export default function MembershipModule() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<'nation'|'leader'|'cities'|'last_active'|'vacation'|'beige'|'color'|'verified'>('nation')
  const [dir, setDir] = useState<'asc'|'desc'>('asc')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!alliance) return
    fetchList()
  }, [alliance])

  async function fetchList() {
    setLoading(true)
    try {
      const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members`)
      const j = await r.json()
      if (j.ok) {
        const combined = [...j.verified, ...j.notVerified]
        setMembers(combined)
      }
    } finally { setLoading(false) }
  }

  function getSortValue(m: any, key: typeof order) {
    const pnw = m.pnw || {}
    switch (key) {
      case 'nation': return String(pnw.nation_name || '').toLowerCase()
      case 'leader': return String(pnw.leader_name || '').toLowerCase()
      case 'cities': return Number(pnw.num_cities ?? -1)
      case 'last_active': return pnw.last_active ? new Date(pnw.last_active).getTime() : -1
      case 'vacation': return Number(pnw.vacation_mode_turns ?? -1)
      case 'beige': return Number(pnw.beige_turns ?? -1)
      case 'color': return String(pnw.color || '').toLowerCase()
      case 'verified': return m.pnwApiKey ? 1 : 0
      default: return String(pnw.nation_name || '').toLowerCase()
    }
  }

  function sortedFiltered() {
    const q = query.trim().toLowerCase()
    let rows = members.filter(m => {
      if (!q) return true
      const pnw = m.pnw || {}
      return (String(pnw.nation_name || '') + ' ' + String(pnw.leader_name || '')).toLowerCase().includes(q)
    })

    rows = rows.slice() // copy
    rows.sort((a: any, b: any) => {
      const va = getSortValue(a, order)
      const vb = getSortValue(b, order)
      if (typeof va === 'number' && typeof vb === 'number') return va - vb
      if (va < vb) return -1
      if (va > vb) return 1
      return 0
    })
    if (dir === 'desc') rows = rows.reverse()
    return rows
  }

  if (!alliance) return <div>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>Membership</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ marginRight: 8 }}>Sort</label>
          <select value={order} onChange={(e) => setOrder(e.target.value as any)}>
            <option value="nation">Nation (A–Z)</option>
            <option value="leader">Leader (A–Z)</option>
            <option value="cities">Cities (low→high)</option>
            <option value="last_active">Last Active (old→new)</option>
            <option value="vacation">Vacation Turns (low→high)</option>
            <option value="beige">Beige Turns (low→high)</option>
            <option value="color">Color</option>
            <option value="verified">Verified</option>
          </select>
          <label style={{ marginLeft: 12 }}>Direction</label>
          <select value={dir} onChange={(e) => setDir(e.target.value as any)}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <input placeholder="Search nation or leader" value={query} onChange={(e) => setQuery(e.target.value)} style={{ padding: 8, borderRadius: 8 }} />
        </div>
      </div>

      <div className="members-panel" style={{ padding: 12 }}>
    {loading ? <div>Loading…</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Nation</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Leader</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Cities</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Vacation</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Beige</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Color</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Last Active</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Verified</th>
              </tr>
            </thead>
            <tbody>
      {sortedFiltered().map((m: any) => (
                <tr key={m.id}>
                  <td style={{ padding: 8 }}>{m.pnw?.nation_name || '—'}</td>
                  <td style={{ padding: 8 }}>{m.pnw?.leader_name || '—'}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{m.pnw?.num_cities ?? '—'}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{m.pnw?.vacation_mode_turns ?? '—'}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{m.pnw?.beige_turns ?? '—'}</td>
                  <td style={{ padding: 8 }}>{m.pnw?.color ?? '—'}</td>
                  <td style={{ padding: 8 }}>{m.pnw?.last_active ? new Date(m.pnw.last_active).toLocaleString() : '—'}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{m.pnwApiKey ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
