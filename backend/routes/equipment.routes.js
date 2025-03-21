const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Veřejné routy
router.get('/', equipmentController.getAllEquipment);
router.get('/:id', equipmentController.getEquipmentById);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, equipmentController.createEquipment);
router.put('/:id', verifyToken, isAdmin, equipmentController.updateEquipment);
router.delete('/:id', verifyToken, isAdmin, equipmentController.deleteEquipment);

module.exports = router;