// Backfill script: convert existing User.allianceId values that are numeric strings (pnw ids)
// into the internal Alliance.id where Alliance.pnwAllianceId matches.
// Usage: node scripts/backfill_alliance_ids.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Starting backfill of alliance IDs...')
  const users = await prisma.user.findMany({ where: { allianceId: { not: null } }, select: { id: true, allianceId: true } })
  let converted = 0
  for (const u of users) {
    const aid = u.allianceId
    if (!aid) continue
    // if allianceId looks like a numeric PnW id
    if (/^\d+$/.test(aid)) {
      const pnwId = Number(aid)
      const alliance = await prisma.alliance.findUnique({ where: { pnwAllianceId: pnwId } })
      if (alliance) {
        await prisma.user.update({ where: { id: u.id }, data: { allianceId: alliance.id } })
        converted++
      }
    }
  }
  console.log(`Converted ${converted} users.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
