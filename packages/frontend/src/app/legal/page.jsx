export default function Legal() {
    return (
        <div className="max-w-2xl mx-auto py-12 space-y-12">
            <div>
                <h1 className="text-lg font-semibold tracking-tight mb-2">Legal & Disclaimer</h1>
                <p className="text-sm text-muted-foreground">
                    Soundry is a tool provided for personal archiving and educational purposes only.
                </p>
            </div>

            <section className="space-y-3">
                <h2 className="text-sm font-medium text-foreground">Usage Policy</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Users are responsible for ensuring they have rights to download any content processed through this service.
                    We generally do not monitor the content requested, but abuse of the API will result in rate limiting.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-medium text-foreground">Data Retention</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    We do not store files for longer than 24 hours. Metadata and files are permanently deleted after the expiration period.
                    We do not track user history beyond the active session 24-hour window.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-medium text-foreground">No Warranty</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    This software is provided "as is", without warranty of any kind, express or implied.
                </p>
            </section>
        </div>
    )
}
