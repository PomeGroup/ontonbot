// Helper function to validate MIME types
export const validateMimeType = (mimeType: string): boolean => {
    const allowedMimeTypes = [
        'image/jpeg', // JPG, JPEG
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',  // BMP
        'image/tiff', // TIFF
        'image/svg+xml', // SVG
        'image/x-icon'  // ICO
    ];
    return allowedMimeTypes.includes(mimeType);
};