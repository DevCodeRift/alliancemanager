import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

interface War {
  id: string
  pnwWarId: number
  attackerId: number
  defenderId: number
  attackerName: string
  defenderName: string
  warType: string
  isDefensive: boolean
  warStarted: string
  turnEnds?: string
  alerts: WarAlert[]
}

interface WarAlert {
  id: string
  alertType: string
  message: string
  isRead: boolean
  createdAt: string
}

interface RaidAlertsProps {
  alliance: string
}

export default function RaidAlerts({ alliance }: RaidAlertsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWars = async (sync = false) => {
    try {
      setLoading(true)
      setError(null)
      const url = `/api/alliance/${encodeURIComponent(alliance)}/wars${sync ? '?sync=true' : ''}`
      const response = await fetch(url)
      const result = await response.json()
      
      if (!result.ok) {
        throw new Error(result.message || 'Failed to fetch wars')
      }
      
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  const syncWars = async () => {
    setSyncing(true)
    await fetchWars(true)
  }

  useEffect(() => {
    if (alliance) {
      fetchWars()
    }
  }, [alliance])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`
    }
    return `${minutes}m ago`
  }

  if (loading && !data) {
    return (
      <div className="members-panel">
        <h3>⚔️ Raid Alerts</h3>
        <p>Loading war data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="members-panel">
        <h3>⚔️ Raid Alerts</h3>
        <p style={{ color: '#ff6b6b' }}>Error: {error}</p>
        <button 
          onClick={() => fetchWars()} 
          style={{ 
            marginTop: '10px', 
            padding: '6px 12px', 
            background: 'var(--accent)', 
            color: '#042018', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const raids = data?.raids || []
  const defensiveWars = data?.defensiveWars || []
  const alertCount = data?.alertCount || 0

  return (
    <div className="members-panel" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>
          ⚔️ Raid Alerts {alertCount > 0 && <span style={{ color: '#ff6b6b', fontSize: '14px' }}>({alertCount} new)</span>}
        </h3>
        <button 
          onClick={syncWars}
          disabled={syncing}
          style={{ 
            padding: '6px 12px', 
            background: syncing ? '#666' : 'var(--accent)', 
            color: syncing ? '#ccc' : '#042018', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: syncing ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {syncing ? 'Syncing...' : 'Sync Wars'}
        </button>
      </div>

      {raids.length === 0 && defensiveWars.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
          <p>✅ No defensive wars detected</p>
          <p style={{ fontSize: '14px' }}>Your alliance members are safe from attacks!</p>
        </div>
      ) : (
        <>
          {raids.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#ff6b6b', margin: '0 0 12px 0', fontSize: '16px' }}>
                🚨 Active Raids ({raids.length})
              </h4>
              {raids.map((war: War) => (
                <div 
                  key={war.id} 
                  style={{ 
                    background: 'rgba(255, 107, 107, 0.1)', 
                    border: '1px solid rgba(255, 107, 107, 0.3)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    marginBottom: '8px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#ff6b6b' }}>{war.defenderName}</strong>
                      <span style={{ color: 'var(--muted)' }}> is under attack by </span>
                      <strong>{war.attackerName}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {formatTimeAgo(war.warStarted)}
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                    War Type: {war.warType} • War ID: {war.pnwWarId}
                  </div>
                  {war.alerts.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      {war.alerts.map((alert: WarAlert) => (
                        <div 
                          key={alert.id} 
                          style={{ 
                            fontSize: '12px', 
                            color: alert.isRead ? 'var(--muted)' : 'var(--accent)',
                            fontWeight: alert.isRead ? 'normal' : 'bold'
                          }}
                        >
                          🔔 {alert.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {defensiveWars.filter((w: War) => w.warType !== 'RAID').length > 0 && (
            <div>
              <h4 style={{ color: '#ffd43b', margin: '0 0 12px 0', fontSize: '16px' }}>
                ⚡ Other Defensive Wars ({defensiveWars.filter((w: War) => w.warType !== 'RAID').length})
              </h4>
              {defensiveWars
                .filter((w: War) => w.warType !== 'RAID')
                .map((war: War) => (
                  <div 
                    key={war.id} 
                    style={{ 
                      background: 'rgba(255, 212, 59, 0.1)', 
                      border: '1px solid rgba(255, 212, 59, 0.3)', 
                      borderRadius: '8px', 
                      padding: '12px', 
                      marginBottom: '8px' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#ffd43b' }}>{war.defenderName}</strong>
                        <span style={{ color: 'var(--muted)' }}> vs </span>
                        <strong>{war.attackerName}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {formatTimeAgo(war.warStarted)}
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                      War Type: {war.warType} • War ID: {war.pnwWarId}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '16px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Total Wars: {data?.wars?.length || 0} • 
          Defensive: {defensiveWars.length} • 
          Raids: {raids.length} • 
          Alerts: {alertCount}
        </div>
      </div>
    </div>
  )
}
