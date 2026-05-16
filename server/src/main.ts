import express from 'express'
import cors from 'cors'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { setupCronJobs } from './cron/index.js'
import { cronRoutes } from './routes/cron.js'
import { telegramRoutes } from './routes/telegram.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''

let supabase: SupabaseClient

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
  console.log('Supabase client initialized.')
} else {
  console.warn('WARNING: SUPABASE_URL and/or SUPABASE_SERVICE_KEY not set. Server will start but DB operations will fail.')
  supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === 'from') {
        return () => ({
          select: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        })
      }
      return () => ({})
    }
  })
}

export { supabase }

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/cron', cronRoutes)
app.use('/api/telegram', telegramRoutes)

setupCronJobs()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
