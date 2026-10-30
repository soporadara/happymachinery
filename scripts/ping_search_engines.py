#!/usr/bin/env python3
"""
Ping IndexNow (Bing, Yandex, Seznam, Naver) and submit all live URLs
for immediate search crawler priority.
"""

import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
import os
import sys

KEY = "e69317b2b0054a8ea6ef07bc9db5ce54"
HOST = "happymachinery.com"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

def get_sitemap_urls():
    sitemap_path = os.path.join(os.path.dirname(__DIR__ if '__DIR__' in dir() else os.path.dirname(__file__)), "public", "sitemap.xml")
    if not os.path.exists(sitemap_path):
        return [
            f"https://{HOST}/",
            f"https://{HOST}/blog",
            f"https://{HOST}/store",
            f"https://{HOST}/blog/the-ultimate-guide-to-heavy-compact-excavators-sizing-hydraulics-and-performance-in-the-2-7-ton-to-4-ton"
        ]
    
    urls = []
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        for loc in root.findall('.//ns:loc', namespace):
            if loc.text:
                urls.append(loc.text.strip())
    except Exception as e:
        print(f"Error parsing sitemap: {e}")
        urls = [f"https://{HOST}/"]
    return urls

def submit_indexnow():
    urls = get_sitemap_urls()
    print(f"🚀 Found {len(urls)} URLs in sitemap to submit via IndexNow...")
    
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        INDEXNOW_ENDPOINT,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "HappyMachinerySEO/1.0"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"📡 IndexNow Response: HTTP {resp.status} {resp.reason}")
            if resp.status in (200, 202):
                print("✅ Successfully submitted all URLs to IndexNow! Search engines will prioritize indexing.")
            else:
                body = resp.read().decode('utf-8')
                print(f"Response body: {body}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8', errors='replace')}")
    except Exception as e:
        print(f"Error submitting to IndexNow: {e}")

if __name__ == "__main__":
    submit_indexnow()
