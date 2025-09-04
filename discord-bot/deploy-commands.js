require('dotenv').config()
const { REST, Routes } = require('discord.js')

const commands = [
  {
    name: 'raids',
    description: 'Check current raid alerts for the alliance'
  },
  {
    name: 'members',
    description: 'Show alliance member statistics'
  },
  {
    name: 'sync',
    description: 'Manually sync war data from Politics & War'
  }
]

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN)

async function deployCommands() {
  try {
    console.log('Started refreshing application (/) commands.')

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    )

    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
}

deployCommands()
