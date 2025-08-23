import NextAuth from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '../../../src/lib/prisma'

const options = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile: any }) {
      return true
    },
  },
}

// create the handler once
// cast to any to avoid a TypeScript mismatch on session.strategy
const nextAuthHandler = NextAuth(options as any)

export default async function handler(req: any, res: any) {
  // Log presence of critical env vars (do not print secrets)
  try {
    console.log('[nextauth] ENV present:', {
      DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_DEBUG: !!process.env.NEXTAUTH_DEBUG,
    })
  } catch (e) {
    // ignore logging errors
  }

  try {
    return await nextAuthHandler(req, res)
  } catch (err: any) {
    // Log full error stack server-side for Vercel logs (do not echo secrets)
    console.error('[nextauth] Uncaught handler error:', err && err.stack ? err.stack : err)
    // If debug enabled, return the stack trace (redact envs/secrets) in the response to aid diagnosis
    if (process.env.NEXTAUTH_DEBUG === 'true') {
      const safe = {
        message: err?.message || String(err),
        stack: err?.stack?.toString?.(),
      }
      return res.status(500).json({ error: 'Internal Server Error', debug: safe })
    }
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
