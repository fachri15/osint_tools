const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purgeDummyData() {
  console.log('==================================================');
  console.log('🧹 Purging All Dummy Data from MySQL Database');
  console.log('==================================================');

  try {
    // 1. Hapus tabel relasional bertingkat
    console.log('🗑️ Menghapus data Removal Logs & Cases...');
    await prisma.removalLog.deleteMany({});
    await prisma.removalCase.deleteMany({});
    await prisma.removalRequest.deleteMany({});

    console.log('🗑️ Menghapus data Laporan Polisi & BAP...');
    await prisma.policeReport.deleteMany({});

    console.log('🗑️ Menghapus data Investigasi DC...');
    await prisma.dcInvestigation.deleteMany({});

    console.log('🗑️ Menghapus data Riwayat Scan OSINT...');
    await prisma.scanHistory.deleteMany({});

    console.log('🗑️ Menghapus data Klien...');
    await prisma.client.deleteMany({});

    console.log('🗑️ Menghapus data Audit Logs dummy...');
    await prisma.auditLog.deleteMany({});

    // 2. Buat satu audit log inisialisasi sistem bersih
    const adminUser = await prisma.adminUser.findUnique({ where: { username: 'admin' } });
    await prisma.auditLog.create({
      data: {
        logCode: 'LOG-INIT-001',
        module: 'SISTEM',
        actor: adminUser?.fullName || 'Administrator Utama',
        action: 'Inisialisasi Sistem Database Bersih',
        target: 'osint_tools (MySQL)',
        result: 'Basis data bersih siap menerima data klien & investigasi real',
        hash: 'sha256:0000000000000000',
        badge: 'bg-primary-fixed text-on-primary-fixed',
        adminUserId: adminUser?.id || null,
      },
    });

    console.log('==================================================');
    console.log('✅ Semua dummy data berhasil dihapus 100%!');
    console.log('🛡️ Admin user "admin" dan Pengaturan API di MySQL tetap utuh.');
    console.log('==================================================');
  } catch (error) {
    console.error('❌ Gagal membersihkan database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

purgeDummyData();
