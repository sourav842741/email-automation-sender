import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import CoverLetterService from '../services/CoverLetterService.js';

export const save = asyncHandler(async (req, res) => {
  let result;
  const title = req.body.title || 'Untitled Cover Letter';
  if (req.body.type === 'file') {
    if (!req.file) throw new ApiError('No file uploaded for file-type cover letter', 400);
    result = await CoverLetterService.saveFile(title, req.file);
  } else {
    if (!req.body.templateText) throw new ApiError('Template text is required for text-type cover letter', 400);
    result = await CoverLetterService.saveText(title, req.body.templateText);
  }
  res.status(201).json(new ApiResponse(201, 'Cover letter saved successfully', result));
});

export const getAll = asyncHandler(async (req, res) => {
  const letters = await CoverLetterService.getAll();
  res.status(200).json(new ApiResponse(200, 'Cover letters retrieved successfully', letters));
});

export const getById = asyncHandler(async (req, res) => {
  const letter = await CoverLetterService.getById(req.params.id);
  if (!letter) throw new ApiError('Cover letter not found', 404);
  res.status(200).json(new ApiResponse(200, 'Cover letter retrieved successfully', letter));
});

export const update = asyncHandler(async (req, res) => {
  const result = await CoverLetterService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Cover letter updated successfully', result));
});

export const setActive = asyncHandler(async (req, res) => {
  const result = await CoverLetterService.setActive(req.params.id);
  if (!result) throw new ApiError('Cover letter not found', 404);
  res.status(200).json(new ApiResponse(200, 'Cover letter set as active', result));
});

export const remove = asyncHandler(async (req, res) => {
  const result = await CoverLetterService.deleteCoverLetter(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Cover letter deleted successfully', result));
});
