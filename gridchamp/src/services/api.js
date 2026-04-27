const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getToken = () => localStorage.getItem('token')

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

export const userAPI = {
  getMe: () => request('/api/users/me'),
}

export const sessionAPI = {
  getAll: () => request('/api/sessions'),
  getOne: (id) => request(`/api/sessions/${id}`),
}

export const predictionAPI = {
  submit: (sessionId, predictions, options = {}) =>
    request(`/api/predictions/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ predictions, ...options }),
    }),

  getForSession: (sessionId, leagueId = null) =>
    request(`/api/predictions/${sessionId}${leagueId ? `?league_id=${leagueId}` : ''}`),
}

export const scoreAPI = {
  getMyTotal: () => request('/api/scores/me'),
  getSessionScores: (sessionId) => request(`/api/scores/session/${sessionId}`),
}

export const leaderboardAPI = {
  getGlobal: () => request('/api/leaderboard'),
  getFriends: () => request('/api/leaderboard/friends'),
}

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