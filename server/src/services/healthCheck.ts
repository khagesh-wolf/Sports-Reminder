import { supabase } from '../main.js'
import { sendTelegramMessage, logNotification } from './telegram.js'

export async function runHealthCheck(): Promise<{ checked: number; broken: number }> {
  const { data: streams } = await supabase
    .from('streams')
    .select('id, stream_url, stream_type, match_id')

  if (!streams || streams.length === 0) {
    return { checked: 0, broken: 0 }
  }

  let broken = 0

  for (const stream of streams) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(stream.stream_url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'SportsReminder/1.0' },
      })

      clearTimeout(timeout)

      const status = res.ok ? 'active' : 'broken'

      await supabase
        .from('streams')
        .update({ stream_status: status, last_checked: new Date().toISOString() })
        .eq('id', stream.id)

      if (status === 'broken') {
        broken++
        const { data: match } = await supabase
          .from('matches')
          .select('team1, team2')
          .eq('id', stream.match_id)
          .single()

        const matchName = match ? `${match.team1} vs ${match.team2}` : 'Unknown match'
        const msg = `⚠️ <b>Stream Health Check Failed</b>\n\n${matchName}\nURL: ${stream.stream_url.substring(0, 50)}...\nStatus: ${res.status}`

        const sent = await sendTelegramMessage(msg)
        await logNotification('health_check', msg, stream.match_id, sent)
      }
    } catch {
      await supabase
        .from('streams')
        .update({ stream_status: 'broken', last_checked: new Date().toISOString() })
        .eq('id', stream.id)
      broken++
    }
  }

  console.log(`Health check: ${streams.length} checked, ${broken} broken`)
  return { checked: streams.length, broken }
}
