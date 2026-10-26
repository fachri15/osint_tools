const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'OSINT_CYBER_GUARDIAN_SECURE_JWT_SECRET_2026_PRO_JUSTITIA';

/**
 * Middleware untuk verifikasi JWT Token Admin Internal
 */
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token autentikasi tidak ditemukan. Harap login terlebih dahulu.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Cari user di database jika tersedia
    try {
      const user = await prisma.adminUser.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          nip: true,
          badge: true,
          avatar: true,
          lastLogin: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User sesi tidak ditemukan atau telah dihapus.',
        });
      }

      req.user = user;
    } catch (dbErr) {
      // Fallback jika database belum migrasi/offline sementara
      req.user = {
        id: decoded.id,
        username: decoded.username,
        fullName: decoded.fullName || 'Administrator Utama',
        role: decoded.role || 'superadmin',
        nip: decoded.nip || 'ANL-7709-ID',
      };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi token telah kedaluwarsa. Silakan login kembali.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token otentikasi tidak valid.',
    });
  }
}

/**
 * Middleware Role-based Authorization
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Belum terautentikasi.' });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Akses dilarang: Peran Anda tidak memiliki izin untuk aksi ini.',
      });
    }
    next();
  };
}

module.exports = {
  authenticateAdmin,
  requireRole,
};
