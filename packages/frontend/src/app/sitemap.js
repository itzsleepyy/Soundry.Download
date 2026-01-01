
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
            priority: 0.8,
        },
        // We'll add legal pages if they exist, otherwise placeholder for now
        // {
        //     url: 'https://soundry.download/legal/privacy',
        //     lastModified: new Date(),
        //     changeFrequency: 'monthly',
        //     priority: 0.5,
        // },
    ];
}
