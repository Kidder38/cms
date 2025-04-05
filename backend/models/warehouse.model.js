const db = require('../config/db.config');

// Vytvoření skladu
exports.create = async (warehouseData) => {
  const {
    name,
    description,
    is_external,
    supplier_id,
    location,
    contact_person,
    phone,
    email,
    notes
  } = warehouseData;

  const result = await db.query(
    `INSERT INTO warehouses 
      (name, description, is_external, supplier_id, location, contact_person, phone, email, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
    [name, description, is_external, supplier_id, location, contact_person, phone, email, notes]
  );

  return result.rows[0];
};

// Aktualizace skladu
exports.update = async (id, warehouseData) => {
  const {
    name,
    description,
    is_external,
    supplier_id,
    location,
    contact_person,
    phone,
    email,
    notes
  } = warehouseData;

  const result = await db.query(
    `UPDATE warehouses 
     SET name = $1, 
         description = $2, 
         is_external = $3, 
         supplier_id = $4, 
         location = $5, 
         contact_person = $6, 
         phone = $7, 
         email = $8,
         notes = $9,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $10 
     RETURNING *`,
    [name, description, is_external, supplier_id, location, contact_person, phone, email, notes, id]
  );

  return result.rows[0];
};

// Získání jednoho skladu podle ID
exports.findById = async (id) => {
  const result = await db.query(
    `SELECT w.*, s.name as supplier_name 
     FROM warehouses w
     LEFT JOIN suppliers s ON w.supplier_id = s.id
     WHERE w.id = $1`, 
    [id]
  );
  return result.rows[0];
};

// Získání všech skladů
exports.findAll = async (includeExternalOnly = false) => {
  let query = `
    SELECT w.*, s.name as supplier_name 
    FROM warehouses w
    LEFT JOIN suppliers s ON w.supplier_id = s.id
  `;
  
  if (includeExternalOnly) {
    query += ' WHERE w.is_external = TRUE';
  }
  
  query += ' ORDER BY w.is_external, w.name ASC';
  
  const result = await db.query(query);
  return result.rows;
};

// Smazání skladu
exports.delete = async (id) => {
  // Nejprve zkontrolujeme, zda sklad nemá přiřazené vybavení
  const equipmentCheck = await db.query(
    'SELECT COUNT(*) FROM equipment WHERE warehouse_id = $1', 
    [id]
  );
  
  if (parseInt(equipmentCheck.rows[0].count) > 0) {
    throw new Error('Nelze smazat sklad, který obsahuje vybavení.');
  }
  
  const result = await db.query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

// Získání vybavení ze skladu
exports.getEquipment = async (warehouseId) => {
  const result = await db.query(
    `SELECT e.*, c.name as category_name 
     FROM equipment e
     LEFT JOIN equipment_categories c ON e.category_id = c.id
     WHERE e.warehouse_id = $1
     ORDER BY e.name ASC`,
    [warehouseId]
  );
  
  return result.rows;
};