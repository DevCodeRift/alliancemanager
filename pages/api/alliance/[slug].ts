import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../src/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug: string }
  const session = (await getServerSession(req, res, authOptions as any)) as any

  if (req.method === 'GET') {
    const alliance = await prisma.alliance.findUnique({ where: { slug }, include: { owner: true } })
    if (!alliance) return res.status(404).json({ ok: false, message: 'Not found' })
    return res.json({ ok: true, alliance })
  }

  if (!session?.user?.email) return res.status(401).json({ ok: false, message: 'Unauthorized' })

  // Only owner (or site admin by email) can modify
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' })

  const alliance = await prisma.alliance.findUnique({ where: { slug } })
  if (!alliance) return res.status(404).json({ ok: false, message: 'Not found' })

  const isOwner = alliance.ownerId === user.id || process.env.SITE_ADMIN_EMAIL === session.user.email

  if (!isOwner) return res.status(403).json({ ok: false, message: 'Forbidden' })

  if (req.method === 'POST') {
    const { action, ownerId, whitelisted } = req.body as any
    if (action === 'setOwner') {
      await prisma.alliance.update({ where: { slug }, data: { ownerId } })
      return res.json({ ok: true })
    }
    if (action === 'setWhitelist') {
      await prisma.alliance.update({ where: { slug }, data: { whitelisted: !!whitelisted } })
      return res.json({ ok: true })
    }
  }

  res.status(400).json({ ok: false, message: 'Bad request' })
}
