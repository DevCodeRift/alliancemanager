import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, message: 'Method not allowed' })
    }

    // Get all alliances with Discord bot enabled
    const alliances = await prisma.alliance.findMany({
      where: { 
        discordBotEnabled: true,
        discordGuildId: { not: null }
      },
      select: {
        id: true,
        slug: true,
        name: true,
        discordGuildId: true,
        discordRaidChannelId: true,
        discordGeneralChannelId: true,
        discordSettings: true,
        pnwAllianceId: true
      }
    })

    const configs = alliances.map(alliance => ({
      allianceId: alliance.id,
      allianceSlug: alliance.slug,
      allianceName: alliance.name,
      pnwAllianceId: alliance.pnwAllianceId,
      discordGuildId: alliance.discordGuildId,
      discordChannelId: alliance.discordRaidChannelId, // Use raid channel as primary alert channel
      raidChannelId: alliance.discordRaidChannelId,
      generalChannelId: alliance.discordGeneralChannelId,
      settings: alliance.discordSettings || {}
    }))

    return res.json({ 
      ok: true, 
      alliances: configs,
      count: configs.length
    })

  } catch (error: any) {
    console.error('/api/bot/alliances error:', error)
    return res.status(500).json({ 
      ok: false, 
      message: error?.message || 'Internal server error' 
    })
  }
}
