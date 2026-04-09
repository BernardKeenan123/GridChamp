import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'
import { scoreSession } from '../services/scoring.js'

const router = express.Router()

// Trigger scoring for a completed session
// In production this would be called automatically after a session ends
router.post('/:id/score', authMiddleware, async (req, res) => {
  try {
    const summary = await scoreSession(req.params.id)
    res.json({ message: 'Session scored successfully', scores: summary })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})


// ── Get all sessions ──────────────────────────────────────────────────────────
// Returns all race weekend sessions ordered by scheduled date ascending
// Used on the dashboard to display upcoming sessions to the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      // Order by scheduled_at ASC so the next upcoming session appears first
      'SELECT * FROM sessions ORDER BY scheduled_at ASC'
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Get a single session by ID ────────────────────────────────────────────────
// Returns full details for a specific session
// Used on the predict and results pages to display session info
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [req.params.id]
    )

    // Return 404 if no session exists with the given ID
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router