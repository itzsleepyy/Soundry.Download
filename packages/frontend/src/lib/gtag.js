export const trackDownloadRequest = () => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'Download_Request');
    }
};
