const { Pool } = require('pg');
require('dotenv').config();

// Vytvoření připojení k PostgreSQL databázi s podporou Heroku
let pool;

// Omezení počtu připojení pro Heroku
// Heroku Free a Hobby plány mají limit 20 připojení
// https://devcenter.heroku.com/articles/heroku-postgres-plans#hobby-tier
const MAX_DB_CONNECTIONS = process.env.NODE_ENV === 'production' ? 18 : 10;
const IDLE_TIMEOUT_MS = 10000; // 10 vteřin
const CONNECTION_TIMEOUT_MS = 5000; // 5 vteřin

// Základní konfigurace poolu
const poolConfig = {
  max: MAX_DB_CONNECTIONS,
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
};

if (process.env.DATABASE_URL) {
  // Heroku Postgres
  pool = new Pool({
    ...poolConfig,
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Vyžadováno pro Heroku Postgres
    }
  });
} else {
  // Lokální databáze
  pool = new Pool({
    ...poolConfig,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Monitorování poolu
pool.on('connect', (client) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Database client connected');
  }
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
  if (process.env.NODE_ENV === 'production') {
    // V produkci se pokusíme o restart klienta
    client.release(true);
  }
});

// Funkce pro otestování připojení
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const waitingClients = pool.waitingCount;
    
    console.log('Připojení k databázi bylo úspěšné');
    if (process.env.NODE_ENV === 'production') {
      console.log(`Pool info - Total: ${totalConnections}, Idle: ${idleConnections}, Waiting: ${waitingClients}`);
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Chyba při připojení k databázi:', error);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  query: (text, params) => pool.query(text, params),
  getClient: async () => {
    const client = await pool.connect();
    // Přidání sledování času uvolnění připojení
    const originalRelease = client.release;
    client.release = () => {
      originalRelease.apply(client);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Database client released back to pool');
      }
    };
    return client;
  }
};