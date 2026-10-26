const express = require('express');
const router = express.Router();
const dcController = require('../controllers/dcController');

router.post('/analyze', dcController.analyzeDc);
router.get('/', dcController.getDcHistory);

// Truecaller routes (harus sebelum /:id)
router.post('/truecaller/lookup', dcController.truecallerLookup);
router.get('/truecaller/info', dcController.getTruecallerInfo);
router.post('/truecaller/token', dcController.saveTruecallerToken);
router.post('/truecaller/callback', dcController.handleTruecallerCallback);
router.get('/truecaller/callback', dcController.handleTruecallerCallback);

router.get('/:id', dcController.getDcDetail);

module.exports = router;
