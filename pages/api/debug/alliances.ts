import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let session: any = null
    try { session = await getServerSession(req as any, res as any, authOptions as any) as any } catch (se) { console.warn('getServerSession failed', se) }
    const adminEmail = process.env.SITE_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SITE_ADMIN_EMAIL || 'praesultv@gmail.com'
    // in dev, allow the request if SITE_ADMIN_EMAIL is not explicitly set and we are on localhost
    const isLocalDev = req.headers.host?.includes('localhost')
    if (!session?.user?.email) {
      if (!adminEmail && !isLocalDev) return res.status(403).json({ ok: false, message: 'Forbidden' })
    } else {
      if (session.user.email !== adminEmail && !isLocalDev) return res.status(403).json({ ok: false, message: 'Forbidden' })
    }
    try {
      const list = await prisma.alliance.findMany({ orderBy: { slug: 'asc' } }) as any
      return res.json({ ok: true, count: list.length, alliances: list })
    } catch (dbErr: any) {
      console.error('/api/debug/alliances prisma error', dbErr)
      const wantDebug = req.query?.debug === '1' || isLocalDev
      // If the error is due to the new `modules` column not existing in the DB, fallback to a raw query
      const msg: string = String(dbErr?.message || '')
      if (msg.includes('does not exist') || msg.includes('does not exist in the current database')) {
        try {
          // raw query selecting the existing Alliance columns (DB column naming may be snake_case)
          const raw = await prisma.$queryRaw<any[]>`SELECT id, slug, pnw_alliance_id as "pnwAllianceId", name, whitelisted, owner_id as "ownerId" FROM "Alliance" ORDER BY slug`
          return res.json({ ok: true, count: raw.length, alliances: raw })
        } catch (rawErr: any) {
          console.error('/api/debug/alliances raw fallback error', rawErr)
          if (wantDebug) return res.status(500).json({ ok: false, message: rawErr?.message, name: rawErr?.name, stack: rawErr?.stack })
          return res.status(500).json({ ok: false, message: 'Database error (fallback failed)' })
        }
      }
      if (wantDebug) return res.status(500).json({ ok: false, message: dbErr?.message, name: dbErr?.name, stack: dbErr?.stack })
      return res.status(500).json({ ok: false, message: 'Database error' })
    }
  } catch (err: any) {
    console.error('/api/debug/alliances error', err)
    return res.status(500).json({ ok: false, message: err?.message || 'Error' })
  }
}
