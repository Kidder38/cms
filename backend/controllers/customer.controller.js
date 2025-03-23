const db = require('../config/db.config');

// Získání všech zákazníků
exports.getAllCustomers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers ORDER BY name ASC');
    
    res.status(200).json({
      count: result.rows.length,
      customers: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání zákazníků:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání zákazníků.' });
  }
};

// Získání jednoho zákazníka podle ID
exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Zákazník nenalezen.' });
    }
    
    res.status(200).json({
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při načítání zákazníka:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání zákazníka.' });
  }
};

// Vytvoření nového zákazníka
exports.createCustomer = async (req, res) => {
  const { type, name, email, phone, address, ico, dic, customer_category, credit } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Jméno zákazníka je povinné.' });
  }
  
  try {
    const result = await db.query(
      `INSERT INTO customers 
        (type, name, email, phone, address, ico, dic, customer_category, credit) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        type || 'individual', 
        name, 
        email, 
        phone, 
        address, 
        ico, 
        dic, 
        customer_category || 'regular', 
        credit || 0
      ]
    );
    
    res.status(201).json({
      message: 'Zákazník byl úspěšně vytvořen.',
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při vytváření zákazníka:', error);
    res.status(500).json({ message: 'Chyba serveru při vytváření zákazníka.' });
  }
};

// Aktualizace zákazníka
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { type, name, email, phone, address, ico, dic, customer_category, credit } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Jméno zákazníka je povinné.' });
  }
  
  try {
    const checkResult = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Zákazník nenalezen.' });
    }
    
    const result = await db.query(
      `UPDATE customers 
       SET type = $1, 
           name = $2, 
           email = $3, 
           phone = $4, 
           address = $5, 
           ico = $6, 
           dic = $7, 
           customer_category = $8, 
           credit = $9, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
      [
        type || 'individual', 
        name, 
        email, 
        phone, 
        address, 
        ico, 
        dic, 
        customer_category || 'regular', 
        credit || 0, 
        id
      ]
    );
    
    res.status(200).json({
      message: 'Zákazník byl úspěšně aktualizován.',
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při aktualizaci zákazníka:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci zákazníka.' });
  }
};

// Smazání zákazníka
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence zákazníka
    const checkResult = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Zákazník nenalezen.' });
    }
    
    // Kontrola, zda zákazník nemá aktivní zakázky
    const ordersCheck = await db.query(
      'SELECT COUNT(*) FROM orders WHERE customer_id = $1 AND status != $2', 
      [id, 'completed']
    );
    
    if (parseInt(ordersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Nelze smazat zákazníka, který má aktivní zakázky.', 
        count: parseInt(ordersCheck.rows[0].count)
      });
    }
    
    await db.query('DELETE FROM customers WHERE id = $1', [id]);
    
    res.status(200).json({
      message: 'Zákazník byl úspěšně smazán.'
    });
  } catch (error) {
    console.error('Chyba při mazání zákazníka:', error);
    res.status(500).json({ message: 'Chyba serveru při mazání zákazníka.' });
  }
};