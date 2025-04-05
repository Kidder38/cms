const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// GET /api/suppliers - Získání všech dodavatelů
router.get('/', verifyToken, supplierController.getAllSuppliers);

// GET /api/suppliers/:id - Získání konkrétního dodavatele
router.get('/:id', verifyToken, supplierController.getSupplierById);

// GET /api/suppliers/:id/equipment - Získání vybavení od konkrétního dodavatele
router.get('/:id/equipment', verifyToken, supplierController.getSupplierEquipment);

// POST /api/suppliers - Vytvoření nového dodavatele
router.post('/', verifyToken, isAdmin, supplierController.createSupplier);

// PUT /api/suppliers/:id - Aktualizace dodavatele
router.put('/:id', verifyToken, isAdmin, supplierController.updateSupplier);

// DELETE /api/suppliers/:id - Smazání dodavatele
router.delete('/:id', verifyToken, isAdmin, supplierController.deleteSupplier);

module.exports = router;