export default function ResponsibleUsePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Responsible Use</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Guidelines for using Soundry ethically.
                </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">Personal Use Only</h2>
                    <p>
                        Soundry is intended for personal archiving, educational use, and professional DJ preparation where you already have rights or licenses for public performance.
                        <strong>Do not use Soundry to build a piracy streaming service or sell the downloaded files.</strong>
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Respect Availability</h2>
                    <p>
                        The Global Library is a community resource. Please do not script automated bots to mass-download thousands of tracks solely to burden our infrastructure.
                        Abusive traffic patterns will be blocked.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Ephemeral by Design</h2>
                    <p>
                        Do not rely on Soundry as your permanent cloud backup.
                        Download your files immediately. We delete old files to respect copyright holders and minimize our storage footprint.
                    </p>
                </section>
            </div>
        </div>
    )
}
