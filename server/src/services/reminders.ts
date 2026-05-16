import { supabase } from '../main.js'
import { sendTelegramMessage, logNotification } from './telegram.js'

interface ReminderConfig {
  type: string
  settingKey: string
  hoursBeforeMin: number
  hoursBeforeMax: number
  emoji: string
  label: string
}

const REMINDERS: ReminderConfig[] = [
  { type: 'reminder_2d', settingKey: 'reminder_2d_enabled', hoursBeforeMin: 47, hoursBeforeMax: 49, emoji: '📅', label: '2 days' },
  { type: 'reminder_1d', settingKey: 'reminder_1d_enabled', hoursBeforeMin: 23, hoursBeforeMax: 25, emoji: '⏰', label: '1 day' },
  { type: 'reminder_30m', settingKey: 'reminder_30m_enabled', hoursBeforeMin: 0.4, hoursBeforeMax: 0.6, emoji: '🔴', label: '30 minutes' },
]

export async function sendReminders(): Promise<{ sent: number }> {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')

  const config: Record<string, string> = {}
  for (const s of settings || []) config[s.key] = s.value || ''

  const { data: matches } = await supabase
    .from('matches')
    .select('id, team1, team2, league, match_time, stream_added, sport')
    .eq('status', 'upcoming')
    .order('match_time', { ascending: true })

  if (!matches || matches.length === 0) return { sent: 0 }

  let sent = 0
  const now = Date.now()

  for (const match of matches) {
    const matchTime = new Date(match.match_time).getTime()
    const hoursUntil = (matchTime - now) / (1000 * 60 * 60)

    for (const reminder of REMINDERS) {
      if (config[reminder.settingKey] === 'false') continue
      if (hoursUntil < reminder.hoursBeforeMin || hoursUntil > reminder.hoursBeforeMax) continue

      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('match_id', match.id)
        .eq('type', reminder.type)
        .maybeSingle()

      if (existing) continue

      let msg = `${reminder.emoji} <b>Match in ${reminder.label}</b>\n\n`
      msg += `${match.team1} vs ${match.team2}\n`
      msg += `${match.league}\n`
      msg += `Time: ${new Date(match.match_time).toUTCString()}`

      if (!match.stream_added && reminder.type === 'reminder_30m') {
        msg += `\n\n⚠️ <b>No stream link added!</b>\nPlease update the stream link.`
      }

      const telegramSent = await sendTelegramMessage(msg)
      await logNotification(reminder.type, msg, match.id, telegramSent)
      sent++
    }

    if (!match.stream_added) {
      const hoursToMatch = hoursUntil
      if (hoursToMatch > 0 && hoursToMatch < 24) {
        const { data: existingAlert } = await supabase
          .from('notifications')
          .select('id')
          .eq('match_id', match.id)
          .eq('type', 'stream_missing')
          .gte('created_at', new Date(now - 12 * 60 * 60 * 1000).toISOString())
          .maybeSingle()

        if (!existingAlert) {
          const alertMsg = `⚠️ <b>Stream Missing</b>\n\n${match.team1} vs ${match.team2}\n${match.league}\n\nMatch in ${Math.round(hoursToMatch)} hours. No stream link added.`
          const telegramSent = await sendTelegramMessage(alertMsg)
          await logNotification('stream_missing', alertMsg, match.id, telegramSent)
          sent++
        }
      }
    }
  }

  console.log(`Reminders: ${sent} sent`)
  return { sent }
}
