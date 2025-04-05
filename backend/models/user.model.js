const db = require('../config/db.config');
const bcrypt = require('bcrypt');

// Získání vaech u~ivatelo
exports.getAllUsers = async () => {
  try {
    const result = await db.query(
      'SELECT id, username, email, first_name, last_name, role, created_at, updated_at FROM users ORDER BY id ASC'
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Získání u~ivatele podle ID
exports.getUserById = async (id) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// VytvoYení nového u~ivatele
exports.createUser = async (userData) => {
  const { username, email, password, first_name, last_name, role } = userData;
  
  try {
    // Hashování hesla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await db.query(
      'INSERT INTO users (username, email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role',
      [username, email, hashedPassword, first_name, last_name, role || 'user']
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Aktualizace u~ivatele
exports.updateUser = async (id, userData) => {
  const { username, email, first_name, last_name, role } = userData;
  
  try {
    const result = await db.query(
      'UPDATE users SET username = $1, email = $2, first_name = $3, last_name = $4, role = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING id, username, email, first_name, last_name, role',
      [username, email, first_name, last_name, role, id]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Zmna hesla u~ivatele
exports.changePassword = async (id, newPassword) => {
  try {
    // Hashování nového hesla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const result = await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [hashedPassword, id]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Smazání u~ivatele
exports.deleteUser = async (id) => {
  try {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// PYidání pYístupu k zákazníkovi
exports.addCustomerAccess = async (userId, customerId, accessType) => {
  try {
    const result = await db.query(
      'INSERT INTO user_customer_access (user_id, customer_id, access_type) VALUES ($1, $2, $3) RETURNING id, user_id, customer_id, access_type',
      [userId, customerId, accessType || 'read']
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Aktualizace pYístupu k zákazníkovi
exports.updateCustomerAccess = async (userId, customerId, accessType) => {
  try {
    const result = await db.query(
      'UPDATE user_customer_access SET access_type = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND customer_id = $3 RETURNING id, user_id, customer_id, access_type',
      [accessType, userId, customerId]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Odebrání pYístupu k zákazníkovi
exports.removeCustomerAccess = async (userId, customerId) => {
  try {
    const result = await db.query(
      'DELETE FROM user_customer_access WHERE user_id = $1 AND customer_id = $2 RETURNING id',
      [userId, customerId]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Získání zákazníko pYístupných pro u~ivatele
exports.getUserCustomers = async (userId) => {
  try {
    const result = await db.query(
      `SELECT c.*, uca.access_type
       FROM customers c
       JOIN user_customer_access uca ON c.id = uca.customer_id
       WHERE uca.user_id = $1
       ORDER BY c.name ASC`,
      [userId]
    );
    
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// PYidání pYístupu k zakázce
exports.addOrderAccess = async (userId, orderId, accessType) => {
  try {
    const result = await db.query(
      'INSERT INTO user_order_access (user_id, order_id, access_type) VALUES ($1, $2, $3) RETURNING id, user_id, order_id, access_type',
      [userId, orderId, accessType || 'read']
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Aktualizace pYístupu k zakázce
exports.updateOrderAccess = async (userId, orderId, accessType) => {
  try {
    const result = await db.query(
      'UPDATE user_order_access SET access_type = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND order_id = $3 RETURNING id, user_id, order_id, access_type',
      [accessType, userId, orderId]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Odebrání pYístupu k zakázce
exports.removeOrderAccess = async (userId, orderId) => {
  try {
    const result = await db.query(
      'DELETE FROM user_order_access WHERE user_id = $1 AND order_id = $2 RETURNING id',
      [userId, orderId]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Získání zakázek pYístupných pro u~ivatele
exports.getUserOrders = async (userId) => {
  try {
    const result = await db.query(
      `SELECT o.*, uoa.access_type
       FROM orders o
       JOIN user_order_access uoa ON o.id = uoa.order_id
       WHERE uoa.user_id = $1
       ORDER BY o.creation_date DESC`,
      [userId]
    );
    
    return result.rows;
  } catch (error) {
    throw error;
  }
};