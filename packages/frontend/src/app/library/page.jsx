'use client';
import { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSessionToken } from '../../components/SessionInit';
import { Loader2, Download, ExternalLink, SearchIcon, ChevronDown, ChevronRight, Archive, FolderArchive, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { ButtonGroup } from "@/components/ui/button-group"
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const fetcher = (url) => {
    const token = getSessionToken();
    return fetch(url, {
        headers: { 'X-Session-Token': token || '' }
    }).then(res => res.json());
};

export default function Library() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}>
            <LibraryContent />
        </Suspense>
    );
}

function LibraryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('tab') === 'session' ? 'session' : 'global';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const t = searchParams.get('tab');
        if (t && (t === 'global' || t === 'session')) setActiveTab(t);
    }, [searchParams]);

    const handleTabChange = (val) => {
        setActiveTab(val);
        router.push(`/library?tab=${val}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold tracking-tight">Library</h1>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="global">Global Stream</TabsTrigger>
                        <TabsTrigger value="session">My Session</TabsTrigger>
                    </TabsList>

                    <div className="w-full md:w-auto">
                        <ButtonGroup>
                            <Input
                                type="search"
                                placeholder="Search..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-9 w-full md:w-[250px]"
                            />
                            <Button variant="outline" size="icon" className="h-9 w-9 px-0" aria-label="Search">
                                <SearchIcon className="h-4 w-4" />
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>

                <TabsContent value="global" className="mt-6">
                    <GlobalLibrary query={query} />
                </TabsContent>
                <TabsContent value="session" className="mt-6">
                    <SessionLibrary query={query} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function GlobalLibrary({ query }) {
    const { data, error, isLoading } = useSWR(
        `${process.env.NEXT_PUBLIC_API_URL}/api/library/global?pageSize=50${query ? `&q=${encodeURIComponent(query)}` : ''}`,
        fetcher,
        { refreshInterval: 5000 }
    );

    if (error) return <Alert variant="destructive"><AlertDescription>Failed to load global library.</AlertDescription></Alert>;
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

    const tracks = data?.tracks || [];

    if (tracks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed text-muted-foreground">
                <p className="text-sm">No active tracks.</p>
                <p className="text-xs pt-1">Be the first to request something.</p>
            </div>
        );
    }

    // Global Library uses the simple flat TracksTable
    return <TracksTable tracks={tracks} />;
}

function SessionLibrary({ query }) {
    const { data, error, isLoading, mutate } = useSWR(
        `${process.env.NEXT_PUBLIC_API_URL}/api/library/session${query ? `?q=${encodeURIComponent(query)}` : ''}`,
        fetcher,
        { refreshInterval: 3000 }
    );

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this item?')) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/library/session/${id}`, {
                method: 'DELETE',
                headers: { 'X-Session-Token': getSessionToken() }
            });
            mutate(); // Refresh the list
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    if (error) return <Alert variant="destructive"><AlertDescription>Failed to load your session.</AlertDescription></Alert>;
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

    const items = data?.items || [];

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed text-muted-foreground">
                <p className="text-sm">No history found.</p>
                <Button variant="link" size="sm" className="mt-2" asChild>
                    <a href="/">Request a track</a>
                </Button>
            </div>
        );
    }

    // Grouping Logic
    const groupedData = items.reduce((acc, item) => {
        if (item.groupId) {
            if (!acc.groups[item.groupId]) {
                acc.groups[item.groupId] = {
                    type: 'group',
                    id: item.groupId,
                    groupData: item.group,
                    items: []
                };
            }
            acc.groups[item.groupId].items.push(item);
        } else {
            acc.singles.push({ type: 'item', item });
        }
        return acc;
    }, { groups: {}, singles: [] });

    // Combine and sort
    const entries = [
        ...Object.values(groupedData.groups),
        ...groupedData.singles
    ].sort((a, b) => {
        const dateA = a.type === 'group' ? new Date(a.groupData?.createdAt || 0) : new Date(a.item.createdAt);
        const dateB = b.type === 'group' ? new Date(b.groupData?.createdAt || 0) : new Date(b.item.createdAt);
        return dateB - dateA; // Descending
    });

    return <SessionTable entries={entries} onDelete={handleDelete} />;
}

function TracksTable({ tracks, showStatus = false }) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[350px]">Track</TableHead>
                        <TableHead>Provider</TableHead>
                        {showStatus && <TableHead>Status</TableHead>}
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Download</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tracks.map(track => (
                        <TrackRow key={track.id} track={track} showStatus={showStatus} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function SessionTable({ entries, onDelete }) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[350px]">Track / Playlist</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Download</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map(entry => {
                        if (entry.type === 'group') {
                            return <SessionGroupRow key={entry.id} groupEntry={entry} onDelete={onDelete} />;
                        } else {
                            return <TrackRow key={entry.item.id} track={entry.item.track} showStatus={true} itemId={entry.item.id} onDelete={onDelete} />;
                        }
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function SessionGroupRow({ groupEntry }) {
    const [expanded, setExpanded] = useState(false);
    const { groupData, items } = groupEntry;

    // Calculate progress
    const total = groupData.totalTracks;
    const isFiltered = items.length < total;

    const completed = items.filter(i => i.track.status === 'completed').length;
    const failed = items.filter(i => i.track.status === 'failed').length;

    // If filtered, we can't show valid "Total Progress" for the group, only for the visible items.
    // But the user might want to know if the WHOLE group is done.
    // However, we only have data for `items` (which are the filtered ones).
    // So we can only show progress for the *visible* items.
    const displayTotal = isFiltered ? items.length : total;
    const progress = displayTotal > 0 ? ((completed + failed) / displayTotal) * 100 : 0;

    return (
        <>
            <TableRow className="cursor-pointer bg-muted/30 hover:bg-muted/50" onClick={() => setExpanded(!expanded)}>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <ChevronRight className={cn("h-4 w-4 transition-transform text-muted-foreground", expanded && "rotate-90")} />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm flex items-center gap-2">
                                <FolderArchive className="h-3 w-3 text-muted-foreground" />
                                {groupData.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {isFiltered ? `Found ${items.length} tracks` : `${total} Tracks`}
                            </span>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">Spotify Playlist</TableCell>
                <TableCell>
                    {progress === 100 && completed > 0 ? (
                        <Badge variant="secondary" className="font-normal text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20">Ready</Badge>
                    ) : (
                        <div className="space-y-1 w-[120px]">
                            <div className="flex justify-between text-xs">
                                <span>{completed + failed}/{displayTotal}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                    -
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <GroupDownloadActions groupId={groupData.id} isDisabled={completed === 0} />
                </TableCell>
            </TableRow>
            {expanded && items.map(item => (
                <TrackRow key={item.id} track={item.track} showStatus={true} isChild itemId={item.id} onDelete={onDelete} />
            ))}
        </>
    );
}

function GroupDownloadActions({ groupId, isDisabled }) {
    const [selectedFormat, setSelectedFormat] = useState('mp3');
    const formats = ['mp3', 'flac', 'wav', 'opus', 'ogg'];

    if (isDisabled) return <span className="text-muted-foreground text-xs">-</span>;

    return (
        <div className="flex justify-end">
            <ButtonGroup>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-normal border-r-0 rounded-r-none px-3">
                            {selectedFormat.toUpperCase()} <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {formats.map(f => (
                            <DropdownMenuItem
                                key={f}
                                onClick={() => setSelectedFormat(f)}
                                className="text-xs"
                            >
                                {f.toUpperCase()}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" className="h-8 px-2 rounded-l-none border-l-0" asChild>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/download-group/${groupId}?format=${selectedFormat}&token=${getSessionToken()}`}>
                        <Archive className="h-4 w-4" />
                    </a>
                </Button>
            </ButtonGroup>
        </div>
    );
}

function TrackRow({ track, showStatus, isChild = false, itemId, onDelete }) {
    const isExpired = track.expiresAt && new Date(track.expiresAt) < new Date();
    const timeRemaining = track.expiresAt ? formatDistanceToNow(new Date(track.expiresAt)) : '-';

    // Normalize provider display
    const rawProvider = track.provider || 'youtube';
    const provider = rawProvider.includes(':') ? rawProvider.split(':')[0] : rawProvider;

    return (
        <TableRow className={cn(isExpired ? "opacity-50" : "", isChild && "bg-muted/10")}>
            <TableCell className={cn(isChild && "pl-10")}>
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium truncate max-w-[300px] text-sm">{track.title}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[300px]">{track.artist}</span>
                </div>
            </TableCell>
            <TableCell className="capitalize text-muted-foreground text-sm">{provider}</TableCell>
            {showStatus && (
                <TableCell>
                    {track.status === 'processing' && <Badge variant="outline" className="gap-1 font-normal text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Processing</Badge>}
                    {track.status === 'completed' && <Badge variant="secondary" className="font-normal text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20">Ready</Badge>}
                    {track.status === 'failed' && (
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <Badge variant="destructive" className="font-normal text-xs cursor-help">Failed</Badge>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold">Processing Failed</h4>
                                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md font-mono text-xs break-all">
                                        {track.error || "Unknown error"}
                                    </p>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    )}
                </TableCell>
            )}
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {isExpired ? 'Expired' : `${timeRemaining}`}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2 items-center">
                    {track.status === 'completed' && !isExpired ? (
                        <DownloadActions track={track} />
                    ) : track.status === 'failed' && onDelete && itemId ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(itemId)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

function DownloadActions({ track }) {
    if (!track.files || track.files.length === 0) return <span className="text-muted-foreground text-xs">-</span>;

    // Default to mp3 or the first available
    const [selectedFormat, setSelectedFormat] = useState(() => {
        const hasMp3 = track.files.find(f => f.format === 'mp3');
        return hasMp3 ? 'mp3' : track.files[0].format;
    });

    const currentFile = track.files.find(f => f.format === selectedFormat);

    // Fallback
    if (!currentFile && track.files.length > 0) {
        setSelectedFormat(track.files[0].format);
    }

    return (
        <div className="flex justify-end">
            <ButtonGroup>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-normal border-r-0 rounded-r-none px-3">
                            {selectedFormat.toUpperCase()} <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {track.files.map(file => (
                            <DropdownMenuItem
                                key={file.id}
                                onClick={() => setSelectedFormat(file.format)}
                                className="text-xs"
                            >
                                {file.format.toUpperCase()}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" className="h-8 px-2 rounded-l-none border-l-0" asChild>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/download/${track.id}/${selectedFormat}?token=${getSessionToken()}`}>
                        <Download className="h-4 w-4" />
                    </a>
                </Button>
            </ButtonGroup>
        </div>
    );
}
