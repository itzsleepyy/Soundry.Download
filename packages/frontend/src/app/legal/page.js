export default function Legal() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
            <h1 className="text-3xl font-bold">Legal & Disclaimer</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Service Usage</h2>
                <p className="text-text-muted">
                    Soundry is a tool provided for personal archiving and educational purposes only.
                    Users are responsible for ensuring they have rights to download any content processed through this service.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Data Retention</h2>
                <p className="text-text-muted">
                    We do not store files for longer than 24 hours. Metadata and files are permanently deleted after the expiration period.
                    We do not track user history beyond the active session 24-hour window.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white">No Warranty</h2>
                <p className="text-text-muted">
                    This software is provided "as is", without warranty of any kind, express or implied.
                </p>
            </section>
        </div>
    )
}
