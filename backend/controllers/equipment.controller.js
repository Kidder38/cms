const db = require('../config/db.config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurace uložiště pro multer (pro ukládání nahraných souborů)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Vytvoří složku pro uploady, pokud neexistuje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'equipment-' + uniqueSuffix + extension);
  }
});

// Filtr pro povolené typy souborů
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nepodporovaný formát souboru. Povolené formáty jsou: JPG, PNG, GIF.'), false);
  }
};

// Inicializace middlewaru multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware pro nahrávání jedné fotografie
exports.uploadPhoto = upload.single('photo');

// Získání všech položek vybavení
exports.getAllEquipment = async (req, res) => {
  try {
    // Nejprve provedeme diagnostický dotaz pro kontrolu dat v databázi
    const diagnosticQuery = await db.query(`
      SELECT 
        e.id, 
        e.name, 
        e.total_stock,
        COALESCE(SUM(r.quantity), 0) as total_rented
      FROM 
        equipment e
      LEFT JOIN 
        rentals r ON e.id = r.equipment_id AND r.status IN ('created', 'issued') AND r.actual_return_date IS NULL
      GROUP BY 
        e.id, e.name, e.total_stock
      ORDER BY 
        e.name ASC
    `);
    
    console.log("===================== DIAGNOSTIC DATA =====================");
    diagnosticQuery.rows.forEach(row => {
      if (row.total_stock > 0 || row.total_rented > 0) {
        console.log(`ID: ${row.id}, Name: ${row.name}, Total Stock: ${row.total_stock}, Total Rented: ${row.total_rented}`);
      }
    });
    console.log("==========================================================");
    
    // Získání vybavení s kategoriemi, dodavateli a sklady
    const equipmentResult = await db.query(`
      SELECT e.*, c.name as category_name, s.name as supplier_name, 
             s.contact_person as supplier_contact, w.name as warehouse_name
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN warehouses w ON e.warehouse_id = w.id
      ORDER BY e.name ASC
    `);
    
    // Přímo použijeme výsledky z diagnostického dotazu, který již obsahuje vypočtené
    // množství vypůjčených kusů - spolehlivější přístup
    
    // Vytvoření mapy vypůjčených množství podle ID vybavení
    const rentedQuantities = {};
    diagnosticQuery.rows.forEach(row => {
      rentedQuantities[row.id] = parseInt(row.total_rented);
    });
    
    // Přidání informací o aktuální dostupnosti do výsledků
    // Přidáme debug informace pro ověření výpočtu
    console.log("Vypůjčená množství z diagnostického dotazu:", rentedQuantities);
    
    const equipmentWithAvailability = equipmentResult.rows.map(item => {
      const totalStock = item.total_stock !== null ? parseInt(item.total_stock) : 0;
      const rentedQuantity = rentedQuantities[item.id] || 0;
      const availableStock = Math.max(0, totalStock - rentedQuantity);
      
      // Debug log pro položky s velkým rozdílem
      if (totalStock > 0 && rentedQuantity > 0) {
        console.log(`Vybavení ${item.id} (${item.name}): Celkem=${totalStock}, Vypůjčeno=${rentedQuantity}, Dostupné=${availableStock}`);
      }
      
      return {
        ...item,
        rented_quantity: rentedQuantity,
        available_stock: availableStock
      };
    });
    
    res.status(200).json({
      count: equipmentWithAvailability.length,
      equipment: equipmentWithAvailability
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
      SELECT e.*, c.name as category_name, s.name as supplier_name, s.contact_person as supplier_contact,
             w.name as warehouse_name
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN warehouses w ON e.warehouse_id = w.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vybavení nenalezeno.' });
    }
    
    // Spolehlivější dotaz s JOIN pro získání přesných informací o výpůjčkách
    const diagnosticQuery = await db.query(`
      SELECT 
        e.id, 
        e.total_stock,
        COALESCE(SUM(r.quantity), 0) as total_rented
      FROM 
        equipment e
      LEFT JOIN 
        rentals r ON e.id = r.equipment_id AND r.status IN ('created', 'issued') AND r.actual_return_date IS NULL
      WHERE
        e.id = $1
      GROUP BY 
        e.id, e.total_stock
    `, [id]);
    
    const equipment = result.rows[0];
    const totalStock = equipment.total_stock !== null ? parseInt(equipment.total_stock) : 0;
    const rentedQuantity = diagnosticQuery.rows.length > 0 && diagnosticQuery.rows[0].total_rented ? 
                          parseInt(diagnosticQuery.rows[0].total_rented) : 0;
    
    // Debug log
    console.log(`Detail vybavení ${id} (${equipment.name}): Celkem=${totalStock}, Vypůjčeno=${rentedQuantity}`);
    
    const availableStock = Math.max(0, totalStock - rentedQuantity);
    
    // Přidání informací o dostupnosti
    const equipmentWithAvailability = {
      ...equipment,
      rented_quantity: rentedQuantity,
      available_stock: availableStock
    };
    
    res.status(200).json({
      equipment: equipmentWithAvailability
    });
  } catch (error) {
    console.error('Chyba při načítání vybavení:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání vybavení.' });
  }
};

// Vytvoření nové položky vybavení
exports.createEquipment = async (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  const { 
    name, 
    category_id, 
    inventory_number, 
    article_number,
    product_designation,
    purchase_price, 
    material_value,
    daily_rate, 
    monthly_rate,
    weight_per_piece,
    square_meters_per_piece,
    total_stock,
    total_square_meters,
    status, 
    location, 
    description,
    warehouse_id,
    // Nová pole pro externí vybavení
    is_external,
    supplier_id,
    external_rental_cost,
    rental_start_date,
    rental_end_date,
    external_reference,
    return_date,
    rental_status
  } = req.body;
  
  // Kontrola povinných polí
  if (!name) {
    return res.status(400).json({ message: 'Název vybavení je povinný.' });
  }
  
  if (!inventory_number) {
    return res.status(400).json({ message: 'Inventární číslo je povinné.' });
  }
  
  if (!daily_rate) {
    return res.status(400).json({ message: 'Denní sazba je povinná.' });
  }
  
  if (!warehouse_id) {
    return res.status(400).json({ message: 'Výběr skladu je povinný.' });
  }
  
  try {
    // Kontrola unikátního inventárního čísla
    const checkResult = await db.query(
      'SELECT * FROM equipment WHERE inventory_number = $1',
      [inventory_number]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'Inventární číslo již existuje.' });
    }
    
    // Zpracování nahrané fotografie
    let photo_url = null;
    if (req.file) {
      // Vytvoříme relativní cestu pro uloženou fotografii
      photo_url = `/uploads/${req.file.filename}`;
    }
    
    const result = await db.query(`
      INSERT INTO equipment (
        name, category_id, inventory_number, article_number, product_designation,
        purchase_price, material_value, daily_rate, monthly_rate, weight_per_piece,
        square_meters_per_piece, total_stock, total_square_meters, status, location, 
        description, photo_url, is_external, supplier_id, external_rental_cost,
        rental_start_date, rental_end_date, external_reference, return_date, rental_status,
        warehouse_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
              $18, $19, $20, $21, $22, $23, $24, $25, $26) 
      RETURNING *
    `, [
      name, 
      category_id, 
      inventory_number, 
      article_number || null,
      product_designation || null,
      purchase_price !== '' ? purchase_price : null, 
      material_value !== '' ? material_value : null,
      daily_rate, 
      monthly_rate !== '' ? monthly_rate : null,
      weight_per_piece !== '' ? weight_per_piece : null,
      square_meters_per_piece !== '' ? square_meters_per_piece : null,
      total_stock !== '' ? total_stock : null,
      total_square_meters !== '' ? total_square_meters : null,
      status || 'available', 
      location || null, 
      description || null, 
      photo_url,
      is_external === 'true' || is_external === true,
      supplier_id || null,
      external_rental_cost !== '' ? external_rental_cost : null,
      rental_start_date || null,
      rental_end_date || null,
      external_reference || null,
      return_date || null,
      rental_status || 'active',
      warehouse_id
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
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
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
    
    // Získání existujícího záznamu
    const existingEquipment = checkResult.rows[0];
    
    // Získání hodnot z těla požadavku s použitím existujících hodnot jako výchozích
    const name = req.body.name || existingEquipment.name;
    const category_id = req.body.category_id || existingEquipment.category_id;
    const inventory_number = req.body.inventory_number || existingEquipment.inventory_number;
    const article_number = req.body.article_number || existingEquipment.article_number;
    const product_designation = req.body.product_designation || existingEquipment.product_designation;
    const purchase_price = req.body.purchase_price || existingEquipment.purchase_price;
    const material_value = req.body.material_value || existingEquipment.material_value;
    const daily_rate = req.body.daily_rate || existingEquipment.daily_rate;
    const monthly_rate = req.body.monthly_rate || existingEquipment.monthly_rate;
    const weight_per_piece = req.body.weight_per_piece || existingEquipment.weight_per_piece;
    const square_meters_per_piece = req.body.square_meters_per_piece || existingEquipment.square_meters_per_piece;
    const total_stock = req.body.total_stock || existingEquipment.total_stock;
    const total_square_meters = req.body.total_square_meters || existingEquipment.total_square_meters;
    const status = req.body.status || existingEquipment.status;
    const location = req.body.location || existingEquipment.location;
    const description = req.body.description || existingEquipment.description;
    const warehouse_id = req.body.warehouse_id || existingEquipment.warehouse_id;
    
    // Nová pole pro externí vybavení
    const is_external = req.body.is_external !== undefined ? 
      (req.body.is_external === 'true' || req.body.is_external === true) : 
      existingEquipment.is_external;
    const supplier_id = req.body.supplier_id || existingEquipment.supplier_id;
    const external_rental_cost = req.body.external_rental_cost || existingEquipment.external_rental_cost;
    const rental_start_date = req.body.rental_start_date || existingEquipment.rental_start_date;
    const rental_end_date = req.body.rental_end_date || existingEquipment.rental_end_date;
    const external_reference = req.body.external_reference || existingEquipment.external_reference;
    const return_date = req.body.return_date || existingEquipment.return_date;
    const rental_status = req.body.rental_status || existingEquipment.rental_status || 'active';
    
    // Kontrola povinných polí
    if (!name) {
      return res.status(400).json({ message: 'Název vybavení je povinný.' });
    }
    
    if (!inventory_number) {
      return res.status(400).json({ message: 'Inventární číslo je povinné.' });
    }
    
    if (!daily_rate) {
      return res.status(400).json({ message: 'Denní sazba je povinná.' });
    }
    
    // Kontrola unikátního inventárního čísla (pokud se mění)
    if (inventory_number !== existingEquipment.inventory_number) {
      const inventoryCheck = await db.query(
        'SELECT * FROM equipment WHERE inventory_number = $1 AND id != $2',
        [inventory_number, id]
      );
      
      if (inventoryCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Inventární číslo již existuje.' });
      }
    }
    
    // Zpracování nahrané fotografie
    let photo_url = existingEquipment.photo_url;  // Zachování staré fotografie, pokud se nenahradí novou
    if (req.file) {
      // Vytvoříme relativní cestu pro uloženou fotografii
      photo_url = `/uploads/${req.file.filename}`;
      
      // Pokud existovala stará fotografie, můžeme ji smazat
      if (existingEquipment.photo_url) {
        const oldPhotoPath = path.join(__dirname, '..', existingEquipment.photo_url);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
    }
    
    // Pro ladění - vypíšeme, co budeme ukládat
    console.log('Data pro aktualizaci:', {
      name, category_id, inventory_number, article_number, product_designation,
      purchase_price, material_value, daily_rate, monthly_rate,
      weight_per_piece, square_meters_per_piece, total_stock, total_square_meters,
      status, location, description, photo_url, is_external, supplier_id,
      external_rental_cost, rental_start_date, rental_end_date, external_reference,
      return_date, rental_status, warehouse_id
    });
    
    const result = await db.query(`
      UPDATE equipment SET
        name = $1,
        category_id = $2,
        inventory_number = $3,
        article_number = $4,
        product_designation = $5,
        purchase_price = $6,
        material_value = $7,
        daily_rate = $8,
        monthly_rate = $9,
        weight_per_piece = $10,
        square_meters_per_piece = $11,
        total_stock = $12,
        total_square_meters = $13,
        status = $14,
        location = $15,
        description = $16,
        photo_url = $17,
        is_external = $18,
        supplier_id = $19,
        external_rental_cost = $20,
        rental_start_date = $21,
        rental_end_date = $22,
        external_reference = $23,
        return_date = $24,
        rental_status = $25,
        warehouse_id = $26,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $27
      RETURNING *
    `, [
      name, 
      category_id, 
      inventory_number, 
      article_number || null,
      product_designation || null,
      purchase_price !== '' ? purchase_price : null, 
      material_value !== '' ? material_value : null,
      daily_rate, 
      monthly_rate !== '' ? monthly_rate : null,
      weight_per_piece !== '' ? weight_per_piece : null,
      square_meters_per_piece !== '' ? square_meters_per_piece : null,
      total_stock !== '' ? total_stock : null,
      total_square_meters !== '' ? total_square_meters : null,
      status, 
      location || null, 
      description || null, 
      photo_url,
      is_external,
      supplier_id || null,
      external_rental_cost !== '' ? external_rental_cost : null,
      rental_start_date || null,
      rental_end_date || null,
      external_reference || null,
      return_date || null,
      rental_status,
      warehouse_id,
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
    
    // Pokud existuje fotografie, smažeme ji
    if (checkResult.rows[0].photo_url) {
      const photoPath = path.join(__dirname, '..', checkResult.rows[0].photo_url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
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

// Přesun vybavení mezi sklady
exports.transferEquipment = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { 
      equipment_id, 
      quantity, 
      source_warehouse_id,
      target_warehouse_id,
      notes 
    } = req.body;
    
    // Ověření vstupních dat
    if (!equipment_id || !quantity || !target_warehouse_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chybí povinné údaje. Vyplňte ID vybavení, množství a cílový sklad.' 
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Množství musí být větší než 0.' 
      });
    }
    
    if (source_warehouse_id === target_warehouse_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Zdrojový a cílový sklad musí být rozdílné.' 
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
    
    // Kontrola, zda je vybavení ve správném zdrojovém skladu
    if (source_warehouse_id && equipment.warehouse_id !== parseInt(source_warehouse_id)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Vybavení se nenachází v uvedeném zdrojovém skladu.' 
      });
    }
    
    if (equipment.available_stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: `Nedostatečné množství na skladě. K dispozici: ${equipment.available_stock} ks.` 
      });
    }
    
    // Kontrola existence cílového skladu
    const warehouseResult = await client.query('SELECT name FROM warehouses WHERE id = $1', [target_warehouse_id]);
    
    if (warehouseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Cílový sklad nebyl nalezen.' 
      });
    }
    
    // Nejprve zkontrolujeme, zda stejné vybavení již existuje v cílovém skladu
    const existingEquipmentResult = await client.query(
      `SELECT id, total_stock, available_stock 
       FROM equipment 
       WHERE inventory_number = $1 AND warehouse_id = $2`,
      [equipment.inventory_number, target_warehouse_id]
    );
    
    if (existingEquipmentResult.rows.length > 0) {
      // Pokud ano, pouze aktualizujeme jeho množství
      const existingEquipment = existingEquipmentResult.rows[0];
      
      // Aktualizace množství vybavení ve zdrojovém skladu
      await client.query(
        `UPDATE equipment 
         SET 
          total_stock = total_stock - $1,
          available_stock = available_stock - $1,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [quantity, equipment_id]
      );
      
      // Aktualizace množství vybavení v cílovém skladu
      await client.query(
        `UPDATE equipment 
         SET 
          total_stock = total_stock + $1,
          available_stock = available_stock + $1,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [quantity, existingEquipment.id]
      );
      
      // Zaznamenání přesunu
      await client.query(
        `INSERT INTO equipment_transfers (
          equipment_id, quantity, source_warehouse_id, target_warehouse_id, 
          notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          equipment_id, 
          quantity, 
          equipment.warehouse_id, 
          target_warehouse_id, 
          notes || null, 
          req.userId
        ]
      );
      
      // Potvrzení transakce
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Vybavení bylo úspěšně přesunuto.',
        transfer: {
          equipment_name: equipment.name,
          inventory_number: equipment.inventory_number,
          quantity,
          source_warehouse: equipment.warehouse_id,
          target_warehouse: target_warehouse_id
        }
      });
    } else {
      // Pokud ne, vytvoříme novou položku v cílovém skladu (duplikace záznamu)
      
      // Nejprve načteme všechny detaily původního vybavení
      const fullEquipmentResult = await client.query(
        'SELECT * FROM equipment WHERE id = $1',
        [equipment_id]
      );
      
      const fullEquipment = fullEquipmentResult.rows[0];
      
      // Aktualizace množství vybavení ve zdrojovém skladu
      await client.query(
        `UPDATE equipment 
         SET 
          total_stock = total_stock - $1,
          available_stock = available_stock - $1,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [quantity, equipment_id]
      );
      
      // Vytvoření nové položky vybavení v cílovém skladu
      const newEquipmentResult = await client.query(
        `INSERT INTO equipment (
          name, category_id, inventory_number, article_number, product_designation,
          purchase_price, material_value, daily_rate, monthly_rate, weight_per_piece,
          square_meters_per_piece, total_stock, total_square_meters, status, location, 
          description, photo_url, is_external, supplier_id, external_rental_cost,
          rental_start_date, rental_end_date, external_reference, return_date, rental_status,
          warehouse_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25, $26
        ) RETURNING id`,
        [
          fullEquipment.name,
          fullEquipment.category_id,
          fullEquipment.inventory_number,
          fullEquipment.article_number,
          fullEquipment.product_designation,
          fullEquipment.purchase_price,
          fullEquipment.material_value,
          fullEquipment.daily_rate,
          fullEquipment.monthly_rate,
          fullEquipment.weight_per_piece,
          fullEquipment.square_meters_per_piece,
          quantity,  // Nové množství
          fullEquipment.total_square_meters,
          fullEquipment.status,
          fullEquipment.location,
          fullEquipment.description,
          fullEquipment.photo_url,
          fullEquipment.is_external,
          fullEquipment.supplier_id,
          fullEquipment.external_rental_cost,
          fullEquipment.rental_start_date,
          fullEquipment.rental_end_date,
          fullEquipment.external_reference,
          fullEquipment.return_date,
          fullEquipment.rental_status,
          target_warehouse_id
        ]
      );
      
      // Zaznamenání přesunu
      await client.query(
        `INSERT INTO equipment_transfers (
          equipment_id, quantity, source_warehouse_id, target_warehouse_id, 
          target_equipment_id, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          equipment_id, 
          quantity, 
          equipment.warehouse_id, 
          target_warehouse_id, 
          newEquipmentResult.rows[0].id,
          notes || null, 
          req.userId
        ]
      );
      
      // Potvrzení transakce
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Vybavení bylo úspěšně přesunuto a vytvořeno v cílovém skladu.',
        transfer: {
          equipment_name: equipment.name,
          inventory_number: equipment.inventory_number,
          quantity,
          source_warehouse: equipment.warehouse_id,
          target_warehouse: target_warehouse_id,
          new_equipment_id: newEquipmentResult.rows[0].id
        }
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Chyba při přesunu vybavení:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Při přesunu vybavení došlo k chybě: ' + error.message 
    });
  } finally {
    client.release();
  }
};