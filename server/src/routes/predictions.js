import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Submit predictions for a session
// Accepts an array of predictions and an optional league_id
// If league_id is provided, predictions are stored for that league
// If no league_id, predictions are global (null league_id)
router.post('/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params
  const { predictions, league_id, fastest_lap, driver_of_day } = req.body

  if (!predictions || !Array.isArray(predictions)) {
    return res.status(400).json({ error: 'Predictions must be an array' })
  }

  try {
    const pool = getPool()

    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    )

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Use predictions_close_at if set, otherwise fall back to session start time
    const now = new Date()
    const closeAt = session.rows[0].predictions_close_at || session.rows[0].scheduled_at
    const closeTime = new Date(closeAt)
    if (now > closeTime) {
      return res.status(400).json({ error: 'Predictions are closed for this session' })
    }

    // If league_id provided, verify the user is a member of that league
    if (league_id) {
      const membership = await pool.query(
        'SELECT * FROM league_members WHERE league_id = $1 AND user_id = $2',
        [league_id, req.userId]
      )
      if (membership.rows.length === 0) {
        return res.status(403).json({ error: 'You are not a member of this league' })
      }
    }

    // Delete existing predictions before inserting to allow updates before lock
    await pool.query(
      'DELETE FROM predictions WHERE user_id = $1 AND session_id = $2 AND league_id IS NOT DISTINCT FROM $3',
      [req.userId, sessionId, league_id || null]
    )

    // Insert each position prediction
    for (const prediction of predictions) {
      await pool.query(
        `INSERT INTO predictions (user_id, session_id, position, driver_code, league_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.userId, sessionId, prediction.position, prediction.driver_code, league_id || null]
      )
    }

    // Insert fastest lap prediction if provided
    if (fastest_lap) {
      await pool.query(
        `INSERT INTO predictions (user_id, session_id, position, driver_code, league_id, prediction_type)
         VALUES ($1, $2, NULL, $3, $4, 'fastest_lap')`,
        [req.userId, sessionId, fastest_lap, league_id || null]
      )
    }

    // Insert driver of the day prediction if provided
    if (driver_of_day) {
      await pool.query(
        `INSERT INTO predictions (user_id, session_id, position, driver_code, league_id, prediction_type)
         VALUES ($1, $2, NULL, $3, $4, 'driver_of_day')`,
        [req.userId, sessionId, driver_of_day, league_id || null]
      )
    }

    res.status(201).json({ message: 'Predictions submitted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get user's predictions for a session, optionally filtered by league
// If no league_id query param, returns global predictions
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const { league_id } = req.query

    const result = await pool.query(
      `SELECT * FROM predictions 
       WHERE user_id = $1 
       AND session_id = $2 
       AND league_id IS NOT DISTINCT FROM $3
       ORDER BY position ASC NULLS LAST`,
      [req.userId, req.params.sessionId, league_id ? parseInt(league_id) : null]
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router