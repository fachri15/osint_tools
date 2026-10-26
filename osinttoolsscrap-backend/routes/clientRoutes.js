const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateAdmin } = require('../middlewares/auth');

// Public or protected based on admin token
router.get('/', clientController.getClients);
router.post('/verify-dukcapil', clientController.verifyDukcapil);
router.get('/:id', clientController.getClientById);
router.get('/:id/timeline', clientController.getClientTimeline);

// Modifying data requires admin authentication
router.post('/', authenticateAdmin, clientController.createClient);
router.put('/:id', authenticateAdmin, clientController.updateClient);
router.delete('/:id', authenticateAdmin, clientController.deleteClient);

module.exports = router;
