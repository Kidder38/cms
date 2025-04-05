const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Routy pro přístup ke kategoriím (jen pro administrátory)
router.get('/', verifyToken, isAdmin, categoryController.getAllCategories);
router.get('/:id', verifyToken, isAdmin, categoryController.getCategoryById);

// Chráněné routy (jen pro administrátory)
router.post('/', verifyToken, isAdmin, categoryController.createCategory);
router.put('/:id', verifyToken, isAdmin, categoryController.updateCategory);
router.delete('/:id', verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;