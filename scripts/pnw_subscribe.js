// Example GraphQL subscriptions client for PnW (needs real credentials and websocket URL).
// Refer to https://mrvillage.gitbook.io/pnwapi/subscriptions/getting-started

const WebSocket = require('ws')
const wsUrl = process.env.PNW_WS_URL || 'wss://api.politicsandwar.com/graphql'

function start() {
  const ws = new WebSocket(wsUrl, 'graphql-ws')
  ws.on('open', () => {
    console.log('connected')
    // connection_init
    ws.send(JSON.stringify({ type: 'connection_init', payload: { api_key: process.env.PNW_API_KEY } }))
    // subscribe example (replace with actual subscription name/fields)
    const id = '1'
    ws.send(JSON.stringify({ id, type: 'start', payload: { query: 'subscription { allianceUpdated { id name } }' } }))
  })

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString())
      console.log('ws>', JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('ws raw>', msg.toString())
    }
  })

  ws.on('close', () => setTimeout(start, 5000))
}

start()
