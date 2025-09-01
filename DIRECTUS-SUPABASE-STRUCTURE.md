# 🔄 Nueva Estructura: Directus con Patrón Supabase

Este documento describe la nueva implementación que replica la estructura y patrones de Supabase pero usando Directus como backend, manteniendo consistencia y profesionalismo en el código.

## 🎯 Filosofía de la Implementación

En lugar de mezclar dos sistemas de autenticación o eliminar componentes existentes, se ha implementado una **estructura paralela y equivalente** que:

- ✅ Mantiene los mismos patrones de organización
- ✅ Usa nomenclaturas consistentes
- ✅ Replica la API de Supabase para facilitar migración
- ✅ Permite coexistencia temporal de ambos sistemas
- ✅ Facilita el mantenimiento y comprensión del código

---

## 📁 Estructura de Archivos Implementada

### **Directus (Nueva Estructura)**
```
src/lib/directus/
├── client.ts              # Cliente Directus (equivalente a supabase/client.ts)
├── server.ts              # Servidor Directus (equivalente a supabase/server.ts)
└── middleware.ts           # Middleware Directus (equivalente a supabase/middleware.ts)

src/components/LoginForm/
└── LoginForm.tsx           # Actualizado para usar Directus

src/app/dashboard/
├── page.tsx               # Server component usando Directus
└── account-form.tsx       # Client component con UI completa

src/hooks/
└── useDirectusAuth.ts     # Hook para manejo de estado cliente
```

### **Supabase (Estructura Original - Mantenida)**
```
src/lib/supabase/
├── client.ts              # Cliente Supabase (con fallbacks)
├── server.ts              # Servidor Supabase (con fallbacks)
└── middleware.ts           # Middleware Supabase (no usado actualmente)
```

---

## 🔧 Componentes Implementados

### **1. Cliente Directus (`src/lib/directus/client.ts`)**

**Características**:
- Factory pattern para instancia singleton
- Auto-refresh de tokens habilitado
- Sincronización localStorage + cookies
- API compatible con Supabase para migración fácil

**Funciones Principales**:
```typescript
// Autenticación nativa Directus
directusAuth.login(email, password)
directusAuth.logout()
directusAuth.getCurrentUser()
directusAuth.isAuthenticated()

// API compatible con Supabase
directusAuth.auth.getUser()
directusAuth.auth.signInWithPassword({ email, password })
directusAuth.auth.signOut()
```

### **2. Servidor Directus (`src/lib/directus/server.ts`)**

**Características**:
- Server component compatible
- Manejo de cookies HTTP-only
- API idéntica a Supabase para compatibilidad
- Funciones helper para server components

**Funciones Principales**:
```typescript
// Crear cliente de servidor
const client = await createClient()

// API compatible con Supabase
const { data: { user } } = await client.auth.getUser()

// Helpers
const user = await getUser()
const isAuth = await isAuthenticated()
```

### **3. Middleware Directus (`src/lib/directus/middleware.ts`)**

**Características**:
- Verificación automática de tokens
- Refresh de cookies en requests
- Limpieza de tokens inválidos
- Compatible con middleware de Next.js

### **4. Hook useDirectusAuth (`src/hooks/useDirectusAuth.ts`)**

**Características**:
- Estado global de autenticación
- Prevención de race conditions
- Manejo robusto de errores
- Persistencia entre recargas

**Estados y Funciones**:
```typescript
const {
  user,                    // DirectusUser | null
  isLoading,               // boolean
  isAuthenticated,         // boolean
  error,                   // string | null
  login,                   // (email, password) => Promise<boolean>
  logout,                  // () => Promise<void>
  refreshUser,             // () => Promise<void>
  clearError               // () => void
} = useDirectusAuth()
```

---

## 🔀 Flujos de Autenticación

### **Flow 1: Server-Side (Dashboard)**
```typescript
// src/app/dashboard/page.tsx (Server Component)
import { createClient } from "@/lib/directus/server"

export default async function Dashboard() {
  const directus = await createClient()
  const { data: { user } } = await directus.auth.getUser()
  
  return <AccountForm user={user} />
}
```

### **Flow 2: Client-Side (Login)**
```typescript
// src/components/LoginForm/LoginForm.tsx (Client Component)
import { directusAuth } from "@/lib/directus/client"

const handleLogin = async (e) => {
  const result = await directusAuth.login(email, password)
  if (result.success) {
    router.push("/dashboard")
  }
}
```

### **Flow 3: Hybrid (Account Form)**
```typescript
// src/app/dashboard/account-form.tsx (Client + Server data)
export default function AccountForm({ user: initialUser }) {
  const { user } = useDirectusAuth()
  
  // Usa hook si disponible, sino usa datos del servidor
  const currentUser = user || initialUser
}
```

---

## 🔄 Compatibilidad con Supabase

### **API Equivalente**
| Supabase | Directus | Notas |
|----------|----------|-------|
| `supabase.auth.getUser()` | `directus.auth.getUser()` | API idéntica |
| `supabase.auth.signInWithPassword()` | `directus.auth.signInWithPassword()` | Mismos parámetros |
| `supabase.auth.signOut()` | `directus.auth.signOut()` | Mismo comportamiento |
| `createClient()` | `createClient()` | Misma función de factory |

### **Migración Gradual**
```typescript
// Antes (Supabase)
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
const { data } = await supabase.auth.getUser()

// Después (Directus) - Cambio mínimo
import { directusAuth as supabase } from "@/lib/directus/client" 
const { data } = await supabase.auth.getUser()
```

---

## 🍪 Manejo de Tokens y Cookies

### **Estrategia Híbrida**
- **localStorage**: Para persistencia cliente
- **HTTP Cookies**: Para requests servidor
- **Sincronización**: Entre ambos métodos

### **Seguridad**
```typescript
// Cookies con configuración segura
response.cookies.set("directus_access_token", token, {
  httpOnly: true,                                    // No accesible via JS
  secure: process.env.NODE_ENV === "production",     // HTTPS en prod
  sameSite: "lax",                                   // CSRF protection
  maxAge: 60 * 60 * 24 * 7,                        // 7 días
  path: "/",                                        // Toda la app
})
```

---

## 🚀 Rutas y Navegación

### **Rutas Mantenidas**
- `/auth/login` → Usa LoginForm actualizado con Directus
- `/dashboard` → Server component con Directus
- `/` → Navbar con detección automática de auth

### **Navbar Inteligente**
```typescript
// src/app/(site)/Navbar.tsx
const { user, isAuthenticated, logout } = useDirectusAuth()

// Muestra botón login o información del usuario automáticamente
{isAuthenticated ? (
  <UserMenu user={user} onLogout={logout} />
) : (
  <LoginButton />
)}
```

---

## 🔧 Configuración y Variables de Entorno

### **Variables Requeridas**
```bash
# Docker Compose
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8070
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321          # Fallback
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake_key_for_development   # Fallback
```

### **Configuración Dinámica**
```typescript
// URL se detecta automáticamente
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8070"
```

---

## 📊 Comparativa: Antes vs Después

### **❌ Antes (Problemático)**
- Dos sistemas mezclados sin estructura
- Routes inconsistentes (`/directus-login`)
- Componentes duplicados
- No hay patrón claro
- Difícil de mantener

### **✅ Después (Profesional)**
- Estructura clara y consistente
- Routes estándar (`/auth/login`)
- Patrón Supabase replicado
- API compatible para migración
- Fácil de entender y mantener

---

## 🧪 Testing y Validación

### **Flujo de Pruebas**
```bash
1. Login: /auth/login → Formulario con Directus
2. Dashboard: /dashboard → Server component con datos
3. Persistencia: Refresh página → Mantiene sesión  
4. Logout: Botón → Limpia tokens y redirige
5. Navbar: Estado dinámico → Login/User info
```

### **Puntos de Verificación**
- ✅ Tokens se sincronizan (localStorage + cookies)
- ✅ Server components obtienen datos correctos
- ✅ Client components mantienen estado
- ✅ Middleware actualiza sesiones automáticamente
- ✅ Logout limpia todo correctamente

---

## 💡 Ventajas de Esta Aproximación

### **1. Consistencia**
- Mismos patrones que Supabase
- Nomenclatura familiar
- Estructura predecible

### **2. Migración Gradual**
- API compatible
- Cambios mínimos requeridos
- Coexistencia temporal posible

### **3. Mantenibilidad**
- Código organizado
- Responsabilidades claras
- Fácil de debuggear

### **4. Escalabilidad**
- Patrón probado
- Extensible
- Documentado

---

## 🚧 Estado Actual vs Futuro

### **✅ Implementado**
- Estructura completa Directus
- LoginForm migrado
- Dashboard funcionando
- Navbar integrado
- Middleware activo

### **🔮 Próximos Pasos Opcionales**
1. Migrar register forms (si se necesita)
2. Implementar password recovery
3. Añadir roles-based routing
4. Optimizar performance
5. Añadir tests automatizados

---

## 📝 Conclusión

Esta implementación proporciona:

- ✅ **Estructura profesional** siguiendo patrones establecidos
- ✅ **Compatibilidad** con APIs conocidas
- ✅ **Flexibilidad** para migración gradual
- ✅ **Mantenibilidad** a largo plazo
- ✅ **Consistencia** en todo el codebase

El resultado es un sistema de autenticación robusto, bien estructurado y fácil de entender que mantiene la familiaridad de Supabase pero usa Directus como backend.