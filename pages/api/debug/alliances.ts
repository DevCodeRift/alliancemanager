import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req as any, res as any, authOptions as any) as any
    const adminEmail = process.env.SITE_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SITE_ADMIN_EMAIL || 'praesultv@gmail.com'
    if (!session?.user?.email || session.user.email !== adminEmail) {
      return res.status(403).json({ ok: false, message: 'Forbidden' })
    }

    const list = await prisma.alliance.findMany({ orderBy: { slug: 'asc' } }) as any
    return res.json({ ok: true, count: list.length, alliances: list })
  } catch (err: any) {
    console.error('/api/debug/alliances error', err)
    return res.status(500).json({ ok: false, message: err?.message || 'Error' })
  }
}
