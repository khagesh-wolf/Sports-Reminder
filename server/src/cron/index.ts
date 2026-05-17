import cron from 'node-cron'
import { fetchAndSaveMatches } from '../services/matchFetcher.js'
import { sendReminders } from '../services/reminders.js'

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

  console.log('Cron jobs scheduled:')
  console.log('  - Match fetch: every 6 hours')
  console.log('  - Reminders: every 30 minutes')
}
