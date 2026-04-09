import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Create a league
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'League name is required' })

  try {
    const pool = getPool()
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const result = await pool.query(
      'INSERT INTO leagues (name, code, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, code, req.userId]
    )

    const league = result.rows[0]

    // Auto-join creator
    await pool.query(
      'INSERT INTO league_members (league_id, user_id) VALUES ($1, $2)',
      [league.id, req.userId]
    )

    res.status(201).json(league)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Join a league by code
router.post('/join', authMiddleware, async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'League code is required' })

  try {
    const pool = getPool()
    const league = await pool.query(
      'SELECT * FROM leagues WHERE code = $1',
      [code.toUpperCase()]
    )

    if (league.rows.length === 0) {
      return res.status(404).json({ error: 'League not found' })
    }

    const leagueId = league.rows[0].id

    // Check if already a member
    const existing = await pool.query(
      'SELECT * FROM league_members WHERE league_id = $1 AND user_id = $2',
      [leagueId, req.userId]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this league' })
    }

    await pool.query(
      'INSERT INTO league_members (league_id, user_id) VALUES ($1, $2)',
      [leagueId, req.userId]
    )

    res.json({ message: 'Joined league successfully', league: league.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get user's leagues
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(
      `SELECT l.*, 
       COUNT(lm2.user_id) as member_count,
       COALESCE(SUM(s.points), 0) as user_points
       FROM leagues l
       JOIN league_members lm ON l.id = lm.league_id
       LEFT JOIN league_members lm2 ON l.id = lm2.league_id
       LEFT JOIN scores s ON s.user_id = $1
       WHERE lm.user_id = $1
       GROUP BY l.id`,
      [req.userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get league standings
router.get('/:id/standings', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(
      `SELECT u.id, u.username,
       COALESCE(SUM(s.points), 0) as total_points
       FROM league_members lm
       JOIN users u ON lm.user_id = u.id
       LEFT JOIN scores s ON u.id = s.user_id
       WHERE lm.league_id = $1
       GROUP BY u.id, u.username
       ORDER BY total_points DESC`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router