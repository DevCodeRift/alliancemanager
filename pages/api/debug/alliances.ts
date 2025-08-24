import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const list = await prisma.alliance.findMany({ select: { id: true, slug: true, pnwAllianceId: true, name: true, ownerId: true }, orderBy: { slug: 'asc' } })
    return res.json({ ok: true, count: list.length, alliances: list })
  } catch (err: any) {
    console.error('/api/debug/alliances error', err)
    return res.status(500).json({ ok: false, message: err?.message || 'Error' })
  }
}
