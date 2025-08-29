# 🔐 Configuración de Autenticación con Directus

Esta guía te ayudará a configurar la autenticación con Directus en ShipFree y probar todas las funcionalidades implementadas.

## 📋 Requisitos Previos

Asegúrate de que todos los servicios estén corriendo:

```bash
docker compose -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml up -d
```

## 🔧 Configuración Inicial de Directus

### 1. Acceder al Panel de Administración

1. Ve a: `http://localhost:8070`
2. Usa las credenciales de administrador:
   - **Email**: `admin@shipfree.dev`
   - **Contraseña**: `AdminPassword123!`

### 2. Crear Roles de Usuario

#### Rol "Usuario Básico"
1. En el panel de Directus, ve a **Settings → Roles & Permissions**
2. Haz clic en **"Create Role"**
3. Configura:
   - **Name**: `Usuario Básico`
   - **Description**: `Usuarios estándar de la aplicación`
   - **Admin Access**: `No`
   - **App Access**: `Yes`
   - **Icon**: `person`
4. En **Permissions**, configura:
   - **Users (directus_users)**:
     - **Read**: Own
     - **Update**: Own (solo campos básicos como first_name, last_name)
   - **Files**: Read (si necesitan ver archivos)

#### Rol "Editor"
1. Crear otro rol con:
   - **Name**: `Editor`
   - **Description**: `Editores de contenido`
   - **Admin Access**: `No`
   - **App Access**: `Yes`
   - Más permisos de lectura/escritura según necesidades

### 3. Crear Usuarios de Prueba

#### Usuario Básico
1. Ve a **User Directory**
2. Haz clic en **"Create User"**
3. Configura:
   - **First Name**: `Juan`
   - **Last Name**: `Pérez`
   - **Email**: `juan@test.com`
   - **Password**: `123456789`
   - **Status**: `Active`
   - **Role**: `Usuario Básico`

#### Usuario Editor
1. Crear otro usuario:
   - **First Name**: `María`
   - **Last Name**: `García`
   - **Email**: `maria@test.com`
   - **Password**: `123456789`
   - **Status**: `Active`
   - **Role**: `Editor`

#### Usuario Admin
1. Crear usuario administrador:
   - **First Name**: `Admin`
   - **Last Name**: `Sistema`
   - **Email**: `admin@test.com`
   - **Password**: `admin123456`
   - **Status**: `Active`
   - **Role**: `Administrator`

## 🧪 Pruebas de Funcionalidad

### 1. Probar la Página Principal

1. Ve a: `http://localhost:3070`
2. Verifica que aparezca el botón **"Iniciar sesión"** en el navbar
3. El navbar NO debe mostrar información de usuario autenticado

### 2. Probar Login

#### Login Exitoso
1. Haz clic en **"Iniciar sesión"** en el navbar
2. Serás redirigido a: `http://localhost:3070/directus-login`
3. Introduce las credenciales del usuario de prueba:
   - **Email**: `juan@test.com`
   - **Contraseña**: `123456789`
4. Haz clic en **"Iniciar sesión"**
5. **Resultado esperado**:
   - Redirección a `/directus-dashboard`
   - El navbar debe mostrar el nombre del usuario y botón "Salir"

#### Login Fallido
1. Intenta login con credenciales incorrectas
2. **Resultado esperado**:
   - Mensaje de error
   - No redirección
   - Formulario sigue visible para reintentar

### 3. Probar Dashboard de Usuario

En `http://localhost:3070/directus-dashboard` deberías ver:

#### Información Personal
- ✅ Email del usuario
- ✅ Nombre completo
- ✅ Estado (badge verde "Activo")
- ✅ ID de usuario

#### Rol y Permisos
- ✅ Nombre del rol
- ✅ Descripción del rol
- ✅ Badges de permisos:
  - "Acceso a la App" si tiene app_access
  - "Administrador" si tiene admin_access

#### Acciones Disponibles
- ✅ Botón "Panel de Directus" → enlace a `http://localhost:8070`
- ✅ Botón "Actualizar datos" → recarga información del usuario
- ✅ Botón "Página principal" → vuelve a la home

### 4. Probar Navegación Autenticada

Con usuario logueado, el **navbar** debe mostrar:
- ✅ Nombre/email del usuario como botón que lleva al dashboard
- ✅ Botón rojo "Salir" para logout

### 5. Probar Logout

1. Desde cualquier página (con usuario logueado), haz clic en **"Salir"**
2. **Resultado esperado**:
   - Redirección a la página principal
   - Navbar vuelve a mostrar "Iniciar sesión"
   - No información de usuario autenticado

### 6. Probar Protección de Rutas

1. **Sin autenticación**, intenta acceder a: `http://localhost:3070/directus-dashboard`
2. **Resultado esperado**:
   - Redirección automática a `/directus-login`
   - O mensaje de "Acceso denegado" con botón para login

## 🔍 Verificación de Diferentes Tipos de Usuario

### Usuario Básico (juan@test.com)
- ✅ Puede hacer login
- ✅ Ve su dashboard con información básica
- ✅ Badge: "Acceso a la App"
- ✅ NO debe tener badge "Administrador"

### Usuario Editor (maria@test.com)
- ✅ Puede hacer login
- ✅ Ve dashboard con información de editor
- ✅ Badge: "Acceso a la App"
- ✅ Puede tener permisos adicionales según configuración

### Usuario Admin (admin@test.com)
- ✅ Puede hacer login
- ✅ Ve dashboard completo
- ✅ Badges: "Administrador" + "Acceso a la App"

## 🐛 Solución de Problemas

### Error: "Failed to get user info"
- **Causa**: Problema de conexión con Directus
- **Solución**: Verificar que Directus esté corriendo en `localhost:8070`

### Error: "Login failed"
- **Causa**: Credenciales incorrectas o usuario inactivo
- **Solución**: Verificar credenciales y estado del usuario en Directus admin

### Error: "CORS"
- **Causa**: Problema de configuración CORS en Directus
- **Solución**: Verificar configuración CORS en `docker-compose.directus.yml`

### Error: Redirección infinita
- **Causa**: Token corrupto o expirado
- **Solución**: Limpiar localStorage o cerrar sesión completamente

### Limpiar Estado de Autenticación
Si necesitas resetear el estado de autenticación:

```javascript
// En la consola del navegador
localStorage.removeItem('directus_token');
window.location.reload();
```

## 📊 URLs de Prueba

- **🏠 Página principal**: http://localhost:3070
- **🔐 Login**: http://localhost:3070/directus-login
- **👤 Dashboard**: http://localhost:3070/directus-dashboard
- **⚙️ Directus Admin**: http://localhost:8070
- **🛠️ Portainer**: http://localhost:9070
- **📊 pgAdmin**: http://localhost:5070

## ✅ Checklist de Funcionalidades

### Autenticación
- [ ] Login con credenciales válidas
- [ ] Error con credenciales inválidas
- [ ] Logout correcto
- [ ] Persistencia de sesión (refresh de página)
- [ ] Redirección después del login
- [ ] Protección de rutas privadas

### UI/UX
- [ ] Botón "Iniciar sesión" cuando no autenticado
- [ ] Información de usuario en navbar cuando autenticado
- [ ] Botón "Salir" visible cuando autenticado
- [ ] Dashboard muestra información completa del usuario
- [ ] Dashboard muestra rol y permisos correctos
- [ ] Links funcionales en el dashboard

### Integración
- [ ] Conexión correcta con Directus API
- [ ] Manejo correcto de errores de API
- [ ] Estados de carga apropiados
- [ ] Variables de entorno configuradas

## 🎯 Próximos Pasos (Opcional)

1. **Recuperación de contraseña**: Implementar flujo de reset
2. **Registro de usuarios**: Permitir auto-registro (si aplica)
3. **Refresh automático**: Renovar tokens automáticamente
4. **Roles dinámicos**: Mostrar/ocultar funcionalidades según rol
5. **Perfil de usuario**: Página para editar información personal

---

*Configuración completada para la autenticación con Directus en entorno de desarrollo*