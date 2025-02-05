declare module "clamav.js" {
  export function ping(
    _port: number,
    _host: string,
    _timeout: number,
    _callback: (_err: Error | null, _alive: boolean) => void
  ): void;

  export function scan(
    _buffer: Buffer,
    _port: number,
    _host: string,
    _callback: (_err: Error | null, _object: any, _malicious: boolean) => void
  ): void;
}
