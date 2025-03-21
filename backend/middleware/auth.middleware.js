const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware pro ověření JWT tokenu
const verifyToken = (req, res, next) => {
  // Získání tokenu z hlavičky Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Přístup odmítnut. Token nebyl poskytnut.' });
  }
  
  try {
    // Ověření platnosti tokenu
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Přidání informací o uživateli do požadavku
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Neplatný token.' });
  }
};

// Middleware pro kontrolu role admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Přístup odmítnut. Vyžadována role admin.' });
  }
};

module.exports = {
  verifyToken,
  isAdmin
};