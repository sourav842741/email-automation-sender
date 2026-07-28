import { body } from 'express-validator';

const templateValidator = [
  body('jobTitle').notEmpty().withMessage('Template name is required').trim(),
  body('subjectTemplate').optional().trim(),
];

export default templateValidator;
