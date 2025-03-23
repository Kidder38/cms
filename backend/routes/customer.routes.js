const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Veřejné routy
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, customerController.createCustomer);
router.put('/:id', verifyToken, isAdmin, customerController.updateCustomer);
router.delete('/:id', verifyToken, isAdmin, customerController.deleteCustomer);

module.exports = router;