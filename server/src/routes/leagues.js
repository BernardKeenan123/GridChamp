import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Create a league
// Creates a new league with optional settings and auto-joins the creator
router.post('/', authMiddleware, async (req, res) => {
  const { name, prediction_slots, fastest_lap, driver_of_day, pole_bonus } = req.body
  if (!name) return res.status(400).json({ error: 'League name is required' })

  try {
    const pool = getPool()

    // Generate a random 6-character invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const result = await pool.query(
      `INSERT INTO leagues (name, code, created_by, prediction_slots, fastest_lap, driver_of_day, pole_bonus)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        code,
        req.userId,
        prediction_slots || 10,
        fastest_lap || false,
        driver_of_day || false,
        pole_bonus || false,
      ]
    )

    const league = result.rows[0]

    // Auto-join the creator as a member
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

// Join a league by invite code
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

// Get current user's leagues
// Returns all leagues the user is a member of with member count and settings
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      `SELECT l.*,
       COUNT(lm2.user_id) as member_count
       FROM leagues l
       JOIN league_members lm ON l.id = lm.league_id
       LEFT JOIN league_members lm2 ON l.id = lm2.league_id
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

// Get a single league by ID
// Returns full league details including settings — used by predict page
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      `SELECT l.*, COUNT(lm.user_id) as member_count
       FROM leagues l
       LEFT JOIN league_members lm ON l.id = lm.league_id
       WHERE l.id = $1
       GROUP BY l.id`,
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'League not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

//Get league standings
// Returns members ranked by their league-specific points (league_id = this league)
router.get('/:id/standings', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      `SELECT u.id, u.username,
       COALESCE(SUM(s.points), 0) as total_points,
       COUNT(DISTINCT p.session_id) as predictions_made
       FROM league_members lm
       JOIN users u ON lm.user_id = u.id
       LEFT JOIN scores s ON u.id = s.user_id AND s.league_id = $1
       LEFT JOIN predictions p ON u.id = p.user_id AND p.league_id = $1
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

// Update league settings
// Only the league creator can update settings
router.patch('/:id', authMiddleware, async (req, res) => {
  const { prediction_slots, fastest_lap, driver_of_day, pole_bonus } = req.body

  try {
    const pool = getPool()

    // Check the user is the league creator
    const league = await pool.query(
      'SELECT * FROM leagues WHERE id = $1',
      [req.params.id]
    )

    if (league.rows.length === 0) {
      return res.status(404).json({ error: 'League not found' })
    }

    if (league.rows[0].created_by !== req.userId) {
      return res.status(403).json({ error: 'Only the league creator can update settings' })
    }

    const result = await pool.query(
      `UPDATE leagues
       SET prediction_slots = COALESCE($1, prediction_slots),
           fastest_lap = COALESCE($2, fastest_lap),
           driver_of_day = COALESCE($3, driver_of_day),
           pole_bonus = COALESCE($4, pole_bonus)
       WHERE id = $5
       RETURNING *`,
      [prediction_slots, fastest_lap, driver_of_day, pole_bonus, req.params.id]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router