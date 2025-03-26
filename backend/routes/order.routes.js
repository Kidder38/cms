const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const rentalController = require('../controllers/rental.controller');
const returnController = require('../controllers/return.controller');
const documentController = require('../controllers/document.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Základní routy pro zakázky
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', verifyToken, isAdmin, orderController.createOrder);
router.put('/:id', verifyToken, isAdmin, orderController.updateOrder);
router.delete('/:id', verifyToken, isAdmin, orderController.deleteOrder);

// Routy pro výpůjčky
router.get('/:order_id/rentals', verifyToken, rentalController.getRentalsByOrder);
router.post('/:order_id/rentals', verifyToken, isAdmin, rentalController.addRental);
router.put('/:order_id/rentals/:rental_id', verifyToken, isAdmin, rentalController.updateRental);

// Routy pro hromadné výpůjčky
router.get('/batch-rentals/:batch_id', verifyToken, rentalController.getRentalsByBatch);

// Routy pro vratky
router.post('/:order_id/rentals/:rental_id/return', verifyToken, isAdmin, returnController.returnRental);
router.get('/:order_id/returns', verifyToken, returnController.getReturnsByOrder);
router.get('/batch-returns/:batch_id', verifyToken, returnController.getReturnsByBatch);

// Routy pro hromadné dodací listy
router.get('/batch-rentals/:batch_id/delivery-note', verifyToken, documentController.generateBatchDeliveryNote);
router.get('/batch-returns/:batch_id/delivery-note', verifyToken, documentController.generateBatchReturnNote);

// Routy pro fakturační podklady
router.post('/:order_id/billing-data', verifyToken, isAdmin, documentController.generateBillingData);
router.get('/:order_id/billing-data', verifyToken, documentController.getBillingDataByOrder);
router.get('/:order_id/billing-data/:billing_id', verifyToken, documentController.getBillingDataById);

module.exports = router;