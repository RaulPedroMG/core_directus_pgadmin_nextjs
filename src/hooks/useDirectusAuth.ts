"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const initializingRef = useRef(false);

  // Function to clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Function to refresh user data
  const refreshUser = useCallback(async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setIsLoading(true);
      }
      setError(null);

      const hasToken = directusAuth.getToken();
      if (!hasToken) {
        setUser(null);
        setIsAuthenticated(false);
        if (!skipLoading) {
          setIsLoading(false);
        }
        return;
      }

      const result = await directusAuth.getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data as DirectusUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        // Only show error if we expected to be authenticated
        if (hasToken && result.error) {
          directusAuth.removeToken();
        }
      }
    } catch (err: any) {
      console.error("Error refreshing user:", err);
      setUser(null);
      setIsAuthenticated(false);
      directusAuth.removeToken();
    } finally {
      if (!skipLoading) {
        setIsLoading(false);
      }
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
          await refreshUser(true);
          setIsLoading(false);
          return true;
        } else {
          setError(result.error || "Login failed");
          setIsLoading(false);
          return false;
        }
      } catch (err: any) {
        console.error("Login error:", err);
        setError(err.message || "Login failed");
        setIsLoading(false);
        return false;
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
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        // Check if we have a token stored
        const token = directusAuth.getToken();

        if (token) {
          // Try to get current user with stored token
          await refreshUser();
        } else {
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        initializingRef.current = false;
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
