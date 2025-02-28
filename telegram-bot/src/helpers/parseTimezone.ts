export const parseTimezone = timeZone => {
  // Check if the timezone is a standard IANA timezone or "UTC"
  try {
    Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
    return timeZone; // Valid IANA timezone or "UTC"
  } catch (e) {
    // If invalid, continue to check for GMT offset
  }

  // Check for "GMT+X" or "GMT-X" format
  const gmtOffsetMatch = timeZone.match(/^GMT([+-]\d{1,2})$/);
  if (gmtOffsetMatch) {
    // Parse the offset hours
    const offsetHours = parseInt(gmtOffsetMatch[1], 10);
    return { offsetHours, label: timeZone }; // Return the offset and label for display
  }

  throw new Error("Invalid timezone format");
};

