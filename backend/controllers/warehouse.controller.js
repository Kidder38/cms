const db = require('../config/db.config');
const warehouseModel = require('../models/warehouse.model');

// Získání všech skladů
exports.getAllWarehouses = async (req, res) => {
  try {
    // Zpracování parametru query pro filtrování externích skladů
    const external = req.query.external === 'true';
    
    const warehouses = await warehouseModel.findAll(external);
    
    res.status(200).json({
      count: warehouses.length,
      warehouses: warehouses
    });
  } catch (error) {
    console.error('Chyba při načítání skladů:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání skladů.' });
  }
};

// Získání jednoho skladu podle ID
exports.getWarehouseById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const warehouse = await warehouseModel.findById(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Sklad nenalezen.' });
    }
    
    res.status(200).json({
      warehouse: warehouse
    });
  } catch (error) {
    console.error('Chyba při načítání skladu:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání skladu.' });
  }
};

// Vytvoření nového skladu
exports.createWarehouse = async (req, res) => {
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
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Název skladu je povinný.' });
  }
  
  try {
    const newWarehouse = await warehouseModel.create({
      name,
      description,
      is_external: is_external === 'true' || is_external === true,
      supplier_id: is_external ? supplier_id : null,
      location,
      contact_person,
      phone,
      email,
      notes
    });
    
    res.status(201).json({
      message: 'Sklad byl úspěšně vytvořen.',
      warehouse: newWarehouse
    });
  } catch (error) {
    console.error('Chyba při vytváření skladu:', error);
    res.status(500).json({ message: 'Chyba serveru při vytváření skladu.' });
  }
};

// Aktualizace skladu
exports.updateWarehouse = async (req, res) => {
  const { id } = req.params;
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
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Název skladu je povinný.' });
  }
  
  try {
    // Kontrola existence skladu
    const warehouse = await warehouseModel.findById(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Sklad nenalezen.' });
    }
    
    const updatedWarehouse = await warehouseModel.update(id, {
      name,
      description,
      is_external: is_external === 'true' || is_external === true,
      supplier_id: is_external === 'true' || is_external === true ? supplier_id : null,
      location,
      contact_person,
      phone,
      email,
      notes
    });
    
    res.status(200).json({
      message: 'Sklad byl úspěšně aktualizován.',
      warehouse: updatedWarehouse
    });
  } catch (error) {
    console.error('Chyba při aktualizaci skladu:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci skladu.' });
  }
};

// Smazání skladu
exports.deleteWarehouse = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence skladu
    const warehouse = await warehouseModel.findById(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Sklad nenalezen.' });
    }
    
    try {
      await warehouseModel.delete(id);
      
      res.status(200).json({
        message: 'Sklad byl úspěšně smazán.'
      });
    } catch (error) {
      if (error.message.includes('nelze smazat')) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Chyba při mazání skladu:', error);
    res.status(500).json({ message: 'Chyba serveru při mazání skladu.' });
  }
};

// Získání vybavení ze skladu
exports.getWarehouseEquipment = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence skladu
    const warehouse = await warehouseModel.findById(id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Sklad nenalezen.' });
    }
    
    const equipment = await warehouseModel.getEquipment(id);
    
    // Pro každou položku vybavení vypočítáme dostupné množství
    const equipmentWithAvailability = await Promise.all(equipment.map(async (item) => {
      // Získání informací o pronajatém množství
      const rentedResult = await db.query(`
        SELECT COALESCE(SUM(quantity), 0) as rented_quantity
        FROM rentals
        WHERE equipment_id = $1 AND status IN ('created', 'issued') AND actual_return_date IS NULL
      `, [item.id]);
      
      const rentedQuantity = parseInt(rentedResult.rows[0]?.rented_quantity || 0);
      const totalStock = parseInt(item.total_stock || 0);
      const availableStock = Math.max(0, totalStock - rentedQuantity);
      
      return {
        ...item,
        rented_quantity: rentedQuantity,
        available_stock: availableStock
      };
    }));
    
    res.status(200).json({
      count: equipmentWithAvailability.length,
      equipment: equipmentWithAvailability
    });
  } catch (error) {
    console.error('Chyba při načítání vybavení skladu:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání vybavení skladu.' });
  }
};