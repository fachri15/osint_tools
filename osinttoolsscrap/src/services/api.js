import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance terkonfigurasi dengan Base URL & Timeout
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout for network & multi-crawler operations
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Otomatis cantumkan Authorization Bearer JWT Token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('osint_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Tangani 401 Unauthorized secara global
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan.';
    if (error.response?.status === 401) {
      // Sesi habis atau token invalid
      console.warn('[AUTH 401]: Sesi otentikasi kedaluwarsa.');
    }
    return Promise.reject(new Error(msg));
  }
);

// ─────────────────────────────────────────────────────────────
// 1. AUTENTIKASI ADMIN & 2FA
// ─────────────────────────────────────────────────────────────
export const authApi = {
  login: async (username, password) => {
    const res = await apiClient.post('/auth/login', { username, password });
    if (res.token) {
      localStorage.setItem('osint_token', res.token);
      localStorage.setItem('osint_user', JSON.stringify(res.user));
    }
    return res;
  },
  getMe: () => apiClient.get('/auth/me'),
  verify2fa: (totp) => apiClient.post('/auth/verify-2fa', { totp }),
  logout: () => {
    localStorage.removeItem('osint_token');
    localStorage.removeItem('osint_user');
  },
  isAuthenticated: () => Boolean(localStorage.getItem('osint_token')),
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('osint_user') || 'null');
    } catch {
      return null;
    }
  },
};

// ─────────────────────────────────────────────────────────────
// 2. DASHBOARD METRICS & TELEMETRI REAL
// ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

// ─────────────────────────────────────────────────────────────
// 3. DATA KLIEN (360° PORTFOLIO) REAL MYSQL
// ─────────────────────────────────────────────────────────────
export const clientApi = {
  getAll: (params = {}) => apiClient.get('/clients', { params }),
  getById: (id) => apiClient.get(`/clients/${id}`),
  create: (data) => apiClient.post('/clients', data),
  update: (id, data) => apiClient.put(`/clients/${id}`, data),
  delete: (id) => apiClient.delete(`/clients/${id}`),
  getTimeline: (id) => apiClient.get(`/clients/${id}/timeline`),
  verifyDukcapil: (nik, name = '') => apiClient.post('/clients/verify-dukcapil', { nik, name }),
};

// ─────────────────────────────────────────────────────────────
// 4. DIAGNOSA JEJAK DIGITAL (OSINT SCANNER)
// ─────────────────────────────────────────────────────────────
export const scanApi = {
  runScan: (data) => apiClient.post('/scans/run', data, { timeout: 90000 }),
  runBulkScan: (targets) => apiClient.post('/scans/bulk', { targets }, { timeout: 120000 }),
  exportPdf: (data) => apiClient.post('/scans/export-pdf', data),
  getHistory: (limit = 100) => apiClient.get('/scans', { params: { limit } }),
  getDetail: (id) => apiClient.get(`/scans/${id}`),
  checkHibp: (email, apiKey = '', params = {}) => apiClient.get('/scans/hibp', { params: { email, apiKey, ...params } }),
  getAllBreaches: (params = {}) => apiClient.get('/scans/hibp/breaches', { params }),
  getSingleBreach: (name) => apiClient.get(`/scans/hibp/breaches/${encodeURIComponent(name)}`),
  getHibpDataClasses: () => apiClient.get('/scans/hibp/dataclasses'),
  getNationalLeaks: () => apiClient.get('/scans/national-leaks'),
};

// ─────────────────────────────────────────────────────────────
// 5. INVESTIGASI NOMOR DEBT COLLECTOR (DC)
// ─────────────────────────────────────────────────────────────
export const dcApi = {
  analyze: (phone, clientId = null) => apiClient.post('/dc/analyze', { phone, clientId }),
  getHistory: (limit = 100) => apiClient.get('/dc', { params: { limit } }),
  getDetail: (id) => apiClient.get(`/dc/${id}`),
  truecallerLookup: (phone) => apiClient.post('/dc/truecaller/lookup', { phone }),
  getTruecallerInfo: () => apiClient.get('/dc/truecaller/info'),
  saveTruecallerToken: (token) => apiClient.post('/dc/truecaller/token', { token }),
};

// ─────────────────────────────────────────────────────────────
// 6. ASISTEN REMOVAL & PROGRESS TAKEDOWN
// ─────────────────────────────────────────────────────────────
export const removalApi = {
  getAll: (params = {}) => apiClient.get('/removals', { params }),
  getById: (id) => apiClient.get(`/removals/${id}`),
  create: (data) => apiClient.post('/removals', data),
  updateStatus: (id, data) => apiClient.put(`/removals/${id}/status`, data),
  runLiveCheck: (url, caseId = null) => apiClient.post('/removals/live-check', { url, caseId }),
  generateLegal: (data) => apiClient.post('/removals/generate-legal', data),
};

// ─────────────────────────────────────────────────────────────
// 7. LAPORAN POLISI (PDF BAP SPKT RESMI)
// ─────────────────────────────────────────────────────────────
export const policeReportApi = {
  getAll: (limit = 100) => apiClient.get('/reports', { params: { limit } }),
  getById: (id) => apiClient.get(`/reports/${id}`),
  create: (data) => apiClient.post('/reports', data),
  delete: (id) => apiClient.delete(`/reports/${id}`),
};

// ─────────────────────────────────────────────────────────────
// 8. AUDIT LOG FORENSIK (IMMUTABLE LOGS)
// ─────────────────────────────────────────────────────────────
export const auditLogApi = {
  getAll: (params = {}) => apiClient.get('/audit-logs', { params }),
  create: (data) => apiClient.post('/audit-logs', data),
};

// ─────────────────────────────────────────────────────────────
// 9. PENGATURAN API GATEWAY (DISIMPAN DI DATABASE MYSQL)
// ─────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => apiClient.get('/settings'),
  save: (data) => apiClient.post('/settings', data),
  testConnection: (apiName) => apiClient.post('/settings/test-connection', { apiName }),
};
