const dashboardService = require('../services/dashboardService');

/**
 * GET /api/dashboard/stats
 */
async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
};
