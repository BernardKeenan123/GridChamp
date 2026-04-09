import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPool } from '../db/index.js'

const router = express.Router()

// Get the database connection pool
const pool = getPool()

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body

  // Validate that all required fields are present
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // Check if the email or username is already registered
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already in use' })
    }

    // Hash the password with a salt round of 10 before storing
    // bcrypt ensures passwords are never stored as plain text
    const password_hash = await bcrypt.hash(password, 10)

    // Insert the new user into the database and return their details
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    )

    const user = result.rows[0]

    // Sign a JWT token with the user's ID, valid for 7 days
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // Return the token and user details to the client
    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  // Validate that both fields are present
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // Look up the user by email address
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    // Return a generic error to avoid revealing whether the email exists
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Compare the provided password against the stored hash
    const validPassword = await bcrypt.compare(password, user.password_hash)

    // Return the same generic error for wrong password to prevent user enumeration
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Sign a JWT token with the user's ID, valid for 7 days
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // Return the token and safe user details (excluding password hash)
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router