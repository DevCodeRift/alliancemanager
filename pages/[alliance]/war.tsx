import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import RaidAlerts from '../../src/ui/RaidAlerts'

export default function WarModule() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [info, setInfo] = useState<any | null>(null)

  useEffect(() => { if (!alliance) return; (async () => { const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}`); const j = await r.json(); if (j.ok) setInfo(j.alliance) })() }, [alliance])
  if (!alliance) return <div>Loading…</div>
  const allowed = !!(info?.modules && info.modules.war) || !!info?.whitelisted
  return (
    <div style={{ padding: 24 }}>
      <h2>War Module</h2>
      {!allowed ? (
        <div className="members-panel">This module is locked for your alliance.</div>
      ) : (
        <div>
          <RaidAlerts alliance={String(alliance)} />
          <div className="members-panel">
            <h3>Additional War Tools</h3>
            <p>More war tools and reports will appear here in future updates.</p>
          </div>
        </div>
      )}
    </div>
  )
}
