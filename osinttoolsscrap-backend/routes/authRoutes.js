const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateAdmin } = require('../middlewares/auth');

router.post('/login', authController.login);
router.get('/me', authenticateAdmin, authController.getProfile);
router.post('/verify-2fa', authenticateAdmin, authController.verify2fa);

module.exports = router;
