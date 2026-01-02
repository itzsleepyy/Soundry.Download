export default function LimitationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Limitations & Expectations</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Known constraints and edge cases.
                </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">Processing Limits</h2>
                    <p>
                        To ensure fair usage for everyone, we may limit the number of active downloads per user or the total size of a playlist.
                        Currently, playlists are processed in batches to prevent server overload.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Matching Accuracy</h2>
                    <p>
                        Soundry uses advanced algorithms to match Spotify tracks to YouTube sources, but it isn't perfect.
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li><strong>Radio Edits vs. Extended Mixes:</strong> Sometimes the resolver might pick a radio edit instead of the original mix, or vice versa.</li>
                        <li><strong>Obscure Tracks:</strong> Developing artists or very old tracks might not have a clean high-quality source on YouTube.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Region Locking</h2>
                    <p>
                        Some tracks may be available on Spotify but blocked on YouTube in the server's region (Germany).
                        These tracks will fail to download.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Variable Speeds</h2>
                    <p>
                        Download speeds depend heavily on YouTube's servers.
                        During peak hours, processing might be slower than usual.
                    </p>
                </section>
            </div>
        </div>
    )
}
