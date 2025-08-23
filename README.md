# AllianceManager Frontend (scaffold)

This is a minimal Next.js + TypeScript frontend scaffold implementing an "Operating System" style UI (windows, tabs, signup/login) with a theme system using CSS variables so themes can be swapped per-alliance.

Quick start

1. npm install
2. npm run dev

Deploy: This project is ready to deploy to Vercel. Link the repo and Vercel will detect Next.js.

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

