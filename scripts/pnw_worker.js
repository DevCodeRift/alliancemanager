// Example worker to subscribe to PnW events and keep the DB updated.
// This is a template: adapt subscription names/handlers to the PnW API docs.

const WebSocket = require('ws')
const fetch = require('node-fetch')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const WS_URL = process.env.PNW_WS_URL || 'wss://api.politicsandwar.com/graphql'
const API_KEY = process.env.PNW_API_KEY

function handleMemberJoined(payload) {
  // payload example: { id: '1234', nation_name: 'X', leader_name: 'Y', alliance_id: 999 }
  const m = payload
  if (!m || !m.id) return
  ;(async () => {
    try {
      const pnwId = Number(m.id)
      if (!pnwId) return
      // find or create user placeholder
      let user = await prisma.user.findUnique({ where: { pnwNationId: pnwId } })
      if (!user) {
        user = await prisma.user.create({ data: { name: m.leader_name || m.nation_name || `Player ${pnwId}`, pnwNationId: pnwId } })
      }
      // ensure alliance mapping
      if (m.alliance_id) {
        const alliance = await prisma.alliance.findUnique({ where: { pnwAllianceId: Number(m.alliance_id) } })
        if (alliance && user.allianceId !== alliance.id) {
          await prisma.user.update({ where: { id: user.id }, data: { allianceId: alliance.id } })
        }
      }
    } catch (e) {
      console.error('handleMemberJoined error', e)
    }
  })()
}

function handleMemberLeft(payload) {
  const m = payload
  if (!m || !m.id) return
  ;(async () => {
    try {
      const pnwId = Number(m.id)
      if (!pnwId) return
      const user = await prisma.user.findUnique({ where: { pnwNationId: pnwId } })
      if (!user) return
      // remove alliance if matches
      const alliance = await prisma.alliance.findUnique({ where: { pnwAllianceId: Number(m.alliance_id) } })
      if (alliance && user.allianceId === alliance.id) {
        await prisma.user.update({ where: { id: user.id }, data: { allianceId: null } })
      }
    } catch (e) {
      console.error('handleMemberLeft error', e)
    }
  })()
}

function start() {
  const ws = new WebSocket(WS_URL, 'graphql-ws')
  ws.on('open', () => {
    console.log('ws open')
    ws.send(JSON.stringify({ type: 'connection_init', payload: { api_key: API_KEY } }))
    // example subscription start
    ws.send(JSON.stringify({ id: '1', type: 'start', payload: { query: 'subscription { memberJoined { id nation_name leader_name alliance_id } }' } }))
    ws.send(JSON.stringify({ id: '2', type: 'start', payload: { query: 'subscription { memberLeft { id alliance_id } }' } }))
  })
  ws.on('message', (msg) => {
    try {
      const d = JSON.parse(msg.toString())
      if (d.type === 'data' && d.id === '1') {
        handleMemberJoined(d.payload.data.memberJoined)
      }
      if (d.type === 'data' && d.id === '2') {
        handleMemberLeft(d.payload.data.memberLeft)
      }
      console.log('ws msg', JSON.stringify(d))
    } catch (e) {
      console.log('ws raw', msg.toString())
    }
  })
  ws.on('close', () => setTimeout(start, 5000))
}

start()
