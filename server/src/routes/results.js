import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'
import { findSession, getSessionResults, getDrivers } from '../services/openF1.js'

const router = express.Router()

// Minimum drivers expected in a valid final result
// If OpenF1 returns fewer than this, the session is still in progress
const MIN_DRIVERS_FOR_FINAL = 15

router.get('/:sessionId', authMiddleware, async (req, res) => {
  const pool = getPool()
  const { sessionId } = req.params

  try {
    // Check if we already have results stored in DB — fastest path
    const existing = await pool.query(
      'SELECT * FROM results WHERE session_id = $1 ORDER BY position ASC',
      [sessionId]
    )

    if (existing.rows.length > 0) {
      return res.json({ results: existing.rows, source: 'database' })
    }

    // Fetch session details
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    )

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const session = sessionResult.rows[0]
    const now = new Date()
    const sessionTime = new Date(session.scheduled_at)

    // Session hasn't started yet — don't bother hitting OpenF1
    if (now < sessionTime) {
      return res.json({
        results: [],
        source: 'pending',
        message: "This session hasn't started yet."
      })
    }

    // Session started but may not be finished — check if enough time has passed
    // Most F1 sessions finish within 3 hours of their scheduled start
    const hoursElapsed = (now - sessionTime) / (1000 * 60 * 60)
    if (hoursElapsed < 1.5) {
      return res.json({
        results: [],
        source: 'pending',
        message: 'Session is likely still in progress. Check back once it\'s finished.'
      })
    }

    // Enough time has passed — try OpenF1
    let sessionKey = session.session_key

    if (!sessionKey) {
      let openF1Session = null
      const year = new Date(session.scheduled_at).getFullYear()

      try {
        openF1Session = await findSession(session.race_name, session.session_type, year)
      } catch (err) {
        console.error('OpenF1 findSession failed:', err.message)
      }

      if (!openF1Session) {
        return res.json({
          results: [],
          source: 'pending',
          message: 'Results not published yet. OpenF1 usually updates within 30–60 minutes of the session ending.'
        })
      }

      sessionKey = openF1Session.session_key
      await pool.query(
        'UPDATE sessions SET session_key = $1 WHERE id = $2',
        [sessionKey, sessionId]
      )
    }

    // Fetch position data and drivers from OpenF1
    let positionData, driverData
    try {
      ;[positionData, driverData] = await Promise.all([
        getSessionResults(sessionKey),
        getDrivers(sessionKey),
      ])
    } catch (err) {
      console.error('OpenF1 fetch failed:', err.message)
      return res.json({
        results: [],
        source: 'pending',
        message: 'Could not reach OpenF1. Try again in a few minutes.'
      })
    }

    // If OpenF1 returns too few drivers, session data is incomplete
    if (!positionData || positionData.length < MIN_DRIVERS_FOR_FINAL) {
      return res.json({
        results: [],
        source: 'pending',
        message: 'Results not finalised yet. OpenF1 usually publishes final positions 30–60 minutes after the session ends.'
      })
    }

    // Build driver_number -> name_acronym map
    const numberToCode = {}
    for (const d of driverData) {
      numberToCode[d.driver_number] = d.name_acronym
    }

    const finalResults = positionData.map((entry) => ({
      session_id: parseInt(sessionId),
      position: entry.position,
      driver_code: numberToCode[entry.driver_number] || String(entry.driver_number),
    }))

    // Store results and mark session complete
    for (const r of finalResults) {
      await pool.query(
        'INSERT INTO results (session_id, position, driver_code) VALUES ($1, $2, $3)',
        [r.session_id, r.position, r.driver_code]
      )
    }

    await pool.query(
      'UPDATE sessions SET completed = true WHERE id = $1',
      [sessionId]
    )

    return res.json({ results: finalResults, source: 'openf1' })

  } catch (err) {
    console.error('Results route error:', err)
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

export default router