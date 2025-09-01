"use client";

import { useDirectusAuth } from "@/hooks/useDirectusAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import AccountForm from "./account-form";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useDirectusAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced effect to handle logout detection and redirection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Dashboard: User not authenticated, redirecting to login...");
      setIsRedirecting(true);

      // Force immediate redirect
      router.push("/directus-login");

      // Also force a page reload to ensure clean state (fallback)
      setTimeout(() => {
        if (window.location.pathname === "/dashboard") {
          window.location.href = "/directus-login";
        }
      }, 100);
    } else if (isAuthenticated && user) {
      setIsRedirecting(false);
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Additional effect to listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "directus_access_token" && !e.newValue) {
        console.log("Dashboard: Token removed in storage, user logged out");
        setIsRedirecting(true);
        router.push("/directus-login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  // Additional effect for periodic authentication check
  useEffect(() => {
    if (isAuthenticated && user) {
      // Set up periodic check every 5 seconds when authenticated
      intervalRef.current = setInterval(() => {
        const token = localStorage.getItem("directus_access_token");
        if (!token) {
          console.log(
            "Dashboard: Periodic check detected missing token, redirecting..."
          );
          setIsRedirecting(true);
          router.push("/directus-login");

          // Force redirect as fallback
          setTimeout(() => {
            if (window.location.pathname === "/dashboard") {
              window.location.href = "/directus-login";
            }
          }, 500);
        }
      }, 5000);
    } else {
      // Clear interval when not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user, router]);

  // Show loading while checking authentication or redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4 text-center">
          <div className="mb-6">
            <LoadingSpinner />
          </div>
          {isRedirecting ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Redirigiendo...
              </h3>
              <p className="text-gray-600">
                Te estamos llevando a la página de inicio de sesión
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Cargando...
              </h3>
              <p className="text-gray-600">Verificando tu autenticación</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Double check - if not authenticated, don't render dashboard content
  if (!isAuthenticated || !user) {
    console.log("Dashboard: Final check failed, user not authenticated");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4 text-center">
          <div className="mb-6">
            <LoadingSpinner />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Acceso requerido
            </h3>
            <p className="text-gray-600">Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return <AccountForm user={user} />;
}
