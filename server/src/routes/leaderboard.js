import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Global leaderboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(
      `SELECT u.id, u.username, 
       COALESCE(SUM(s.points), 0) as total_points,
       COUNT(DISTINCT p.session_id) as predictions_made
       FROM users u
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