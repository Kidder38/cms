const db = require('../config/db.config');

/**
 * Vytvoření nového odpisu vybavení
 */
exports.createWriteOff = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { 
      equipment_id, 
      quantity, 
      reason, 
      notes,
      created_by 
    } = req.body;
    
    // Ověření vstupních dat
    if (!equipment_id || !quantity || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chybí povinné údaje. Vyplňte ID vybavení, množství a důvod odpisu.' 
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
              e.purchase_price, e.warehouse_id 
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
    
    // Vytvoření záznamu o odpisu
    const write_off_date = new Date();
    const value_per_unit = equipment.purchase_price || 0;
    const total_value = value_per_unit * quantity;
    
    const writeOffResult = await client.query(
      `INSERT INTO write_offs (write_off_date, reason, notes, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        write_off_date,
        reason,
        notes || null,
        req.userId || created_by // ID přihlášeného uživatele nebo explicitně zadané ID
      ]
    );
    
    const write_off_id = writeOffResult.rows[0].id;
    
    // Přidání položky odpisu
    await client.query(
      `INSERT INTO write_off_items (write_off_id, equipment_id, quantity, value_per_unit, total_value, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [write_off_id, equipment_id, quantity, value_per_unit, total_value, notes || null]
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
      message: 'Odpis byl úspěšně zaznamenán',
      write_off: {
        id: write_off_id,
        write_off_date,
        reason,
        equipment_name: equipment.name,
        inventory_number: equipment.inventory_number,
        quantity,
        total_value
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při vytváření odpisu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Při zpracování odpisu došlo k chybě. Zkuste to prosím znovu později.' 
    });
  } finally {
    client.release();
  }
};

/**
 * Získání všech odpisů
 */
exports.getAllWriteOffs = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT w.*
       FROM write_offs w
       ORDER BY w.write_off_date DESC`
    );
    
    res.status(200).json({
      success: true,
      write_offs: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání odpisů:', error);
    res.status(500).json({
      success: false,
      message: 'Při načítání odpisů došlo k chybě.'
    });
  }
};

/**
 * Získání detailu odpisu podle ID včetně položek
 */
exports.getWriteOffById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Načtení hlavičky odpisu
    const writeOffResult = await db.query(
      `SELECT w.*
       FROM write_offs w
       WHERE w.id = $1`,
      [id]
    );
    
    if (writeOffResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Odpis nebyl nalezen.'
      });
    }
    
    const writeOff = writeOffResult.rows[0];
    
    // Načtení položek odpisu
    const itemsResult = await db.query(
      `SELECT wi.*, e.name as equipment_name, e.inventory_number, w.name as warehouse_name
       FROM write_off_items wi
       JOIN equipment e ON wi.equipment_id = e.id
       LEFT JOIN warehouses w ON e.warehouse_id = w.id
       WHERE wi.write_off_id = $1`,
      [id]
    );
    
    // Výpočet celkové hodnoty odepsaného majetku
    const totalValue = itemsResult.rows.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
    
    res.status(200).json({
      success: true,
      write_off: {
        ...writeOff,
        items: itemsResult.rows,
        total_value: totalValue
      }
    });
  } catch (error) {
    console.error('Chyba při načítání detailu odpisu:', error);
    res.status(500).json({
      success: false,
      message: 'Při načítání detailu odpisu došlo k chybě.'
    });
  }
};

/**
 * Smazání odpisu
 */
exports.deleteWriteOff = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Nejprve zjistíme informace o položkách odpisu, abychom mohli vrátit zboží na sklad
    const itemsResult = await client.query(
      'SELECT equipment_id, quantity FROM write_off_items WHERE write_off_id = $1',
      [id]
    );
    
    if (itemsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Odpis nebyl nalezen nebo neobsahuje žádné položky.'
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
    
    // Nyní smažeme samotné položky odpisu
    await client.query('DELETE FROM write_off_items WHERE write_off_id = $1', [id]);
    
    // A nakonec smažeme záznam o odpisu
    await client.query('DELETE FROM write_offs WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Odpis byl úspěšně smazán a množství vráceno na sklad.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při mazání odpisu:', error);
    res.status(500).json({
      success: false,
      message: 'Při mazání odpisu došlo k chybě.'
    });
  } finally {
    client.release();
  }
};