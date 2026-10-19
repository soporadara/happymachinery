# Happy Machinery — Production Backup & Verification Report

**Backup Date & Time:** October 19, 2026 01:01:42 UTC  
**Local Download Location:** `/Applications/XAMPP/xamppfiles/htdocs/happymachinery/backups/`  
**Hostinger Remote Location:** `/home/u534600013/happymachinery-backups/` (Permissions `0700`)  

---

## 1. Verified Backup Artifacts

| Artifact | Size | Description |
| :--- | :--- | :--- |
| `happymachinery_prod_backup_20261019_010142.tar.gz` | **205,893,197 bytes** (~197 MB) | Complete production archive containing source, built assets, uploads, and database storage |
| `happymachinery_prod_backup_20261019_010142.tar.gz.sha256` | 116 bytes | Cryptographic SHA256 checksum generated on Hostinger |
| `content_20261019_010142.json.sha256` | 147 bytes | Cryptographic SHA256 checksum of raw production content database |

---

## 2. Checksum Verification Results

### Archive Verification
- **Hostinger Server SHA256:**
  `5182ae55b425ff81aeb3f4a75743dfbaedce41b09c5d496c68f4890e86f1e098`
- **macOS Local SHA256:**
  `5182ae55b425ff81aeb3f4a75743dfbaedce41b09c5d496c68f4890e86f1e098`
- **Verification Status:** **PASSED (100% Bit-for-bit Match)**

```bash
$ shasum -a 256 -c happymachinery_prod_backup_20261019_010142.tar.gz.sha256
happymachinery_prod_backup_20261019_010142.tar.gz: OK
```

### Database Verification
- **Hostinger Server Database SHA256:**
  `9fdc299065ddd545c28146ad5b69d73df3dcb6793747d6a68bacd92362ea6c6e`
- **Local Database File SHA256:**
  `9fdc299065ddd545c28146ad5b69d73df3dcb6793747d6a68bacd92362ea6c6e`
- **Verification Status:** **PASSED (100% Bit-for-bit Match)**

---

## 3. Archive Contents Breakdown

The archive was verified with `tar -tzf` and contains:
1. `happy-machinery-storage/`: Raw JSON database (`content.json`) and concurrency lock (`content.lock`).
2. `public_html/`: Active web document root, compiled Vite JavaScript bundles, CSS stylesheets, PNG/WebP images, MP4 videos, and PHP API handlers.
3. `hbuilds/last-source/`: Complete uncompiled TypeScript + React source code, components, pages, data, package manifests, and Git history.
4. `hbuilds/config`: Build configuration and dependency manifests.
