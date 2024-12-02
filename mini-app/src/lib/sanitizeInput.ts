import validator from "validator";

const sanitizeInput = (input: any) => {
  if (typeof input === "string") {
    return validator.escape(input);
  }
  return input; // Return the input as-is if it's not a string
};


export { sanitizeInput };
