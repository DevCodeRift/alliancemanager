require('dotenv').config()
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js')
const fetch = require('node-fetch')

class AllianceManagerBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ]
    })
    
    this.commands = new Collection()
    this.lastWarCheck = new Date()
    this.knownWars = new Map() // guildId -> Set of war IDs
    this.guildConfigs = new Map() // guildId -> alliance config
    
    this.setupEvents()
    this.setupCommands()
  }

  async fetchAllianceConfigs() {
    try {
      const response = await fetch(`${process.env.ALLIANCE_MANAGER_URL}/api/bot/alliances`)
      const data = await response.json()
      
      if (!data.ok) {
        console.error('Failed to fetch alliance configs:', data.message)
        return
      }

      // Clear and update configs
      this.guildConfigs.clear()
      data.alliances.forEach(config => {
        if (config.discordGuildId) {
          this.guildConfigs.set(config.discordGuildId, config)
          
          // Initialize known wars for this guild if not exists
          if (!this.knownWars.has(config.discordGuildId)) {
            this.knownWars.set(config.discordGuildId, new Set())
          }
        }
      })

      console.log(`📊 Loaded ${data.alliances.length} alliance configurations`)
      
    } catch (error) {
      console.error('Error fetching alliance configs:', error)
    }
  }

  getGuildConfig(guildId) {
    return this.guildConfigs.get(guildId)
  }

  setupEvents() {
    this.client.once('ready', async () => {
      console.log(`✅ Bot ready! Logged in as ${this.client.user.tag}`)
      
      // Set bot status
      this.client.user.setActivity('Alliance Wars', { type: ActivityType.Watching })
      
      // Load alliance configurations
      await this.fetchAllianceConfigs()
      
      // Start automated war checking
      this.startWarMonitoring()
    })

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return

      const command = this.commands.get(interaction.commandName)
      if (!command) return

      try {
        await command.execute(interaction, this)
      } catch (error) {
        console.error('Command execution error:', error)
        await interaction.reply({ 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        })
      }
    })

    // Refresh configs every hour
    setInterval(() => {
      this.fetchAllianceConfigs()
    }, 60 * 60 * 1000)
  }

  setupCommands() {
    // Raid Alerts Command
    this.commands.set('raids', {
      data: {
        name: 'raids',
        description: 'Check current raid alerts for the alliance'
      },
      async execute(interaction, bot) {
        await interaction.deferReply()
        
        try {
          const guildConfig = bot.getGuildConfig(interaction.guildId)
          if (!guildConfig) {
            return await interaction.editReply('❌ This Discord server is not configured for Alliance Manager. Please contact an administrator.')
          }

          const response = await fetch(`${process.env.ALLIANCE_MANAGER_URL}/api/alliance/${guildConfig.allianceSlug}/wars`)
          const data = await response.json()
          
          if (!data.ok) {
            return await interaction.editReply('❌ Failed to fetch war data')
          }
          
          const raids = data.raids || []
          const defensiveWars = data.defensiveWars || []
          
          const embed = new EmbedBuilder()
            .setTitle(`🚨 ${guildConfig.allianceName} Raid Status`)
            .setColor(raids.length > 0 ? 0xFF6B6B : 0x5EEAD4)
            .setTimestamp()
          
          if (raids.length === 0) {
            embed.setDescription('✅ No active raids detected!\nYour alliance members are safe.')
          } else {
            embed.setDescription(`⚠️ **${raids.length} Active Raids Detected**`)
            
            raids.slice(0, 10).forEach((war, index) => {
              embed.addFields({
                name: `🔥 Raid ${index + 1}`,
                value: `**${war.defenderName}** under attack by **${war.attackerName}**\nWar ID: ${war.pnwWarId} • Type: ${war.warType}`,
                inline: false
              })
            })
            
            if (raids.length > 10) {
              embed.addFields({
                name: '📊 Additional Raids', 
                value: `... and ${raids.length - 10} more raids`,
                inline: false
              })
            }
          }
          
          embed.addFields({
            name: '📈 War Summary',
            value: `Total Defensive Wars: ${defensiveWars.length}\nActive Raids: ${raids.length}\nActive Alerts: ${data.alertCount || 0}`,
            inline: false
          })
          
          await interaction.editReply({ embeds: [embed] })
        } catch (error) {
          console.error('Raids command error:', error)
          await interaction.editReply('❌ Error fetching raid data')
        }
      }
    })

    // Member Status Command
    this.commands.set('members', {
      data: {
        name: 'members',
        description: 'Show alliance member statistics'
      },
      async execute(interaction, bot) {
        await interaction.deferReply()
        
        try {
          const guildConfig = bot.getGuildConfig(interaction.guildId)
          if (!guildConfig) {
            return await interaction.editReply('❌ This Discord server is not configured for Alliance Manager.')
          }

          const response = await fetch(`${process.env.ALLIANCE_MANAGER_URL}/api/alliance/${guildConfig.allianceSlug}/members`)
          const data = await response.json()
          
          if (!data.ok) {
            return await interaction.editReply('❌ Failed to fetch member data')
          }
          
          const verified = data.verified || []
          const notVerified = data.notVerified || []
          const total = verified.length + notVerified.length
          
          const embed = new EmbedBuilder()
            .setTitle(`👥 ${guildConfig.allianceName} Members`)
            .setColor(0x5EEAD4)
            .setTimestamp()
            .addFields(
              { name: '✅ Verified Members', value: verified.length.toString(), inline: true },
              { name: '❓ Unverified Members', value: notVerified.length.toString(), inline: true },
              { name: '📊 Total Members', value: total.toString(), inline: true }
            )
          
          await interaction.editReply({ embeds: [embed] })
        } catch (error) {
          console.error('Members command error:', error)
          await interaction.editReply('❌ Error fetching member data')
        }
      }
    })

    // War Sync Command
    this.commands.set('sync', {
      data: {
        name: 'sync',
        description: 'Manually sync war data from Politics & War'
      },
      async execute(interaction, bot) {
        await interaction.deferReply()
        
        try {
          const guildConfig = bot.getGuildConfig(interaction.guildId)
          if (!guildConfig) {
            return await interaction.editReply('❌ This Discord server is not configured for Alliance Manager.')
          }

          const response = await fetch(`${process.env.ALLIANCE_MANAGER_URL}/api/alliance/${guildConfig.allianceSlug}/wars?sync=true`, {
            method: 'GET'
          })
          const data = await response.json()
          
          if (!data.ok) {
            return await interaction.editReply('❌ Failed to sync war data')
          }
          
          const embed = new EmbedBuilder()
            .setTitle(`🔄 ${guildConfig.allianceName} War Data Synced`)
            .setColor(0x5EEAD4)
            .setDescription('Successfully synced with Politics & War API')
            .addFields(
              { name: '⚔️ Total Wars', value: (data.wars?.length || 0).toString(), inline: true },
              { name: '🛡️ Defensive Wars', value: (data.defensiveWars?.length || 0).toString(), inline: true },
              { name: '🚨 Active Raids', value: (data.raids?.length || 0).toString(), inline: true }
            )
            .setTimestamp()
          
          await interaction.editReply({ embeds: [embed] })
        } catch (error) {
          console.error('Sync command error:', error)
          await interaction.editReply('❌ Error syncing war data')
        }
      }
    })
  }

  async startWarMonitoring() {
    const checkInterval = (process.env.CHECK_INTERVAL_MINUTES || 5) * 60 * 1000
    
    console.log(`🔍 Starting war monitoring (checking every ${process.env.CHECK_INTERVAL_MINUTES || 5} minutes)`)
    
    setInterval(async () => {
      await this.checkForNewWars()
    }, checkInterval)
    
    // Initial check
    setTimeout(() => this.checkForNewWars(), 10000) // Wait 10 seconds after startup
  }

  async checkForNewWars() {
    try {
      // Check each configured alliance
      for (const guildId of Object.keys(this.guildConfigs)) {
        const config = this.guildConfigs[guildId]
        if (!config.discordChannelId) continue // Skip if no channel configured
        
        const response = await fetch(`${process.env.ALLIANCE_MANAGER_URL}/api/alliance/${config.allianceSlug}/wars?sync=true`)
        const data = await response.json()
        
        if (!data.ok) {
          console.error(`Failed to fetch wars for ${config.allianceName}:`, data.message)
          continue
        }
        
        const currentRaids = data.raids || []
        const guildKnownWars = this.knownWars.get(guildId) || new Set()
        const newRaids = currentRaids.filter(war => !guildKnownWars.has(war.pnwWarId))
        
        if (newRaids.length > 0) {
          console.log(`🚨 Detected ${newRaids.length} new raids for ${config.allianceName}!`)
          await this.sendRaidAlerts(newRaids, config)
          
          // Update known wars for this guild
          currentRaids.forEach(war => guildKnownWars.add(war.pnwWarId))
          this.knownWars.set(guildId, guildKnownWars)
        }
        
        // Clean up old wars from tracking (wars older than 24 hours)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        currentRaids.forEach(war => {
          if (new Date(war.warStarted) < dayAgo) {
            guildKnownWars.delete(war.pnwWarId)
          }
        })
      }
    } catch (error) {
      console.error('War monitoring error:', error)
    }
  }

  async sendRaidAlerts(raids, config) {
    const channelId = config.discordChannelId
    if (!channelId) {
      console.log(`No raid alert channel configured for ${config.allianceName}, skipping notifications`)
      return
    }
    
    const channel = this.client.channels.cache.get(channelId)
    if (!channel) {
      console.error(`Raid alert channel not found for ${config.allianceName}:`, channelId)
      return
    }
    
    for (const raid of raids) {
      const embed = new EmbedBuilder()
        .setTitle('🚨 NEW RAID ALERT')
        .setColor(0xFF6B6B)
        .setDescription(`**${raid.defenderName}** is under attack!`)
        .addFields(
          { name: '⚔️ Attacker', value: raid.attackerName, inline: true },
          { name: '🛡️ Defender', value: raid.defenderName, inline: true },
          { name: '📋 War Type', value: raid.warType, inline: true },
          { name: '🔗 War ID', value: raid.pnwWarId.toString(), inline: true },
          { name: '📅 Started', value: new Date(raid.warStarted).toLocaleString(), inline: true },
          { name: '🔗 View War', value: `[Politics & War](https://politicsandwar.com/nation/war/timeline/war=${raid.pnwWarId})`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `${config.allianceName} War Monitor` })
      
      try {
        await channel.send({ embeds: [embed] })
        console.log(`📨 Sent raid alert for ${raid.defenderName} to ${config.allianceName}`)
      } catch (error) {
        console.error(`Failed to send raid alert to ${config.allianceName}:`, error)
      }
    }
  }

  async start() {
    try {
      await this.client.login(process.env.DISCORD_BOT_TOKEN)
    } catch (error) {
      console.error('Failed to start bot:', error)
      process.exit(1)
    }
  }
}

// Start the bot
const bot = new AllianceManagerBot()
bot.start()
