export default function SessionsPrivacyPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sessions & Privacy</h1>
                <p className="text-xl text-muted-foreground mt-2">
                    Soundry is designed to be private by default.
                </p>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">No Accounts Required</h2>
                    <p>
                        You do not need to create an account, provide an email, or set a password to use Soundry.
                        We do not collect personal data because we don't need it.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Browser-Based Sessions</h2>
                    <p>
                        When you visit Soundry, a unique "Session ID" is generated for your browser.
                        This ID is stored locally on your device (in Local Storage).
                        This allows us to show you your recent downloads when you return to the site.
                    </p>
                    <p className="mt-2 text-muted-foreground text-base italic">
                        Note: If you clear your browser cache or use Incognito mode, your session history will be lost.
                        However, the files may still exist in the Global Library if you have the direct link.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">Data Retention</h2>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li><strong>Usage Logs:</strong> We log basic usage statistics (e.g., "100 tracks downloaded today") to monitor system health.</li>
                        <li><strong>IP Addresses:</strong> We do not permanently log IP addresses associated with specific downloads.</li>
                        <li><strong>Files:</strong> Downloaded files are deleted automatically after 24-48 hours.</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
