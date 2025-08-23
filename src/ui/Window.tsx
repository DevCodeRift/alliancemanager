import React, { ReactNode } from 'react'

export default function Window({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  return (
    <div className="window">
      <div className="window-title">
        <div>{title}</div>
        <div className="window-controls">
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="window-body">{children}</div>
    </div>
  )
}
