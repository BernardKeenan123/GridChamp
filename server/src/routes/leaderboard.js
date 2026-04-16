import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// ── Global leaderboard ────────────────────────────────────────────────────────
// Returns all users ranked by total global points (league_id IS NULL)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      `SELECT u.id, u.username, 
       COALESCE(SUM(s.points), 0) as total_points,
       COUNT(DISTINCT p.session_id) as predictions_made
       FROM users u
       LEFT JOIN scores s ON s.user_id = u.id AND s.league_id IS NULL
       LEFT JOIN predictions p ON p.user_id = u.id AND p.league_id IS NULL
       GROUP BY u.id, u.username
       ORDER BY total_points DESC`
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})
//Friend leaderboard - Returns all users who share at least one league with the current user
router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      `SELECT DISTINCT u.id, u.username,
       COALESCE(SUM(s.points), 0) as total_points,
       COUNT(DISTINCT p.session_id) as predictions_made
       FROM users u
       -- Find users who share at least one league with the current user
       JOIN league_members lm ON lm.user_id = u.id
       JOIN league_members my_leagues 
         ON my_leagues.league_id = lm.league_id 
         AND my_leagues.user_id = $1
       -- Get their global scores only
       LEFT JOIN scores s ON s.user_id = u.id AND s.league_id IS NULL
       LEFT JOIN predictions p ON p.user_id = u.id AND p.league_id IS NULL
       -- Exclude the current user from the results
       WHERE u.id != $1
       GROUP BY u.id, u.username
       ORDER BY total_points DESC`,
      [req.userId]
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router