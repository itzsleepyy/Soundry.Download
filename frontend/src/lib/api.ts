import axios from 'axios';

// Base URL configuration - adjust if needed for production/dev mismatch
const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
    baseURL: API_URL,
});

export const API = {
    // Check if backend is alive
    health: () => api.get('/health'),

    // Open a URL (resolve metadata)
    open: (url: string) => api.get(`/open?url=${encodeURIComponent(url)}`),

    // Start a download
    download: (url: string, format: string) => api.get(`/download?url=${encodeURIComponent(url)}&format=${format}`),

    // List all downloads
    listDownloads: () => api.get('/files'),

    // Delete a downloaded file
    deleteDownload: (filename: string) => api.delete(`/files/${encodeURIComponent(filename)}`),

    // Create a zip of session files
    downloadZip: (files: string[]) => api.post('/zip', { files }, { responseType: 'blob' }),

    // Get the direct download URL for a file
    downloadFileURL: (filename: string) => `${API_URL}/downloads/${encodeURIComponent(filename)}`,

    // WebSocket Connection Helper
    ws_connect: () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // e.g. localhost:5173 or soundry.com
        // Use configured API host or fall back to current window host
        // If API_URL is set (e.g. http://localhost:8000), use that host
        let wsUrl = `${protocol}//${host}/ws`;

        if (API_URL) {
            try {
                const url = new URL(API_URL);
                wsUrl = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/ws`;
            } catch (e) {
                console.warn("Invalid API_URL for WS, falling back to window.location", e);
            }
        }

        return new WebSocket(wsUrl);
    }
};
