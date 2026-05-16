import { Router } from 'express'
import {
  getSheetMatches,
  getSheetStreams,
  addMatchToSheet,
  getSheetStreamsByMatchId,
} from '../services/sheetdb.js'
import type { SheetMatch } from '../services/sheetdb.js'

export const sheetdbRoutes = Router()

sheetdbRoutes.get('/matches', async (_req, res) => {
  try {
    const matches = await getSheetMatches()
    res.json({ data: matches })
  } catch (err) {
    console.error('SheetDB matches error:', err)
    res.status(500).json({ error: 'Failed to fetch sheet matches' })
  }
})

sheetdbRoutes.get('/streams', async (_req, res) => {
  try {
    const streams = await getSheetStreams()
    res.json({ data: streams })
  } catch (err) {
    console.error('SheetDB streams error:', err)
    res.status(500).json({ error: 'Failed to fetch sheet streams' })
  }
})

sheetdbRoutes.get('/streams/:matchId', async (req, res) => {
  try {
    const streams = await getSheetStreamsByMatchId(req.params.matchId)
    res.json({ data: streams })
  } catch (err) {
    console.error('SheetDB streams by match error:', err)
    res.status(500).json({ error: 'Failed to fetch sheet streams' })
  }
})

sheetdbRoutes.post('/matches', async (req, res) => {
  try {
    const match = req.body as SheetMatch
    if (!match.Team1_Name || !match.Team2_Name || !match.Match_ID) {
      res.status(400).json({ error: 'Team1_Name, Team2_Name, and Match_ID are required' })
      return
    }
    await addMatchToSheet(match)
    res.json({ success: true, message: 'Match added to Google Sheet' })
  } catch (err) {
    console.error('SheetDB add match error:', err)
    res.status(500).json({ error: (err as Error).message })
  }
})
