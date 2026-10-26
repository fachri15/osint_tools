require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const prisma = require('./config/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Izinkan semua origin dalam development (Vite frontend http://localhost:5173, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging sederhana untuk request
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Menyalahati Cyber Intelligence & OSINT Anti-Doxing Operations System',
    version: 'v3.0.2-PRODUCTION',
    database: 'MySQL + Prisma ORM',
    timestamp: new Date().toISOString(),
  });
});

// Mount seluruh endpoint API di prefix /api
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Jalankan Server
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  OSINT Tools Backend API Server is running`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints Root: http://localhost:${PORT}/api`);
  console.log(`======================================================\n`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
