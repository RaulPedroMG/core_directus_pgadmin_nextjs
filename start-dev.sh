#!/bin/bash

# ============================================
# 🚀 ShipFree Development Environment Launcher
# ============================================
# This script starts the ShipFree development environment with proper environment variables

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ShipFree - Development Environment Launcher${NC}"
echo "=================================================="
echo

# Check if running from project root
if [ ! -f ".env.dev" ]; then
    echo -e "${RED}❌ Error: .env.dev file not found${NC}"
    echo -e "${YELLOW}💡 Run this script from the ShipFree project root${NC}"
    exit 1
fi

# 1. Validate environment
echo -e "${YELLOW}🔍 Step 1: Validating development environment...${NC}"
./scripts/validate-env.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Environment validation failed. Fix the issues and try again.${NC}"
    exit 1
fi
echo

# 2. Start the development environment
echo -e "${YELLOW}🐳 Step 2: Starting Docker containers...${NC}"
docker compose --env-file .env.dev \
    -f docker/shipfree_dev/docker-compose.yml \
    -f docker/shipfree_dev/docker-compose.postgres.yml \
    -f docker/shipfree_dev/docker-compose.directus.yml \
    up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start Docker containers. Check the error messages above.${NC}"
    exit 1
fi
echo

# 3. Wait for services to be ready
echo -e "${YELLOW}⏳ Step 3: Waiting for services to be ready...${NC}"
echo "This may take a minute or two..."

# Read port values from .env.dev
source .env.dev

# Wait for Next.js app
echo -n "   Waiting for Next.js app..."
timeout=30
while ! curl -s "http://localhost:${APP_PORT_DEV}" > /dev/null; do
    sleep 1
    timeout=$((timeout-1))
    if [ $timeout -eq 0 ]; then
        echo -e " ${YELLOW}(still starting)${NC}"
        break
    fi
done
if [ $timeout -ne 0 ]; then
    echo -e " ${GREEN}✅ Ready${NC}"
fi

# Wait for Directus
echo -n "   Waiting for Directus..."
timeout=30
while ! curl -s "http://localhost:${DIRECTUS_PORT_DEV}/server/health" > /dev/null; do
    sleep 1
    timeout=$((timeout-1))
    if [ $timeout -eq 0 ]; then
        echo -e " ${YELLOW}(still starting)${NC}"
        break
    fi
done
if [ $timeout -ne 0 ]; then
    echo -e " ${GREEN}✅ Ready${NC}"
fi

# Check Postgres
echo -n "   Checking PostgreSQL..."
if docker exec shipfree_dev-postgres-1 pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
    echo -e " ${GREEN}✅ Ready${NC}"
else
    echo -e " ${YELLOW}(still starting)${NC}"
fi

# 4. Show access information
echo
echo -e "${GREEN}🎉 Development environment is running!${NC}"
echo
echo -e "${BLUE}📱 Access your services:${NC}"
echo -e "   • Next.js App:    ${GREEN}http://localhost:${APP_PORT_DEV}${NC}"
echo -e "   • Directus CMS:   ${GREEN}http://localhost:${DIRECTUS_PORT_DEV}${NC}"
echo -e "   • pgAdmin:        ${GREEN}http://localhost:${PGADMIN_PORT_DEV}${NC}"
echo -e "   • Portainer:      ${GREEN}http://localhost:${PORTAINER_PORT_DEV}${NC}"
echo
echo -e "${BLUE}👤 Login credentials:${NC}"
echo -e "   • Directus:       ${YELLOW}${DIRECTUS_ADMIN_EMAIL}${NC} / ${YELLOW}${DIRECTUS_ADMIN_PASSWORD}${NC}"
echo -e "   • pgAdmin:        ${YELLOW}${PGADMIN_DEFAULT_EMAIL}${NC} / ${YELLOW}${PGADMIN_DEFAULT_PASSWORD}${NC}"
echo
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "   • View logs:      ${YELLOW}docker compose --env-file .env.dev -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml logs -f${NC}"
echo -e "   • Stop services:  ${YELLOW}docker compose --env-file .env.dev -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml down${NC}"
echo -e "   • Restart:        ${YELLOW}./start-dev.sh${NC}"
echo

exit 0
