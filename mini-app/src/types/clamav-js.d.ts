declare module 'clamav.js' {
    interface ClamAVScanResult {
        isClean(): boolean;
    }

    export function ping(
        port: number,
        host: string,
        timeout: number,
        callback: (err: Error | null, alive: boolean) => void
    ): void;

    export function scan(
        buffer: Buffer,
        port: number,
        host: string,
        callback: (err: Error | null, object: any, malicious: boolean) => void
    ): void;
}
