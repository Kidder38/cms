const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken, isAdmin, hasCustomerAccess } = require('../middleware/auth.middleware');

// Chráněné routy pro všechny přihlášené uživatele
router.get('/', verifyToken, customerController.getAllCustomers);
router.get('/:id', verifyToken, hasCustomerAccess, customerController.getCustomerById);
router.get('/:id/orders', verifyToken, hasCustomerAccess, customerController.getCustomerOrders);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, customerController.createCustomer);
router.put('/:id', verifyToken, isAdmin, customerController.updateCustomer);
router.delete('/:id', verifyToken, isAdmin, customerController.deleteCustomer);

module.exports = router;