const prisma = require('../config/prisma');

/**
 * Script untuk mengosongkan (truncate) seluruh data di database
 * KECUALI data login di tabel admin_users.
 */
async function truncateAllExceptAdmin() {
  const targetTables = [
    'removal_logs',
    'removal_cases',
    'police_reports',
    'dc_investigations',
    'scan_history',
    'audit_logs',
    'removal_requests',
    'clients',
    'system_settings',
  ];

  console.log('=====================================================');
  console.log('🧹 MEMULAI OPERASI TRUNCATE SEMUA TABEL (KECUALI admin_users)');
  console.log('=====================================================');

  const beforeCounts = {};
  const afterCounts = {};

  try {
    // 1. Ambil data hitungan baris sebelum truncate
    for (const table of targetTables) {
      try {
        const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM \`${table}\``);
        beforeCounts[table] = Number(countRes[0]?.cnt ?? 0);
      } catch (e) {
        beforeCounts[table] = 0;
      }
    }

    const adminCountBefore = await prisma.adminUser.count();
    console.log(`👤 Tabel admin_users sebelum operasi: ${adminCountBefore} user aktif.`);

    // 2. Nonaktifkan foreign key checks sementara untuk truncate aman
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    // 3. Truncate setiap tabel sasaran
    for (const table of targetTables) {
      console.log(`🗑️  Truncating tabel: ${table} (sebelumnya ${beforeCounts[table]} baris)...`);
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
    }

    // 4. Aktifkan kembali foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    // 5. Verifikasi hitungan baris setelah truncate
    for (const table of targetTables) {
      try {
        const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM \`${table}\``);
        afterCounts[table] = Number(countRes[0]?.cnt ?? 0);
      } catch (e) {
        afterCounts[table] = 0;
      }
    }

    // 6. Verifikasi data admin_users tetap utuh
    const preservedAdminUsers = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        nip: true,
        badge: true,
        createdAt: true,
      },
    });

    console.log('=====================================================');
    console.log('✅ TRUNCATE BERHASIL 100%!');
    console.log('Tabel yang telah dikosongkan:', afterCounts);
    console.log(`👤 Data login admin_users tetap UTUH (${preservedAdminUsers.length} user):`, preservedAdminUsers);
    console.log('=====================================================');

    return {
      success: true,
      message: 'Seluruh data berhasil di-truncate kecuali data login pada tabel admin_users.',
      preservedAdminUsers,
      summary: {
        truncatedTables: targetTables,
        beforeCounts,
        afterCounts,
      },
    };
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat truncate:', error);
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;').catch(() => {});
    throw error;
  }
}

module.exports = truncateAllExceptAdmin;
