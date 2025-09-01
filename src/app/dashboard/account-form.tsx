"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DirectusUser } from "@/lib/directus/client";
import { useDirectusAuth } from "@/hooks/useDirectusAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  Shield,
  Mail,
  LogOut,
  Settings,
  Home,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface AccountFormProps {
  user: DirectusUser | null;
}

export default function AccountForm({ user: initialUser }: AccountFormProps) {
  const { user, isLoading, logout, refreshUser } = useDirectusAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use user from hook if available, otherwise use initial user from server
  const currentUser = user || initialUser;

  const handleLogout = async () => {
    try {
      console.log("AccountForm: Starting logout process...");

      // Perform logout
      await logout();

      console.log("AccountForm: Logout completed, redirecting...");

      // Force redirect to home page
      router.push("/");

      // Also force a page reload as fallback to ensure clean state
      setTimeout(() => {
        console.log("AccountForm: Forcing page reload for clean logout");
        window.location.href = "/";
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if there's an error
      router.push("/");
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Acceso denegado
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Necesitas iniciar sesión para acceder a esta página.
          </p>
          <Link href="/auth/login" className="mt-4 inline-block">
            <Button>Iniciar sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getUserDisplayName = () => {
    if (currentUser.first_name && currentUser.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`;
    } else if (currentUser.first_name) {
      return currentUser.first_name;
    } else if (currentUser.email) {
      return currentUser.email.split("@")[0];
    }
    return "Usuario";
  };

  const getStatusBadge = () => {
    const status = currentUser.status?.toLowerCase();
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "invited":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Invitado</Badge>
        );
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspendido</Badge>;
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            {status || "Desconocido"}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </div>
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">
                  Panel de Usuario
                </h1>
                <p className="text-sm text-gray-600">
                  ¡Bienvenido, {getUserDisplayName()}!
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="w-full"
              >
                <Loader2
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Panel de Usuario
                </h1>
                <p className="text-sm text-gray-600">
                  ¡Bienvenido, {getUserDisplayName()}!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="hidden md:flex"
              >
                <Loader2
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="md:hidden"
              >
                <Loader2
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                <LogOut className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Datos de tu cuenta en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md">
                    <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-900 break-all">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-900">
                      {currentUser.first_name || currentUser.last_name
                        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
                        : "No especificado"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    ID de Usuario
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    <span className="text-xs font-mono text-gray-600 break-all">
                      {currentUser.id}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role & Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Rol y Permisos
              </CardTitle>
              <CardDescription>Tu rol en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser.role ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Rol
                    </label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {currentUser.role.name}
                      </Badge>
                    </div>
                  </div>

                  {currentUser.role.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                          {currentUser.role.description}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Permisos
                    </label>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {currentUser.role.admin_access && (
                        <Badge className="bg-red-100 text-red-800">
                          Administrador
                        </Badge>
                      )}
                      {currentUser.role.app_access && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Acceso a la App
                        </Badge>
                      )}
                      {!currentUser.role.admin_access &&
                        !currentUser.role.app_access && (
                          <Badge className="bg-gray-100 text-gray-800">
                            Sin permisos especiales
                          </Badge>
                        )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  No se encontró información de rol
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Herramientas y recursos disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="http://localhost:8070"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 sm:p-6 flex flex-col items-center text-center"
                  >
                    <Settings className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <span className="font-semibold text-sm sm:text-base">
                      Panel de Directus
                    </span>
                    <span className="text-xs text-gray-600 mt-1">
                      Acceder al CMS
                    </span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full h-auto p-4 sm:p-6 flex flex-col items-center text-center"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Loader2
                    className={`h-6 w-6 sm:h-8 sm:w-8 mb-2 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  <span className="font-semibold">Actualizar datos</span>
                  <span className="text-xs text-gray-600 mt-1">
                    Refrescar información
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-auto p-4 sm:p-6 flex flex-col items-center text-center"
                  onClick={handleBackToHome}
                >
                  <Home className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                  <span className="font-semibold text-sm sm:text-base">
                    Página principal
                  </span>
                  <span className="text-xs text-gray-600 mt-1">
                    Ir al inicio
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
