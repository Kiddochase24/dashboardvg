# VaultGuard — Web3 Wallet Security Dashboard

## Overview
A glassmorphic Web3 wallet security dashboard built with React, TypeScript, and Vite. Dark UI with purple/cyan theme, glassmorphic panels, and animated effects.

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js
- **Routing**: wouter
- **Data**: In-memory (sessionStorage for wallet state)

## Pages

- `/` — ConnectWallet landing page: wallet address input, feature tip card, Gas Magic Tool promo banner
- `/dashboard` — Main dashboard: feature grid, admin panel, device management, gas tool, validation flow

## Key Features

1. **Glassmorphic Connect Page** — Enter wallet address, view all feature tips, connect via WalletConnect v3
2. **Dashboard** — 7 feature cards (locked until validation): Account Recovery, Revoke Approvals, DApp Connection, Gas Magic Tool, Validate Wallet, Fix DApp Issues, Admin Control
3. **Validation Modal** — 2-step modal: explains why verification needed → recovery phrase/private key input form
4. **Admin Device Panel** — Shows all logged-in devices, remove unauthorized ones
5. **Gas Magic Tool** — Scans gas fees, claim rewards panel
6. **Revoke Approvals Panel** — Lists active token approvals with revoke actions

## Visual Design

- Dark web3 theme: `hsl(222, 47%, 4%)` background
- Primary: violet `hsl(262, 83%, 58%)`
- Accent: cyan `hsl(196, 100%, 50%)`
- Custom CSS: `.glass`, `.glass-heavy`, `.glass-card`, `.glow-primary`, `.glow-accent`, `.gradient-text`, `.mesh-bg`
- Animations: floating particles, scan line, pulse glow, shimmer

## File Structure

```
client/src/
  pages/
    connect-wallet.tsx    - Landing/connect page
    dashboard.tsx         - Main dashboard
  components/
    validation-modal.tsx  - Ownership verification modal
    ui/                   - shadcn components
  index.css               - Dark web3 theme + glass utilities
```

## Running

The "Start application" workflow runs `npm run dev` which starts both the Express backend and Vite frontend on the same port.
