import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '../../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { slug } = req.query as { slug: string }

    if (req.method === 'GET') {
      // Public endpoint for bot to fetch configuration
      const alliance = await prisma.alliance.findUnique({ 
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          discordGuildId: true,
          discordRaidChannelId: true,
          discordGeneralChannelId: true,
          discordBotEnabled: true,
          discordSettings: true,
          pnwAllianceId: true
        }
      })
      
      if (!alliance) {
        return res.status(404).json({ ok: false, message: 'Alliance not found' })
      }

      return res.json({ 
        ok: true, 
        config: {
          allianceId: alliance.id,
          allianceSlug: alliance.slug,
          allianceName: alliance.name,
          pnwAllianceId: alliance.pnwAllianceId,
          discordGuildId: alliance.discordGuildId,
          raidChannelId: alliance.discordRaidChannelId,
          generalChannelId: alliance.discordGeneralChannelId,
          botEnabled: alliance.discordBotEnabled,
          settings: alliance.discordSettings || {}
        }
      })
    }

    if (req.method === 'POST') {
      // Protected endpoint for updating configuration
      const session = (await getServerSession(req as any, res as any, authOptions as any)) as any
      if (!session?.user?.email) {
        return res.status(401).json({ ok: false, message: 'Not authenticated' })
      }

      const user = await prisma.user.findUnique({ 
        where: { email: session.user.email } 
      })
      if (!user) {
        return res.status(401).json({ ok: false, message: 'User not found' })
      }

      const alliance = await prisma.alliance.findUnique({ where: { slug } })
      if (!alliance) {
        return res.status(404).json({ ok: false, message: 'Alliance not found' })
      }

      // Check if user is alliance owner or admin
      const adminEmail = process.env.SITE_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SITE_ADMIN_EMAIL || 'praesultv@gmail.com'
      const isOwner = alliance.ownerId === user.id || adminEmail === session.user.email

      if (!isOwner) {
        return res.status(403).json({ ok: false, message: 'Forbidden' })
      }

      const { 
        discordGuildId, 
        discordRaidChannelId, 
        discordGeneralChannelId, 
        discordBotEnabled,
        discordSettings 
      } = req.body

      const updatedAlliance = await prisma.alliance.update({
        where: { slug },
        data: {
          discordGuildId,
          discordRaidChannelId,
          discordGeneralChannelId,
          discordBotEnabled: !!discordBotEnabled,
          discordSettings: discordSettings || {}
        }
      })

      return res.json({ ok: true, alliance: updatedAlliance })
    }

    return res.status(405).json({ ok: false, message: 'Method not allowed' })

  } catch (error: any) {
    console.error('/api/alliance/[slug]/discord error:', error)
    return res.status(500).json({ 
      ok: false, 
      message: error?.message || 'Internal server error' 
    })
  }
}
