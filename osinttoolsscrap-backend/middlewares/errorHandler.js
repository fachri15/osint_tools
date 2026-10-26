/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]:', err);

  // Prisma Unique Constraint Error (P2002)
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target) : 'field';
    return res.status(409).json({
      success: false,
      message: `Konflik data: Nilai unik untuk ${fields} sudah terdaftar di sistem.`,
      error: err.code,
    });
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data yang diminta tidak ditemukan.',
      error: err.code,
    });
  }

  // Prisma Connection Error (P1001)
  if (err.code === 'P1001') {
    return res.status(503).json({
      success: false,
      message: 'Gagal terhubung ke database MySQL. Pastikan server MySQL berjalan dan kredensial di .env sesuai.',
      error: err.code,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
