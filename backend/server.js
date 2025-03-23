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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory - cesta pro nahrané soubory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Základní route pro otestování API
app.get('/', (req, res) => {
  res.json({ message: 'Vítejte v API pro půjčovnu stavebního vybavení' });
});

// Importy a použití routes pro jednotlivé entity
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/equipment', require('./routes/equipment.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/import', require('./routes/import.routes'));

// Spuštění serveru
app.listen(PORT, async () => {
  console.log(`Server běží na portu ${PORT}`);
  
  // Otestování připojení k databázi
  await testConnection();
});