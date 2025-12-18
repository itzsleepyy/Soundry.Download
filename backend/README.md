# Soundry Backend API

Flask-based REST API for downloading music from various platforms.

## Installation

```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Download from Spotify
```
POST /api/download/spotify
Content-Type: application/json

{
  "url": "https://open.spotify.com/track/...",
  "format": "mp3"
}
```

### Download from YouTube/SoundCloud
```
POST /api/download/youtube
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "format": "mp3",
  "quality": "best"
}
```

### Search
```
POST /api/search
Content-Type: application/json

{
  "query": "artist - song name",
  "source": "spotify"
}
```

## Dependencies

- Flask 3.0.0 - Web framework
- Flask-CORS 4.0.0 - CORS support
- spotdl 4.2.5 - Spotify downloader
- yt-dlp 2024.12.13 - Universal media downloader
- python-dotenv 1.0.0 - Environment variable management
