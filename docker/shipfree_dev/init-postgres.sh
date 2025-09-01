#!/bin/bash
set -e

# Grant full superuser privileges to devuser and create directus_db
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER devuser WITH SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;
    CREATE DATABASE directus_db OWNER devuser;
    GRANT ALL PRIVILEGES ON DATABASE directus_db TO devuser;
    GRANT ALL PRIVILEGES ON DATABASE shipfreedev TO devuser;
EOSQL

# Grant permissions on all tables in directus_db (for future tables)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "directus_db" <<-EOSQL
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO devuser;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO devuser;
    GRANT ALL PRIVILEGES ON SCHEMA public TO devuser;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO devuser;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO devuser;

    -- Create additional admin user for pgAdmin
    CREATE USER dbadmin WITH PASSWORD 'admin123' SUPERUSER;
    GRANT ALL PRIVILEGES ON DATABASE directus_db TO dbadmin;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbadmin;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dbadmin;
    GRANT ALL PRIVILEGES ON SCHEMA public TO dbadmin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dbadmin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dbadmin;
EOSQL

echo "Full superuser privileges granted to devuser"
echo "Database directus_db created successfully"
echo "All privileges granted on both databases"
echo "Additional admin user 'dbadmin' created for pgAdmin access"
echo "All users can now edit all Directus tables"
