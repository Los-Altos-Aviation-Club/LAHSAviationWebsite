// Constants can be moved here for scalability
export const MOCK_DELAY = 2000;

// Archive Repository for centralized data management (metadata.json, projects, logs, media)
export const ARCHIVE_REPO = 'Los-Altos-Aviation-Club/aviation-club-archive';
export const ARCHIVE_RAW_BASE_URL = `https://raw.githubusercontent.com/${ARCHIVE_REPO}/main`;
export const ARCHIVE_GITHUB_API_BASE_URL = `https://api.github.com/repos/${ARCHIVE_REPO}/contents`;

// Keeping old constants for backward compatibility if needed, but they will point to ARCHIVE
export const GITHUB_RAW_BASE_URL = ARCHIVE_RAW_BASE_URL;
export const GITHUB_API_BASE_URL = ARCHIVE_GITHUB_API_BASE_URL;

// Base paths for project updates
export const PROJECTS_BASE_PATH = 'projects';
