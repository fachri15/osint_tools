const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticateAdmin } = require('../middlewares/auth');

router.get('/', auditLogController.getLogs);
router.post('/', authenticateAdmin, auditLogController.createLog);

module.exports = router;
