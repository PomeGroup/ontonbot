/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'telegra.ph',
            },
        ],
    },
}

module.exports = nextConfig
