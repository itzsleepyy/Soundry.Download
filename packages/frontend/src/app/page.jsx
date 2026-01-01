'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionToken } from '../components/SessionInit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Typewriter from '../components/fancy/text/typewriter';
import RecentTracksPreview from '../components/RecentTracksPreview';
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
        <div className="max-w-2xl mx-auto mt-20 md:mt-32 px-2">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent pb-1">
                        Soundry
                    </h1>
                    <p className="text-muted-foreground text-lg font-light leading-relaxed">
                        Soundry allows you to download audio from cloud music sources like Spotify, SoundCloud, and YouTube in MP3, WAV, and FLAC formats. Tracks processed by other users appear in the Global Library for instant download.
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

                {/* Minimal explainer / disclaimer */}
                <div className="pt-8 border-t border-border/50">
                    <div className="mb-6">
                        <RecentTracksPreview />
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                        Tracks processed by other users remain available in the Global Library for 24 hours.
                    </p>
                </div>
            </div>
        </div>
    )
}
