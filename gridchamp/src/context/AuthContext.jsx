import { createContext, useContext, useState } from 'react'
import { authAPI } from '../services/api'

// Create the authentication context with a default value of null
const AuthContext = createContext(null)

// AuthProvider wraps the app and makes auth state available to all child components
export function AuthProvider({ children }) {
  // Initialise user from localStorage so login persists on page refresh
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  // Call the register API, store the token and user in localStorage on success
  const register = async (username, email, password) => {
    const data = await authAPI.register(username, email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  // Call the login API, store the token and user in localStorage on success
  const login = async (email, password) => {
    const data = await authAPI.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  // Clear the token and user from localStorage on logout
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // Provide user, login, register and logout to all components inside the provider
  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to access auth context from any component
export function useAuth() {
  return useContext(AuthContext)
}