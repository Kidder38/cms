const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Middleware pro ochranu cest - pouze admin má pYístup ke správ u~ivatelo
router.use(verifyToken, isAdmin);

// Základní CRUD operace pro u~ivatele
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Zmna hesla
router.post('/:id/change-password', userController.changePassword);

// Správa pYístupu k zákazníkom
router.get('/:id/customers', userController.getUserCustomers);
router.post('/:id/customer-access', userController.addCustomerAccess);
router.put('/:id/customer-access', userController.updateCustomerAccess);
router.delete('/:id/customer-access', userController.removeCustomerAccess);

// Správa pYístupu k zakázkám
router.get('/:id/orders', userController.getUserOrders);
router.post('/:id/order-access', userController.addOrderAccess);
router.put('/:id/order-access', userController.updateOrderAccess);
router.delete('/:id/order-access', userController.removeOrderAccess);

module.exports = router;