import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function AllianceDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [info, setInfo] = useState<any | null>(null)

  useEffect(() => {
    if (!alliance) return
    ;(async () => {
      const res = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}`)
      const j = await res.json()
      if (j.ok) setInfo(j.alliance)
    })()
  }, [alliance])

  if (!alliance) return <div>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>{info?.name ?? alliance} dashboard</h2>
      <p>Whitelisted: {info?.whitelisted ? 'Yes' : 'No'}</p>
      <p>Owner: {info?.owner?.name ?? info?.owner?.email ?? 'Unassigned'}</p>

      <div style={{ marginTop: 20 }}>
        <h3>Your role</h3>
        <p>{session?.user ? `Signed in as ${session.user.name ?? session.user.email}` : 'Not signed in'}</p>
        <p>Alliance membership and role will be displayed here once linked.</p>
      </div>
    </div>
  )
}
