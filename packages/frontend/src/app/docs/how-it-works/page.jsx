export default function HowItWorksPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">How Soundry Works</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Understanding the pipeline from request to download.
                </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">1. Requesting Audio</h2>
                    <p>
                        When you enter a Spotify link (track or playlist), Soundry doesn't download directly from Spotify (which is encrypted).
                        Instead, it extracts the metadata—Artist, Title, Album, and Duration—and uses this to search for the best match on YouTube Music or YouTube.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">2. Processing & Matching</h2>
                    <p>
                        Our "Resolver" engine looks for official audio, official music videos, and high-quality lyric videos.
                        It strictly filters results to ensure the duration matches the original track to avoid bad rips or DJ mixes.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">3. Formatting</h2>
                    <p>
                        Once the source audio is downloaded, it is converted to your desired format:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li><strong>MP3 (320kbps):</strong> Best for compatibility with all devices and software.</li>
                        <li><strong>WAV:</strong> Lossless uncompressed audio for maximum quality editing.</li>
                        <li><strong>FLAC:</strong> Lossless compressed audio (smaller than WAV, same quality).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Processing Time</h2>
                    <p>
                        Single tracks usually take 5-15 seconds. Large playlists are processed by multiple workers in parallel,
                        but total time depends on the queue length and the size of the playlist.
                    </p>
                </section>
            </div>
        </div>
    )
}
