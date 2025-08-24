import type { NextApiRequest, NextApiResponse } from 'next'

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // accepts GET or POST
  const allianceId = Number(req.query.allianceId || req.body?.allianceId)
  const page = Number(req.query.page || req.body?.page || 1)
  const perPage = Number(req.query.perPage || req.body?.perPage || 100)
  const apiKey = String(req.query.apiKey || req.body?.apiKey || '')

  if (!allianceId || !apiKey) return res.status(400).json({ ok: false, message: 'require allianceId and apiKey' })

  const q = `query { nations(alliance_id: ${allianceId}, first: ${perPage}, page: ${page}) { paginatorInfo { hasMorePages } data { id nation_name leader_name alliance_position alliance_position_id alliance_position_info { id name } num_cities last_active alliance_seniority } } }`
  try {
    const r = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
    const text = await r.text().catch(() => '')
    let parsed = null
    try { parsed = JSON.parse(text) } catch (e) { parsed = { raw: text } }
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, body: parsed })
  } catch (err: any) {
    console.error('/api/debug/pnwAlliance error', err)
    return res.status(500).json({ ok: false, message: err?.message || 'Error' })
  }
}
