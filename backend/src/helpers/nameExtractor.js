const GENERIC_WORDS = new Set([
  'hr', 'jobs', 'careers', 'support', 'contact', 'hello',
  'admin', 'team', 'office', 'career', 'talent', 'recruitment',
]);

const toTitleCase = (str) =>
  str.replace(/\w+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

export const extractName = (email, fallbackGreeting) => {
  const localPart = email.split('@')[0];
  const parts = localPart.split(/[._-]/);

  const filtered = parts
    .map((part) => part.toLowerCase())
    .filter((part) => !GENERIC_WORDS.has(part))
    .filter((part) => /^[a-zA-Z]+$/.test(part));

  if (filtered.length === 0) {
    return fallbackGreeting;
  }

  return toTitleCase(filtered.join(' '));
};
