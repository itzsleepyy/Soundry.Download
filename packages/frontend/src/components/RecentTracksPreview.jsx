'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Music2 } from 'lucide-react';

export default function RecentTracksPreview() {
    const [recentTracks, setRecentTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                // Determine API URL (client-side)
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const res = await fetch(`${apiUrl}/api/library/global`);
                if (res.ok) {
                    const data = await res.json();
                    // Take up to 30 tracks to allow for scrolling
                    setRecentTracks((data.tracks || []).slice(0, 30));
                }
            } catch (error) {
                console.error("Failed to fetch recent tracks", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecent();
    }, []);

    if (loading) return <div className="text-xs text-muted-foreground animate-pulse">Loading recent tracks...</div>;
    if (recentTracks.length === 0) return <div className="text-xs text-muted-foreground">No recent tracks yet.</div>;

    return (
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-8">
            <div className="space-y-1">
                {recentTracks.map((item) => (
                    <div key={item.id} className="flex items-center justify-between group py-1 text-sm text-foreground/80 hover:text-foreground transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Music2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[200px] sm:max-w-[300px]">
                                {item.artist} - {item.title}
                            </span>
                        </div>

                        {/* Simple download link if available, or just a generic arrow to library if we want them to go there? 
                            The user said "Download action". 
                            We can link to the download endpoint directly if we have the format. 
                            But usually tracks have multiple formats. 
                            Maybe just link to the library? 
                            "Global Library must be a clickable link" was for the secondary text. 
                            For the preview, "Download action". 
                            Since we don't have a format selector here, maybe we just provide a direct MP3 link or link to library?
                            Let's try to link to the library global tab but highlight this track? 
                            Or just a fast download of MP3 default.
                        */}
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || ''}/api/download/${item.id}/mp3`}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download MP3"
                        >
                            <Download className="h-3 w-3" />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
