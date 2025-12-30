/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        // serverActions: true, // Default in 14
    },
    images: {
        domains: [],
    },
}

module.exports = nextConfig
