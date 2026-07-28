import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import TemplateService from '../services/TemplateService.js';

export const create = asyncHandler(async (req, res) => {
  const template = await TemplateService.create(req.body);
  res.status(201).json(new ApiResponse(201, 'Template created successfully', template));
});

export const getAll = asyncHandler(async (req, res) => {
  const templates = await TemplateService.getAll();
  res.status(200).json(new ApiResponse(200, 'Templates retrieved successfully', templates));
});

export const update = asyncHandler(async (req, res) => {
  const template = await TemplateService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Template updated successfully', template));
});

export const delete_ = asyncHandler(async (req, res) => {
  const result = await TemplateService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Template deleted successfully', result));
});
