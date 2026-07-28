import { body } from 'express-validator';

const recipientValidator = [
  body('recipients').notEmpty().withMessage('Recipients are required'),
];

export default recipientValidator;
