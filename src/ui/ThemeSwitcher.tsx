import { useState } from 'react'
import { themes } from '../theme/themes'

export default function ThemeSwitcher({ onClose }: { onClose?: () => void }) {
  const [selected, setSelected] = useState<string>(localStorage.getItem('am_theme') || 'default')

  const apply = (name: string) => {
    setSelected(name)
    try { (window as any).__am_setTheme?.(name) } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Select theme</div>
      {Object.keys(themes).map((k) => (
        <button key={k} onClick={() => apply(k)} style={{ padding: 8, borderRadius: 6, border: k === selected ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.04)', background: 'var(--panel)', color: 'var(--text)' }}>{k}</button>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
