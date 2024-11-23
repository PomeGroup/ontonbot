// Helper function to convert Base64 to Blob
export const convertBase64ToBlob = (base64Data: string, mimeType: string): Blob => {
  const bstr = atob(base64Data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mimeType });
};
