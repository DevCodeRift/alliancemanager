import type { NextApiRequest, NextApiResponse } from 'next'

const PNW_GRAPHQL = 'https://api.politicsandwar.com/graphql'

async function fetchNationWars(nationId: number, apiKey: string) {
  const query = `
    query {
      wars(nation_id: [${nationId}], active: true, first: 100) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { nationId, apiKey } = req.query as { nationId: string; apiKey: string }
    
    if (!nationId || !apiKey) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Missing nationId or apiKey. Usage: /api/debug/wars?nationId=389711&apiKey=YOUR_KEY' 
      })
    }

    const wars = await fetchNationWars(parseInt(nationId), apiKey)
    
    return res.json({
      ok: true,
      nationId: parseInt(nationId),
      warsFound: wars.length,
      wars: wars.map((war: any) => ({
        id: war.id,
        type: war.war_type,
        attacker: `${war.attacker.nation_name} (${war.attacker.id})`,
        defender: `${war.defender.nation_name} (${war.defender.id})`,
        isDefensive: parseInt(war.defender.id) === parseInt(nationId),
        date: war.date
      }))
    })

  } catch (error: any) {
    console.error('/api/debug/wars error:', error)
    return res.status(500).json({ 
      ok: false, 
      message: error?.message || 'Internal server error' 
    })
  }
}
