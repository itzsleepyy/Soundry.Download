export default function GlobalLibraryPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">The Global Library</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    How Soundry shares resources efficiently.
                </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">What is it?</h2>
                    <p>
                        The Global Library is a shared cache of all recently downloaded tracks.
                        If User A requests "Bohemian Rhapsody" and User B requests the same track 5 minutes later,
                        User B gets the file instantly without waiting for a new download/conversion.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Why does it exist?</h2>
                    <p>
                        It reduces load on our servers and significantly speeds up downloads for popular tracks.
                        It makes Soundry faster for everyone.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Availability</h2>
                    <p>
                        Files in the Global Library are <strong>ephemeral</strong>. They are not stored permanently.
                        If a track hasn't been requested for a certain period (typically 24-48 hours), it is automatically deleted to free up space.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Session Downloads vs. Library</h2>
                    <p>
                        Your "Session" is just a view of the files you have requested.
                        The actual files live in the Global Library.
                        This is why you don't need an account—your session ID is your key to viewing your requested files.
                    </p>
                </section>
            </div>
        </div>
    )
}
