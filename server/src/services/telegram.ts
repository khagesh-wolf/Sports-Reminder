import { supabase } from '../main.js'

async function getBotConfig(): Promise<{ token: string; chatId: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (token && chatId) return { token, chatId }

  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'telegram_chat_id'])

  if (!data) return null

  const settings: Record<string, string> = {}
  for (const row of data) settings[row.key] = row.value || ''

  if (settings.telegram_bot_token && settings.telegram_chat_id) {
    return { token: settings.telegram_bot_token, chatId: settings.telegram_chat_id }
  }

  return null
}

export async function sendTelegramMessage(message: string): Promise<boolean> {
  const config = await getBotConfig()
  if (!config) {
    console.warn('Telegram not configured')
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${config.token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Telegram send failed:', err)
      return false
    }

    return true
  } catch (err) {
    console.error('Telegram error:', err)
    return false
  }
}

export async function logNotification(
  type: string,
  message: string,
  matchId?: string,
  telegramSent = false
): Promise<void> {
  await supabase.from('notifications').insert({
    type,
    message,
    match_id: matchId || null,
    sent: true,
    sent_at: new Date().toISOString(),
    telegram_sent: telegramSent,
  })
}
