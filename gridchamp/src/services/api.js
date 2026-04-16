// Base URL for the backend API
// Uses environment variable in production, falls back to localhost for development
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Helper function to get the auth token from localStorage
const getToken = () => localStorage.getItem('token')

// Generic request handler that attaches auth headers and handles errors
const request = async (endpoint, options = {}) => {
  const token = getToken()

  const config = {
    headers: {
      'Content-Type': 'application/json',
      // Attach the JWT token to every request if one exists
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (username, email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const userAPI = {
  getMe: () => request('/api/users/me'),
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export const sessionAPI = {
  getAll: () => request('/api/sessions'),
  getOne: (id) => request(`/api/sessions/${id}`),
}

// ── Predictions ───────────────────────────────────────────────────────────────

export const predictionAPI = {
  // Submit predictions for a session
  // options can include league_id, fastest_lap, driver_of_day
  submit: (sessionId, predictions, options = {}) =>
    request(`/api/predictions/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ predictions, ...options }),
    }),

  // Get predictions for a session, optionally filtered by league
  getForSession: (sessionId, leagueId = null) =>
    request(`/api/predictions/${sessionId}${leagueId ? `?league_id=${leagueId}` : ''}`),
}

// ── Scores ────────────────────────────────────────────────────────────────────

export const scoreAPI = {
  getMyTotal: () => request('/api/scores/me'),
  getSessionScores: (sessionId) => request(`/api/scores/session/${sessionId}`),
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export const leaderboardAPI = {
  getGlobal: () => request('/api/leaderboard'),
  getFriends: () => request('/api/leaderboard/friends'),
}

// ── Leagues ───────────────────────────────────────────────────────────────────

export const leagueAPI = {
  getMyLeagues: () => request('/api/leagues/me'),
  getOne: (id) => request(`/api/leagues/${id}`),
  create: (name, settings = {}) =>
    request('/api/leagues', {
      method: 'POST',
      body: JSON.stringify({ name, ...settings }),
    }),
  join: (code) =>
    request('/api/leagues/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  getStandings: (id) => request(`/api/leagues/${id}/standings`),
  updateSettings: (id, settings) =>
    request(`/api/leagues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
}