require('dotenv').config();
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

async function setupDatabase() {
  console.log('==================================================');
  console.log('🚀 OSINT Tools - Automated Database Setup & Seed');
  console.log('==================================================');

  const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/osint_tools';
  console.log(`📌 Using DATABASE_URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  // Parse connection string
  // Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
  const urlPattern = /mysql:\/\/([^:]+):?(.*)?@([^:/]+):?(\d+)?\/(.+)/;
  const match = dbUrl.match(urlPattern);

  if (!match) {
    console.error('❌ Format DATABASE_URL tidak valid. Format harus: mysql://USER:PASSWORD@HOST:PORT/DATABASE');
    process.exit(1);
  }

  const [, user, password = '', host = 'localhost', port = '3306', database = 'osint_tools'] = match;

  console.log(`📡 Connecting to MySQL server at ${host}:${port} as ${user}...`);

  try {
    const connection = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
    });

    console.log(`✅ Connected to MySQL server successfully!`);

    // Create database if not exists
    console.log(`🔨 Creating database \`${database}\` if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database \`${database}\` is ready.`);

    await connection.end();

    // Run prisma db push
    console.log('\n📦 Pushing Prisma schema models & relations into MySQL database...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    console.log('✅ Prisma schema pushed successfully.');

    // Run seed
    console.log('\n🌱 Seeding initial data (Admin User, Sample Clients, Scans, DC, Removals)...');
    execSync('node prisma/seed.js', { stdio: 'inherit', env: process.env });
    console.log('\n==================================================');
    console.log('🎉 Setup Database MySQL & Prisma ORM Berhasil 100%!');
    console.log('==================================================\n');
  } catch (error) {
    console.error('\n❌ Gagal koneksi ke MySQL:');
    console.error(error.message);
    console.log('\n💡 TIPS:');
    console.log('1. Pastikan server MySQL berjalan (misal: MySQL267 atau Laragon).');
    console.log('2. Buka file .env di osinttoolsscrap-backend/.env');
    console.log('3. Sesuaikan baris DATABASE_URL dengan password Anda:');
    console.log('   DATABASE_URL="mysql://root:PASSWORD_ANDA@localhost:3306/osint_tools"');
    console.log('4. Jalankan kembali: npm run db:setup\n');
    process.exit(1);
  }
}

setupDatabase();
