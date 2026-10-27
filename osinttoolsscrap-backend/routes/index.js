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

// Endpoint Darurat Setup & Migrasi Database cPanel (Tanpa Terminal)
const { execSync } = require('child_process');
router.get('/setup-database-init', (req, res) => {
  const secretKey = req.query.key;
  const validSecret = process.env.JWT_SECRET || 'mfcPD1bioDhQnqgZigI4ZvZN5K9qLtkt0Ck2gNNsi7W';
  
  if (!secretKey || secretKey !== validSecret) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Parameter ?key= tidak valid.'
    });
  }

  try {
    const logs = [];
    logs.push('1. Menjalankan: npx prisma generate');
    execSync('npx prisma generate', { env: process.env });

    logs.push('2. Menjalankan: npx prisma db push --accept-data-loss');
    execSync('npx prisma db push --accept-data-loss', { env: process.env });

    logs.push('3. Menjalankan: node prisma/seed.js');
    execSync('node prisma/seed.js', { env: process.env });

    logs.push('4. Database & Seed Berhasil Diinisialisasi 100%!');

    return res.json({
      success: true,
      message: 'Database berhasil di-migrate dan di-seed!',
      logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menjalankan setup database',
      error: error.message,
      stderr: error.stderr ? error.stderr.toString() : null
    });
  }
});

module.exports = router;
