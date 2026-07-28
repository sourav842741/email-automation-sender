import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import ResumeService from '../services/ResumeService.js';

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError('No file uploaded', 400);
  }
  const result = await ResumeService.upload(req.file);
  res.status(200).json(new ApiResponse(200, 'Resume uploaded successfully', result));
});

export const getResume = asyncHandler(async (req, res) => {
  const resume = await ResumeService.getResume();
  res.status(200).json(new ApiResponse(200, 'Resume retrieved successfully', resume));
});

export const deleteResume = asyncHandler(async (req, res) => {
  const result = await ResumeService.deleteResume();
  res.status(200).json(new ApiResponse(200, 'Resume deleted successfully', result));
});
