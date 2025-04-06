const db = require('../config/db.config');

/**
 * Vytvoření nového prodeje
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 */
exports.createSale = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { 
      equipment_id, 
      quantity, 
      unit_price, 
      customer_id, 
      invoice_number, 
      notes 
    } = req.body;
    
    // Ověření vstupních dat
    if (!equipment_id || !quantity || !unit_price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chybí povinné údaje. Vyplňte ID vybavení, množství a cenu za jednotku.' 
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Množství musí být větší než 0.' 
      });
    }
    
    // Zjištění dostupnosti vybavení
    const equipmentResult = await client.query(
      `SELECT e.name, e.inventory_number, 
              COALESCE(e.available_stock, 
                      (e.total_stock - COALESCE(
                          (SELECT SUM(r.quantity) 
                           FROM rentals r 
                           WHERE r.equipment_id = e.id 
                             AND r.status IN ('created', 'issued') 
                             AND r.actual_return_date IS NULL), 0))) as available_stock,
              e.warehouse_id 
       FROM equipment e 
       WHERE e.id = $1`,
      [equipment_id]
    );
    
    if (equipmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Vybavení nebylo nalezeno.' 
      });
    }
    
    const equipment = equipmentResult.rows[0];
    
    if (equipment.available_stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: `Nedostatečné množství na skladě. K dispozici: ${equipment.available_stock} ks.` 
      });
    }
    
    // Vytvoření prodejního záznamu
    const total_amount = parseFloat(unit_price) * parseInt(quantity);
    const sale_date = new Date();
    
    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, invoice_number, sale_date, total_amount, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        customer_id || null,
        invoice_number || null,
        sale_date,
        total_amount,
        notes || null,
        req.userId // ID přihlášeného uživatele z auth middlewaru
      ]
    );
    
    const sale_id = saleResult.rows[0].id;
    
    // Přidání položky prodeje
    await client.query(
      `INSERT INTO sale_items (sale_id, equipment_id, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [sale_id, equipment_id, quantity, unit_price, total_amount]
    );
    
    // Aktualizace množství vybavení na skladě
    await client.query(
      `UPDATE equipment 
       SET 
        total_stock = total_stock - $1,
        available_stock = available_stock - $1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, equipment_id]
    );
    
    // Potvrzení transakce
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Prodej byl úspěšně zaznamenán',
      sale: {
        id: sale_id,
        total_amount,
        sale_date,
        equipment_name: equipment.name,
        inventory_number: equipment.inventory_number,
        quantity
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při vytváření prodeje:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Při zpracování prodeje došlo k chybě. Zkuste to prosím znovu později.' 
    });
  } finally {
    client.release();
  }
};

/**
 * Získání všech prodejů
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 */
exports.getAllSales = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       ORDER BY s.sale_date DESC`
    );
    
    res.status(200).json({
      success: true,
      sales: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání prodejů:', error);
    res.status(500).json({
      success: false,
      message: 'Při načítání prodejů došlo k chybě.'
    });
  }
};

/**
 * Získání detailu prodeje podle ID včetně položek
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 */
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Načtení hlavičky prodeje
    const saleResult = await db.query(
      `SELECT s.*, c.name as customer_name, c.address as customer_address, 
              c.ico as customer_ico, c.dic as customer_dic, c.email as customer_email,
              c.phone as customer_phone
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (saleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prodej nebyl nalezen.'
      });
    }
    
    const sale = saleResult.rows[0];
    
    // Načtení položek prodeje
    const itemsResult = await db.query(
      `SELECT si.*, e.name as equipment_name, e.inventory_number
       FROM sale_items si
       JOIN equipment e ON si.equipment_id = e.id
       WHERE si.sale_id = $1`,
      [id]
    );
    
    res.status(200).json({
      success: true,
      sale: {
        ...sale,
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Chyba při načítání detailu prodeje:', error);
    res.status(500).json({
      success: false,
      message: 'Při načítání detailu prodeje došlo k chybě.'
    });
  }
};

/**
 * Aktualizace prodeje
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 */
exports.updateSale = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { customer_id, invoice_number, notes } = req.body;
    
    // Ověření existence prodeje
    const saleCheck = await client.query('SELECT id FROM sales WHERE id = $1', [id]);
    
    if (saleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Prodej nebyl nalezen.'
      });
    }
    
    // Aktualizace údajů prodeje (pouze metadata, ne množství)
    await client.query(
      `UPDATE sales
       SET customer_id = $1, invoice_number = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [customer_id || null, invoice_number || null, notes || null, id]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Prodej byl úspěšně aktualizován'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při aktualizaci prodeje:', error);
    res.status(500).json({
      success: false,
      message: 'Při aktualizaci prodeje došlo k chybě.'
    });
  } finally {
    client.release();
  }
};

/**
 * Smazání prodeje
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 */
exports.deleteSale = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Nejprve zjistíme informace o položkách prodeje, abychom mohli vrátit zboží na sklad
    const itemsResult = await client.query(
      'SELECT equipment_id, quantity FROM sale_items WHERE sale_id = $1',
      [id]
    );
    
    if (itemsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Prodej nebyl nalezen nebo neobsahuje žádné položky.'
      });
    }
    
    // Pro každou položku vrátíme množství zpět na sklad
    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE equipment
         SET total_stock = total_stock + $1,
             available_stock = available_stock + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [item.quantity, item.equipment_id]
      );
    }
    
    // Nyní smažeme samotné položky prodeje
    await client.query('DELETE FROM sale_items WHERE sale_id = $1', [id]);
    
    // A nakonec smažeme záznam o prodeji
    await client.query('DELETE FROM sales WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Prodej byl úspěšně smazán a množství vráceno na sklad.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při mazání prodeje:', error);
    res.status(500).json({
      success: false,
      message: 'Při mazání prodeje došlo k chybě.'
    });
  } finally {
    client.release();
  }
};

/**
 * Získání všech prodejů zákazníka
 */
exports.getCustomerSales = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const result = await db.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count,
              (SELECT SUM(quantity) FROM sale_items WHERE sale_id = s.id) as total_items
       FROM sales s
       WHERE s.customer_id = $1
       ORDER BY s.sale_date DESC`,
      [customerId]
    );
    
    res.status(200).json({
      success: true,
      sales: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání prodejů zákazníka:', error);
    res.status(500).json({
      success: false,
      message: 'Při načítání prodejů zákazníka došlo k chybě.'
    });
  }
};