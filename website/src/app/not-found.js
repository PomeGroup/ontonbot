"use client";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NotFound() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Check if the path matches '/ptma' or '/event' and redirect if necessary
        const targetDomain = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.onton.live';

        if (pathname.startsWith('/ptma') || pathname.startsWith('/event')) {
            const redirectUrl = `${targetDomain}`;
            window.location.href = redirectUrl;
        }
    }, [pathname, router]);

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
        </div>
    );
}
