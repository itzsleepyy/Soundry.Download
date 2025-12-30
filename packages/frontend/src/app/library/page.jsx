'use client';
import { useState, useEffect, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSessionToken } from '../../components/SessionInit';
import { Loader2, Download, ExternalLink } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="global">Global Stream</TabsTrigger>
                    <TabsTrigger value="session">My Session</TabsTrigger>
                </TabsList>

                <TabsContent value="global" className="mt-6">
                    <GlobalLibrary />
                </TabsContent>
                <TabsContent value="session" className="mt-6">
                    <SessionLibrary />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function GlobalLibrary() {
    const { data, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/library/global?pageSize=50`, fetcher, { refreshInterval: 5000 });

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

    return <TracksTable tracks={tracks} />;
}

function SessionLibrary() {
    const { data, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/library/session`, fetcher, { refreshInterval: 3000 });

    if (error) return <Alert variant="destructive"><AlertDescription>Failed to load your session.</AlertDescription></Alert>;
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

    const items = data?.items || [];
    const tracks = items.map(item => ({
        ...item.track,
        sessionSource: item.source
    }));

    if (tracks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed text-muted-foreground">
                <p className="text-sm">No history found.</p>
                <Button variant="link" size="sm" className="mt-2" asChild>
                    <a href="/">Request a track</a>
                </Button>
            </div>
        );
    }

    return <TracksTable tracks={tracks} showStatus />;
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
                    {tracks.map(track => {
                        const isExpired = track.expiresAt && new Date(track.expiresAt) < new Date();
                        const timeRemaining = track.expiresAt ? formatDistanceToNow(new Date(track.expiresAt)) : '-';
                        const provider = track.provider.includes(':') ? track.provider.split(':')[0] : track.provider;

                        return (
                            <TableRow key={track.id} className={isExpired ? "opacity-50" : ""}>
                                <TableCell>
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
                                        {track.status === 'failed' && <Badge variant="destructive" className="font-normal text-xs" >Failed</Badge>}
                                    </TableCell>
                                )}
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                    {isExpired ? 'Expired' : `${timeRemaining}`}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {track.status === 'completed' && !isExpired && track.files ? (
                                            track.files.map(file => (
                                                <Button key={file.id} variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                                                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/download/${track.id}/${file.format}?token=${getSessionToken()}`}>
                                                        {file.format.toUpperCase()}
                                                    </a>
                                                </Button>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
