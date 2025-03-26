const db = require('../config/db.config');

// Vrácení výpůjčky
exports.returnRental = async (req, res) => {
  const { rental_id } = req.params;
  const { 
    actual_return_date, 
    condition,
    damage_description,
    additional_charges,
    return_quantity,
    notes,
    batch_id
  } = req.body;
  
  // Pokud není batch_id předáno, vygenerujeme ho (timestamp)
  const returnBatchId = batch_id || `RETURN-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 1000)}`;
  
  try {
    // Kontrola existence výpůjčky
    const rentalCheck = await db.query(
      'SELECT r.*, e.total_stock FROM rentals r LEFT JOIN equipment e ON r.equipment_id = e.id WHERE r.id = $1',
      [rental_id]
    );
    
    if (rentalCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Výpůjčka nenalezena.' });
    }
    
    const rental = rentalCheck.rows[0];
    
    // Kontrola, že výpůjčka není už vrácena
    if (rental.status === 'returned') {
      return res.status(400).json({ message: 'Tato výpůjčka již byla vrácena.' });
    }
    
    // Kontrola, že vracíme platné množství
    const originalQuantity = parseInt(rental.quantity);
    let quantityToReturn = return_quantity ? parseInt(return_quantity) : originalQuantity;
    
    if (quantityToReturn <= 0 || quantityToReturn > originalQuantity) {
      return res.status(400).json({ 
        message: `Neplatné množství k vrácení. Původně vypůjčeno: ${originalQuantity} kusů.`
      });
    }
    
    // Zjistíme, jestli jde o částečné nebo úplné vrácení
    const isPartialReturn = quantityToReturn < originalQuantity;
    
    // Pokud je to částečné vrácení, upravíme původní výpůjčku a vytvoříme záznam o vrácení
    if (isPartialReturn) {
      // Nejprve aktualizujeme počet kusů v původní výpůjčce
      await db.query(
        'UPDATE rentals SET quantity = $1 WHERE id = $2',
        [originalQuantity - quantityToReturn, rental_id]
      );
    } else {
      // Pokud vracíme všechno, změníme stav původní výpůjčky na 'returned'
      await db.query(
        'UPDATE rentals SET status = $1, actual_return_date = $2 WHERE id = $3',
        ['returned', actual_return_date || new Date(), rental_id]
      );
    }
    
    // Vytvoříme záznam o vrácení
    const returnResult = await db.query(`
      INSERT INTO returns (
        rental_id,
        return_date,
        condition,
        damage_description,
        additional_charges,
        quantity,
        notes,
        batch_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `, [
      rental_id,
      actual_return_date || new Date(),
      condition || 'ok',
      damage_description || null,
      additional_charges || 0,
      quantityToReturn,
      notes || null,
      returnBatchId
    ]);
    
    // Aktualizace stavu vybavení a množství ve skladu
    // Nejprve zjistíme aktuální stav a množství
    const equipmentId = rental.equipment_id;
    const equipmentCheck = await db.query(
      'SELECT * FROM equipment WHERE id = $1',
      [equipmentId]
    );
    
    if (equipmentCheck.rows.length > 0) {
      const equipment = equipmentCheck.rows[0];
      let currentStock = equipment.total_stock === null ? 0 : parseInt(equipment.total_stock);
      
      // Přidáme vrácené kusy zpět do skladu
      currentStock += quantityToReturn;
      
      // Aktualizujeme stav vybavení podle jeho kondice při vrácení
      let newStatus = 'available';
      if (condition === 'damaged') {
        newStatus = 'maintenance';
      }
      
      // Aktualizujeme vybavení
      await db.query(
        'UPDATE equipment SET total_stock = $1, status = $2 WHERE id = $3',
        [currentStock, newStatus, equipmentId]
      );
    }
    
    res.status(200).json({
      message: isPartialReturn ? 'Část výpůjčky byla úspěšně vrácena.' : 'Výpůjčka byla úspěšně vrácena.',
      return: returnResult.rows[0],
      batch_id: returnBatchId
    });
  } catch (error) {
    console.error('Chyba při vracení výpůjčky:', error);
    res.status(500).json({ 
      message: 'Chyba serveru při vracení výpůjčky.',
      error: error.message
    });
  }