import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { getServerSession } = await import('next-auth/next')
    const { authOptions } = await import('../auth/[...nextauth]')
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session?.user?.email) return res.status(401).json({ ok: false })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    return res.status(200).json({ ok: true, user: { email: user?.email, pnwLinked: !!user?.pnwApiKey } })
  } catch (err) {
    console.error('/api/user/me error', err)
    res.status(500).json({ ok: false })
  }
}
