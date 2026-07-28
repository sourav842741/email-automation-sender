import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import LogService from '../services/LogService.js';

export const getLogs = asyncHandler(async (req, res) => {
  const { page, limit, search, status, startDate, endDate } = req.query;
  const filters = {};
  if (search) filters.search = search;
  if (status) filters.status = status;
  if (startDate) filters.dateFrom = startDate;
  if (endDate) filters.dateTo = endDate;
  const logs = await LogService.getLogs(parseInt(page) || 1, parseInt(limit) || 20, filters);
  res.status(200).json(new ApiResponse(200, 'Logs retrieved successfully', logs));
});

export const deleteLogs = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const result = await LogService.deleteLogs(ids || []);
  res.status(200).json(new ApiResponse(200, 'Logs deleted successfully', result));
});

export const exportCSV = asyncHandler(async (req, res) => {
  const csv = await LogService.exportCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="email-logs.csv"');
  res.send(csv);
});

export const exportExcel = asyncHandler(async (req, res) => {
  const buffer = await LogService.exportExcel();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="email-logs.xlsx"');
  res.send(buffer);
});
