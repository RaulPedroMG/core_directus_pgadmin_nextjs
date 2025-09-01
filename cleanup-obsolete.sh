#!/bin/bash

# ShipFree - Script de Limpieza de Archivos Obsoletos
# Este script elimina archivos que ya no se necesitan después de la migración a Directus

echo "🧹 ShipFree - Limpieza de Archivos Obsoletos"
echo "=============================================="

# Función para confirmar eliminación
confirm() {
    echo -e "\n❓ ¿Deseas continuar con la limpieza? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Operación cancelada por el usuario."
        exit 0
    fi
}

# Función para eliminar archivo/directorio si existe
remove_if_exists() {
    if [ -e "$1" ]; then
        echo "🗑️  Eliminando: $1"
        rm -rf "$1"
    else
        echo "⚠️  No encontrado: $1"
    fi
}

# Mostrar archivos que serán eliminados
echo -e "\n📋 Archivos y directorios que serán eliminados:"
echo ""
echo "🔸 MongoDB:"
echo "   - docker/prod/docker-compose.mongodb.yml"
echo "   - docker/shipfree_dev/docker-compose.mongodb.yml"
echo ""
echo "🔸 Supabase:"
echo "   - src/lib/supabase/"
echo "   - src/app/auth/"
echo ""
echo "🔸 Componentes obsoletos:"
echo "   - src/components/LoginForm/"
echo "   - src/components/login-form.tsx"
echo "   - src/components/register-form.tsx"
echo "   - src/components/RegisterForm.tsx"
echo ""
echo "🔸 APIs no utilizadas:"
echo "   - src/app/api/lemonsqueezy/"
echo "   - src/components/lemon-button.tsx"
echo "   - src/components/CheckoutButton.tsx"
echo ""
echo "🔸 Testing/desarrollo temporal:"
echo "   - src/app/test-logout/"
echo "   - src/app/api/test-auth/"
echo "   - final-test.js"
echo "   - test-auth.js"
echo "   - test-logout-fix.js"
echo "   - verify-console-clean.js"
echo ""
echo "🔸 Documentación de migración:"
echo "   - CLEANUP-AUDIT.md"
echo "   - DASHBOARD-UPGRADE.md"
echo "   - DIRECTUS-AUTH-IMPLEMENTATION.md"
echo "   - DIRECTUS-AUTH-SETUP.md"
echo "   - DIRECTUS-SUPABASE-STRUCTURE.md"
echo "   - LOGOUT-FIX-SUMMARY.md"
echo "   - SESSION-FIX.md"
echo "   - SUPABASE-ERROR-SOLUTION.md"
echo ""
echo "🔸 Scripts y configuraciones obsoletas:"
echo "   - actualizar-postgres-17.sh"
echo "   - cleanup.sh"
echo "   - drizzle.config.ts"
echo "   - pnpm-lock.yaml"

# Confirmar antes de proceder
confirm

echo -e "\n🚀 Iniciando limpieza..."

# 1. MongoDB
echo -e "\n📂 Eliminando archivos de MongoDB..."
remove_if_exists "docker/prod/docker-compose.mongodb.yml"
remove_if_exists "docker/shipfree_dev/docker-compose.mongodb.yml"

# 2. Supabase
echo -e "\n📂 Eliminando archivos de Supabase..."
remove_if_exists "src/lib/supabase"
remove_if_exists "src/app/auth"

# 3. Componentes obsoletos
echo -e "\n📂 Eliminando componentes obsoletos..."
remove_if_exists "src/components/LoginForm"
remove_if_exists "src/components/login-form.tsx"
remove_if_exists "src/components/register-form.tsx"
remove_if_exists "src/components/RegisterForm.tsx"

# 4. APIs no utilizadas
echo -e "\n📂 Eliminando APIs no utilizadas..."
remove_if_exists "src/app/api/lemonsqueezy"
remove_if_exists "src/app/api/stripe"
remove_if_exists "src/components/lemon-button.tsx"
remove_if_exists "src/components/CheckoutButton.tsx"

# 5. Testing/desarrollo temporal
echo -e "\n📂 Eliminando archivos de testing temporal..."
remove_if_exists "src/app/test-logout"
remove_if_exists "src/app/api/test-auth"
remove_if_exists "final-test.js"
remove_if_exists "test-auth.js"
remove_if_exists "test-logout-fix.js"
remove_if_exists "verify-console-clean.js"

# 6. Documentación de migración
echo -e "\n📂 Eliminando documentación de migración..."
remove_if_exists "CLEANUP-AUDIT.md"
remove_if_exists "DASHBOARD-UPGRADE.md"
remove_if_exists "DIRECTUS-AUTH-IMPLEMENTATION.md"
remove_if_exists "DIRECTUS-AUTH-SETUP.md"
remove_if_exists "DIRECTUS-SUPABASE-STRUCTURE.md"
remove_if_exists "LOGOUT-FIX-SUMMARY.md"
remove_if_exists "SESSION-FIX.md"
remove_if_exists "SUPABASE-ERROR-SOLUTION.md"

# 7. Scripts y configuraciones obsoletas
echo -e "\n📂 Eliminando scripts y configuraciones obsoletas..."
remove_if_exists "actualizar-postgres-17.sh"
remove_if_exists "cleanup.sh"
remove_if_exists "drizzle.config.ts"
remove_if_exists "pnpm-lock.yaml"

# Limpiar dependencias obsoletas del package.json (informativo)
echo -e "\n📦 Dependencias que podrías considerar eliminar del package.json:"
echo "   - @supabase/supabase-js"
echo "   - @supabase/ssr"
echo "   - lemonsqueezy.ts"
echo "   - drizzle-orm (si no se usa)"
echo "   - stripe (si no se usa)"

# Limpiar node_modules y reinstalar (opcional)
echo -e "\n🔄 ¿Deseas limpiar node_modules y reinstalar dependencias? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🧹 Limpiando node_modules..."
    rm -rf node_modules package-lock.json
    echo "📦 Reinstalando dependencias..."
    npm install
    echo "✅ Dependencias reinstaladas"
fi

echo -e "\n✅ ¡Limpieza completada!"
echo ""
echo "📋 Resumen:"
echo "   - Archivos MongoDB eliminados"
echo "   - Archivos Supabase eliminados"
echo "   - Componentes obsoletos eliminados"
echo "   - APIs no utilizadas eliminadas"
echo "   - Archivos de testing temporal eliminados"
echo "   - Documentación de migración eliminada"
echo "   - Scripts obsoletos eliminados"
echo ""
echo "🚀 Tu proyecto ahora está más limpio y optimizado."
echo "💡 Recuerda hacer commit de estos cambios:"
echo "   git add ."
echo "   git commit -m \"🧹 Remove obsolete files (MongoDB, Supabase, temp files)\""

# Auto-eliminación del script de limpieza
echo -e "\n🔄 ¿Deseas eliminar también este script de limpieza? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🗑️  Eliminando script de limpieza..."
    rm -f "$0"
    echo "✅ Script eliminado"
fi
