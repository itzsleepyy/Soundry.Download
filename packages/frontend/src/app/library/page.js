'use client';
import { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSessionToken } from '../../components/SessionInit';
import { Loader2, Download, Clock, Headphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url) => {
    const token = getSessionToken();
    return fetch(url, {
        headers: { 'X-Session-Token': token || '' }
    }).then(res => res.json());
};

export default function Library() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <LibraryContent />
        </Suspense>
    );
}

function LibraryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('tab') === 'session' ? 'session' : 'global';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync state with URL but loosely
    useEffect(() => {
        const t = searchParams.get('tab');
        if (t && (t === 'global' || t === 'session')) setActiveTab(t);
    }, [searchParams]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        router.push(`/library?tab=${tab}`);
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-bold">Library</h1>

                {/* Tabs */}
                <div className="flex bg-surface rounded-lg p-1 border border-border">
                    <button
                        onClick={() => handleTabChange('global')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'global' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                    >
                        Global Stream
                    </button>
                    <button
                        onClick={() => handleTabChange('session')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'session' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                    >
                        My Session
                    </button>
                </div>
            </div>

            {activeTab === 'global' ? <GlobalLibrary /> : <SessionLibrary />}

        </div>
    );
}

function GlobalLibrary() {
    // Poll every 5s for global updates
    const { data, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/library/global?pageSize=50`, fetcher, { refreshInterval: 5000 });

    if (error) return <div className="text-red-500">Failed to load library</div>;
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const tracks = data?.tracks || [];

    if (tracks.length === 0) {
        return <div className="text-center py-12 text-text-muted">No active tracks in the last 24h. Be the first to request one!</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map(track => (
                <TrackCard key={track.id} track={track} />
            ))}
        </div>
    );
}

function SessionLibrary() {
    // Poll every 3s for status updates on processing jobs
    const { data, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/library/session`, fetcher, { refreshInterval: 3000 });

    if (error) return <div className="text-red-500">Failed to load session</div>;
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const items = data?.items || [];

    if (items.length === 0) {
        return <div className="text-center py-12 text-text-muted">You haven't requested or downloaded anything yet.</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-muted border-b border-border pb-2">Your History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <TrackCard key={item.id} track={item.track} sessionItem={item} />
                ))}
            </div>
        </div>
    );
}

function TrackCard({ track, sessionItem }) {
    if (!track) return null; // Should not happen

    const isExpired = track.expiresAt && new Date(track.expiresAt) < new Date();

    // Calculate time remaining
    const timeRemaining = track.expiresAt ? formatDistanceToNow(new Date(track.expiresAt)) : 'Unknown';

    return (
        <div className={`bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 group hover:border-text-muted/50 transition ${isExpired ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-white line-clamp-1" title={track.title}>{track.title}</h3>
                    <p className="text-sm text-text-muted line-clamp-1">{track.artist}</p>
                </div>
                {track.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {track.status === 'completed' && <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">Ready</span>}
                {track.status === 'failed' && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">Failed</span>}
            </div>

            <div className="text-xs text-text-muted flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {isExpired ? 'Expired' : `Expires in ${timeRemaining}`}
            </div>

            {sessionItem && (
                <div className="text-xs text-text-muted/50 uppercase tracking-wider">
                    {sessionItem.source}
                </div>
            )}

            <div className="mt-auto pt-2 flex flex-wrap gap-2">
                {track.status === 'completed' && !isExpired && track.files.map(file => (
                    <a
                        key={file.id}
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/download/${track.id}/${file.format}?token=${getSessionToken()}`} // Add token param or handle via header interception? 
                        // Note: Browsers normal links don't send custom headers nicely.
                        // We handled custom logic in API: "If token missing, still allow download, but do not record session item." 
                        // Wait, requirement: "When a download happens, the item is recorded... (session token)".
                        // If we can't send header via <a> tag, we must pass it in Query Param?
                        // API implementation `extractSession` middleware reads Header. It doesn't read Query param.
                        // I might need to update API to read query param OR uses onClick handler to fetch blob (harder for large files).
                        // EASIEST: Update API to also check query param `?token=`.
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm transition border border-white/5"
                    >
                        <Download className="w-3 h-3" />
                        <span className="uppercase">{file.format}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}
