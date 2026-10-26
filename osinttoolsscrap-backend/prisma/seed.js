const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const SALT = process.env.SALT || 'OSINT_CYBER_GUARDIAN_SECURE_SALT_2026';

function hashPassword(password) {
  const salted = `${SALT}:${password}`;
  return crypto.createHash('sha256').update(salted, 'utf8').digest('hex');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Admin User
  const adminPasswordHash = hashPassword('admin123');
  const adminUser = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'Administrator Utama',
      role: 'superadmin',
      nip: 'ANL-7709-ID',
      badge: 'Superadmin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      lastLogin: new Date(),
    },
  });
  console.log('✅ Admin user created/verified: admin (password: admin123)');

  // 2. Seed Clients
  const clientsData = [
    {
      clientCode: 'KLIEN-089',
      fullName: 'Ega Kusuma Anindhita',
      firstName: 'Ega',
      middleName: 'Kusuma',
      lastName: 'Anindhita',
      nik: '317109******0004',
      nikFull: '3171091405960004',
      birthDate: '14-05-1996',
      gender: 'Laki-laki',
      phone: '+62 812-9842-7890',
      email: 'ega.kusuma96@gmail.com',
      address: 'DKI Jakarta (Tebet Barat Dalam No. 18, Jakarta Selatan)',
      emergencyContact: 'Rina Astuti (0812-8899-7711)',
      familyName: 'Rina Astuti (Istri) / Bambang Kusuma (Ayah)',
      doxingKeywords: '@urbanbekasi, @infobekasi, #doxingpinjol, dc_pinjol',
      socialMedia: {
        instagram: 'ega.kusuma96',
        facebook: 'ega.anindhita',
        threads: 'ega.kusuma96',
        linkedin: 'ega-kusuma-anindhita',
        tiktok: 'egakusuma',
        twitter: 'egakusuma_x',
        youtube: '@EgaKusumaChannel',
      },
      caseCategory: 'Teror Pinjol Ilegal & Doxing Kontak',
      threatLevel: 'CRITICAL',
      riskScore: 92,
      status: 'Mitigasi L1 Aktif',
      activeThreats: 5,
      resolvedThreats: 2,
      involvedFintechs: ['Pundi Cepat Kilat', 'EasyDana Online', 'PinjamCepatKu'],
      assignedAnalyst: 'ANL-7709-ID (Aditya Wardhana)',
      legalBasis: 'Pasal 65 & 67 UU No. 27/2022 (PDP) & Pasal 27B UU ITE',
      notes: 'Nomor kontak darurat seluruh keluarga dan kantor telah dihubungi sindikat DC. Foto KTP beredar di 3 grup Telegram penagihan.',
      adminUserId: adminUser.id,
    },
    {
      clientCode: 'KLIEN-092',
      fullName: 'Hendra Wijaya',
      firstName: 'Hendra',
      middleName: '',
      lastName: 'Wijaya',
      nik: '327311******0002',
      nikFull: '3273112008890002',
      birthDate: '20-08-1989',
      gender: 'Laki-laki',
      phone: '+62 813-2019-3381',
      email: 'hendra.wijaya.bdg@outlook.com',
      address: 'Kota Bandung (Coblong)',
      emergencyContact: 'Dewi Lestari (0813-2211-4455)',
      familyName: 'Dewi Lestari (Istri)',
      doxingKeywords: '@infobandung, @sekitarbandung, dc_teror',
      socialMedia: {
        instagram: 'hendrawijaya_bdg',
        facebook: 'hendra.wijaya.90',
        linkedin: 'hendra-wijaya-it',
      },
      caseCategory: 'Penyebaran Data Kontak & Teror SMS',
      threatLevel: 'HIGH',
      riskScore: 78,
      status: 'Investigasi Forensik',
      activeThreats: 3,
      resolvedThreats: 1,
      involvedFintechs: ['DanaExpress-VIP', 'KreditKilat-Go'],
      assignedAnalyst: 'ANL-7709-ID (Aditya Wardhana)',
      legalBasis: 'Pasal 29 UU ITE (Ancaman Kekerasan Elektronik)',
      notes: 'Pengiriman pesan autodialer blast ke kontak WhatsApp dengan kata-kata kasar dan fitnah.',
      adminUserId: adminUser.id,
    },
    {
      clientCode: 'KLIEN-094',
      fullName: 'Siti Rahmawati',
      firstName: 'Siti',
      middleName: '',
      lastName: 'Rahmawati',
      nik: '357801******0008',
      nikFull: '3578015201940008',
      birthDate: '12-01-1994',
      gender: 'Perempuan',
      phone: '+62 856-4890-1234',
      email: 'siti.rahmawati94@yahoo.com',
      address: 'Kota Surabaya (Gubeng)',
      emergencyContact: 'Supriyanto (0856-9900-1122)',
      familyName: 'Supriyanto (Suami) / Hj. Maryam (Ibu)',
      doxingKeywords: '@infosurabaya, group_order_wa, sebar_data',
      socialMedia: {
        instagram: 'siti_rahmawati94',
        facebook: 'siti.rahmawati.sby',
      },
      caseCategory: 'Manipulasi Foto Wajah & Doxing Medsos',
      threatLevel: 'CRITICAL',
      riskScore: 95,
      status: 'Takedown Platform',
      activeThreats: 4,
      resolvedThreats: 3,
      involvedFintechs: ['RupiahDompet Plus', 'SakuMaju'],
      assignedAnalyst: 'ANL-8812-ID (Maya Kartika)',
      legalBasis: 'Pasal 27 ayat (1) jo. Pasal 45 ayat (1) UU ITE & UU Pornografi',
      notes: 'Foto wajah korban diedit dan disebarkan ke media sosial.',
      adminUserId: adminUser.id,
    },
  ];

  const createdClients = [];
  for (const c of clientsData) {
    const cl = await prisma.client.upsert({
      where: { clientCode: c.clientCode },
      update: {},
      create: c,
    });
    createdClients.push(cl);
  }
  console.log(`✅ ${createdClients.length} clients created/verified`);

  const primaryClient = createdClients[0];

  // 3. Seed Scan History
  const scanHistoryCount = await prisma.scanHistory.count();
  if (scanHistoryCount === 0) {
    await prisma.scanHistory.create({
      data: {
        clientId: primaryClient.id,
        targetName: 'fachridatul Otolomo',
        targetPhone: '082287258040',
        targetEmail: 'fachridatulotolomo1508@gmail.com',
        targetInstagram: 'ucp.tlm',
        riskScore: 80,
        riskCategory: 'KRITIS',
        riskColor: 'red',
        dorkFound: 18,
        breachCount: 3,
        socialPlatforms: ['instagram', 'facebook', 'whatsapp'],
        status: 'selesai',
        scanMode: 'real',
        resultJson: {
          risk: { finalScore: 80, category: 'KRITIS', color: 'red' },
          dorkFound: 18,
          breachesCount: 3,
        },
        notes: 'Hasil scan sample dari database forensik_data.db',
      },
    });

    await prisma.scanHistory.create({
      data: {
        clientId: primaryClient.id,
        targetName: 'Ega Kusuma Anindhita',
        targetPhone: '+62 812-9842-7890',
        targetEmail: 'ega.kusuma96@gmail.com',
        targetNik: '3171091405960004',
        targetInstagram: 'ega.kusuma96',
        targetFacebook: 'ega.anindhita',
        spouseFamily: 'Rina Astuti (Istri) / Bambang Kusuma (Ayah)',
        keywords: '@urbanbekasi, @infobekasi, #doxingpinjol',
        riskScore: 92,
        riskCategory: 'KRITIS',
        riskColor: 'red',
        dorkFound: 24,
        breachCount: 3,
        socialPlatforms: ['instagram', 'facebook', 'linkedin', 'twitter'],
        status: 'selesai',
        scanMode: 'real',
        resultJson: {
          risk: { finalScore: 92, category: 'KRITIS', color: 'red' },
          aiSummary: 'Ditemukan paparan kebocoran data NIK dan kontak darurat di forum publik dan Telegram.',
        },
        notes: 'Diagnosa jejak digital prioritas penanganan korban doxing.',
      },
    });
    console.log('✅ Scan history seeded');
  }

  // 4. Seed DC Investigations
  const dcCount = await prisma.dcInvestigation.count();
  if (dcCount === 0) {
    await prisma.dcInvestigation.create({
      data: {
        clientId: primaryClient.id,
        dcPhone: '+62 857-1903-8821',
        operator: 'Indosat Ooredoo Hutchison',
        region: 'DKI Jakarta & Bodetabek',
        phoneType: 'VoIP / Virtual Blast',
        hlrCity: 'DKI Jakarta',
        truecallerName: 'DC Pundi Cepat Teror',
        isSpam: true,
        getcontactCount: 28,
        hasFraudReport: true,
        phoneScore: 94,
        voipDetected: true,
        riskLevel: 'CRITICAL',
        status: 'selesai',
        resultJson: {
          operator: 'Indosat Ooredoo Hutchison',
          tags: ['DC Pundi Cepat', 'Tukang Teror WA', 'Robot Autodialer'],
          fraudReports: 7,
        },
        notes: 'Sindikat penagihan teror masif terdeteksi menggunakan PBX Twilio.',
      },
    });

    await prisma.dcInvestigation.create({
      data: {
        clientId: primaryClient.id,
        dcPhone: '+62 813-9021-3312',
        operator: 'Telkomsel (Simpati)',
        region: 'Jawa Barat (Bandung)',
        phoneType: 'Prabayar Seluler',
        hlrCity: 'Bandung',
        truecallerName: 'EasyDana Collector Lapangan',
        isSpam: true,
        getcontactCount: 15,
        hasFraudReport: true,
        phoneScore: 82,
        voipDetected: false,
        riskLevel: 'HIGH',
        status: 'selesai',
        resultJson: {
          operator: 'Telkomsel (Simpati)',
          tags: ['EasyDana Collection', 'Penagih Kasar'],
        },
      },
    });
    console.log('✅ DC investigations seeded');
  }

  // 5. Seed Removal Cases & Logs
  const removalCount = await prisma.removalCase.count();
  if (removalCount === 0) {
    const remCase = await prisma.removalCase.create({
      data: {
        caseCode: 'REM-2026-081',
        clientId: primaryClient.id,
        clientName: 'Ega Kusuma Anindhita',
        clientPhone: '+62 812-9842-7890',
        targetUrl: 'https://pastebin.com/raw/d0x_egakusuma_3171',
        targetSnippet: 'Daftar NIK 3171091405960004 dan kontak darurat keluarga',
        targetKeyword: 'egakusuma doxing pinjol',
        platform: 'Pastebin',
        platformIcon: 'description',
        leakType: 'Daftar Kontak & NIK Lengkap',
        removalType: 'Google Outdated Content & Abuse Notice',
        status: 'Sedang Diproses Platform',
        statusCode: 'IN_PROGRESS',
        progressPercent: 65,
        ticketId: 'PB-TICKET-88912',
        legalRef: 'UU PDP Art. 65 / DMCA Privacy Notice',
        evidenceCount: 3,
        lastCheckedAt: new Date(),
        httpStatusCode: 200,
        isIndexed: true,
        aiGuidance: 'Kirim eskalasi somasi kedua ke registrar domain atau abuse desk Pastebin.',
        notes: 'Menunggu konfirmasi tiket abuse #PB-88912.',
        logs: {
          create: [
            {
              actionType: 'Case Created',
              oldStatus: '-',
              newStatus: 'Draft',
              description: 'Tiket case REM-2026-081 dibuat dari hasil diagnosa forensik.',
              actor: 'Operator L1',
            },
            {
              actionType: 'Legal Notice Sent',
              oldStatus: 'Draft',
              newStatus: 'Sedang Diproses Platform',
              description: 'Surat somasi resmi UU PDP Pasal 65 jo. Pasal 67 dikirimkan ke abuse desk.',
              actor: 'AI Legal Engine',
            },
          ],
        },
      },
    });
    console.log('✅ Removal case and logs seeded');
  }

  // 6. Seed Police Report
  const reportCount = await prisma.policeReport.count();
  if (reportCount === 0) {
    await prisma.policeReport.create({
      data: {
        clientId: primaryClient.id,
        reportNumber: 'LP/B/089/X/2026/SPKT.DITTIPIDSIBER',
        reporterName: 'Ega Kusuma Anindhita',
        reporterNik: '3171091405960004',
        reporterPhone: '+62 812-9842-7890',
        reporterAddress: 'Jl. Tebet Barat Dalam No. 18, Jakarta Selatan',
        dcPhone: '+62 857-1903-8821',
        suspectAlias: 'Pundi Cepat Kilat / EasyDana Collection',
        suspectAccount: 'BCA Virtual Account 882091823719',
        incidentSummary: 'Intimidasi dan pemerasan elektronik melalui panggilan autodialer lebih dari 60x sehari serta ancaman penyebaran KTP ke medsos.',
        chronologyText: 'Pada tanggal 10 Oktober 2026, pelapor menerima pesan intimidasi dan panggilan agresif terus menerus menuntut pelunasan pinjaman fiktif.',
        filename: 'BAP_SPKT_Ega_Kusuma_Anindhita.pdf',
        status: 'generated',
      },
    });
    console.log('✅ Police report seeded');
  }

  // 7. Seed Audit Logs
  const auditLogsData = [
    {
      logCode: 'LOG-9921',
      module: 'INVESTIGASI-DC',
      actor: 'ANL-7709-ID (Aditya Wardhana)',
      action: 'Analisis HLR & VoIP Indosat',
      target: '+62 857-1903-8821 (Sindikat Pundi Cepat)',
      result: 'VoIP Proxy Terdeteksi (Skor Fraud 94%)',
      hash: 'sha256:d8a901ee4b7a33f2',
      badge: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    },
    {
      logCode: 'LOG-9920',
      module: 'ASISTEN-REMOVAL',
      actor: 'AI-LEGAL-ENGINE',
      action: 'Pengiriman Notice Takedown UU PDP',
      target: 'pastebin.com/raw/d0x_egakusuma_3171',
      result: 'Tiket Terbit #PB-88912',
      hash: 'sha256:c2b110fa9900901a',
      badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
    },
    {
      logCode: 'LOG-9919',
      module: 'DATA-KLIEN',
      actor: 'ANL-7709-ID (Aditya Wardhana)',
      action: 'Registrasi Subjek Baru & Validasi Dukcapil',
      target: 'Ega Kusuma Anindhita (317109******0004)',
      result: 'Tervalidasi 100% Dukcapil L2',
      hash: 'sha256:4fa991bce701a12b',
      badge: 'bg-primary-fixed text-on-primary-fixed',
    },
  ];

  for (const log of auditLogsData) {
    const existing = await prisma.auditLog.findFirst({ where: { logCode: log.logCode } });
    if (!existing) {
      await prisma.auditLog.create({ data: { ...log, adminUserId: adminUser.id } });
    }
  }
  console.log('✅ Audit logs seeded');

  // 8. Seed System Settings
  const defaultSettings = [
    { key: 'SERP_API_KEY', value: 'sk_live_serp_9901248102948190248' },
    { key: 'HIBP_API_KEY', value: 'hibp_ent_v3_889102481902914810' },
    { key: 'TELEGRAM_TOKEN', value: 'bot78901234:AAHk1_fakeTelegramToken_OsintAlert' },
    { key: 'DUKCAPIL_KEY', value: 'pk_dukcapil_l2_projustitia_8820' },
    { key: 'MFA_ENFORCED', value: 'true' },
    { key: 'RETENTION_PERIOD', value: '5' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ System settings seeded');

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
