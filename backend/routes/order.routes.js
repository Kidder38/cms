const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Veřejné routy
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, orderController.createOrder);
router.put('/:id', verifyToken, isAdmin, orderController.updateOrder);
router.delete('/:id', verifyToken, isAdmin, orderController.deleteOrder);

// Přidání výpůjčky k zakázce
router.post('/:order_id/rentals', verifyToken, isAdmin, orderController.addRental);

module.exports = router;