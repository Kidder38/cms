#!/bin/bash

# Databázový migrační skript pro Heroku
# Použití: ./migrate-database.sh [local|heroku] [init|update]
# První parametr: cíl (local nebo heroku)
# Druhý parametr: typ migrace (init pro první inicializaci, update pro aktualizaci)

# Kontrola argumentů
if [ "$#" -lt 2 ]; then
    echo "Použití: ./migrate-database.sh [local|heroku] [init|update]"
    exit 1
fi

TARGET=$1
MIGRATION_TYPE=$2
HEROKU_APP="pujcovna-stavebnin"

# Nastavení databázového URL
if [ "$TARGET" = "local" ]; then
    DB_URL="postgres://postgres:postgres@localhost:5432/pujcovna_db"
    echo "Migrace na lokální databázi..."
elif [ "$TARGET" = "heroku" ]; then
    DB_URL=$(heroku config:get DATABASE_URL -a $HEROKU_APP)
    if [ -z "$DB_URL" ]; then
        echo "Nepodařilo se získat DATABASE_URL z Heroku."
        exit 1
    fi
    echo "Migrace na Heroku databázi..."
else
    echo "Neplatný cíl. Použijte 'local' nebo 'heroku'."
    exit 1
fi

# Funkce pro spuštění SQL souboru
run_sql_file() {
    local file=$1
    echo "Spouštím $file..."
    
    if [ "$TARGET" = "local" ]; then
        PGPASSWORD=postgres psql -h localhost -U postgres -d pujcovna_db -f $file
    else
        # Pro Heroku použijeme URL
        psql $DB_URL -f $file
    fi
    
    if [ $? -ne 0 ]; then
        echo "Chyba při spouštění $file"
        exit 1
    fi
}

# Provádění migrace podle typu
if [ "$MIGRATION_TYPE" = "init" ]; then
    echo "Inicializace databáze..."
    run_sql_file "database/init.sql"
    run_sql_file "database/alter_tables.sql"
    run_sql_file "database/warehouses.sql"
    
    # Pokud existují další inicializační skripty
    if [ -f "database/supplier_equipment.sql" ]; then
        run_sql_file "database/supplier_equipment.sql"
    fi
    
    echo "Inicializace databáze byla dokončena."
    
elif [ "$MIGRATION_TYPE" = "update" ]; then
    echo "Aktualizace databáze..."
    
    # Spuštění aktualizačních skriptů
    if [ -f "database/alter_tables.sql" ]; then
        run_sql_file "database/alter_tables.sql"
    fi
    
    if [ -f "database/add_available_stock.sql" ]; then
        run_sql_file "database/add_available_stock.sql"
    fi
    
    echo "Aktualizace databáze byla dokončena."
else
    echo "Neplatný typ migrace. Použijte 'init' nebo 'update'."
    exit 1
fi

echo "Databázová migrace byla úspěšně dokončena!"