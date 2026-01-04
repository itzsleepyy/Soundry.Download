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
        // Use environment variable for API URL, fallback to localhost for development
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';

        return [
            {
                source: '/api/:path*',
                destination: `${apiUrl}/api/:path*`,
            },
        ]
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/status',
                permanent: false, // Temporary redirect while we fix issues
            },
        ]
    },
}

module.exports = nextConfig
