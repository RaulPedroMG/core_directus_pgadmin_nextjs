#!/bin/bash

# ===========================================
# 🔍 ShipFree Environment Validation Script
# ===========================================
# This script validates that all required environment variables are set

set -e

echo "🔍 ShipFree - Environment Validation"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.dev file exists
if [ ! -f ".env.dev" ]; then
    echo -e "${RED}❌ Error: .env.dev file not found in project root${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this script from the ShipFree project root${NC}"
    echo -e "${YELLOW}💡 Create .env.dev by copying .env.example and configuring it${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.dev file found${NC}"
echo

# Load .env.dev file for validation
set -a
source .env.dev
set +a

# Function to validate required variables
validate_required() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ MISSING: $var_name${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $var_name${NC}"
        return 0
    fi
}

# Function to validate optional variables
validate_optional() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ] || [[ "$var_value" == *"your_"* ]] || [[ "$var_value" == *"_here"* ]]; then
        echo -e "${YELLOW}⚠️  OPTIONAL: $var_name (not configured)${NC}"
        return 0
    else
        echo -e "${GREEN}✅ $var_name (configured)${NC}"
        return 0
    fi
}

# Track validation results
required_missing=0
optional_count=0

echo -e "${BLUE}🗄️  DATABASE CONFIGURATION${NC}"
echo "=========================="
validate_required "POSTGRES_USER" || ((required_missing++))
validate_required "POSTGRES_PASSWORD" || ((required_missing++))
validate_required "POSTGRES_DB" || ((required_missing++))
validate_required "DATABASE_URL" || ((required_missing++))
validate_required "PGADMIN_DEFAULT_EMAIL" || ((required_missing++))
validate_required "PGADMIN_DEFAULT_PASSWORD" || ((required_missing++))
echo

echo -e "${BLUE}🚢 PORT CONFIGURATION${NC}"
echo "==================="
validate_required "APP_PORT_DEV" || ((required_missing++))
validate_required "POSTGRES_PORT_DEV" || ((required_missing++))
validate_required "DIRECTUS_PORT_DEV" || ((required_missing++))
validate_required "PGADMIN_PORT_DEV" || ((required_missing++))
validate_required "PORTAINER_PORT_DEV" || ((required_missing++))
validate_required "APP_INTERNAL_PORT" || ((required_missing++))
validate_required "POSTGRES_INTERNAL_PORT" || ((required_missing++))
validate_required "DIRECTUS_INTERNAL_PORT" || ((required_missing++))
validate_required "PGADMIN_INTERNAL_PORT" || ((required_missing++))
validate_required "PORTAINER_INTERNAL_PORT" || ((required_missing++))
echo

echo -e "${BLUE}🎛️  DIRECTUS CONFIGURATION${NC}"
echo "========================"
validate_required "NEXT_PUBLIC_DIRECTUS_URL" || ((required_missing++))
validate_required "DIRECTUS_INTERNAL_URL" || ((required_missing++))
validate_required "DIRECTUS_DB_HOST" || ((required_missing++))
validate_required "DIRECTUS_DB_PORT" || ((required_missing++))
validate_required "DIRECTUS_DB_DATABASE" || ((required_missing++))
validate_required "DIRECTUS_DB_USER" || ((required_missing++))
validate_required "DIRECTUS_DB_PASSWORD" || ((required_missing++))
validate_required "DIRECTUS_KEY" || ((required_missing++))
validate_required "DIRECTUS_SECRET" || ((required_missing++))
validate_required "DIRECTUS_ADMIN_EMAIL" || ((required_missing++))
validate_required "DIRECTUS_ADMIN_PASSWORD" || ((required_missing++))
validate_required "DIRECTUS_PUBLIC_URL" || ((required_missing++))
echo

echo -e "${BLUE}🛠️  DEVELOPMENT CONFIGURATION${NC}"
echo "============================="
validate_required "NODE_ENV" || ((required_missing++))
validate_required "HUSKY" || ((required_missing++))
echo

echo -e "${BLUE}💳 PAYMENT PROVIDERS (Optional)${NC}"
echo "==============================="
validate_optional "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
validate_optional "STRIPE_SECRET_KEY"
validate_optional "STRIPE_WEBHOOK_SECRET"
validate_optional "LEMON_SQUEEZY_API_KEY"
validate_optional "LEMON_SQUEEZY_STORE_ID"
validate_optional "LEMON_SQUEEZY_WEBHOOK_SECRET"
echo

echo -e "${BLUE}📧 EMAIL CONFIGURATION (Optional)${NC}"
echo "================================="
validate_optional "MAILGUN_API_KEY"
validate_optional "MAILGUN_DOMAIN"
validate_optional "MAILGUN_FROM_EMAIL"
validate_optional "MAILGUN_SIGNING_KEY"
echo

echo -e "${BLUE}📊 VALIDATION SUMMARY${NC}"
echo "==================="

if [ $required_missing -eq 0 ]; then
    echo -e "${GREEN}🎉 All required variables are configured!${NC}"
    echo -e "${GREEN}✅ Your development environment is ready${NC}"
    echo
    echo -e "${BLUE}🚀 Next steps:${NC}"
    echo "   1. Run: docker compose -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml up -d --build"
    echo "   2. Access your app at: http://localhost:${APP_PORT_DEV}"
    echo "   3. Access Directus at: http://localhost:${DIRECTUS_PORT_DEV}"
    echo
    exit 0
else
    echo -e "${RED}❌ $required_missing required variable(s) missing${NC}"
    echo -e "${YELLOW}⚠️  Please configure the missing variables in your .env file${NC}"
    echo
    exit 1
fi
