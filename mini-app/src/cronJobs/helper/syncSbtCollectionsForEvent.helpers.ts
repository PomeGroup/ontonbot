/**
 * Helper to produce singular/plural message lines, prefixed with 🔴 if count > 0 or 🟢 if 0.
 */
export const formatCountMessage = (count: number, singular: string, plural: string): string => {
  const indicator = count > 0 ? "🔴" : "🟢";
  if (count === 0) return `${indicator} No ${plural}`;
  if (count === 1) return `${indicator} 1 ${singular}`;
  return `${indicator} ${count} ${plural}`;
};

/**
 * Escapes commas, quotes, newlines, etc. for CSV usage.
 * If the value contains any of those chars, it will be wrapped in quotes ("...").
 */
export const csvEscape = (value: any): string => {
  if (value == null) {
    return "";
  }
  const str = String(value);
  // If the string has a comma, quote, or newline, we wrap it in double quotes and escape inner quotes
  if (/[",\r\n]/.test(str)) {
    // Escape any existing quotes by doubling them
    let escaped = str.replace(/"/g, '""');
    // Wrap the entire field in quotes
    return `"${escaped}"`;
  }
  return str;
};
