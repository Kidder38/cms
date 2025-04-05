const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const db = require('../config/db.config');

// Získání všech uživatelů
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Chyba při načítání uživatelů:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání uživatelů.' });
  }
};

// Získání uživatele podle ID
exports.getUserById = async (req, res) => {
  try {
    const user = await userModel.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Uživatel nenalezen.' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Chyba při načítání uživatele:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání uživatele.' });
  }
};

// Vytvoření nového uživatele
exports.createUser = async (req, res) => {
  const { username, email, password, first_name, last_name, role } = req.body;
  
  // Validace vstupu
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Prosím vyplňte povinná pole (username, email, password).' });
  }
  
  try {
    const user = await userModel.createUser({ username, email, password, first_name, last_name, role });
    res.status(201).json({ message: 'Uživatel byl úspěšně vytvořen.', user });
  } catch (error) {
    console.error('Chyba při vytváření uživatele:', error);
    
    // Kontrola duplicitní hodnoty
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(400).json({ message: 'Uživatelské jméno nebo email již existuje.' });
    }
    
    res.status(500).json({ message: 'Chyba serveru při vytváření uživatele.' });
  }
};

// Aktualizace uživatele
exports.updateUser = async (req, res) => {
  const { username, email, first_name, last_name, role } = req.body;
  
  try {
    const user = await userModel.updateUser(req.params.id, { username, email, first_name, last_name, role });
    
    if (!user) {
      return res.status(404).json({ message: 'Uživatel nenalezen.' });
    }
    
    res.status(200).json({ message: 'Uživatel byl úspěšně aktualizován.', user });
  } catch (error) {
    console.error('Chyba při aktualizaci uživatele:', error);
    
    // Kontrola duplicitní hodnoty
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(400).json({ message: 'Uživatelské jméno nebo email již existuje.' });
    }
    
    res.status(500).json({ message: 'Chyba serveru při aktualizaci uživatele.' });
  }
};

// Změna hesla uživatele
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.params.id;
  
  // Validace vstupu
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Prosím vyplňte současné a nové heslo.' });
  }
  
  try {
    // Získání uživatele z databáze (včetně hesla pro ověření)
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Uživatel nenalezen.' });
    }
    
    const user = userResult.rows[0];
    
    // Ověření současného hesla
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Současné heslo je nesprávné.' });
    }
    
    // Změna hesla
    await userModel.changePassword(userId, newPassword);
    
    res.status(200).json({ message: 'Heslo bylo úspěšně změněno.' });
  } catch (error) {
    console.error('Chyba při změně hesla:', error);
    res.status(500).json({ message: 'Chyba serveru při změně hesla.' });
  }
};

// Smazání uživatele
exports.deleteUser = async (req, res) => {
  try {
    const user = await userModel.deleteUser(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Uživatel nenalezen.' });
    }
    
    res.status(200).json({ message: 'Uživatel byl úspěšně smazán.' });
  } catch (error) {
    console.error('Chyba při mazání uživatele:', error);
    res.status(500).json({ message: 'Chyba serveru při mazání uživatele.' });
  }
};

// Přidání přístupu k zákazníkovi
exports.addCustomerAccess = async (req, res) => {
  const { customerId, accessType } = req.body;
  const userId = req.params.id;
  
  try {
    const access = await userModel.addCustomerAccess(userId, customerId, accessType);
    res.status(201).json({ message: 'Přístup k zákazníkovi byl úspěšně přidán.', access });
  } catch (error) {
    console.error('Chyba při přidávání přístupu k zákazníkovi:', error);
    
    // Kontrola duplicitní hodnoty
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(400).json({ message: 'Tento přístup již existuje.' });
    }
    
    res.status(500).json({ message: 'Chyba serveru při přidávání přístupu k zákazníkovi.' });
  }
};

// Aktualizace přístupu k zákazníkovi
exports.updateCustomerAccess = async (req, res) => {
  const { customerId, accessType } = req.body;
  const userId = req.params.id;
  
  try {
    const access = await userModel.updateCustomerAccess(userId, customerId, accessType);
    
    if (!access) {
      return res.status(404).json({ message: 'Přístup nenalezen.' });
    }
    
    res.status(200).json({ message: 'Přístup k zákazníkovi byl úspěšně aktualizován.', access });
  } catch (error) {
    console.error('Chyba při aktualizaci přístupu k zákazníkovi:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci přístupu k zákazníkovi.' });
  }
};

// Odebrání přístupu k zákazníkovi
exports.removeCustomerAccess = async (req, res) => {
  const { customerId } = req.body;
  const userId = req.params.id;
  
  try {
    const access = await userModel.removeCustomerAccess(userId, customerId);
    
    if (!access) {
      return res.status(404).json({ message: 'Přístup nenalezen.' });
    }
    
    res.status(200).json({ message: 'Přístup k zákazníkovi byl úspěšně odebrán.' });
  } catch (error) {
    console.error('Chyba při odebírání přístupu k zákazníkovi:', error);
    res.status(500).json({ message: 'Chyba serveru při odebírání přístupu k zákazníkovi.' });
  }
};

// Získání zákazníků přístupných pro uživatele
exports.getUserCustomers = async (req, res) => {
  try {
    const customers = await userModel.getUserCustomers(req.params.id);
    res.status(200).json({ customers: customers || [] }); // Zajistíme, že vždy vracíme pole
  } catch (error) {
    console.error('Chyba při načítání zákazníků uživatele:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání zákazníků uživatele.' });
  }
};

// Přidání přístupu k zakázce
exports.addOrderAccess = async (req, res) => {
  const { orderId, accessType } = req.body;
  const userId = req.params.id;
  
  try {
    const access = await userModel.addOrderAccess(userId, orderId, accessType);
    res.status(201).json({ message: 'Přístup k zakázce byl úspěšně přidán.', access });
  } catch (error) {
    console.error('Chyba při přidávání přístupu k zakázce:', error);
    
    // Kontrola duplicitní hodnoty
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(400).json({ message: 'Tento přístup již existuje.' });
    }
    
    res.status(500).json({ message: 'Chyba serveru při přidávání přístupu k zakázce.' });
  }
};

// Aktualizace přístupu k zakázce
exports.updateOrderAccess = async (req, res) => {
  const { orderId, accessType } = req.body;
  const userId = req.params.id;
  
  try {
    const access = await userModel.updateOrderAccess(userId, orderId, accessType);
    
    if (!access) {
      return res.status(404).json({ message: 'Přístup nenalezen.' });
    }
    
    res.status(200).json({ message: 'Přístup k zakázce byl úspěšně aktualizován.', access });
  } catch (error) {
    console.error('Chyba při aktualizaci přístupu k zakázce:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci přístupu k zakázce.' });
  }
};

// Odebrání přístupu k zakázce
exports.removeOrderAccess = async (req, res) => {
  const { orderId } = req.body;
  const userId = req.params.id;
  
  try {
    const access = await userModel.removeOrderAccess(userId, orderId);
    
    if (!access) {
      return res.status(404).json({ message: 'Přístup nenalezen.' });
    }
    
    res.status(200).json({ message: 'Přístup k zakázce byl úspěšně odebrán.' });
  } catch (error) {
    console.error('Chyba při odebírání přístupu k zakázce:', error);
    res.status(500).json({ message: 'Chyba serveru při odebírání přístupu k zakázce.' });
  }
};

// Získání zakázek přístupných pro uživatele
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await userModel.getUserOrders(req.params.id);
    res.status(200).json({ orders: orders || [] }); // Zajistíme, že vždy vracíme pole
  } catch (error) {
    console.error('Chyba při načítání zakázek uživatele:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání zakázek uživatele.' });
  }
};