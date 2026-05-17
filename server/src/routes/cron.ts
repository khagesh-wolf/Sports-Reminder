import { Router } from 'express'
import { fetchAndSaveMatches } from '../services/matchFetcher.js'
import { sendReminders } from '../services/reminders.js'

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
