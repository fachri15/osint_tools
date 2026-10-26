const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const clientRoutes = require('./clientRoutes');
const scanRoutes = require('./scanRoutes');
const dcRoutes = require('./dcRoutes');
const removalRoutes = require('./removalRoutes');
const policeReportRoutes = require('./policeReportRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const settingsRoutes = require('./settingsRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/scans', scanRoutes);
router.use('/dc', dcRoutes);
router.use('/removals', removalRoutes);
router.use('/reports', policeReportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
