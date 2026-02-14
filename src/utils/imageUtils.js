export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Use the base URL from import.meta.env.VITE_API_URL or default to localhost
    // We assume VITE_API_URL points to the /api/v1/ suffix mostly, so we might need the root.
    // However, usually VITE_API_BASE_URL (if exists) or we can derive it.
    // Let's hardcode the production fallback or use a specific env var for media if available.

    // Better strategy: Use the same base domain as the API.
    // If VITE_API_URL is "https://hourlystay.com/api/v1", we want "https://hourlystay.com/"

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';
    try {
        const url = new URL(apiUrl);
        return `${url.protocol}//${url.host}/${cleanPath}`;
    } catch (e) {
        return `https://hourlystay.com/${cleanPath}`;
    }
};
