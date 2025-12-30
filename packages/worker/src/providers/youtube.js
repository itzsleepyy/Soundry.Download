const ytDlp = require('yt-dlp-exec');

async function getYoutubeMetadata(url) {
    try {
        const output = await ytDlp(url, {
            dumpSingleJson: true,
            noWarnings: true,

            preferFreeFormats: true,
        });

        return {
            title: output.title,
            artist: output.uploader || output.artist || 'Unknown Artist',
            duration: output.duration,
            providerId: output.id
        };
    } catch (e) {
        console.error('YT-DLP Metadata Error', e);
        throw e;
    }
}

async function downloadYoutube(url, outputPath) {
    try {
        await ytDlp(url, {
            extractAudio: true,
            audioFormat: 'best', // Download best quality then we transcode
            output: outputPath,
            noWarnings: true,

        });
        return true;
    } catch (e) {
        console.error('YT-DLP Download Error', e);
        throw e;
    }
}

module.exports = { getYoutubeMetadata, downloadYoutube };
