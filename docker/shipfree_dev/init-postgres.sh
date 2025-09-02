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
EOSQL
