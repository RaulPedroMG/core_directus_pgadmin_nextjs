"use client";

import { useDirectusAuth } from "@/hooks/useDirectusAuth";
import { useState } from "react";
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
  User,
  LogOut,
  LogIn,
  RefreshCw,
  Home,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function TestLogoutPage() {
  const { user, isLoading, isAuthenticated, login, logout, refreshUser } =
    useDirectusAuth();
  const [loginEmail, setLoginEmail] = useState("admin@shipfree.dev");
  const [loginPassword, setLoginPassword] = useState("AdminPassword123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    addTestResult("🔐 Iniciando login...");

    try {
      const success = await login(loginEmail, loginPassword);
      if (success) {
        addTestResult("✅ Login exitoso");
      } else {
        addTestResult("❌ Login falló");
      }
    } catch (error: any) {
      addTestResult(`❌ Error en login: ${error.message}`);
    }

    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    addTestResult("🚪 Iniciando logout...");

    try {
      await logout();
      addTestResult("✅ Logout completado");

      // Dar tiempo para que los efectos se ejecuten
      setTimeout(() => {
        addTestResult("⏰ Verificando redirección después de 2 segundos...");
        if (window.location.pathname === "/test-logout") {
          addTestResult("⚠️ Aún en página de test (no redirigió)");
        } else {
          addTestResult("✅ Redirigió correctamente");
        }
      }, 2000);
    } catch (error: any) {
      addTestResult(`❌ Error en logout: ${error.message}`);
    }

    setIsLoggingOut(false);
  };

  const handleRefresh = async () => {
    addTestResult("🔄 Refrescando información del usuario...");
    await refreshUser();
    addTestResult("✅ Información refrescada");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const checkLocalStorage = () => {
    const accessToken = localStorage.getItem("directus_access_token");
    const refreshToken = localStorage.getItem("directus_refresh_token");

    addTestResult(`📦 localStorage check:`);
    addTestResult(`   - access_token: ${accessToken ? `${accessToken.substring(0, 30)}...` : "null"}`);
    addTestResult(`   - refresh_token: ${refreshToken ? `${refreshToken.substring(0, 20)}...` : "null"}`);
  };

  const testDashboardAccess = () => {
    addTestResult("🔗 Intentando acceder al dashboard...");
    window.open("/dashboard", "_blank");
    addTestResult("✅ Dashboard abierto en nueva pestaña");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              🧪 Test de Logout - ShipFree
            </h1>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
            </Link>
          </div>
          <p className="text-gray-600">
            Esta página permite probar el flujo completo de login/logout para
            verificar que funcione correctamente.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Estado Actual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Estado Actual
              </CardTitle>
              <CardDescription>Información del estado de autenticación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cargando:</span>
                  <Badge variant={isLoading ? "default" : "secondary"}>
                    {isLoading ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Autenticado:</span>
                  <Badge variant={isAuthenticated ? "default" : "destructive"}>
                    {isAuthenticated ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {isAuthenticated ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usuario:</span>
                  <span className="text-sm text-gray-600">
                    {user?.email || "No logueado"}
                  </span>
                </div>
                {user?.role && typeof user.role === "object" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rol:</span>
                    <Badge variant="outline">{user.role.name}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones de Login/Logout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                Acciones de Autenticación
              </CardTitle>
              <CardDescription>Controles para login y logout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Email:</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={isLoggingIn}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contraseña:</label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-10"
                          disabled={isLoggingIn}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          disabled={isLoggingIn}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="w-full"
                    >
                      {isLoggingIn ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <LogIn className="h-4 w-4 mr-2" />
                      )}
                      {isLoggingIn ? "Iniciando sesión..." : "Iniciar sesión"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      variant="destructive"
                      className="w-full"
                    >
                      {isLoggingOut ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                      )}
                      {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refrescar usuario
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Herramientas de Testing */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 Herramientas de Testing</CardTitle>
              <CardDescription>Utilidades para probar el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button onClick={checkLocalStorage} variant="outline" className="w-full">
                  📦 Verificar localStorage
                </Button>
                <Button onClick={testDashboardAccess} variant="outline" className="w-full">
                  🔗 Probar acceso a Dashboard
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  🔄 Recargar página
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Log de Resultados */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📊 Log de Resultados</CardTitle>
                <Button onClick={clearResults} variant="outline" size="sm">
                  Limpiar
                </Button>
              </div>
              <CardDescription>
                Registro de todas las acciones y resultados del test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-md p-4 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No hay resultados todavía. Ejecuta algunas acciones para ver el log.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm font-mono text-gray-800">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instrucciones */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 Instrucciones de Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>1. Test de Login:</strong> Usa las credenciales por defecto o ingresa otras válidas</p>
              <p><strong>2. Test de Dashboard:</strong> Después del login, haz clic en "Probar acceso a Dashboard"</p>
              <p><strong>3. Test de Logout:</strong> Haz clic en "Cerrar sesión" y observa si redirige</p>
              <p><strong>4. Test de Persistencia:</strong> Recarga la página para verificar si mantiene la sesión</p>
              <p><strong>5. Test de localStorage:</strong> Verifica que los tokens se almacenen/eliminen correctamente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
