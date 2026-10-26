# OSINT Tools & Forensic Intelligence Backend API

Backend RESTful API untuk sistem intelijen forensik, tracking DC pinjol, audit kebocoran data, pembersihan konten (takedown), dan pembuatan laporan kepolisian SPKT resmi.

## Teknologi & Arsitektur
- **Runtime**: Node.js v22+
- **Framework**: Express 5.x
- **Database**: MySQL Server
- **ORM**: Prisma ORM v6
- **Autentikasi**: JWT (JSON Web Token) + SHA-256 with Salt Encryption (Modul Admin Internal)
- **Scraping & OSINT Engine**: Axios, Cheerio, DuckDuckGo Scraper, Google Dorking Engine

---

## Struktur Folder Codebase

```
osinttoolsscrap-backend/
├── config/
│   ├── db.js             # MySQL2 Connection Pool
│   └── prisma.js         # PrismaClient Singleton Instance
├── controllers/          # HTTP Request & Response Handlers
│   ├── authController.js
│   ├── clientController.js
│   ├── scanController.js
│   ├── dcController.js
│   ├── removalController.js
│   ├── policeReportController.js
│   ├── dashboardController.js
│   ├── auditLogController.js
│   └── settingsController.js
├── middlewares/          # Auth JWT & Error Handlers
│   ├── auth.js           # Admin Authentication & RBAC Middleware
│   └── errorHandler.js   # Global Error Handler (Prisma Exception Handler)
├── models/
│   └── index.js          # Prisma Model Layer Export
├── prisma/
│   ├── schema.prisma     # Skema Database Relasional Lengkap
│   └── seed.js           # Seeder Data Awal (Admin, Klien, Scan, DC, Removals)
├── routes/               # API Route Handlers
│   ├── index.js          # Aggregator Semua Route (/api)
│   ├── authRoutes.js
│   ├── clientRoutes.js
│   ├── scanRoutes.js
│   ├── dcRoutes.js
│   ├── removalRoutes.js
│   ├── policeReportRoutes.js
│   ├── dashboardRoutes.js
│   ├── auditLogRoutes.js
│   └── settingsRoutes.js
├── scripts/
│   └── setup-db.js       # Script Otomatis Setup Database & Migration
├── services/             # Core OSINT Engine & Business Logic (Convert Python)
│   ├── authService.js
│   ├── clientService.js
│   ├── osintScanService.js
│   ├── dcInvestigationService.js
│   ├── removalService.js
│   ├── policeReportService.js
│   ├── dashboardService.js
│   ├── auditLogService.js
│   └── settingsService.js
├── .env                  # Konfigurasi Environment & Database URL
└── index.js              # Entry Point Server Express
```

---

## Langkah Menjalankan Backend

### 1. Konfigurasi Database di `.env`
Buka file `.env` di folder `osinttoolsscrap-backend/.env` dan pastikan kredensial MySQL sesuai:
```env
PORT=5000
DATABASE_URL="mysql://root:PASSWORD_MYSQL_ANDA@localhost:3306/osint_tools"
JWT_SECRET="OSINT_CYBER_GUARDIAN_SECURE_JWT_SECRET_2026_PRO_JUSTITIA"
```

### 2. Setup Otomatis Database & Seed
Jalankan perintah berikut:
```bash
npm run db:setup
```
Perintah ini akan secara otomatis:
1. Membuat database `osint_tools` di MySQL jika belum ada.
2. Melakukan sinkronisasi tabel & relasi Prisma (`prisma db push`).
3. Mengisi data awal (`seed`) admin `admin` / `admin123`, data klien, histori scan, dc tracking, dan logs.

### 3. Menjalankan Server Development
```bash
npm run dev
```
Server akan berjalan di `http://localhost:5000` dengan seluruh route di `http://localhost:5000/api`.

---

## Akun Default Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `superadmin`
- **NIP**: `ANL-7709-ID`
- **Enkripsi**: SHA-256 + Salt (`OSINT_CYBER_GUARDIAN_SECURE_SALT_2026`)
