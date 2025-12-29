#!/bin/sh

# Upgrade yt-dlp and spotdl to the latest versions to fix YouTube download issues
echo "Upgrading yt-dlp and spotdl..."
pip install --upgrade yt-dlp spotdl --quiet --disable-pip-version-check --root-user-action=ignore
echo "Upgrade complete. Starting server..."

exec python main.py web \
    --host 0.0.0.0 \
    --port "${DOWNTIFY_PORT}" \
    --keep-alive \
    --web-use-output-dir \
    --keep-sessions