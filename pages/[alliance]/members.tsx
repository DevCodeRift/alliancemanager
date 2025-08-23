import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function MembersPage() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    if (!alliance) return
    ;(async () => {
      const res = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}/members`)
      const j = await res.json()
      if (j.ok) setData(j)
    })()
  }, [alliance])

  if (!alliance) return <div>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>{alliance} members</h2>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
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
