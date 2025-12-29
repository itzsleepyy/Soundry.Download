import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDownloadManager } from '@/lib/downloads';
import { API } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Library,
    Search,
    Grid3X3,
    List as ListIcon,
    RefreshCw,
    Download as DownloadIcon,
    Trash2,
    Music
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface FileItem {
    name: string;
    size: number;
    timestamp: number;
    image?: string;
}

// --- Components ---

function LibraryTab() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await API.listDownloads();
            // Handle both string[] (old API) and object[] (new API)
            const data = res.data || [];
            const parsed = data.map((f: any) => {
                if (typeof f === 'string') return { name: f, size: 0, timestamp: 0 };
                return f;
            });
            setFiles(parsed);
        } catch (e) {
            toast.error("Failed to load library");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleDelete = async (filename: string) => {
        if (!confirm(`Delete ${filename}?`)) return;
        try {
            await API.deleteDownload(filename);
            setFiles(prev => prev.filter(f => f.name !== filename));
            toast.success("Deleted file");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    // Filter & Sort
    const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    // TODO: Add sort dropdown

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-xl border backdrop-blur-sm">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search library..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchFiles} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <div className="w-px h-6 bg-border mx-2" />
                    <div className="flex bg-muted/50 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 && !loading ? (
                <div className="text-center py-20 opacity-50">
                    <Library className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">Library is empty</h3>
                    <p className="text-sm">Downloaded files will appear here.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-2"}>
                    {filtered.map(file => (
                        <FileCard
                            key={file.name}
                            file={file}
                            viewMode={viewMode}
                            onDelete={() => handleDelete(file.name)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function FileCard({ file, viewMode, onDelete }: { file: FileItem, viewMode: 'grid' | 'list', onDelete: () => void }) {
    const downloadUrl = API.downloadFileURL(file.name);

    if (viewMode === 'list') {
        return (
            <div className="group flex items-center justify-between p-3 bg-card/40 hover:bg-card/80 border rounded-lg transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 rounded bg-secondary/20 flex items-center justify-center text-secondary-foreground">
                        <Music className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.timestamp).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={downloadUrl} download target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-green-500">
                            <DownloadIcon className="h-4 w-4" />
                        </Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative aspect-square bg-card/40 border rounded-xl overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/5">
                <Music className="h-12 w-12 text-muted-foreground/20 group-hover:text-primary/20 transition-colors" />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-center gap-3 mb-2">
                    <a href={downloadUrl} download target="_blank" rel="noreferrer" className="bg-white/90 text-black p-2 rounded-full hover:scale-110 transition-transform">
                        <DownloadIcon className="h-4 w-4" />
                    </a>
                    <button onClick={onDelete} className="bg-red-500/90 text-white p-2 rounded-full hover:scale-110 transition-transform">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 bg-card/90 border-t backdrop-blur-sm">
                <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
        </div>
    );
}

// --- Main Page Component ---

export function Downloads() {
    const [activeTab, setActiveTab] = useState("session");
    const { queue, isSessionSong } = useDownloadManager();

    const sessionCount = queue.filter(item => isSessionSong(item.song.song_id)).length;

    return (
        <div className="container mx-auto px-4 max-w-6xl py-8">
            {/* Custom Tabs Header */}
            <div className="flex items-center gap-6 mb-8 border-b pb-0">
                <button
                    onClick={() => setActiveTab("session")}
                    className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === "session" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <div className="flex items-center gap-2">
                        Session
                        {sessionCount > 0 && <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-xs">{sessionCount}</Badge>}
                    </div>
                    {activeTab === "session" && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("library")}
                    className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === "library" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <div className="flex items-center gap-2">
                        Library
                    </div>
                    {activeTab === "library" && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'session' ? (
                    <div className="p-10 text-center border rounded-xl border-dashed">
                        <p className="text-muted-foreground">Session View (Coming Soon)</p>
                        <p className="text-sm text-muted-foreground/50 mt-2">Displaying {sessionCount} active items...</p>
                        {/* Reuse FileList style or QueueItems here */}
                        <div className="mt-4 flex flex-col gap-2 max-w-md mx-auto">
                            {queue.filter(i => isSessionSong(i.song.song_id)).map(item => (
                                <div key={item.song.song_id} className="text-left bg-card p-2 rounded border text-sm">
                                    {item.song.name} - {item.status} ({Math.round(item.progress)}%)
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <LibraryTab />
                )}
            </div>
        </div>
    );
}
