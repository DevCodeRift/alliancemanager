import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function DiscordSettings() {
  const router = useRouter()
  const { alliance } = router.query as { alliance?: string }
  const [info, setInfo] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [discordConfig, setDiscordConfig] = useState({
    discordGuildId: '',
    discordRaidChannelId: '',
    discordGeneralChannelId: '',
    discordBotEnabled: false
  })

  useEffect(() => {
    if (!alliance) return
    ;(async () => {
      const r = await fetch(`/api/alliance/${encodeURIComponent(String(alliance))}`)
      const j = await r.json()
      if (j.ok) {
        setInfo(j.alliance)
        setDiscordConfig({
          discordGuildId: j.alliance.discordGuildId || '',
          discordRaidChannelId: j.alliance.discordRaidChannelId || '',
          discordGeneralChannelId: j.alliance.discordGeneralChannelId || '',
          discordBotEnabled: j.alliance.discordBotEnabled || false
        })
      }
    })()
  }, [alliance])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/alliance/${alliance}/discord`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordConfig)
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setMessage('✅ Discord settings saved successfully!')
      } else {
        setMessage(`❌ ${data.message || 'Failed to save settings'}`)
      }
    } catch (error) {
      setMessage('❌ Error saving Discord settings')
    } finally {
      setSaving(false)
    }
  }

  if (!alliance) return <div>Loading…</div>
  
  const allowed = !!info?.whitelisted // Only whitelisted alliances can use Discord bot
  
  return (
    <div style={{ padding: 24 }}>
      <h2>🤖 Discord Bot Settings</h2>
      
      {!allowed ? (
        <div className="members-panel">
          <h3>Discord Bot Access</h3>
          <p>The Discord bot feature is currently in beta and requires alliance whitelisting.</p>
          <p>Contact support to enable Discord bot features for your alliance.</p>
        </div>
      ) : (
        <div>
          {message && (
            <div className="members-panel" style={{ marginBottom: 16, backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da' }}>
              {message}
            </div>
          )}
          
          <div className="members-panel">
            <h3>Bot Configuration</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label>
                <input
                  type="checkbox"
                  checked={discordConfig.discordBotEnabled}
                  onChange={(e) => setDiscordConfig(prev => ({ ...prev, discordBotEnabled: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Enable Discord Bot for {info?.name}
              </label>
            </div>

            {discordConfig.discordBotEnabled && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Discord Server (Guild) ID:</label>
                  <input
                    type="text"
                    value={discordConfig.discordGuildId}
                    onChange={(e) => setDiscordConfig(prev => ({ ...prev, discordGuildId: e.target.value }))}
                    placeholder="123456789012345678"
                    style={{ width: '100%', padding: 8, fontSize: 14 }}
                  />
                  <small style={{ color: '#666' }}>The ID of your Discord server</small>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Raid Alert Channel ID:</label>
                  <input
                    type="text"
                    value={discordConfig.discordRaidChannelId}
                    onChange={(e) => setDiscordConfig(prev => ({ ...prev, discordRaidChannelId: e.target.value }))}
                    placeholder="123456789012345678"
                    style={{ width: '100%', padding: 8, fontSize: 14 }}
                  />
                  <small style={{ color: '#666' }}>Channel for raid alerts and war notifications</small>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>General Channel ID:</label>
                  <input
                    type="text"
                    value={discordConfig.discordGeneralChannelId}
                    onChange={(e) => setDiscordConfig(prev => ({ ...prev, discordGeneralChannelId: e.target.value }))}
                    placeholder="123456789012345678"
                    style={{ width: '100%', padding: 8, fontSize: 14 }}
                  />
                  <small style={{ color: '#666' }}>Channel for bot commands and general announcements</small>
                </div>
              </>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>

          <div className="members-panel" style={{ marginTop: 16 }}>
            <h3>📋 Setup Instructions</h3>
            
            <ol style={{ lineHeight: 1.6 }}>
              <li><strong>Add the Bot:</strong> Invite the Alliance Manager bot to your Discord server</li>
              <li><strong>Get Channel IDs:</strong> Enable Developer Mode in Discord, right-click channels and "Copy ID"</li>
              <li><strong>Set Permissions:</strong> Give the bot permissions to send messages, use slash commands, and mention @everyone</li>
              <li><strong>Configure Above:</strong> Enter your server and channel IDs, then enable the bot</li>
              <li><strong>Test:</strong> Use <code>/raids</code> command to verify everything works</li>
            </ol>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
              <strong>Available Commands:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li><code>/raids</code> - Show current raids and defensive wars</li>
                <li><code>/members</code> - Display alliance member statistics</li>
                <li><code>/sync</code> - Manually sync war data from Politics & War</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
