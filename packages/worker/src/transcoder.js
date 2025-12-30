const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

function transcodeFile(sourcePath, destPath, format) {
    return new Promise((resolve, reject) => {
        let command = ffmpeg(sourcePath);

        if (format === 'mp3') {
            command.audioCodec('libmp3lame').audioBitrate('320k');
        } else if (format === 'flac') {
            command.audioCodec('flac');
        } else if (format === 'wav') {
            command.audioCodec('pcm_s16le');
        } else {
            return reject(new Error(`Unsupported format: ${format}`));
        }

        command
            .on('end', () => {
                const stats = fs.statSync(destPath);
                resolve(stats);
            })
            .on('error', (err) => {
                reject(err);
            })
            .save(destPath);
    });
}

module.exports = { transcodeFile };
