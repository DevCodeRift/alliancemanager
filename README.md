# Alliance Manager

A comprehensive web application for Politics & War alliance management with integrated Discord bot support.

## 🏗️ **Architecture**

- **Web Application**: Next.js + TypeScript frontend with API routes (deployed on Vercel)
- **Discord Bot**: Node.js Discord bot for real-time alliance management (deployed on Railway/Render)
- **Database**: Shared Neon PostgreSQL database with Prisma ORM
- **Authentication**: Discord OAuth integration via NextAuth

## 🚀 **Features**

### **Web Application**
- **Alliance Management**: Member tracking, role management, and administration
- **War Module**: Real-time raid alerts and defensive war monitoring
- **Discord Integration**: Configure Discord bot settings through web interface
- **OS-Style UI**: Window-based interface with alliance-specific theming

### **Discord Bot**
- **Slash Commands**: `/raids`, `/members`, `/sync` for alliance information
- **Automated Monitoring**: Real-time raid alerts posted to Discord channels
- **Multi-Alliance Support**: Single bot instance supports multiple alliances
- **Dynamic Configuration**: Settings managed through web application

## 🏃 **Quick Start**

### **Web Application (Local Development)**
```bash
npm install
npm run dev
```

### **Discord Bot (Local Development)**
```bash
cd discord-bot
npm install
cp .env.example .env
# Edit .env with your Discord bot token
npm start
```

## 🌐 **Deployment**

### **Web App (Vercel)**
1. Connect repository to Vercel
2. Vercel auto-detects Next.js and deploys
3. Add environment variables (see below)

### **Discord Bot (Railway/Render)**
See [DISCORD_BOT_DEPLOYMENT.md](./DISCORD_BOT_DEPLOYMENT.md) for detailed instructions

## 🔑 **Environment Variables**

### **Web Application (.env)**

## Discord-only auth setup

1. Create a Discord application at https://discord.com/developers/applications and add an OAuth2 client. Set the following Redirect URIs in the Discord app settings:
	- https://www.alliancemanager.dev/api/auth/callback/discord
	- https://alliancemanager.vercel.app/api/auth/callback/discord
	- http://localhost:3000/api/auth/callback/discord (for local dev)
2. Add the following environment variables to Vercel (or a local .env during dev):
	- DISCORD_CLIENT_ID
	- DISCORD_CLIENT_SECRET
	- NEXTAUTH_URL (e.g. https://www.alliancemanager.dev or http://localhost:3000)
	- NEXTAUTH_SECRET (a long random string)
	- DATABASE_URL (your Neon Postgres connection string)
3. Install dependencies and generate Prisma client locally:

```powershell
npm install
npm install prisma @prisma/client next-auth @next-auth/prisma-adapter
npx prisma generate
npx prisma db push
```

4. Run locally: npm run dev — NextAuth will expose signin at /api/auth/signin and will redirect back to /api/auth/callback/discord.

