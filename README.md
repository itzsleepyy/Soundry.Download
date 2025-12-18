# Soundry Download

A modern web application for downloading music from various platforms including Spotify, YouTube, SoundCloud, and more. Built with Angular and PrimeNG for the frontend, and Python Flask for the backend.

## Features

- 🎵 Download music from multiple platforms:
  - Spotify (using spotdl)
  - YouTube (using yt-dlp)
  - SoundCloud (using yt-dlp)
  - And many more platforms supported by yt-dlp
- 🎨 Modern, responsive UI built with Angular and PrimeNG
- ⚡ Fast and efficient downloads
- 🔄 Real-time download status
- 📦 MP3 format support with best quality

## Tech Stack

### Frontend
- **Angular 19** - Modern web framework
- **PrimeNG** - Rich UI component library (inspired by Poseidon template)
- **PrimeFlex** - CSS utility library
- **TypeScript** - Type-safe JavaScript
- **SCSS** - Enhanced CSS

### Backend
- **Python 3.12** - Backend runtime
- **Flask** - Web framework
- **spotdl** - Spotify downloader
- **yt-dlp** - Universal media downloader
- **Flask-CORS** - Cross-origin resource sharing

## Prerequisites

- Node.js 20+ and npm
- Python 3.12+
- pip (Python package manager)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

## Running the Application

### Option 1: Using Docker (Recommended)

The easiest way to run the entire application is using Docker Compose:

```bash
docker-compose up --build
```

This will start both the backend and frontend services:
- Frontend: `http://localhost`
- Backend API: `http://localhost:5000`

To stop the services:
```bash
docker-compose down
```

### Option 2: Manual Setup

#### Start Backend Server

```bash
cd backend
python app.py
```

The backend API will be available at `http://localhost:5000`

#### Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend application will be available at `http://localhost:4200`

## Usage

1. Open your browser and navigate to `http://localhost:4200`
2. Select the source platform (Spotify or YouTube/SoundCloud)
3. Paste the URL of the song, playlist, or video you want to download
4. Click the "Download" button
5. Wait for the download to complete
6. The downloaded files will be saved in the backend's temporary directory

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if the API is running

### Download from Spotify
- **POST** `/api/download/spotify`
- Body: `{ "url": "spotify_url", "format": "mp3" }`

### Download from YouTube/SoundCloud
- **POST** `/api/download/youtube`
- Body: `{ "url": "video_url", "format": "mp3", "quality": "best" }`

### Search
- **POST** `/api/search`
- Body: `{ "query": "search query", "source": "spotify" }`

### Cleanup
- **POST** `/api/cleanup` - Clean up temporary download files

## Project Structure

```
Soundry.Download/
├── backend/
│   ├── app.py              # Flask application
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── download/  # Download component
│   │   │   ├── services/
│   │   │   │   └── download.ts # Download service
│   │   │   ├── app.ts         # Main app component
│   │   │   ├── app.routes.ts  # Route configuration
│   │   │   └── app.config.ts  # App configuration
│   │   ├── styles.scss        # Global styles
│   │   └── index.html         # HTML entry point
│   ├── angular.json           # Angular configuration
│   └── package.json           # Node.js dependencies
└── README.md                  # This file
```

## Development

### Frontend Development

The frontend uses Angular standalone components with PrimeNG for UI components. To add new features:

1. Generate new components: `ng generate component components/feature-name`
2. Add routes in `app.routes.ts`
3. Use PrimeNG components for consistent UI

### Backend Development

The backend uses Flask with a RESTful API design. To add new endpoints:

1. Add new route handlers in `app.py`
2. Follow the existing pattern for error handling
3. Update CORS configuration if needed

## Security Notes

- This application is for educational purposes
- Ensure you have the right to download content from the URLs you provide
- Respect copyright laws and terms of service of the platforms
- The backend should be properly secured before deploying to production

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.