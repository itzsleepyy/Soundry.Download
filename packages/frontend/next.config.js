/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        // serverActions: true, // Default in 14
    },
    images: {
        domains: [],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3334/api/:path*', // Proxy to Backend
            },
        ]
    },
}

module.exports = nextConfig
