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

    return (
        <div className="max-w-2xl mx-auto mt-20 md:mt-32 px-2">
            <div className="space-y-8">
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
                    <p className="text-xs text-muted-foreground/70">
                        Files are processed in approximately 30 seconds and are available for 24 hours.
                    </p>
                </div>
            </div>
        </div>
    )
}
