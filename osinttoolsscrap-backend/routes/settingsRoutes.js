const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateAdmin } = require('../middlewares/auth');

router.get('/', settingsController.getSettings);
router.post('/test-connection', settingsController.testConnection);
router.post('/', authenticateAdmin, settingsController.saveSettings);

module.exports = router;
