#!/bin/bash

# Script para refrescar Directus después de modificaciones directas en la base de datos
# Uso: ./scripts/directus-refresh.sh

echo "🔄 Refrescando Directus después de modificaciones en la base de datos..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    exit 1
fi

# Verificar que el contenedor de Directus exista
if ! docker container inspect directus_shipfree > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Contenedor 'directus_shipfree' no encontrado${NC}"
    echo "   Asegúrate de que los contenedores estén corriendo:"
    echo "   docker compose -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml up -d"
    exit 1
fi

echo -e "${YELLOW}⏳ Reiniciando contenedor de Directus...${NC}"

# Reiniciar Directus para limpiar cache y refrescar datos
docker restart directus_shipfree

echo -e "${YELLOW}⏳ Esperando a que Directus se reinicie...${NC}"

# Esperar a que Directus esté listo
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8070/server/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Directus está listo y funcionando${NC}"
        echo -e "${GREEN}🎯 Los cambios realizados en la base de datos ahora deberían reflejarse en Directus${NC}"
        echo ""
        echo -e "📱 Accesos disponibles:"
        echo -e "   • Directus CMS: ${GREEN}http://localhost:8070${NC}"
        echo -e "   • pgAdmin:      ${GREEN}http://localhost:5070${NC}"
        echo -e "   • Aplicación:   ${GREEN}http://localhost:3070${NC}"
        echo ""
        echo -e "👤 Credenciales Directus:"
        echo -e "   • Email:    ${YELLOW}admin@shipfree.dev${NC}"
        echo -e "   • Password: ${YELLOW}AdminPassword123!${NC}"
        exit 0
    fi

    ATTEMPT=$((ATTEMPT + 1))
    echo -e "${YELLOW}⏳ Intento $ATTEMPT/$MAX_ATTEMPTS - Esperando...${NC}"
    sleep 2
done

echo -e "${RED}❌ Error: Directus no respondió después de $MAX_ATTEMPTS intentos${NC}"
echo -e "${YELLOW}🔍 Verifica los logs con: docker logs directus_shipfree${NC}"
exit 1
