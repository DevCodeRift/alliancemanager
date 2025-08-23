import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../src/lib/prisma'
import { encryptText } from '../../../src/lib/crypto'

type Data = { success: boolean; message?: string; details?: any }

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
  if (!session?.user?.email) return res.status(401).json({ success: false, message: 'Not authenticated' })

    // validate key by fetching the account details
    let details
    try {
      details = await fetchApiKeyDetails(apiKey)
    } catch (e: any) {
      return res.status(400).json({ success: false, message: 'Failed to validate API key: ' + (e.message || String(e)) })
    }

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
      },
    })

    return res.status(200).json({ success: true, details })
  } catch (err: any) {
    console.error('[pnw/link] error', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
