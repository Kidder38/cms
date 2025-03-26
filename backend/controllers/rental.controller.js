const db = require('../config/db.config');

// Přidání výpůjčky k zakázce s podporou pro množství kusů a batch_id
exports.addRental = async (req, res) => {
  let { order_id } = req.params;
  let { 
    equipment_id, 
    issue_date, 
    planned_return_date, 
    daily_rate,
    status,
    quantity,
    note,
    batch_id
  } = req.body;
  
  if (!equipment_id) {
    return res.status(400).json({ message: 'Vybavení je povinný údaj.' });
  }
  
  if (!quantity || quantity < 1) {
    quantity = 1; // Výchozí množství je 1 kus
  }
  
  // Pokud není batch_id předáno, vygenerujeme ho (timestamp)
  if (!batch_id) {
    batch_id = `ISSUE-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000)}`;
  }
  
  // Konverze ID na čísla
  order_id = parseInt(order_id);
  equipment_id = parseInt(equipment_id);
  quantity = parseInt(quantity);
  
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
    
    const equipmentData = equipmentCheck.rows[0];
    
    // Kontrola dostupnosti vybavení
    if (equipmentData.status !== 'available') {
      return res.status(400).json({ 
        message: 'Vybrané vybavení není dostupné k vypůjčení.', 
        status: equipmentData.status
      });
    }
    
    // Kontrola dostatečného množství kusů na skladě
    if (equipmentData.total_stock !== null && equipmentData.total_stock !== undefined) {
      const availableStock = parseInt(equipmentData.total_stock);
      if (availableStock < quantity) {
        return res.status(400).json({ 
          message: `Nedostatek kusů na skladě. Požadováno: ${quantity}, dostupno: ${availableStock}.`, 
          availableStock
        });
      }
    }
    
    // Nastavení defaultních hodnot
    if (!daily_rate) {
      daily_rate = parseFloat(equipmentData.daily_rate);
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
        status,
        quantity,
        note,
        batch_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      order_id,
      equipment_id,
      issue_date || new Date(),
      planned_return_date || null,
      daily_rate,
      status,
      quantity,
      note || null,
      batch_id
    ]);
    
    // Aktualizace stavu vybavení na 'borrowed' a snížení dostupného množství, pokud je výpůjčka 'issued'
    if (status === 'issued') {
      // Zjistíme aktuální počet kusů
      let currentStock = equipmentData.total_stock;
      
      // Pokud je celkový počet definován, snížíme ho o vypůjčené množství
      if (currentStock !== null && currentStock !== undefined) {
        currentStock = Math.max(0, parseInt(currentStock) - quantity);
        
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
      rental: result.rows[0],
      batch_id: batch_id
    });
  } catch (error) {
    console.error('Chyba při přidání výpůjčky:', error);
    res.status(500).json({ 
      message: 'Chyba serveru při přidání výpůjčky.',
      error: error.message
    });
  }
};

// Aktualizace výpůjčky
exports.updateRental = async (req, res) => {
  const { rental_id } = req.params;
  const {
    issue_date,
    planned_return_date,
    daily_rate,
    status,
    quantity,
    note
  } = req.body;
  
  try {
    // Kontrola existence výpůjčky
    const rentalCheck = await db.query('SELECT * FROM rentals WHERE id = $1', [rental_id]);
    
    if (rentalCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Výpůjčka nenalezena.' });
    }
    
    const originalRental = rentalCheck.rows[0];
    const originalStatus = originalRental.status;
    const originalQuantity = parseInt(originalRental.quantity) || 1;
    const newStatus = status || originalStatus;
    const newQuantity = quantity ? parseInt(quantity) : originalQuantity;
    
    // Kontrola dostupnosti kusů, pokud se zvyšuje množství
    if (newQuantity > originalQuantity) {
      // Zjistíme aktuální stav vybavení
      const equipmentCheck = await db.query('SELECT * FROM equipment WHERE id = $1', [originalRental.equipment_id]);
      
      if (equipmentCheck.rows.length > 0) {
        const equipment = equipmentCheck.rows[0];
        const availableStock = parseInt(equipment.total_stock) || 0;
        
        // Kontrola, zda je dostatek kusů na zvýšení množství
        if (availableStock < (newQuantity - originalQuantity)) {
          return res.status(400).json({ 
            message: `Nedostatek kusů na skladě pro zvýšení množství. Požadováno: ${newQuantity - originalQuantity}, dostupno: ${availableStock}.`,
            availableStock
          });
        }
        
        // Aktualizace skladu, pokud se mění množství nebo stav
        if (newQuantity !== originalQuantity || newStatus !== originalStatus) {
          let stockChange = 0;
          
          // Výpočet změny skladu
          if (originalStatus === 'issued' && newStatus === 'issued') {
            // Pokud zůstává status issued, upravíme jen rozdíl v množství
            stockChange = originalQuantity - newQuantity;
          } else if (originalStatus !== 'issued' && newStatus === 'issued') {
            // Pokud se mění na issued, odečteme celé nové množství
            stockChange = -newQuantity;
          } else if (originalStatus === 'issued' && newStatus !== 'issued') {
            // Pokud se mění z issued, přičteme celé původní množství
            stockChange = originalQuantity;
          }
          
          // Aktualizace skladu
          if (stockChange !== 0) {
            const newStock = Math.max(0, availableStock + stockChange);
            
            await db.query(
              'UPDATE equipment SET total_stock = $1 WHERE id = $2',
              [newStock, originalRental.equipment_id]
            );
            
            // Aktualizace stavu vybavení podle množství na skladě
            const equipmentStatus = newStock > 0 ? 'available' : 'borrowed';
            
            await db.query(
              'UPDATE equipment SET status = $1 WHERE id = $2',
              [equipmentStatus, originalRental.equipment_id]
            );
          }
        }
      }
    }
    
    // Aktualizace výpůjčky
    const result = await db.query(`
      UPDATE rentals
      SET 
        issue_date = COALESCE($1, issue_date),
        planned_return_date = COALESCE($2, planned_return_date),
        daily_rate = COALESCE($3, daily_rate),
        status = COALESCE($4, status),
        quantity = COALESCE($5, quantity),
        note = COALESCE($6, note),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [
      issue_date,
      planned_return_date,
      daily_rate ? parseFloat(daily_rate) : null,
      status,
      quantity ? parseInt(quantity) : null,
      note,
      rental_id
    ]);
    
    res.status(200).json({
      message: 'Výpůjčka byla úspěšně aktualizována.',
      rental: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při aktualizaci výpůjčky:', error);
    res.status(500).json({ 
      message: 'Chyba serveru při aktualizaci výpůjčky.',
      error: error.message
    });
  }
};

// Získání všech výpůjček pro zakázku
exports.getRentalsByOrder = async (req, res) => {
  const { order_id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number
      FROM rentals r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.order_id = $1
      ORDER BY r.issue_date DESC
    `, [order_id]);
    
    res.status(200).json({
      count: result.rows.length,
      rentals: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání výpůjček zakázky:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání výpůjček.' });
  }
};

// Získání všech výpůjček podle batch_id
exports.getRentalsByBatch = async (req, res) => {
  const { batch_id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT r.*, e.name as equipment_name, e.inventory_number
      FROM rentals r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.batch_id = $1
      ORDER BY r.issue_date DESC
    `, [batch_id]);
    
    res.status(200).json({
      count: result.rows.length,
      rentals: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání výpůjček podle batch_id:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání výpůjček.' });
  }
};