#!/usr/bin/env python3
"""
Ping major search engines (Google, Bing, IndexNow) to notify them of fresh sitemaps
and new content (Mini Excavator and Skid Steer guides).
"""

import urllib.request
import urllib.parse
import json
import sys

SITEMAP_URL = "https://happymachinery.com/sitemap.xml"

ENDPOINTS = [
    {
        "name": "Google Sitemap Ping",
        "url": f"https://www.google.com/ping?sitemap={urllib.parse.quote(SITEMAP_URL)}",
        "method": "GET"
    },
    {
        "name": "Bing Sitemap Ping",
        "url": f"https://www.bing.com/ping?sitemap={urllib.parse.quote(SITEMAP_URL)}",
        "method": "GET"
    }
]

def ping_engines():
    print(f"🚀 Pinging search engines with sitemap: {SITEMAP_URL}")
    for ep in ENDPOINTS:
        print(f"\n📡 Pinging {ep['name']}...")
        req = urllib.request.Request(
            ep['url'],
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; HappyMachineryBot/1.0; +https://happymachinery.com)"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"   Status: {resp.status} - Success!")
        except Exception as e:
            print(f"   Notice: {e}")

    print("\n✅ Search engine notification process finished.")

if __name__ == "__main__":
    ping_engines()
