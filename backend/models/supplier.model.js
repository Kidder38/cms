const db = require('../config/db.config');

// Vytvoření dodavatele
exports.create = async (supplierData) => {
  const {
    name,
    contact_person,
    email,
    phone,
    address,
    ico,
    dic,
    bank_account,
    notes
  } = supplierData;

  const result = await db.query(
    `INSERT INTO suppliers 
      (name, contact_person, email, phone, address, ico, dic, bank_account, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
    [name, contact_person, email, phone, address, ico, dic, bank_account, notes]
  );

  return result.rows[0];
};

// Aktualizace dodavatele
exports.update = async (id, supplierData) => {
  const {
    name,
    contact_person,
    email,
    phone,
    address,
    ico,
    dic,
    bank_account,
    notes
  } = supplierData;

  const result = await db.query(
    `UPDATE suppliers 
     SET name = $1, 
         contact_person = $2, 
         email = $3, 
         phone = $4, 
         address = $5, 
         ico = $6, 
         dic = $7, 
         bank_account = $8,
         notes = $9,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $10 
     RETURNING *`,
    [name, contact_person, email, phone, address, ico, dic, bank_account, notes, id]
  );

  return result.rows[0];
};

// Získání jednoho dodavatele podle ID
exports.findById = async (id) => {
  const result = await db.query('SELECT * FROM suppliers WHERE id = $1', [id]);
  return result.rows[0];
};

// Získání všech dodavatelů
exports.findAll = async () => {
  const result = await db.query('SELECT * FROM suppliers ORDER BY name ASC');
  return result.rows;
};

// Smazání dodavatele
exports.delete = async (id) => {
  // Nejprve zkontrolujeme, zda dodavatel nemá přiřazené vybavení
  const equipmentCheck = await db.query(
    'SELECT COUNT(*) FROM equipment WHERE supplier_id = $1', 
    [id]
  );
  
  if (parseInt(equipmentCheck.rows[0].count) > 0) {
    throw new Error('Nelze smazat dodavatele, který má přiřazené vybavení.');
  }
  
  const result = await db.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

// Získání vybavení od dodavatele
exports.getEquipment = async (supplierId) => {
  const result = await db.query(
    `SELECT * FROM equipment 
     WHERE supplier_id = $1
     ORDER BY name ASC`,
    [supplierId]
  );
  
  return result.rows;
};