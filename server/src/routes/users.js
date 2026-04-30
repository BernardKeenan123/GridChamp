import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Get current user profile
// Returns safe profile fields only, password hash is never returned
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      'SELECT id, username, created_at FROM users WHERE id = $1',
      [req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Search users by username
// Returns all users when query is empty, used to populate league member dropdowns
// Filters by query string when provided, always excludes the requesting user
router.get('/search', authMiddleware, async (req, res) => {
  const { q } = req.query

  try {
    const pool = getPool()

    let result
    if (!q || q.length === 0) {
      result = await pool.query(
        `SELECT id, username FROM users 
         WHERE id != $1 
         ORDER BY username ASC`,
        [req.userId]
      )
    } else {
      result = await pool.query(
        `SELECT id, username FROM users 
         WHERE username ILIKE $1 AND id != $2 
         ORDER BY username ASC 
         LIMIT 10`,
        [`%${q}%`, req.userId]
      )
    }

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router