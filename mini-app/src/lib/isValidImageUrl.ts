export const isValidImageUrl = (url: string): boolean => {
  // Define the regex pattern for the image URL validation
  const pattern = /^(https:\/\/)?.*\.(jpg|png|webp|gif|jpeg)$/i;
  return pattern.test(url);
};
