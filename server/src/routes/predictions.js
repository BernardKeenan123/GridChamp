import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// ── Submit predictions for a session ─────────────────────────────────────────
// Accepts an array of predictions and stores them in the database
// Deletes any existing predictions for this user/session before inserting new ones
// so users can update their predictions before the session locks
router.post('/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params
  const { predictions } = req.body

  // Validate that predictions array was provided
  if (!predictions || !Array.isArray(predictions)) {
    return res.status(400).json({ error: 'Predictions must be an array' })
  }

  try {
    const pool = getPool()

    // Check session exists and is not locked
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    )

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.rows[0].locked) {
      return res.status(400).json({ error: 'Session is locked' })
    }

    // Delete existing predictions for this user/session before inserting new ones
    await pool.query(
      'DELETE FROM predictions WHERE user_id = $1 AND session_id = $2',
      [req.userId, sessionId]
    )

    // Insert each prediction into the database
    for (const prediction of predictions) {
      await pool.query(
        'INSERT INTO predictions (user_id, session_id, position, driver_code) VALUES ($1, $2, $3, $4)',
        [req.userId, sessionId, prediction.position, prediction.driver_code]
      )
    }

    res.status(201).json({ message: 'Predictions submitted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Get user's predictions for a session ─────────────────────────────────────
// Returns the logged in user's predictions for a specific session
// Used on the predict page to show existing predictions if the user has already submitted
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      'SELECT * FROM predictions WHERE user_id = $1 AND session_id = $2 ORDER BY position ASC',
      [req.userId, req.params.sessionId]
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router