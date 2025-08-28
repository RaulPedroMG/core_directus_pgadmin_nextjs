"use client";

import { useState, useEffect, useCallback } from "react";
import { directusAuth, DirectusUser } from "@/lib/directus/client";

interface UseDirectusAuthReturn {
  user: DirectusUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export function useDirectusAuth(): UseDirectusAuthReturn {
  const [user, setUser] = useState<DirectusUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await directusAuth.getCurrentUser();

      if (result.success && result.data) {
        setUser(result.data as DirectusUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        // Don't set error here as this is normal when not logged in
      }
    } catch (err: any) {
      console.error("Error refreshing user:", err);
      // Only set error if we had a token (was expecting to be authenticated)
      const hasToken = directusAuth.getToken();
      if (hasToken) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        directusAuth.removeToken();
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await directusAuth.login(email, password);

        if (result.success) {
          // After successful login, refresh user data
          await refreshUser();
          return true;
        } else {
          setError(result.error || "Login failed");
          return false;
        }
      } catch (err: any) {
        console.error("Login error:", err);
        setError(err.message || "Login failed");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUser]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Always clear local state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      directusAuth.removeToken();

      // Try to logout from server, but don't fail if it doesn't work
      try {
        await directusAuth.logout();
      } catch (logoutErr) {
        console.warn(
          "Server logout failed, but local logout succeeded:",
          logoutErr
        );
      }
    } catch (err: any) {
      console.error("Logout error:", err);
      // Even if there's an error, ensure local state is cleared
      setUser(null);
      setIsAuthenticated(false);
      directusAuth.removeToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we have a token stored
      const token = directusAuth.getToken();

      if (token) {
        // Try to get current user with stored token
        await refreshUser();
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };
}
