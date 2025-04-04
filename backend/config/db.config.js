const { Pool } = require('pg');
require('dotenv').config();

// Vytvoření připojení k PostgreSQL databázi s podporou Heroku
let pool;

if (process.env.DATABASE_URL) {
  // Heroku Postgres
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Vyžadováno pro Heroku Postgres
    }
  });
} else {
  // Lokální databáze
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Funkce pro otestování připojení
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Připojení k databázi bylo úspěšné');
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
};