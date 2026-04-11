# Environment Variables Setup Guide

This guide explains how to set up environment variables for the VaultGuard wallet dashboard.

## Required Variables

### 1. WalletConnect Project ID (Client-Side)
- **Variable Name**: `VITE_WALLETCONNECT_PROJECT_ID`
- **Where to Get**: https://cloud.walletconnect.com/
- **Purpose**: Enables wallet connection via WalletConnect protocol
- **Steps**:
  1. Go to https://cloud.walletconnect.cdcom/
  2. Sign up/Login
  3. Create a new project
  4. Copy the "Project ID"
  5. Add to Netlify environment variables

### 2. DeBankAPI Key (Client-Side)
- **Variable Name**: `VITE_DEBANK_API_KEY`
- **Where to Get**: https://debank.com/ (register for free API)
- **Purpose**: Fetches user portfolio balance and token holdings
- **Features**:
  - Total portfolio value in USD
  - Individual token holdings across chains
  - Chain-specific balance breakdown
  - Displays on dashboard when wallet connects
- **Steps**:
  1. Visit https://debank.com/
  2. Register for a free account
  3. Go to API/Developer settings
  4. Generate an API key
  5. Add to Netlify environment variables

### 3. Server-Side Variables (if deploying server separately)
- `WALLETCONNECT_PROJECT_ID` - Same as client-side
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for notifications
- `TELEGRAM_CHAT_ID` - Telegram chat ID to receive notifications

## Setting Up in Netlify

1. **Go to Netlify Site Settings**
   - Open your site dashboard
   - Go to `Settings` → `Build & deploy` → `Environment`

2. **Add Environment Variables**
   - Click `Edit variables`
   - Add each variable with its value:
     ```
     VITE_WALLETCONNECT_PROJECT_ID = [your-project-id]
     VITE_DEBANK_API_KEY = [your-api-key]
     ```

3. **Redeploy**
   - Go to `Deploys` section
   - Click `Trigger deploy` or push to your Git branch
   - Netlify will rebuild with the new variables

## Local Development

Create a `.env.local` file in the `client/` folder:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_DEBANK_API_KEY=your_api_key
```

The `.env.example` file shows the format. Never commit `.env.local` to Git!

## How It Works

### When User Connects Wallet:

1. **Native Balance** - Fetched from blockchain RPC
   - ETH balance via `eth_getBalance` (Ethereum)
   - SOL balance via Solana RPC

2. **Portfolio Balance** - Fetched from DeBankAPI
   - Shows total USD value of all holdings
   - Lists top 5 token holdings
   - Shows balance breakdown by blockchain
   - Updates in real-time

### Dashboard Display:

- **Live Balance**: Native token balance (ETH/SOL)
- **Portfolio Value**: Total USD value of all assets (DeBankAPI)
- **Portfolio Assets Section**: 
  - Holdings count
  - Supported chains
  - Top holdings with values
  - Chain balance breakdown
