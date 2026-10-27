#!/usr/bin/env python3
"""
Update and enrich all 26 blog posts with:
- Target SEO Titles (50-60 chars) with high-intent keywords + | Happy Machinery
- Compelling Meta Descriptions (140-160 chars) with keywords and action hooks
- Clean, engaging Excerpts (140-175 chars)
- Rich Hero Image Alt tags (50-95 chars)
- Rich Body Image Figures with descriptive alt attributes and informative captions
"""

import json
import re
import os

storage_path = 'happy-machinery-storage/content.json'
with open(storage_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

posts = data.get('blog-posts', [])
print(f"Loaded {len(posts)} posts from {storage_path}")

# Complete SEO enrichment dictionary keyed by post ID
SEO_ENRICHMENTS = {
    1793077020925: {
        "seoTitle": "Hydraulic Tipping Dumpers for Fast Unloading | Happy Machinery",
        "metaDescription": "Discover how hydraulic tipping dumpers speed up aggregate and soil unloading on tight jobsites, boosting material handling efficiency and worker safety.",
        "excerpt": "Explore how hydraulic tipping dumpers streamline bulk material transport, accelerate discharge cycles, and reduce labor costs across challenging jobsite terrain.",
        "imageAlt": "Tracked hydraulic tipping dumper unloading aggregate material on construction site",
        "bodyImages": {
            "Dumper-02.webp": {
                "alt": "Tracked mini dumper chassis and track undercarriage inspection on jobsite",
                "caption": "Tires or Tracks: Inspect tire pressure, tread wear, and rubber track tension to ensure maximum hauling stability."
            },
            "Dumper-03.webp": {
                "alt": "Heavy-duty hydraulic dumper skip raised at full dump angle discharging rock",
                "caption": "Full dump angle discharge accelerates material unloading without manual shoveling."
            }
        }
    },
    1793076972308: {
        "seoTitle": "Canopy Wheel Loader Design & Outdoor Comfort | Happy Machinery",
        "metaDescription": "Explore canopy wheel loader ergonomics, weather resistance, and 360-degree site visibility for productive, safe outdoor construction and loading operations.",
        "excerpt": "Learn how heavy-duty canopy wheel loader designs deliver all-weather operator protection, unobstructed 360-degree visibility, and rugged reliability for outdoor work.",
        "imageAlt": "Heavy-duty compact wheel loader with open ROPS/FOPS canopy operating on outdoor yard",
        "bodyImages": {
            "WheelLoader-02.webp": {
                "alt": "ROPS certified open operator canopy frame on compact industrial wheel loader",
                "caption": "Heavy-gauge steel ROPS/FOPS certified protective structure shielding the operator."
            },
            "WheelLoader-03.webp": {
                "alt": "Ergonomic steering console and suspension seat inside wheel loader open canopy",
                "caption": "Weather-resistant controls and adjustable suspension seat designed for long outdoor shifts."
            }
        }
    },
    1793076922249: {
        "seoTitle": "Compact Forklift Benefits for Small Warehouses | Happy Machinery",
        "metaDescription": "Maximize storage capacity in narrow aisles. Learn how compact forklifts improve tight-space turning radius, fuel efficiency, and warehouse pallet handling.",
        "excerpt": "Discover how compact forklifts maneuver through narrow aisles and low-clearance doorways while maintaining high lifting capacities in space-constrained facilities.",
        "imageAlt": "Electric compact forklift handling pallets in narrow warehouse storage aisle",
        "bodyImages": {
            "Forklift-02.webp": {
                "alt": "Compact electric warehouse forklift turning tightly inside narrow pallet racking aisle",
                "caption": "Tight turning radius enables efficient pallet placement in high-density storage bays."
            },
            "Forklift-03.webp": {
                "alt": "Heavy-duty hydraulic mast and carriage lifting palletized freight in distribution center",
                "caption": "Rigid multi-stage mast delivers high vertical reach without compromising chassis stability."
            }
        }
    },
    1793076807965: {
        "seoTitle": "Excavator Undercarriage Maintenance Guide | Happy Machinery",
        "metaDescription": "Extend excavator track and sprocket life. Step-by-step undercarriage maintenance tips for track tensioning, roller cleaning, and wear inspection.",
        "excerpt": "Master proactive excavator undercarriage maintenance. Learn proper track tensioning, roller inspection, and cleaning techniques to prevent costly track derailment.",
        "imageAlt": "Technicians inspecting and measuring mini excavator rubber track tension on jobsite",
        "bodyImages": {
            "MiniExcavator-02.webp": {
                "alt": "Measuring rubber track deflection and track tension on mini excavator undercarriage",
                "caption": "Regular track sag measurement prevents premature track stretching and roller wear."
            },
            "MiniExcavator-03.webp": {
                "alt": "Detailed view of excavator drive sprocket teeth and track roller assembly",
                "caption": "Inspect drive sprocket teeth and track idlers for uneven wear patterns and seal leaks."
            }
        }
    },
    1793076267147: {
        "seoTitle": "Selecting Trenching Equipment by Soil Type | Happy Machinery",
        "metaDescription": "Compare trenching equipment across rocky soil, sticky clay, and loose sand. Select optimal chain speeds, teeth types, and horsepower for clean trench cuts.",
        "excerpt": "Choose the right trenching attachments and machines for clay, rock, sandy soil, and hardpan to avoid chain stalls, tooth wear, and project delays.",
        "imageAlt": "Compact trenching equipment digging utility trench through mixed gravel soil",
        "bodyImages": {
            "Trencher-02.webp": {
                "alt": "Close-up of heavy-duty trencher digging chain equipped with carbide-tipped cup teeth",
                "caption": "Cup teeth slice efficiently through sandy loam, while carbide bullet teeth pulverize hardpan."
            },
            "Trencher-03.webp": {
                "alt": "Compact trencher cutting precise utility line trench parallel to residential walkway",
                "caption": "Maintain matched ground speed to prevent chain bogging and uneven trench depth."
            }
        }
    },
    1793071181516: {
        "seoTitle": "Skid Steer Ride Comfort & Operator Controls | Happy Machinery",
        "metaDescription": "Boost operator productivity and reduce fatigue. Learn how skid steer cab ergonomics, pilot joysticks, and vibration dampening enhance long shift comfort.",
        "excerpt": "Discover how ergonomic seat suspension, intuitive pilot joystick controls, and low-vibration cabs reduce operator fatigue and boost productivity on long shifts.",
        "imageAlt": "Ergonomic skid steer operator cabin and pilot joystick control layout",
        "bodyImages": {
            "SkidSteer-05.webp": {
                "alt": "Adjustable mechanical suspension seat with lumbar support inside skid steer cab",
                "caption": "Proper seat height and lumbar positioning isolates operator from harsh jobsite vibrations."
            },
            "SkidSteer-06.webp": {
                "alt": "Low-effort hydraulic pilot joystick controls mounted to operator armrests",
                "caption": "Electro-hydraulic pilot controls offer featherlight responsiveness and wrist support."
            }
        }
    },
    1793067949016: {
        "seoTitle": "Why Consistent Rolling Speed Matters for Asphalt | Happy Machinery",
        "metaDescription": "Prevent asphalt mat defects, ripples, and density voids. Learn the optimal rolling speed and vibratory pass patterns for long-lasting road paving.",
        "excerpt": "Achieve flawless asphalt compaction density and smooth surface mat finish by maintaining consistent rolling speeds without scuffing or wave formations.",
        "imageAlt": "Typhon asphalt road roller performing consistent passes on freshly paved roadway",
        "bodyImages": {
            "RollingSpeed-02.webp": {
                "alt": "Typhon Fury 15 asphalt road roller performing consistent roller passes on a newly paved road",
                "caption": "Typhon Fury 15 asphalt road roller performing consistent roller passes on a newly paved road."
            },
            "RollingSpeed-03.webp": {
                "alt": "Yellow Fury 10 road roller compacting hot asphalt during a road paving project",
                "caption": "Yellow Fury 10 road roller compacting hot asphalt during a road paving project."
            }
        }
    },
    101: {
        "seoTitle": "Wheel Loader Pallet Forks vs Buckets Guide | Happy Machinery",
        "metaDescription": "Choosing between wheel loader pallet forks and buckets? Compare payload stability, cycle times, and attachment versatility for construction material handling.",
        "excerpt": "Compare wheel loader pallet forks against utility buckets to determine the ideal attachment for palletized cargo, lumber, gravel, bulk soil, and demolition debris.",
        "imageAlt": "Heavy-duty crimson red wheel loader equipped with pallet fork attachment lifting cargo",
        "bodyImages": {}
    },
    102: {
        "seoTitle": "Can a Compact Excavator Work All Day? | Happy Machinery",
        "metaDescription": "Can mini excavators handle full-day heavy digging? Learn thermal management, fuel planning, and maintenance intervals for reliable all-day excavator shifts.",
        "excerpt": "Discover the operational strategies, cooling cycle management, and daily lubrication required to run mini excavators through rigorous 8 to 12-hour continuous shifts.",
        "imageAlt": "Compact mini excavator performing deep foundation digging during all-day operation",
        "bodyImages": {}
    },
    103: {
        "seoTitle": "7 Wheel Loader Bucket Capacity Tips | Happy Machinery",
        "metaDescription": "Calculate correct wheel loader bucket capacity. 7 expert tips on material density, tipping load margins, and matched sizing to maximize payload efficiency.",
        "excerpt": "Discover how material density, heaped vs struck capacity, tipping load limits, and bucket geometry impact wheel loader productivity and fuel efficiency.",
        "imageAlt": "Compact industrial wheel loader bucket loaded with construction aggregate",
        "bodyImages": {}
    },
    104: {
        "seoTitle": "Signs Your Forklift Needs Immediate Service | Happy Machinery",
        "metaDescription": "Prevent forklift breakdowns and OSHA safety violations. Learn 5 critical warning signs that indicate your forklift requires immediate mechanical maintenance.",
        "excerpt": "Identify early warning signs of forklift failure, including hydraulic leaks, mast drift, spongy brakes, and overheating, to prevent costly workplace downtime.",
        "imageAlt": "Industrial warehouse forklift undergoing routine hydraulic mast inspection",
        "bodyImages": {}
    },
    1791448088509: {
        "seoTitle": "Stone Crusher Stabilizing Legs & Setup | Happy Machinery",
        "metaDescription": "Properly deploy stone crusher stabilizing legs. Master ground compaction, leveling protocols, and outrigger support to eliminate vibration and tipping hazards.",
        "excerpt": "Ensure safe and rock-solid rock crushing operations. Learn ground preparation, outrigger pad placement, and stabilizing leg deployment for portable stone crushers.",
        "imageAlt": "Heavy-duty mobile stone crusher with hydraulic stabilizing legs deployed on solid ground",
        "bodyImages": {
            "STONEKRUSHER-02.webp": {
                "alt": "Heavy-duty steel outrigger stabilizing leg planted on wooden cribbing pad",
                "caption": "Wide stabilizer footing distributes dynamic crushing loads across compacted subsoil."
            },
            "STONEKRUSHER-03.webp": {
                "alt": "Portable stone crusher crushing jaw assembly processing quarry rocks",
                "caption": "Rock-solid machine leveling prevents frame stress and eccentric bearing fatigue."
            }
        }
    },
    1790997998793: {
        "seoTitle": "Road Roller Maintenance: 5 Fastest Wearing Parts | Happy Machinery",
        "metaDescription": "Reduce road roller downtime. Discover the top 5 high-wear compaction components, early inspection warning signs, and preventative replacement schedules.",
        "excerpt": "Protect your road roller investment by monitoring scraper bars, rubber shock mounts, exciter bearings, water spray nozzles, and hydraulic drive hoses.",
        "imageAlt": "Technician inspecting drum scraper bars and vibration mounts on asphalt road roller",
        "bodyImages": {
            "RoadRoller-02.webp": {
                "alt": "Tandem road roller steel drum scraper bar and pressurized water spray bar",
                "caption": "Regular scraper blade adjustment prevents asphalt buildup and drum gouging."
            },
            "RoadRoller-03.webp": {
                "alt": "Heavy-duty rubber vibration isolation mounts connecting compactor drum to frame",
                "caption": "Check rubber isolators for cracks, tearing, and oil degradation to protect the operator."
            }
        }
    },
    1789951942470: {
        "seoTitle": "Common Dumper Machine Mistakes & Prevention | Happy Machinery",
        "metaDescription": "Learn how to prevent dangerous mini dumper mistakes, from slope tipping to payload overloading, ensuring safe, rapid material hauling on any jobsite.",
        "excerpt": "Avoid rollover hazards, drivetrain strain, and tipping accidents. Discover common mini dumper operating mistakes on slopes, uneven terrain, and heavy payloads.",
        "imageAlt": "Tracked site dumper safely carrying gravel across muddy construction terrain",
        "bodyImages": {
            "DumperCommonMistakes-02.webp": {
                "alt": "Compact tracked site dumper navigating muddy construction access road",
                "caption": "Always approach steep inclines straight on rather than traversing diagonally to prevent rollovers."
            },
            "DumperCommonMistakes-03.webp": {
                "alt": "Mini dumper hydraulic skip raised in dumping position on construction jobsite",
                "caption": "Never travel with the hopper elevated; always lower the body completely before moving."
            }
        }
    },
    1789625584168: {
        "seoTitle": "Scissor Lift vs Forklift: Which Do You Need? | Happy Machinery",
        "metaDescription": "Deciding between a scissor lift and forklift? Compare vertical personnel reach, pallet load ratings, maneuverability, and OSHA safety guidelines for your site.",
        "excerpt": "Compare aerial work platforms and material handling equipment. Understand when you need a personnel scissor lift versus a material-moving forklift.",
        "imageAlt": "Side-by-side comparison of electric scissor lift platform and industrial forklift truck",
        "bodyImages": {
            "ScissorLiftVsForkLift-02.webp": {
                "alt": "Electric self-propelled scissor lift elevated for electrical installation in warehouse",
                "caption": "Scissor lifts provide broad, stable elevated work platforms for workers and their tools."
            },
            "ScissorLiftVsForkLift-03.webp": {
                "alt": "Industrial counterbalance forklift moving heavy freight pallet across shipping yard",
                "caption": "Forklifts are engineered specifically for rapid horizontal and vertical pallet transfer."
            }
        }
    },
    1789348901657: {
        "seoTitle": "Scissor Lift Level Ground Safety Guide | Happy Machinery",
        "metaDescription": "Understand why level working surfaces are critical for scissor lift safety. Learn tilt sensor limits, outrigger pad usage, and rollover prevention on uneven ground.",
        "excerpt": "Learn why operating a scissor lift on uneven ground creates severe center-of-gravity shifts, tilt sensor alarms, and catastrophic tip-over hazards.",
        "imageAlt": "Scissor lift platform raised on verified level concrete surface with safety cones",
        "bodyImages": {
            "ScissorLift-05.webp": {
                "alt": "Rough terrain scissor lift with outrigger leveling jacks deployed on jobsite soil",
                "caption": "Hydraulic auto-leveling outriggers compensate for uneven ground contours before elevating."
            },
            "ScissorLift-06.webp": {
                "alt": "Digital electronic tilt sensor display on modern scissor lift ground control panel",
                "caption": "Tilt sensor interlocks automatically disable lift functions when slopes exceed safe thresholds."
            }
        }
    },
    1789009480535: {
        "seoTitle": "Excavator Boom Swing vs House Swing Guide | Happy Machinery",
        "metaDescription": "Understand the technical difference between excavator boom swing and house slew. Learn how independent boom swing enables offset digging right alongside walls.",
        "excerpt": "Master independent boom swing versus 360-degree house rotation. Learn how boom offset angles allow digging flush against walls and navigating congested urban sites.",
        "imageAlt": "Mini excavator utilizing independent boom swing angle to dig trench parallel to foundation wall",
        "bodyImages": {
            "MiniExcavator-05.webp": {
                "alt": "Mini excavator boom pivoted left using independent hydraulic boom swing cylinder",
                "caption": "Independent boom swing allows trenching tight against building foundations without house rotation."
            },
            "MiniExcavator-06.webp": {
                "alt": "Excavator operator cab and zero tail swing profile working in narrow alleyway",
                "caption": "Combining zero tail swing with boom offset delivers unmatched tight-space digging agility."
            }
        }
    },
    1788573203327: {
        "seoTitle": "Problems with Undersized Skid Steer Engines | Happy Machinery",
        "metaDescription": "What happens when a skid steer lacks horsepower? Learn the mechanical consequences of undersized engines on hydraulic flow, stalling, and premature component wear.",
        "excerpt": "Discover why an undersized diesel engine reduces hydraulic auxiliary flow, bogs down in heavy clay, slows loader cycle times, and burns more fuel under load.",
        "imageAlt": "Compact skid steer loader with open engine bay displaying diesel powertrain",
        "bodyImages": {
            "SkidSteer-01.webp": {
                "alt": "Compact diesel engine bay with hydraulic tandem pumps on skid steer loader",
                "caption": "Sufficient engine displacement ensures continuous auxiliary hydraulic pressure under peak load."
            },
            "SkidSteer-02.webp": {
                "alt": "Skid steer loader pushing into heavy aggregate pile demonstrating tractive effort",
                "caption": "Undersized engines stall during combined drive and lift maneuvers, reducing productivity."
            }
        }
    },
    1788139329112: {
        "seoTitle": "Does Mast Height Affect Forklift Power? | Happy Machinery",
        "metaDescription": "Learn how forklift mast height affects hydraulic pump load, stability triangle, and load derating at maximum height to choose the ideal mast configuration.",
        "excerpt": "Explore the mechanical relationship between multi-stage forklift mast height, hydraulic pump displacement, mast weight, and net derated lifting capacity.",
        "imageAlt": "High-reach warehouse forklift with extended three-stage mast elevating pallet cargo",
        "bodyImages": {
            "Forklift-03.webp": {
                "alt": "Full extension triplex mast on warehouse forklift reaching high storage racks",
                "caption": "Taller masts add tare weight and increase hydraulic demand during continuous high-lift cycles."
            },
            "Forklift-02.webp": {
                "alt": "Forklift load capacity chart showing capacity derating curves at high fork elevations",
                "caption": "Always consult the data plate derating chart when handling heavy loads at maximum mast height."
            }
        }
    },
    1787814099708: {
        "seoTitle": "Road Roller Drum Weight Performance Guide | Happy Machinery",
        "metaDescription": "Master road roller drum weight dynamics. Compare static linear pressure against vibratory amplitude to achieve high-density soil and asphalt compaction.",
        "excerpt": "Understand how front drum weight, linear load, and centrifugal vibration combine to compress aggregate base layers and asphalt without aggregate crushing.",
        "imageAlt": "Heavy tandem vibratory road roller compacting asphalt base course on road construction project",
        "bodyImages": {
            "RoadRollerDrumWeight-02.webp": {
                "alt": "Heavy steel roller drum cross-section showing internal eccentric vibratory shaft",
                "caption": "Internal rotating eccentric weights multiply static drum weight into high-impact dynamic force."
            },
            "RoadRollerDrumWeight-03.webp": {
                "alt": "Compaction testing technician measuring asphalt core density behind tandem road roller",
                "caption": "Correct drum weight achieves required soil and asphalt density with fewer total roller passes."
            }
        }
    },
    1787368105179: {
        "seoTitle": "Skid Steer Joystick Controls: Mechanical vs Pilot | Happy Machinery",
        "metaDescription": "Comparing skid steer joystick controls? Learn the pros and cons of direct mechanical vs hydraulic pilot joysticks for precision grading and operator comfort.",
        "excerpt": "Compare direct mechanical linkage controls with low-effort hydraulic pilot joysticks to choose the best responsiveness, precision, and operator fatigue reduction.",
        "imageAlt": "Close-up of modern skid steer hydraulic pilot joystick controls inside operator cabin",
        "bodyImages": {
            "SkidSteerControl-02.webp": {
                "alt": "Mechanical control linkage levers underneath skid steer floor plate",
                "caption": "Direct mechanical linkages provide tactile ground resistance feedback but require greater arm effort."
            },
            "SkidSteerControl-03.webp": {
                "alt": "Ergonomic low-effort pilot joystick with auxiliary hydraulic thumb rollers",
                "caption": "Pilot controls deliver smooth, proportional feathering ideal for delicate grading work."
            }
        }
    },
    1787273562044: {
        "seoTitle": "Scissor Lift Lifting Stages & Safety Guide | Happy Machinery",
        "metaDescription": "Understand the mechanical stages of scissor lift elevation, hydraulic cylinder geometry, velocity fuses, and essential safety guidelines for high-reach work.",
        "excerpt": "Learn the mechanical stages of scissor lift elevation, hydraulic cylinder geometry, velocity fuse safeguards, and descending safety protocols.",
        "imageAlt": "Electric scissor lift expanding through multi-stage pantograph scissor mechanism",
        "bodyImages": {
            "ScissorLift-02.webp": {
                "alt": "Heavy-duty hydraulic lift cylinders positioned between scissor stack scissor arms",
                "caption": "Cylinder thrust angle changes throughout lift elevation, demanding peak hydraulic pressure at ground level."
            },
            "ScissorLift-03.webp": {
                "alt": "Emergency descent lowering valve and safety maintenance prop on scissor lift base",
                "caption": "Mechanical maintenance props must be engaged before servicing scissor lift hydraulic cylinders."
            }
        }
    },
    1786762945290: {
        "seoTitle": "Excavator Cooling System Problems & Fixes | Happy Machinery",
        "metaDescription": "Prevent excavator engine overheating. Step-by-step solutions for clogged radiator cores, coolant leaks, faulty thermostats, and cooling fan maintenance.",
        "excerpt": "Diagnose and resolve common excavator cooling system issues, including clogged radiator fins, bad water pumps, low coolant, and cooling fan clutch failures.",
        "imageAlt": "Technician inspecting radiator cooling system and engine coolant hoses on mini excavator",
        "bodyImages": {
            "b11-02.webp": {
                "alt": "Aluminum radiator core and oil cooler fins clogged with jobsite dust and debris",
                "caption": "Blow out radiator and oil cooler cores regularly using compressed air from the inside out."
            },
            "b11-03.webp": {
                "alt": "Inspecting engine coolant expansion tank level and pressure cap on excavator",
                "caption": "Verify cooling system pressure cap integrity and inspect radiator hoses for swelling or cracks."
            }
        }
    },
    1786667615006: {
        "seoTitle": "Loader Pallet Forks vs Buckets Applications | Happy Machinery",
        "metaDescription": "Compare loader pallet forks and material buckets for moving bulk dirt, landscaping pavers, lumber, and palletized construction materials efficiently.",
        "excerpt": "Examine the operational tradeoffs between heavy-duty pallet forks and bulk material buckets to select the most profitable attachment for your fleet.",
        "imageAlt": "Wheel loader switching between pallet fork attachment and general purpose bucket",
        "bodyImages": {
            "b2-02.webp": {
                "alt": "Wheel loader lifting bundle of dimensional framing lumber using heavy-duty pallet forks",
                "caption": "Pallet forks keep construction materials level during transit across uneven jobsite terrain."
            },
            "b2-03.webp": {
                "alt": "Heavy wheel loader bucket excavating and loading bulk topsoil into dump truck",
                "caption": "High-capacity buckets maximize cubic yardage moved per hour in loose bulk material handling."
            }
        }
    },
    1784947777428: {
        "seoTitle": "Can a Compact Excavator Work All Day Shift? | Happy Machinery",
        "metaDescription": "Discover how to run compact mini excavators on continuous full-day shifts without hydraulic overheating, engine strain, or premature track wear.",
        "excerpt": "Learn how proper hydraulic oil cooling, continuous fuel management, and shift rotation allow compact excavators to operate productively from sunrise to sunset.",
        "imageAlt": "Compact tracked mini excavator digging trenches continuously on commercial worksite",
        "bodyImages": {
            "b7-02.webp": {
                "alt": "Mini excavator digging utility trench alongside commercial building foundation",
                "caption": "Monitoring hydraulic temperature and maintaining engine RPM prevents overheating on 10-hour digging shifts."
            }
        }
    },
    1788139694298: {
        "seoTitle": "How Drum Weight Affects Compaction Depth | Happy Machinery",
        "metaDescription": "Master road roller compaction physics. Discover how front drum weight, dynamic vibration force, and soil moisture influence maximum compaction depth.",
        "excerpt": "Master the science of road roller drum weight. Learn how linear load distribution, centrifugal force, and drum diameter dictate compaction depth in soil and asphalt.",
        "imageAlt": "Asphalt vibratory roller with heavy steel drum compacting aggregate base on highway project",
        "bodyImages": {
            "RoadRollerDrumWeight-02.webp": {
                "alt": "Tandem vibratory roller drum with heavy centrifugal exciter mechanism",
                "caption": "Centrifugal force generated by rotating eccentric weights amplifies compaction depth in subgrade soil."
            },
            "RoadRollerDrumWeight-03.webp": {
                "alt": "Smooth steel drum road roller completing final finish pass on road surface",
                "caption": "Optimal drum weight closes surface pores and leaves an unblemished, watertight asphalt mat."
            }
        }
    }
}

updated_count = 0
for post in posts:
    pid = post.get('id')
    if pid in SEO_ENRICHMENTS:
        enrichment = SEO_ENRICHMENTS[pid]
        post['seoTitle'] = enrichment['seoTitle']
        post['metaDescription'] = enrichment['metaDescription']
        post['excerpt'] = enrichment['excerpt']
        post['imageAlt'] = enrichment['imageAlt']
        post['alt'] = enrichment['imageAlt']
        
        # Enrich body images inside post['content']
        body_images = enrichment.get('bodyImages', {})
        if body_images and isinstance(post.get('content'), list):
            new_content = []
            for block in post['content']:
                block_str = str(block).strip()
                matched = False
                for img_key, img_info in body_images.items():
                    if img_key in block_str:
                        # Extract full URL
                        src_match = re.search(r'https?://[^\s"\'<>]+' + re.escape(img_key), block_str)
                        src_url = src_match.group(0) if src_match else block_str
                        alt_text = img_info['alt']
                        caption_text = img_info.get('caption', '')
                        
                        # Generate semantic figure tag
                        figure_tag = f'<figure class="article-image-figure my-6 text-center mx-auto" data-alignment="center" data-caption="{caption_text}"><img src="{src_url}" alt="{alt_text}" /><figcaption class="blog-body-image-caption">{caption_text}</figcaption></figure>'
                        new_content.append(figure_tag)
                        matched = True
                        break
                if not matched:
                    new_content.append(block)
            post['content'] = new_content
            
        updated_count += 1

data['blog-posts'] = posts

# Save back to happy-machinery-storage/content.json
with open(storage_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Successfully enriched {updated_count} blog posts in {storage_path}!")
