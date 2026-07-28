import { EMAIL_REGEX, GENERIC_EMAIL_PREFIXES } from './constants.js';

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function extractNameFromEmail(email) {
  if (!email) return '';
  const localPart = email.split('@')[0];
  const cleaned = localPart
    .replace(/[._-]/g, ' ')
    .replace(/\d+/g, '')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  const filtered = words.filter(
    (w) => !GENERIC_EMAIL_PREFIXES.includes(w.toLowerCase())
  );

  const nameWords = filtered.length > 0 ? filtered.slice(0, 2) : [localPart];
  return nameWords
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function parseRecipients(input) {
  if (!input || typeof input !== 'string') {
    return { valid: [], invalid: [], duplicates: [], counts: { total: 0, valid: 0, invalid: 0, duplicate: 0 } };
  }

  const rawEntries = input
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Map();
  const valid = [];
  const invalid = [];
  const duplicates = [];

  for (const entry of rawEntries) {
    let email = '';
    let name = '';

    if (entry.includes('@')) {
      if (entry.includes(',') || entry.includes('|')) {
        const sep = entry.includes(',') ? ',' : '|';
        const parts = entry.split(sep).map((p) => p.trim());
        const emailPart = parts.find((p) => p.includes('@')) || '';
        const namePart = parts.find((p) => !p.includes('@')) || '';
        email = emailPart.toLowerCase();
        name = namePart || extractNameFromEmail(email);
      } else {
        email = entry.toLowerCase();
        name = extractNameFromEmail(email);
      }
    } else {
      invalid.push({ raw: entry, email: '', name: entry });
      continue;
    }

    if (!isValidEmail(email)) {
      invalid.push({ raw: entry, email, name });
      continue;
    }

    if (seen.has(email)) {
      duplicates.push({ raw: entry, email, name });
      continue;
    }

    seen.set(email, true);
    valid.push({ raw: entry, email, name });
  }

  const total = rawEntries.length;
  return {
    valid,
    invalid,
    duplicates,
    counts: {
      total,
      valid: valid.length,
      invalid: invalid.length,
      duplicate: duplicates.length,
    },
  };
}
