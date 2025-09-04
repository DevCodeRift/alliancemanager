# Alliance Manager Discord Bot

A Discord bot that integrates with the Alliance Manager website to provide raid alerts and alliance management features.

## Features

🚨 **Automated Raid Alerts**
- Monitors for new defensive wars/raids
- Posts real-time alerts to Discord channels
- Pings @here for urgent notifications

⚔️ **War Management Commands**
- `/raids` - Check current raid status
- `/members` - View alliance member stats  
- `/sync` - Manually sync war data

🔄 **Auto-Monitoring**
- Checks for new wars every 5 minutes
- Tracks known wars to avoid duplicate alerts
- Cleans up old war data automatically

## Setup

### 1. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Go to "OAuth2" > "URL Generator"
6. Select scopes: `bot`, `applications.commands`
7. Select permissions: `Send Messages`, `Use Slash Commands`, `Mention Everyone`
8. Use the generated URL to invite the bot to your server

### 2. Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in the required values:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_from_step_4
   DISCORD_CLIENT_ID=your_application_id_from_discord
   ALLIANCE_MANAGER_URL=https://www.alliancemanager.dev
   DEFAULT_ALLIANCE_SLUG=your-alliance-slug
   RAID_ALERT_CHANNEL_ID=your_discord_channel_id
   ```

### 3. Installation
```bash
# Install dependencies
npm install

# Deploy slash commands to Discord
node deploy-commands.js

# Start the bot
npm start
```

## Configuration

### Environment Variables

- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - Your Discord application ID
- `ALLIANCE_MANAGER_URL` - URL of your Alliance Manager instance
- `DEFAULT_ALLIANCE_SLUG` - Your alliance slug for API calls
- `RAID_ALERT_CHANNEL_ID` - Discord channel ID for raid alerts
- `CHECK_INTERVAL_MINUTES` - How often to check for new wars (default: 5)
- `ENABLE_AUTO_ALERTS` - Enable/disable automatic monitoring (default: true)

### Getting Discord Channel IDs
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on the channel and select "Copy ID"

## Commands

### `/raids`
Shows current raid status with details about active defensive wars.

### `/members` 
Displays alliance member statistics including verified vs unverified counts.

### `/sync`
Manually triggers a sync with the Politics & War API to refresh war data.

## Deployment

### Option 1: Local/VPS
```bash
npm start
```

### Option 2: Heroku
1. Create a new Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy via Git or GitHub integration

### Option 3: Railway/Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

## Troubleshooting

### Bot not responding to commands
- Ensure bot has proper permissions in your Discord server
- Check that slash commands were deployed: `node deploy-commands.js`
- Verify bot token is correct

### No raid alerts
- Check `RAID_ALERT_CHANNEL_ID` is correct
- Ensure bot can send messages in that channel
- Verify `ENABLE_AUTO_ALERTS=true` in environment

### API errors
- Confirm `ALLIANCE_MANAGER_URL` is correct
- Check that your alliance has the war module enabled
- Verify alliance slug is correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
