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

      // Force immediate state update
      setTimeout(() => {
        setUser(null);
        setIsAuthenticated(false);
      }, 0);

      // Try to logout from server, but don't fail if it doesn't work
      try {
        await directusAuth.logout();
      } catch (logoutErr) {
        console.warn(
          "Server logout failed, but local logout succeeded:",
          logoutErr
        );
      }

      // Additional cleanup - force refresh any cached data
      window.dispatchEvent(new Event("directus-logout"));
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

  // Listen for storage changes (logout from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "directus_access_token") {
        if (!e.newValue && isAuthenticated) {
          // Token was removed, user logged out
          console.log(
            "useDirectusAuth: Token removed from storage, logging out"
          );
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        } else if (e.newValue && !isAuthenticated) {
          // Token was added, user logged in from another tab
          console.log(
            "useDirectusAuth: Token added to storage, refreshing user"
          );
          refreshUser();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isAuthenticated, refreshUser]);

  // Listen for custom logout events
  useEffect(() => {
    const handleLogoutEvent = () => {
      console.log("useDirectusAuth: Received logout event");
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    window.addEventListener("directus-logout", handleLogoutEvent);
    return () =>
      window.removeEventListener("directus-logout", handleLogoutEvent);
  }, []);

  // Periodic token validation (every 10 seconds when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const token = directusAuth.getToken();
      if (!token) {
        console.log("useDirectusAuth: Token missing during periodic check");
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Optional: Validate token with server (uncomment if needed)
      /*
      try {
        await directusAuth.getCurrentUser();
      } catch (error) {
        console.log("useDirectusAuth: Token invalid during periodic check");
        setUser(null);
        setIsAuthenticated(false);
        directusAuth.removeToken();
      }
      */
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
