const express = require('express');
const router = express.Router();
const writeOffController = require('../controllers/write-off.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Všechny routy v tomto souboru vyžadují autentizaci
router.use(verifyToken);

// Získání všech odpisů - jen pro adminy
router.get('/', isAdmin, writeOffController.getAllWriteOffs);

// Získání detailu odpisu podle ID
router.get('/:id', writeOffController.getWriteOffById);

// Vytvoření nového odpisu
router.post('/', writeOffController.createWriteOff);

// Smazání odpisu - vyžaduje admin práva
router.delete('/:id', isAdmin, writeOffController.deleteWriteOff);

module.exports = router;