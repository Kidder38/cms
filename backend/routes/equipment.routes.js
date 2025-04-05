const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Routy pro přístup k vybavení (jen pro administrátory)
router.get('/', verifyToken, isAdmin, equipmentController.getAllEquipment);
router.get('/:id', verifyToken, isAdmin, equipmentController.getEquipmentById);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, equipmentController.uploadPhoto, equipmentController.createEquipment);
router.put('/:id', verifyToken, isAdmin, equipmentController.uploadPhoto, equipmentController.updateEquipment);
router.delete('/:id', verifyToken, isAdmin, equipmentController.deleteEquipment);

module.exports = router;