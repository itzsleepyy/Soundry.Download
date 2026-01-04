'use client';

import Link from 'next/link';
import { AlertTriangle, Hammer, Heart, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function StatusPage() {
    return (
        <div className="container max-w-2xl mx-auto py-16 px-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Service Disruption</CardTitle>
                            <CardDescription>System Status Update</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>
                        We are currently experiencing availability issues across all services (YouTube, Spotify, SoundCloud).
                        Our systems are currently facing high traffic and automated detection hurdles.
                    </p>

                    <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 space-y-3">
                        <div className="flex items-start gap-3">
                            <Hammer className="h-4 w-4 mt-1 text-primary shrink-0" />
                            <p>
                                <span className="text-foreground font-medium">We are working on it.</span><br />
                                Our team is actively rotating infrastructure and implementing new workarounds to restore stability.
                                This is a cat-and-mouse game, but we are committed to winning it.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center p-6 border-t border-border/50">
                        <div className="text-center space-y-2">
                            <Heart className="h-8 w-8 mx-auto text-red-500 animate-pulse" />
                            <h3 className="text-foreground font-medium">Please don't go!</h3>
                            <p>
                                Bookmark this page (<kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Ctrl/Cmd + D</kbd>)
                                and check back soon. We aren't going anywhere.
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end border-t border-border/50 pt-6">
                    <Link href="/status">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.reload()}>
                            <RefreshCcw className="h-4 w-4" />
                            Check Again
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
