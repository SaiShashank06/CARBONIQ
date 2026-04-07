/**
 * routes/reports.js
 * Report generation and export endpoints
 */

const express = require('express');
const router = express.Router();
const { buildTextReport, buildCSVReport } = require('../utils/reportGenerator');
const { asyncHandler } = require('../middleware/errorHandler');
const { apiResponse, apiError } = require('../utils/helpers');

// POST /api/reports/text
// Generate a plain-text summary report
router.post('/text', asyncHandler(async (req, res) => {
  const { reportData } = req.body;

  if (!reportData || !reportData.summary) {
    return apiError(res, 'reportData with summary is required', 400);
  }

  const report = buildTextReport(reportData);

  return apiResponse(res, {
    reportId: report.id,
    generatedAt: report.date,
    text: report.text
  });
}));

// POST /api/reports/csv
// Generate a CSV export
router.post('/csv', asyncHandler(async (req, res) => {
  const { reportData } = req.body;

  if (!reportData || !reportData.emissions) {
    return apiError(res, 'reportData with emissions is required', 400);
  }

  const csv = buildCSVReport(reportData);
  const filename = `coalcarbon-report-${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
}));

// POST /api/reports/json
// Return the full structured JSON report
router.post('/json', asyncHandler(async (req, res) => {
  const { reportData } = req.body;

  if (!reportData) {
    return apiError(res, 'reportData is required', 400);
  }

  const { generateReportId } = require('../utils/helpers');
  const reportId = generateReportId();

  return apiResponse(res, {
    reportId,
    generatedAt: new Date().toISOString(),
    ...reportData
  });
}));

module.exports = router;
