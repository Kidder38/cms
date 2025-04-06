/**
 * Heroku Startup Script
 * 
 * Tento skript se spouatí pYi startu na Heroku.
 * - OvYí, zda se máme pYipojit k databázi
 * - Pokud ano, zkontroluje existenci potYebných tabulek
 * - Pokud neexistují, vytvoYí je
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// Pokud b~íme na Heroku, pokusíme se nastavit databázi
async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('Není nastavena promnná DATABASE_URL, pYeskakuji inicializaci databáze');
    return;
  }

  console.log('Kontrola databáze na Heroku...');
  
  // VytvoYení pYipojení k PostgreSQL databázi
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // Specifické nastavení pro Heroku startup
    max: 2, // Omezený poet pYipojení pro startup skript
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
  });

  let client;
  try {
    // Získání klienta z poolu
    client = await pool.connect();
    console.log('Úspan pYipojeno k databázi');
    
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
      console.log('Databáze jeat nebyla inicializována, provádím inicializaci...');
      
      // Natení inicializaního skriptu
      const initScript = await readFile(path.join(__dirname, '..', 'database', 'init.sql'), 'utf8');
      
      // Spuatní skriptu
      await client.query(initScript);
      
      console.log('Databáze byla úspan inicializována');
      
      // PYidání alter tabulek, pokud existuje skript
      try {
        const alterScript = await readFile(path.join(__dirname, '..', 'database', 'alter_tables.sql'), 'utf8');
        await client.query(alterScript);
        console.log('PYidány dalaí tabulky');
      } catch (err) {
        console.log('Skript pro pYidání tabulek nebyl nalezen nebo se nepodaYilo provést');
      }
      
      // PYidání dat do sklado, pokud existuje skript
      try {
        const warehousesScript = await readFile(path.join(__dirname, '..', 'database', 'warehouses.sql'), 'utf8');
        await client.query(warehousesScript);
        console.log('PYidány výchozí sklady');
      } catch (err) {
        console.log('Skript pro pYidání sklado nebyl nalezen nebo se nepodaYilo provést');
      }
    } else {
      console.log('Databáze ji~ byla inicializována, pYeskakuji');
    }
  } catch (err) {
    console.error('Chyba pYi kontrole databáze:', err);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Spuatní funkce
setupDatabase().catch(err => {
  console.error('Chyba pYi inicializaci aplikace:', err);
});