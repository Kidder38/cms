const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
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
    req.userId = decoded.id; // Explicitně přidáme userId pro přístup v kontrolerech
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

// Middleware pro kontrolu přístupu k zákazníkovi
const hasCustomerAccess = async (req, res, next) => {
  try {
    // Admin má přístup ke všem zákazníkům
    if (req.user.role === 'admin') {
      return next();
    }
    
    const customerId = req.params.id || req.params.customer_id || req.body.customer_id;
    
    if (!customerId) {
      return res.status(400).json({ message: 'ID zákazníka nebylo poskytnuto.' });
    }
    
    // Kontrola, zda má uživatel přiřazen přístup k zákazníkovi
    const accessResult = await db.query(
      'SELECT * FROM user_customer_access WHERE user_id = $1 AND customer_id = $2',
      [req.user.id, customerId]
    );
    
    if (accessResult.rows.length > 0) {
      // Přidání úrovně přístupu do požadavku pro další kontrolu
      req.accessType = accessResult.rows[0].access_type;
      return next();
    }
    
    return res.status(403).json({ message: 'Nemáte přístup k tomuto zákazníkovi.' });
  } catch (error) {
    console.error('Chyba při kontrole přístupu k zákazníkovi:', error);
    return res.status(500).json({ message: 'Interní chyba serveru při kontrole přístupu.' });
  }
};

// Middleware pro kontrolu přístupu k zakázce
const hasOrderAccess = async (req, res, next) => {
  try {
    // Admin má přístup ke všem zakázkám
    if (req.user.role === 'admin') {
      return next();
    }
    
    const orderId = req.params.id || req.params.order_id || req.body.order_id;
    
    if (!orderId) {
      return res.status(400).json({ message: 'ID zakázky nebylo poskytnuto.' });
    }
    
    // Kontrola, zda má uživatel přiřazen přístup k zakázce přímo
    const orderAccessResult = await db.query(
      'SELECT * FROM user_order_access WHERE user_id = $1 AND order_id = $2',
      [req.user.id, orderId]
    );
    
    if (orderAccessResult.rows.length > 0) {
      // Přidání úrovně přístupu do požadavku pro další kontrolu
      req.accessType = orderAccessResult.rows[0].access_type;
      return next();
    }
    
    // Pokud nemá přímý přístup k zakázce, kontrola zda má přístup k zákazníkovi, kterému zakázka patří
    const orderCustomerResult = await db.query(
      'SELECT customer_id FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (orderCustomerResult.rows.length > 0) {
      const customerId = orderCustomerResult.rows[0].customer_id;
      
      const customerAccessResult = await db.query(
        'SELECT * FROM user_customer_access WHERE user_id = $1 AND customer_id = $2',
        [req.user.id, customerId]
      );
      
      if (customerAccessResult.rows.length > 0) {
        // Přidání úrovně přístupu do požadavku pro další kontrolu
        req.accessType = customerAccessResult.rows[0].access_type;
        return next();
      }
    }
    
    return res.status(403).json({ message: 'Nemáte přístup k této zakázce.' });
  } catch (error) {
    console.error('Chyba při kontrole přístupu k zakázce:', error);
    return res.status(500).json({ message: 'Interní chyba serveru při kontrole přístupu.' });
  }
};

// Middleware pro kontrolu, zda má uživatel práva pro zápis
const hasWriteAccess = (req, res, next) => {
  // Admin má vždy práva pro zápis
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Kontrola práv pro zápis na základě accessType
  if (req.accessType === 'write' || req.accessType === 'admin') {
    return next();
  }
  
  return res.status(403).json({ message: 'Nemáte práva pro úpravu tohoto záznamu.' });
};

module.exports = {
  verifyToken,
  isAdmin,
  hasCustomerAccess,
  hasOrderAccess,
  hasWriteAccess
};