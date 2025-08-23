import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  try {
    const { getServerSession } = await import('next-auth/next')
    const { authOptions } = await import('../auth/[...nextauth]')
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session?.user?.email) return res.status(401).json({ ok: false })
    await prisma.user.update({ where: { email: session.user.email }, data: { pnwApiKey: null } })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('/api/pnw/unlink error', err)
    res.status(500).json({ ok: false })
  }
}
