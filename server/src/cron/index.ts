import cron from 'node-cron'
import { fetchAndSaveMatches } from '../services/matchFetcher.js'
import { sendReminders } from '../services/reminders.js'
import { runHealthCheck } from '../services/healthCheck.js'

export function setupCronJobs(): void {
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Fetching matches...')
    try {
      await fetchAndSaveMatches()
    } catch (err) {
      console.error('[CRON] Match fetch error:', err)
    }
  })

  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Sending reminders...')
    try {
      await sendReminders()
    } catch (err) {
      console.error('[CRON] Reminder error:', err)
    }
  })

  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Running health check...')
    try {
      await runHealthCheck()
    } catch (err) {
      console.error('[CRON] Health check error:', err)
    }
  })

  console.log('Cron jobs scheduled:')
  console.log('  - Match fetch: every 6 hours')
  console.log('  - Reminders: every 30 minutes')
  console.log('  - Health check: every 5 minutes')
}
