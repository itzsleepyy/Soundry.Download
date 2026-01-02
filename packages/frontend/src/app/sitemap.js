
export default function sitemap() {
    return [
        {
            url: 'https://soundry.download',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: 'https://soundry.download/library',
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.9,
        },
        // Documentation
        {
            url: 'https://soundry.download/docs',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: 'https://soundry.download/docs/how-it-works',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://soundry.download/docs/global-library',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://soundry.download/docs/playlists',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://soundry.download/docs/sessions-privacy',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://soundry.download/docs/limitations',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://soundry.download/docs/responsible-use',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://soundry.download/docs/faq',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        // Legal
        {
            url: 'https://soundry.download/legal',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];
}
