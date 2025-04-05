# Migrace databáze na Heroku

Tento dokument popisuje proces migrace lokální databáze PostgreSQL na Heroku PostgreSQL.

## Postup migrace

1. Vytvořen migrační skript `migrate-database.sh`, který postupně:
   - Exportuje schéma databáze z lokální PostgreSQL
   - Vytvoří tabulky v Heroku PostgreSQL
   - Migruje data tabulka po tabulce v pořadí respektujícím závislosti cizích klíčů
   - Ověří migrace porovnáním počtu záznamů v každé tabulce

2. Struktura migrovaných tabulek:
   - users (uživatelé)
   - equipment_categories (kategorie vybavení)
   - suppliers (dodavatelé)
   - warehouses (sklady)
   - equipment (vybavení)
   - customers (zákazníci)
   - orders (zakázky)
   - rentals (výpůjčky)
   - returns (vratky)
   - invoices (faktury)
   - invoice_items (položky faktur)
   - user_customer_access (přístup uživatelů k zákazníkům)
   - user_order_access (přístup uživatelů k zakázkám)

3. Oprava API cest pro produkční prostředí
   - Opraveno směrování API požadavků v souboru `frontend/src/config.js`
   - Odstraněn duplikovaný prefix `/api` v URL cestách

## Detaily migrace

- **Datum migrace**: 5. 4. 2025
- **Cílová databáze**: Heroku PostgreSQL
- **Výsledek**: Úspěšně migrována celá databáze včetně dat

## Přístup k databázi na Heroku

Pro přístup k Heroku PostgreSQL databázi je možné použít příkaz:

```bash
heroku pg:psql
```

nebo se připojit pomocí externího klienta s použitím URL:

```
heroku config:get DATABASE_URL
```

## Problémy a řešení

Při migraci byl opraven problém s nesprávnými cestami API v produkčním nasazení. V produkční verzi docházelo k dvojitému přidání `/api` prefixu k URL cestám API, což způsobovalo chyby 404.

Řešení: Upraveno nastavení v souboru `frontend/src/config.js` - odstraněn duplikovaný prefix pro produkční prostředí.