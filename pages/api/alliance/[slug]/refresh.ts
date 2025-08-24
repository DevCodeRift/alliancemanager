import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../src/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { decryptText } from '../../../../src/lib/crypto'

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

async function fetchNationsByIds(ids: number[], apiKey: string) {
  const batchSize = 50
  const out: any[] = []
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize)
  const q = `query { nations(ids: [${chunk.join(',')}]) { data { id nation_name leader_name alliance_position alliance_position_id alliance_position_info { id name } num_cities last_active alliance_seniority } } }`
    const r = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
    const text = await r.text().catch(() => '')
    if (!r.ok) throw new Error(`PnW fetch failed: ${r.status} ${text}`)
  const parsed = JSON.parse(text)
  if (parsed.errors) throw new Error(JSON.stringify(parsed.errors))
  // PnW sometimes returns { nations: { data: [...] } } and sometimes { nations: [...] }
  const data = parsed.data?.nations?.data ?? parsed.data?.nations ?? []
    out.push(...data)
  }
  return out
}

async function fetchNationsByAllianceId(pnwAllianceId: number, apiKey: string) {
  const perPage = 100
  let page = 1
  const collected: any[] = []
  while (true) {
  const q = `query { nations(alliance_id: ${pnwAllianceId}, first: ${perPage}, page: ${page}) { paginatorInfo { hasMorePages } data { id nation_name leader_name alliance_position alliance_position_id alliance_position_info { id name } num_cities last_active alliance_seniority } } }`
    const r = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
    const text = await r.text().catch(() => '')
    console.log('/api/alliance/[slug]/refresh paged nations query page=', page, 'status=', r.status)
    if (!r.ok) throw new Error(`PnW fetch failed: ${r.status} ${text}`)
    const parsed = JSON.parse(text)
    if (parsed.errors) throw new Error(JSON.stringify(parsed.errors))
    const data = parsed.data?.nations?.data ?? parsed.data?.nations ?? []
    collected.push(...data)
    const hasMore = !!parsed.data?.nations?.paginatorInfo?.hasMorePages
    if (!hasMore) break
    page += 1
  }
  return collected
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'POST only' })
  const { slug } = req.query as { slug: string }
  let { apiKey } = req.body || {}
  // if no apiKey provided, try to use the authenticated user's stored PnW key
  if (!apiKey) {
    try {
      const session = await getServerSession(req as any, res as any, authOptions as any) as any
      if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (dbUser?.pnwApiKey) {
          const secret = process.env.STACK_SECRET_SERVER_KEY
          if (secret) {
            try { apiKey = decryptText(dbUser.pnwApiKey, secret) } catch (e) { apiKey = dbUser.pnwApiKey }
          } else {
            apiKey = dbUser.pnwApiKey
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  if (!apiKey || typeof apiKey !== 'string') return res.status(400).json({ ok: false, message: 'apiKey required (or link your PnW key to use Sync)' })

  const alliance = await prisma.alliance.findUnique({ where: { slug } })
  if (!alliance) return res.status(404).json({ ok: false, message: 'Alliance not found' })

  // collect member pnw ids
  const orClauses: any[] = [{ allianceId: alliance.id }]
  if (alliance.pnwAllianceId) orClauses.push({ allianceId: String(alliance.pnwAllianceId) })
  const members = await prisma.user.findMany({ where: { OR: orClauses } })
  const ids = (members as any[]).map((m: any) => Number(m.pnwNationId)).filter(Boolean) as number[]
  if (!ids.length) return res.json({ ok: true, refreshed: 0 })

  const debug = req.query?.debug === '1' || (req.body && req.body.debug === true)

  try {
    let nations: any[] = []
    try {
      nations = await fetchNationsByIds(ids, apiKey)
    } catch (fetchErr: any) {
      console.warn('/api/alliance/[slug]/refresh: fetchNationsByIds failed', fetchErr?.message || fetchErr)
      // If fetch failed with a server error and we have a pnwAllianceId, try paginated alliance query
      if (alliance.pnwAllianceId) {
        try {
          nations = await fetchNationsByAllianceId(Number(alliance.pnwAllianceId), apiKey)
        } catch (pagErr: any) {
          console.warn('/api/alliance/[slug]/refresh: fetchNationsByAllianceId also failed', pagErr?.message || pagErr)
          throw fetchErr
        }
      } else {
        throw fetchErr
      }
    }
    const byId = new Map(nations.map((n: any) => [Number(n.id), n]))
    let updated = 0
    for (const u of members) {
      const nid = Number((u as any).pnwNationId)
      const n = byId.get(nid)
      if (!n) continue
      // normalize last_active: PnW may return seconds or milliseconds or an ISO string
      let lastActive: Date | null = null
      if (n.last_active) {
        if (typeof n.last_active === 'number') {
          // if seconds (typical small number), convert to ms
          lastActive = new Date(n.last_active < 1e12 ? n.last_active * 1000 : n.last_active)
        } else {
          // assume ISO string or other parseable format
          const parsedDate = new Date(n.last_active)
          lastActive = isNaN(parsedDate.getTime()) ? null : parsedDate
        }
      }
      // coerce some fields to the expected types before persisting
      const posIdRaw = n.alliance_position_id ?? null
      let posId: number | null = null
      if (posIdRaw != null && posIdRaw !== '') {
        const parsed = Number(posIdRaw)
        posId = Number.isFinite(parsed) ? parsed : null
      }
      await prisma.user.update({ where: { id: u.id }, data: {
        pnwSnapshot: n,
        pnwLastSynced: new Date(),
        pnwLastActive: lastActive,
        pnwNumCities: n.num_cities ?? null,
        pnwAlliancePositionId: posId,
        pnwAlliancePositionName: n.alliance_position_info?.name ?? null,
  pnwAllianceSeniority: n.alliance_seniority ?? null,
        pnwNationName: n.nation_name ?? null,
        pnwLeaderName: n.leader_name ?? null,
      } })
      updated++
    }
    // if debug requested, return extra diagnostic info
    if (debug) {
      const fetchedIds = Array.from(byId.keys())
      const missing = ids.filter((i) => !byId.has(i))
      return res.json({ ok: true, refreshed: updated, fetched: fetchedIds.length, fetchedIds, missing })
    }

    return res.json({ ok: true, refreshed: updated })
  } catch (err: any) {
    console.error('/api/alliance/[slug]/refresh error', err)
    return res.status(500).json({ ok: false, message: err?.message || 'Error' })
  }
}
