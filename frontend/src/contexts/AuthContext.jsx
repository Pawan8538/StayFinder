import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Fetch user data
      API
        .get("/auth/me")
        .then((response) => {
          setUser(response.data.user || response.data);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            delete API.defaults.headers.common["Authorization"];
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", { email, password });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Unable to log in right now. Please check your connection and try again",
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await API.post("/auth/register", userData);
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Unable to create your account right now. Please check your connection and try again",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete API.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
