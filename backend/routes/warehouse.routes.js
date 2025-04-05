const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// GET /api/warehouses - Získání všech skladů
router.get('/', verifyToken, warehouseController.getAllWarehouses);

// GET /api/warehouses/:id - Získání konkrétního skladu
router.get('/:id', verifyToken, warehouseController.getWarehouseById);

// GET /api/warehouses/:id/equipment - Získání vybavení z konkrétního skladu
router.get('/:id/equipment', verifyToken, warehouseController.getWarehouseEquipment);

// POST /api/warehouses - Vytvoření nového skladu
router.post('/', verifyToken, isAdmin, warehouseController.createWarehouse);

// PUT /api/warehouses/:id - Aktualizace skladu
router.put('/:id', verifyToken, isAdmin, warehouseController.updateWarehouse);

// DELETE /api/warehouses/:id - Smazání skladu
router.delete('/:id', verifyToken, isAdmin, warehouseController.deleteWarehouse);

module.exports = router;