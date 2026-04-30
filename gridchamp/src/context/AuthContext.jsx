import { createContext, useContext, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

// Provides authentication state and actions to the entire app
export function AuthProvider({ children }) {
  // Initialise from localStorage so login persists across page refreshes
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Register a new account and log in automatically on success
  const register = async (username, password) => {
    const data = await authAPI.register(username, password);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  // Log in with username and password, stores token and user in localStorage
  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  // Clear all auth state from memory and localStorage
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for accessing auth context in any component
export function useAuth() {
  return useContext(AuthContext);
}