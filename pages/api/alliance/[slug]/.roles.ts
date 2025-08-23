import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '../../../../src/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

// NOTE: filename intentionally uses a dot before roles to avoid framework routing conflicts during dev; will be renamed if desired.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug: string }
  const session = (await getServerSession(req, res, authOptions as any)) as any
  if (!session?.user?.email) return res.status(401).json({ ok: false, message: 'Unauthorized' })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return res.status(401).json({ ok: false, message: 'Unauthorized' })

  const alliance = await prisma.alliance.findUnique({ where: { slug } })
  if (!alliance) return res.status(404).json({ ok: false, message: 'Not found' })

  // helper: check if requester is owner or management
  const isOwner = alliance.ownerId === user.id || process.env.SITE_ADMIN_EMAIL === session.user.email

  if (req.method === 'GET') {
    const roles = await prisma.role.findMany({ where: { allianceId: alliance.id }, include: { assignments: { include: { user: true } } } })
    return res.json({ ok: true, roles })
  }

  const body = req.body as any

  // create role (owner only)
  if (req.method === 'POST' && body.action === 'create') {
    if (!isOwner) return res.status(403).json({ ok: false, message: 'Forbidden' })
    const { name } = body
    const role = await prisma.role.create({ data: { name, allianceId: alliance.id } })
    return res.json({ ok: true, role })
  }

  // assign/unassign roles
  if (req.method === 'POST' && (body.action === 'assign' || body.action === 'unassign')) {
    const { roleId, targetUserId } = body
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role || role.allianceId !== alliance.id) return res.status(400).json({ ok: false, message: 'Invalid role' })

    // hierarchy: owner can do anything; management role can assign any role; leads can assign their team
    const requesterRoles = await prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } })
    const requesterRoleNames = requesterRoles.map(r => r.role.name)
    const requesterIsManagement = requesterRoleNames.includes('Management') || isOwner

    function canManageTargetRole(targetRoleName: string) {
      if (requesterIsManagement) return true
      if (targetRoleName.startsWith('Economy') && requesterRoleNames.includes('Economy Lead')) return true
      if (targetRoleName.startsWith('Military') && requesterRoleNames.includes('Military Affairs Lead')) return true
      if (targetRoleName.startsWith('Internal') && requesterRoleNames.includes('Internal Affairs Lead')) return true
      return false
    }

    if (!canManageTargetRole(role.name)) return res.status(403).json({ ok: false, message: 'Insufficient permissions' })

    if (body.action === 'assign') {
      await prisma.userRole.create({ data: { userId: targetUserId, roleId } })
      return res.json({ ok: true })
    } else {
      await prisma.userRole.deleteMany({ where: { userId: targetUserId, roleId } })
      return res.json({ ok: true })
    }
  }

  res.status(400).json({ ok: false, message: 'Bad request' })
}
