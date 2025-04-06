const db = require('../config/db.config');

/**
 * Vytvoření nové inventury
 */
exports.createInventoryCheck = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { 
      warehouse_id, 
      check_date, 
      notes,
      created_by 
    } = req.body;
    
    // Ověření vstupních dat
    if (!warehouse_id || !check_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chybí povinné údaje. Vyplňte ID skladu a datum inventury.' 
      });
    }
    
    // Kontrola existence skladu
    const warehouseResult = await client.query(
      'SELECT id, name FROM warehouses WHERE id = $1',
      [warehouse_id]
    );
    
    if (warehouseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Sklad nebyl nalezen.' 
      });
    }
    
    // Kontrola, zda pro daný sklad již neexistuje nedokončená inventura
    const existingCheckResult = await client.query(
      'SELECT id FROM inventory_checks WHERE warehouse_id = $1 AND status = $2',
      [warehouse_id, 'in_progress']
    );
    
    if (existingCheckResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Pro tento sklad již existuje nedokončená inventura. Nejprve ji dokončete nebo zrušte.' 
      });
    }
    
    // Vytvoření záznamu o inventuře
    const inventoryCheckResult = await client.query(
      `INSERT INTO inventory_checks (warehouse_id, check_date, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        warehouse_id,
        check_date,
        'in_progress',
        notes || null,
        req.userId || created_by // ID přihlášeného uživatele nebo explicitně zadané ID
      ]
    );
    
    const inventory_check_id = inventoryCheckResult.rows[0].id;
    
    // Získání všech položek vybavení v daném skladu
    const equipmentResult = await client.query(
      `SELECT id, name, inventory_number, total_stock, available_stock, category_id
       FROM equipment
       WHERE warehouse_id = $1 AND total_stock > 0`,
      [warehouse_id]
    );
    
    // Vytvoření položek inventury pro každé vybavení ve skladu
    if (equipmentResult.rows.length > 0) {
      const insertValues = equipmentResult.rows.map((equipment, index) => {
        return `($1, $${index * 2 + 2}, $${index * 2 + 3})`;
      }).join(', ');
      
      const insertParams = [inventory_check_id];
      equipmentResult.rows.forEach(equipment => {
        insertParams.push(equipment.id);
        insertParams.push(equipment.total_stock);
      });
      
      await client.query(
        `INSERT INTO inventory_check_items (inventory_check_id, equipment_id, expected_quantity)
         VALUES ${insertValues}`,
        insertParams
      );
    }
    
    // Potvrzení transakce
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Inventura byla úspěšně vytvořena',
      inventory_check: {
        id: inventory_check_id,
        warehouse_id,
        warehouse_name: warehouseResult.rows[0].name,
        check_date,
        status: 'in_progress',
        total_items: equipmentResult.rows.length
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při vytváření inventury:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Při zpracování inventury došlo k chybě. Zkuste to prosím znovu později.' 
    });
  } finally {
    client.release();
  }
};

/**
 * Získání všech inventur
 */
exports.getAllInventoryChecks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ic.*, w.name as warehouse_name,
              (SELECT COUNT(*) FROM inventory_check_items WHERE inventory_check_id = ic.id) AS total_items,
              (SELECT COUNT(*) FROM inventory_check_items WHERE inventory_check_id = ic.id AND actual_quantity IS NOT NULL) AS checked_items
       FROM inventory_checks ic
       LEFT JOIN warehouses w ON ic.warehouse_id = w.id
       ORDER BY ic.created_at DESC`
    );
    
    res.status(200).json({
      success: true,
      inventory_checks: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání inventur:', error);
    res.status(500).json({
      success: false,
      message: 'Při načítání inventur došlo k chybě.'
    });
  }
};

/**
 * Získání detailu inventury podle ID včetně položek
 */
exports.getInventoryCheckById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Načtení hlavičky inventury
    const inventoryCheckResult = await db.query(
      `SELECT ic.*, w.name as warehouse_name
       FROM inventory_checks ic
       LEFT JOIN warehouses w ON ic.warehouse_id = w.id
       WHERE ic.id = $1`,
      [id]
    );
    
    if (inventoryCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventura nebyla nalezena.'
      });
    }
    
    const inventoryCheck = inventoryCheckResult.rows[0];
    
    // Načtení položek inventury
    const itemsResult = await db.query(
      `SELECT ici.*, e.name, e.inventory_number, e.total_stock, e.available_stock, c.name as category_name
       FROM inventory_check_items ici
       JOIN equipment e ON ici.equipment_id = e.id
       LEFT JOIN equipment_categories c ON e.category_id = c.id
       WHERE ici.inventory_check_id = $1
       ORDER BY e.name ASC`,
      [id]
    );
    
    // Statistiky inventury
    const totalItems = itemsResult.rows.length;
    const checkedItems = itemsResult.rows.filter(item => item.actual_quantity !== null).length;
    const discrepancyItems = itemsResult.rows.filter(
      item => item.actual_quantity !== null && item.actual_quantity !== item.expected_quantity
    ).length;
    
    res.status(200).json({
      success: true,
      inventory_check: {
        ...inventoryCheck,
        items: itemsResult.rows,
        statistics: {
          total_items: totalItems,
          checked_items: checkedItems,
          discrepancy_items: discrepancyItems,
          progress_percentage: totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Chyba při načítání detailu inventury:', error);
    res.status(500).json({
      success: false,
      message: 'Při načítání detailu inventury došlo k chybě.'
    });
  }
};

/**
 * Aktualizace položky inventury
 */
exports.updateInventoryCheckItem = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id, itemId } = req.params;
    const { actual_quantity, notes } = req.body;
    
    // Ověření vstupních dat
    if (actual_quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chybí povinné údaje. Vyplňte skutečné množství.' 
      });
    }
    
    if (actual_quantity < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skutečné množství nemůže být záporné.' 
      });
    }
    
    // Kontrola existence inventury
    const inventoryCheckResult = await client.query(
      'SELECT status FROM inventory_checks WHERE id = $1',
      [id]
    );
    
    if (inventoryCheckResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Inventura nebyla nalezena.'
      });
    }
    
    // Kontrola, zda inventura není již dokončena nebo zrušena
    if (inventoryCheckResult.rows[0].status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Nelze upravovat položky v již dokončené nebo zrušené inventuře.'
      });
    }
    
    // Kontrola existence položky inventury
    const itemCheckResult = await client.query(
      'SELECT id FROM inventory_check_items WHERE id = $1 AND inventory_check_id = $2',
      [itemId, id]
    );
    
    if (itemCheckResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Položka inventury nebyla nalezena.'
      });
    }
    
    // Aktualizace položky inventury
    await client.query(
      `UPDATE inventory_check_items
       SET actual_quantity = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [actual_quantity, notes || null, itemId]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Položka inventury byla úspěšně aktualizována'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při aktualizaci položky inventury:', error);
    res.status(500).json({
      success: false,
      message: 'Při aktualizaci položky inventury došlo k chybě.'
    });
  } finally {
    client.release();
  }
};

/**
 * Dokončení inventury a aktualizace skladových zásob
 */
exports.completeInventoryCheck = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { adjust_stock } = req.body;
    
    // Kontrola existence inventury
    const inventoryCheckResult = await client.query(
      'SELECT status, warehouse_id FROM inventory_checks WHERE id = $1',
      [id]
    );
    
    if (inventoryCheckResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Inventura nebyla nalezena.'
      });
    }
    
    // Kontrola, zda inventura není již dokončena nebo zrušena
    if (inventoryCheckResult.rows[0].status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Inventura je již dokončena nebo zrušena.'
      });
    }
    
    // Kontrola, zda jsou všechny položky zkontrolovány
    const itemsResult = await client.query(
      'SELECT id, equipment_id, expected_quantity, actual_quantity FROM inventory_check_items WHERE inventory_check_id = $1',
      [id]
    );
    
    const uncheckedItems = itemsResult.rows.filter(item => item.actual_quantity === null);
    if (uncheckedItems.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Nelze dokončit inventuru, není zkontrolováno ${uncheckedItems.length} položek.`
      });
    }
    
    // Pokud je požadavek na úpravu skladu podle inventury, aktualizujeme skladové zásoby
    if (adjust_stock) {
      for (const item of itemsResult.rows) {
        const difference = item.actual_quantity - item.expected_quantity;
        
        if (difference !== 0) {
          // Pokud je rozdíl, aktualizujeme stav na skladě
          await client.query(
            `UPDATE equipment
             SET total_stock = $1, 
                 available_stock = GREATEST(available_stock + $2, 0),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [item.actual_quantity, difference, item.equipment_id]
          );
        }
      }
    }
    
    // Aktualizace stavu inventury na "completed"
    await client.query(
      `UPDATE inventory_checks
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: adjust_stock 
        ? 'Inventura byla úspěšně dokončena a skladové zásoby byly aktualizovány.'
        : 'Inventura byla úspěšně dokončena bez aktualizace skladových zásob.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při dokončování inventury:', error);
    res.status(500).json({
      success: false,
      message: 'Při dokončování inventury došlo k chybě.'
    });
  } finally {
    client.release();
  }
};

/**
 * Zrušení inventury
 */
exports.cancelInventoryCheck = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Kontrola existence inventury
    const inventoryCheckResult = await client.query(
      'SELECT status FROM inventory_checks WHERE id = $1',
      [id]
    );
    
    if (inventoryCheckResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Inventura nebyla nalezena.'
      });
    }
    
    // Kontrola, zda inventura není již dokončena nebo zrušena
    if (inventoryCheckResult.rows[0].status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Inventura je již dokončena nebo zrušena.'
      });
    }
    
    // Aktualizace stavu inventury na "canceled"
    await client.query(
      `UPDATE inventory_checks
       SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Inventura byla úspěšně zrušena.'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při rušení inventury:', error);
    res.status(500).json({
      success: false,
      message: 'Při rušení inventury došlo k chybě.'
    });
  } finally {
    client.release();
  }
};