import { createContext, useContext, useState } from 'react'

// Create the authentication context with a default value of null
const AuthContext = createContext(null)

// AuthProvider wraps the app and makes auth state available to all child components
export function AuthProvider({ children }) {
  // user holds the currently logged in user's data, or null if not logged in
  const [user, setUser] = useState(null)

  // login sets the user state with the data returned from the backend
  const login = (userData) => {
    setUser(userData)
  }

  // logout clears the user state, effectively ending the session
  const logout = () => {
    setUser(null)
  }

  // Provide user, login and logout to all components inside the provider
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to access auth context from any component
export function useAuth() {
  return useContext(AuthContext)
}