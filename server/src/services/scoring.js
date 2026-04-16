import { getPool } from '../db/index.js'
import { getSessionResults, getDrivers } from './openF1.js'

// Standard F1 points system — familiar to all F1 fans
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

// Award points only for exact position predictions
function calculatePoints(predictedPos, actualPos) {
  if (predictedPos === actualPos) {
    return F1_POINTS[actualPos - 1] || 0
  }
  return 0
}

/* Main scoring function - fetches results from OpenF1, scores all predictions 
  for a session, and stores the results in the scores table */
export async function scoreSession(sessionId) {
  const pool = getPool()

  // Get the session from our database to find the OpenF1 session key
  const sessionResult = await pool.query(
    'SELECT * FROM sessions WHERE id = $1',
    [sessionId]
  )

  if (sessionResult.rows.length === 0) {
    throw new Error(`Session ${sessionId} not found`)
  }

  const session = sessionResult.rows[0]

  if (!session.session_key) {
    throw new Error(`Session ${sessionId} has no OpenF1 session key`)
  }

  // Fetch final positions and driver info from OpenF1
  const [results, drivers] = await Promise.all([
    getSessionResults(session.session_key),
    getDrivers(session.session_key),
  ])

  // Build a map of driver code (e.g. NOR) to final position
  const driverCodeToPosition = {}
  for (const result of results) {
    // Find the matching driver to get their code
    const driver = drivers.find(d => d.driver_number === result.driver_number)
    if (driver) {
      driverCodeToPosition[driver.name_acronym] = result.position
    }
  }

  // Store official results in the results table
  for (const [code, position] of Object.entries(driverCodeToPosition)) {
    await pool.query(
      `INSERT INTO results (session_id, position, driver_code)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, position) DO UPDATE SET driver_code = $3`,
      [sessionId, position, code]
    )
  }

  // Get all users who submitted predictions for this session
  const predictionsResult = await pool.query(
    'SELECT DISTINCT user_id FROM predictions WHERE session_id = $1',
    [sessionId]
  )

  const scoreSummary = []

  // Calculate and store score for each user
  for (const { user_id } of predictionsResult.rows) {
    // Get this user's predictions for the session
    const userPredictions = await pool.query(
      'SELECT position, driver_code FROM predictions WHERE user_id = $1 AND session_id = $2',
      [user_id, sessionId]
    )

    let totalPoints = 0

    // Score each prediction against the actual result
    for (const prediction of userPredictions.rows) {
      const actualPosition = driverCodeToPosition[prediction.driver_code]

      // Only score if the driver actually finished in the top 10
      if (actualPosition !== undefined) {
        totalPoints += calculatePoints(prediction.position, actualPosition)
      }
    }

    // Store the score in the database, updating if it already exists
    await pool.query(
      `INSERT INTO scores (user_id, session_id, points)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, session_id) DO UPDATE SET points = $3`,
      [user_id, sessionId, totalPoints]
    )

    scoreSummary.push({ user_id, points: totalPoints })
  }

  // Mark the session as completed
  await pool.query(
    'UPDATE sessions SET completed = true WHERE id = $1',
    [sessionId]
  )

  return scoreSummary
}