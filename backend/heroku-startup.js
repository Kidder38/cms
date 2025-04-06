/**
 * Heroku Startup Script
 * 
 * Tento skript se spouští při startu na Heroku.
 * - Ověří, zda se máme připojit k databázi
 * - Pokud ano, zkontroluje existenci potřebných tabulek
 * - Pokud neexistují, vytvoří je
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// Pokud běžíme na Heroku, pokusíme se nastavit databázi
async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('Není nastavena proměnná DATABASE_URL, přeskakuji inicializaci databáze');
    return;
  }

  console.log('Kontrola databáze na Heroku...');
  
  // Vytvoření připojení k PostgreSQL databázi
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // Specifické nastavení pro Heroku startup
    max: 2, // Omezený počet připojení pro startup skript
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
  });

  let client;
  try {
    // Získání klienta z poolu
    client = await pool.connect();
    console.log('Úspěšně připojeno k databázi');
    
    // Kontrola existence tabulky users (základní tabulka)
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    // Pokud tabulka neexistuje, inicializujeme celou databázi
    if (!result.rows[0].exists) {
      console.log('Databáze ještě nebyla inicializována, provádím inicializaci...');
      
      // Načtení inicializačního skriptu
      const initScript = await readFile(path.join(__dirname, '..', 'database', 'init.sql'), 'utf8');
      
      // Spuštění skriptu
      await client.query(initScript);
      
      console.log('Databáze byla úspěšně inicializována');
      
      // Přidání alter tabulek, pokud existuje skript
      try {
        const alterScript = await readFile(path.join(__dirname, '..', 'database', 'alter_tables.sql'), 'utf8');
        await client.query(alterScript);
        console.log('Přidány další tabulky');
      } catch (err) {
        console.log('Skript pro přidání tabulek nebyl nalezen nebo se nepodařilo provést');
      }
      
      // Přidání dat do skladů, pokud existuje skript
      try {
        const warehousesScript = await readFile(path.join(__dirname, '..', 'database', 'warehouses.sql'), 'utf8');
        await client.query(warehousesScript);
        console.log('Přidány výchozí sklady');
      } catch (err) {
        console.log('Skript pro přidání skladů nebyl nalezen nebo se nepodařilo provést');
      }
    } else {
      console.log('Databáze již byla inicializována, přeskakuji');
    }
  } catch (err) {
    console.error('Chyba při kontrole databáze:', err);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Spuštění funkce
setupDatabase().catch(err => {
  console.error('Chyba při inicializaci aplikace:', err);
});