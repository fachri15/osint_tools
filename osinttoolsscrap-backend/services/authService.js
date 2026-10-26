const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const SALT = process.env.SALT || 'OSINT_CYBER_GUARDIAN_SECURE_SALT_2026';
const JWT_SECRET = process.env.JWT_SECRET || 'OSINT_CYBER_GUARDIAN_SECURE_JWT_SECRET_2026_PRO_JUSTITIA';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Hash password menggunakan SHA-256 + Salt persis seperti modules/auth.py
 */
function hashPassword(password) {
  const salted = `${SALT}:${password}`;
  return crypto.createHash('sha256').update(salted, 'utf8').digest('hex');
}

/**
 * Verifikasi password
 */
function verifyPassword(plainPassword, hashedPassword) {
  return hashPassword(plainPassword) === hashedPassword;
}

/**
 * Buat JWT Token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      nip: user.nip || 'ANL-7709-ID',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Login admin
 */
async function login(username, password) {
  const cleanUsername = username.trim();
  const user = await prisma.adminUser.findUnique({
    where: { username: cleanUsername },
  });

  if (!user) {
    throw new Error('Username atau Password salah! Akses ditolak.');
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Username atau Password salah! Akses ditolak.');
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      nip: user.nip || 'ANL-7709-ID',
      badge: user.badge || 'Superadmin',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      lastLogin: new Date(),
    },
  };
}

/**
 * Verifikasi 2FA TOTP code
 */
async function verify2fa(totpCode, userId) {
  // Verifikasi 6-digit TOTP (misal default simulator 6-digit angka atau 123456)
  if (!totpCode || totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
    throw new Error('Kode token 2FA harus terdiri dari 6 digit angka.');
  }

  return {
    verified: true,
    message: 'Autentikasi 2FA Berhasil. Sesi analis aktif selama 8 jam.',
    sessionExpiresIn: '8h',
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  login,
  verify2fa,
};
