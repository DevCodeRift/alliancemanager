import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
  const users = await prisma.user.findMany({ take: 50, orderBy: { id: 'desc' }, select: {
      id: true,
      name: true,
      email: true,
      pnwNationId: true,
      pnwSnapshot: true,
      pnwLastSynced: true,
      pnwLastActive: true,
      pnwNumCities: true,
      pnwAlliancePositionId: true,
      pnwAlliancePositionName: true,
      pnwAllianceSeniority: true,
      allianceId: true,
    } })
    return res.json({ ok: true, count: users.length, users })
  } catch (err: any) {
    console.error('/api/debug/users error', err)
    return res.status(500).json({ ok: false, message: err?.message || 'Error' })
  }
}
