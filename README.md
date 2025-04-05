# Půjčovna Stavebnin CRM

Systém pro správu půjčovny stavebního vybavení s možnostmi pro správu zákazníků, vybavení, zakázek, výpůjček a vratek.

## Obsah

- [Přehled](#přehled)
- [Technologie](#technologie)
- [Architektura](#architektura)
- [Nastavení projektu](#nastavení-projektu)
- [Vývoj](#vývoj)
- [Nasazení](#nasazení)
- [API Integrace](#api-integrace)
- [Řešení chyb](#řešení-chyb)
- [Aktualizace a údržba](#aktualizace-a-údržba)

## Přehled

Tento systém je navržen pro kompletní správu půjčovny stavebního vybavení:
- Správa zákazníků (fyzické osoby i firmy)
- Správa vybavení (včetně kategorií a stavu)
- Evidence zakázek a výpůjček
- Generování dodacích listů a fakturačních podkladů
- Správa uživatelů s různými úrovněmi oprávnění

## Technologie

### Frontend
- React.js (Create React App)
- React Bootstrap pro UI komponenty
- Context API pro správu stavu
- Axios pro API požadavky

### Backend
- Node.js + Express.js
- PostgreSQL databáze
- JWT autentizace
- Multer pro nahrávání souborů

## Architektura

Aplikace používá architekturu klient-server:

### Struktura frontendové části
```
frontend/
  ├── src/
  │   ├── components/     # Znovupoužitelné komponenty
  │   ├── context/        # Context API poskytovatele
  │   ├── pages/          # Stránky aplikace
  │   ├── util/           # Pomocné funkce a nástroje
  │   ├── axios-config.js # Konfigurace axios klienta pro API požadavky
  │   ├── config.js       # Globální konfigurace aplikace
  │   └── App.js          # Hlavní komponenta aplikace
```

### Struktura backendové části
```
backend/
  ├── config/       # Konfigurační soubory
  ├── controllers/  # Kontrolery pro API endpointy
  ├── middleware/   # Middleware funkce (autentizace, validace)
  ├── models/       # Datové modely
  ├── routes/       # Definice API routes
  ├── utils/        # Pomocné nástroje
  └── server.js     # Hlavní soubor aplikace
```

## Nastavení projektu

### Požadavky
- Node.js (verze 14.x nebo vyšší)
- PostgreSQL (verze 12.x nebo vyšší)
- npm (nebo yarn)

### Databáze
1. Vytvořte PostgreSQL databázi
2. Inicializujte strukturu pomocí skriptu `database/init.sql` 

### Lokální instalace
1. Naklonujte repozitář
   ```bash
   git clone <repository-url>
   cd crm
   ```

2. Instalace závislostí
   ```bash
   # Instalace závislostí kořenového projektu
   npm install
   
   # Instalace backendových závislostí
   cd backend
   npm install
   
   # Instalace frontendových závislostí
   cd ../frontend
   npm install
   ```

3. Konfigurace prostředí

   Vytvořte soubor `.env` v kořenovém adresáři projektu:
   ```
   # Server
   PORT=5000
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pujcovna
   DB_USER=username
   DB_PASSWORD=password
   
   # JWT Secret
   JWT_SECRET=vasetajneheslo
   JWT_EXPIRATION=24h
   ```

## Vývoj

### Spuštění vývojového prostředí
```bash
# Spuštění pouze backend serveru
cd backend
npm run dev

# Spuštění pouze frontend serveru
cd frontend
npm start

# Spuštění obou současně z kořenového adresáře
npm run dev
```

### Struktura API

Všechny API endpointy jsou dostupné na cestě `/api`:

- **Autentizace**: `/api/auth`  
  - `/api/auth/register` - Registrace nového uživatele
  - `/api/auth/login` - Přihlášení uživatele
  - `/api/auth/profile` - Získání profilu přihlášeného uživatele

- **Zákazníci**: `/api/customers`
  - GET, POST, PUT, DELETE operace pro správu zákazníků
  - `/api/customers/:id/orders` - Získání zakázek zákazníka

- **Vybavení**: `/api/equipment`
  - CRUD operace pro správu vybavení
  - Filtrování podle kategorií, stavu, atd.

- **Zakázky**: `/api/orders`
  - Správa zakázek, výpůjček a vratek
  - Generování dodacích listů

- **Kategorie**: `/api/categories`
  - Správa kategorií vybavení

## Nasazení

### Nasazení na Heroku

1. Vytvořte Heroku aplikaci
   ```bash
   heroku create nazev-aplikace
   ```

2. Nastavte proměnné prostředí
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=vasetajneheslo
   ```

3. Přidejte PostgreSQL databázi
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. Proveďte push do Heroku
   ```bash
   git push heroku main
   ```

5. Inicializujte databázi
   ```bash
   heroku pg:psql < database/heroku-init.sql
   ```

### Migrace dat

Pro migraci dat z lokální databáze do Heroku použijte skript `migrate-database.sh`, který zajistí export schématu a dat z lokální databáze a import do Heroku PostgreSQL. Skript respektuje závislosti mezi tabulkami.

## API Integrace

### Axios konfigurace

Frontend používá konfigurovanou instanci `axios` pro volání API:

```javascript
// src/axios-config.js
import axios from 'axios';

// V produkčním prostředí se /api prefix přidává do URL jednotlivých endpointů
// V development prostředí se používá http://localhost:5001
axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:5001';

// Ostatní konfigurace...
```

### Důležité poznámky k API cestám

1. **Všechny API cesty musí obsahovat `/api` prefix** v produkčním prostředí.
   ```javascript
   // Správné použití
   axios.get('/api/customers');
   
   // Nesprávné použití
   axios.get('/customers');
   ```

2. **Vždy používejte importovanou axios instanci z axios-config.js**
   ```javascript
   // Správné použití
   import axios from '../../axios-config';
   
   // Nesprávné použití
   import axios from 'axios';
   ```

## Řešení chyb

### Běžné problémy

#### Chyba "TypeError: undefined is not an object (evaluating 't.filter')"
Tato chyba se objevuje, když se provádí operace `.filter()` na proměnné, která je `undefined` nebo `null`.

**Řešení**:
- Používejte optional chaining (`?.`) při volání metod na potenciálně nedefinovaných objektech
- Přidejte fallback na prázdné pole pomocí `|| []`

```javascript
// Správné použití
const filteredItems = items?.filter(item => item.active) || [];

// Místo
const filteredItems = items.filter(item => item.active);
```

#### "Cannot find /api/[endpoint]" v produkčním prostředí
Tato chyba se vyskytuje, když API cesty neobsahují správný prefix `/api`.

**Řešení**:
- Zkontrolujte, že všechny axios volání obsahují `/api` prefix
- Používejte konfigurovaný axios instance z `axios-config.js`

### Bezpečnostní doporučení

1. Vždy ověřujte oprávnění uživatelů v API kontrolerech
2. Používejte parametrizované dotazy pro přístup k databázi
3. Neukládejte citlivé informace v localStorage nebo sessionStorage
4. Implementujte rate limiting pro API endpointy

## Aktualizace a údržba

### Aktualizace schématu databáze

Pro aktualizaci schématu databáze použijte SQL příkazy v souboru `database/alter_tables.sql`. Tento soubor obsahuje změny schématu, které byly provedeny od počáteční inicializace databáze.

### Správa závislostí

Pravidelně aktualizujte závislosti projektu:
```bash
npm audit fix
```

### Zálohování databáze

Pro zálohování databáze Heroku PostgreSQL:
```bash
heroku pg:backups:capture
heroku pg:backups:download
```

---

© 2025 Půjčovna Stavebnin CRM