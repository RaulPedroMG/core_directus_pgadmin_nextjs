#!/bin/bash

# ===========================================
# 🔍 ShipFree Production Environment Validation Script
# ===========================================
# This script validates that all required environment variables are set for production

set -e

echo "🔍 ShipFree - Production Environment Validation"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.prod file exists
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}❌ Error: .env.prod file not found in project root${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this script from the ShipFree project root${NC}"
    echo -e "${YELLOW}💡 Copy .env.prod.example to .env.prod and configure it for production${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.prod file found${NC}"
echo

# Load .env.prod file for validation
set -a
source .env.prod
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

# Function to validate production security
validate_production_security() {
    local var_name=$1
    local var_value=${!var_name}
    local default_patterns=("CHANGE_THIS" "GENERATE_" "your_" "_here" "admin" "password" "123")

    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ MISSING: $var_name${NC}"
        return 1
    fi

    # Check for default/insecure values
    for pattern in "${default_patterns[@]}"; do
        if [[ "$var_value" == *"$pattern"* ]]; then
            echo -e "${RED}🚨 SECURITY RISK: $var_name contains default/insecure value${NC}"
            return 1
        fi
    done

    echo -e "${GREEN}✅ $var_name (secure)${NC}"
    return 0
}

# Function to validate URLs
validate_url() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ MISSING: $var_name${NC}"
        return 1
    fi

    if [[ "$var_value" == *"localhost"* ]] || [[ "$var_value" == *"127.0.0.1"* ]]; then
        echo -e "${RED}🚨 PRODUCTION ERROR: $var_name uses localhost (not suitable for production)${NC}"
        return 1
    fi

    if [[ "$var_value" == *"yourdomain.com"* ]] || [[ "$var_value" == *"example.com"* ]]; then
        echo -e "${RED}🚨 CONFIGURATION ERROR: $var_name uses placeholder domain${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ $var_name${NC}"
    return 0
}

# Track validation results
required_missing=0
security_issues=0

echo -e "${BLUE}🗄️  DATABASE CONFIGURATION${NC}"
echo "=========================="
validate_production_security "POSTGRES_USER" || ((required_missing++))
validate_production_security "POSTGRES_PASSWORD" || ((security_issues++))
validate_required "POSTGRES_DB" || ((required_missing++))
validate_required "DATABASE_URL" || ((required_missing++))

# Check if using strong database password
if [ ${#POSTGRES_PASSWORD} -lt 16 ]; then
    echo -e "${YELLOW}⚠️  WARNING: POSTGRES_PASSWORD should be at least 16 characters for production${NC}"
fi

echo

echo -e "${BLUE}🚢 PORT CONFIGURATION${NC}"
echo "==================="
validate_required "APP_PORT_PROD" || ((required_missing++))
validate_required "POSTGRES_PORT_PROD" || ((required_missing++))
validate_required "PORTAINER_PORT_PROD" || ((required_missing++))
echo

echo -e "${BLUE}🎛️  DIRECTUS CONFIGURATION${NC}"
echo "========================"
validate_url "NEXT_PUBLIC_DIRECTUS_URL" || ((required_missing++))
validate_required "DIRECTUS_INTERNAL_URL" || ((required_missing++))
validate_production_security "DIRECTUS_KEY" || ((security_issues++))
validate_production_security "DIRECTUS_SECRET" || ((security_issues++))
validate_production_security "DIRECTUS_ADMIN_PASSWORD" || ((security_issues++))
validate_url "DIRECTUS_PUBLIC_URL" || ((required_missing++))

# Check Directus key length (should be 255 characters)
if [ ${#DIRECTUS_KEY} -ne 36 ] && [ ${#DIRECTUS_KEY} -ne 255 ]; then
    echo -e "${YELLOW}⚠️  WARNING: DIRECTUS_KEY should be 36 or 255 characters${NC}"
fi

echo

echo -e "${BLUE}💳 PAYMENT PROVIDERS${NC}"
echo "==================="
validate_required "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" || ((required_missing++))
validate_production_security "STRIPE_SECRET_KEY" || ((security_issues++))
validate_production_security "STRIPE_WEBHOOK_SECRET" || ((security_issues++))

# Check if using live keys
if [[ "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" == pk_test_* ]]; then
    echo -e "${RED}🚨 PRODUCTION ERROR: Using Stripe test key in production${NC}"
    ((security_issues++))
fi

if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
    echo -e "${RED}🚨 PRODUCTION ERROR: Using Stripe test secret in production${NC}"
    ((security_issues++))
fi

echo

echo -e "${BLUE}📧 EMAIL CONFIGURATION${NC}"
echo "======================"
validate_production_security "MAILGUN_API_KEY" || ((security_issues++))
validate_required "MAILGUN_DOMAIN" || ((required_missing++))
validate_required "MAILGUN_FROM_EMAIL" || ((required_missing++))
validate_production_security "MAILGUN_SIGNING_KEY" || ((security_issues++))

# Check email domain
if [[ "$MAILGUN_FROM_EMAIL" == *"yourdomain.com"* ]]; then
    echo -e "${RED}🚨 CONFIGURATION ERROR: MAILGUN_FROM_EMAIL uses placeholder domain${NC}"
    ((required_missing++))
fi

echo

echo -e "${BLUE}🔒 SECURITY CONFIGURATION${NC}"
echo "========================="
validate_required "NODE_ENV" || ((required_missing++))

if [ "$NODE_ENV" != "production" ]; then
    echo -e "${RED}🚨 ERROR: NODE_ENV must be 'production' for production deployment${NC}"
    ((security_issues++))
fi

echo

echo -e "${BLUE}📊 PRODUCTION VALIDATION SUMMARY${NC}"
echo "================================"

total_issues=$((required_missing + security_issues))

if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}🎉 Production environment validation PASSED!${NC}"
    echo -e "${GREEN}✅ All required variables are configured securely${NC}"
    echo -e "${GREEN}✅ No security risks detected${NC}"
    echo
    echo -e "${BLUE}🚀 Production deployment checklist:${NC}"
    echo "   ✅ Environment variables validated"
    echo "   ⚠️  Ensure SSL certificates are configured"
    echo "   ⚠️  Set up database backups"
    echo "   ⚠️  Configure monitoring and alerts"
    echo "   ⚠️  Test all functionality in staging first"
    echo "   ⚠️  Review firewall and security settings"
    echo
    echo -e "${BLUE}🏃 Deploy command:${NC}"
    echo "   docker compose -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.postgres.yml up -d --build"
    echo
    exit 0
else
    echo -e "${RED}❌ Production validation FAILED${NC}"
    if [ $required_missing -gt 0 ]; then
        echo -e "${RED}   • $required_missing required variable(s) missing${NC}"
    fi
    if [ $security_issues -gt 0 ]; then
        echo -e "${RED}   • $security_issues security issue(s) found${NC}"
    fi
    echo
    echo -e "${YELLOW}🔧 Fix all issues before deploying to production!${NC}"
    echo -e "${YELLOW}📚 Refer to .env.prod comments for guidance${NC}"
    echo
    exit 1
fi
