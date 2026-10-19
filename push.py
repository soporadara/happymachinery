#!/usr/bin/env python3
"""
Happy Machinery - Dedicated Git Push Script
Quickly stages, commits, and pushes updates to GitHub with safety validation.

Usage:
    python3 push.py
    python3 push.py -m "Updated About Us page styling"
    python3 push.py --skip-build
"""

import argparse
import os
import subprocess
import sys
import time

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

def main():
    parser = argparse.ArgumentParser(description="Stage, commit, and push updates to GitHub")
    parser.add_argument("-m", "--message", help="Commit message")
    parser.add_argument("--skip-build", action="store_true", help="Skip TypeScript build validation")
    args = parser.parse_args()

    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)

    print(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN} Happy Machinery — Git Push Utility                   {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}\n")

    # 1. Check for changes
    status_output = run_cmd(["git", "status", "--porcelain"], capture=True)
    if not status_output:
        # Check if ahead of remote
        ahead = run_cmd(["git", "log", "@{u}..HEAD", "--oneline"], capture=True)
        if not ahead:
            print(f"{Colors.GREEN}✔ Working tree is clean and already up-to-date with remote!{Colors.RESET}\n")
            return
        else:
            print(f"{Colors.CYAN}ℹ Local branch has unpushed commits:{Colors.RESET}")
            for line in ahead.splitlines():
                print(f"  {Colors.DIM}• {line}{Colors.RESET}")
    else:
        print(f"{Colors.BOLD}Changed files detected:{Colors.RESET}")
        for line in status_output.splitlines():
            code = line[:2].strip()
            path = line[3:].strip()
            print(f"  {Colors.YELLOW}{code}{Colors.RESET} {path}")
        print()

    # 2. Build verification (optional but recommended)
    if not args.skip_build:
        print(f"{Colors.BOLD}[1/3] Validating TypeScript & Build...{Colors.RESET}")
        start = time.time()
        try:
            run_cmd(["npm", "run", "build"], capture=True)
            elapsed = time.time() - start
            print(f"  {Colors.GREEN}✔ Build passed with 0 errors ({elapsed:.2f}s)!{Colors.RESET}\n")
        except Exception as e:
            print(f"  {Colors.RED}✖ Build failed! Code has errors. Aborting push.{Colors.RESET}")
            print(f"\n{Colors.RED}{e}{Colors.RESET}\n")
            print("Fix the errors above or run with --skip-build to push anyway.")
            sys.exit(1)
    else:
        print(f"{Colors.YELLOW}[1/3] Skipping build check (--skip-build).{Colors.RESET}\n")

    # 3. Commit message
    if status_output:
        commit_msg = args.message
        if not commit_msg:
            try:
                commit_msg = input(f"{Colors.BOLD}Enter commit message: {Colors.RESET}").strip()
            except (KeyboardInterrupt, EOFError):
                print("\nPush cancelled.")
                sys.exit(0)

        if not commit_msg:
            commit_msg = f"Update {time.strftime('%Y-%m-%d %H:%M:%S')}"
            print(f"  {Colors.DIM}Using default message: '{commit_msg}'{Colors.RESET}")

        print(f"{Colors.BOLD}[2/3] Staging and committing files...{Colors.RESET}")
        run_cmd(["git", "add", "-A"])
        run_cmd(["git", "commit", "-m", commit_msg])
        commit_hash = run_cmd(["git", "rev-parse", "--short", "HEAD"], capture=True)
        print(f"  {Colors.GREEN}✔ Commit created [{commit_hash}]: {commit_msg}{Colors.RESET}\n")
    else:
        print(f"{Colors.BOLD}[2/3] No new files to commit. Pushing existing local commits...{Colors.RESET}\n")

    # 4. Push to origin main
    print(f"{Colors.BOLD}[3/3] Pushing to GitHub (origin main)...{Colors.RESET}")
    try:
        run_cmd(["git", "push", "origin", "main"])
        print(f"\n{Colors.BOLD}{Colors.GREEN}======================================================{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN} ✔ SUCCESSFULLY PUSHED TO GITHUB!                     {Colors.RESET}")
        print(f"{Colors.CYAN} Repository: https://github.com/soporadara/happymachinery {Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}======================================================{Colors.RESET}\n")
    except Exception as e:
        print(f"\n{Colors.RED}✖ Push failed: {e}{Colors.RESET}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
