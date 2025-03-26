const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const rentalController = require('../controllers/rental.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Veřejné routy
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, orderController.createOrder);
router.put('/:id', verifyToken, isAdmin, orderController.updateOrder);
router.delete('/:id', verifyToken, isAdmin, orderController.deleteOrder);

// Routy pro výpůjčky
router.get('/:order_id/rentals', verifyToken, rentalController.getRentalsByOrder);
router.post('/:order_id/rentals', verifyToken, isAdmin, rentalController.addRental);
router.put('/:order_id/rentals/:rental_id', verifyToken, isAdmin, rentalController.updateRental);
router.post('/:order_id/rentals/:rental_id/return', verifyToken, isAdmin, rentalController.returnRental);

// Routy pro dodací listy
router.get('/:order_id/delivery-note', verifyToken, rentalController.generateDeliveryNote);
router.post('/:order_id/delivery-note', verifyToken, isAdmin, rentalController.saveDeliveryNote);

// Routy pro fakturační podklady
router.post('/:order_id/billing-data', verifyToken, isAdmin, rentalController.generateBillingData);
router.get('/:order_id/billing-data', verifyToken, rentalController.getBillingDataByOrder);
router.get('/:order_id/billing-data/:billing_id', verifyToken, rentalController.getBillingDataById);

// Routy pro dodací listy výpůjček a vratek
router.get('/rentals/:rental_id/delivery-note', verifyToken, rentalController.generateRentalDeliveryNote);
router.get('/returns/:return_id/delivery-note', verifyToken, rentalController.generateReturnDeliveryNote);

module.exports = router;