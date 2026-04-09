import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { getSessions, getSessionResults, getDrivers, getMeetings } from '../services/openF1.js'

const router = express.Router()

// Get all meetings (race weekends) for a given year
router.get('/meetings', authMiddleware, async (req, res) => {
  try {
    const year = req.query.year || 2024
    const data = await getMeetings(year)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch meetings' })
  }
})

// Get all sessions for a given year
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const year = req.query.year || 2024
    const data = await getSessions(year)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

// Get results for a specific session
router.get('/results/:sessionKey', authMiddleware, async (req, res) => {
  try {
    const data = await getSessionResults(req.params.sessionKey)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

// Get drivers for a specific session
router.get('/drivers/:sessionKey', authMiddleware, async (req, res) => {
  try {
    const data = await getDrivers(req.params.sessionKey)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch drivers' })
  }
})

export default router