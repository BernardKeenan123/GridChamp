// Central API service layer, all backend requests go through here
// The request helper attaches the JWT token automatically to every call

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Retrieve the stored JWT token from localStorage
const getToken = () => localStorage.getItem('token')

// Generic fetch wrapper, attaches auth headers and throws on non-OK responses
const request = async (endpoint, options = {}) => {
  const token = getToken()

  const config = {
    headers: {
      'Content-Type': 'application/json',
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

// Auth - register and login
export const authAPI = {
  register: (username, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
}

// Users
export const userAPI = {
  getMe: () => request('/api/users/me'),
}

// Sessions
export const sessionAPI = {
  getAll: () => request('/api/sessions'),
  getOne: (id) => request(`/api/sessions/${id}`),
}

// Predictions - submit and retrieve per session/league
export const predictionAPI = {
  submit: (sessionId, predictions, options = {}) =>
    request(`/api/predictions/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ predictions, ...options }),
    }),

  // leagueId null returns global predictions
  getForSession: (sessionId, leagueId = null) =>
    request(`/api/predictions/${sessionId}${leagueId ? `?league_id=${leagueId}` : ''}`),
}

// Scores
export const scoreAPI = {
  getMyTotal: () => request('/api/scores/me'),
  // leagueId null returns global scores
  getSessionScores: (sessionId, leagueId = null) =>
    request(`/api/scores/session/${sessionId}${leagueId ? `?league_id=${leagueId}` : ''}`),
}

// Leaderboard
export const leaderboardAPI = {
  getGlobal: () => request('/api/leaderboard'),
  getFriends: () => request('/api/leaderboard/friends'),
}

// Leagues
export const leagueAPI = {
  getMyLeagues: () => request('/api/leagues/me'),
  getOne: (id) => request(`/api/leagues/${id}`),
  create: (name, settings = {}) =>
    request('/api/leagues', {
      method: 'POST',
      body: JSON.stringify({ name, ...settings }),
    }),
  getStandings: (id) => request(`/api/leagues/${id}/standings`),
  updateSettings: (id, settings) =>
    request(`/api/leagues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
}