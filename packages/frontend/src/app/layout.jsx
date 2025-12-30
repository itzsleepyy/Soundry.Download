'use client';
import './globals.css';
import SessionInit from '../components/SessionInit';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

import Footer from '../components/Footer';

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            {/* Force Inter font loading if relying on Google Fonts or System fonts */}
            <head>
                <style>{`
            :root { --font-inter: 'Inter', system-ui, sans-serif; }
          `}</style>
            </head>
            <body className="min-h-screen bg-black font-sans antialiased text-foreground selection:bg-primary/20">
                <SessionInit />

                {/* Main Content Wrapper - Relative z-10 to cover sticky footer */}
                <div className="relative z-10 bg-background min-h-screen shadow-2xl border-b border-border/50 flex flex-col">
                    <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-50">
                        <div className="flex h-14 items-center px-4 md:px-8 max-w-5xl mx-auto justify-between">
                            <div className="flex items-center gap-6">
                                <Link href="/" className="font-semibold text-sm tracking-tight hover:text-primary/80 transition-colors">
                                    Soundry
                                </Link>
                            </div>

                            <nav className="flex items-center gap-2">
                                <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                                    <Link href="/">Request</Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                                    <Link href="/library">Library</Link>
                                </Button>
                            </nav>
                        </div>
                    </header>

                    <main className="max-w-5xl w-full mx-auto p-4 md:p-8 flex-1">
                        {children}
                    </main>

                    {/* Bottom spacer to allow comfortable scrolling before reveal */}
                    <div className="h-20 bg-background"></div>
                </div>

                {/* Sticky Reveal Footer */}
                <Footer />

                <Toaster />
            </body>
        </html>
    )
}
