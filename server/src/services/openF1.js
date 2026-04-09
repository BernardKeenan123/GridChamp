// OpenF1 API service - handles authentication and data fetching
// All calls are made server-side to keep credentials secure

const OPENF1_BASE_URL = 'https://api.openf1.org/v1'
const TOKEN_URL = 'https://api.openf1.org/token'

// Store the token and its expiry time in memory
// This avoids requesting a new token on every API call
let accessToken = null
let tokenExpiresAt = null

// Get a valid access token, requesting a new one if expired or not yet obtained
async function getAccessToken() {
  const now = Date.now()

  // Return existing token if it's still valid with a 60 second buffer
  if (accessToken && tokenExpiresAt && now < tokenExpiresAt - 60000) {
    return accessToken
  }

  // Request a new token using credentials from environment variables
  const params = new URLSearchParams()
  params.append('username', process.env.OPENF1_USERNAME)
  params.append('password', process.env.OPENF1_PASSWORD)

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!response.ok) {
    throw new Error(`Failed to get OpenF1 token: ${response.status}`)
  }

  const data = await response.json()

  // Store the token and calculate when it expires (expires_in is in seconds)
  accessToken = data.access_token
  tokenExpiresAt = now + parseInt(data.expires_in) * 1000

  return accessToken
}

// Make an authenticated GET request to the OpenF1 REST API
async function openF1Request(endpoint) {
  const token = await getAccessToken()

  const response = await fetch(`${OPENF1_BASE_URL}${endpoint}`, {
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status}`)
  }

  return response.json()
}

// ── API methods ───────────────────────────────────────────────────────────────

// Get all sessions for a given year
export async function getSessions(year = 2024) {
  return openF1Request(`/sessions?year=${year}`)
}

// Get a specific session by its key
export async function getSession(sessionKey) {
  return openF1Request(`/sessions?session_key=${sessionKey}`)
}

// Get the final finishing positions for a session
// The OpenF1 position endpoint returns every position change throughout the session
// so we extract only the last recorded position per driver to get the final result
export async function getSessionResults(sessionKey) {
  const data = await openF1Request(`/position?session_key=${sessionKey}`)

  // Track the most recent position entry for each driver
  // Since data is ordered chronologically, later entries overwrite earlier ones
  const driverPositions = {}
  for (const entry of data) {
    driverPositions[entry.driver_number] = entry.position
  }

  // Convert to a clean sorted array of final positions
  const finalResults = Object.entries(driverPositions)
    .map(([driver_number, position]) => ({
      driver_number: parseInt(driver_number),
      position,
      session_key: sessionKey,
    }))
    .sort((a, b) => a.position - b.position)

  return finalResults
}

// Get all drivers for a session
export async function getDrivers(sessionKey) {
  return openF1Request(`/drivers?session_key=${sessionKey}`)
}

// Get lap data for a session - useful for fastest lap predictions
export async function getLaps(sessionKey) {
  return openF1Request(`/laps?session_key=${sessionKey}`)
}

// Get all race meetings for a given year
export async function getMeetings(year = 2024) {
  return openF1Request(`/meetings?year=${year}`)
}