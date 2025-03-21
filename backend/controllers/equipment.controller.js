const db = require('../config/db.config');

// Získání všech položek vybavení
exports.getAllEquipment = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, c.name as category_name 
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      ORDER BY e.name ASC
    `);
    
    res.status(200).json({
      count: result.rows.length,
      equipment: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání vybavení:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání vybavení.' });
  }
};

// Získání jedné položky vybavení podle ID
exports.getEquipmentById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT e.*, c.name as category_name 
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vybavení nenalezeno.' });
    }
    
    res.status(200).json({
      equipment: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při načítání vybavení:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání vybavení.' });
  }
};

// Vytvoření nové položky vybavení
exports.createEquipment = async (req, res) => {
  const { 
    name, 
    category_id, 
    inventory_number, 
    purchase_price, 
    daily_rate, 
    status, 
    location, 
    description, 
    photo_url 
  } = req.body;
  
  try {
    // Kontrola unikátního inventárního čísla
    const checkResult = await db.query(
      'SELECT * FROM equipment WHERE inventory_number = $1',
      [inventory_number]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'Inventární číslo již existuje.' });
    }
    
    const result = await db.query(`
      INSERT INTO equipment (
        name, category_id, inventory_number, purchase_price, 
        daily_rate, status, location, description, photo_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      name, 
      category_id, 
      inventory_number, 
      purchase_price, 
      daily_rate, 
      status || 'available', 
      location, 
      description, 
      photo_url
    ]);
    
    res.status(201).json({
      message: 'Vybavení bylo úspěšně vytvořeno.',
      equipment: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při vytváření vybavení:', error);
    res.status(500).json({ message: 'Chyba serveru při vytváření vybavení.' });
  }
};

// Aktualizace položky vybavení
exports.updateEquipment = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    category_id, 
    inventory_number, 
    purchase_price, 
    daily_rate, 
    status, 
    location, 
    description, 
    photo_url 
  } = req.body;
  
  try {
    // Kontrola existence vybavení
    const checkResult = await db.query(
      'SELECT * FROM equipment WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Vybavení nenalezeno.' });
    }
    
    // Kontrola unikátního inventárního čísla (pokud se mění)
    if (inventory_number !== checkResult.rows[0].inventory_number) {
      const inventoryCheck = await db.query(
        'SELECT * FROM equipment WHERE inventory_number = $1 AND id != $2',
        [inventory_number, id]
      );
      
      if (inventoryCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Inventární číslo již existuje.' });
      }
    }
    
    const result = await db.query(`
      UPDATE equipment SET
        name = $1,
        category_id = $2,
        inventory_number = $3,
        purchase_price = $4,
        daily_rate = $5,
        status = $6,
        location = $7,
        description = $8,
        photo_url = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [
      name, 
      category_id, 
      inventory_number, 
      purchase_price, 
      daily_rate, 
      status, 
      location, 
      description, 
      photo_url,
      id
    ]);
    
    res.status(200).json({
      message: 'Vybavení bylo úspěšně aktualizováno.',
      equipment: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při aktualizaci vybavení:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci vybavení.' });
  }
};

// Smazání položky vybavení
exports.deleteEquipment = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence vybavení
    const checkResult = await db.query(
      'SELECT * FROM equipment WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Vybavení nenalezeno.' });
    }
    
    // Kontrola, zda není vybavení právě vypůjčeno
    const rentalCheck = await db.query(
      'SELECT * FROM rentals WHERE equipment_id = $1 AND actual_return_date IS NULL',
      [id]
    );
    
    if (rentalCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Nelze smazat vybavení, které je momentálně vypůjčeno.' });
    }
    
    await db.query('DELETE FROM equipment WHERE id = $1', [id]);
    
    res.status(200).json({
      message: 'Vybavení bylo úspěšně smazáno.'
    });
  } catch (error) {
    console.error('Chyba při mazání vybavení:', error);
    res.status(500).json({ message: 'Chyba serveru při mazání vybavení.' });
  }
};