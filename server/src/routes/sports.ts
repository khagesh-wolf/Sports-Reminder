import { Router } from 'express'

const router = Router()
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3'

router.get('/league/:id', async (req, res) => {
  try {
    const leagueId = req.params.id
    const response = await fetch(`${THESPORTSDB_BASE}/eventsnextleague.php?id=${leagueId}`)
    if (!response.ok) {
      res.status(response.status).json({ events: null })
      return
    }
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Sports proxy error:', err)
    res.status(500).json({ events: null, error: 'Failed to fetch from TheSportsDB' })
  }
})

export const sportsRoutes = router
