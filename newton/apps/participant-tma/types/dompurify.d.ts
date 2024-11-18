declare module 'dompurify' {
  const DOMPurify: {
    sanitize: (dirty: string, options?: any) => string;
    version: string;
    isSupported: boolean;
  };
  export default DOMPurify;
}
