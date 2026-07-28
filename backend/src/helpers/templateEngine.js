export const renderTemplate = (template, variables) => {
  if (!template) return '';

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined && variables[key] !== null
      ? variables[key]
      : '';
  });
};
