'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionToken } from '../components/SessionInit';
import { MoveRight, Loader2, Link as LinkIcon, Music2 } from 'lucide-react';

export default function Home() {
    const [url, setUrl] = useState('');
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
                formats: ['mp3', 'flac'] // Default formats for now, or add UI selector
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

            // Redirect to library on success
            router.push('/library?tab=session');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-12">

            {/* Hero */}
            <div className="text-center space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    Soundry.
                </h1>
                <p className="text-xl text-text-muted">
                    Ephemeral media library. Download high-quality audio from <span className="text-white">YouTube</span>, <span className="text-white">SoundCloud</span>, and more.
                    Files vanish in <span className="text-primary">24 hours</span>.
                </p>
            </div>

            {/* Input Form */}
            <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative flex items-center bg-surface border border-border rounded-full p-2 pl-6 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition shadow-xl">
                        <LinkIcon className="w-5 h-5 text-text-muted mr-3" />
                        <input
                            type="url"
                            placeholder="Paste a link to a song..."
                            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-text-muted/50 py-2"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-hover text-white rounded-full p-3 px-6 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get <MoveRight className="w-4 h-4" /></>}
                        </button>
                    </div>
                </form>
                {error && (
                    <div className="mt-4 text-center text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/20 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-center text-sm text-text-muted animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
                <div className="p-4 rounded-2xl bg-surface/50 border border-border hover:border-text-muted/30 transition">
                    <div className="mb-2 text-primary flex justify-center"><Music2 className="w-6 h-6" /></div>
                    <strong className="block text-white mb-1">High Quality</strong>
                    MP3 320kbps, FLAC, WAV.
                </div>
                <div className="p-4 rounded-2xl bg-surface/50 border border-border hover:border-text-muted/30 transition">
                    <div className="mb-2 text-primary flex justify-center text-xl font-bold">24h</div>
                    <strong className="block text-white mb-1">Ephemeral Storage</strong>
                    All files deleted automatically.
                </div>
                <div className="p-4 rounded-2xl bg-surface/50 border border-border hover:border-text-muted/30 transition">
                    <div className="mb-2 text-primary flex justify-center text-xl">🔒</div>
                    <strong className="block text-white mb-1">Private Sessions</strong>
                    No accounts. Browser-based identity.
                </div>
            </div>

        </div>
    )
}
