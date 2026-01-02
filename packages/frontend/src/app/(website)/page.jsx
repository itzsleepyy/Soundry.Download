'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionToken } from '@/components/SessionInit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Typewriter from '@/components/fancy/text/typewriter';
import RecentTracksPreview from '@/components/RecentTracksPreview';
import Link from 'next/link';


export default function Home() {
    const [url, setUrl] = useState('');
    const exampleUrls = [
        "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
        "https://soundcloud.com/futureisnow/mask-off",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
    ];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError('');

        const token = getSessionToken();
        if (!token) {
            setError('Session initialization failed. Please refresh.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                url,
                formats: ['mp3', 'flac', 'wav']
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': token
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit job');
            }

            toast.success("Request received", {
                description: "Your audio is being processed."
            });

            // Redirect to library
            router.push('/library?tab=session');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Soundry',
        url: 'https://soundry.download',
        description: 'Download high-quality audio from Spotify, SoundCloud, and YouTube.',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-start gap-16 mt-8 px-8">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />

                {/* Main Content - Left Column */}
                <div className="max-w-2xl w-full space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-lg font-semibold tracking-tight">Request Audio</h1>
                        <p className="text-sm text-muted-foreground">
                            Paste a link from YouTube, SoundCloud, or Spotify.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="relative flex-1">
                            <Input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                className="w-full h-10 bg-background"
                                autoFocus
                            />
                            {!url && (
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-sm opacity-50 truncate w-[90%] font-normal">
                                    <Typewriter
                                        text={exampleUrls}
                                        speed={50}
                                        waitTime={2500}
                                        loop={true}
                                        cursorClassName="ml-0.5 opacity-50"
                                    />
                                </div>
                            )}
                        </div>
                        <Button type="submit" disabled={loading} className="h-10 px-6">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get"}
                        </Button>
                    </form>

                    <div className="flex justify-center">
                        <Link
                            href="/library?tab=global"
                            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors border-b border-transparent hover:border-muted-foreground/50 pb-0.5"
                        >
                            Or browse tracks already processed in the Global Library
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* SEO Content */}
                    <div className="pt-8 border-t border-border/50 space-y-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Soundry lets you download high-quality audio from <span className="text-foreground font-medium">Spotify</span>, <span className="text-foreground font-medium">SoundCloud</span>, and <span className="text-foreground font-medium">YouTube</span> in MP3, WAV, and FLAC formats. Tracks are processed rapidly and available for 24 hours.
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <ul className="space-y-1.5 list-disc pl-4 marker:text-primary/50">
                                <li>Download Spotify tracks to MP3, WAV, FLAC</li>
                                <li>Access audio from SoundCloud and YouTube</li>
                            </ul>
                            <ul className="space-y-1.5 list-disc pl-4 marker:text-primary/50">
                                <li>Files expire automatically after 24h</li>
                                <li>Instant downloads from Global Library</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column - Recent Downloads (hidden on mobile) */}
                <aside className="hidden lg:block w-80 shrink-0 h-[calc(100vh-8rem)]">
                    <div className="sticky top-24 h-full flex flex-col">
                        <h2 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Recent Downloads</h2>
                        <RecentTracksPreview />
                    </div>
                </aside>
            </div>
        </div>
    )
}
