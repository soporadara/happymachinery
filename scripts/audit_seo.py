import json
import re
import os

storage_path = 'happy-machinery-storage/content.json'
with open(storage_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

posts = data.get('blog-posts', [])
print(f"=== TOTAL BLOG POSTS: {len(posts)} ===\n")

issues = []

for i, p in enumerate(posts):
    pid = p.get('id')
    title = p.get('title', '').strip()
    seo_title = p.get('seoTitle', '').strip()
    meta_desc = p.get('metaDescription', '').strip()
    excerpt = p.get('excerpt', '').strip()
    image_alt = p.get('imageAlt', '').strip()
    content = str(p.get('content') or '')
    
    # Check length & quality
    post_issues = []
    if len(seo_title) < 30 or len(seo_title) > 68:
        post_issues.append(f"SEO Title length ({len(seo_title)} chars)")
    if len(meta_desc) < 110 or len(meta_desc) > 165:
        post_issues.append(f"Meta Description length ({len(meta_desc)} chars)")
    if len(excerpt) < 50 or len(excerpt) > 220:
        post_issues.append(f"Excerpt length ({len(excerpt)} chars)")
    if len(image_alt) < 15:
        post_issues.append(f"Image Alt too short ({len(image_alt)} chars)")
    if not image_alt or image_alt.lower() in ['image', 'photo', 'alt', title.lower()]:
        post_issues.append("Image Alt is generic or identical to title")
        
    # Check inline images
    imgs = re.findall(r'<img\s+[^>]*src=[\'"]([^\'"]+)[\'"][^>]*>', content)
    empty_alts = re.findall(r'<img\s+[^>]*alt=[\'"]\s*[\'"][^>]*>', content)
    no_alts = [m for m in re.findall(r'<img\s+[^>]*>', content) if 'alt=' not in m]

    print(f"[{i+1}/{len(posts)}] ID {pid}: {title}")
    print(f"  SEO Title ({len(seo_title)} chars): {seo_title}")
    print(f"  Meta Desc ({len(meta_desc)} chars): {meta_desc}")
    print(f"  Excerpt   ({len(excerpt)} chars): {excerpt}")
    print(f"  Hero Alt  ({len(image_alt)} chars): {image_alt}")
    print(f"  Total Body Images: {len(imgs)} | Missing/Empty Alt: {len(empty_alts) + len(no_alts)}")
    if post_issues:
        print(f"  ⚠️ Potential optimizations: {', '.join(post_issues)}")
    print("-" * 75)
