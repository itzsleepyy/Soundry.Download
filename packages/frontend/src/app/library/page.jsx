'use client';
import React, { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSessionToken } from '../../components/SessionInit';
import { Loader2, Download, ExternalLink, SearchIcon, ChevronDown, ChevronRight, Archive, FolderArchive, Trash2, XCircle, RefreshCw } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
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

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Soundry Global Library',
        description: 'Browse recently downloaded audio tracks from Spotify, SoundCloud, and YouTube.',
        url: 'https://soundry.download/library'
    };

    return (
        <div className="space-y-6">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="flex flex-col gap-1">
                <h1 className="text-lg font-semibold tracking-tight">Library</h1>
                <p className="text-sm text-muted-foreground">
                    Browse recent conversions from the community. Tracks are available for 24 hours.
                </p>
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
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const { data, error, isLoading } = useSWR(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/library/global?page=${page}&pageSize=${pageSize}${query ? `&q=${encodeURIComponent(query)}` : ''}`,
        fetcher,
        { refreshInterval: 5000 }
    );

    // Reset to page 1 when query changes
    useEffect(() => {
        setPage(1);
    }, [query]);

    if (error) return <Alert variant="destructive"><AlertDescription>Failed to load global library.</AlertDescription></Alert>;
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

    const tracks = data?.tracks || [];
    const pagination = data?.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 1 };

    if (tracks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed text-muted-foreground">
                <p className="text-sm">No tracks available yet.</p>
            </div>
        );
    }

    // Generate page numbers to display
    const generatePageNumbers = () => {
        const { page: currentPage, totalPages } = pagination;
        const pages = [];

        // Always show first page
        pages.push(1);

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) pages.push(i);
        }

        // Always show last page
        if (totalPages > 1 && !pages.includes(totalPages)) {
            pages.push(totalPages);
        }

        return pages.sort((a, b) => a - b);
    };

    const pageNumbers = generatePageNumbers();

    return <TracksTable tracks={tracks} pagination={pagination} currentPage={page} onPageChange={setPage} pageNumbers={pageNumbers} />;
}

function SessionLibrary({ query }) {
    const { data, error, isLoading, mutate } = useSWR(
        `${process.env.NEXT_PUBLIC_API_URL}/api/library/session${query ? `?q=${encodeURIComponent(query)}` : ''}`,
        fetcher,
        { refreshInterval: 3000 }
    );

    // State for confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState({ open: false, ids: [], title: '', isPlaylist: false });

    const openDeleteDialog = (ids, title, isPlaylist = false) => {
        setDeleteDialog({ open: true, ids: Array.isArray(ids) ? ids : [ids], title, isPlaylist });
    };

    const handleConfirmDelete = async () => {
        try {
            // Delete all items in the list
            await Promise.all(deleteDialog.ids.map(id =>
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/library/session/${id}`, {
                    method: 'DELETE',
                    headers: { 'X-Session-Token': getSessionToken() }
                })
            ));
            mutate(); // Refresh the list
        } catch (e) {
            console.error("Delete failed", e);
        } finally {
            setDeleteDialog({ open: false, ids: [], title: '', isPlaylist: false });
        }
    };

    const handleRetry = async (id) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/library/session/${id}/retry`, {
                method: 'POST',
                headers: { 'X-Session-Token': getSessionToken() }
            });
            mutate(); // Refresh the list
        } catch (e) {
            console.error("Retry failed", e);
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

    return (
        <>
            <SessionTable entries={entries} onDelete={openDeleteDialog} onRetry={handleRetry} />

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, ids: [], title: '', isPlaylist: false })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {deleteDialog.isPlaylist ? 'Cancel Playlist?' : 'Cancel Download?'}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteDialog.isPlaylist
                                ? `This will cancel all ${deleteDialog.ids.length} tracks in "${deleteDialog.title}". This action cannot be undone.`
                                : `This will cancel the download for "${deleteDialog.title}". This action cannot be undone.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, ids: [], title: '', isPlaylist: false })}>
                            Keep
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            {deleteDialog.isPlaylist ? 'Cancel Playlist' : 'Cancel Download'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function TracksTable({ tracks, showStatus = false, pagination, currentPage, onPageChange, pageNumbers }) {
    return (
        <div className="space-y-4">
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

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {tracks.length} of {pagination.total} tracks
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>

                            {pageNumbers.map((pageNum, idx) => {
                                // Show ellipsis if there's a gap
                                const prevPage = idx > 0 ? pageNumbers[idx - 1] : 0;
                                const showEllipsis = pageNum - prevPage > 1;

                                return (
                                    <React.Fragment key={pageNum}>
                                        {showEllipsis && (
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )}
                                        <PaginationItem>
                                            <PaginationLink
                                                onClick={() => onPageChange(pageNum)}
                                                isActive={currentPage === pageNum}
                                                className="cursor-pointer"
                                            >
                                                {pageNum}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </React.Fragment>
                                );
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => currentPage < pagination.totalPages && onPageChange(currentPage + 1)}
                                    className={currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}

function SessionTable({ entries, onDelete, onRetry }) {
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
                            return <SessionGroupRow key={entry.id} groupEntry={entry} onDelete={onDelete} onRetry={onRetry} />;
                        } else {
                            return <TrackRow key={entry.item.id} track={entry.item.track} showStatus={true} itemId={entry.item.id} onDelete={onDelete} onRetry={onRetry} />;
                        }
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function SessionGroupRow({ groupEntry, onDelete, onRetry }) {
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
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <div className="space-y-1 w-[120px] cursor-help">
                                    <div className="flex justify-between text-xs">
                                        <span>{completed + failed}/{displayTotal}</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64">
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold">Download Progress</div>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Completed:</span>
                                            <span className="text-green-500">{completed} tracks</span>
                                        </div>
                                        {failed > 0 && (
                                            <div className="flex justify-between">
                                                <span>Failed:</span>
                                                <span className="text-destructive">{failed} tracks</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Remaining:</span>
                                            <span>{displayTotal - completed - failed} tracks</span>
                                        </div>
                                        {completed > 0 && completed + failed < displayTotal && (
                                            <>
                                                <div className="border-t pt-1 mt-1" />
                                                <div className="flex justify-between font-medium">
                                                    <span>Est. Time Remaining:</span>
                                                    <span>{(() => {
                                                        // Calculate average time per completed track
                                                        const now = new Date();
                                                        const groupCreated = new Date(groupData.createdAt);
                                                        const elapsedMs = now - groupCreated;
                                                        const elapsedMin = elapsedMs / 1000 / 60;
                                                        const avgMinPerTrack = elapsedMin / completed;
                                                        const remaining = displayTotal - completed - failed;
                                                        const estMinRemaining = Math.ceil(avgMinPerTrack * remaining);

                                                        if (estMinRemaining < 1) return '< 1 min';
                                                        if (estMinRemaining === 1) return '~1 min';
                                                        if (estMinRemaining < 60) return `~${estMinRemaining} min`;
                                                        const hours = Math.floor(estMinRemaining / 60);
                                                        const mins = estMinRemaining % 60;
                                                        return `~${hours}h ${mins}m`;
                                                    })()}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                    -
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <GroupDownloadActions
                        groupId={groupData.id}
                        isReady={progress === 100 && completed > 0}
                        onDelete={() => onDelete(items.map(i => i.id), groupData.title, true)}
                    />
                </TableCell>
            </TableRow>
            {expanded && items.map(item => (
                <TrackRow key={item.id} track={item.track} showStatus={true} isChild itemId={item.id} onDelete={onDelete} onRetry={onRetry} />
            ))}
        </>
    );
}

function GroupDownloadActions({ groupId, isReady, onDelete }) {
    const [selectedFormat, setSelectedFormat] = useState('mp3');
    const formats = ['mp3', 'flac', 'wav'];

    if (!isReady) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete && typeof onDelete === 'function') onDelete();
                }}
                title="Cancel Playlist"
            >
                <XCircle className="h-4 w-4" />
            </Button>
        );
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
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/download-group/${groupId}?format=${selectedFormat}&token=${getSessionToken()}`} onClick={(e) => e.stopPropagation()}>
                        <Archive className="h-4 w-4" />
                    </a>
                </Button>
            </ButtonGroup>
        </div>
    );
}

function TrackRow({ track, showStatus, isChild = false, itemId, onDelete, onRetry }) {
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
                    ) : onDelete && itemId ? (
                        <>
                            {track.status === 'failed' && onRetry && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => onRetry(itemId)}
                                    title="Retry Download"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(itemId, track.title, false)} title={track.status === 'failed' || track.status === 'cancelled' ? "Remove" : "Cancel"}>
                                {track.status === 'failed' || track.status === 'cancelled' ? <Trash2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                        </>
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
