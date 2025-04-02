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
    
    // Získání vybavení s kategoriemi
    const equipmentResult = await db.query(`
      SELECT e.*, c.name as category_name 
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
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
      SELECT e.*, c.name as category_name 
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
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
    description
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
        description, photo_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *
    `, [
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
      status, location, description, photo_url
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *
    `, [
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