import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Aaudumbar Agro Supplier ID
const AAUDUMBAR_SUPPLIER_ID = '114f0006-bdd3-430d-95ba-0f9df91aa7eb';

export const GAP_PRODUCTS = [
  {
    title: "1121 Steam Basmati Rice (Export Quality Bulk 50kg Bags)",
    sector_slug: "food-agriculture",
    base_price_per_unit: 85,
    unit_label: "Kg",
    bulk_minimum_order: 1000,
    quality_grade: "Grade A Extra Long Grain",
    hsn_code: "10063020",
    certifications: ["FSSAI Certified", "APEDA Registered", "ISO 22000", "100% Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549002/b2b-bharat/products/basmati_rice_bulk_export_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549002/b2b-bharat/products/basmati_rice_bulk_export_aaudumbar_agro.jpg",
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549009/b2b-bharat/products/wheat_flour_atta_bulk_50kg_aaudumbar_agro.jpg"
    ],
    description: `We are a premier verified manufacturer and bulk exporter of **1121 Steam Basmati Rice**, supplying commercial buyers, food processors, and international importers across India and worldwide.

Our 1121 Steam Basmati Rice is processed at state-of-the-art automated milling plants, ensuring pristine purity, non-sticky elongation, and an authentic aromatic fragrance. Sourced directly from certified agricultural belts with complete batch traceability.

**Key Technical & Commercial Specifications:**
- **Grain Length:** Average 8.35 mm - 8.40 mm (Extremely high cooked elongation up to 18mm)
- **Moisture Content:** Max 12.5%
- **Purity:** 95% Pure Extra Long Grain
- **Broken Grains:** Less than 1%
- **Admixture:** Max 5%
- **Paddy Grains / Foreign Matter:** Nil (Double Sortex Cleaned)
- **Packaging:** 50 Kg Heavy-Duty Jute Burlap Sacks or Moisture-Proof BOPP Bags
- **Country of Origin:** India
- **Supply Ability:** 500 Metric Tons per Month

**Procurement Security:**
Transact with 100% peace of mind on B2B India with Escrow payment protection. Funds are disbursed to the supplier only after third-party quality inspection and bill-of-lading approval.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Rice Variety": "1121 Steam Basmati",
      "Average Grain Length": "8.35 mm - 8.40 mm",
      "Moisture Content": "Max 12.5%",
      "Purity": "95% Pure Extra Long Grain",
      "Broken Ratio": "Max 1%",
      "Crop Year": "2025-2026 Current Season",
      "Packaging Type": "50kg Jute Burlap / BOPP Bags",
      "Country of Origin": "India",
      "Dispatch Time": "2-4 Business Days",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "basmati rice bulk suppliers in india, 1121 steam basmati rice wholesale price, export quality basmati rice manufacturers, basmati rice 50kg bag wholesale, rice exporters in india",
      "supplier_net_price": 85,
      "platform_commission_percent": 3.5,
      "platform_fee_per_unit": 2.98
    }
  },
  {
    title: "Organic Guntur Teja Red Chilli Powder (Export Grade Bulk)",
    sector_slug: "food-agriculture",
    base_price_per_unit: 240,
    unit_label: "Kg",
    bulk_minimum_order: 500,
    quality_grade: "Export Quality Premium",
    hsn_code: "09042211",
    certifications: ["Spices Board India Certified", "FSSAI License", "ISO 9001:2015", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549005/b2b-bharat/products/red_chilli_powder_bulk_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549005/b2b-bharat/products/red_chilli_powder_bulk_aaudumbar_agro.jpg"
    ],
    description: `Leading wholesale manufacturer and bulk supplier of **Organic Guntur Teja Red Chilli Powder**, catering to spice distributors, spice brand packagers, culinary sauce manufacturers, and global export houses.

Manufactured from carefully graded, stemless Guntur Teja dried chillies with zero artificial coloring, zero adulteration, and strict microbial and aflatoxin limits adhering to US-FDA and European standards.

**Key Technical & Commercial Specifications:**
- **Spice Variety:** Guntur Teja (Stemless)
- **Pungency Level:** 65,000 - 75,000 SHU (High Heat)
- **Color Value:** 70 - 85 ASTA
- **Moisture Content:** Max 10.0%
- **Fineness:** 60 to 80 Mesh Fine Ground
- **Aflatoxin Content:** Under 10 PPB (EU Compliant)
- **Packaging:** 25 Kg / 50 Kg Multi-wall Kraft Paper Bags with Inner Food-Grade Poly Liner
- **Shelf Life:** 12 Months in Cool & Dry Storage

**Procurement Security:**
Available with guaranteed Escrow protection on B2B India. Full laboratory Certificate of Analysis (COA) provided with every commercial dispatch.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Spice Type": "Guntur Teja (Stemless Ground)",
      "Pungency (Heat)": "65,000 - 75,000 SHU",
      "Color Value (ASTA)": "70 - 85 ASTA",
      "Moisture": "Max 10%",
      "Form": "Fine Powder (Mesh 60-80)",
      "Aflatoxin Level": "Below 10 PPB (EU/US Compliant)",
      "Packaging": "25kg / 50kg Multi-wall Paper & Poly Bags",
      "Country of Origin": "India",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "red chilli powder bulk suppliers andhra, guntur teja chilli powder wholesale, organic spices wholesale exporters india, bulk red chilli powder 50kg, spices manufacturers in india",
      "supplier_net_price": 240,
      "platform_commission_percent": 3.5,
      "platform_fee_per_unit": 8.40
    }
  },
  {
    title: "Chakki Fresh Whole Wheat Flour (Atta 50kg Bulk Bags)",
    sector_slug: "food-agriculture",
    base_price_per_unit: 1600,
    unit_label: "Bag",
    bulk_minimum_order: 100,
    quality_grade: "100% Sharbati Whole Wheat",
    hsn_code: "11010000",
    certifications: ["FSSAI Certified", "Agmark Grade A", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549009/b2b-bharat/products/wheat_flour_atta_bulk_50kg_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549009/b2b-bharat/products/wheat_flour_atta_bulk_50kg_aaudumbar_agro.jpg"
    ],
    description: `High-grade commercial **Chakki Fresh Whole Wheat Flour (Atta)** in 50kg wholesale sacks, engineered for industrial bakeries, institutional catering, restaurant chains, and bulk distributors.

Milled from clean, heavy-grain MP Sharbati wheat using traditional cold-stone chakki technology to preserve dietary fiber, bran, and essential wheat germ nutrition. 100% unbleached with zero maida or chemical preservatives.

**Key Technical & Commercial Specifications:**
- **Grain Base:** 100% Premium MP Sharbati Wheat
- **Gluten Level:** Min 11.5% - 12.0%
- **Moisture:** Max 12.0%
- **Total Ash:** Max 1.4%
- **Water Absorption Capacity:** 65% - 68%
- **Packaging:** 50 Kg Heavy-Duty Laminated Polypropylene Bags
- **Shelf Life:** 4 Months in ventilated warehouse storage
- **Daily Milling Capacity:** 40 Metric Tons

**Procurement Security:**
Order directly from verified mill facilities with milestone-based Escrow payment protection on B2B India.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Wheat Variety": "100% MP Sharbati Grade A",
      "Gluten Content": "Min 11.5%",
      "Moisture": "Max 12.0%",
      "Ash Content": "Max 1.4%",
      "Water Absorption": "65% - 68%",
      "Packaging": "50kg HD Polypropylene Woven Bags",
      "Shelf Life": "4 Months (Cool & Dry Place)",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "wheat flour bulk manufacturers 50kg bag, chakki fresh atta wholesale price, commercial wheat flour suppliers india, bulk wheat flour for bakeries, sharbati atta bulk suppliers",
      "supplier_net_price": 1600,
      "platform_commission_percent": 3.5,
      "platform_fee_per_unit": 56.00
    }
  },
  {
    title: "Pure Kachi Ghani Cold Pressed Mustard Oil (15L Wholesale Tins)",
    sector_slug: "food-agriculture",
    base_price_per_unit: 2025,
    unit_label: "Tin",
    bulk_minimum_order: 50,
    quality_grade: "Agmark Grade 1 Cold Pressed",
    hsn_code: "15149110",
    certifications: ["Agmark Grade 1", "FSSAI License", "ISO 22000", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549012/b2b-bharat/products/kachi_ghani_mustard_oil_15l_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549012/b2b-bharat/products/kachi_ghani_mustard_oil_15l_aaudumbar_agro.jpg"
    ],
    description: `Commercial wholesale supply of **Pure Kachi Ghani Cold Pressed Mustard Oil** in 15-liter food-grade square tins and 200-liter bulk barrels.

Extracted using traditional low-temperature cold expeller presses to preserve natural allyl isothiocyanate pungency, intense mustard aroma, and natural omega-3 fatty acids. Zero chemical solvents, zero palm oil blending, and 100% natural filtration.

**Key Technical & Commercial Specifications:**
- **Extraction:** First Cold Pressing (Kachi Ghani)
- **Pungency Level:** High Natural Pungency (>0.35% Allyl Isothiocyanate)
- **Free Fatty Acids (FFA):** Max 1.25% as Oleic
- **Moisture & Impurities:** Max 0.25%
- **Refractive Index at 40°C:** 1.4646 - 1.4662
- **Packaging:** 15 Liter Heavy Gauge Tin Containers & 200 Liter Drums
- **Origin:** Rajasthan / Maharashtra Mustard Belt

**Procurement Security:**
Guaranteed quality assurance with batch-wise Agmark certification and protected Escrow payments on B2B India.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Processing Method": "Traditional Cold Pressed (Kachi Ghani)",
      "Pungency Level": "High Natural Pungency (Allyl Isothiocyanate >0.35%)",
      "Free Fatty Acids (FFA)": "Max 1.25%",
      "Moisture & Insoluble": "Max 0.25%",
      "Packaging Size": "15 Liter Square Tin & 200 Liter Barrels",
      "Shelf Life": "12 Months",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "cold pressed mustard oil wholesale price, kachi ghani mustard oil bulk suppliers, mustard oil 15 liter tin price, edible oil manufacturers in india, pure sarson tel wholesale",
      "supplier_net_price": 2025,
      "platform_commission_percent": 3.5,
      "platform_fee_per_unit": 70.88
    }
  },
  {
    title: "Primary Mill TMT Steel Bars Fe-550D (BIS 1786 Certified)",
    sector_slug: "building-construction",
    base_price_per_unit: 54500,
    unit_label: "Metric Ton",
    bulk_minimum_order: 10,
    quality_grade: "Fe-550D High Ductility",
    hsn_code: "72142090",
    certifications: ["BIS IS 1786:2008", "ISO 9001:2015", "Mill Test Certificate (MTC)", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549016/b2b-bharat/products/tmt_steel_bars_fe550d_wholesale_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549016/b2b-bharat/products/tmt_steel_bars_fe550d_wholesale_aaudumbar_agro.jpg"
    ],
    description: `Direct primary rolling mill supply of **Fe-550D TMT Steel Rebar Bars** manufactured with advanced German Quenching & Self-Tempering (Thermex) technology for high-rise infrastructure, bridges, commercial complexes, and industrial warehouses.

Superior earthquake resistance (High 'D' grade ductility), high yield strength, outstanding bendability, and superior corrosion resistance with high weldability.

**Key Technical & Commercial Specifications:**
- **Grade:** Fe 550D (BIS 1786:2008 Approved)
- **Available Sizes:** 8mm, 10mm, 12mm, 16mm, 20mm, 25mm, 32mm
- **Yield Stress (0.2% Proof):** Min 550 N/mm²
- **Tensile Strength (UTS):** Min 600 N/mm² (UTS/YS Ratio >= 1.10)
- **Total Elongation at Fracture:** Min 14.5%
- **Carbon Equivalent:** Max 0.42% (Excellent Weldability)
- **Bundle Packaging:** 12-meter straight lengths strapped with automated steel tags & QR verification
- **Documentation:** Original Mill Test Certificate (MTC) with every truckload

**Procurement Security:**
Safe industrial procurement with milestone Escrow release on B2B India. Weighbridge slips and laboratory test verification supported.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Steel Grade": "Fe 550D (High Ductility & Superior Elongation)",
      "Available Diameters": "8mm, 10mm, 12mm, 16mm, 20mm, 25mm, 32mm",
      "Yield Strength": "Min 550 N/mm²",
      "Tensile Strength": "Min 600 N/mm²",
      "Total Elongation": "Min 14.5%",
      "Standard Length": "12 Meters per rebar",
      "Tolerance": "As per BIS IS 1786 norms",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "tmt steel bars wholesale price per ton, fe 550d tmt bar manufacturers india, wholesale construction steel suppliers, structural steel rebars bulk moq, tmt bars price list india",
      "supplier_net_price": 54500,
      "platform_commission_percent": 3.0,
      "platform_fee_per_unit": 1635.00
    }
  },
  {
    title: "Nano-Polished Vitrified Floor Tiles 600x600mm (Morbi Factory Direct)",
    sector_slug: "building-construction",
    base_price_per_unit: 38,
    unit_label: "Sq Ft",
    bulk_minimum_order: 1200,
    quality_grade: "Grade A Export Porcelain",
    hsn_code: "69072100",
    certifications: ["ISO 13006 / EN 14411", "CE Certified", "Green Building Council", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549021/b2b-bharat/products/vitrified_floor_tiles_600x600_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549021/b2b-bharat/products/vitrified_floor_tiles_600x600_aaudumbar_agro.jpg"
    ],
    description: `Direct factory wholesale supply of **Nano-Polished Glazed Vitrified Tiles (GVT/PGVT)** in standard 600x600mm and 800x1600mm formats, direct from Morbi, Gujarat ceramic manufacturing clusters.

Featuring ultra-glossy nano-coating technology for stain resistance, zero porosity, high breaking strength, and high-definition digital Italian marble patterns.

**Key Technical & Commercial Specifications:**
- **Nominal Size:** 600 mm x 600 mm (Thickness: 9.0 mm)
- **Water Absorption:** < 0.05% (Vitrified Porcelain Body)
- **Surface Finish:** High Gloss Mirror Polish (Nano Treated)
- **Modulus of Rupture (MOR):** Min 38 N/mm²
- **Scratch Hardness:** Mohs Scale >= 6
- **Stain Resistance:** Class 5 (Zero Chemical Absorption)
- **Packaging:** 4 Pieces per Box (14.4 Sq Ft / Box), 36 Boxes per Wooden Pallet
- **Export Standards:** Palletized with shrink wrapping and corner edge protectors

**Procurement Security:**
Eliminate breakage disputes and advance payment risks with B2B India's Escrow protection. Inspect quality upon warehouse arrival.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Dimensions": "600 mm x 600 mm (Thickness: 9 mm)",
      "Surface Finish": "High Gloss Nano Polished / Italian Marble Finish",
      "Water Absorption": "< 0.05% (Impervious)",
      "Breaking Strength": "Min 1300 N",
      "Stain & Scratch Resistance": "Class 5 Resistance / Mohs Scale 6",
      "Coverage per Box": "14.4 Sq Ft (4 Pcs / Box)",
      "Packaging": "Corrugated Box with Euro Wooden Pallet Wrapping",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "vitrified tiles manufacturers in morbi gujarat, 600x600 vitrified floor tiles wholesale price, polished porcelain tiles bulk suppliers, morbi tile exporters india, glazed vitrified tiles moq",
      "supplier_net_price": 38,
      "platform_commission_percent": 3.0,
      "platform_fee_per_unit": 1.14
    }
  },
  {
    title: "Automatic Multi-Head Pouch Packaging Machine (Pneumatic VFFS)",
    sector_slug: "industrial-machinery",
    base_price_per_unit: 385000,
    unit_label: "Set",
    bulk_minimum_order: 1,
    quality_grade: "Industrial Heavy Duty",
    hsn_code: "84223000",
    certifications: ["CE Certified", "ISO 9001:2015", "GMP Standards Compliant", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549023/b2b-bharat/products/automatic_pouch_packaging_machine_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549023/b2b-bharat/products/automatic_pouch_packaging_machine_aaudumbar_agro.jpg"
    ],
    description: `Industrial high-speed **Automatic Multi-Head Vertical Form Fill Seal (VFFS) Pouch Packaging Machine**, engineered for packaging spices, pulses, grains, potato chips, snack pellets, tea, and chemical powders.

Equipped with a 10-head/14-head multi-head combination weigher for micro-gram accuracy, color touchscreen PLC control, servo film draw-down mechanism, and pneumatic sealing jaws.

**Key Technical & Commercial Specifications:**
- **Filling Capacity:** 10 grams to 1,000 grams
- **Packaging Speed:** 35 to 75 pouches per minute
- **Pouch Types:** Pillow Pouch, Gusseted Bag, 3-Side / 4-Side Seal, Euro Slot
- **Film Material:** Heat-sealable laminated roll film (BOPP/PE, PET/PE, Aluminium Foil)
- **Control Interface:** Siemens / Delta 7-inch Color Touch HMI with memory presets
- **Material Contact:** Food Grade Stainless Steel 304 (SS 316 optional)
- **Compressed Air Requirement:** 6 Bar, 0.3 m³/min
- **Support & Commissioning:** Free nationwide onsite installation, operator training, and 1-year spare parts warranty

**Procurement Security:**
Safeguarded with 3-stage milestone Escrow release on B2B India: Advance hold -> Dispatch verification -> Onsite operational signoff.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Machine Type": "Pneumatic Vertical Form Fill Seal (VFFS)",
      "Packaging Speed": "30 - 75 Pouches / Minute (Product Dependent)",
      "Filling Range": "10 grams to 1000 grams",
      "Sealing Type": "Center Seal / 3-Side Seal / Gusset Pouch",
      "Control System": "Delta / Siemens PLC with 7-Inch Color Touch HMI",
      "Power Consumption": "3.5 kW, 415V 3-Phase 50Hz",
      "Contact Parts Material": "Food Grade Stainless Steel (SS 304)",
      "Warranty & Service": "1 Year Comprehensive Warranty + Onsite Commissioning",
      "Payment Terms": "3-Stage Milestone Escrow Release via B2B India",
      "Target SEO Keywords": "automatic pouch packaging machine price india, form fill seal machine manufacturers, multihead weigher packaging machine wholesale, vertical packaging machine bulk suppliers, snacks packaging machinery",
      "supplier_net_price": 385000,
      "platform_commission_percent": 3.0,
      "platform_fee_per_unit": 11550.00
    }
  },
  {
    title: "550W Mono PERC Bifacial Solar PV Modules (ALMM & BIS Approved)",
    sector_slug: "solar-renewable",
    base_price_per_unit: 10175,
    unit_label: "Piece",
    bulk_minimum_order: 62,
    quality_grade: "Tier-1 ALMM Grade A",
    hsn_code: "85414300",
    certifications: ["MNRE ALMM Listed", "BIS IS 14286", "IEC 61215 / 61730", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549025/b2b-bharat/products/mono_perc_bifacial_solar_modules_550w_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549025/b2b-bharat/products/mono_perc_bifacial_solar_modules_550w_aaudumbar_agro.jpg"
    ],
    description: `Direct manufacturing wholesale of **550W Tier-1 Mono PERC Bifacial Solar PV Modules**, designed for commercial rooftop installations, utility-scale solar parks, and industrial solar captive plants.

Features 144 half-cut multi-busbar (MBB) solar cells with bifacial dual-glass architecture, capturing reflected ground albedo radiation for up to 25% additional power yield.

**Key Technical & Commercial Specifications:**
- **Nominal Max Power (Pmax):** 550 Watt Peak
- **Module Efficiency:** 21.5% - 21.8%
- **Cell Arrangement:** 144 (6x24) Half-Cut Mono PERC
- **Bifacial Factor:** 70% ± 5%
- **Open Circuit Voltage (Voc):** 49.80 V
- **Short Circuit Current (Isc):** 14.05 A
- **Dimensions:** 2278 x 1134 x 35 mm (Weight: 28.5 kg)
- **Glass & Encapsulation:** 2.0mm Dual Heat Strengthened Anti-reflective Glass
- **Warranty:** 12-Year Product Workmanship & 25-Year 84.8% Linear Performance Guarantee
- **Compliance:** Full MNRE Approved List of Models and Manufacturers (ALMM) & BIS certification

**Procurement Security:**
Full Escrow protection on B2B India. Third-party flash test reports and EL imaging test certificates provided with each pallet shipment.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Module Rating": "550 Watt Peak (Wp)",
      "Cell Technology": "Half-Cut Multi-Busbar Mono PERC (144 Cells)",
      "Module Efficiency": "21.5% - 21.8%",
      "Bifaciality Factor": "70% ± 5% (Additional Rear Power Gain Up To 25%)",
      "Frame & Glass": "Anodized Aluminium Alloy & 3.2mm Dual Anti-Reflective Glass",
      "Junction Box": "IP68 Weatherproof with MC4 Compatible Connectors",
      "Linear Output Warranty": "25-Year 84.8% Power Output Guarantee",
      "Packaging": "31 Modules / Pallet, Shipped in Heavy Wooden Crates",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "solar panel bulk wholesale suppliers india, 550w mono perc bifacial solar modules, tier 1 solar panel manufacturers india, wholesale solar panels almm approved, solar pv module price per watt",
      "supplier_net_price": 10175,
      "platform_commission_percent": 3.0,
      "platform_fee_per_unit": 305.25
    }
  },
  {
    title: "Paracetamol IP/BP/USP Grade API Powder (WHO-GMP Certified)",
    sector_slug: "pharma-drugs",
    base_price_per_unit: 420,
    unit_label: "Kg",
    bulk_minimum_order: 250,
    quality_grade: "Pharma Grade IP/BP/USP",
    hsn_code: "29222990",
    certifications: ["WHO-GMP Approved", "Certificate of Analysis (COA) Included", "Drug Master File (DMF)", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549027/b2b-bharat/products/paracetamol_api_bulk_powder_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549027/b2b-bharat/products/paracetamol_api_bulk_powder_aaudumbar_agro.jpg"
    ],
    description: `Verified pharmaceutical bulk supply of **Paracetamol IP/BP/USP (Acetaminophen) Active Pharmaceutical Ingredient (API)** powder for formulation manufacturers, tablet compressing plants, and liquid suspension blenders.

Manufactured in dedicated WHO-GMP certified synthesis facilities adhering to international pharmacopeial monographs. High chemical stability, uniform particle size distribution, and superior compressibility.

**Key Technical & Commercial Specifications:**
- **Chemical Name:** N-(4-Hydroxyphenyl)acetamide
- **CAS Registry Number:** 103-90-2
- **Pharmacopeia Standards:** Complies with IP, BP, EP, and USP specifications
- **Assay (HPLC):** 99.0% - 101.0% (Dry Basis)
- **Melting Point:** 168.0°C to 172.0°C
- **Heavy Metals:** Less than 10 PPM
- **Free 4-Aminophenol:** Max 50 PPM
- **Loss on Drying:** Max 0.50%
- **Packaging:** 25 Kg Airtight Fiber Drums with Dual Food-Pharma Grade Poly Liners
- **Documentation:** Batch Certificate of Analysis (COA), MSDS, and Open DMF available for drug approvals

**Procurement Security:**
Safe raw material transactions with Escrow protection on B2B India. Full batch test release protocols supported.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Chemical Name": "N-(4-Hydroxyphenyl)acetamide / Acetaminophen",
      "CAS Number": "103-90-2",
      "Assay (Purity)": "99.0% - 101.0% (HPLC)",
      "Melting Point": "168°C - 172°C",
      "Loss on Drying": "Max 0.5%",
      "Heavy Metals": "< 10 PPM",
      "Packaging": "25 Kg Sealed Fiber Drums with Double Polyethylene Liners",
      "Storage": "Store below 25°C in light-resistant airtight container",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "paracetamol api bulk powder manufacturers india, paracetamol ip bp usp raw material wholesale, active pharmaceutical ingredients bulk suppliers, who gmp pharma chemicals india, paracetamol bulk price per kg",
      "supplier_net_price": 420,
      "platform_commission_percent": 3.0,
      "platform_fee_per_unit": 12.60
    }
  },
  {
    title: "Combed 100% Cotton Yarn 30s/40s (Tirupur Hosiery Grade Bulk)",
    sector_slug: "textiles-fabrics",
    base_price_per_unit: 285,
    unit_label: "Kg",
    bulk_minimum_order: 1000,
    quality_grade: "Export Hosiery Combed",
    hsn_code: "52052200",
    certifications: ["Oeko-Tex Standard 100", "GOTS Organic Certified", "ISO 9001:2015", "Escrow Protected"],
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549029/b2b-bharat/products/combed_cotton_yarn_30s_40s_aaudumbar_agro.jpg",
    gallery_image_urls: [
      "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789549029/b2b-bharat/products/combed_cotton_yarn_30s_40s_aaudumbar_agro.jpg"
    ],
    description: `Leading direct spinning mill supply of **Combed 100% Cotton Yarn (30s and 40s Ne)**, engineered for circular knitting, single jersey fabrics, hosiery apparel, and luxury cotton textiles.

Spun from hand-picked, long-staple Gujarat Shankar-6 raw cotton on modern Rieter blowroom and ring spinning machinery with Schlafhorst autoconers and electronic yarn clearers.

**Key Technical & Commercial Specifications:**
- **Yarn Count Range:** Ne 30/1 & Ne 40/1 Combed Ring Spun
- **Raw Cotton Grade:** 100% Virgin Shankar-6 (Staple Length 29-30mm)
- **CSP (Count Strength Product):** Min 2850 - 3050 (High Tensile Strength)
- **Total Imperfections (IPI -50%, +50%, +280%):** Under 50 per km (5% Uster Standard)
- **Yarn Hairiness (H Index):** 4.2 - 4.5
- **Twist Multiplier (TM):** 3.6 - 3.8 (Optimized for Soft Knit Handle)
- **Cone Weight:** 1.89 Kg / 2.08 Kg Paper Cones
- **Packaging:** 24 Cones / Corrugated Export Carton (45.36 Kg Net Weight Cartons), Container Load 20 Tons / 40HC

**Procurement Security:**
Eliminate yarn defect risks with B2B India's Escrow protection. Funds released only following delivery and lab testing.`,
    technical_specifications: {
      "Supplier Name": "Aaudumbar Agro Pvt Ltd",
      "Supplier Address": "Plot No.5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009",
      "GSTIN": "27AAECR1234F1Z5",
      "Yarn Count": "30s / 40s Combed Ne",
      "Composition": "100% Virgin Shankar-6 Cotton",
      "Spinning Technique": "Ring Spun Autoconed with Electronic Clearers",
      "CSP (Count Strength Product)": "Min 2850 - 3000",
      "Imperfection (IPI)": "< 50 (Uster Standards)",
      "Cone Weight": "1.89 Kg Paper Cones",
      "Packaging": "24 Cones / Carton (45.36 Kg Net Weight Cartons)",
      "Payment Terms": "100% Escrow Milestone Release via B2B India",
      "Target SEO Keywords": "cotton yarn bulk suppliers in tirupur, combed cotton yarn 30s 40s wholesale price, hosiery yarn manufacturers in india, ring spun cotton yarn wholesale, spinning mill bulk suppliers",
      "supplier_net_price": 285,
      "platform_commission_percent": 3.0,
      "platform_fee_per_unit": 8.55
    }
  }
];

async function seedGapProducts() {
  console.log("Starting Gap Products Seeding for Aaudumbar Agro...");
  
  // 1. Fetch industry sectors
  const { data: sectors, error: sectorError } = await supabase
    .from('industry_sectors')
    .select('id, slug, name');
    
  if (sectorError || !sectors) {
    console.error("Failed to fetch industry sectors:", sectorError);
    process.exit(1);
  }
  
  const sectorMap = {};
  sectors.forEach(s => {
    sectorMap[s.slug] = s.id;
  });
  
  console.log(`Loaded ${sectors.length} sectors from database.`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const p of GAP_PRODUCTS) {
    const sectorId = sectorMap[p.sector_slug];
    if (!sectorId) {
      console.warn(`Sector not found for slug: ${p.sector_slug}`);
      continue;
    }

    // Check if product with this title already exists for Aaudumbar Agro
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('title', p.title)
      .eq('supplier_id', AAUDUMBAR_SUPPLIER_ID)
      .single();

    const productPayload = {
      supplier_id: AAUDUMBAR_SUPPLIER_ID,
      sector_id: sectorId,
      title: p.title,
      description: p.description,
      base_price_per_unit: p.base_price_per_unit,
      unit_label: p.unit_label,
      bulk_minimum_order: p.bulk_minimum_order,
      quality_grade: p.quality_grade,
      hsn_code: p.hsn_code,
      certifications: p.certifications,
      hero_image_url: p.hero_image_url,
      gallery_image_urls: p.gallery_image_urls,
      technical_specifications: p.technical_specifications,
      inventory_count: 5000,
      is_active: true,
      is_stale: false,
      last_price_update: new Date().toISOString()
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', existing.id);
        
      if (updateError) {
        console.error(`Error updating product ${p.title}:`, updateError);
      } else {
        console.log(`Updated existing product: ${p.title}`);
        updatedCount++;
      }
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert(productPayload);
        
      if (insertError) {
        console.error(`Error inserting product ${p.title}:`, insertError);
      } else {
        console.log(`Inserted new product: ${p.title}`);
        insertedCount++;
      }
    }
  }

  console.log(`\n✅ Seeding complete! Inserted: ${insertedCount}, Updated: ${updatedCount}`);
}

seedGapProducts().catch(err => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
