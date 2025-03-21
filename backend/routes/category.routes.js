const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Veřejné routy
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, categoryController.createCategory);
router.put('/:id', verifyToken, isAdmin, categoryController.updateCategory);
router.delete('/:id', verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;