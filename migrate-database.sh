#!/bin/bash

# Script for migrating local database to Heroku
# This script exports data from local PostgreSQL database and imports it to Heroku

set -e  # Exit on error

# Local database configuration
LOCAL_DB="pujcovna"
LOCAL_USER="imac"

# Extract Heroku database credentials from DATABASE_URL
HEROKU_DB_URL=$(heroku config:get DATABASE_URL)
HEROKU_DB_HOST=$(echo $HEROKU_DB_URL | sed -E 's/postgres:\/\/[^:]+:[^@]+@([^:]+):.*/\1/')
HEROKU_DB_PORT=$(echo $HEROKU_DB_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
HEROKU_DB_NAME=$(echo $HEROKU_DB_URL | sed -E 's/.*\/([^?]+).*/\1/')
HEROKU_DB_USER=$(echo $HEROKU_DB_URL | sed -E 's/postgres:\/\/([^:]+):.*/\1/')
HEROKU_DB_PASSWORD=$(echo $HEROKU_DB_URL | sed -E 's/postgres:\/\/[^:]+:([^@]+)@.*/\1/')

echo "Migrating database from local PostgreSQL to Heroku..."
echo "Local DB: $LOCAL_DB"
echo "Heroku DB Host: $HEROKU_DB_HOST"
echo "Heroku DB Name: $HEROKU_DB_NAME"

# Temporary directory for SQL files
TEMP_DIR="./temp_migration"
mkdir -p $TEMP_DIR

# Step 1: Schema migration - Generate schema SQL for each table separately
echo "Step 1: Generating schemas for each table..."

# Create schema.sql file with all CREATE TABLE statements
pg_dump --schema-only --no-owner --no-privileges $LOCAL_DB > $TEMP_DIR/schema.sql

# Step 2: Create the base tables in Heroku
echo "Step 2: Creating base tables in Heroku..."
PGPASSWORD=$HEROKU_DB_PASSWORD psql -h $HEROKU_DB_HOST -p $HEROKU_DB_PORT -U $HEROKU_DB_USER -d $HEROKU_DB_NAME -f $TEMP_DIR/schema.sql

# Step 3: Data export/import for each table in the correct order
echo "Step 3: Migrating data table by table..."

# Define table migration order (to respect foreign key constraints)
TABLES=(
  "users"
  "equipment_categories"
  "suppliers"
  "warehouses"
  "equipment"
  "customers"
  "orders"
  "rentals"
  "returns"
  "invoices"
  "invoice_items"
  "user_customer_access"
  "user_order_access"
)

for TABLE in "${TABLES[@]}"; do
  echo "Migrating table: $TABLE"
  
  # Check if table exists in local database
  if psql -U $LOCAL_USER -d $LOCAL_DB -c "\dt $TABLE" | grep -q "$TABLE"; then
    # Export data from local database
    pg_dump --data-only --table=$TABLE --no-owner --no-privileges $LOCAL_DB > $TEMP_DIR/${TABLE}_data.sql
    
    # Import data to Heroku database
    PGPASSWORD=$HEROKU_DB_PASSWORD psql -h $HEROKU_DB_HOST -p $HEROKU_DB_PORT -U $HEROKU_DB_USER -d $HEROKU_DB_NAME -f $TEMP_DIR/${TABLE}_data.sql
    
    echo "Table $TABLE migrated successfully."
  else
    echo "Table $TABLE does not exist in local database, skipping."
  fi
done

# Step 4: Verify migration
echo "Step 4: Verifying migration..."
for TABLE in "${TABLES[@]}"; do
  echo "Checking count for table: $TABLE"
  
  # Check if table exists in local database
  if psql -U $LOCAL_USER -d $LOCAL_DB -c "\dt $TABLE" | grep -q "$TABLE"; then
    # Get count from local database
    LOCAL_COUNT=$(psql -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM $TABLE;")
    
    # Get count from Heroku database
    HEROKU_COUNT=$(PGPASSWORD=$HEROKU_DB_PASSWORD psql -h $HEROKU_DB_HOST -p $HEROKU_DB_PORT -U $HEROKU_DB_USER -d $HEROKU_DB_NAME -t -c "SELECT COUNT(*) FROM $TABLE;")
    
    echo "Table $TABLE - Local: $LOCAL_COUNT, Heroku: $HEROKU_COUNT"
  fi
done

echo "Migration completed. Check the output above for any errors."

# Cleanup
rm -rf $TEMP_DIR