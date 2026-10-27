#!/usr/bin/env python3
"""
Populate and enrich all blog posts with comprehensive SEO metadata:
- seoTitle (Optimized for search results with brand suffix | Happy Machinery)
- metaDescription (140-160 chars with high-intent keywords)
- imageAlt (Descriptive, accessible alt text for featured cover images)
- excerpt (Clean, compelling introductory hooks)
- slug (Clean, unique URL slugs)
- tags (Relevant topic tags)
"""

import json
import os
import shutil

METADATA_MAP = {
    1793077020925: {
        "title": "Hydraulic Tipping Dumper for Fast Construction Material Unloading",
        "slug": "hydraulic-tipping-dumper-for-fast-construction-material-unloading",
        "category": "Jobsite Productivity",
        "excerpt": "Explore how hydraulic tipping dumpers streamline bulk material transport, accelerate discharge cycles, and reduce labor costs across challenging jobsite terrain.",
        "seoTitle": "Hydraulic Tipping Dumpers for Fast Unloading | Happy Machinery",
        "metaDescription": "Discover how hydraulic tipping dumpers speed up aggregate and soil unloading on tight jobsites, boosting material handling efficiency and worker safety.",
        "imageAlt": "Tracked hydraulic tipping dumper unloading aggregate material on construction site",
        "tags": ["Tracked Dumper", "Hydraulic Tipping", "Material Handling", "Jobsite Productivity", "Earthmoving"]
    },
    1793076972308: {
        "title": "Canopy Wheel Loader Design for Comfortable Outdoor Operation",
        "slug": "canopy-wheel-loader-design-for-comfortable-outdoor-operation",
        "category": "Jobsite Productivity",
        "excerpt": "Learn how heavy-duty canopy wheel loader designs deliver all-weather operator protection, unobstructed 360-degree visibility, and rugged reliability for outdoor work.",
        "seoTitle": "Canopy Wheel Loader Design & Outdoor Comfort | Happy Machinery",
        "metaDescription": "Explore canopy wheel loader ergonomics, weather resistance, and 360-degree site visibility for productive, safe outdoor construction and loading operations.",
        "imageAlt": "Heavy-duty compact wheel loader with open ROPS/FOPS canopy operating on outdoor yard",
        "tags": ["Wheel Loader", "Canopy Design", "Operator Ergonomics", "Site Safety", "Heavy Equipment"]
    },
    1793076922249: {
        "title": "Compact Forklift Benefits for Small Warehouses and Restricted Work Areas",
        "slug": "compact-forklift-benefits-for-small-warehouses-and-restricted-work-areas",
        "category": "Jobsite Productivity",
        "excerpt": "Discover how compact forklifts maneuver through narrow aisles and low-clearance doorways while maintaining high lifting capacities in space-constrained facilities.",
        "seoTitle": "Compact Forklift Benefits for Small Warehouses | Happy Machinery",
        "metaDescription": "Maximize storage capacity in narrow aisles. Learn how compact forklifts improve tight-space turning radius, fuel efficiency, and warehouse pallet handling.",
        "imageAlt": "Electric compact forklift handling pallets in narrow warehouse storage aisle",
        "tags": ["Compact Forklift", "Warehouse Equipment", "Narrow Aisle", "Material Handling", "Logistics"]
    },
    1793076807965: {
        "title": "Undercarriage Maintenance for Long-Term Excavator Performance",
        "slug": "undercarriage-maintenance-for-long-term-excavator-performance",
        "category": "Jobsite Productivity",
        "excerpt": "Master proactive excavator undercarriage maintenance. Learn proper track tensioning, roller inspection, and cleaning techniques to prevent costly track derailment.",
        "seoTitle": "Excavator Undercarriage Maintenance Guide | Happy Machinery",
        "metaDescription": "Extend excavator track and sprocket life. Step-by-step undercarriage maintenance tips for track tensioning, roller cleaning, and wear inspection.",
        "imageAlt": "Technicians inspecting and measuring mini excavator rubber track tension on jobsite",
        "tags": ["Excavator Maintenance", "Track Tension", "Undercarriage", "Heavy Machinery Care", "Equipment Longevity"]
    },
    1793076267147: {
        "title": "Selecting Trenching Equipment for Different Soil Conditions",
        "slug": "selecting-trenching-equipment-for-different-soil-conditions",
        "category": "Jobsite Productivity",
        "excerpt": "Choose the right trenching attachments and machines for clay, rock, sandy soil, and hardpan to avoid chain stalls, tooth wear, and project delays.",
        "seoTitle": "Selecting Trenching Equipment by Soil Type | Happy Machinery",
        "metaDescription": "Compare trenching equipment across rocky soil, sticky clay, and loose sand. Select optimal chain speeds, teeth types, and horsepower for clean trench cuts.",
        "imageAlt": "Compact trenching equipment digging utility trench through mixed gravel soil",
        "tags": ["Trenching Equipment", "Soil Types", "Utility Installation", "Ground Excavation", "Jobsite Machinery"]
    },
    1793071181516: {
        "title": "Skid Steer Ride Comfort and Operator Controls",
        "slug": "skid-steer-ride-comfort-and-operator-controls",
        "category": "Jobsite Productivity",
        "excerpt": "Discover how ergonomic seat suspension, intuitive pilot joystick controls, and low-vibration cabs reduce operator fatigue and boost productivity on long shifts.",
        "seoTitle": "Skid Steer Ride Comfort & Operator Controls | Happy Machinery",
        "metaDescription": "Boost operator productivity and reduce fatigue. Learn how skid steer cab ergonomics, pilot joysticks, and vibration dampening enhance long shift comfort.",
        "imageAlt": "Ergonomic skid steer operator cabin and pilot joystick control layout",
        "tags": ["Skid Steer", "Operator Comfort", "Pilot Joysticks", "Cab Ergonomics", "Vibration Control"]
    },
    1793067949016: {
        "title": "Why Consistent Rolling Speed Matters for Asphalt Quality",
        "slug": "why-consistent-rolling-speed-matters-for-asphalt-quality",
        "category": "Jobsite Productivity",
        "excerpt": "Achieve flawless asphalt compaction density and smooth surface mat finish by maintaining consistent rolling speeds without scuffing or wave formations.",
        "seoTitle": "Why Consistent Rolling Speed Matters for Asphalt | Happy Machinery",
        "metaDescription": "Prevent asphalt mat defects, ripples, and density voids. Learn the optimal rolling speed and vibratory pass patterns for long-lasting road paving.",
        "imageAlt": "Typhon asphalt road roller performing consistent passes on freshly paved roadway",
        "tags": ["Road Roller", "Asphalt Paving", "Compaction Speed", "Road Construction", "Pavement Quality"]
    },
    101: {
        "title": "Wheel loader pallet forks vs buckets for material handling",
        "slug": "wheel-loader-pallet-forks-vs-buckets-for-material-handling",
        "category": "Jobsite Productivity",
        "excerpt": "Compare wheel loader pallet forks against utility buckets to determine the ideal attachment for palletized cargo, lumber, gravel, bulk soil, and demolition debris.",
        "seoTitle": "Wheel Loader Pallet Forks vs Buckets Guide | Happy Machinery",
        "metaDescription": "Choosing between wheel loader pallet forks and buckets? Compare payload stability, cycle times, and attachment versatility for construction material handling.",
        "imageAlt": "Heavy-duty crimson red wheel loader equipped with pallet fork attachment lifting cargo",
        "tags": ["Wheel Loader", "Pallet Forks", "Loader Buckets", "Material Handling", "Attachments"]
    },
    102: {
        "title": "Can a Compact Excavator Work All Day?",
        "slug": "can-a-compact-excavator-work-all-day",
        "category": "Maintenance & Service",
        "excerpt": "Discover the operational strategies, cooling cycle management, and daily lubrication required to run mini excavators through rigorous 8 to 12-hour continuous shifts.",
        "seoTitle": "Can a Compact Excavator Work All Day? | Happy Machinery",
        "metaDescription": "Can mini excavators handle full-day heavy digging? Learn thermal management, fuel planning, and maintenance intervals for reliable all-day excavator shifts.",
        "imageAlt": "Compact mini excavator performing deep foundation digging during all-day operation",
        "tags": ["Mini Excavator", "Shift Productivity", "Thermal Management", "Equipment Duty Cycle", "Maintenance"]
    },
    103: {
        "title": "7 Essential Wheel Loader Bucket Capacity Tips for Better Performance",
        "slug": "7-essential-wheel-loader-bucket-capacity-tips-for-better-performance",
        "category": "Equipment Guide",
        "excerpt": "Discover how material density, heaped vs struck capacity, tipping load limits, and bucket geometry impact wheel loader productivity and fuel efficiency.",
        "seoTitle": "7 Wheel Loader Bucket Capacity Tips | Happy Machinery",
        "metaDescription": "Calculate correct wheel loader bucket capacity. 7 expert tips on material density, tipping load margins, and matched sizing to maximize payload efficiency.",
        "imageAlt": "Compact industrial wheel loader bucket loaded with construction aggregate",
        "tags": ["Wheel Loader", "Bucket Capacity", "Payload Optimization", "Tipping Load", "Equipment Sizing"]
    },
    104: {
        "title": "Signs Your Forklift Needs Immediate Maintenance",
        "slug": "signs-your-forklift-needs-immediate-maintenance",
        "category": "Maintenance & Service",
        "excerpt": "Identify early warning signs of forklift failure, including hydraulic leaks, mast drift, spongy brakes, and overheating, to prevent costly workplace downtime.",
        "seoTitle": "Signs Your Forklift Needs Immediate Service | Happy Machinery",
        "metaDescription": "Prevent forklift breakdowns and OSHA safety violations. Learn 5 critical warning signs that indicate your forklift requires immediate mechanical maintenance.",
        "imageAlt": "Industrial warehouse forklift undergoing routine hydraulic mast inspection",
        "tags": ["Forklift Maintenance", "Hydraulic Leaks", "Workplace Safety", "Fleet Inspection", "Preventive Service"]
    },
    1791448088509: {
        "title": "Stone Crusher Stabilizing Legs and Machine Support",
        "slug": "stone-crusher-stabilizing-legs-setup",
        "category": "Maintenance & Service",
        "excerpt": "Ensure safe and rock-solid rock crushing operations. Learn ground preparation, outrigger pad placement, and stabilizing leg deployment for portable stone crushers.",
        "seoTitle": "Stone Crusher Stabilizing Legs & Setup | Happy Machinery",
        "metaDescription": "Properly deploy stone crusher stabilizing legs. Master ground compaction, leveling protocols, and outrigger support to eliminate vibration and tipping hazards.",
        "imageAlt": "Heavy-duty mobile stone crusher with hydraulic stabilizing legs deployed on solid ground",
        "tags": ["Stone Crusher", "Stabilizing Legs", "Aggregates", "Outrigger Setup", "Quarry Equipment"]
    },
    1790997998793: {
        "title": "Road Roller Maintenance: Top 5 Fastest Wearing Parts",
        "slug": "road-roller-fastest-wearing-parts",
        "category": "Equipment Guide",
        "excerpt": "Protect your road roller investment by monitoring scraper bars, rubber shock mounts, exciter bearings, water spray nozzles, and hydraulic drive hoses.",
        "seoTitle": "Road Roller Maintenance: 5 Fastest Wearing Parts | Happy Machinery",
        "metaDescription": "Reduce road roller downtime. Discover the top 5 high-wear compaction components, early inspection warning signs, and preventative replacement schedules.",
        "imageAlt": "Technician inspecting drum scraper bars and vibration mounts on asphalt road roller",
        "tags": ["Road Roller", "Wearing Parts", "Vibration Bearings", "Asphalt Compaction", "Equipment Maintenance"]
    },
    1789951942470: {
        "title": "Common Dumper Machine Mistakes and How to Avoid Them",
        "slug": "common-dumper-machine-mistakes-prevention",
        "category": "Equipment Guide",
        "excerpt": "Avoid rollover hazards, drivetrain strain, and tipping accidents. Discover common mini dumper operating mistakes on slopes, uneven terrain, and heavy payloads.",
        "seoTitle": "Common Dumper Machine Mistakes & Prevention | Happy Machinery",
        "metaDescription": "Learn how to prevent dangerous mini dumper mistakes, from slope tipping to payload overloading, ensuring safe, rapid material hauling on any jobsite.",
        "imageAlt": "Tracked site dumper safely carrying gravel across muddy construction terrain",
        "tags": ["Mini Dumper", "Jobsite Safety", "Hauling Mistakes", "Slope Operation", "Material Transport"]
    },
    1789625584168: {
        "title": "Scissor Lift vs. Forklift: Choosing the Right Equipment for Your Jobsite",
        "slug": "scissor-lift-vs-forklift",
        "category": "Equipment Comparison",
        "excerpt": "Compare aerial work platforms and material handling equipment. Understand when your project needs the vertical reach of a scissor lift versus the lifting power of a forklift.",
        "seoTitle": "Scissor Lift vs Forklift: Which Do You Need? | Happy Machinery",
        "metaDescription": "Deciding between a scissor lift and forklift? Compare vertical personnel reach, pallet load ratings, maneuverability, and OSHA safety guidelines for your site.",
        "imageAlt": "Side-by-side comparison of electric scissor lift platform and industrial forklift truck",
        "tags": ["Scissor Lift", "Forklift Comparison", "Aerial Platforms", "Material Handling", "Jobsite Selection"]
    },
    1789348901657: {
        "title": "Why a Scissor Lift Level Working Surface is Critical for Safety",
        "slug": "why-scissor-lift-level-working-surface-matters",
        "category": "Maintenance & Service",
        "excerpt": "Learn why operating a scissor lift on uneven ground creates severe center-of-gravity shifts, tilt sensor alarms, and catastrophic tip-over hazards.",
        "seoTitle": "Scissor Lift Level Ground Safety Guide | Happy Machinery",
        "metaDescription": "Understand why level working surfaces are critical for scissor lift safety. Learn tilt sensor limits, outrigger pad usage, and rollover prevention on uneven ground.",
        "imageAlt": "Scissor lift platform raised on verified level concrete surface with safety cones",
        "tags": ["Scissor Lift Safety", "Ground Leveling", "Tilt Sensor", "Fall Prevention", "Aerial Work"]
    },
    1789009480535: {
        "title": "Excavator Boom Swing Angle & House Swing Differences",
        "slug": "excavator-boom-swing-angle-guide",
        "category": "Equipment Guide",
        "excerpt": "Master independent boom swing versus 360-degree house rotation. Learn how boom offset angles allow digging flush against walls and navigating congested urban sites.",
        "seoTitle": "Excavator Boom Swing vs House Swing Guide | Happy Machinery",
        "metaDescription": "Understand the technical difference between excavator boom swing and house slew. Learn how independent boom swing enables offset digging right alongside walls.",
        "imageAlt": "Mini excavator utilizing independent boom swing angle to dig trench parallel to foundation wall",
        "tags": ["Excavator Boom Swing", "House Swing", "Offset Digging", "Trenching Accuracy", "Excavator Mechanics"]
    },
    1788573203327: {
        "title": "What Happens When a Skid Steer Engine Is Too Small?",
        "slug": "undersized-skid-steer-engine-problems",
        "category": "Equipment Guide",
        "excerpt": "Discover why an undersized diesel engine reduces hydraulic auxiliary flow, bogs down in heavy clay, slows loader cycle times, and burns more fuel under load.",
        "seoTitle": "Problems with Undersized Skid Steer Engines | Happy Machinery",
        "metaDescription": "What happens when a skid steer lacks horsepower? Learn the mechanical consequences of undersized engines on hydraulic flow, stalling, and premature component wear.",
        "imageAlt": "Compact skid steer loader with open engine bay displaying diesel powertrain",
        "tags": ["Skid Steer Engine", "Horsepower", "Hydraulic Output", "Powertrain Sizing", "Equipment Performance"]
    },
    1788139329112: {
        "title": "Does Mast Height Affect Forklift Engine Power?",
        "slug": "does-mast-height-affect-forklift-engine-power",
        "category": "Maintenance & Service",
        "excerpt": "Explore the mechanical relationship between multi-stage forklift mast height, hydraulic pump displacement, mast weight, and net derated lifting capacity.",
        "seoTitle": "Does Mast Height Affect Forklift Power? | Happy Machinery",
        "metaDescription": "Learn how forklift mast height affects hydraulic pump load, stability triangle, and load derating at maximum height to choose the ideal mast configuration.",
        "imageAlt": "High-reach warehouse forklift with extended three-stage mast elevating pallet cargo",
        "tags": ["Forklift Mast", "Lift Capacity", "Hydraulic Pressure", "Warehouse Stacking", "Forklift Engineering"]
    },
    1787814099708: {
        "title": "Road Roller Drum Weight Performance",
        "slug": "road-roller-drum-weight-performance",
        "category": "Maintenance & Service",
        "excerpt": "Understand how front drum weight, linear load, and centrifugal vibration combine to compress aggregate base layers and asphalt without aggregate crushing.",
        "seoTitle": "Road Roller Drum Weight Performance Guide | Happy Machinery",
        "metaDescription": "Master road roller drum weight dynamics. Compare static linear pressure against vibratory amplitude to achieve high-density soil and asphalt compaction.",
        "imageAlt": "Heavy tandem vibratory road roller compacting asphalt base course on road construction project",
        "tags": ["Drum Weight", "Road Roller", "Static Linear Load", "Compaction Depth", "Asphalt Compactor"]
    },
    1787368105179: {
        "title": "Skid Steer Joystick Controls: Mechanical vs. Pilot Comparison",
        "slug": "skid-steer-joystick-controls-mechanical-vs-pilot",
        "category": "Maintenance & Service",
        "excerpt": "Compare direct mechanical linkage controls with low-effort hydraulic pilot joysticks to choose the best responsiveness, precision, and operator fatigue reduction.",
        "seoTitle": "Skid Steer Joystick Controls: Mechanical vs Pilot | Happy Machinery",
        "metaDescription": "Comparing skid steer joystick controls? Learn the pros and cons of direct mechanical vs hydraulic pilot joysticks for precision grading and operator comfort.",
        "imageAlt": "Close-up of modern skid steer hydraulic pilot joystick controls inside operator cabin",
        "tags": ["Skid Steer Controls", "Pilot Joysticks", "Mechanical Linkage", "Operator Interface", "Hydraulic Steering"]
    },
    1787273562044: {
        "title": "Scissor lift lifting stages: Mechanism, Safety & Control",
        "slug": "scissor-lift-lifting-stages",
        "category": "Jobsite Productivity",
        "excerpt": "Learn the mechanical stages of scissor lift elevation, hydraulic cylinder geometry, velocity fuse safeguards, and descending safety protocols.",
        "seoTitle": "Scissor Lift Lifting Stages & Safety Guide | Happy Machinery",
        "metaDescription": "Understand the mechanical stages of scissor lift elevation, hydraulic cylinder geometry, velocity fuses, and essential safety guidelines for high-reach work.",
        "imageAlt": "Electric scissor lift expanding through multi-stage pantograph scissor mechanism",
        "tags": ["Scissor Lift Stages", "Pantograph Mechanism", "Hydraulic Elevation", "Aerial Safety", "Elevation Stages"]
    },
    1786762945290: {
        "title": "Excavator Cooling System Problems and Solutions: Prevent Overheating",
        "slug": "excavator-cooling-system-problems-solutions",
        "category": "Maintenance & Service",
        "excerpt": "Diagnose and resolve common excavator cooling system issues, including clogged radiator fins, bad water pumps, low coolant, and cooling fan clutch failures.",
        "seoTitle": "Excavator Cooling System Problems & Fixes | Happy Machinery",
        "metaDescription": "Prevent excavator engine overheating. Step-by-step solutions for clogged radiator cores, coolant leaks, faulty thermostats, and cooling fan maintenance.",
        "imageAlt": "Technician inspecting radiator cooling system and engine coolant hoses on mini excavator",
        "tags": ["Excavator Cooling", "Engine Overheating", "Radiator Service", "Coolant Maintenance", "Equipment Repair"]
    },
    1786667615006: {
        "title": "Wheel loader pallet forks vs buckets: Jobsite Applications",
        "slug": "wheel-loader-pallet-forks-vs-buckets-applications",
        "category": "Jobsite Productivity",
        "excerpt": "Examine the operational tradeoffs between heavy-duty pallet forks and bulk material buckets to select the most profitable attachment for your fleet.",
        "seoTitle": "Loader Pallet Forks vs Buckets Applications | Happy Machinery",
        "metaDescription": "Compare loader pallet forks and material buckets for moving bulk dirt, landscaping pavers, lumber, and palletized construction materials efficiently.",
        "imageAlt": "Wheel loader switching between pallet fork attachment and general purpose bucket",
        "tags": ["Loader Pallet Forks", "Material Handling", "Jobsite Productivity", "Loader Attachments", "Quick Coupler"]
    },
    1784947777428: {
        "title": "Can a Compact Excavator Work All Day? Continuous Digging Guide",
        "slug": "can-a-compact-excavator-work-all-day-shift",
        "category": "Maintenance & Service",
        "excerpt": "Learn how proper hydraulic oil cooling, continuous fuel management, and shift rotation allow compact excavators to operate productively from sunrise to sunset.",
        "seoTitle": "Can a Compact Excavator Work All Day Shift? | Happy Machinery",
        "metaDescription": "Discover how to run compact mini excavators on continuous full-day shifts without hydraulic overheating, engine strain, or premature track wear.",
        "imageAlt": "Compact tracked mini excavator digging trenches continuously on commercial worksite",
        "tags": ["Compact Excavator", "All-Day Digging", "Hydraulic Endurance", "Excavator Performance", "Shift Duty Cycle"]
    },
    1788139694298: {
        "title": "How Drum Weight Affects Road Roller Compaction & Depth",
        "slug": "how-drum-weight-affects-road-roller-performance",
        "category": "Jobsite Productivity",
        "excerpt": "Master the science of road roller drum weight. Learn how linear load distribution, centrifugal force, and drum diameter dictate compaction depth in soil and asphalt.",
        "seoTitle": "How Drum Weight Affects Compaction Depth | Happy Machinery",
        "metaDescription": "Master road roller compaction physics. Discover how front drum weight, dynamic vibration force, and soil moisture influence maximum compaction depth.",
        "imageAlt": "Asphalt vibratory roller with heavy steel drum compacting aggregate base on highway project",
        "tags": ["Compaction Depth", "Road Roller Drum", "Vibratory Force", "Soil Compaction", "Asphalt Density"]
    },
    # Also include the other default posts:
    100: {
        "title": "Maximizing Skid Steer Efficiency & Safety on Residential Jobsites",
        "slug": "maximizing-skid-steer-efficiency-and-safety-on-residential-jobsites",
        "category": "Jobsite Productivity",
        "excerpt": "Key strategies and essential attachments to maximize efficiency, protect turf, and boost operator safety when operating compact skid steers on tight residential lots.",
        "seoTitle": "Maximizing Skid Steer Efficiency & Safety | Happy Machinery",
        "metaDescription": "Discover expert strategies and attachments to maximize compact skid steer productivity, protect residential turf, and enhance operator sightlines.",
        "imageAlt": "Compact stand-on mini skid steer loader operating with attachments on residential lawn",
        "tags": ["Skid Steer", "Residential Jobsites", "Turf Protection", "Attachments", "Operator Safety"]
    },
    1: {
        "title": "How to Choose the Right Mini Track Loader for Your Jobsite",
        "slug": "how-to-choose-the-right-mini-track-loader-for-your-jobsite",
        "category": "Equipment Guide",
        "excerpt": "Operating weight, hydraulic flow, track contact length, and attachment compatibility are critical parameters to consider before purchasing.",
        "seoTitle": "How to Choose the Right Mini Track Loader | Happy Machinery",
        "metaDescription": "Buyer guide: compare mini track loader operating weight, auxiliary hydraulic flow, ground pressure, and attachment compatibility for your jobsite.",
        "imageAlt": "Mini track loader navigating residential jobsite with auxiliary hydraulic attachment",
        "tags": ["Mini Track Loader", "Buyer Guide", "Hydraulic Flow", "Ground Pressure", "Compact Equipment"]
    },
    2: {
        "title": "Stand-On Track Loaders vs. Wheeled Skid Steers",
        "slug": "stand-on-track-loaders-vs-wheeled-skid-steers",
        "category": "Jobsite Productivity",
        "excerpt": "Understand ground pressure dynamics, grading capabilities, and track durability differences under residential and industrial soil conditions.",
        "seoTitle": "Stand-On Track Loaders vs Wheeled Skid Steers | Happy Machinery",
        "metaDescription": "Compare stand-on track loaders vs wheeled skid steers. Learn which delivers superior ground pressure, traction, turning agility, and turf preservation.",
        "imageAlt": "Side-by-side comparison of stand-on track loader and traditional wheeled skid steer",
        "tags": ["Track Loader vs Skid Steer", "Ground Pressure", "Traction", "Turf Preservation", "Machinery Comparison"]
    },
    3: {
        "title": "Daily Preventive Maintenance Checklist for Track Loaders",
        "slug": "daily-preventive-maintenance-checklist-for-track-loaders",
        "category": "Maintenance & Service",
        "excerpt": "Keep your machinery running through every shift. Essential checks for hydraulic fluid, track tension, and grease points that save thousands.",
        "seoTitle": "Daily Track Loader Maintenance Checklist | Happy Machinery",
        "metaDescription": "Daily preventative maintenance checklist for compact track loaders: inspect track tension, hydraulic fluid, engine filters, and grease points.",
        "imageAlt": "Service technician performing daily lubrication and fluid checks on compact track loader",
        "tags": ["Maintenance Checklist", "Track Loader Care", "Hydraulic Fluid", "Grease Points", "Preventive Service"]
    }
}

def enrich_posts(posts):
    enriched = []
    for post in posts:
        pid = post.get('id')
        meta = METADATA_MAP.get(pid, {})
        
        # If ID matched directly
        title = meta.get('title', post.get('title'))
        slug = meta.get('slug', post.get('slug'))
        if not slug or slug == 'None':
            import re
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        
        category = meta.get('category', post.get('category', 'Jobsite Productivity'))
        excerpt = meta.get('excerpt', post.get('excerpt'))
        if not excerpt:
            excerpt = title
            
        seoTitle = meta.get('seoTitle') or post.get('seoTitle') or f"{title} | Happy Machinery"
        metaDescription = meta.get('metaDescription') or post.get('metaDescription') or (excerpt[:155].strip() + '...')
        imageAlt = meta.get('imageAlt') or post.get('imageAlt') or post.get('alt') or title
        tags = meta.get('tags') or post.get('tags') or [category, "Heavy Machinery", "Construction Equipment"]

        # Clean content block images: ensure all markdown images have alt text
        content = post.get('content', [])
        new_content = []
        for block in content:
            if isinstance(block, str):
                # Replace empty alt ![ ](url) or generic ![](url)
                import re
                block = re.sub(r'!\[\s*\]\((https?://[^\s)]+)\)', rf'![{title} Machinery Asset](\1)', block)
            new_content.append(block)

        updated_post = dict(post)
        updated_post['title'] = title
        updated_post['slug'] = slug
        updated_post['category'] = category
        updated_post['excerpt'] = excerpt
        updated_post['seoTitle'] = seoTitle
        updated_post['metaDescription'] = metaDescription
        updated_post['imageAlt'] = imageAlt
        updated_post['alt'] = imageAlt
        updated_post['tags'] = tags
        updated_post['content'] = new_content
        
        enriched.append(updated_post)
    return enriched

def main():
    target_path = 'happy-machinery-storage/content_prod_sync.json'
    if not os.path.exists(target_path):
        target_path = 'happy-machinery-storage/content.json'
        
    with open(target_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    posts = data.get('blog-posts', [])
    print(f"Loaded {len(posts)} posts from {target_path}")
    
    enriched_posts = enrich_posts(posts)
    
    data['blog-posts'] = enriched_posts
    
    # Save to local content.json and sync file
    output_files = [
        'happy-machinery-storage/content.json',
        'happy-machinery-storage/content_prod_sync.json'
    ]
    for out in output_files:
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(enriched_posts)} enriched posts to {out}")

    # Summary
    print("\n=== ENRICHMENT SUMMARY ===")
    for i, p in enumerate(enriched_posts):
        print(f"[{i+1}] ID={p['id']}")
        print(f"     Title: {p['title']}")
        print(f"     Slug:  {p['slug']}")
        print(f"     SEO Title: {p['seoTitle']}")
        print(f"     Meta Desc: {p['metaDescription'][:80]}...")
        print(f"     Alt Text:  {p['imageAlt']}")
        print(f"     Excerpt:   {p['excerpt'][:80]}...")

if __name__ == '__main__':
    main()
