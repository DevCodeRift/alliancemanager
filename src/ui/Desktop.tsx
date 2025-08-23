import { useState } from 'react'
import Window from './Window'
import Dock from './Dock'
import Login from './Login'
import Signup from './Signup'
import ThemeSwitcher from './ThemeSwitcher'

export default function Desktop() {
  const [open, setOpen] = useState<'login' | 'signup' | 'themes' | null>(null)

  return (
    <div className="desktop">
      <div className="menu-bar">Alliance Manager OS</div>

      <div className="desktop-grid">
        <button className="icon" onClick={() => setOpen('login')}>Login</button>
        <button className="icon" onClick={() => setOpen('signup')}>Signup</button>
        <button className="icon" onClick={() => setOpen('themes')}>Themes</button>
      </div>

      <Dock />

      {open === 'login' && (
        <Window title="Login" onClose={() => setOpen(null)}>
          <Login onSwap={() => setOpen('signup')} onSuccess={() => setOpen(null)} />
        </Window>
      )}

        {open === 'themes' && (
          <Window title="Themes" onClose={() => setOpen(null)}>
            <ThemeSwitcher onClose={() => setOpen(null)} />
          </Window>
        )}

      {open === 'signup' && (
        <Window title="Signup" onClose={() => setOpen(null)}>
          <Signup onSwap={() => setOpen('login')} onSuccess={() => setOpen(null)} />
        </Window>
      )}
    </div>
  )
}
