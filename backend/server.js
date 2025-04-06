const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/db.config');

// Načtení proměnných z .env souboru
dotenv.config();

// Inicializace Express aplikace
const app = express();
const PORT = process.env.PORT || 5000;

// Pro Heroku, CloudFront atd. - korektní získání IP klienta
app.set('trust proxy', 1);

// Bezpečnostní hlavičky
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false // Potřebné pro nahrávání souborů
}));

// Limity pro velikost requestů
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser()); // Zpracování cookies v požadavcích

// CORS nastavení
let corsOrigin;
if (process.env.NODE_ENV === 'production') {
  // V produkci povolíme pouze specifické domény nebo vlastní doménu
  corsOrigin = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'https://pujcovna-stavebnin.herokuapp.com', 'https://pujcovna-stavebnin-47fa0268d1ae.herokuapp.com']
    : 'https://pujcovna-stavebnin-47fa0268d1ae.herokuapp.com';
} else {
  // Při vývoji povolíme localhost
  corsOrigin = ['http://localhost:3000', 'http://127.0.0.1:3000'];
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true, // Povolí přenos cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Access-Token',
    'X-Requested-With',
    'Origin',
    'Accept'
  ],
  exposedHeaders: ['Authorization'] // Umožní frontendovému kódu číst tuto hlavičku
};

app.use(cors(corsOptions));

// Rate limiter pro autentizační endpointy
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // 100 requestů za okno
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Příliš mnoho požadavků z této IP, zkuste to prosím znovu později.'
});

// Aplikace rate limiteru na auth endpointy
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Cache hlavičky pro statické soubory
const cacheTime = process.env.NODE_ENV === 'production' ? 86400000 : 0; // 1 den v produkci, 0 při vývoji
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: cacheTime,
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 den
    }
  }
}));

// Kontrola, zda jde aplikace v režimu údržby
app.use((req, res, next) => {
  // Proměnná MAINTENANCE_MODE může být nastavena v Heroku config
  if (process.env.MAINTENANCE_MODE === 'true' && req.path !== '/api/health') {
    return res.status(503).json({
      success: false,
      message: 'Aplikace je v režimu údržby. Zkuste to prosím později.'
    });
  }
  next();
});

// Health check endpoint - důležitý pro Heroku
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API verze
const API_VERSION = '1.0';
app.get('/api/version', (req, res) => {
  res.status(200).json({
    version: API_VERSION,
    buildDate: process.env.BUILD_DATE || new Date().toISOString()
  });
});

// DEBUG: Endpoint pro testování autentizace (pomůže najít problém s tokeny)
app.get('/api/debug/auth', (req, res) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const cookies = req.cookies || {};
  
  res.status(200).json({
    headers: {
      authorization: authHeader,
      allHeaders: Object.keys(req.headers),
    },
    cookies: {
      token: cookies.token,
      allCookies: Object.keys(cookies),
    },
    time: new Date().toISOString()
  });
});

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

// Handler pro neexistující API routy
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint nebyl nalezen'
  });
});

// Základní route pro otestování API (pouze pro vývojové prostředí)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({ message: 'Vítejte v API pro půjčovnu stavebního vybavení' });
  });
}

// Globální zachycení chyb
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Došlo k interní chybě serveru.' 
    : err.message;
  res.status(statusCode).json({ 
    success: false, 
    message 
  });
});

// Konfigurace pro produkci - servírování frontendu
if (process.env.NODE_ENV === 'production') {
  // Statické soubory z React buildu
  app.use(express.static(path.join(__dirname, '../frontend/build'), {
    maxAge: 86400000 // 1 den cache
  }));
  
  // Všechny ostatní požadavky směrujeme na React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Spuštění serveru
const server = app.listen(PORT, async () => {
  console.log(`Server běží na portu ${PORT}`);
  console.log(`Prostředí: ${process.env.NODE_ENV || 'development'}`);
  
  // Otestování připojení k databázi
  await testConnection();
});

// Správné ukončení při signálech
process.on('SIGTERM', () => {
  console.log('SIGTERM obdržen, ukončování aplikace...');
  server.close(() => {
    console.log('Server ukončen');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT obdržen, ukončování aplikace...');
  server.close(() => {
    console.log('Server ukončen');
    process.exit(0);
  });
});