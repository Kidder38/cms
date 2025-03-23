const db = require('../config/db.config');

// Získání všech kategorií vybavení
exports.getAllCategories = async (req, res) => {
  try {
    // Upravený dotaz, který pro každou kategorii načítá i počet položek vybavení
    const result = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.created_at, 
        c.updated_at,
        COUNT(e.id) AS item_count 
      FROM 
        equipment_categories c
      LEFT JOIN 
        equipment e ON c.id = e.category_id
      GROUP BY 
        c.id
      ORDER BY 
        c.name ASC
    `);
    
    res.status(200).json({
      count: result.rows.length,
      categories: result.rows
    });
  } catch (error) {
    console.error('Chyba při načítání kategorií:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání kategorií.' });
  }
};

// Získání jedné kategorie podle ID
exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Načtení kategorie včetně počtu položek
    const result = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.created_at, 
        c.updated_at,
        COUNT(e.id) AS item_count 
      FROM 
        equipment_categories c
      LEFT JOIN 
        equipment e ON c.id = e.category_id
      WHERE 
        c.id = $1
      GROUP BY 
        c.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kategorie nenalezena.' });
    }
    
    res.status(200).json({
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Chyba při načítání kategorie:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání kategorie.' });
  }
};

// Vytvoření nové kategorie
exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Název kategorie je povinný.' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO equipment_categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    
    // Přidáme item_count s hodnotou 0 pro nově vytvořenou kategorii
    const newCategory = { ...result.rows[0], item_count: "0" };
    
    res.status(201).json({
      message: 'Kategorie byla úspěšně vytvořena.',
      category: newCategory
    });
  } catch (error) {
    console.error('Chyba při vytváření kategorie:', error);
    res.status(500).json({ message: 'Chyba serveru při vytváření kategorie.' });
  }
};

// Aktualizace kategorie
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Název kategorie je povinný.' });
  }
  
  try {
    const checkResult = await db.query('SELECT * FROM equipment_categories WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kategorie nenalezena.' });
    }
    
    const result = await db.query(
      'UPDATE equipment_categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    
    // Získání počtu položek pro aktualizovanou kategorii
    const countResult = await db.query('SELECT COUNT(*) FROM equipment WHERE category_id = $1', [id]);
    const item_count = countResult.rows[0].count;
    
    // Přidání počtu položek do odpovědi
    const updatedCategory = { ...result.rows[0], item_count };
    
    res.status(200).json({
      message: 'Kategorie byla úspěšně aktualizována.',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Chyba při aktualizaci kategorie:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci kategorie.' });
  }
};

// Smazání kategorie
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence kategorie
    const checkResult = await db.query('SELECT * FROM equipment_categories WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kategorie nenalezena.' });
    }
    
    // Kontrola, zda není kategorie používána
    const usageCheck = await db.query('SELECT COUNT(*) FROM equipment WHERE category_id = $1', [id]);
    
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Nelze smazat kategorii, která je přiřazena k vybavení.', 
        count: parseInt(usageCheck.rows[0].count)
      });
    }
    
    await db.query('DELETE FROM equipment_categories WHERE id = $1', [id]);
    
    res.status(200).json({
      message: 'Kategorie byla úspěšně smazána.'
    });
  } catch (error) {
    console.error('Chyba při mazání kategorie:', error);
    res.status(500).json({ message: 'Chyba serveru při mazání kategorie.' });
  }
};