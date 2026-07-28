export const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GENERIC_EMAIL_PREFIXES = [
  'hr',
  'jobs',
  'careers',
  'support',
  'contact',
  'hello',
  'admin',
  'team',
  'office',
  'career',
  'talent',
  'recruitment',
];

export const STATUSES = {
  SUCCESS: 'success',
  FAILED: 'failed',
};

export const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;
