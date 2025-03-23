const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/import.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Konfigurace multer pro zpracování souborů v paměti
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit 5MB
  }
});

// Route pro import Excel souboru s vybavením
router.post('/equipment/excel', verifyToken, isAdmin, upload.single('file'), importController.importEquipment);

// Route pro stažení vzorového Excel souboru
router.get('/equipment/excel/template', verifyToken, importController.getSampleExcelTemplate);

module.exports = router;