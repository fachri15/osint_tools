const prisma = require('../config/prisma');

/**
 * Buat Laporan Polisi Baru
 */
async function createPoliceReport(data) {
  const count = await prisma.policeReport.count();
  const reportNumber = data.reportNumber || `LP/B/${String(count + 89).padStart(3, '0')}/X/${new Date().getFullYear()}/SPKT.DITTIPIDSIBER`;
  const filename = data.filename || `BAP_SPKT_${String(data.reporterName || 'Pelapor').replace(/\s+/g, '_')}_${Date.now()}.pdf`;

  const report = await prisma.policeReport.create({
    data: {
      clientId: data.clientId ? Number(data.clientId) : null,
      reportNumber,
      reporterName: data.reporterName || 'Pelapor Resmi',
      reporterNik: data.reporterNik || '',
      reporterPhone: data.reporterPhone || '',
      reporterAddress: data.reporterAddress || '',
      dcPhone: data.dcPhone || '',
      suspectAlias: data.suspectAlias || '',
      suspectAccount: data.suspectAccount || '',
      incidentSummary: data.incidentSummary || '',
      chronologyText: data.chronologyText || '',
      filename,
      status: 'generated',
    },
  });

  return report;
}

/**
 * Ambil Riwayat Laporan Polisi
 */
async function getPoliceReports(limit = 100) {
  return prisma.policeReport.findMany({
    orderBy: { id: 'desc' },
    take: Number(limit),
    include: {
      client: {
        select: { id: true, clientCode: true, fullName: true },
      },
    },
  });
}

/**
 * Detail Laporan Polisi
 */
async function getPoliceReportDetail(id) {
  return prisma.policeReport.findUnique({
    where: { id: Number(id) },
    include: { client: true },
  });
}

/**
 * Hapus Laporan Polisi
 */
async function deletePoliceReport(id) {
  return prisma.policeReport.delete({
    where: { id: Number(id) },
  });
}

module.exports = {
  createPoliceReport,
  getPoliceReports,
  getPoliceReportDetail,
  deletePoliceReport,
};
