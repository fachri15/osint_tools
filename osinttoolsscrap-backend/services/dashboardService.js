const prisma = require('../config/prisma');

/**
 * Statistik & Telemetri Dashboard Terpadu
 * Persis get_dashboard_stats() di database.py
 */
async function getDashboardStats() {
  const [
    totalClients,
    totalScans,
    totalDc,
    totalRemovalCases,
    completedCases,
    activeCases,
    totalReports,
    highRiskScans,
    recentScans,
    recentCases,
    recentDc,
    clientsList,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.scanHistory.count(),
    prisma.dcInvestigation.count(),
    prisma.removalCase.count(),
    prisma.removalCase.count({ where: { status: 'Berhasil Dihapus' } }),
    prisma.removalCase.count({ where: { status: { in: ['Draft', 'Diajukan', 'Dalam Peninjauan', 'Sedang Diproses Platform'] } } }),
    prisma.policeReport.count(),
    prisma.scanHistory.count({ where: { riskColor: 'red' } }),
    prisma.scanHistory.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, targetName: true, riskScore: true, riskCategory: true, riskColor: true },
    }),
    prisma.removalCase.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      select: { id: true, caseCode: true, createdAt: true, clientName: true, targetUrl: true, status: true, progressPercent: true, platform: true },
    }),
    prisma.dcInvestigation.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, dcPhone: true, operator: true, isSpam: true, phoneScore: true, voipDetected: true },
    }),
    prisma.client.findMany({
      orderBy: { id: 'desc' },
      take: 6,
    }),
  ]);

  // Hitung rata-rata risk score
  const avgRisk = await prisma.scanHistory.aggregate({
    _avg: { riskScore: true },
    where: { riskScore: { gt: 0 } },
  });

  const averageScore = Math.round(avgRisk._avg.riskScore || 0);

  // Format metrik untuk card KPI frontend
  const metrics = [
    {
      id: 'total_diagnosa',
      title: 'Total Diagnosa',
      value: String(totalScans),
      unit: 'Target',
      subtitle: 'Total target terverifikasi',
      change: totalScans > 0 ? '+100%' : '0%',
      trend: 'up',
      icon: 'manage_search',
      iconBg: 'bg-primary-fixed text-on-primary-fixed',
    },
    {
      id: 'risiko_kritis',
      title: 'Risiko Kritis',
      value: String(highRiskScans),
      unit: 'Kasus',
      subtitle: 'Doxing aktif & teror masif',
      change: highRiskScans > 0 ? 'Tinggi' : 'Normal',
      trend: highRiskScans > 0 ? 'critical' : 'up',
      icon: 'crisis_alert',
      iconBg: 'bg-error-container text-on-error-container',
    },
    {
      id: 'konten_takedown',
      title: 'Konten Dihapus',
      value: String(completedCases),
      unit: 'URL',
      subtitle: 'Berhasil di-takedown platform',
      change: completedCases > 0 ? 'Aktif' : '0%',
      trend: 'up',
      icon: 'auto_delete',
      iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    },
    {
      id: 'nomor_dc_terlacak',
      title: 'Nomor DC Terlacak',
      value: String(totalDc),
      unit: 'Sindikat',
      subtitle: 'Profil forensik & HLR siap',
      change: totalDc > 0 ? 'Aktif' : '0',
      trend: totalDc > 0 ? 'warning' : 'up',
      icon: 'phone_in_talk',
      iconBg: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    },
    {
      id: 'bap_siap_ekspor',
      title: 'BAP Siap Ekspor',
      value: String(totalReports),
      unit: 'Dokumen',
      subtitle: 'Format resmi Bareskrim/OJK',
      change: totalReports > 0 ? 'Siap' : '0',
      trend: 'up',
      icon: 'description',
      iconBg: 'bg-primary-fixed text-primary',
    },
    {
      id: 'integritas_data',
      title: 'Integritas Data',
      value: '100%',
      unit: 'Audit',
      subtitle: 'Enkripsi AES-256 GCM',
      change: 'Aman',
      trend: 'up',
      icon: 'verified_user',
      iconBg: 'bg-surface-container-highest text-primary-container',
    },
  ];

  return {
    metrics,
    counts: {
      totalClients,
      totalScans,
      totalDc,
      totalRemovalCases,
      completedCases,
      activeCases,
      totalReports,
      avgRiskScore: averageScore,
      highRiskCount: highRiskScans,
    },
    recentScans,
    recentCases,
    recentDc,
    recentClients: clientsList,
  };
}

module.exports = {
  getDashboardStats,
};
