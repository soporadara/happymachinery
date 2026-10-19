#!/usr/bin/env python3
"""
Happy Machinery - Safe Automated Build, Production Deployment & Cache Purge
Usage:
    python3 deploy.py
    python3 deploy.py -m "Update about us page styling"
    python3 deploy.py --yes
    python3 deploy.py --dry-run
"""

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# Configuration
SSH_HOST = "happymachinery-prod"
REMOTE_BASE = "/home/u534600013/domains/happymachinery.com"
REMOTE_PUBLIC = f"{REMOTE_BASE}/public_html"
BACKUP_DIR = "/home/u534600013/happymachinery-backups"
LIVE_SITE_URL = "https://happymachinery.com"

# Terminal Colors
class Colors:
    GREEN = "\033[92m"
    BLUE = "\033[94m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def log_step(step: int, total: int, message: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}[{step}/{total}]{Colors.RESET} {Colors.BOLD}{message}{Colors.RESET}")

def log_success(message: str):
    print(f"  {Colors.GREEN}✔{Colors.RESET} {message}")

def log_info(message: str):
    print(f"  {Colors.CYAN}ℹ{Colors.RESET} {message}")

def log_warning(message: str):
    print(f"  {Colors.YELLOW}⚠{Colors.RESET} {message}")

def log_error(message: str):
    print(f"  {Colors.RED}✖ Error:{Colors.RESET} {message}")

def run_cmd(cmd: list, cwd: str = None, capture: bool = False, check: bool = True):
    try:
        if capture:
            res = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=check)
            return res.stdout.strip()
        else:
            subprocess.run(cmd, cwd=cwd, check=check)
            return ""
    except subprocess.CalledProcessError as e:
        err_msg = e.stderr.strip() if e.stderr else f"Command failed with exit code {e.returncode}"
        raise RuntimeError(err_msg)

def purge_server_cache():
    """Purge PHP OPcache, filesystem stat cache, LiteSpeed cache, and touch key files."""
    token = uuid.uuid4().hex
    remote_purge_file = f"{REMOTE_PUBLIC}/.purge_cache_{token}.php"
    
    php_code = f"""<?php
declare(strict_types=1);
if (($_GET['token'] ?? '') !== '{token}') {{ http_response_code(403); exit; }}
if (function_exists('opcache_reset')) {{ opcache_reset(); }}
clearstatcache(true);
header('X-LiteSpeed-Purge: *');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Content-Type: application/json');
echo json_encode(['purged' => true, 'time' => time()]);
"""
    # 1. Upload temporary purge script via SSH
    upload_cmd = f"cat << 'EOF' > '{remote_purge_file}'\n{php_code}\nEOF"
    run_cmd(["ssh", SSH_HOST, upload_cmd], capture=True)

    try:
        # 2. Trigger web request to execute inside web server's PHP-FPM environment
        purge_url = f"{LIVE_SITE_URL}/.purge_cache_{token}.php?token={token}"
        req = Request(purge_url, headers={"User-Agent": "HappyMachinery-CachePurge"})
        with urlopen(req, timeout=10) as resp:
            data = resp.read().decode('utf-8', errors='ignore')
            if "purged" in data:
                log_success("PHP-FPM OPcache & LiteSpeed Web Cache successfully flushed!")
            else:
                log_warning("Cache purge endpoint executed with unexpected response.")
    except Exception as e:
        log_warning(f"Could not trigger web cache flush endpoint: {e}")
    finally:
        # 3. Clean up the temporary purge script
        run_cmd(["ssh", SSH_HOST, f"rm -f '{remote_purge_file}'"], capture=True)

    # 4. Touch index.html and .htaccess to reload web server inode stats
    touch_cmd = f"touch '{REMOTE_PUBLIC}/.htaccess' '{REMOTE_PUBLIC}/index.html' 2>/dev/null || true"
    run_cmd(["ssh", SSH_HOST, touch_cmd], capture=True)
    log_success("Web server timestamp signals touched (index.html, .htaccess).")

def main():
    parser = argparse.ArgumentParser(description="Happy Machinery Safe Deployment Pipeline")
    parser.add_argument("-m", "--message", help="Commit message to auto-commit and push to Git")
    parser.add_argument("-y", "--yes", action="store_true", help="Skip interactive confirmation prompts")
    parser.add_argument("--dry-run", action="store_true", help="Only preview the files that will be uploaded")
    parser.add_argument("--skip-git", action="store_true", help="Skip git push step")
    parser.add_argument("--skip-cache", action="store_true", help="Skip cache purge step")
    args = parser.parse_args()

    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)

    print(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN} Happy Machinery — Production Deployer & Health Guard {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")

    total_steps = 7 if not args.skip_git else 6
    current_step = 1

    # Step 1: Verification & Local TypeScript/Vite Build
    log_step(current_step, total_steps, "Validating & Building Local Application (Zero-Error Check)")
    current_step += 1

    print("  Running: npm run build (tsc -b && vite build)...")
    build_start = time.time()
    try:
        build_output = run_cmd(["npm", "run", "build"], cwd=project_root, capture=True, check=True)
        build_time = time.time() - build_start
        log_success(f"Build compiled successfully with 0 errors in {build_time:.2f}s!")
    except Exception as e:
        log_error("Build failed! Aborting deployment. No changes were made to production.")
        print(f"\n{Colors.RED}{e}{Colors.RESET}")
        sys.exit(1)

    # Ensure dist folder exists
    dist_dir = os.path.join(project_root, "dist")
    if not os.path.isdir(dist_dir) or not os.path.isfile(os.path.join(dist_dir, "index.html")):
        log_error("dist/ directory is missing or corrupt after build.")
        sys.exit(1)

    # Step 2: Git Commit & Push (if enabled)
    if not args.skip_git:
        log_step(current_step, total_steps, "Git Synchronization")
        current_step += 1

        git_status = run_cmd(["git", "status", "--porcelain"], capture=True)
        if git_status:
            commit_msg = args.message
            if not commit_msg and not args.yes:
                print(f"  Uncommitted changes detected:\n{Colors.DIM}{git_status}{Colors.RESET}")
                prompt = input("  Enter commit message (or press Enter to skip git commit): ").strip()
                if prompt:
                    commit_msg = prompt

            if commit_msg:
                log_info(f"Staging and committing changes: '{commit_msg}'...")
                run_cmd(["git", "add", "-A"])
                run_cmd(["git", "commit", "-m", commit_msg])
                log_success("Git commit created.")

        log_info("Pushing to GitHub (origin main)...")
        try:
            run_cmd(["git", "push", "origin", "main"], capture=True)
            log_success("GitHub repository updated (origin main).")
        except Exception as e:
            log_warning(f"Git push warning: {e}")
            log_info("Continuing with production deployment...")

    # Step 3: Test Hostinger SSH Connectivity
    log_step(current_step, total_steps, "Verifying Hostinger SSH Connectivity")
    current_step += 1

    try:
        ssh_check = run_cmd(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", SSH_HOST, "echo OK"], capture=True)
        if ssh_check != "OK":
            raise RuntimeError("SSH test returned unexpected response.")
        log_success("Hostinger SSH connection authenticated.")
    except Exception as e:
        log_error(f"Cannot connect to Hostinger server via SSH ({SSH_HOST}).")
        log_error(str(e))
        sys.exit(1)

    # Step 4: Automatic Remote Pre-Deployment Backup
    log_step(current_step, total_steps, "Creating Instant Production Backup Snapshot")
    current_step += 1

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_file = f"{BACKUP_DIR}/pre_deploy_backup_{timestamp}.tar.gz"
    backup_cmd = (
        f"mkdir -p -m 700 '{BACKUP_DIR}' && "
        f"tar -czf '{backup_file}' -C '{REMOTE_BASE}' happy-machinery-storage public_html && "
        f"sha256sum '{backup_file}' > '{backup_file}.sha256' && "
        f"echo DONE"
    )

    log_info(f"Creating snapshot: {backup_file}...")
    try:
        remote_res = run_cmd(["ssh", SSH_HOST, backup_cmd], capture=True)
        if "DONE" in remote_res:
            log_success("Verified snapshot created on Hostinger outside web root.")
    except Exception as e:
        log_error(f"Failed to create pre-deployment backup on Hostinger: {e}")
        if not args.yes:
            proceed = input("  Continue without backup? (yes/no): ").strip().lower()
            if proceed != "yes":
                sys.exit(1)

    # Step 5: Safe Sync to Hostinger public_html
    log_step(current_step, total_steps, "Synchronizing Built Application to Production")
    current_step += 1

    rsync_excludes = [
        "--exclude=happy-machinery-storage",
        "--exclude=content.json",
        "--exclude=content.lock",
        "--exclude=*.log",
        "--exclude=.user.ini",
    ]

    # Show dry-run first
    log_info("Analyzing changes between local dist and production...")
    dry_run_cmd = ["rsync", "-avzn", "--delete"] + rsync_excludes + ["dist/", f"{SSH_HOST}:{REMOTE_PUBLIC}/"]
    diff_output = run_cmd(dry_run_cmd, capture=True)

    # Filter out header/footer lines
    changed_files = [line for line in diff_output.splitlines() if line and not line.startswith("sending") and not line.startswith("total") and line != "./"]
    
    if changed_files:
        print(f"  {Colors.BOLD}Files to be updated on production:{Colors.RESET}")
        for f in changed_files[:15]:
            print(f"    {Colors.DIM}• {f}{Colors.RESET}")
        if len(changed_files) > 15:
            print(f"    {Colors.DIM}... and {len(changed_files) - 15} more files.{Colors.RESET}")
    else:
        log_info("Production files are already up-to-date with dist.")

    if args.dry_run:
        print(f"\n{Colors.YELLOW}Dry-run mode completed. No files were transferred.{Colors.RESET}")
        return

    if not args.yes and changed_files:
        confirm = input(f"\n  {Colors.BOLD}Deploy updates to production now? (yes/no): {Colors.RESET}").strip().lower()
        if confirm != "yes":
            log_warning("Deployment cancelled by user. Production was not modified.")
            sys.exit(0)

    log_info("Uploading built frontend assets...")
    live_sync_cmd = ["rsync", "-avz", "--delete"] + rsync_excludes + ["dist/", f"{SSH_HOST}:{REMOTE_PUBLIC}/"]
    run_cmd(live_sync_cmd, capture=True)

    log_info("Ensuring PHP endpoints, API, and .htaccess are in sync...")
    backend_files = [
        "public/api/content.php",
        "public/share_preview.php",
        "public/share_image.php",
        "public/.htaccess"
    ]
    for b_file in backend_files:
        if os.path.exists(os.path.join(project_root, b_file)):
            dest_dir = REMOTE_PUBLIC if not b_file.startswith("public/api") else f"{REMOTE_PUBLIC}/api"
            run_cmd(["rsync", "-avz", b_file, f"{SSH_HOST}:{dest_dir}/"], capture=True)

    log_success("All files successfully transferred to Hostinger public_html!")

    # Step 6: Clear Server, OPcache & CDN Caches
    if not args.skip_cache:
        log_step(current_step, total_steps, "Flushing Server, OPcache & LiteSpeed Caches")
        current_step += 1
        purge_server_cache()

    # Step 7: Post-Deployment Smoke Tests & Health Check
    log_step(current_step, total_steps, "Post-Deployment Live Health Verification")
    
    time.sleep(1) # Brief pause for edge cache propagation

    def check_endpoint(url: str, desc: str) -> bool:
        try:
            req = Request(url, headers={"User-Agent": "Mozilla/5.0 (Deployment Health Guard)"})
            with urlopen(req, timeout=10) as resp:
                code = resp.getcode()
                if code == 200:
                    log_success(f"{desc}: HTTP 200 OK")
                    return True
                else:
                    log_warning(f"{desc}: HTTP {code}")
                    return False
        except Exception as e:
            log_error(f"{desc} failed: {e}")
            return False

    homepage_ok = check_endpoint(LIVE_SITE_URL, "Live Homepage (https://happymachinery.com/)")
    api_ok = check_endpoint(f"{LIVE_SITE_URL}/api/content.php?key=products", "Products API Endpoint")
    blog_ok = check_endpoint(f"{LIVE_SITE_URL}/api/content.php?key=blog-posts", "Blog Posts API Endpoint")

    print(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    if homepage_ok and api_ok and blog_ok:
        print(f"{Colors.BOLD}{Colors.GREEN} ✔ DEPLOYMENT SUCCESSFUL — ALL SYSTEMS OPERATIONAL! {Colors.RESET}")
        print(f"{Colors.DIM} Live URL: {LIVE_SITE_URL}{Colors.RESET}")
        print(f"{Colors.DIM} Rollback Snapshot: {backup_file}{Colors.RESET}")
    else:
        print(f"{Colors.BOLD}{Colors.YELLOW} ⚠ DEPLOYMENT FINISHED WITH WARNINGS! {Colors.RESET}")
        print(f" If needed, roll back using: ./rollback.sh {os.path.basename(backup_file)}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}\n")

if __name__ == "__main__":
    main()
