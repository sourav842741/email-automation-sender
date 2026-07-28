import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import SettingsService from '../services/SettingsService.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await SettingsService.getSettings();
  res.status(200).json(new ApiResponse(200, 'Settings retrieved successfully', settings));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SettingsService.updateSettings(req.body);
  res.status(200).json(new ApiResponse(200, 'Settings updated successfully', settings));
});
