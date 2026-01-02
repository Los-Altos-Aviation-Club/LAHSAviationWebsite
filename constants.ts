// Constants can be moved here for scalability
export const MOCK_DELAY = 2000;

// External content repository for the "Two-Repository Strategy"
// Using Vite env variables for flexibility if needed, otherwise fallback to defaults
export const CONTENT_REPO = import.meta.env.VITE_CONTENT_REPO || 'technoIogical/aviation-club-archive';
export const GITHUB_RAW_BASE_URL = `https://raw.githubusercontent.com/${CONTENT_REPO}/main`;
export const GITHUB_API_BASE_URL = `https://api.github.com/repos/${CONTENT_REPO}/contents`;
