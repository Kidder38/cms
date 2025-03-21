const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Veřejné routy
router.post('/register', authController.register);
router.post('/login', authController.login);

// Chráněné routy
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;