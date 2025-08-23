"use client"

import React, { ReactNode, useEffect, useState } from 'react'
import { themes, Theme } from './themes'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<string>('default')

  // load persisted theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('am_theme')
      if (saved) setThemeName(saved)
    } catch {}
  }, [])

  // apply theme and persist whenever it changes
  useEffect(() => {
    const root = document.documentElement
    const theme: Theme = (themes as any)[themeName] || themes.default
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v))
    try { localStorage.setItem('am_theme', themeName) } catch {}

    // expose a simple API for other components to change theme
    ;(window as any).__am_setTheme = (name: string) => setThemeName(name)
  }, [themeName])

  return <>{children}</>
}
