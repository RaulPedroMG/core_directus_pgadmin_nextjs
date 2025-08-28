#!/bin/bash

echo "🔄 Actualizando PostgreSQL de 15 a 17.6..."

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo."
    exit 1
fi

# Verificar si hay contenedores corriendo
if docker ps | grep -q "shipfree_dev-postgres"; then
    echo "📦 Contenedores PostgreSQL detectados. Haciendo backup..."

    # Crear backup
    echo "💾 Creando backup de la base de datos..."
    docker exec shipfree_dev-postgres-1 pg_dump -U devuser shipfreedev > backup_postgres_15_$(date +%Y%m%d_%H%M%S).sql

    if [ $? -eq 0 ]; then
        echo "✅ Backup creado exitosamente"
    else
        echo "❌ Error creando backup. ¿Continuar sin backup? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "🛑 Actualización cancelada"
            exit 1
        fi
    fi

    # Detener contenedores
    echo "🛑 Deteniendo contenedores..."
    docker compose -f docker/ShipFree_dev/docker-compose.yml -f docker/ShipFree_dev/docker-compose.postgres.yml down
fi

# Eliminar volumen de datos (opcional - solo si quieres empezar limpio)
echo "🗑️  Eliminando volumen de datos anterior..."
docker volume rm shipfree_dev_postgres_data 2>/dev/null || echo "Volumen no encontrado o ya eliminado"

# Levantar con nueva versión
echo "🚀 Levantando PostgreSQL 17.6..."
docker compose -f docker/ShipFree_dev/docker-compose.yml -f docker/ShipFree_dev/docker-compose.postgres.yml up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando que PostgreSQL 17.6 esté listo..."
sleep 10

# Verificar que PostgreSQL esté funcionando
if docker exec shipfree_dev-postgres-1 pg_isready -U devuser -d shipfreedev; then
    echo "✅ PostgreSQL 17.6 está funcionando correctamente"

    # Mostrar versión
    echo "📊 Versión de PostgreSQL:"
    docker exec shipfree_dev-postgres-1 psql -U devuser -d shipfreedev -c "SELECT version();"

    echo ""
    echo "🎉 Actualización completada exitosamente!"
    echo ""
    echo "📝 Si tenías datos importantes, puedes restaurarlos con:"
    echo "   docker exec -i shipfree_dev-postgres-1 psql -U devuser shipfreedev < backup_postgres_15_YYYYMMDD_HHMMSS.sql"

else
    echo "❌ Error: PostgreSQL 17.6 no está funcionando correctamente"
    echo "🔍 Revisa los logs con: docker logs shipfree_dev-postgres-1"
    exit 1
fi
