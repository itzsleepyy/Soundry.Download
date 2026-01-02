
export const metadata = {
    title: 'Soundry Global Library – Download Shared Tracks',
    description: 'Browse and download recently processed audio tracks from the Soundry community. Find Spotify, SoundCloud, and YouTube conversions.',
    openGraph: {
        title: 'Soundry Global Library – Download Shared Tracks',
        description: 'Browse and download recently processed audio tracks from the Soundry community.',
        url: 'https://soundry.download/library',
        type: 'website',
    },
};

export default function LibraryLayout({ children }) {
    return (
        <>
            {children}
        </>
    );
}
