import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AllianceHome() {
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

  const modules = [
    { key: 'war', title: 'War', desc: 'Situational awareness, battle plans, and war orders', path: `/[alliance]/war` },
    { key: 'membership', title: 'Membership', desc: 'Approve applicants, manage members, check verification', path: `/[alliance]/membership` },
    { key: 'economy', title: 'Economy', desc: 'Trade, treasury, resource tracking', path: `/[alliance]/economy` },
    { key: 'administrative', title: 'Administration', desc: 'Alliance settings, roles, and permissions', path: `/[alliance]/administration` },
    { key: 'recruitment', title: 'Recruitment', desc: 'Recruiting pipeline and adverts', path: `/[alliance]/recruitment` },
    { key: 'training', title: 'Training', desc: 'Guides, drills, and training schedules', path: `/[alliance]/training` },
    { key: 'community', title: 'Community', desc: 'Forums, announcements, and socials', path: `/[alliance]/community` },
  ]

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>{info?.name ?? alliance}</h2>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>{info?.description ?? ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>Modules</div>
          <div style={{ color: 'var(--muted)' }}>{info?.whitelisted ? 'Whitelist enabled' : 'Public'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {modules.map((m) => {
          const disabled = !info?.whitelisted && (m.key !== 'membership' && m.key !== 'community')
          return (
            <div key={m.key} className="members-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800 }}>{m.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{disabled ? 'Requires whitelist' : 'Available'}</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{m.desc}</div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href={m.path.replace('[alliance]', String(alliance))}>
                  <a className="discord-btn" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>{disabled ? 'Locked' : 'Open'}</a>
                </Link>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{m.key === 'membership' ? 'Members visible to all' : ''}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
