/**
 * One-shot Cookie Generation Script
 * 
 * Run this script directly to generate cookies on demand:
 *   node src/generate.js
 * 
 * Or with options:
 *   PROXY_URLS="http://..." node src/generate.js
 */

const { generateCookies } = require('./generator');

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log(' Soundry Cookie Generator - One-Shot Mode');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    const sessionName = process.argv[2] || 'cookie-manual';
    const proxyUrl = process.env.PROXY_URLS?.split(',')[0] || null;

    if (proxyUrl) {
        const sanitized = proxyUrl.replace(/:[^@:]+@/, ':***@');
        console.log(`Using proxy: ${sanitized}`);
    } else {
        console.log('No proxy configured (set PROXY_URLS env var)');
    }

    console.log(`Session name: ${sessionName}`);
    console.log('');

    try {
        const cookiePath = await generateCookies({
            cookieName: sessionName,
            proxyUrl
        });
        console.log('\n✓ Cookie generation successful!');
        console.log(`  Output: ${cookiePath}`);
    } catch (error) {
        console.error('\n✗ Cookie generation failed:', error.message);
        process.exit(1);
    }
}

main();
