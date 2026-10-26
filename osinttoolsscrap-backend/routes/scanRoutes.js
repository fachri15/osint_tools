const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { authenticateAdmin } = require('../middlewares/auth');

router.post('/run', scanController.runScan);
router.post('/bulk', authenticateAdmin, scanController.runBulkScan);
router.post('/export-pdf', scanController.exportPdfReport);

// HIBP API v3 Endpoints (Dokumentasi Resmi HIBP v3)
// 1. https://haveibeenpwned.com/API/v3#AllBreaches
router.get('/hibp/breaches', scanController.getAllBreachesHandler);
// 2. https://haveibeenpwned.com/API/v3#SingleBreach
router.get('/hibp/breaches/:name', scanController.getSingleBreachHandler);
// 3. https://haveibeenpwned.com/API/v3#AllDataClasses
router.get('/hibp/dataclasses', scanController.getAllDataClassesHandler);
// 4. https://haveibeenpwned.com/API/v3#BreachesForAccount
router.get('/hibp', scanController.checkHibpBreaches);
router.post('/hibp', scanController.checkHibpBreaches);

// 5. Arsip Sumber Kebocoran Nasional (NIK & KK)
router.get('/national-leaks', scanController.getNationalLeaksHandler);

router.get('/', scanController.getScanHistory);
router.get('/:id', scanController.getScanDetail);

module.exports = router;
