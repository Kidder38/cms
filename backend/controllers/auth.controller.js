const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
require('dotenv').config();

// Registrace nového uživatele
exports.register = async (req, res) => {
  const { username, email, password, first_name, last_name, role } = req.body;
  
  try {
    // Kontrola, zda uživatel již existuje
    const userCheck = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Uživatelské jméno nebo email již existuje.' });
    }
    
    // Hashování hesla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Vložení nového uživatele do databáze
    const newUser = await db.query(
      'INSERT INTO users (username, email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role',
      [username, email, hashedPassword, first_name, last_name, role || 'user']
    );
    
    // Vytvoření JWT tokenu
    const token = jwt.sign(
      { id: newUser.rows[0].id, username, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.status(201).json({
      message: 'Uživatel byl úspěšně registrován',
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role
      },
      token
    });
  } catch (error) {
    console.error('Chyba při registraci uživatele:', error);
    res.status(500).json({ message: 'Chyba serveru při registraci.' });
  }
};

// Přihlášení uživatele
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Kontrola, zda uživatel existuje
    const userResult = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Neplatné přihlašovací údaje.' });
    }
    
    const user = userResult.rows[0];
    
    // Ověření hesla
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Neplatné přihlašovací údaje.' });
    }
    
    // Vytvoření JWT tokenu
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.status(200).json({
      message: 'Přihlášení úspěšné',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Chyba při přihlášení:', error);
    res.status(500).json({ message: 'Chyba serveru při přihlášení.' });
  }
};

// Získání informací o přihlášeném uživateli
exports.getProfile = async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Uživatel nenalezen.' });
    }
    
    res.status(200).json({
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Chyba při načítání profilu:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání profilu.' });
  }
};