# 🔧 Solución: Problema de Logout Automático

Este documento describe la solución implementada para el problema donde el usuario se deslogueaba automáticamente después del login.

## ❌ Problema Original

Después de hacer login exitoso, el usuario era redirigido inmediatamente de vuelta a la página de login, sin poder acceder al dashboard. Esto creaba un ciclo infinito de redirecciones.

### Síntomas:
- Login exitoso pero redirección inmediata al login
- No se mantenía la sesión
- Logs mostraban múltiples redirects entre `/dashboard` y `/directus-login`
- Token no se persistía correctamente

## 🔍 Causas Identificadas

### 1. **Manejo Incorrecto de Tokens**
- Los tokens se guardaban con nombres inconsistentes
- No se establecían correctamente en el cliente de Directus
- Falta de sincronización entre localStorage y el SDK

### 2. **Estados de Carga Problemáticos**
- El hook de autenticación causaba redirecciones prematuras
- Estados de loading mal manejados
- Race conditions en la inicialización

### 3. **Cliente Directus Mal Configurado**
- Instancia única que no manejaba tokens correctamente
- Falta de auto-refresh de tokens
- No se restauraba el token al inicializar

## ✅ Soluciones Implementadas

### 1. **Cliente Directus Mejorado (`src/lib/directus/client.ts`)**

```typescript
// Problema: Instancia estática sin manejo de tokens
export const directus = createDirectus(url).with(rest()).with(authentication());

// Solución: Factory function con manejo dinámico de tokens
let directusClient = null;
function getDirectusClient() {
  if (!directusClient) {
    directusClient = createDirectus(url)
      .with(rest())
      .with(authentication("json", { autoRefresh: true }));
    
    // Restaurar token almacenado
    const token = localStorage.getItem("directus_access_token");
    if (token) {
      directusClient.setToken(token);
    }
  }
  return directusClient;
}
```

**Beneficios:**
- ✅ Token se restaura automáticamente al inicializar
- ✅ Auto-refresh habilitado
- ✅ Nombres de token consistentes
- ✅ Manejo robusto de estados

### 2. **Hook de Autenticación Mejorado (`src/hooks/useDirectusAuth.ts`)**

```typescript
// Problema: Redirecciones prematuras y states inconsistentes
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push("/directus-login");
  }
}, [isLoading, isAuthenticated, router]);

// Solución: Verificación robusta y delay
useEffect(() => {
  if (!isLoading && !isAuthenticated && user === null) {
    const timeout = setTimeout(() => {
      router.push("/directus-login");
    }, 100);
    return () => clearTimeout(timeout);
  }
}, [isLoading, isAuthenticated, user, router]);
```

**Mejoras:**
- ✅ Evita redirecciones prematuras
- ✅ Verifica múltiples estados antes de redirigir
- ✅ Usa timeout para evitar race conditions
- ✅ Manejo de cleanup apropiado

### 3. **Persistencia de Token Mejorada**

```typescript
// Problema: Token mal guardado
localStorage.setItem('directus_token', token);

// Solución: Token con nombres específicos y sync con cliente
localStorage.setItem("directus_access_token", token);
localStorage.setItem("directus_refresh_token", refreshToken);
client.setToken(token); // Sincronizar con SDK
```

### 4. **Inicialización Robusta**

```typescript
const initializeAuth = async () => {
  if (initializingRef.current) return; // Prevenir múltiples inicializaciones
  initializingRef.current = true;

  const token = directusAuth.getToken();
  if (token) {
    await refreshUser();
  } else {
    setIsLoading(false);
    setIsAuthenticated(false);
  }
};
```

## 🔧 Cambios Específicos Realizados

### Archivos Modificados:

1. **`src/lib/directus/client.ts`**
   - Factory function para cliente dinámico
   - Manejo mejorado de tokens
   - Auto-refresh habilitado
   - Limpieza automática de tokens inválidos

2. **`src/hooks/useDirectusAuth.ts`**
   - Prevención de race conditions
   - Estados más granulares
   - Inicialización con useRef
   - Delays estratégicos

3. **`src/components/DirectusLoginForm.tsx`**
   - Delay post-login para asegurar estado
   - Mejor manejo de redirección

4. **`src/app/dashboard/page.tsx`**
   - Condiciones de redirección más específicas
   - Estados de loading mejorados

## 🧪 Verificación de la Solución

### Antes del Fix:
```
Login ✅ → Dashboard ❌ → Redirect to Login → Loop infinito
```

### Después del Fix:
```
Login ✅ → Dashboard ✅ → Sesión persistente ✅
```

### Para Probar:
1. Ir a `http://localhost:3070`
2. Clic "Iniciar sesión"
3. Login con: `juan@test.com` / `123456789`
4. Verificar que se mantiene en `/dashboard`
5. Refrescar página → debe mantenerse logueado
6. Cerrar y reabrir navegador → debe mantenerse logueado

## 🔍 Debugging Adicional

### Verificar Token en Consola:
```javascript
// En DevTools Console
console.log('Token:', localStorage.getItem('directus_access_token'));
console.log('Refresh:', localStorage.getItem('directus_refresh_token'));
```

### Limpiar Estado si Hay Problemas:
```javascript
// En DevTools Console
localStorage.removeItem('directus_access_token');
localStorage.removeItem('directus_refresh_token');
window.location.reload();
```

### Verificar Logs del Servidor:
```bash
docker logs shipfree_dev-app-1 --tail 20
```

## 📊 Métricas de Éxito

### ✅ Estados Esperados:
- Login exitoso → Dashboard visible
- Refresh de página → mantiene sesión
- Token válido → no redirección
- Token inválido → limpieza automática y redirect a login
- Logout → limpieza completa y redirect a home

### ✅ Flujo de Navegación:
```
Home → Login → Dashboard → (refresh) → Dashboard ✅
Home → Login → Dashboard → Logout → Home ✅
```

## 🚀 Estado Final

**Problema completamente solucionado:**
- ✅ Sesiones se mantienen correctamente
- ✅ No hay redirecciones infinitas
- ✅ Tokens se persisten apropiadamente
- ✅ Dashboard accesible post-login
- ✅ Logout funciona correctamente
- ✅ Estados de loading apropiados

## 🔮 Prevención de Problemas Futuros

### Monitoreo:
- Verificar logs regularmente para redirecciones no deseadas
- Testear flujo completo después de cambios
- Validar persistencia de tokens

### Mejores Prácticas:
- Siempre usar `getDirectusClient()` en lugar de instancia directa
- Verificar múltiples estados antes de redirecciones
- Usar timeouts para operaciones críticas
- Limpiar tokens en caso de errores 401/403

---

*Solución completada - El sistema de autenticación ahora es robusto y mantiene correctamente las sesiones de usuario.*