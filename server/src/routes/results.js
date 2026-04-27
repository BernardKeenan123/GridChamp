import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'
import { findSession, getSessionResults, getDrivers } from '../services/openF1.js'

const router = express.Router()

// Get results for a session
// If results are already stored in DB, return them directly
// If not, auto-lookup on OpenF1, store them, then return
router.get('/:sessionId', authMiddleware, async (req, res) => {
  const pool = getPool()
  const { sessionId } = req.params

  try {
    // Check if we already have results stored
    const existing = await pool.query(
      'SELECT * FROM results WHERE session_id = $1 ORDER BY position ASC',
      [sessionId]
    )

    if (existing.rows.length > 0) {
      return res.json({ results: existing.rows, source: 'database' })
    }

    // No stored results — fetch session details from our DB
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    )

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const session = sessionResult.rows[0]
    const year = new Date(session.scheduled_at).getFullYear()

    // Try to find the session on OpenF1
    let sessionKey = session.session_key

    if (!sessionKey) {
      const openF1Session = await findSession(session.race_name, session.session_type, year)
      if (!openF1Session) {
        return res.json({ results: [], source: 'pending' })
      }
      sessionKey = openF1Session.session_key

      // Store the key for future requests
      await pool.query(
        'UPDATE sessions SET session_key = $1 WHERE id = $2',
        [sessionKey, sessionId]
      )
    }

    // Fetch results and drivers from OpenF1
    const [positionData, driverData] = await Promise.all([
      getSessionResults(sessionKey),
      getDrivers(sessionKey),
    ])

    // Build driver_number -> name_acronym map
    const numberToCode = {}
    for (const d of driverData) {
      numberToCode[d.driver_number] = d.name_acronym
    }

    // Build final results array
    const finalResults = positionData.map((entry) => ({
      session_id: parseInt(sessionId),
      position: entry.position,
      driver_code: numberToCode[entry.driver_number] || String(entry.driver_number),
    }))

    // Store results in DB
    for (const r of finalResults) {
      await pool.query(
        'INSERT INTO results (session_id, position, driver_code) VALUES ($1, $2, $3)',
        [r.session_id, r.position, r.driver_code]
      )
    }

    // Mark session as completed
    await pool.query(
      'UPDATE sessions SET completed = true WHERE id = $1',
      [sessionId]
    )

    res.json({ results: finalResults, source: 'openf1' })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

export default router