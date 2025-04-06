const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Všechny routy v tomto souboru vyžadují autentizaci
router.use(verifyToken);

// Získání všech inventur
router.get('/', inventoryController.getAllInventoryChecks);

// Získání detailu inventury podle ID
router.get('/:id', inventoryController.getInventoryCheckById);

// Vytvoření nové inventury - vyžaduje admin práva
router.post('/', isAdmin, inventoryController.createInventoryCheck);

// Aktualizace položky inventury
router.put('/:id/items/:itemId', inventoryController.updateInventoryCheckItem);

// Dokončení inventury - vyžaduje admin práva
router.put('/:id/complete', isAdmin, inventoryController.completeInventoryCheck);

// Zrušení inventury - vyžaduje admin práva
router.put('/:id/cancel', isAdmin, inventoryController.cancelInventoryCheck);

module.exports = router;