import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'
import { encryptText } from '../../../src/lib/crypto'

type Data = { success: boolean; message?: string; details?: any; allianceSlug?: string | null }

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
      if (details?.nation?.alliance_id) {
        pnwId = Number(details.nation.alliance_id)
        const rawName = details.nation.alliance_name || `Alliance ${pnwId}`
        let slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || String(pnwId)

        // ensure slug uniqueness: if slug exists for another alliance, append pnwId
        const existing = await prisma.alliance.findUnique({ where: { slug } })
        if (existing && existing.pnwAllianceId !== pnwId) {
          slug = `${slug}-${pnwId}`
        }

        // upsert by pnwAllianceId (unique); if create fails due to slug collision this avoids most conflicts
        await prisma.alliance.upsert({
          where: { pnwAllianceId: pnwId },
          update: { name: rawName, slug, pnwAllianceId: pnwId },
          create: { name: rawName, slug, pnwAllianceId: pnwId },
        })

        // resolve the alliance record and set the user's allianceId to the internal Alliance.id
        const allianceRecord = await prisma.alliance.findUnique({ where: { pnwAllianceId: pnwId } })
        if (allianceRecord) {
          allianceSlug = allianceRecord.slug
          await prisma.user.update({
            where: { email: session.user.email },
            data: { allianceId: allianceRecord.id },
          })
        }
      }
    } catch (e: any) {
      console.error('Failed to upsert alliance or set user allianceId', e)
      // If NEXTAUTH_DEBUG is true return the error message to help debugging, else generic 500
      if (process.env.NEXTAUTH_DEBUG === 'true') {
        return res.status(500).json({ success: false, message: 'Failed to upsert alliance: ' + (e.message || String(e)) })
      }
      return res.status(500).json({ success: false, message: 'Internal server error' })
    }

    return res.status(200).json({ success: true, details, allianceSlug })
  } catch (err: any) {
    console.error('[pnw/link] error', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
