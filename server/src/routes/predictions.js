import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// ── Global leaderboard ────────────────────────────────────────────────────────
// Returns all users ranked by total points in descending order
// Requires authentication to prevent public scraping of user data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      `SELECT u.id, u.username, 
       -- Use COALESCE to return 0 instead of null for users with no scores yet
       COALESCE(SUM(s.points), 0) as total_points,
       -- Count distinct sessions predicted rather than total prediction rows
       COUNT(DISTINCT p.session_id) as predictions_made
       FROM users u
       -- LEFT JOIN ensures users with no scores or predictions still appear
       LEFT JOIN scores s ON u.id = s.user_id
       LEFT JOIN predictions p ON u.id = p.user_id
       GROUP BY u.id, u.username
       ORDER BY total_points DESC`
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router