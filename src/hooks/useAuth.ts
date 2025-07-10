import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const email = localStorage.getItem("userEmail");
    
    setIsAuthenticated(authStatus === "true");
    setUserEmail(email);
  }, []);

  const login = (email: string) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userEmail", email);
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return {
    isAuthenticated,
    userEmail,
    login,
    logout,
    isLoading: isAuthenticated === null,
  };
}