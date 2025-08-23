import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function MembersPage() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [data, setData] = useState<any | null>(null)
  const [popLoading, setPopLoading] = useState(false)
  const [popResult, setPopResult] = useState<any | null>(null)
  const [popKey, setPopKey] = useState('')

  useEffect(() => {
    if (!alliance) return
    ;(async () => {
      const res = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members`)
      const j = await res.json()
      if (j.ok) setData(j)
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
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6, fontSize: 13 }}>Populate alliance members from PnW (admin/owner only).</div>
            <input placeholder="Optional PnW API key (uses your key if blank)" value={popKey} onChange={(e) => setPopKey(e.target.value)} style={{ width: '60%', padding: 8, borderRadius: 6, marginRight: 8 }} />
            <button className="discord-btn" onClick={handlePopulate} disabled={popLoading} >{popLoading ? 'Populating…' : 'Populate members'}</button>
            {popResult && <div style={{ marginTop: 8, fontSize: 13 }}>{JSON.stringify(popResult)}</div>}
          </div>
          <h3>Verified</h3>
          {data?.verified?.length ? (
            <ul>{data.verified.map((u: any) => <li key={u.id}>{u.name ?? u.email}</li>)}</ul>
          ) : (
            <div>No verified members</div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Not Verified</h3>
          {data?.notVerified?.length ? (
            <ul>{data.notVerified.map((u: any) => <li key={u.id}>{u.name ?? u.email}</li>)}</ul>
          ) : (
            <div>No unverified members</div>
          )}
        </div>
      </div>
    </div>
  )
}
