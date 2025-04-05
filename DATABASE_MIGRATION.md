# Migrace databáze a oprava API cest

Tento dokument popisuje proces migrace lokální databáze na Heroku a následné opravy API cest v aplikaci.

## Obsah
- [Migrace databáze](#migrace-databáze)
- [Problémy s API cestami](#problémy-s-api-cestami)
- [Oprava TypeErrors](#oprava-typeerrors)
- [Opravené soubory](#opravené-soubory)
- [Doporučení pro budoucí vývoj](#doporučení-pro-budoucí-vývoj)

## Migrace databáze

### Postup migrace
Pro migraci dat z lokální PostgreSQL databáze do Heroku byl vytvořen skript `migrate-database.sh`. Tento skript zajišťuje:

1. Export schématu databáze z lokálního PostgreSQL
2. Vytvoření tabulek v Heroku PostgreSQL
3. Přenos dat z tabulek v pevně daném pořadí pro respektování závislostí cizích klíčů
4. Ověření migrace porovnáním počtu záznamů

### Struktura migrovaných tabulek
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

### Řešené výzvy
- **Pořadí migrace tabulek**: Vzhledem k závislostem cizích klíčů bylo nutné migrovat tabulky ve správném pořadí. Skript používá předem definovaný seznam tabulek, který respektuje tyto závislosti.
- **Omezení Heroku**: PostgreSQL na Heroku má určitá omezení oproti lokální verzi. Bylo potřeba upravit některé příkazy a omezení.
- **Konfigurace přístupu**: Skript automaticky extrahuje autentizační údaje z Heroku DATABASE_URL.

## Problémy s API cestami

### Popis problému
Po migraci databáze na Heroku se objevily problémy s API cestami. Frontend aplikace nebyl schopen správně komunikovat s backendem API. Hlavními problémy byly:

1. **Nekonzistentní API cesty**: Některé komponenty používaly přímé cesty bez `/api` prefixu, což fungovalo v development prostředí, ale ne v produkci.
2. **Nesprávné použití axios**: Místo použití nakonfigurované axios instance z `axios-config.js` některé komponenty importovaly axios přímo a používaly `API_URL` z konfiguračního souboru.

### Kořen problému
V produkčním prostředí na Heroku jsou API endpointy dostupné na cestách s prefixem `/api`, např. `/api/customers`. Backend server toto správně očekává díky nastavení routes v souboru `server.js`:

```javascript
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/equipment', require('./routes/equipment.routes'));
// ...další routes
```

V produkčním prostředí hodnota `API_URL` v souboru `config.js` byla nastavena na prázdný řetězec (`''`), což znamenalo, že komponenty musely explicitně přidávat `/api` prefix ke všem cestám.

### Implementované řešení
1. **Konzistentní axios použití**: Všechny komponenty byly aktualizovány tak, aby používaly konfigurovanou axios instanci z `axios-config.js`.
2. **Jednotné API cesty**: Všechny axios volání byly aktualizovány, aby obsahovaly `/api` prefix:
   ```javascript
   // Před: axios.get(`${API_URL}/customers`)
   // Po: axios.get('/api/customers')
   ```

## Oprava TypeErrors

### Popis problému
V aplikaci se objevovaly chyby "TypeError: undefined is not an object (evaluating 't.filter')" při pokusu o volání metody `.filter()` na `undefined` nebo `null` hodnotách. Tyto chyby se objevovaly především, když data ještě nebyla načtena nebo když API požadavek selhal.

### Implementované řešení
1. **Optional chaining**: Přidali jsme operátor optional chaining (`?.`) před volání metod na potenciálně `undefined` objekty:
   ```javascript
   // Před: items.filter(...)
   // Po: items?.filter(...)
   ```

2. **Fallback hodnoty**: Přidali jsme fallback na prázdná pole v případě, že hodnota je `undefined`:
   ```javascript
   // Před: items.filter(...) 
   // Po: items?.filter(...) || []
   ```

3. **Default hodnoty při nastavování stavu**: Pro `useState` byly přidány výchozí hodnoty, především pro pole:
   ```javascript
   // Před: setItems(response.data.items)
   // Po: setItems(response.data.items || [])
   ```

## Opravené soubory

Následující soubory byly upraveny pro řešení problémů s API cestami a TypeError chybami:

### Kritické komponenty
- `frontend/src/context/AuthContext.js` - autentizační kontext, který používá API endpointy
- `frontend/src/axios-config.js` - konfigurace axios pro API volání

### Seznam stránek
- `frontend/src/pages/categories/CategoryList.js`
- `frontend/src/pages/categories/CategoryForm.js`
- `frontend/src/pages/customers/CustomerDetail.js`
- `frontend/src/pages/customers/CustomerForm.js`
- `frontend/src/pages/customers/CustomerList.js`
- `frontend/src/pages/dashboard/Dashboard.js`
- `frontend/src/pages/equipment/EquipmentForm.js`
- `frontend/src/pages/equipment/EquipmentList.js`
- `frontend/src/pages/orders/OrderList.js`
- `frontend/src/pages/orders/OrderDetail.js`
- `frontend/src/pages/orders/BatchDeliveryNote.js`
- `frontend/src/pages/orders/BatchRentalReturnForm.js`
- `frontend/src/pages/orders/BatchReturnNote.js`
- `frontend/src/pages/users/UserList.js`

## Doporučení pro budoucí vývoj

1. **Standardizace API volání**: Vytvořit abstraktní službu pro API volání, která by zajistila konzistentní přístup ke všem endpointům.

   ```javascript
   // api.service.js
   import axios from './axios-config';

   export const ApiService = {
     getCustomers: () => axios.get('/api/customers'),
     getCustomer: (id) => axios.get(`/api/customers/${id}`),
     // další metody...
   };
   ```

2. **Kontrola načítání dat**: Implementovat jednotný přístup k indikaci načítání dat a zobrazování chyb, například pomocí React Context.

3. **Pomocné funkce pro manipulaci s daty**: Vytvořit sadu pomocných funkcí pro bezpečnou manipulaci s potenciálně `undefined` hodnotami.

   ```javascript
   // safeArray.js
   export const safe = {
     filter: (array, callback) => array?.filter(callback) || [],
     map: (array, callback) => array?.map(callback) || [],
     // další metody...
   };
   ```

4. **Automatické testy**: Přidat automatické testy, které by ověřily správnou funkčnost API volání v různých prostředích.

5. **ESLint pravidla**: Přidat ESLint pravidla, která by upozorňovala na přímé použití `axios` a chybějící ošetření `undefined` hodnot.

## Přístup k databázi na Heroku

Pro přístup k Heroku PostgreSQL databázi je možné použít příkaz:

```bash
heroku pg:psql
```

nebo se připojit pomocí externího klienta s použitím URL:

```bash
heroku config:get DATABASE_URL
```

---

Dokument vytvořen: 5. 4. 2025
Aktualizováno po opravě API cest