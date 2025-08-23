import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '../../../../src/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

async function fetchNationsByIds(ids: number[], apiKey: string) {
  const batchSize = 50
  const out: any[] = []
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize)
    const q = `query { nations(ids: [${chunk.join(',')}]) { data { id nation_name leader_name alliance_position alliance_position_id num_cities } } }`
    const r = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
    const text = await r.text().catch(() => '')
    if (!r.ok) throw new Error(`PnW fetch failed: ${r.status} ${text}`)
    const parsed = JSON.parse(text)
    if (parsed.errors) throw new Error(JSON.stringify(parsed.errors))
    const data = parsed.data?.nations?.data || []
    out.push(...data)
  }
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug: string }
  const alliance = await prisma.alliance.findUnique({ where: { slug } })
  if (!alliance) return res.status(404).json({ ok: false, message: 'Not found' })
  // allow ordering via query params: ?order=position|cities&dir=asc|desc&apiKey=...
  const { order, dir, apiKey } = req.query as { order?: string; dir?: string; apiKey?: string }

  // list members: include users who reference the internal alliance id OR the legacy PnW numeric id stored as a string
  const orClauses: any[] = [{ allianceId: alliance.id }]
  if (alliance.pnwAllianceId) {
    orClauses.push({ allianceId: String(alliance.pnwAllianceId) })
  }
  const members = await prisma.user.findMany({ where: { OR: orClauses } })

  let enriched: any[] = (members as any[]).map((m: any) => ({ ...m, pnw: null }))

  // If ordering requires PnW info (position or cities) and an apiKey is supplied, fetch nations and attach
  if (order && (order === 'position' || order === 'cities') && apiKey) {
    const ids = enriched.map((e) => Number(e.pnwNationId)).filter(Boolean) as number[]
    if (ids.length) {
      try {
        const nations = await fetchNationsByIds(ids, String(apiKey))
        const byId = new Map(nations.map((n: any) => [Number(n.id), n]))
        enriched = enriched.map((e) => ({ ...e, pnw: byId.get(Number(e.pnwNationId)) || null }))
      } catch (err: any) {
        console.warn('Failed to enrich members from PnW:', err?.message || err)
        // proceed without enrichment
      }
    }
  }

  // split verified/notVerified
  let verified = enriched.filter((m) => !!m.pnwApiKey)
  let notVerified = enriched.filter((m) => !m.pnwApiKey)

  // Sorting helpers
  const sortByPosition = (a: any, b: any) => {
    const pa = a.pnw?.alliance_position_id ?? null
    const pb = b.pnw?.alliance_position_id ?? null
    if (pa == null && pb == null) return 0
    if (pa == null) return 1
    if (pb == null) return -1
    return Number(pa) - Number(pb)
  }
  const sortByCities = (a: any, b: any) => {
    const ca = a.pnw?.num_cities ?? null
    const cb = b.pnw?.num_cities ?? null
    if (ca == null && cb == null) return 0
    if (ca == null) return 1
    if (cb == null) return -1
    return Number(ca) - Number(cb)
  }

  if (order === 'position') {
    verified.sort(sortByPosition)
    notVerified.sort(sortByPosition)
  } else if (order === 'cities') {
    verified.sort(sortByCities)
    notVerified.sort(sortByCities)
  } else {
    // default: sort by name/email
    verified.sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')))
    notVerified.sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')))
  }

  if (dir === 'desc') {
    verified = verified.reverse()
    notVerified = notVerified.reverse()
  }

  return res.json({ ok: true, verified, notVerified })
}
