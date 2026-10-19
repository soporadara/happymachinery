# Happy Machinery — Safe Production Deployment & Rollback Workflow

This document details the multi-layered, safe deployment process for updating [https://happymachinery.com/](https://happymachinery.com/) on Hostinger.

---

## 1. Safety Principles

1. **Zero Production Overwrite of Data**:
   - The production database `/home/u534600013/domains/happymachinery.com/happy-machinery-storage/content.json` is **never** overwritten by deployment.
   - User orders, cart activity, and live blog edits remain untouched.
2. **Automated Pre-Deployment Snapshots**:
   - Every deployment automatically creates a fresh, timestamped `.tar.gz` archive of the current live files on Hostinger before transferring any new code.
3. **Dry-Run Confirmation**:
   - Before syncing, the script displays the exact list of modified, added, and removed files and requires explicit user confirmation (`yes`).
4. **Automated Post-Deployment Smoke Tests**:
   - Verifies HTTP 200 on the homepage and validates the JSON response from `/api/content.php`.

---

## 2. One-Command Safe Deployment (`./deploy.sh`)

From your Mac terminal inside the project directory:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/happymachinery
./deploy.sh
```

### What `deploy.sh` Does:
1. **Compiles & Type Checks Locally**: Runs `tsc -b && vite build` locally to guarantee zero build errors.
2. **Validates Hostinger SSH**: Tests connection to `happymachinery-prod`.
3. **Takes Live Production Snapshot**:
   Executes on Hostinger:
   `tar -czf /home/u534600013/happymachinery-backups/pre_deploy_backup_<TIMESTAMP>.tar.gz ...`
4. **Performs Dry-Run (`rsync -n`)**: Displays every file that will change.
5. **Awaits Confirmation**: Pauses for your explicit approval before uploading.
6. **Safely Synchronizes**: Uploads the new `dist/` build and PHP endpoints into `public_html/`.
7. **Runs Smoke Tests**: Queries `https://happymachinery.com/` and the `/api/content.php?key=products` endpoint.

---

## 3. Production Rollback Procedure (`./rollback.sh`)

If an unexpected issue occurs in production after deployment:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/happymachinery
./rollback.sh
```

### Rollback Process:
1. Displays the list of available backups stored securely in `/home/u534600013/happymachinery-backups/`.
2. Asks you to select the backup file.
3. Offers two restoration modes:
   - **`code` (Recommended)**: Restores only `public_html` (code, assets, styles), leaving any new production user data intact.
   - **`both`**: Restores both `public_html` and `happy-machinery-storage/content.json`.
4. Prompts for final confirmation before restoring.
5. Verifies live site health via HTTP status check.

---

## 4. Alternative: Deploying via GitHub & Hostinger Git Pipeline

Because Hostinger is linked to `https://github.com/KiuQ-Technologies-II/Happy-Machinery.git`:

1. Commit your changes:
   ```bash
   git add src/
   git commit -m "feat: updated equipment catalog specs"
   ```
2. Push to GitHub:
   ```bash
   git push origin main
   ```
3. Hostinger's build pipeline (`hbuilds`) will automatically pull, run `tsc -b && vite build`, and deploy the build to `public_html`.
