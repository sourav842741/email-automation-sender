import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import AnalyticsService from '../services/AnalyticsService.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await AnalyticsService.getAnalytics();
  res.status(200).json(new ApiResponse(200, 'Analytics retrieved successfully', analytics));
});
