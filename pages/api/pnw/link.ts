import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'
import { encryptText } from '../../../src/lib/crypto'

type Data = { success: boolean; message?: string; details?: any; allianceSlug?: string | null; allianceId?: string | null }

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

async function fetchApiKeyDetails(apiKey: string) {
  const query = `query { me { key requests max_requests permission_bits nation { id nation_name leader_name alliance_id score last_active date money coal oil uranium iron bauxite lead gasoline munitions steel aluminum food credits num_cities cities { id } } } }`
  const res = await fetch(`${PNW_GRAPHQL}?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`PNW API HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error('PNW API error: ' + JSON.stringify(json.errors))
  return json.data?.me || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // accept POST for actual linking; accept GET for a lightweight info/debug response
  if (req.method === 'GET') {
    return res.status(200).json({ success: false, message: 'This endpoint accepts POST with { apiKey } to link PnW account.' })
  }
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' })

  const { apiKey } = req.body || {}
  if (!apiKey || typeof apiKey !== 'string') return res.status(400).json({ success: false, message: 'Missing apiKey' })

  // require an authenticated user
  // NextAuth session info is available via cookies; use simple cookie-based lookup via NextAuth's getSession
  try {
  // lazy-import to avoid pulling next-auth in serverless cold path unless necessary
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('../auth/[...nextauth]')
  const session = (await getServerSession(req, res, authOptions as any)) as any
  console.log('[pnw/link] incoming method=', req.method, 'sessionUser=', !!session?.user?.email)
  if (!session?.user?.email) return res.status(401).json({ success: false, message: 'Not authenticated' })

    // validate key by fetching the account details
    let details
    try {
      details = await fetchApiKeyDetails(apiKey)
    } catch (e: any) {
      return res.status(400).json({ success: false, message: 'Failed to validate API key: ' + (e.message || String(e)) })
    }

  console.log('[pnw/link] fetched details for apiKey, nation=', details?.nation?.id, 'alliance_id=', details?.nation?.alliance_id)

    // Save key to user's record (encrypt at rest if secret provided)
    let stored = apiKey
    try {
      const secret = process.env.STACK_SECRET_SERVER_KEY
      if (secret) {
        stored = encryptText(apiKey, secret)
      }
    } catch (e) {
      console.warn('Failed to encrypt PnW API key, storing raw')
    }
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pnwApiKey: stored,
        ...(details?.nation?.leader_name ? { name: details.nation.leader_name } : {}),
        // map alliance from PnW nation
        ...(details?.nation?.alliance_id ? { allianceId: String(details.nation.alliance_id) } : {}),
        // set allianceRole: leader=5, member=2, applicant=1, none=0
        ...(details?.nation ? { allianceRole: details.nation.leader_name ? 5 : (details.nation.alliance_id ? 2 : 0) } : {}),
      },
    })

    // ensure Alliance record exists: use human slug from alliance_name (fallback to numeric id)
    let allianceSlug: string | null = null
    let pnwId: number | null = null
    try {
      // Try to resolve/create alliance using pnwAllianceId when available, otherwise fall back to alliance_name
      if (details?.nation) {
        const rawName = details.nation.alliance_name || null
        const pnwIdVal = details.nation.alliance_id ? Number(details.nation.alliance_id) : null

        let slugFromName: string | null = null
        if (rawName) slugFromName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || null

        let allianceRecord = null

        if (pnwIdVal) {
          // upsert by numeric pnw id
          const raw = rawName || `Alliance ${pnwIdVal}`
          let slug = slugFromName || String(pnwIdVal)
          const existing = await prisma.alliance.findUnique({ where: { slug } })
          if (existing && existing.pnwAllianceId !== pnwIdVal) {
            slug = `${slug}-${pnwIdVal}`
          }
          await prisma.alliance.upsert({
            where: { pnwAllianceId: pnwIdVal },
            update: { name: raw, slug, pnwAllianceId: pnwIdVal },
            create: { name: raw, slug, pnwAllianceId: pnwIdVal },
          })
          allianceRecord = await prisma.alliance.findUnique({ where: { pnwAllianceId: pnwIdVal } })
        } else if (slugFromName) {
          // try to find by slug; create if missing (no pnw id available)
          allianceRecord = await prisma.alliance.findUnique({ where: { slug: slugFromName } })
          if (!allianceRecord) {
            allianceRecord = await prisma.alliance.create({ data: { name: rawName!, slug: slugFromName } })
          }
        }

        if (allianceRecord) {
          allianceSlug = allianceRecord.slug
          pnwId = allianceRecord.pnwAllianceId ?? null
          await prisma.user.update({ where: { email: session.user.email }, data: { allianceId: allianceRecord.id } })
        }
      }
    } catch (e: any) {
      console.error('Failed to resolve/upsert alliance or set user allianceId', e)
      if (process.env.NEXTAUTH_DEBUG === 'true') {
        return res.status(500).json({ success: false, message: 'Failed to upsert/resolve alliance: ' + (e.message || String(e)) })
      }
      return res.status(500).json({ success: false, message: 'Internal server error' })
    }

  return res.status(200).json({ success: true, details, allianceSlug, allianceId: pnwId ? String(pnwId) : null })
  } catch (err: any) {
    console.error('[pnw/link] error', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
