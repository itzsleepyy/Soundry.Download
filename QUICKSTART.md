# Soundry Download - Quick Start Guide

Get up and running with Soundry Download in minutes!

## 🚀 Quick Start with Docker (Recommended)

The fastest way to run Soundry Download is using Docker:

```bash
# Clone the repository
git clone https://github.com/itzsleepyy/Soundry.Download.git
cd Soundry.Download

# Start the application
docker-compose up --build
```

That's it! Open your browser and navigate to:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000

## 💻 Manual Setup (Development)

If you prefer to run the application without Docker:

### Prerequisites
- Node.js 20+ and npm
- Python 3.12+
- ffmpeg (for audio conversion)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/itzsleepyy/Soundry.Download.git
   cd Soundry.Download
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```
   Backend will be running at http://localhost:5000

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will be running at http://localhost:4200

## 🎵 How to Use

1. Open the application in your browser
2. Choose your source:
   - **Spotify**: For Spotify tracks, albums, or playlists
   - **YouTube/SoundCloud**: For YouTube videos or SoundCloud tracks
3. Paste the URL of the music you want to download
4. Click the "Download" button
5. Wait for the download to complete

## 📝 Example URLs

### Spotify
```
https://open.spotify.com/track/[track-id]
https://open.spotify.com/album/[album-id]
https://open.spotify.com/playlist/[playlist-id]
```

### YouTube
```
https://www.youtube.com/watch?v=[video-id]
https://youtu.be/[video-id]
```

### SoundCloud
```
https://soundcloud.com/[artist]/[track]
```

## 🛠️ Troubleshooting

### Backend won't start
- Make sure Python 3.12+ is installed: `python3 --version`
- Install dependencies: `pip install -r requirements.txt`
- Check if port 5000 is available: `lsof -i :5000`

### Frontend won't start
- Make sure Node.js 20+ is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Downloads not working
- Make sure ffmpeg is installed:
  - **macOS**: `brew install ffmpeg`
  - **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
  - **Windows**: Download from https://ffmpeg.org/

### CORS errors
- Ensure the backend is running on port 5000
- Check that the frontend API URL is correctly configured in `frontend/src/environments/environment.ts`

## 🔐 Security Note

⚠️ This application is for educational purposes. Always respect:
- Copyright laws
- Terms of service of the platforms
- Artist rights and intellectual property

Only download content you have the right to download.

## 📖 More Information

- Full documentation: [README.md](README.md)
- Contributing guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)
- API documentation: [backend/README.md](backend/README.md)

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the full [README.md](README.md)
3. Open an issue on GitHub with:
   - Your operating system
   - Python and Node.js versions
   - Error messages
   - Steps to reproduce

Happy downloading! 🎶
