/* Project dataset for the Leave Behind site, transcribed from the Oct 2026 Company Profiles PDF.
 *
 * Images: drop files into assets/img/<slug>/ — `cover.jpg` is the card/hero image, and
 * `01.jpg`, `02.jpg`, … (up to 12) form the gallery shown in the project modal.
 * Projects with no images yet render a tidy placeholder tile.
 *
 * category: hospitality | multifamily | residential | masterplan | modular
 * region:   northcounty | colorado | tahoe | other
 */
window.LB_PROJECTS = [
  {
    slug: "four-seasons-aspen", name: "Four Seasons Aspen", short: "705 Hopkins",
    location: "Aspen, CO", type: "Hospitality, Lodging, Condominiums, Employee Housing",
    role: "Designer, Project Manager, Project Architect, Entitlements",
    category: "hospitality", region: "colorado", featured: true,
    blurb: "705 Hopkins is a Four Seasons Hotel and Resort with lodging, for-sale units and employee housing, designed with 359 Design and Design Workshop land planning. Sited on 3.2 acres at the base of Shadow Mountain, the program is divided into three volumes totaling 232,000 SF to give the development a residential scale, merging the mountain landscape with the built hotel from the edge of curb up the slope.",
    stats: ["140 lodging units", "31 fractional lodging units", "4 free market", "232,000 SF"]
  },
  {
    slug: "palisades", name: "The Palisades", short: "Squaw Valley",
    location: "Squaw Valley (Palisades Tahoe), CA", type: "Multi Family, Modular",
    role: "Developer, General Contractor, Interior Design, Modular Manufacture",
    category: "modular", region: "tahoe", featured: true,
    blurb: "A 62-lot branded short-term rental community in 3 sizes and unit types, 8 of them custom home sites. Units are modular, making construction more efficient and reducing site cost via an expedited build, delivered in 4 strategic phases. The team managed everything from entitlements through design, construction, marketing and sale, achieving record-setting price per square foot and sales velocity.",
    stats: ["30 duplex units", "12 standard units", "13 reversed floor plan", "8 large home sites", "63 units total"]
  },
  {
    slug: "palisades-summit", name: "Summit Residences", short: "The Palisades",
    location: "Squaw Valley, CA", type: "Multi Family",
    role: "Design, Architect, Interior Design, Manufacturer",
    category: "modular", region: "tahoe",
    blurb: "Single-family homes for 3 of the larger lots in The Palisades. They follow the mountain-modern design thread of the development and respond to the site, using a combination of site modular and panelized construction.",
    stats: ["Site modular + panelized"]
  },
  {
    slug: "chamonix", name: "Chamonix", short: "Attainable housing",
    location: "Vail, CO", type: "Multi Family", role: "Master Plan, Design",
    category: "modular", region: "colorado", featured: true,
    blurb: "A development sponsored by the Town of Vail to provide attainable housing sold well below market. With 359 Design, 32 town homes were developed using system-built methods: modular boxes fabricated in Idaho, shipped to site, set on unique foundations and stitched and skinned into the finished product.",
    stats: ["32 townhomes", "Fabricated in Idaho"]
  },
  {
    slug: "miradoro", name: "Miradoro", short: "Mountain multi-family",
    location: "Vail, CO", type: "Multi Family", role: "Master Plan, Design, Architect, Interior Design",
    category: "multifamily", region: "colorado",
    blurb: "A 10-unit (3,000 SF each) multi-family design that pushes what is available in the Colorado mountains, rethinking what a mountain home should look and feel like. Landscape and unit amenities developed with Design Workshop.",
    stats: ["10 units", "3,000 SF each"]
  },
  {
    slug: "basecamp", name: "Basecamp", short: "Beaver Creek",
    location: "Avon, CO", type: "Multi Family", role: "Designer",
    category: "multifamily", region: "colorado",
    blurb: "Designed with 359 Design. Hidden by aspens along two waterways yet steps from downtown Avon and the entrance to Beaver Creek, with private riverfront access and proximity to the Eagle Valley Trail System.",
    stats: ["15 town homes", "~2,500 SF each"]
  },
  {
    slug: "la-costa-hotel", name: "La Costa Hotel", short: "Boutique hospitality",
    location: "Encinitas, CA", type: "Hospitality, Lodging, Commercial", role: "Designer, Architect, Developer",
    category: "hospitality", region: "northcounty", featured: true,
    blurb: "Overlooking Batiquitos Lagoon, a protected 610-acre coastal wetland, this boutique hotel sits at the northern end of Leucadia. Sixteen rooms designed for short and long stays, with a pool and a public restaurant developed with a local chef. Landscape by Falling Waters Landscape.",
    stats: ["16 rooms", "Pool + restaurant"]
  },
  {
    slug: "hotel-101", name: "Hotel 101", short: "Pacific Coast Highway",
    location: "Encinitas, CA", type: "Hospitality, Lodging", role: "Designer, Architect, Interior Design",
    category: "hospitality", region: "northcounty", featured: true,
    blurb: "Re-development of an existing 45-room (30,000 SF) hotel on historic Pacific Coast Highway. A center pool terrace eliminates pass-through traffic, converting the roadside motel into a full-service modern hotel with a communal kitchen, roof deck and sunken conversation pit. Operations-driven design, from charrette to Coastal Development Permit.",
    stats: ["45 rooms", "30,000 SF", "Charrette to CDP"]
  },
  {
    slug: "shft-hotel", name: "SHFT Hotel", short: "Austin lifestyle hotel",
    location: "Austin, TX", type: "Hospitality, Lodging", role: "Designer, Architect",
    category: "hospitality", region: "other",
    blurb: "SHFT is a lifestyle platform founded by film producer Peter Glatzer and actor-filmmaker Adrian Grenier, conveying a more sustainable approach to living through film, design, art and food.",
    stats: ["80 lodging units", "Restaurant", "Roof-top bar, pool + lounge"]
  },
  {
    slug: "freewyld", name: "Freewyld", short: "Idyllwild cabins",
    location: "Idyllwild, CA", type: "Short Term Rental / Hotel", role: "Design, Architect, Interior Design",
    category: "hospitality", region: "other",
    blurb: "Freewyld is a vacation rental brand specializing in immersive experiences for modern travelers. The project adds 6–10 new cabins representative of Idyllwild's attributes, with an immersive connection to the outdoors.",
    stats: ["6–10 cabins"]
  },
  {
    slug: "urban-surf-resort", name: "Urban Surf Resort", short: "Oceanside wave pool",
    location: "Oceanside, CA", type: "Hospitality, Lodging, Commercial, Residential", role: "Master Plan Concept",
    category: "masterplan", region: "northcounty",
    blurb: "A 92-acre landmark surf destination built around a large-scale wave pool for world-class competition and everyday leisure, with a full-service hotel, F&B, retail, an outdoor amphitheater and a trail track.",
    stats: ["92 acres", "170-room hotel"]
  },
  {
    slug: "carson-master-plan", name: "Carson Master Plan", short: "157-acre proposal",
    location: "Carson, CA", type: "Hospitality, Lodging, Commercial", role: "Master Plan Development",
    category: "masterplan", region: "other",
    blurb: "A 157-acre development proposal for the City of Carson integrating every component and use into one cohesive experience, considering each use's requirements and its relationship to the site and surroundings.",
    stats: ["157 acres"]
  },
  {
    slug: "grays-crossing", name: "Grays Crossing", short: "Cabin clusters",
    location: "Truckee, CA", type: "Hospitality, Lodging", role: "Master Planning",
    category: "masterplan", region: "tahoe",
    blurb: "\"Cabin clusters\" are the concept behind this serene retreat: a mix of hospitality and single-family homes laced through the woodlands, with shared private amenities, a sense of seclusion and adaptability to site conditions.",
    stats: ["16 duplex units", "15 single-family units"]
  },
  {
    slug: "mountainside", name: "Mountainside", short: "Phase 2 site plan",
    location: "Truckee, CA", type: "SFR Development", role: "Master Planning",
    category: "masterplan", region: "tahoe",
    blurb: "A low-impact multi-family layout with great outdoor views and reasonable density, combining detached single-family and town-home products with lock-off configurations and integrated surrounding amenities.",
    stats: ["8 duplex units", "14 single-family units"]
  },
  {
    slug: "mammoth-mf", name: "Mammoth MF", short: "Feasibility + master plan",
    location: "Mammoth, CA", type: "Multi Family", role: "Feasibility, Master Plan, Design",
    category: "masterplan", region: "tahoe",
    blurb: "An update and redesign of a previously entitled project to current city standards and market needs, starting with a feasibility study that integrates architecture, master planning, marketing and financial modeling.",
    stats: ["24 single-family homes", "15 town homes", "6,000 SF commercial"]
  },
  {
    slug: "santa-fe", name: "Santa Fe", short: "Modular subdivision",
    location: "Encinitas, CA", type: "Single Family Subdivision", role: "Designer, Architect, Manufacturer, GC",
    category: "modular", region: "northcounty",
    blurb: "A density-bonus single-family subdivision in the City of Encinitas. The modular approach targets efficiency, cost and time reduction, and sustainability.",
    stats: ["40 single-family lots", "13 townhome units"]
  },
  {
    slug: "andrew-241", name: "Andrew 241", short: "12-lot subdivision",
    location: "Encinitas, CA", type: "Single Family Subdivision", role: "Designer, Architect, Manufacturer, GC",
    category: "modular", region: "northcounty",
    blurb: "A density-bonus single-family subdivision in Encinitas consisting of 6 different unit types varying in size, height and square footage.",
    stats: ["12 single-family lots", "6 unit types"]
  },
  {
    slug: "moab-adu", name: "Moab ADU", short: "Modular ADU",
    location: "Moab, UT", type: "ADU", role: "Design, Architect, Manufacturer",
    category: "modular", region: "other",
    blurb: "A modular ADU of bedroom, kitchen/dining and shared-deck modules beneath a shade trellis structure.",
    stats: ["Bedroom mods", "Shared deck"]
  },
  {
    slug: "260-broadway", name: "260 Broadway", short: "Chula Vista densification",
    location: "Chula Vista, CA", type: "62 Unit Multi Family", role: "Designer, Architect",
    category: "multifamily", region: "other",
    blurb: "A lot consolidation in downtown Chula Vista. 62 units (21,524 SF) across 5 buildings respond to the low scale of the neighborhood with open space between buildings, recreational landscaping, ground-level parking and a public plaza at the street frontage.",
    stats: ["62 units", "99 parking spaces", "16,773 SF open space"]
  },
  {
    slug: "church-ave", name: "Church Ave", short: "Chula Vista",
    location: "Chula Vista, CA", type: "Multi Family", role: "Designer, Architect, General Contractor",
    category: "multifamily", region: "other",
    blurb: "A few blocks from 260 Broadway, this project uses the city's parking incentives to densify: 50% of spaces at ground level and the remaining 50% in public lots within walking distance.",
    stats: ["26 one-bedroom", "3 three-bedroom", "24 on-site / 23 off-site parking"]
  },
  {
    slug: "sanford-mf", name: "Sanford MF", short: "Eight-unit multi-family",
    location: "Encinitas, CA", type: "Multi Family", role: "Design, Architect, Interior Design, General Contractor",
    category: "multifamily", region: "northcounty",
    blurb: "Multi-family project in Encinitas, designed and built in-house by the studio and Brown Bag Builders.", stats: []
  },
  {
    slug: "clearview", name: "Clearview", short: "Modernist estate",
    location: "Carlsbad, CA", type: "Single Family Residence", role: "Design, Architect, Interior Design",
    category: "residential", region: "northcounty", featured: true,
    link: "../clearview-deck/index.html", linkLabel: "View the Clearview concept deck",
    blurb: "A sophisticated modernist estate with ocean views and guest quarters: curated aesthetic perfection and an entertainer's dream home.", stats: []
  },
  {
    slug: "neptune-1316", name: "Neptune 1316", short: "Bluff remodel",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Design, Architect",
    category: "residential", region: "northcounty",
    blurb: "An extensive remodel overlooking the ocean bluff with a cantilevered office addition, an added elevator and a re-imagined interior experience, staying true to the original envelope while redesigning the layout, exterior materials and site.", stats: []
  },
  {
    slug: "hygeia-lot-3", name: "Hygeia Lot 3", short: "SoCal living",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Design, Architect, Interior Design",
    category: "residential", region: "northcounty",
    blurb: "A design-forward home that exemplifies SoCal living, the largest property in a 3-lot subdivision, tucked away in its own private environment with multiple outdoor dining spaces, a pool and an indoor/outdoor fireplace.", stats: []
  },
  {
    slug: "rue-adriane", name: "Rue Adriane", short: "La Jolla remodel",
    location: "La Jolla, CA", type: "Single Family Residence", role: "Architect, Interior Design, General Contractor",
    category: "residential", region: "northcounty",
    blurb: "A 3,600 SF full interior and exterior remodel in the hills of La Jolla with ocean views, crafted and curated down to the finest detail.", stats: ["3,600 SF"]
  },
  {
    slug: "burgundy-2", name: "Burgundy 2", short: "Hillside terraces",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Design, Architect",
    category: "residential", region: "northcounty",
    blurb: "A home on a discrete hillside that rises with the slope, creating terrace and deck levels that peek west for a glimpse of the ocean. Simple forms and modern materials envelop interior and exterior spaces.", stats: []
  },
  {
    slug: "4th-st", name: "4th St", short: "Encinitas",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Architect, Interior Design, General Contractor",
    category: "residential", region: "northcounty", blurb: "Designed and built in-house as part of the Swell Property portfolio of luxury short-term rentals in Encinitas.", stats: []
  },
  {
    slug: "moonlight-bluff-1", name: "Moonlight Bluff 1", short: "Oceanfront lot 1",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Architect, Interior Design",
    category: "residential", region: "northcounty",
    blurb: "Lot 1 of a 2-lot oceanfront bluff subdivision: a 5,000 SF home with a detached guest house that function as one integrated project or two independent homes, opening west to lawn and ocean views and east to the neighborhood.",
    stats: ["5,000 SF"]
  },
  {
    slug: "moonlight-bluff-2", name: "Moonlight Bluff 2", short: "Oceanfront lot 2",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Architect, Interior Design",
    category: "residential", region: "northcounty",
    blurb: "The second of the 2-lot bluff subdivision: a main house with west-facing outdoor areas and a detached east-facing guest house forming the front of the property in line with the neighborhood.", stats: []
  },
  {
    slug: "sanford-sfr", name: "Sanford SFR", short: "Encinitas",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Design, Architect, Interior Design",
    category: "residential", region: "northcounty", blurb: "Single-family residence in Encinitas.", stats: []
  },
  {
    slug: "tamarack", name: "Tamarack", short: "Tahoe remodel",
    location: "Tahoe, CA", type: "Single Family Remodel", role: "Architect, Interior Design",
    category: "residential", region: "tahoe", blurb: "A single-family remodel in Tahoe, shown before and after.", stats: []
  },
  {
    slug: "st-croix", name: "St. Croix Residence", short: "Virgin Islands",
    location: "Virgin Islands", type: "Residential", role: "Design, Architecture",
    category: "residential", region: "other", blurb: "A residential design in the U.S. Virgin Islands.", stats: []
  },
  {
    slug: "wood-dr", name: "Wood Dr.", short: "Encinitas",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Architect, Interior Design, General Contractor",
    category: "residential", region: "northcounty", blurb: "Single-family residence designed and built in-house.", stats: []
  },
  {
    slug: "summit-cardiff", name: "Summit", short: "Cardiff",
    location: "Cardiff, CA", type: "Single Family Residence", role: "Design, Architect",
    category: "residential", region: "northcounty", blurb: "Single-family residence in Cardiff, with a second home on Lot 2.", stats: []
  },
  {
    slug: "sheridan-2054", name: "Sheridan 2054", short: "Lagoon remodel",
    location: "Encinitas, CA", type: "Single Family Residence", role: "Design, Architect, Interior Design",
    category: "residential", region: "northcounty",
    blurb: "A remodel and addition to a uniquely designed home on a sloping lot overlooking Batiquitos Lagoon, staying true to the original layered roofs that follow the natural slope and opening living spaces to the lagoon views.", stats: []
  },
  {
    slug: "passiflora", name: "Passiflora", short: "Hilltop views",
    location: "Encinitas, CA", type: "SFR", role: "Design, Architect, Interior Design",
    category: "residential", region: "northcounty",
    blurb: "Atop one of Encinitas' highest points with views in every direction: a main house, 4-car garage, projecting decks with outdoor dining and living, a projecting lap pool and a detached accessory unit.", stats: []
  },
  {
    slug: "rancho-diegueno", name: "Rancho Diegueño", short: "San Diego estate",
    location: "San Diego, CA", type: "Single Family Residence", role: "Design, Architect, Interior Design",
    category: "residential", region: "other",
    blurb: "A new 2-story residence (13,170 SF) with attached ADU (1,400 SF) and garage (900 SF), plus a 1-story accessory unit (3,500 SF) and detached garage (3,500 SF). Site scope includes sewer, utilities, foundation, soil stabilization and a road between upper and lower lots.",
    stats: ["13,170 SF main", "3,500 SF accessory"]
  }
];

/* North County built work & in progress — numbered as on the PDF map. */
window.LB_NORTH_COUNTY = [
  ["La Costa", "Boutique Hospitality"], ["Hillcrest", "R. Remodel"],
  ["Wood Lot Subdivision (TPM)", "Clevenger, Wood Lot 2 — Custom Res."], ["Range", "Custom Res."],
  ["Riley", "R. Remodel"], ["Ten84", "Custom Residential"], ["Kertzman", "Addition"],
  ["La Veta", "Multi Family Remodel"], ["Hotel 101", "Hospitality Remodel"],
  ["5th Subdivision (TPM)", "Lots 1 & 2 — Custom Residential"], ["4th St Condo", "Multi-Family"],
  ["Melba", "Custom Residential"], ["Summit", "Custom Residential"], ["Sheridan", "R. Remodel"],
  ["Hygeia Subdivision (TPM)", "Lots 1 & 3 — Custom Residential"], ["W Jason St (TPM)", ""],
  ["Santa Fe Multi Fam", ""], ["Via del Alba", ""], ["Avocado Pl", ""], ["Via Recanto", ""],
  ["Rancho Diegueño", ""], ["North Ln", ""], ["Oolong Gallery", ""], ["Haynd", ""], ["Clearview", ""]
];
