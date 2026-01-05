/**
 * Cookie Service - Main Entry Point
 * 
 * Runs as a sidecar service that periodically generates fresh YouTube cookies
 * using real browser sessions through residential proxies.
 * 
 * Architecture:
 * - Runs on configurable schedule (default: every 7 days)
 * - Uses Puppeteer + stealth to generate authenticated sessions
 * - Routes through residential proxies (from PROXY_URLS env)
 * - Writes cookies to shared volume (/app/cookies)
 * - Worker service reads cookies from same volume
 */

const { generateCookies } = require('./generator');

// Configuration
const REFRESH_INTERVAL_DAYS = parseInt(process.env.COOKIE_REFRESH_DAYS || '7', 10);
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
const NUM_SESSIONS = parseInt(process.env.NUM_COOKIE_SESSIONS || '3', 10);

/**
 * Parse proxy URLs from environment
 */
function getProxyUrls() {
    const proxyUrls = process.env.PROXY_URLS || '';
    if (!proxyUrls.trim()) {
        console.warn('[CookieService] No PROXY_URLS configured - cookies will be generated without proxy');
        return [null];
    }
    return proxyUrls.split(',').map(u => u.trim()).filter(u => u);
}

/**
 * Generate multiple cookie sessions
 */
async function generateAllSessions() {
    console.log(`[CookieService] Starting cookie generation (${NUM_SESSIONS} sessions)`);
    console.log(`[CookieService] Refresh interval: ${REFRESH_INTERVAL_DAYS} days`);

    const proxyUrls = getProxyUrls();
    const results = [];

    for (let i = 0; i < NUM_SESSIONS; i++) {
        const sessionName = `cookie-${i + 1}`;
        const proxyUrl = proxyUrls[i % proxyUrls.length] || null;

        console.log(`\n[CookieService] Generating session ${i + 1}/${NUM_SESSIONS}...`);

        try {
            const cookiePath = await generateCookies({
                cookieName: sessionName,
                proxyUrl
            });
            results.push({ session: sessionName, success: true, path: cookiePath });
            console.log(`[CookieService] ✓ Session ${sessionName} generated successfully`);
        } catch (error) {
            console.error(`[CookieService] ✗ Session ${sessionName} failed:`, error.message);
            results.push({ session: sessionName, success: false, error: error.message });
        }

        // Small delay between sessions
        if (i < NUM_SESSIONS - 1) {
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    console.log(`\n[CookieService] Generation complete: ${successful}/${NUM_SESSIONS} sessions succeeded`);

    return results;
}

/**
 * Main service loop
 */
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log(' Soundry Cookie Service');
    console.log(' Automated YouTube cookie generation via Puppeteer');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // Generate cookies immediately on startup
    await generateAllSessions();

    // Schedule periodic refresh
    console.log(`\n[CookieService] Next refresh in ${REFRESH_INTERVAL_DAYS} days`);
    console.log('[CookieService] Service sleeping...');

    setInterval(async () => {
        console.log('\n[CookieService] Scheduled refresh triggered');
        await generateAllSessions();
        console.log(`[CookieService] Next refresh in ${REFRESH_INTERVAL_DAYS} days`);
    }, REFRESH_INTERVAL_MS);

    // Keep process alive
    process.on('SIGTERM', () => {
        console.log('[CookieService] Received SIGTERM, shutting down...');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('[CookieService] Received SIGINT, shutting down...');
        process.exit(0);
    });
}

// Run
main().catch(error => {
    console.error('[CookieService] Fatal error:', error);
    process.exit(1);
});
