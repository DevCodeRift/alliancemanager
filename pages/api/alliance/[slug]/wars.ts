import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../src/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { decryptText } from '../../../../src/lib/crypto'

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

async function fetchAllianceMembers(allianceId: number, apiKey: string) {
  const query = `
    query {
      nations(alliance_id: ${allianceId}, first: 500) {
        data {
          id
          nation_name
          alliance_id
        }
      }
    }
  `

  const response = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`PnW API error: ${response.status} ${text}`)
  }

  const parsed = JSON.parse(text)
  if (parsed.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(parsed.errors)}`)
  }

  return parsed.data?.nations?.data || []
}

async function fetchWarsForNations(nationIds: number[], apiKey: string) {
  if (nationIds.length === 0) return []

  const query = `
    query {
      wars(nation_id: [${nationIds.join(',')}], active: true, first: 500) {
        data {
          id
          date
          war_type
          attacker {
            id
            nation_name
            leader_name
            alliance_id
          }
          defender {
            id
            nation_name
            leader_name
            alliance_id
          }
          winner_id
          turns_left
          att_peace
          def_peace
        }
      }
    }
  `

  const response = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`PnW API error: ${response.status} ${text}`)
  }

  const parsed = JSON.parse(text)
  if (parsed.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(parsed.errors)}`)
  }

  return parsed.data?.wars?.data || []
}

async function syncWarsToDatabase(wars: any[], allianceId: string, pnwAllianceId: number, memberIds: number[]) {
  const existingWars = await prisma.war.findMany({
    where: { allianceId, isActive: true }
  })
  
  const existingWarIds = new Set(existingWars.map((w: any) => w.pnwWarId))
  const currentWarIds = new Set(wars.map((w: any) => parseInt(w.id)))

  // Mark wars as inactive if they're no longer in the API response
  const warsToDeactivate = existingWars.filter((w: any) => !currentWarIds.has(w.pnwWarId))
  for (const war of warsToDeactivate) {
    await prisma.war.update({
      where: { id: war.id },
      data: { isActive: false, updatedAt: new Date() }
    })
  }

  // Add or update wars from API - but only wars involving our alliance members
  for (const war of wars) {
    const warId = parseInt(war.id)
    const defenderId = parseInt(war.defender.id)
    const attackerId = parseInt(war.attacker.id)
    
    // Check if this war involves our alliance members
    const defenderIsOurs = memberIds.includes(defenderId)
    const attackerIsOurs = memberIds.includes(attackerId)
    
    if (!defenderIsOurs && !attackerIsOurs) {
      continue // Skip wars that don't involve our members
    }
    
    // Determine if this is a defensive war for our alliance
    const isDefensive = defenderIsOurs

    const warData = {
      pnwWarId: warId,
      allianceId,
      attackerId,
      defenderId,
      attackerName: war.attacker.nation_name,
      defenderName: war.defender.nation_name,
      warType: war.war_type,
      winner: war.winner_id ? parseInt(war.winner_id) : null,
      turnEnds: null, // Would need to calculate from current time + turns_left
      warStarted: new Date(war.date),
      warEnded: war.winner_id ? new Date() : null,
      isDefensive,
      isActive: true,
      updatedAt: new Date()
    }

    if (existingWarIds.has(warId)) {
      // Update existing war
      await prisma.war.update({
        where: { pnwWarId: warId },
        data: warData
      })
    } else {
      // Create new war
      await prisma.war.create({
        data: {
          ...warData,
          createdAt: new Date()
        }
      })

      // Create alert for new defensive wars (raids)
      if (isDefensive && war.war_type === 'RAID') {
        await prisma.warAlert.create({
          data: {
            warId: (await prisma.war.findUnique({ where: { pnwWarId: warId } }))!.id,
            alertType: 'NEW_DEFENSIVE_RAID',
            message: `${war.defender.nation_name} is under attack by ${war.attacker.nation_name}!`,
            isRead: false,
            createdAt: new Date()
          }
        })
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = (await getServerSession(req as any, res as any, authOptions as any)) as any
    if (!session?.user?.email) {
      return res.status(401).json({ ok: false, message: 'Not authenticated' })
    }

    const { slug } = req.query as { slug: string }
    const alliance = await prisma.alliance.findUnique({ where: { slug } })
    if (!alliance) {
      return res.status(404).json({ ok: false, message: 'Alliance not found' })
    }

    if (!alliance.pnwAllianceId) {
      return res.status(400).json({ ok: false, message: 'Alliance has no PnW Alliance ID' })
    }

    // Get API key from user or query params
    let apiKey: string | null = null
    const { apiKey: queryApiKey, sync } = req.query as { apiKey?: string; sync?: string }

    if (queryApiKey) {
      apiKey = queryApiKey
    } else {
      // Try to get user's stored API key
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })
        if (user?.pnwApiKey) {
          const secret = process.env.STACK_SECRET_SERVER_KEY
          if (secret) {
            try {
              apiKey = decryptText(user.pnwApiKey, secret)
            } catch (e) {
              apiKey = user.pnwApiKey
            }
          } else {
            apiKey = user.pnwApiKey
          }
        }
      } catch (e) {
        // ignore and require apiKey in query
      }
    }

    if (!apiKey) {
      return res.status(400).json({ ok: false, message: 'API key required' })
    }

    if (req.method === 'POST' || sync === 'true') {
      // Sync wars from PnW API
      const members = await fetchAllianceMembers(alliance.pnwAllianceId, apiKey)
      const memberIds = members.map((m: any) => parseInt(m.id))
      const wars = await fetchWarsForNations(memberIds, apiKey)
      await syncWarsToDatabase(wars, alliance.id, alliance.pnwAllianceId, memberIds)
    }

    // Return current wars and alerts from database
    const wars = await prisma.war.findMany({
      where: { allianceId: alliance.id, isActive: true },
      include: { alerts: { where: { isRead: false } } },
      orderBy: { createdAt: 'desc' }
    })

    const defensiveWars = wars.filter((w: any) => w.isDefensive)
    const raids = defensiveWars.filter((w: any) => w.warType === 'RAID')

    return res.json({
      ok: true,
      wars: wars,
      defensiveWars: defensiveWars,
      raids: raids,
      alertCount: wars.reduce((total: number, war: any) => total + war.alerts.length, 0)
    })

  } catch (error: any) {
    console.error('/api/alliance/[slug]/wars error:', error)
    return res.status(500).json({ 
      ok: false, 
      message: error?.message || 'Internal server error' 
    })
  }
}
