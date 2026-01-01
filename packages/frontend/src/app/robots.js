
export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/api/', // Discourage API crawling
        },
        sitemap: 'https://soundry.download/sitemap.xml',
    };
}
