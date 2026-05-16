import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { setupCronJobs } from './cron/index.js'
import { cronRoutes } from './routes/cron.js'
import { telegramRoutes } from './routes/telegram.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('WARNING: SUPABASE_URL and SUPABASE_SERVICE_KEY not set. Server will start but DB operations will fail.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/cron', cronRoutes)
app.use('/api/telegram', telegramRoutes)

setupCronJobs()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
