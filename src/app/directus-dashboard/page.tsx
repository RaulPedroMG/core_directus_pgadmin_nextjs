"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDirectusAuth } from "@/hooks/useDirectusAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Shield, Mail, LogOut, Settings, Home } from "lucide-react";
import Link from "next/link";

export default function DirectusDashboard() {
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useDirectusAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/directus-login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Cargando información del usuario...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900">Acceso denegado</h2>
          <p className="mt-1 text-sm text-gray-600">Necesitas iniciar sesión para acceder a esta página.</p>
          <Link href="/directus-login" className="mt-4 inline-block">
            <Button>Iniciar sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getUserDisplayName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
  };

  const getStatusBadge = () => {
    const status = user.status?.toLowerCase();
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'invited':
        return <Badge className="bg-yellow-100 text-yellow-800">Invitado</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspendido</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'Desconocido'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  ¡Bienvenido, {getUserDisplayName()}!
                </h1>
                <p className="text-sm text-gray-600">Panel de usuario - Directus</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <Card className="md:col-span-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID de Usuario</label>
                  <div className="mt-1">
                    <span className="text-sm font-mono text-gray-600">{user.id}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                  <div className="mt-1">
                    <span className="text-sm text-gray-900">
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : 'No especificado'
                      }
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
              <CardDescription>
                Tu rol en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.role ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rol</label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {user.role.name}
                      </Badge>
                    </div>
                  </div>

                  {user.role.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Descripción</label>
                      <p className="mt-1 text-sm text-gray-600">
                        {user.role.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Permisos</label>
                    <div className="flex flex-wrap gap-2">
                      {user.role.admin_access && (
                        <Badge className="bg-red-100 text-red-800">
                          Administrador
                        </Badge>
                      )}
                      {user.role.app_access && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Acceso a la App
                        </Badge>
                      )}
                      {!user.role.admin_access && !user.role.app_access && (
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

          {/* Actions Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Acciones Disponibles
              </CardTitle>
              <CardDescription>
                Herramientas y recursos a tu disposición
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="http://localhost:8070" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full h-auto p-4">
                    <div className="text-center">
                      <Settings className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-semibold">Panel de Directus</div>
                      <div className="text-xs text-gray-600">Acceder al CMS completo</div>
                    </div>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full h-auto p-4"
                  onClick={refreshUser}
                >
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">Actualizar datos</div>
                    <div className="text-xs text-gray-600">Refrescar información</div>
                  </div>
                </Button>

                <Link href="/">
                  <Button variant="outline" className="w-full h-auto p-4">
                    <div className="text-center">
                      <Home className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-semibold">Página principal</div>
                      <div className="text-xs text-gray-600">Volver al sitio web</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
