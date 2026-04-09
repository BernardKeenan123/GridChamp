import express from 'express'
import { getPool } from '../db/index.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// ── Get current user profile ──────────────────────────────────────────────────
// Returns the logged in user's profile details
// Password hash is deliberately excluded from the SELECT for security
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()

    const result = await pool.query(
      // Only select safe fields - never return the password hash to the client
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.userId] // req.userId is set by the auth middleware from the JWT token
    )

    // This shouldn't happen if the token is valid, but handle it defensively
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router