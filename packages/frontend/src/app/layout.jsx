import './globals.css';
import SessionInit from '@/components/SessionInit';
import { Toaster } from '@/components/ui/sonner';
import Footer from '@/components/Footer'; // Footer needs to be here or inside (website)? 
// Original had Footer OUTSIDE the main div, using fixed positioning logic likely (Sticky Reveal).
// If I move Footer to (website), it will only show there. Docs won't have it. That's probably intended.
// But Footer uses z-index tricks. Let's see.

export const metadata = {
    metadataBase: new URL('https://soundry.download'),
    title: {
        default: 'Soundry | Free Spotify, SoundCloud & YouTube Audio Downloader',
        template: '%s | Soundry'
    },
    description: 'Download high-quality audio from Spotify, SoundCloud, and YouTube in MP3, FLAC, and WAV formats. No ads, free, and fast.',
    keywords: ['spotify downloader', 'spotify to mp3', 'soundcloud downloader', 'youtube to mp3', 'audio converter', 'lossless audio', 'flac downloader'],
    authors: [{ name: 'Soundry' }],
    creator: 'Soundry',
    publisher: 'Soundry',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://soundry.download',
        siteName: 'Soundry',
        title: 'Soundry | Free Spotify, SoundCloud & YouTube Audio Downloader',
        description: 'Download high-quality audio from Spotify, SoundCloud, and YouTube in MP3, FLAC, and WAV formats.',
        images: [
            {
                url: '/og-image.jpg', // Recommend user to add this later
                width: 1200,
                height: 630,
                alt: 'Soundry Audio Downloader',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Soundry | Free Spotify, SoundCloud & YouTube Audio Downloader',
        description: 'Download high-quality audio from Spotify, SoundCloud, and YouTube in MP3, FLAC, and WAV formats.',
        creator: '@soundry', // Placeholder
    },
    icons: {
        icon: [
            { url: '/favicon.png', media: '(prefers-color-scheme: light)' },
            { url: '/favicon-dark.png', media: '(prefers-color-scheme: dark)' },
        ],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <head>
                <style>{`
            :root { --font-inter: 'Inter', system-ui, sans-serif; }
          `}</style>
            </head>
            <body className="min-h-screen bg-black font-sans antialiased text-foreground selection:bg-primary/20">
                <SessionInit />

                {children}

                {/* Footer is tricky for Sticky Reveal. 
                    If it's global, Docs will have it. 
                    Let's render it here conditionally? No.
                    Ideally move Footer into (website) layout.
                    But user might want it on docs too? 
                    Docs usually have standard footer. 
                    Let's assume (website) layout handles Footer for main site.
                */}

                <Toaster />
            </body>
        </html>
    )
}
