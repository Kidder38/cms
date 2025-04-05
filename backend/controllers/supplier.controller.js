const db = require('../config/db.config');
const supplierModel = require('../models/supplier.model');

// Získání všech dodavatelů
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await supplierModel.findAll();
    
    res.status(200).json({
      count: suppliers.length,
      suppliers: suppliers
    });
  } catch (error) {
    console.error('Chyba při načítání dodavatelů:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání dodavatelů.' });
  }
};

// Získání jednoho dodavatele podle ID
exports.getSupplierById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const supplier = await supplierModel.findById(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Dodavatel nenalezen.' });
    }
    
    res.status(200).json({
      supplier: supplier
    });
  } catch (error) {
    console.error('Chyba při načítání dodavatele:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání dodavatele.' });
  }
};

// Vytvoření nového dodavatele
exports.createSupplier = async (req, res) => {
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
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Název dodavatele je povinný.' });
  }
  
  try {
    const newSupplier = await supplierModel.create({
      name,
      contact_person,
      email,
      phone,
      address,
      ico,
      dic,
      bank_account,
      notes
    });
    
    res.status(201).json({
      message: 'Dodavatel byl úspěšně vytvořen.',
      supplier: newSupplier
    });
  } catch (error) {
    console.error('Chyba při vytváření dodavatele:', error);
    res.status(500).json({ message: 'Chyba serveru při vytváření dodavatele.' });
  }
};

// Aktualizace dodavatele
exports.updateSupplier = async (req, res) => {
  const { id } = req.params;
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
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Název dodavatele je povinný.' });
  }
  
  try {
    // Kontrola existence dodavatele
    const supplier = await supplierModel.findById(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Dodavatel nenalezen.' });
    }
    
    const updatedSupplier = await supplierModel.update(id, {
      name,
      contact_person,
      email,
      phone,
      address,
      ico,
      dic,
      bank_account,
      notes
    });
    
    res.status(200).json({
      message: 'Dodavatel byl úspěšně aktualizován.',
      supplier: updatedSupplier
    });
  } catch (error) {
    console.error('Chyba při aktualizaci dodavatele:', error);
    res.status(500).json({ message: 'Chyba serveru při aktualizaci dodavatele.' });
  }
};

// Smazání dodavatele
exports.deleteSupplier = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence dodavatele
    const supplier = await supplierModel.findById(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Dodavatel nenalezen.' });
    }
    
    try {
      await supplierModel.delete(id);
      
      res.status(200).json({
        message: 'Dodavatel byl úspěšně smazán.'
      });
    } catch (error) {
      if (error.message.includes('nelze smazat')) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Chyba při mazání dodavatele:', error);
    res.status(500).json({ message: 'Chyba serveru při mazání dodavatele.' });
  }
};

// Získání vybavení od dodavatele
exports.getSupplierEquipment = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kontrola existence dodavatele
    const supplier = await supplierModel.findById(id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Dodavatel nenalezen.' });
    }
    
    const equipment = await supplierModel.getEquipment(id);
    
    res.status(200).json({
      count: equipment.length,
      equipment: equipment
    });
  } catch (error) {
    console.error('Chyba při načítání vybavení dodavatele:', error);
    res.status(500).json({ message: 'Chyba serveru při načítání vybavení dodavatele.' });
  }
};