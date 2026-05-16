import { Router } from 'express'
import { sendTelegramMessage } from '../services/telegram.js'

export const telegramRoutes = Router()

telegramRoutes.post('/test', async (req, res) => {
  const { message } = req.body
  if (!message) {
    res.status(400).json({ error: 'Message required' })
    return
  }

  try {
    const success = await sendTelegramMessage(message)
    res.json({ success })
  } catch (err) {
    console.error('Telegram test error:', err)
    res.status(500).json({ error: 'Failed to send message' })
  }
})
