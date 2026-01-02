import './globals.css';
import SessionInit from '@/components/SessionInit';
import { Toaster } from '@/components/ui/sonner';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://soundry.download'),
  title: {
    default: 'Soundry | Free Spotify, SoundCloud & YouTube Audio Downloader',
    template: '%s | Soundry',
  },
  description:
    'Soundry is a free audio downloader for Spotify, SoundCloud, and YouTube. Convert links to high-quality MP3, FLAC, and WAV files instantly.',
  keywords: [
    'spotify downloader',
    'spotify to mp3',
    'soundcloud downloader',
    'youtube to mp3',
    'audio converter',
    'flac downloader',
    'youtube music downloader',
    'spotify playlist downloader',
  ],
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
    description:
      'Download high-quality audio from Spotify, SoundCloud, and YouTube in MP3, FLAC, and WAV formats.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Soundry Audio Downloader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soundry | Free Spotify, SoundCloud & YouTube Audio Downloader',
    description:
      'Download high-quality audio from Spotify, SoundCloud, and YouTube in MP3, FLAC, and WAV formats.',
    creator: '@soundry',
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
      {/* ✅ JSON-LD structured data (SEO) */}
      <Script id="json-ld-layout" strategy="beforeInteractive">
        {`
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "name": "Soundry",
                "url": "https://soundry.download",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://soundry.download/library?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@type": "Organization",
                "name": "Soundry",
                "url": "https://soundry.download",
                "logo": "https://soundry.download/favicon.png",
                "sameAs": []
              }
            ]
          }
        `}
      </Script>

      {/* ✅ Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-DMZBHNT9SL"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DMZBHNT9SL');
        `}
      </Script>

      <head>
        <style>{`
          :root { --font-inter: 'Inter', system-ui, sans-serif; }
        `}</style>
      </head>

      <body className="min-h-screen bg-black font-sans antialiased text-foreground selection:bg-primary/20">
        <SessionInit />

        {children}

        <Toaster />
      </body>
    </html>
  );
}