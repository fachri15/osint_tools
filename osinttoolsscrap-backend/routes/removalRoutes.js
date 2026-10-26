const express = require('express');
const router = express.Router();
const removalController = require('../controllers/removalController');
const { authenticateAdmin } = require('../middlewares/auth');

router.get('/', removalController.getCases);
router.post('/live-check', removalController.runLiveCheck);
router.post('/generate-legal', removalController.generateLegal);
router.get('/:id', removalController.getCaseDetail);

// Modifikasi data removal
router.post('/', authenticateAdmin, removalController.createCase);
router.put('/:id/status', authenticateAdmin, removalController.updateStatus);

module.exports = router;
