import Window from './Window'
import Login from './Login'
import Dock from './Dock'

export default function Desktop() {
  // Desktop always shows the login window centered
  return (
    <div className="desktop">
      <div className="menu-bar">Alliance Manager OS</div>

      <div style={{ padding: 20 }} className="desktop-grid">
        {/* Empty desktop: focused on the central login window */}
      </div>

      <Dock />

      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <Window title="Alliance Manager" onClose={() => {}}>
          <Login />
        </Window>
      </div>
    </div>
  )
}
