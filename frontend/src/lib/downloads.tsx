import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { API } from './api';
import { toast } from 'sonner';

// Types
export interface Song {
    song_id: string; // Unique ID (often URL or generated)
    name: string;
    artist: string;
    url: string; // Source URL
    cover_url?: string;
}

export type DownloadStatus = 'QUEUED' | 'DOWNLOADING' | 'DOWNLOADED' | 'ERROR';

export interface DownloadItem {
    song: Song;
    status: DownloadStatus;
    progress: number; // 0-100
    message?: string; // Error message or status text
    web_download_url?: string; // Final direct download link
    timestamp: number;
}

interface DownloadContextType {
    queue: DownloadItem[];
    addToQueue: (url: string) => Promise<void>;
    removeFromQueue: (songId: string) => void;
    startDownload: (item: DownloadItem) => void;
    isSessionSong: (songId: string) => boolean;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

// Helper to create a new DownloadItem
const createDownloadItem = (song: Song): DownloadItem => ({
    song,
    status: 'QUEUED',
    progress: 0,
    timestamp: Date.now(),
});

export function DownloadProvider({ children }: { children: React.ReactNode }) {
    const [queue, setQueue] = useState<DownloadItem[]>([]);
    const sessionSongIds = useRef<Set<string>>(new Set());
    const ws = useRef<WebSocket | null>(null);

    // --- WebSocket Handling ---
    useEffect(() => {
        let reconnectTimer: NodeJS.Timeout;

        const connect = () => {
            try {
                const socket = API.ws_connect();
                ws.current = socket;

                socket.onopen = () => {
                    console.log("WebSocket Connected");
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        // data structure expected: { song: { song_id: ... }, progress: number, message: string }
                        if (data && data.song && data.song.song_id) {
                            updateItemProgress(data.song.song_id, data.progress, data.message);
                        }
                    } catch (e) {
                        console.error("Failed to parse WS message", e);
                    }
                };

                socket.onclose = () => {
                    console.log("WebSocket Disconnected, retrying...");
                    reconnectTimer = setTimeout(connect, 3000);
                };

                socket.onerror = (err) => {
                    console.error("WebSocket Error", err);
                    socket.close(); // Force close to trigger reconnect logic
                };

            } catch (e) {
                console.error("Failed to connect WS", e);
            }
        };

        connect();

        return () => {
            if (ws.current) ws.current.close();
            clearTimeout(reconnectTimer);
        };
    }, []);

    // --- Actions ---

    const updateItemProgress = useCallback((songId: string, progress: number, message?: string) => {
        setQueue((prev) => prev.map((item) => {
            if (item.song.song_id === songId) {
                const newItem = { ...item, progress };
                if (message) newItem.message = message;
                // Infer status from progress?? Or trust status updates?
                // Vue app relied on status flags. Let's infer for now or assume message updates status?
                // Usually we want explicit status. For now, progress > 0 implies downloading.
                if (item.status === 'QUEUED' && progress > 0) newItem.status = 'DOWNLOADING';
                return newItem;
            }
            return item;
        }));
    }, []);

    const updateItemStatus = useCallback((songId: string, status: DownloadStatus, extra: Partial<DownloadItem> = {}) => {
        setQueue(prev => prev.map(item => {
            if (item.song.song_id === songId) {
                return { ...item, status, ...extra };
            }
            return item;
        }));
    }, []);

    const addToQueue = async (url: string) => {
        url = url.trim();
        if (!url) return;

        // TODO: Handle SoundCloud/YouTube "Direct" logic if needed (client-side metadata extraction)
        // For now, call API.open to get metadata
        try {
            const res = await API.open(url);
            if (res.status === 200) {
                const data = res.data;
                // API.open can return a single song or array of songs (playlist)
                const songs: Song[] = Array.isArray(data) ? data : [data];

                const newItems = songs.map(song => {
                    sessionSongIds.current.add(song.song_id);
                    return createDownloadItem(song);
                });

                setQueue(prev => {
                    // Filter out duplicates based on song_id if desired, or allow multiples?
                    // Usually dedup by song_id
                    const existingIds = new Set(prev.map(i => i.song.song_id));
                    const distinctNew = newItems.filter(i => !existingIds.has(i.song.song_id));
                    return [...prev, ...distinctNew];
                });

                toast.success(`Added ${newItems.length} item(s) to queue`);

                // Auto-start downloads?
                // Vue app had `queue(song, false)` by default. So we just queue.
            }
        } catch (e: any) {
            console.error("Failed to open URL", e);
            toast.error(e.message || "Failed to resolve URL");
        }
    };

    const removeFromQueue = (songId: string) => {
        setQueue(prev => prev.filter(i => i.song.song_id !== songId));
        sessionSongIds.current.delete(songId); // Optional: remove from session tracking?
    };

    const startDownload = async (item: DownloadItem) => {
        if (item.status === 'DOWNLOADING') return;

        updateItemStatus(item.song.song_id, 'DOWNLOADING', { message: 'Starting...' });

        // Defaults - TODO: Get format from settings
        const format = "MP3";

        try {
            const res = await API.download(item.song.url, format.toLowerCase());
            if (res.status === 200) {
                const filename = res.data;
                updateItemStatus(item.song.song_id, 'DOWNLOADED', {
                    progress: 100,
                    message: 'Done',
                    web_download_url: API.downloadFileURL(filename)
                });
                toast.success(`${item.song.name} ready!`);
            } else {
                updateItemStatus(item.song.song_id, 'ERROR', { message: 'Download failed' });
            }
        } catch (e: any) {
            console.error("Download fail", e);
            updateItemStatus(item.song.song_id, 'ERROR', {
                message: e.response?.data?.message || e.message || 'Error'
            });
        }
    };

    const isSessionSong = (songId: string) => sessionSongIds.current.has(songId);

    return (
        <DownloadContext.Provider value={{ queue, addToQueue, removeFromQueue, startDownload, isSessionSong }}>
            {children}
        </DownloadContext.Provider>
    );
}

// Hook
export function useDownloadManager() {
    const context = useContext(DownloadContext);
    if (context === undefined) {
        throw new Error('useDownloadManager must be used within a DownloadProvider');
    }
    return context;
}
