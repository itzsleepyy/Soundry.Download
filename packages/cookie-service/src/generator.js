/**
 * YouTube Cookie Generator
 * 
 * Uses Puppeteer with stealth plugin to generate valid YouTube session cookies.
 * Cookies are exported in Netscape format for use with yt-dlp.
 * 
 * Features:
 * - Stealth mode to avoid detection
 * - Proxy support for residential IP usage
 * - Automatic retry on failure
 * - Netscape cookie format export
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Apply stealth plugin
puppeteer.use(StealthPlugin());

const COOKIES_DIR = process.env.COOKIES_DIR || '/app/cookies';

/**
 * Generate YouTube cookies using headless browser
 * @param {Object} options
 * @param {string} options.proxyUrl - Optional proxy URL (http://user:pass@host:port)
 * @param {string} options.cookieName - Name for output cookie file
 * @returns {Promise<string>} Path to generated cookie file
 */
async function generateCookies(options = {}) {
    const { proxyUrl, cookieName = 'session' } = options;

    console.log('[CookieGenerator] Starting browser session...');
    if (proxyUrl) {
        const sanitized = proxyUrl.replace(/:[^@:]+@/, ':***@');
        console.log(`[CookieGenerator] Using proxy: ${sanitized}`);
    }

    // Browser launch options
    const launchOptions = {
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
        ]
    };

    // Add proxy if provided
    if (proxyUrl) {
        const proxyArg = formatProxyArg(proxyUrl);
        launchOptions.args.push(`--proxy-server=${proxyArg}`);
    }

    let browser;
    try {
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Set realistic viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Set user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Handle proxy authentication if needed
        if (proxyUrl) {
            const auth = extractProxyAuth(proxyUrl);
            if (auth) {
                await page.authenticate(auth);
            }
        }

        console.log('[CookieGenerator] Navigating to YouTube...');

        // Navigate to YouTube homepage
        await page.goto('https://www.youtube.com/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for page to fully load
        await page.waitForTimeout(3000);

        // Perform some natural browsing to establish session
        console.log('[CookieGenerator] Simulating user activity...');

        // Scroll the page
        await page.evaluate(() => {
            window.scrollTo(0, 500);
        });
        await page.waitForTimeout(1000);

        // Scroll back
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await page.waitForTimeout(1000);

        // Extract cookies
        const cookies = await page.cookies();
        console.log(`[CookieGenerator] Extracted ${cookies.length} cookies`);

        // Convert to Netscape format
        const netscapeCookies = convertToNetscapeFormat(cookies);

        // Ensure cookies directory exists
        if (!fs.existsSync(COOKIES_DIR)) {
            fs.mkdirSync(COOKIES_DIR, { recursive: true });
        }

        // Write cookie file
        const cookiePath = path.join(COOKIES_DIR, `${cookieName}.txt`);
        fs.writeFileSync(cookiePath, netscapeCookies);
        console.log(`[CookieGenerator] Saved cookies to: ${cookiePath}`);

        return cookiePath;

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Format proxy URL for Chromium --proxy-server flag
 */
function formatProxyArg(proxyUrl) {
    try {
        const url = new URL(proxyUrl);
        // Chromium proxy format: protocol://host:port (no auth)
        return `${url.protocol}//${url.hostname}:${url.port}`;
    } catch {
        return proxyUrl;
    }
}

/**
 * Extract authentication from proxy URL
 */
function extractProxyAuth(proxyUrl) {
    try {
        const url = new URL(proxyUrl);
        if (url.username && url.password) {
            return {
                username: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password)
            };
        }
    } catch { }
    return null;
}

/**
 * Convert Puppeteer cookies to Netscape cookie format
 * @param {Array} cookies - Puppeteer cookie objects
 * @returns {string} Netscape format cookie file content
 */
function convertToNetscapeFormat(cookies) {
    const lines = [
        '# Netscape HTTP Cookie File',
        '# Generated by Soundry Cookie Service',
        '# https://curl.se/docs/http-cookies.html',
        ''
    ];

    for (const cookie of cookies) {
        // Netscape format fields:
        // domain, includeSubdomains, path, isSecure, expirationDate, name, value
        const includeSubdomains = cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const isSecure = cookie.secure ? 'TRUE' : 'FALSE';
        const expiration = cookie.expires ? Math.floor(cookie.expires) : 0;

        const line = [
            cookie.domain,
            includeSubdomains,
            cookie.path,
            isSecure,
            expiration,
            cookie.name,
            cookie.value
        ].join('\t');

        lines.push(line);
    }

    return lines.join('\n');
}

module.exports = { generateCookies };
