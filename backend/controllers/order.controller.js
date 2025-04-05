const db = require('../config/db.config');

// Získání všech zakázek
exports.getAllOrders = async (req, res) => {
  try {
    let result;
    
    // Pro adminy vrátíme všechny zakázky
    if (req.user.role === 'admin') {
      result = await db.query(`
        SELECT o.*, c.name as customer_name 
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.creation_date DESC
      `);
    } else {
      // Pro běžné uživatele pouze jejich přiřazené zakázky
      result = await db.query(`
        SELECT o.*, c.name as customer_name 
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id IN (
          SELECT order_id FROM user_order_access WHERE user_id = $1
        ) OR o.customer_id IN (
          SELECT customer_id FROM user_customer_access WHERE user_id = $1
        )
        ORDER BY o.creation_date DESC
      `, [req.user.id]);
    }
    
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
  
  // Přidaná validace ID
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ 
      message: 'Neplatné ID zakázky. Musí být celé číslo.',
      error: 'INVALID_ID'
    });
  }
  
  // Konverze ID na číslo
  const orderId = parseInt(id);
  
  try {
    // Získání základních informací o zakázce
    const orderResult = await db.query(`
      SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);
    
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
    `, [orderId]);
    
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
  const { customer_id, order_number, name, status, estimated_end_date, notes } = req.body;
  
  // Validace povinných polí
  if (!customer_id || isNaN(parseInt(customer_id))) {
    return res.status(400).json({ message: 'Zákazník je povinný údaj a musí být platné číslo.' });
  }
  
  if (!order_number) {
    return res.status(400).json({ message: 'Číslo zakázky je povinný údaj.' });
  }
  
  if (!name) {
    return res.status(400).json({ message: 'Název zakázky je povinný údaj.' });
  }
  
  try {
    // Kontrola existence zákazníka
    const customerCheck = await db.query('SELECT * FROM customers WHERE id = $1', [parseInt(customer_id)]);
    
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
        name,
        status, 
        estimated_end_date, 
        notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [
      parseInt(customer_id),
      order_number,
      name,
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
  const { customer_id, order_number, name, status, estimated_end_date, notes } = req.body;
  
  // Validace ID zakázky
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ 
      message: 'Neplatné ID zakázky. Musí být celé číslo.',
      error: 'INVALID_ID'
    });
  }
  
  // Validace povinných polí
  if (!customer_id || isNaN(parseInt(customer_id))) {
    return res.status(400).json({ message: 'Zákazník je povinný údaj a musí být platné číslo.' });
  }
  
  if (!order_number) {
    return res.status(400).json({ message: 'Číslo zakázky je povinný údaj.' });
  }
  
  if (!name) {
    return res.status(400).json({ message: 'Název zakázky je povinný údaj.' });
  }
  
  // Konverze ID na čísla
  const orderId = parseInt(id);
  const customerId = parseInt(customer_id);
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Kontrola existence zákazníka
    const customerCheck = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    
    if (customerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Vybraný zákazník neexistuje.' });
    }
    
    // Kontrola duplicitního čísla zakázky (kromě aktuální zakázky)
    const duplicateCheck = await db.query(
      'SELECT * FROM orders WHERE order_number = $1 AND id != $2', 
      [order_number, orderId]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Zakázka s tímto číslem již existuje.' });
    }
    
    const result = await db.query(`
      UPDATE orders 
      SET 
        customer_id = $1, 
        order_number = $2,
        name = $3,
        status = $4, 
        estimated_end_date = $5, 
        notes = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 
      RETURNING *
    `, [
      customerId,
      order_number,
      name,
      status,
      estimated_end_date,
      notes,
      orderId
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
  
  // Validace ID zakázky
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ 
      message: 'Neplatné ID zakázky. Musí být celé číslo.',
      error: 'INVALID_ID'
    });
  }
  
  // Konverze ID na číslo
  const orderId = parseInt(id);
  
  try {
    // Kontrola existence zakázky
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Zakázka nenalezena.' });
    }
    
    // Kontrola, zda zakázka nemá aktivní výpůjčky
    const rentalsCheck = await db.query(
      'SELECT * FROM rentals WHERE order_id = $1 AND status IN ($2, $3)', 
      [orderId, 'created', 'issued']
    );
    
    if (rentalsCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Nelze smazat zakázku, která má aktivní výpůjčky.', 
        count: rentalsCheck.rows.length
      });
    }
    
    // Nejprve smažeme všechny výpůjčky, které patří k této zakázce
    await db.query('DELETE FROM rentals WHERE order_id = $1', [orderId]);
    
    // Pak smažeme samotnou zakázku
    await db.query('DELETE FROM orders WHERE id = $1', [orderId]);
    
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
  
  // Validace ID zakázky
  if (!order_id || isNaN(parseInt(order_id))) {
    return res.status(400).json({ 
      message: 'Neplatné ID zakázky. Musí být celé číslo.',
      error: 'INVALID_ORDER_ID'
    });
  }
  
  // Validace ID vybavení
  if (!equipment_id || isNaN(parseInt(equipment_id))) {
    return res.status(400).json({ 
      message: 'Vybavení je povinný údaj a musí být platné číslo.',
      error: 'INVALID_EQUIPMENT_ID'
    });
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
    
    // Aktualizace stavu vybavení a snížení počtu dostupných kusů, pokud je výpůjčka 'issued'
    if (status === 'issued') {
      // Nejprve získáme aktuální data o vybavení včetně počtu kusů
      const equipmentData = equipmentCheck.rows[0];
      let currentStock = equipmentData.total_stock;
      
      // Pokud je celkový počet definován, snížíme ho o 1 (výchozí množství)
      if (currentStock !== null && currentStock !== undefined) {
        currentStock = Math.max(0, parseInt(currentStock) - 1);
        
        // Aktualizujeme počet kusů na skladě
        await db.query(
          'UPDATE equipment SET total_stock = $1 WHERE id = $2',
          [currentStock, equipment_id]
        );
      }
      
      // Změníme stav vybavení na 'borrowed', pokud je všechno vypůjčeno
      if (currentStock === 0) {
        await db.query(
          'UPDATE equipment SET status = $1 WHERE id = $2',
          ['borrowed', equipment_id]
        );
      }
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