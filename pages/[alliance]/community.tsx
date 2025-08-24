import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function CommunityModule() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [info, setInfo] = useState<any | null>(null)

  useEffect(() => { if (!alliance) return; (async () => { const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}`); const j = await r.json(); if (j.ok) setInfo(j.alliance) })() }, [alliance])
  if (!alliance) return <div>Loading…</div>
  return (
    <div style={{ padding: 24 }}>
      <h2>Community Module</h2>
      <div className="members-panel">Community features: forums, chats, announcements.</div>
    </div>
  )
}
