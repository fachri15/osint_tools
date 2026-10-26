const express = require('express');
const router = express.Router();
const policeReportController = require('../controllers/policeReportController');
const { authenticateAdmin } = require('../middlewares/auth');

router.get('/', policeReportController.getReports);
router.get('/:id', policeReportController.getReportDetail);
router.post('/', authenticateAdmin, policeReportController.createReport);
router.delete('/:id', authenticateAdmin, policeReportController.deleteReport);

module.exports = router;
