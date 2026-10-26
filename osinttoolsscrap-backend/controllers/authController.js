const authService = require('../services/authService');

/**
 * Handler POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan Password wajib diisi!',
      });
    }

    const result = await authService.login(username, password);
    res.json({
      success: true,
      message: 'Login berhasil.',
      ...result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login gagal.',
    });
  }
}

/**
 * Handler GET /api/auth/me
 */
async function getProfile(req, res, next) {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handler POST /api/auth/verify-2fa
 */
async function verify2fa(req, res, next) {
  try {
    const { totp } = req.body;
    const result = await authService.verify2fa(totp, req.user?.id);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  login,
  getProfile,
  verify2fa,
};
