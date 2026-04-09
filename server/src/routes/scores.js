import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// ── Get current user's total score ────────────────────────────────────────────
// Returns the sum of all points earned by the logged in user across all sessions
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      // COALESCE returns 0 instead of null if the user has no scores yet
      'SELECT COALESCE(SUM(points), 0) as total FROM scores WHERE user_id = $1',
      [req.userId] // req.userId is set by the auth middleware from the JWT token
    )

    res.json({ total: result.rows[0].total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Get all scores for a specific session ─────────────────────────────────────
// Returns a ranked list of all users and their points for a given session
// Used on the results page to show the session leaderboard
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      `SELECT s.points, u.username 
       FROM scores s 
       -- Join users table to get usernames alongside points
       JOIN users u ON s.user_id = u.id 
       WHERE s.session_id = $1 
       -- Order by points descending to give ranked results
       ORDER BY s.points DESC`,
      [req.params.sessionId]
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router