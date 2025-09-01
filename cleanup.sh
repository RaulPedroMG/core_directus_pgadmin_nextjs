#!/bin/bash

# 🧹 ShipFree Cleanup Script
# Este script elimina archivos duplicados e innecesarios del proyecto

set -e  # Exit on any error

echo "🧹 ShipFree - Script de Limpieza"
echo "================================="

# Function to safely remove files/directories
safe_remove() {
    if [ -e "$1" ]; then
        echo "🗑️  Eliminando: $1"
        rm -rf "$1"
    else
        echo "⚠️  No existe: $1"
    fi
}

# Function to check if user wants to proceed
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

echo
echo "⚠️  IMPORTANTE: Este script eliminará archivos permanentemente."
echo "   Asegúrate de tener un backup o commit en git."
echo

if ! confirm "¿Continuar con la limpieza?"; then
    echo "❌ Limpieza cancelada por el usuario."
    exit 0
fi

echo
echo "🔄 Iniciando limpieza..."
echo

# 1. Eliminar dashboards duplicados
echo "📂 Limpiando dashboards duplicados..."
safe_remove "src/app/directus-dashboard/"
safe_remove "src/app/dashboard/account-form.tsx"

# 2. Eliminar componentes de autenticación obsoletos
echo "🔐 Limpiando componentes de auth obsoletos..."
safe_remove "src/app/auth/"
safe_remove "src/components/LoginForm/"
safe_remove "src/components/login-form.tsx"
safe_remove "src/components/register-form.tsx"
safe_remove "src/components/RegisterForm.tsx"

# 3. Eliminar componentes no utilizados
echo "🔧 Limpiando componentes no utilizados..."
safe_remove "src/components/LoadingSpinner.tsx"

# 4. Verificar uso de archivos antes de eliminar
echo "🔍 Verificando archivos cuestionables..."

# Check lemon-button usage
if grep -r "lemon-button" src/ > /dev/null 2>&1; then
    echo "⚠️  lemon-button.tsx está siendo usado - no se eliminará"
else
    echo "🗑️  lemon-button.tsx no se usa"
    safe_remove "src/components/lemon-button.tsx"
fi

# Check supabase middleware usage
if grep -r "supabase/middleware" src/ > /dev/null 2>&1; then
    echo "⚠️  middleware.ts de Supabase está siendo usado - no se eliminará"
else
    echo "🗑️  middleware.ts de Supabase no se usa"
    safe_remove "src/lib/supabase/middleware.ts"
fi

# 5. Limpiar archivos de documentación temporal
echo "📄 Limpiando documentación temporal..."
safe_remove "CLEANUP-AUDIT.md"
safe_remove "DASHBOARD-UPGRADE.md"
safe_remove "DIRECTUS-AUTH-IMPLEMENTATION.md"
safe_remove "DIRECTUS-AUTH-SETUP.md"
safe_remove "SESSION-FIX.md"
safe_remove "SUPABASE-ERROR-SOLUTION.md"

# 6. Opcional: Limpiar dependencias no utilizadas
echo
if confirm "¿Deseas eliminar dependencias obsoletas (lemonsqueezy, next-auth)?"; then
    echo "📦 Eliminando dependencias obsoletas..."

    # Check if running in Docker
    if [ -f /.dockerenv ]; then
        echo "🐳 Ejecutando en Docker - usando npm"
        npm uninstall lemonsqueezy lemonsqueezy.ts next-auth 2>/dev/null || echo "⚠️  Algunas dependencias ya no estaban instaladas"
    else
        echo "💻 Ejecutando en host - detectando gestor de paquetes"
        if [ -f "pnpm-lock.yaml" ]; then
            pnpm remove lemonsqueezy lemonsqueezy.ts next-auth 2>/dev/null || echo "⚠️  Algunas dependencias ya no estaban instaladas"
        elif [ -f "package-lock.json" ]; then
            npm uninstall lemonsqueezy lemonsqueezy.ts next-auth 2>/dev/null || echo "⚠️  Algunas dependencias ya no estaban instaladas"
        else
            echo "⚠️  No se pudo detectar el gestor de paquetes"
        fi
    fi
else
    echo "⏭️  Saltando eliminación de dependencias"
fi

# 7. Crear resumen de limpieza
echo
echo "📊 RESUMEN DE LIMPIEZA"
echo "====================="

# Count removed items (approximate)
removed_count=0
removed_items=""

# Check what was actually removed
for item in \
    "src/app/directus-dashboard/" \
    "src/app/dashboard/account-form.tsx" \
    "src/app/auth/" \
    "src/components/LoginForm/" \
    "src/components/login-form.tsx" \
    "src/components/register-form.tsx" \
    "src/components/RegisterForm.tsx" \
    "src/components/LoadingSpinner.tsx"
do
    if [ ! -e "$item" ]; then
        removed_count=$((removed_count + 1))
        removed_items="$removed_items\n  ✅ $item"
    fi
done

echo "🗑️  Archivos/directorios eliminados: $removed_count"
echo -e "$removed_items"

# 8. Verificación final
echo
echo "🔍 VERIFICACIÓN FINAL"
echo "==================="

# Check for any broken imports
echo "🔗 Verificando imports rotos..."
if grep -r "from.*directus-dashboard" src/ > /dev/null 2>&1; then
    echo "⚠️  ADVERTENCIA: Encontrados imports a directus-dashboard eliminado"
fi

if grep -r "from.*LoginForm/LoginForm" src/ > /dev/null 2>&1; then
    echo "⚠️  ADVERTENCIA: Encontrados imports a LoginForm eliminado"
fi

if grep -r "from.*account-form" src/ > /dev/null 2>&1; then
    echo "⚠️  ADVERTENCIA: Encontrados imports a account-form eliminado"
fi

echo "✅ Verificación de imports completada"

# 9. Recommendations
echo
echo "💡 RECOMENDACIONES POST-LIMPIEZA"
echo "==============================="
echo "1. 🧪 Ejecutar: npm run build (o pnpm build) para verificar que no hay errores"
echo "2. 🌐 Probar la aplicación en: http://localhost:3070"
echo "3. 🔐 Verificar login/logout funcionan correctamente"
echo "4. 📝 Hacer commit de los cambios si todo funciona bien"
echo

# 10. Final status
echo "🎉 ¡LIMPIEZA COMPLETADA!"
echo "======================="
echo "✅ Proyecto más limpio y mantenible"
echo "✅ Código duplicado eliminado"
echo "✅ Componentes obsoletos removidos"
echo "✅ Un solo flujo de autenticación (Directus)"
echo

echo "⚡ Próximos pasos:"
echo "   1. Probar la aplicación"
echo "   2. Ejecutar build para verificar"
echo "   3. Commit de cambios si todo está bien"
echo

exit 0
