import { getPool } from '../db/index.js'
import { getSessionResults, getDrivers } from './openF1.js'

// Standard F1 points system
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

// Bonus points
const POLE_BONUS = 2
const FASTEST_LAP_BONUS = 1
const DRIVER_OF_DAY_BONUS = 1

// Award points for exact position prediction using F1 points system
function calculatePoints(predictedPos, actualPos) {
  if (predictedPos === actualPos) {
    return F1_POINTS[actualPos - 1] || 0
  }
  return 0
}

// Score a single user's predictions for a session against actual results
// leagueConfig controls how many positions to score and which bonuses apply
async function scoreUserPredictions(pool, userId, sessionId, driverCodeToPosition, fastestLapDriver, leagueConfig = null) {
  const leagueId = leagueConfig?.id || null
  const slots = leagueConfig?.prediction_slots || 10
  const poleBonus = leagueConfig?.pole_bonus || false
  const fastestLapEnabled = leagueConfig?.fastest_lap || false
  const driverOfDayEnabled = leagueConfig?.driver_of_day || false

  // Fetch position predictions for this user/session/league
  const userPredictions = await pool.query(
    `SELECT position, driver_code, prediction_type 
     FROM predictions 
     WHERE user_id = $1 AND session_id = $2 
     AND league_id IS NOT DISTINCT FROM $3
     AND prediction_type = 'position'
     ORDER BY position ASC`,
    [userId, sessionId, leagueId]
  )

  let totalPoints = 0

  // Score each position prediction
  for (const prediction of userPredictions.rows) {
    // Only score positions within this league's slot count
    if (prediction.position > slots) continue

    const actualPosition = driverCodeToPosition[prediction.driver_code]
    if (actualPosition !== undefined) {
      const points = calculatePoints(prediction.position, actualPosition)
      totalPoints += points

      // Pole position bonus — extra points for correctly predicting P1 in qualifying
      if (poleBonus && prediction.position === 1 && actualPosition === 1) {
        totalPoints += POLE_BONUS
      }
    }
  }

  // Score fastest lap bonus prediction if enabled for this league
  if (fastestLapEnabled && fastestLapDriver) {
    const flPrediction = await pool.query(
      `SELECT driver_code FROM predictions 
       WHERE user_id = $1 AND session_id = $2 
       AND league_id IS NOT DISTINCT FROM $3
       AND prediction_type = 'fastest_lap'`,
      [userId, sessionId, leagueId]
    )
    if (flPrediction.rows.length > 0 && flPrediction.rows[0].driver_code === fastestLapDriver) {
      totalPoints += FASTEST_LAP_BONUS
    }
  }

  // Score driver of the day bonus prediction if enabled for this league
  if (driverOfDayEnabled) {
    const dodPrediction = await pool.query(
      `SELECT driver_code FROM predictions 
       WHERE user_id = $1 AND session_id = $2 
       AND league_id IS NOT DISTINCT FROM $3
       AND prediction_type = 'driver_of_day'`,
      [userId, sessionId, leagueId]
    )
    // Driver of day must be manually confirmed — skip scoring if not set
    // This is handled separately when results are confirmed
  }

  // Store the score, updating if it already exists
  await pool.query(
    `INSERT INTO scores (user_id, session_id, points, league_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, session_id, league_id) DO UPDATE SET points = $3`,
    [userId, sessionId, totalPoints, leagueId]
  )

  return totalPoints
}

// Main scoring function
// Scores all global predictions and all per-league predictions for a session
export async function scoreSession(sessionId, fastestLapDriver = null) {
  const pool = getPool()

  // Get the session
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

  // Build driver code to final position map
  const driverCodeToPosition = {}
  for (const result of results) {
    const driver = drivers.find(d => d.driver_number === result.driver_number)
    if (driver) {
      driverCodeToPosition[driver.name_acronym] = result.position
    }
  }

  // Store official results
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
    'SELECT DISTINCT user_id, league_id FROM predictions WHERE session_id = $1',
    [sessionId]
  )

  const scoreSummary = []

  // Get all unique user/league combinations
  const scored = new Set()

  for (const { user_id, league_id } of predictionsResult.rows) {
    const key = `${user_id}-${league_id}`
    if (scored.has(key)) continue
    scored.add(key)

    let leagueConfig = null

    if (league_id) {
      // Fetch league settings for per-league scoring
      const leagueResult = await pool.query(
        'SELECT * FROM leagues WHERE id = $1',
        [league_id]
      )
      leagueConfig = leagueResult.rows[0] || null
    }

    const points = await scoreUserPredictions(
      pool,
      user_id,
      sessionId,
      driverCodeToPosition,
      fastestLapDriver,
      leagueConfig
    )

    scoreSummary.push({ user_id, league_id, points })
  }

  // Mark session as completed
  await pool.query(
    'UPDATE sessions SET completed = true WHERE id = $1',
    [sessionId]
  )

  return scoreSummary
}