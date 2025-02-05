export const isValidImageUrl = (url: string | null): boolean => {
  if (!url) return false;
  // Define the regex pattern for the image URL validation
  const pattern = /^(https:\/\/)?.*\.(jpg|png|webp|gif|jpeg|svg)$/i;
  return pattern.test(url);
};
