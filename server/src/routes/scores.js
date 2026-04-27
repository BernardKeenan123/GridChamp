import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Get current user's total score
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM scores WHERE user_id = $1 AND league_id IS NULL',
      [req.userId]
    )
    res.json({ total: result.rows[0].total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all scores for a specific session
// Optionally filtered by league_id — defaults to global (league_id IS NULL)
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const { league_id } = req.query

    let query
    let params

    if (league_id) {
      query = `SELECT s.points, u.username
               FROM scores s
               JOIN users u ON s.user_id = u.id
               WHERE s.session_id = $1 AND s.league_id = $2
               ORDER BY s.points DESC`
      params = [req.params.sessionId, league_id]
    } else {
      query = `SELECT s.points, u.username
               FROM scores s
               JOIN users u ON s.user_id = u.id
               WHERE s.session_id = $1 AND s.league_id IS NULL
               ORDER BY s.points DESC`
      params = [req.params.sessionId]
    }

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router