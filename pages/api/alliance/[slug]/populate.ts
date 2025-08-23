import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../src/lib/prisma'

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

async function fetchAllianceMembers(pnwAllianceId: number, apiKey: string) {
  // Fetch alliance members via PnW GraphQL. Adjust query fields as needed.
  const q = `query { alliance(id: ${pnwAllianceId}) { members { id nation_name leader_name } } }`
  const res = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  })
  if (!res.ok) throw new Error(`PNW HTTP ${res.status}`)
  const j = await res.json()
  if (j.errors) throw new Error(JSON.stringify(j.errors))
  return j.data?.alliance?.members || []
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'POST only' })
  const { slug } = req.query as { slug: string }
  const { apiKey } = req.body || {}
  if (!apiKey || typeof apiKey !== 'string') return res.status(400).json({ ok: false, message: 'Missing apiKey' })

  const alliance = await prisma.alliance.findUnique({ where: { slug } })
  if (!alliance) return res.status(404).json({ ok: false, message: 'Alliance not found' })
  if (!alliance.pnwAllianceId) return res.status(400).json({ ok: false, message: 'Alliance has no pnwAllianceId' })

  try {
    const members = await fetchAllianceMembers(alliance.pnwAllianceId, apiKey)
    // Upsert simple placeholder users for each nation: use pnwNationId and allianceId; they can claim/login later
    let created = 0
    for (const m of members) {
      const pnwId = Number(m.id)
      if (!pnwId) continue
      const existing = await prisma.user.findUnique({ where: { pnwNationId: pnwId } as any })
      if (existing) {
        // ensure they are linked to this alliance internally
        if (existing.allianceId !== alliance.id) {
          await prisma.user.update({ where: { id: existing.id }, data: { allianceId: alliance.id } })
        }
        continue
      }
      // create a placeholder user with no email so they appear in Not Verified
      await prisma.user.create({ data: { name: m.leader_name || m.nation_name || `Player ${pnwId}`, pnwNationId: pnwId, allianceId: alliance.id } })
      created++
    }
    return res.json({ ok: true, created, total: members.length })
  } catch (err: any) {
    console.error('/api/alliance/[slug]/populate error', err)
    return res.status(500).json({ ok: false, message: err?.message || 'Error' })
  }
}
