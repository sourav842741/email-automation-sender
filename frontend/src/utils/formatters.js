export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes) {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '...';
}

export function getInitials(name) {
  if (!name) return '';
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export function getDomain(email) {
  if (!email) return '';
  const match = email.match(/@([\w.-]+)/);
  return match ? match[1] : '';
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status) {
  const map = {
    success: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    failed: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    pending: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    sent: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    bounced: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
    opened: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
    clicked: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  };
  return map[status?.toLowerCase()] || 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
}

export function getStatusIcon(status) {
  const map = {
    success: '\u2705',
    failed: '\u274C',
    pending: '\u23F3',
    sent: '\u2709\uFE0F',
    bounced: '\u21A9\uFE0F',
    opened: '\u1F441\uFE0F',
    clicked: '\uD83D\uDC46',
  };
  return map[status?.toLowerCase()] || '\u2753';
}
