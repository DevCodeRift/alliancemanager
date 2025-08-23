import '../styles/globals.css'
import type { AppProps } from 'next/app'
import ThemeProvider from '../src/theme/ThemeProvider'
import { SessionProvider } from 'next-auth/react'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={(pageProps as any).session}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  )
}
