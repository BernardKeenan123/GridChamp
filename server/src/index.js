import dotenv from 'dotenv'
// Load environment variables from .env file before any other imports
dotenv.config()

import express from 'express'
import cors from 'cors'
import { getPool } from './db/index.js'

// Route imports
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import sessionRoutes from './routes/sessions.js'
import predictionRoutes from './routes/predictions.js'
import scoreRoutes from './routes/scores.js'
import leaderboardRoutes from './routes/leaderboard.js'
import leagueRoutes from './routes/leagues.js'
import openf1Routes from './routes/openf1.js'

const app = express()

// Use PORT from environment variables or fall back to 5000 for local development
const PORT = process.env.PORT || 5000

// Allow cross-origin requests from the React frontend
app.use(cors())

// Parse incoming JSON request bodies
app.use(express.json())

// ── Route registration ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)           // Register and login
app.use('/api/users', userRoutes)          // User profile
app.use('/api/sessions', sessionRoutes)    // Race weekend sessions
app.use('/api/predictions', predictionRoutes) // Submit and retrieve predictions
app.use('/api/scores', scoreRoutes)        // User scores
app.use('/api/leaderboard', leaderboardRoutes) // Global leaderboard
app.use('/api/leagues', leagueRoutes)      // Mini leagues
app.use('/api/openf1', openf1Routes)

// ── Health check endpoint ─────────────────────────────────────────────────────
// Used to verify the API is running and the database connection is active
app.get('/', async (req, res) => {
  try {
    const pool = getPool()
    // Run a minimal query to confirm the database connection is working
    await pool.query('SELECT 1')
    res.json({ message: 'GridChamp API is running', database: 'connected' })
  } catch (err) {
    console.error('Database error:', err)
    res.json({ message: 'GridChamp API is running', database: 'error', error: err.message })
  }
})

// Start the server and listen on the configured port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})