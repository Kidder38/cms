const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const rentalController = require('../controllers/rental.controller');
const returnController = require('../controllers/return.controller');
const documentController = require('../controllers/document.controller');
const { verifyToken, isAdmin, hasOrderAccess, hasWriteAccess } = require('../middleware/auth.middleware');

// Základní routy pro zakázky
router.get('/', verifyToken, orderController.getAllOrders);
router.get('/:id', verifyToken, hasOrderAccess, orderController.getOrderById);
router.post('/', verifyToken, isAdmin, orderController.createOrder);
router.put('/:id', verifyToken, hasOrderAccess, hasWriteAccess, orderController.updateOrder);
router.delete('/:id', verifyToken, isAdmin, orderController.deleteOrder);

// Routy pro výpůjčky
router.get('/:order_id/rentals', verifyToken, hasOrderAccess, rentalController.getRentalsByOrder);
router.post('/:order_id/rentals', verifyToken, hasOrderAccess, hasWriteAccess, rentalController.addRental);
router.put('/:order_id/rentals/:rental_id', verifyToken, hasOrderAccess, hasWriteAccess, rentalController.updateRental);

// Routy pro hromadné výpůjčky - přidáno verifyToken middleware
router.get('/batch-rentals/:batch_id', verifyToken, rentalController.getRentalsByBatch);
router.get('/batch-rentals/:batch_id/delivery-note', verifyToken, documentController.generateBatchDeliveryNote);

// Routy pro vratky - přidáno verifyToken middleware kde chybělo
router.post('/:order_id/rentals/:rental_id/return', verifyToken, isAdmin, returnController.returnRental);
router.get('/:order_id/returns', verifyToken, returnController.getReturnsByOrder);
router.get('/batch-returns/:batch_id', verifyToken, returnController.getReturnsByBatch);
router.get('/batch-returns/:batch_id/delivery-note', verifyToken, documentController.generateBatchReturnNote);

// Routy pro fakturační podklady - přidáno verifyToken middleware
router.post('/:order_id/billing-data', verifyToken, isAdmin, documentController.generateBillingData);
router.get('/:order_id/billing-data', verifyToken, documentController.getBillingDataByOrder);
router.get('/:order_id/billing-data/:billing_id', verifyToken, documentController.getBillingDataById);

// Dodací list zakázky
router.get('/:order_id/delivery-note', documentController.getOrderDeliveryNote);

module.exports = router;