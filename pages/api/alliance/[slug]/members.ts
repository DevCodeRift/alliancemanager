import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '../../../../src/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug: string }
  const alliance = await prisma.alliance.findUnique({ where: { slug } })
  if (!alliance) return res.status(404).json({ ok: false, message: 'Not found' })

  // list members: Verified (have pnwApiKey) vs Not Verified (no pnwApiKey but belong to alliance by allianceId)
  const members = await prisma.user.findMany({ where: { allianceId: alliance.id } })
  const verified = (members as any[]).filter((m) => !!m.pnwApiKey)
  const notVerified = (members as any[]).filter((m) => !m.pnwApiKey)
  return res.json({ ok: true, verified, notVerified })
}
