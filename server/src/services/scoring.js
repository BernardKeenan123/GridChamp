import { getPool } from '../db/index.js'

// Standard F1 points system
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

// Bonus points
const POLE_BONUS = 2
const FASTEST_LAP_BONUS = 1

function calculatePoints(predictedPos, actualPos) {
  if (predictedPos === actualPos) {
    return F1_POINTS[actualPos - 1] || 0
  }
  return 0
}

async function scoreUserPredictions(pool, userId, sessionId, driverCodeToPosition, fastestLapDriver, leagueConfig = null) {
  const leagueId = leagueConfig?.id || null
  const slots = leagueConfig?.prediction_slots || 10
  const poleBonus = leagueConfig?.pole_bonus || false
  const fastestLapEnabled = leagueConfig?.fastest_lap || false

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

  for (const prediction of userPredictions.rows) {
    if (prediction.position > slots) continue

    const actualPosition = driverCodeToPosition[prediction.driver_code]
    if (actualPosition !== undefined) {
      const points = calculatePoints(prediction.position, actualPosition)
      totalPoints += points

      if (poleBonus && prediction.position === 1 && actualPosition === 1) {
        totalPoints += POLE_BONUS
      }
    }
  }

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

  await pool.query(
    `INSERT INTO scores (user_id, session_id, points, league_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, session_id, league_id) DO UPDATE SET points = $3`,
    [userId, sessionId, totalPoints, leagueId]
  )

  return totalPoints
}

export async function scoreSession(sessionId, fastestLapDriver = null) {
  const pool = getPool()

  const sessionResult = await pool.query(
    'SELECT * FROM sessions WHERE id = $1',
    [sessionId]
  )

  if (sessionResult.rows.length === 0) {
    throw new Error(`Session ${sessionId} not found`)
  }

  // Read results from DB — results.js already fetched and stored them
  // This avoids a second OpenF1 call and removes the session_key dependency
  const storedResults = await pool.query(
    'SELECT position, driver_code FROM results WHERE session_id = $1',
    [sessionId]
  )

  if (storedResults.rows.length === 0) {
    throw new Error(`No results stored for session ${sessionId} — fetch results first`)
  }

  // Build driver code -> position map from DB
  const driverCodeToPosition = {}
  for (const row of storedResults.rows) {
    driverCodeToPosition[row.driver_code] = row.position
  }

  // Get all unique user/league combinations who submitted predictions
  const predictionsResult = await pool.query(
    'SELECT DISTINCT user_id, league_id FROM predictions WHERE session_id = $1',
    [sessionId]
  )

  const scoreSummary = []
  const scored = new Set()

  for (const { user_id, league_id } of predictionsResult.rows) {
    const key = `${user_id}-${league_id}`
    if (scored.has(key)) continue
    scored.add(key)

    let leagueConfig = null
    if (league_id) {
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

  await pool.query(
    'UPDATE sessions SET completed = true WHERE id = $1',
    [sessionId]
  )

  return scoreSummary
}