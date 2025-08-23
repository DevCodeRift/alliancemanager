import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '../../../../src/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug: string }
  const alliance = await prisma.alliance.findUnique({ where: { slug } })
  if (!alliance) return res.status(404).json({ ok: false, message: 'Not found' })

  // list members: include users who reference the internal alliance id OR the legacy PnW numeric id stored as a string
  const orClauses: any[] = [{ allianceId: alliance.id }]
  if (alliance.pnwAllianceId) {
    orClauses.push({ allianceId: String(alliance.pnwAllianceId) })
  }
  const members = await prisma.user.findMany({ where: { OR: orClauses } })
  const verified = (members as any[]).filter((m) => !!m.pnwApiKey)
  const notVerified = (members as any[]).filter((m) => !m.pnwApiKey)
  return res.json({ ok: true, verified, notVerified })
}
