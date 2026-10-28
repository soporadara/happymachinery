#!/usr/bin/env python3
"""
Generate all favicon sizes and multi-resolution ICO from the master favicon.png (1254x1254).
"""

import os
import subprocess
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "favicon.png")
PUB = os.path.join(ROOT, "public")

if not os.path.exists(SRC):
    raise FileNotFoundError(f"Master favicon not found at {SRC}")

sizes = {
    "favicon.png": (512, 512),
    "favicon_cropped_master.png": (512, 512),
    "favicon-192x192.png": (192, 192),
    "apple-touch-icon.png": (180, 180),
    "favicon-48x48.png": (48, 48),
    "favicon-32x32.png": (32, 32),
    "favicon-16x16.png": (16, 16),
}

# 1. Generate PNGs using sips
for filename, (w, h) in sizes.items():
    dest = os.path.join(PUB, filename)
    cmd = ["sips", "-z", str(h), str(w), SRC, "--out", dest]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
    print(f"✔ Generated {filename} ({w}x{h})")

# Also copy/generate to public/images/favicon.png and webp
images_dir = os.path.join(PUB, "images")
os.makedirs(images_dir, exist_ok=True)
dest_img_png = os.path.join(images_dir, "favicon.png")
subprocess.run(["sips", "-z", "512", "512", SRC, "--out", dest_img_png], check=True, stdout=subprocess.DEVNULL)
print("✔ Generated public/images/favicon.png (512x512)")

dest_img_webp = os.path.join(images_dir, "favicon.webp")
subprocess.run(["cwebp", "-q", "90", dest_img_png, "-o", dest_img_webp], check=True, stdout=subprocess.DEVNULL)
print("✔ Generated public/images/favicon.webp (512x512)")

# 2. Package favicon.ico with 16x16, 32x32, 48x48 PNGs
# ICO format supports embedded PNG images directly (standard since Vista/Windows 7 / modern browsers)
ico_sizes = [16, 32, 48]
png_data = []

for size in ico_sizes:
    p = os.path.join(PUB, f"favicon-{size}x{size}.png")
    with open(p, "rb") as f:
        png_data.append(f.read())

ico_path = os.path.join(PUB, "favicon.ico")

# ICONDIR header: 2 bytes reserved (0), 2 bytes type (1 for ICO), 2 bytes count
header = struct.pack("<HHH", 0, 1, len(ico_sizes))

# ICONDIRENTRY: 16 bytes per image
# bWidth (1 byte), bHeight (1 byte), bColorCount (1 byte, 0 for 256+), bReserved (1 byte, 0)
# wPlanes (2 bytes, 1), wBitCount (2 bytes, 32), dwBytesInRes (4 bytes), dwImageOffset (4 bytes)
offset = 6 + (16 * len(ico_sizes))
entries = []

for i, size in enumerate(ico_sizes):
    data = png_data[i]
    w = size if size < 256 else 0
    h = size if size < 256 else 0
    entry = struct.pack(
        "<BBBBHHII",
        w,
        h,
        0,  # color count
        0,  # reserved
        1,  # color planes
        32, # bits per pixel
        len(data),
        offset
    )
    entries.append(entry)
    offset += len(data)

with open(ico_path, "wb") as f:
    f.write(header)
    for entry in entries:
        f.write(entry)
    for data in png_data:
        f.write(data)

print(f"✔ Generated favicon.ico ({os.path.getsize(ico_path)} bytes, multi-res: 16, 32, 48)")
