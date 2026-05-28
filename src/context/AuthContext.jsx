import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../api/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("role");

    if (savedToken) {
      setToken(savedToken);
    }

    // ✅ SAFE JSON PARSE (FIXED CRASH)
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.log("Invalid user data in localStorage. Resetting...");
        localStorage.removeItem("user");
        setUser(null);
      }
    }

    if (savedRole) {
      setRole(savedRole);
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);

    const { token, user } = data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("role", user.role);

    setToken(token);
    setUser(user);
    setRole(user.role);

    return user.role;
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setRole(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        login,
        logout,
        isAdmin: role === "admin",
        isEmployee: role === "employee",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ hook export
export const useAuth = () => useContext(AuthContext);