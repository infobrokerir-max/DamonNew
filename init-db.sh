#!/bin/bash

DB_URL="postgres://postgres.hwtjybqujyeisdzxqkzh:Allahverdi7665@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

echo "Installing postgresql client..."
apt-get update -qq 2>&1 >/dev/null && apt-get install -y -qq postgresql-client 2>&1 >/dev/null

echo "Applying migrations..."
psql "$DB_URL" -f ./supabase/migrations/20251224232045_create_initial_schema.sql
psql "$DB_URL" -f ./supabase/migrations/20251224232306_seed_initial_data.sql
psql "$DB_URL" -f ./supabase/migrations/20251225000228_fix_rls_policies_use_profiles_role.sql

echo "✓ Database setup complete!"
