# 🚀 LAHS Aviation Website Launch Guide

This guide provides step-by-step instructions for deploying the LAHS Aviation website to GitHub Pages with a custom domain and setting up the Admin Portal.

## 1. Create GitHub Repositories

You need two repositories:
1.  **Main Repository**: To host the website code and GitHub Pages.
2.  **Archive Repository**: To store historical flight logs and project data (used by the Admin Portal).

### Step-by-Step:
1.  Go to [GitHub](https://github.com/) and log in.
2.  Click the **+** icon in the top right and select **New repository**.
3.  **Main Repository**:
    -   Name: `LAHSAviationWebsite` (or your preferred name).
    -   Visibility: Public.
    -   Click **Create repository**.
4.  **Archive Repository**:
    -   Name: `aviation-archive` (must match what you use in your environment variables).
    -   Visibility: Public.
    -   Click **Create repository**.

---

## 2. Push Code to GitHub

Open your terminal in the project root directory and run the following commands to link your local code to the main GitHub repository.

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Website setup"

# Rename branch to main
git branch -M main

# Add the remote (Replace <YOUR_USERNAME> with your GitHub username)
git remote add origin https://github.com/<YOUR_USERNAME>/LAHSAviationWebsite.git

# Push to GitHub
git push -u origin main
```

---

## 3. Add GitHub Secrets

For the deployment workflow and Admin Portal to work, you must add the admin passkey as a secret.

1.  In your GitHub repository, go to **Settings**.
2.  In the left sidebar, click **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  Name: `VITE_ADMIN_PASSKEY`
5.  Value: Your chosen secret password for the Admin Portal.
6.  Click **Add secret**.

---

## 4. Configure GitHub Pages

Configure the repository to deploy using GitHub Actions.

1.  In your GitHub repository, go to **Settings**.
2.  Click **Pages** in the left sidebar.
3.  Under **Build and deployment** > **Source**, select **GitHub Actions** from the dropdown menu.

The website will now automatically deploy whenever you push changes to the `main` branch.

---

## 5. Configure Custom Domain (Cloudflare)

To use `lahsaviation.dpdns.org`:

1.  In your GitHub repository, go to **Settings** > **Pages**.
2.  Under **Custom domain**, type `lahsaviation.dpdns.org` and click **Save**.
3.  **DNS Configuration**: In your Cloudflare dashboard, update your DNS records:
    -   **A Records**: Set the **Name** (or Host) field to `@` for each of these four GitHub Pages IP addresses:
        -   `185.199.108.153`
        -   `185.199.109.153`
        -   `185.199.110.153`
        -   `185.199.111.153`
    -   **CNAME Record**: Set the **Name** field to `www` and the **Content** (or Target) field to `@`.
    -   **Proxy Status**: It is often best to set the Proxy status to **"DNS Only" (Grey Cloud)** during initial setup. If you choose to keep it "Proxied" (Orange Cloud), ensure that Cloudflare's SSL/TLS encryption mode is set to **"Full (Strict)"**.
    -   **Root CNAME (Optional)**: If you prefer using CNAME for the root, you can point it to `<YOUR_USERNAME>.github.io`.

---

## 6. Generate Personal Access Token (PAT)

The Admin Portal requires a PAT to push updates to the archive repository.

1.  Go to [GitHub Settings > Tokens (classic)](https://github.com/settings/tokens).
2.  Click **Generate new token** > **Generate new token (classic)**.
3.  Note: Give it a descriptive name like "LAHS Aviation Admin Portal".
4.  Select the **repo** scope (Full control of private repositories).
5.  Click **Generate token**.
6.  **Important**: Copy the token immediately. You will need to enter this into the Admin Portal login screen when prompted.

---

## 7. Final Verification

1.  Wait for the GitHub Action (under the **Actions** tab) to complete.
2.  Visit `https://lahsaviation.dpdns.org`.
3.  Test the Admin Portal by navigating to `/admin` and logging in with your `VITE_ADMIN_PASSKEY` and PAT.
