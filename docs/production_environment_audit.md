# Happy Machinery — Production Environment Audit

**Date of Audit:** October 19, 2026  
**Audited Domain:** [https://happymachinery.com/](https://happymachinery.com/)  
**Hosting Provider:** Hostinger  
**Server Hostname / Node:** `us-bos-web1508.main-hosting.eu`  
**Server IP:** `194.164.64.89` (SSH Port: `65002`)  
**Operating System:** Linux 5.14.0-611.16.1.el9_7.x86_64 (CloudLinux / AlmaLinux 9 derivative with CageFS)  

---

## 1. Hosting Architecture & Filesystem Structure

```
/home/u534600013/
├── domains/
│   └── happymachinery.com/
│       ├── DO_NOT_UPLOAD_HERE
│       ├── happy-machinery-storage/    <-- Protected Database Storage (Outside Web Root)
│       │   ├── content.json            <-- Server-side JSON document store (~816 KB)
│       │   └── content.lock            <-- flock lockfile for atomic read/write
│       ├── hbuilds/                    <-- Hostinger Git-Triggered Deployment Pipeline
│       │   ├── last-source/            <-- Cloned Git repository & application source
│       │   ├── versions/               <-- Symlinked deployed release artifacts
│       │   └── logs/                   <-- Build execution logs
│       └── public_html/                <-- Live Web Document Root
│           ├── api/
│           │   └── content.php         <-- REST API for content operations
│           ├── assets/                 <-- Bundled CSS & JavaScript from Vite
│           ├── images/                 <-- High-resolution equipment images (~16 MB)
│           ├── videos/                 <-- Jobsite demonstration MP4 videos (~50 MB)
│           ├── index.html              <-- Single Page Application entry HTML
│           ├── share_image.php         <-- Social preview dynamic image generator
│           ├── share_preview.php       <-- Dynamic Open Graph server-side renderer
│           ├── sitemap.xml             <-- Search engine sitemap
│           ├── robots.txt              <-- Robot indexing rules
│           ├── .htaccess               <-- Apache / LiteSpeed URL rewrite rules
│           └── .user.ini               <-- PHP local overrides
└── happymachinery-backups/             <-- Timestamped verified backup archives (Mode 700)
```

---

## 2. Technology Stack & Runtime Versions

| Layer | Component | Version / Details |
| :--- | :--- | :--- |
| **Web Server / CDN** | Hostinger Edge CDN (`hcdn`) | HTTP/2, Brotli/Gzip, LiteSpeed/Apache upstream |
| **Frontend Framework** | React | `19.2.7` |
| **Frontend Routing** | React Router DOM | `7.18.1` (SPA Client Routing) |
| **Build Tooling** | Vite | `8.1.1` with `@vitejs/plugin-react` `6.0.3` & Rolldown Babel |
| **Language** | TypeScript | `6.0.2` |
| **Node.js Runtime** | Node | Production builder ran on Node 22 (`>=20 <25`) |
| **Backend Runtime** | PHP | `8.2.34` (cli/fpm) |
| **Database Engine** | Server-side Document Store | Atomic JSON store with `flock` file locking (`content.json`) |
| **Client Storage** | IndexedDB | `happy-machinery-content` DB with `content` objectStore |
| **Version Control** | Git | Remote: `https://github.com/KiuQ-Technologies-II/Happy-Machinery.git` (main) |

---

## 3. Database & Persistence Architecture

1. **Server Storage (`happy-machinery-storage/content.json`)**:
   - Stores all application state including `blog-posts`, `products`, `media-library`, and `cart-activity`.
   - Accessible strictly through `/api/content.php` using `GET`, `POST`, and `PUT`.
   - Thread-safe and process-safe concurrency guaranteed via `flock($lockHandle, LOCK_EX)` on `content.lock`.
   - Located **outside** `public_html` so raw database dumps or customer data cannot be downloaded over HTTP.

2. **Client Persistence (`IndexedDB`)**:
   - Implemented in `src/data/persistentStorage.ts`.
   - Serves cached data instantly to browser users with offline capability.
   - Synchronizes seamlessly with `/api/content.php`.

---

## 4. Web Server Routing & Rewrite Rules

The `.htaccess` configuration handles three critical functions:
1. **SEO & Social Crawler Redirection**: Requests from Facebook, Twitter, LinkedIn, Slack, Telegram, WhatsApp bots are intercepted and routed to `share_preview.php` for dynamic Open Graph tags.
2. **Dynamic Preview Images**: URLs like `/api/share-image/<slug>.png` route to `share_image.php`.
3. **API Pass-through**: `/api/content` routes to `api/content.php`.
4. **SPA Fallback**: All other paths route to `index.html` for React Router DOM.

---

## 5. Security & Sensitive Data Assessment

- **No Passwords or Secrets Committed**: The repository and source code contain no hardcoded database passwords, API tokens, or private keys.
- **Isolated Storage**: Database files are stored outside public document root.
- **SSH Authentication**: Secured with ED25519 public key authentication. Password login avoided in automated tools.
