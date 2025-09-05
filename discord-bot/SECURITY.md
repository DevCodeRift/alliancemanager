# 🔒 Discord Bot Security Notice

## ⚠️ **IMPORTANT: Environment Variables**

1. **NEVER commit `.env` files**: The `.env` file contains sensitive tokens and should never be pushed to Git
2. **Use `.env.example`**: Copy `.env.example` to `.env` and fill in your real values
3. **Keep tokens secret**: Discord bot tokens are like passwords - never share them publicly

## 🔑 **Setup Instructions**

```bash
# Copy the example file
cp .env.example .env

# Edit with your real values
nano .env  # or use your preferred editor
```

## 🚨 **If You Accidentally Commit Secrets**

1. **Regenerate Discord Bot Token**: Go to Discord Developer Portal and regenerate your bot token
2. **Update Environment Variables**: Update your deployment platform with new token
3. **Git History**: Consider using `git filter-branch` or BFG Repo-Cleaner to remove secrets from Git history

## ✅ **Safe to Commit**
- `.env.example` (contains only placeholder values)
- `package.json`
- `index.js` and other code files

## ❌ **Never Commit**
- `.env` (contains real tokens and passwords)
- Any files with actual credentials
