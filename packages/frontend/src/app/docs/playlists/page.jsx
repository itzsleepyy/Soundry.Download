export default function PlaylistsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Downloading entire collections at once.
                </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">How it works</h2>
                    <p>
                        When you submit a playlist URL, Soundry queues every track in that playlist individually.
                        You will see a progress bar indicating how many tracks have been processed.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Downloading as ZIP</h2>
                    <p>
                        Once a playlist is fully processed, a "Download ZIP" button will appear.
                        This allows you to grab all tracks in a single archive.
                        Note that creating large ZIP files (100+ songs) takes significant server resources, so please be patient.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Partial Failures</h2>
                    <p>
                        Sometimes, 1 or 2 tracks in a 50-song playlist might fail (due to region locks or no matching video).
                        Soundry will still allow you to download the successful tracks.
                        The failed tracks will be clearly marked so you can try to find them manually later.
                    </p>
                </section>
            </div>
        </div>
    )
}
