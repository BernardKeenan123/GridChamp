import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPool } from '../db/index.js'

const router = express.Router()

const pool = getPool()

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already in use' })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, password_hash]
    )

    const user = result.rows[0]
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({ token, user: { id: user.id, username: user.username } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router