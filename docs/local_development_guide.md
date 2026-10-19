# Happy Machinery — Local Development Guide

This guide describes how to run, test, modify, and develop Happy Machinery on macOS.

---

## 1. Project Directory Layout

```
/Applications/XAMPP/xamppfiles/htdocs/happymachinery/
├── backups/                    <-- Production backup archives (git-ignored)
├── docs/                       <-- Environment audits, guides, and workflows
├── happy-machinery-storage/    <-- Restored local database storage (git-ignored)
│   └── content.json
├── .admin-data/                <-- Symlink to happy-machinery-storage/ for Vite dev server
├── public/                     <-- Static assets, images, videos, PHP endpoints
│   ├── api/content.php
│   ├── share_preview.php
│   ├── share_image.php
│   └── images/ & videos/
├── src/                        <-- React 19 + TypeScript Application Source
│   ├── components/             <-- Reusable UI components
│   ├── data/                   <-- Content storage and API client interfaces
│   ├── pages/                  <-- Application routes (Home, Store, Blog, Admin)
│   └── main.tsx & App.tsx
├── package.json & vite.config.ts
├── deploy.sh                   <-- Safe deployment script
└── rollback.sh                 <-- Safe rollback script
```

---

## 2. Starting the Development Server

You can run the application locally using Vite (recommended for fast hot module replacement):

```bash
# Navigate to the project directory
cd /Applications/XAMPP/xamppfiles/htdocs/happymachinery

# Start the Vite development server
npm run dev
```

Open your browser to: **`http://localhost:5173`**

### Built-in Dev API Middleware
The Vite server includes built-in mock/proxy middleware configured in `vite.config.ts`. It intercepts calls to `/api/content.php` and reads/writes directly to `.admin-data/content.json` (which is symlinked to `happy-machinery-storage/content.json`).
- Changes made in the Admin Dashboard (`http://localhost:5173/admin` or via UI) persist locally without requiring Apache or PHP running!

---

## 3. Alternative: Running under XAMPP Apache + PHP

Because the project is located directly inside `/Applications/XAMPP/xamppfiles/htdocs/happymachinery/`, you can also build the production bundle and serve it through XAMPP Apache:

```bash
# 1. Build the frontend bundle
npm run build

# 2. Copy the build to public or serve directly
# Access via:
http://localhost/happymachinery/public/
```

---

## 4. Making Code Changes

1. **Components & Pages**: Edit `.tsx` and `.css` files under `src/`. Vite will hot-reload your changes instantly in the browser.
2. **Type Checking & Build Validation**:
   ```bash
   npm run build
   ```
   Ensure TypeScript passes with 0 errors before committing or deploying.
3. **Linting**:
   ```bash
   npm run lint
   ```

---

## 5. Working with Git

Always check status before committing:

```bash
git status
git diff
git add <files>
git commit -m "Description of change"
```

Never commit `content.json`, `.env`, or files in `backups/`. The `.gitignore` is pre-configured to protect them automatically.
