<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/131cxDFN5HZTYPgk1b0KtS-J3OOpqzXK7

## 🚀 Deployment Guide

For a detailed, step-by-step walkthrough on how to launch this website to GitHub Pages, set up the Admin Portal, and configure the custom domain, please refer to the:

**[LAUNCH_GUIDE.md](LAUNCH_GUIDE.md)**

---

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env](.env) to your Gemini API key (Note: `.env.local` is also supported)
3. Set `VITE_ADMIN_PASSKEY` in [.env](.env) for local admin access.
4. Run the app:
   `npm run dev`

## Deployment

This project is configured for deployment to GitHub Pages using GitHub Actions.

### Deployment Configuration

1. **GitHub Secret**: You must add your admin passkey as a secret in your GitHub repository.
   - Go to **Settings** > **Secrets and variables** > **Actions**.
   - Click **New repository secret**.
   - Name: `VITE_ADMIN_PASSKEY`
   - Value: Your desired admin passkey.
2. **Custom Domain**: The project is configured to use `lahsaviation.dpdns.org` via the `public/CNAME` file.
3. **GitHub Pages Settings**:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, ensure it is set to **GitHub Actions**.

The deployment workflow will automatically trigger when you push to the `main` branch.
