# Alliance Manager - Discord Bot Deployment Guide

## 🏗️ **Hybrid Architecture**

This project uses a **monorepo approach** with **separate deployment targets**:

- **Web App (Vercel)**: Next.js application with API routes
- **Discord Bot (Railway/Render)**: Long-running Discord bot process
- **Shared Database**: Both connect to the same Neon PostgreSQL database

## 🚀 **Deployment Options**

### **Option 1: Railway (Recommended)**

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Set Root Directory**: Configure Railway to use the entire repo
3. **Set Start Command**: `cd discord-bot && npm install && npm start`
4. **Environment Variables**: Add Discord bot token and database URL
5. **Deploy**: Railway will automatically deploy on Git pushes

**Railway Environment Variables:**
```bash
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id
ALLIANCE_MANAGER_URL=https://your-vercel-app.vercel.app
DATABASE_URL=your_neon_postgres_url
CHECK_INTERVAL_MINUTES=5
```

### **Option 2: Render.com**

1. **New Web Service**: Create a new web service from your repo
2. **Build Command**: `cd discord-bot && npm install`
3. **Start Command**: `cd discord-bot && npm start`
4. **Environment**: Add the same variables as above
5. **Deploy**: Render will build and deploy automatically

### **Option 3: Docker (Any Platform)**

```dockerfile
# Dockerfile for Discord Bot
FROM node:18-alpine
WORKDIR /app
COPY discord-bot/package*.json ./
RUN npm install
COPY discord-bot/ ./
CMD ["npm", "start"]
```

## 🔧 **Development Workflow**

### **Local Development**
```bash
# Terminal 1: Web App (Vercel)
npm run dev

# Terminal 2: Discord Bot
cd discord-bot
npm install
npm start
```

### **Making Changes**
1. **Web App Changes**: Commit and push - Vercel auto-deploys
2. **Bot Changes**: Commit and push - Railway/Render auto-deploys
3. **Database Changes**: Run Prisma migrations on both

### **Coordinated Development**
- **Single Repository**: Easy to work on both projects simultaneously
- **Shared Database Schema**: Prisma schema affects both projects
- **API Integration**: Bot calls web app APIs for configuration
- **Version Control**: Both projects versioned together

## 📁 **Project Structure**

```
alliancemanager/
├── pages/                  # Next.js web app
├── src/                   # Shared utilities and UI
├── prisma/                # Database schema (shared)
├── discord-bot/           # Discord bot (separate deployment)
│   ├── index.js          # Bot main file
│   ├── package.json      # Bot dependencies
│   └── .env.example      # Bot environment template
├── .vercelignore         # Exclude bot from Vercel
├── railway.json          # Railway configuration
└── README.md

```

## 🔄 **Benefits of This Approach**

✅ **Single Repository**: Easy to manage and develop both projects  
✅ **Separate Deployments**: Each service deployed to optimal platform  
✅ **Shared Database**: No data synchronization issues  
✅ **Independent Scaling**: Web app and bot scale separately  
✅ **Coordinated Releases**: Version both projects together  
✅ **AI Assistant Friendly**: Easy to work on both codebases simultaneously  

## 🐛 **Troubleshooting**

### **Vercel Issues**
- Check `.vercelignore` excludes `discord-bot/`
- Ensure no Discord bot imports in web app code

### **Railway/Render Issues**
- Verify start command includes `cd discord-bot`
- Check environment variables are set
- Monitor logs for connection issues

### **Database Connectivity**
- Ensure both services use same DATABASE_URL
- Check Prisma client generation in both environments
- Verify Neon database allows connections from both platforms
