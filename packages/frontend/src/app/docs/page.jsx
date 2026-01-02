export default function DocsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Introduction</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Welcome to the Soundry documentation.
                </p>
            </div>

            <div className="space-y-4 text-lg leading-relaxed">
                <p>
                    Soundry helps you convert cloud music links to audio formats. When a link is requested, Soundry processes it and makes the track available temporarily. You can download individual tracks or explore the Global Library.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Who is Soundry for?</h2>
                <p>
                    Soundry is built for DJs, audiophiles, and music collectors who need actual files for offline use,
                    performance software (like Rekordbox or Serato), or personal archival.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">What problem does it solve?</h2>
                <p>
                    Streaming services are convenient, but they don't give you ownership of the files.
                    You cannot use streamed tracks in DJ software, on legacy MP3 players, or in projects that require raw audio files.
                    Soundry automates the tedious process of finding, verifying, and downloading these tracks manually.
                </p>
            </div>
        </div>
    )
}
