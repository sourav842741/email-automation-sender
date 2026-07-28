import path from 'path';

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const getFileExtension = (filename) => path.extname(filename).toLowerCase();

export const isAllowedFileType = (mimetype) => ALLOWED_MIMETYPES.includes(mimetype);

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
};

export const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const sanitized = base.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  return `${sanitized}_${timestamp}${ext}`;
};
