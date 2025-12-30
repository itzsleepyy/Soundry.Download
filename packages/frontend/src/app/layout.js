import { Inter } from 'next/font/google'
import './globals.css'
import SessionInit from '../components/SessionInit'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
    title: 'Soundry - Ephemeral Media Library',
    description: 'Download and preserve music for 24 hours.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <SessionInit />
                <div className="min-h-screen flex flex-col">
                    <header className="border-b border-border py-4 px-6 bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
                        <div className="max-w-6xl mx-auto flex items-center justify-between">
                            <a href="/" className="text-2xl font-bold tracking-tight">Soundry.</a>
                            <nav className="flex gap-6 text-sm font-medium">
                                <a href="/" className="hover:text-primary transition">Request</a>
                                <a href="/library" className="hover:text-primary transition">Library</a>
                            </nav>
                        </div>
                    </header>
                    <main className="flex-1">
                        {children}
                    </main>
                    <footer className="py-6 text-center text-text-muted text-sm border-t border-border">
                        <p>© {new Date().getFullYear()} Soundry.</p>
                        <p className="mt-2"><a href="/legal" className="underline hover:text-text">Legal & Terms</a></p>
                    </footer>
                </div>
            </body>
        </html>
    )
}
