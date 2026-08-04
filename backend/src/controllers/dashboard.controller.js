const dashboardService = require("../services/dashboard.service");
const { asyncHandler } = require("../helpers/errors");

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDashboard(req.user);
  return res.status(200).json({ success: true, data: dashboard });
});

module.exports = {
  getDashboard
};
