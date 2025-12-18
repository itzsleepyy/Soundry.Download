"""
Soundry Backend API
Music download service supporting Spotify, YouTube, SoundCloud, and more.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import subprocess
import tempfile
import shutil
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Directory for temporary downloads
DOWNLOAD_DIR = tempfile.mkdtemp()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Soundry API is running'})

@app.route('/api/download/spotify', methods=['POST'])
def download_spotify():
    """
    Download music from Spotify using spotdl
    Expected JSON: {"url": "spotify_url", "format": "mp3"}
    """
    try:
        data = request.get_json()
        url = data.get('url')
        output_format = data.get('format', 'mp3')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Create a temporary directory for this download
        temp_dir = tempfile.mkdtemp(dir=DOWNLOAD_DIR)
        
        # Build spotdl command
        cmd = [
            'spotdl',
            'download',
            url,
            '--output', temp_dir,
            '--format', output_format
        ]
        
        logger.info(f"Executing spotdl command for URL: {url}")
        
        # Execute spotdl
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode != 0:
            logger.error(f"spotdl error: {result.stderr}")
            return jsonify({
                'error': 'Failed to download from Spotify',
                'details': result.stderr
            }), 500
        
        # Find downloaded files
        downloaded_files = list(Path(temp_dir).glob(f'*.{output_format}'))
        
        if not downloaded_files:
            return jsonify({'error': 'No files downloaded'}), 500
        
        file_info = [{
            'filename': f.name,
            'size': f.stat().st_size,
            'path': str(f)
        } for f in downloaded_files]
        
        return jsonify({
            'success': True,
            'message': f'Downloaded {len(downloaded_files)} file(s)',
            'files': file_info
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Download timeout - operation took too long'}), 408
    except Exception as e:
        logger.error(f"Error in spotify download: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/youtube', methods=['POST'])
def download_youtube():
    """
    Download music from YouTube, SoundCloud, and other platforms using yt-dlp
    Expected JSON: {"url": "video_url", "format": "mp3", "quality": "best"}
    """
    try:
        data = request.get_json()
        url = data.get('url')
        output_format = data.get('format', 'mp3')
        quality = data.get('quality', 'best')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Create a temporary directory for this download
        temp_dir = tempfile.mkdtemp(dir=DOWNLOAD_DIR)
        output_template = os.path.join(temp_dir, '%(title)s.%(ext)s')
        
        # Build yt-dlp command
        cmd = [
            'yt-dlp',
            '--extract-audio',
            '--audio-format', output_format,
            '--audio-quality', quality,
            '--output', output_template,
            url
        ]
        
        logger.info(f"Executing yt-dlp command for URL: {url}")
        
        # Execute yt-dlp
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode != 0:
            logger.error(f"yt-dlp error: {result.stderr}")
            return jsonify({
                'error': 'Failed to download',
                'details': result.stderr
            }), 500
        
        # Find downloaded files
        downloaded_files = list(Path(temp_dir).glob(f'*.{output_format}'))
        
        if not downloaded_files:
            return jsonify({'error': 'No files downloaded'}), 500
        
        file_info = [{
            'filename': f.name,
            'size': f.stat().st_size,
            'path': str(f)
        } for f in downloaded_files]
        
        return jsonify({
            'success': True,
            'message': f'Downloaded {len(downloaded_files)} file(s)',
            'files': file_info
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Download timeout - operation took too long'}), 408
    except Exception as e:
        logger.error(f"Error in yt-dlp download: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search():
    """
    Search for music tracks
    Expected JSON: {"query": "artist - song name", "source": "spotify"}
    """
    try:
        data = request.get_json()
        query = data.get('query')
        source = data.get('source', 'spotify')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        if source == 'spotify':
            # Use spotdl to search
            cmd = ['spotdl', 'search', query, '--max-results', '10']
        else:
            # Use yt-dlp to search
            cmd = ['yt-dlp', '--get-title', '--get-id', f'ytsearch10:{query}']
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            return jsonify({
                'error': 'Search failed',
                'details': result.stderr
            }), 500
        
        return jsonify({
            'success': True,
            'results': result.stdout.strip().split('\n')
        })
        
    except Exception as e:
        logger.error(f"Error in search: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """Clean up downloaded files"""
    try:
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            os.makedirs(DOWNLOAD_DIR)
        return jsonify({'success': True, 'message': 'Cleanup completed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
