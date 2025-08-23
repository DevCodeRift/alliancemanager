export type Theme = { [k: string]: string }

export const themes: Record<string, Theme> = {
  default: {
    '--bg': '#0b1020',
    '--panel': '#121826',
    '--accent': '#5eead4',
    '--text': '#e6eef8',
    '--muted': '#9aa6bf'
  },
  light: {
    '--bg': '#f7fafc',
    '--panel': '#ffffff',
    '--accent': '#2563eb',
    '--text': '#0b1220',
    '--muted': '#55607a'
  },
  allianceCrimson: {
    '--bg': '#120810',
    '--panel': '#1c0f12',
    '--accent': '#ff5577',
    '--text': '#ffeef2',
    '--muted': '#b98795'
  }
  ,
  cyberpunk: {
    '--bg': 'linear-gradient(180deg, #050014 0%, #0e0820 100%)',
    '--panel': 'rgba(10,6,24,0.85)',
    '--accent': '#ff00d6',
    '--text': '#e6f7ff',
    '--muted': '#9aa6bf',
    /* helper extra tones (available to override more parts if needed) */
    '--accent-2': '#00ffd5',
    '--neon-pink': '#ff00d6',
    '--neon-cyan': '#00ffd5'
  }
}
