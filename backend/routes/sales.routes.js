const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Všechny routy v tomto souboru vyžadují autentizaci
router.use(verifyToken);

// Získání všech prodejů zákazníka - DŮLEŽITÉ: specifičtější routy musí být před obecnějšími
router.get('/customer/:customerId', salesController.getCustomerSales);

// Získání všech prodejů - jen pro adminy
router.get('/', isAdmin, salesController.getAllSales);

// Získání detailu prodeje podle ID
router.get('/:id', salesController.getSaleById);

// Vytvoření nového prodeje
router.post('/', salesController.createSale);

// Aktualizace prodeje - vyžaduje admin práva
router.put('/:id', isAdmin, salesController.updateSale);

// Smazání prodeje - vyžaduje admin práva
router.delete('/:id', isAdmin, salesController.deleteSale);

module.exports = router;