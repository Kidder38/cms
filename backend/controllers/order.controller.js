const db = require('../config/db.config');

// Získání všech zakázek
exports.getAllOrders = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, c.name as customer_name 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.creation_date DESC
    `);
    
    res.status(200).json({
      count: result.rows.length,
      orders: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání zakázek:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání zakázek.' });
  }
};

// Získání jedné zakázky podle ID
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Získání základních informací o zakázce
    const orderResult = await db.query(`
      SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Získání výpůjček spojených se zakázkou
    const rentalsResult = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number
      FROM rentals r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.order_id = $1
      ORDER BY r.issue_date ASC
    `, [id]);
    
    res.status(200).json({
      order: orderResult.rows[0],
      rentals: rentalsResult.rows
    });
  } catch (error) {
    console.error('Chyba při načítání zakázky:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání zakázky.' });
  }
};

// Vytvoření nové zakázky
exports.createOrder = async (req, res) => {
  const { customer_id, order_number, status, estimated_end_date, notes } = req.body;
  
  if (!customer_id) {
    return res.status(400).json({ message: 'Zákazník je povinný údaj.' });
  }
  
  if (!order_number) {
    return res.status(400).json({ message: 'Číslo zakázky je povinný údaj.' });
  }
  
  try {
    // Kontrola existence zákazníka
    const customerCheck = await db.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
    
    if (customerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Vybraný zákazník neexistuje.' });
    }
    
    // Kontrola duplicitního čísla zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE order_number = $1', [order_number]);
    
    if (orderCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Zakázka s tímto číslem již existuje.' });
    }
    
    const result = await db.query(`
      INSERT INTO orders (
        customer_id, 
        order_number, 
        status, 
        estimated_end_date, 
        notes
      ) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [
      customer_id,
      order_number,
      status || 'created',
      estimated_end_date,
      notes
    ]);
    
    res.status(201).json({
      message: 'Zakázka byla úspěšně vytvořena.',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při vytváření zakázky:', error);
    res.status(500).json({ message: 'Chyba serveru při vytváření zakázky.' });
  }
};

// Aktualizace zakázky
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { customer_id, order_number, status, estimated_end_date, notes } = req.body;
  
  if (!customer_id) {
    return res.status(400).json({ message: 'Zákazník je povinný údaj.' });
  }
  
  if (!order_number) {
    return res.status(400).json({ message: 'Číslo zakázky je povinný údaj.' });
  }
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Kontrola existence zákazníka
    const customerCheck = await db.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
    
    if (customerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Vybraný zákazník neexistuje.' });
    }
    
    // Kontrola duplicitního čísla zakázky (kromě aktuální zakázky)
    const duplicateCheck = await db.query(
      'SELECT * FROM orders WHERE order_number = $1 AND id != $2', 
      [order_number, id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Zakázka s tímto číslem již existuje.' });
    }
    
    const result = await db.query(`
      UPDATE orders 
      SET 
        customer_id = $1, 
        order_number = $2, 
        status = $3, 
        estimated_end_date = $4, 
        notes = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 
      RETURNING *
    `, [
      customer_id,
      order_number,
      status,
      estimated_end_date,
      notes,
      id
    ]);
    
    res.status(200).json({
      message: 'Zakázka byla úspěšně aktualizována.',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při aktualizaci zakázky:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci zakázky.' });
  }
};

// Smazání zakázky
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Kontrola, zda zakázka nemá aktivní výpůjčky
    const rentalsCheck = await db.query(
      'SELECT * FROM rentals WHERE order_id = $1 AND status IN ($2, $3)', 
      [id, 'created', 'issued']
    );
    
    if (rentalsCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Nelze smazat zakázku, která má aktivní výpůjčky.', 
        count: rentalsCheck.rows.length
      });
    }
    
    // Nejprve smažeme všechny výpůjčky, které patří k této zakázce
    await db.query('DELETE FROM rentals WHERE order_id = $1', [id]);
    
    // Pak smažeme samotnou zakázku
    await db.query('DELETE FROM orders WHERE id = $1', [id]);
    
    res.status(200).json({
      message: 'Zakázka byla úspěšně smazána.'
    });
  } catch (error) {
    console.error('Chyba při mazání zakázky:', error);
    res.status(500).json({ message: 'Chyba serveru při mazání zakázky.' });
  }
};

// Přidání výpůjčky k zakázce
exports.addRental = async (req, res) => {
  let { order_id } = req.params;
  let { 
    equipment_id, 
    issue_date, 
    planned_return_date, 
    daily_rate,
    status
  } = req.body;
  
  if (!equipment_id) {
    return res.status(400).json({ message: 'Vybavení je povinný údaj.' });
  }
  
  // Konverze ID na čísla
  order_id = parseInt(order_id);
  equipment_id = parseInt(equipment_id);
  
  // Ujistíme se, že daily_rate je číslo
  if (daily_rate) {
    daily_rate = parseFloat(daily_rate);
  }
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Kontrola existence vybavení
    const equipmentCheck = await db.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    
    if (equipmentCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Vybrané vybavení neexistuje.' });
    }
    
    // Kontrola dostupnosti vybavení
    if (equipmentCheck.rows[0].status !== 'available') {
      return res.status(400).json({ 
        message: 'Vybrané vybavení není dostupné k vypůjčení.', 
        status: equipmentCheck.rows[0].status
      });
    }
    
    // Nastavení defaultních hodnot
    if (!daily_rate) {
      daily_rate = parseFloat(equipmentCheck.rows[0].daily_rate);
    }
    
    if (!status) {
      status = 'created';
    }
    
    // Vložení nové výpůjčky
    const result = await db.query(`
      INSERT INTO rentals (
        order_id,
        equipment_id,
        issue_date,
        planned_return_date,
        daily_rate,
        status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [
      order_id,
      equipment_id,
      issue_date || new Date(),
      planned_return_date || null,
      daily_rate,
      status
    ]);
    
    // Aktualizace stavu vybavení na 'borrowed' pokud je výpůjčka 'issued'
    if (status === 'issued') {
      await db.query(
        'UPDATE equipment SET status = $1 WHERE id = $2',
        ['borrowed', equipment_id]
      );
    }
    
    res.status(201).json({
      message: 'Výpůjčka byla úspěšně přidána.',
      rental: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při přidání výpůjčky:', error);
    res.status(500).json({ 
      message: 'Chyba serveru při přidání výpůjčky.',
      error: error.message // Přidáno pro lepší diagnostiku
    });
  }
};