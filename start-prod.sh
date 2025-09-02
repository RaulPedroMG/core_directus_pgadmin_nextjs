#!/bin/bash

# ============================================
# 🚀 ShipFree Production Environment Launcher
# ============================================
# This script starts the ShipFree production environment with proper environment variables

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ShipFree - Production Environment Launcher${NC}"
echo "=================================================="
echo

# Check if running from project root
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}❌ Error: .env.prod file not found${NC}"
    echo -e "${YELLOW}💡 Run this script from the ShipFree project root${NC}"
    exit 1
fi

# 1. Validate environment with comprehensive production checks
echo -e "${YELLOW}🔍 Step 1: Validating production environment...${NC}"
./scripts/validate-env-prod.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Production environment validation failed. Fix the issues and try again.${NC}"
    echo -e "${YELLOW}💡 Security issues must be fixed before deploying to production!${NC}"
    exit 1
fi
echo

# 2. Start the production environment
echo -e "${YELLOW}🐳 Step 2: Starting Docker containers...${NC}"
docker compose --env-file .env.prod \
    -f docker/prod/docker-compose.yml \
    -f docker/prod/docker-compose.postgres.yml \
    up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start Docker containers. Check the error messages above.${NC}"
    exit 1
fi
echo

# 3. Wait for services to be ready
echo -e "${YELLOW}⏳ Step 3: Waiting for services to be ready...${NC}"
echo "This may take a minute or two for production startup..."

# Read port values from .env.prod
source .env.prod

# Wait for main application
echo -n "   Waiting for Application..."
timeout=60
while ! curl -s "http://localhost:${APP_PORT_PROD}" > /dev/null; do
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
if docker exec $(docker ps -q -f name=postgres) pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
    echo -e " ${GREEN}✅ Ready${NC}"
else
    echo -e " ${YELLOW}(still starting)${NC}"
fi

# 4. Display security reminders
echo
echo -e "${YELLOW}🔒 PRODUCTION SECURITY REMINDERS:${NC}"
echo -e "   • Ensure your firewall is properly configured"
echo -e "   • Set up SSL/TLS certificates if not already done"
echo -e "   • Configure regular database backups"
echo -e "   • Monitor logs for suspicious activity"
echo -e "   • Regularly update dependencies and Docker images"
echo

# 5. Show access information
echo -e "${GREEN}🎉 Production environment is running!${NC}"
echo
echo -e "${BLUE}📱 Access your services:${NC}"
echo -e "   • Application:     ${GREEN}http://localhost:${APP_PORT_PROD}${NC}"
if [[ ! -z "$NEXT_PUBLIC_DIRECTUS_URL" && "$NEXT_PUBLIC_DIRECTUS_URL" != "http://localhost"* ]]; then
    echo -e "   • Directus CMS:   ${GREEN}${NEXT_PUBLIC_DIRECTUS_URL}${NC}"
fi
echo -e "   • Portainer:      ${GREEN}http://localhost:${PORTAINER_PORT_PROD}${NC}"
echo
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "   • View logs:      ${YELLOW}docker compose --env-file .env.prod -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.postgres.yml logs -f${NC}"
echo -e "   • Stop services:  ${YELLOW}docker compose --env-file .env.prod -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.postgres.yml down${NC}"
echo -e "   • Restart:        ${YELLOW}./start-prod.sh${NC}"
echo
echo -e "${BLUE}📊 Monitoring:${NC}"
echo -e "   • Check service status with Portainer"
echo -e "   • View application logs for errors"
if [[ ! -z "$SENTRY_DSN" && "$SENTRY_DSN" != *"your_sentry_dsn"* ]]; then
    echo -e "   • Monitor errors in Sentry dashboard"
fi
echo

exit 0
