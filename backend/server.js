const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/db.config');

// Načtení proměnných z .env souboru
dotenv.config();

// Inicializace Express aplikace
const app = express();
const PORT = process.env.PORT || 5000;

// CORS nastavení
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || true  // V produkci může být true (povolí vše) nebo konkrétní URL
    : 'http://localhost:3000',          // Při vývoji React běží na portu 3000
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory - cesta pro nahrané soubory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importy a použití routes pro jednotlivé entity
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/equipment', require('./routes/equipment.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/import', require('./routes/import.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/suppliers', require('./routes/supplier.routes'));
app.use('/api/warehouses', require('./routes/warehouse.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/write-offs', require('./routes/write-off.routes'));
app.use('/api/inventory-checks', require('./routes/inventory.routes'));

// Základní route pro otestování API (pouze pro vývojové prostředí)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({ message: 'Vítejte v API pro půjčovnu stavebního vybavení' });
  });
}

// Konfigurace pro produkci - servírování frontendu
if (process.env.NODE_ENV === 'production') {
  // Statické soubory z React buildu
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Všechny ostatní požadavky směrujeme na React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Spuštění serveru
app.listen(PORT, async () => {
  console.log(`Server běží na portu ${PORT}`);
  console.log(`Prostředí: ${process.env.NODE_ENV || 'development'}`);
  
  // Otestování připojení k databázi
  await testConnection();
});