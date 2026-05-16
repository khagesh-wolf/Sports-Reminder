import { Router } from 'express'
import { fetchAndSaveMatches } from '../services/matchFetcher.js'
import { sendReminders } from '../services/reminders.js'
import { runHealthCheck } from '../services/healthCheck.js'

export const cronRoutes = Router()

cronRoutes.post('/fetch-matches', async (_req, res) => {
  try {
    const result = await fetchAndSaveMatches()
    res.json({ message: 'Match fetch complete', ...result })
  } catch (err) {
    console.error('Manual match fetch error:', err)
    res.status(500).json({ error: 'Match fetch failed' })
  }
})

cronRoutes.post('/send-reminders', async (_req, res) => {
  try {
    const result = await sendReminders()
    res.json({ message: 'Reminders sent', ...result })
  } catch (err) {
    console.error('Manual reminder error:', err)
    res.status(500).json({ error: 'Reminder send failed' })
  }
})

cronRoutes.post('/health-check', async (_req, res) => {
  try {
    const result = await runHealthCheck()
    res.json({ message: 'Health check complete', ...result })
  } catch (err) {
    console.error('Manual health check error:', err)
    res.status(500).json({ error: 'Health check failed' })
  }
})
