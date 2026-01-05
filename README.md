# LAHS Aviation Website

This repository contains the source code for the LAHS Aviation Website.

Currently located at https://lahsaviation.dpdns.org/    

## Local Development

Follow these steps to run the project locally:

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```

3.  **Access the Application**
    Navigate to [https://localhost:3000](https://localhost:3000) in your web browser.

## Architecture Summary

This project utilizes a Two-Repository Strategy to separate application logic from data persistence:

*   **Website Repository**: Contains the React/Vite source code and UI components.
*   **Archive/Data Management**: Managed via a separate structure (or branch) to ensure that logs, project metadata, and assets are handled efficiently without bloating the primary application codebase. Located at https://github.com/Los-Altos-Aviation-Club/aviation-club-archive

## Deployment

For detailed instructions on deployment, including GitHub Pages configuration and custom domain setup, please refer to the [LAUNCH_GUIDE.md](LAUNCH_GUIDE.md).
