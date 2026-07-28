const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_REGEX.test(email.trim());

const parseSingleEntry = (entry) => {
  entry = entry.trim();
  if (!entry) return null;

  if (entry.includes('|')) {
    const [namePart, emailPart] = entry.split('|').map((s) => s.trim());
    if (emailPart && isValidEmail(emailPart)) {
      return { name: namePart || '', email: emailPart };
    }
    return null;
  }

  if (entry.includes(',')) {
    const parts = entry.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const [first, second] = parts;
      if (isValidEmail(first)) {
        return { name: second || '', email: first };
      }
      if (isValidEmail(second)) {
        return { name: first || '', email: second };
      }
    }
    return null;
  }

  if (isValidEmail(entry)) {
    return { name: '', email: entry };
  }

  return null;
};

export const parseRecipients = (input) => {
  if (!input || typeof input !== 'string') {
    return {
      valid: [],
      invalid: [],
      duplicates: [],
      counts: { total: 0, valid: 0, invalid: 0, duplicate: 0 },
    };
  }

  const rawEntries = input.split(/[\n;]+/);
  const entries = [];

  for (const raw of rawEntries) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length <= 2) {
      if (parts.length === 2) {
        entries.push(parts.join(','));
      } else if (parts.length === 1) {
        entries.push(parts[0]);
      }
    } else {
      entries.push(raw.trim());
    }
  }

  const seen = new Set();
  const valid = [];
  const invalid = [];
  const duplicates = [];

  for (const entry of entries) {
    const parsed = parseSingleEntry(entry);
    if (!parsed) {
      if (entry) invalid.push(entry);
      continue;
    }

    if (seen.has(parsed.email)) {
      duplicates.push(parsed);
      continue;
    }

    seen.add(parsed.email);
    valid.push(parsed);
  }

  return {
    valid,
    invalid,
    duplicates,
    counts: {
      total: entries.length,
      valid: valid.length,
      invalid: invalid.length,
      duplicate: duplicates.length,
    },
  };
};
