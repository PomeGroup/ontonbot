import validator from "validator";

export const sanitizeInput = (input: any) => {
  if (typeof input === "string") {
    return validator.escape(input);
  }
  return input; // Return the input as-is if it's not a string
};

// Utility to sanitize strings
export const sanitizeString = (input: any) => {
  if (typeof input === "string") {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  return input;
};

// Utility to sanitize objects recursively
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, sanitizeString(value)]));
  }
  return sanitizeString(obj);
};
