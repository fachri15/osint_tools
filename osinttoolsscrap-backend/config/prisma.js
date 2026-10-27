const { execSync } = require('child_process');
const path = require('path');

let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (err) {
  console.log('⚠️ @prisma/client belum ter-generate. Menjalankan npx prisma generate otomatis...');
  try {
    const backendRoot = path.resolve(__dirname, '..');
    execSync('npx prisma generate', { cwd: backendRoot, stdio: 'inherit', env: process.env });
    PrismaClient = require('@prisma/client').PrismaClient;
  } catch (execErr) {
    console.error('❌ Gagal npx prisma generate otomatis:', execErr.message);
  }
}

let prisma;

function initClient() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return new PrismaClient();
    } else {
      if (!global.prisma) {
        global.prisma = new PrismaClient({
          log: ['warn', 'error'],
        });
      }
      return global.prisma;
    }
  } catch (error) {
    console.log('⚠️ PrismaClient init error, mencoba auto-generate prisma schema...', error.message);
    try {
      const backendRoot = path.resolve(__dirname, '..');
      execSync('npx prisma generate', { cwd: backendRoot, stdio: 'inherit', env: process.env });
      // Clear require cache dan coba inisialisasi ulang
      Object.keys(require.cache).forEach((key) => {
        if (key.includes('@prisma/client') || key.includes('.prisma')) {
          delete require.cache[key];
        }
      });
      const FreshClient = require('@prisma/client').PrismaClient;
      return new FreshClient();
    } catch (e) {
      console.error('❌ Gagal inisialisasi Prisma:', e.message);
      // Fallback dummy object agar app tidak crash 503 saat booting
      return new Proxy({}, {
        get: () => () => Promise.reject(new Error('Prisma client belum ter-generate. Jalankan npx prisma generate.'))
      });
    }
  }
}

prisma = initClient();

module.exports = prisma;
