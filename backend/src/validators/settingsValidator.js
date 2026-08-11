import { body } from 'express-validator';

const settingsValidator = [
  body('myName').optional({ values: 'falsy' }).trim(),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('smtpHost').optional().trim(),
  body('smtpPort').optional().isInt({ min: 1, max: 65535 }).withMessage('SMTP port must be between 1 and 65535'),
  body('smtpSecure').optional().isBoolean().withMessage('SMTP secure must be boolean'),
  body('smtpUser').optional().trim(),
  body('smtpPassword').optional().trim(),
  body('senderName').optional().trim(),
  body('fallbackGreeting').optional().trim(),
  body('defaultSubject').optional().trim(),
];

export default settingsValidator;
