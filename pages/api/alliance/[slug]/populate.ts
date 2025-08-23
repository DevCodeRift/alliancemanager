import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../src/lib/prisma'
import { decryptText } from '../../../../src/lib/crypto'

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

async function fetchAllianceMembers(pnwAllianceId: number, apiKey: string) {
  // Preferred approach: page through `nations(alliance_id: ...)` which is reliable and paginated.
  async function doQuery(query: string) {
    console.log('/api/alliance/[slug]/populate doQuery ->', query)
    const r = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
    const text = await r.text().catch(() => '')
    console.log(`/api/alliance/[slug]/populate PNW response status=${r.status} body=${text}`)
    if (!r.ok) return { ok: false, status: r.status, body: text }
    const parsed = JSON.parse(text)
    if (parsed.errors) return { ok: false, status: 200, errors: parsed.errors }
    return { ok: true, data: parsed.data }
  }

  // Page through nations(alliance_id: ...) first (safer than alliances.members which has returned 500s for some ids)
  const perPage = 100
  let page = 1
  const collected: any[] = []
  while (true) {
    const q = `query { nations(alliance_id: ${pnwAllianceId}, first: ${perPage}, page: ${page}) { paginatorInfo { hasMorePages } data { id nation_name leader_name alliance_id } } }`
    const r = await doQuery(q)
    if (!r.ok) {
      // If the nations query fails with a server error, fall back to the previous alliances/ids batching approach
      if (r.status && r.status >= 500) {
        console.warn('/api/alliance/[slug]/populate: nations(...) returned 5xx, falling back to alliances/ids batching')
        break
      }
      // surface GraphQL errors
      if (r.errors) throw new Error(JSON.stringify(r.errors))
      throw new Error(`PNW query failed: ${r.body || 'unknown'}`)
    }

    const pageData = r.data?.nations?.data || []
    collected.push(...pageData)
    const hasMore = !!r.data?.nations?.paginatorInfo?.hasMorePages
    if (!hasMore) break
    page += 1
  }

  if (collected.length) return collected

  // Fallback: attempt old alliances -> ids -> nations batching if nations(...) failed with 5xx
  // (This mirrors the previous logic but only runs when needed.)
  console.warn('/api/alliance/[slug]/populate: attempting fallback using alliances root field')
  const alliancesQuery = `query { alliances(ids: [${pnwAllianceId}]) { members { id } } }`
  const idsRes = await doQuery(alliancesQuery)
  if (!idsRes.ok) {
    const errBody = idsRes.body || JSON.stringify(idsRes.errors || 'unknown')
    throw new Error(`PNW HTTP ${idsRes.status || 500}: ${errBody}`)
  }
  const idList = idsRes.data?.alliances && idsRes.data.alliances.length ? idsRes.data.alliances[0].members.map((m: any) => m.id) : []
  const batchSize = 50
  const result: any[] = []
  for (let i = 0; i < idList.length; i += batchSize) {
    const chunk = idList.slice(i, i + batchSize)
    const detailsQuery = `query { nations(ids: [${chunk.join(',')}]) { id nation_name leader_name alliance_id } }`
    const dres = await doQuery(detailsQuery)
    if (!dres.ok) {
      console.error('Chunk details fetch failed', dres)
      continue
    }
    if (dres.data?.nations) result.push(...dres.data.nations)
  }
  return result
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'POST only' })
  const { slug } = req.query as { slug: string }
  let { apiKey } = req.body || {}
  // If no apiKey provided, try to use the authenticated user's stored pnwApiKey
  if (!apiKey) {
    try {
      const { getServerSession } = await import('next-auth/next')
      const { authOptions } = await import('../../auth/[...nextauth]')
      if (getServerSession && authOptions) {
        const session = await getServerSession(req as any, res as any, authOptions as any) as any
        if (session?.user?.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } })
          if (dbUser?.pnwApiKey) {
            // decrypt if STACK_SECRET_SERVER_KEY present
            const secret = process.env.STACK_SECRET_SERVER_KEY
            if (secret) {
              try {
                apiKey = decryptText(dbUser.pnwApiKey, secret)
              } catch (e) {
                console.warn('Failed to decrypt stored PnW key, using raw')
                apiKey = dbUser.pnwApiKey
              }
            } else {
              apiKey = dbUser.pnwApiKey
            }
          }
        }
      }
    } catch (e) {
      // ignore and fall back to body-provided apiKey
    }
  }
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
