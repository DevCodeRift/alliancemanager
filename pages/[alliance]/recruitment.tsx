import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function RecruitmentModule() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [info, setInfo] = useState<any | null>(null)

  useEffect(() => { if (!alliance) return; (async () => { const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}`); const j = await r.json(); if (j.ok) setInfo(j.alliance) })() }, [alliance])
  if (!alliance) return <div>Loading…</div>
  const allowed = !!(info?.modules && info.modules.recruitment) || !!info?.whitelisted
  return (
    <div style={{ padding: 24 }}>
      <h2>Recruitment Module</h2>
      {!allowed ? <div className="members-panel">This module is locked for your alliance.</div> : <div className="members-panel">Recruitment pipelines and adverts will appear here.</div>}
    </div>
  )
}
