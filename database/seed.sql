-- ============================================================================
-- B2B BHARAT — SEED DATA
-- ============================================================================
-- Seeds the 10 industrial archetypes with representative supplier profiles
-- and product listings. This data is for DEMONSTRATION purposes only.
-- Real company names are used as market-leader archetypes.
-- ============================================================================

-- ============================================================================
-- SEED: 38 CORE INDUSTRY SECTORS (Top-Level Categories)
-- ============================================================================

INSERT INTO industry_sectors (id, parent_id, name, slug, description, display_order, hero_image_url) VALUES
  (uuid_generate_v4(), NULL, 'Agricultural Products, Equipment & Machines', 'agriculture', 'Farm equipment, irrigation systems, seeds, fertilizers, and harvesting machinery', 1, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600'),
  (uuid_generate_v4(), NULL, 'Apparel & Fashion Accessories', 'apparel-fashion', 'Textiles, fabrics, ready-made garments, yarn, and fashion accessories', 2, 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600'),
  (uuid_generate_v4(), NULL, 'Automobile Parts, Accessories & EV Kits', 'automobile-ev', 'Automotive components, spare parts, EV motor kits, and accessories', 3, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600'),
  (uuid_generate_v4(), NULL, 'Ayurvedic, Herbal Products & Natural Extracts', 'ayurvedic-herbal', 'Herbal formulations, natural extracts, Ayurvedic preparations, and organic ingredients', 4, 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=1600'),
  (uuid_generate_v4(), NULL, 'Chemical, Dyes, Pigments & Plastic Raw Material', 'chemicals-polymers', 'Industrial chemicals, pigments, polymers, resins, and plastic raw materials', 5, 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600'),
  (uuid_generate_v4(), NULL, 'Computer Hardware, Peripherals & IT Solutions', 'it-hardware', 'Networking equipment, servers, peripherals, and IT infrastructure components', 6, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600'),
  (uuid_generate_v4(), NULL, 'Electronics & Electrical Equipment', 'electronics-electrical', 'Cables, switchgears, control panels, transformers, and electrical components', 7, 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600'),
  (uuid_generate_v4(), NULL, 'Food & Beverage Products', 'food-beverage', 'Dry fruits, spices, grains, packaged foods, and beverage ingredients', 8, 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1600'),
  (uuid_generate_v4(), NULL, 'Hospital, Medical Imaging & Surgical Supplies', 'medical-surgical', 'Medical devices, imaging systems, surgical instruments, and hospital supplies', 9, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600'),
  (uuid_generate_v4(), NULL, 'Industrial Machinery, Plant Equipment & CNC Systems', 'industrial-cnc', 'CNC machines, industrial mixers, plant equipment, and manufacturing systems', 10, 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1600'),
  -- Remaining 28 sectors
  (uuid_generate_v4(), NULL, 'Building & Construction Materials', 'construction', 'Cement, steel, tiles, sanitary ware, and construction hardware', 11, NULL),
  (uuid_generate_v4(), NULL, 'Packaging Materials & Machinery', 'packaging', 'Packaging films, corrugated boxes, labeling machines, and sealing equipment', 12, NULL),
  (uuid_generate_v4(), NULL, 'Printing & Stationery Products', 'printing-stationery', 'Printers, paper products, office supplies, and printing consumables', 13, NULL),
  (uuid_generate_v4(), NULL, 'Safety & Security Equipment', 'safety-security', 'CCTV systems, fire safety equipment, personal protective gear, and access control', 14, NULL),
  (uuid_generate_v4(), NULL, 'Solar Energy & Renewable Systems', 'solar-renewable', 'Solar panels, inverters, wind turbines, and energy storage systems', 15, NULL),
  (uuid_generate_v4(), NULL, 'Textile Machinery & Accessories', 'textile-machinery', 'Looms, spinning machines, dyeing equipment, and textile processing units', 16, NULL),
  (uuid_generate_v4(), NULL, 'Toys, Games & Sports Equipment', 'toys-sports', 'Sporting goods, playground equipment, educational toys, and fitness gear', 17, NULL),
  (uuid_generate_v4(), NULL, 'Water Treatment & Purification Systems', 'water-treatment', 'RO plants, filtration systems, water softeners, and effluent treatment', 18, NULL),
  (uuid_generate_v4(), NULL, 'Furniture & Interior Supplies', 'furniture-interiors', 'Office furniture, modular kitchens, interior fittings, and decorative materials', 19, NULL),
  (uuid_generate_v4(), NULL, 'Gems, Jewellery & Precious Metals', 'gems-jewellery', 'Diamonds, gold, silver, precious stones, and jewellery manufacturing', 20, NULL),
  (uuid_generate_v4(), NULL, 'Gift Articles & Handicrafts', 'gifts-handicrafts', 'Handmade crafts, corporate gifts, decorative items, and festival supplies', 21, NULL),
  (uuid_generate_v4(), NULL, 'Glass & Ceramics', 'glass-ceramics', 'Industrial glass, ceramic tiles, laboratory glassware, and glass fibre', 22, NULL),
  (uuid_generate_v4(), NULL, 'HVAC & Refrigeration Equipment', 'hvac-refrigeration', 'Air conditioning units, refrigeration systems, ventilation, and chillers', 23, NULL),
  (uuid_generate_v4(), NULL, 'Iron, Steel & Metal Products', 'metals-steel', 'Steel bars, pipes, sheets, castings, and metal fabrication products', 24, NULL),
  (uuid_generate_v4(), NULL, 'Laboratory & Scientific Instruments', 'lab-instruments', 'Microscopes, spectrometers, lab chemicals, and research equipment', 25, NULL),
  (uuid_generate_v4(), NULL, 'Leather Products & Accessories', 'leather', 'Leather hides, footwear, bags, belts, and leather processing chemicals', 26, NULL),
  (uuid_generate_v4(), NULL, 'Logistics & Material Handling', 'logistics-handling', 'Forklifts, conveyor systems, pallet trucks, and warehouse equipment', 27, NULL),
  (uuid_generate_v4(), NULL, 'Marine & Ship Equipment', 'marine-ship', 'Marine engines, navigation systems, ship parts, and offshore equipment', 28, NULL),
  (uuid_generate_v4(), NULL, 'Mining & Mineral Processing', 'mining-minerals', 'Mining machinery, crushers, mineral ores, and processing equipment', 29, NULL),
  (uuid_generate_v4(), NULL, 'Oil, Gas & Petroleum Products', 'oil-gas', 'Petroleum products, lubricants, drilling equipment, and pipeline fittings', 30, NULL),
  (uuid_generate_v4(), NULL, 'Paper & Paper Products', 'paper-products', 'Writing paper, packaging paper, tissue products, and paper manufacturing', 31, NULL),
  (uuid_generate_v4(), NULL, 'Pharmaceutical & Drug Intermediates', 'pharma', 'API manufacturers, drug intermediates, excipients, and pharma packaging', 32, NULL),
  (uuid_generate_v4(), NULL, 'Plastic Products & Moulding', 'plastic-moulding', 'Injection moulding, extrusion products, plastic containers, and polymer parts', 33, NULL),
  (uuid_generate_v4(), NULL, 'Power Generation & Transmission', 'power-generation', 'Generators, transformers, turbines, and power distribution equipment', 34, NULL),
  (uuid_generate_v4(), NULL, 'Rubber & Rubber Products', 'rubber', 'Natural rubber, synthetic rubber, rubber moulded parts, and rubber sheets', 35, NULL),
  (uuid_generate_v4(), NULL, 'Telecom & Communication Equipment', 'telecom', 'Telecom towers, fibre optic cables, switches, and communication devices', 36, NULL),
  (uuid_generate_v4(), NULL, 'Timber, Plywood & Wood Products', 'timber-wood', 'Timber logs, plywood sheets, MDF boards, and wood-based furniture', 37, NULL),
  (uuid_generate_v4(), NULL, 'Waste Management & Recycling', 'waste-recycling', 'Waste processing plants, recycling equipment, and environmental solutions', 38, NULL);

-- ============================================================================
-- SEED: 10 ANCHOR SUPPLIER PROFILES (Demo Data)
-- ============================================================================
-- Note: These are representative archetypes using real market-leader names
-- for demonstration purposes. Firebase UIDs are placeholders.
-- ============================================================================

INSERT INTO users (id, firebase_uid, company_name, registered_email, corporate_phone, role, status, gst_number, warehouse_address, city, state, pincode, geo_lat, geo_lng, year_established, annual_turnover_lakhs) VALUES
  -- 1. Jain Irrigation Systems Ltd — Agriculture
  ('a1000001-0001-4000-8000-000000000001', 'firebase_demo_jain', 'Jain Irrigation Systems Ltd', 'b2b@jains.com', '+91-2572-258011', 'supplier', 'active', '27AAACJ1234A1Z5', 'Jain Hills, NH-6, Jalgaon', 'Jalgaon', 'Maharashtra', '425001', 21.0077, 75.5626, 1963, 750000),

  -- 2. Arvind Mills Ltd — Apparel & Fashion
  ('a1000001-0002-4000-8000-000000000002', 'firebase_demo_arvind', 'Arvind Mills Ltd', 'industrial@arvind.com', '+91-79-68268000', 'supplier', 'active', '24AABCA5678B2Z3', 'Naroda Industrial Estate, Ahmedabad', 'Ahmedabad', 'Gujarat', '382330', 23.0919, 72.6397, 1931, 1200000),

  -- 3. Sundram Fasteners Ltd — Automobile & EV
  ('a1000001-0003-4000-8000-000000000003', 'firebase_demo_sundram', 'Sundram Fasteners Ltd', 'oem@sundram.com', '+91-44-28530796', 'supplier', 'active', '33AABCS9012C3Z1', 'Padi, Chennai', 'Chennai', 'Tamil Nadu', '600050', 13.0499, 80.2140, 1966, 540000),

  -- 4. Dabur India Industrial Division — Ayurvedic/Herbal
  ('a1000001-0004-4000-8000-000000000004', 'firebase_demo_dabur', 'Dabur India Industrial Division', 'bulk@dabur.com', '+91-120-3982000', 'supplier', 'active', '09AABCD3456D4Z9', 'Kaushambi, Sahibabad Industrial Area, Ghaziabad', 'Ghaziabad', 'Uttar Pradesh', '201010', 28.6458, 77.3186, 1884, 980000),

  -- 5. Reliance Polymers Division — Chemicals & Polymers
  ('a1000001-0005-4000-8000-000000000005', 'firebase_demo_reliance', 'Reliance Polymers Division', 'polymers@ril.com', '+91-261-6693000', 'supplier', 'active', '24AABCR7890E5Z7', 'Hazira Manufacturing Division, Surat', 'Hazira', 'Gujarat', '394270', 21.0935, 72.6519, 1966, 5000000),

  -- 6. HCL Infosystems — IT Hardware
  ('a1000001-0006-4000-8000-000000000006', 'firebase_demo_hcl', 'HCL Infosystems Ltd', 'enterprise@hclinfosystems.com', '+91-120-2520844', 'supplier', 'active', '09AAACH1234F6Z5', 'E-4/5, Sector 63, Noida', 'Noida', 'Uttar Pradesh', '201301', 28.6271, 77.3769, 1976, 320000),

  -- 7. Polycab India Ltd — Electronics & Electrical
  ('a1000001-0007-4000-8000-000000000007', 'firebase_demo_polycab', 'Polycab India Ltd', 'oem@polycab.com', '+91-260-2240221', 'supplier', 'active', '25AABCP5678G7Z3', 'Daman Industrial Estate', 'Daman', 'Dadra & Nagar Haveli and Daman & Diu', '396210', 20.4170, 72.8320, 1996, 1400000),

  -- 8. Milan Dry Fruits & Spices — Food & Beverage
  ('a1000001-0008-4000-8000-000000000008', 'firebase_demo_milan', 'Milan Dry Fruits & Spices Exporters', 'bulk@milanspices.com', '+91-11-23921056', 'supplier', 'active', '07AABCM9012H8Z1', 'Shop 42-44, Khari Baoli, Chandni Chowk', 'Delhi', 'Delhi', '110006', 28.6559, 77.2167, 1985, 45000),

  -- 9. Trivitron Healthcare — Medical & Surgical
  ('a1000001-0009-4000-8000-000000000009', 'firebase_demo_trivitron', 'Trivitron Healthcare Pvt Ltd', 'sales@trivitron.com', '+91-44-42080900', 'supplier', 'active', '33AABCT3456I9Z9', 'Anna Salai, Triplicane, Chennai', 'Chennai', 'Tamil Nadu', '600002', 13.0580, 80.2678, 1997, 180000),

  -- 10. Ace Micromatic Group — Industrial Machinery & CNC
  ('a1000001-0010-4000-8000-000000000010', 'firebase_demo_ace', 'Ace Micromatic Group', 'cnc@acemicromatic.com', '+91-80-41492285', 'supplier', 'active', '29AABCA7890J0Z7', 'Peenya Industrial Area, Bengaluru', 'Bengaluru', 'Karnataka', '560058', 13.0302, 77.5190, 1979, 220000);

-- ============================================================================
-- SEED: PRODUCT LISTINGS (3 products per anchor supplier = 30 products)
-- These reference the sectors inserted above by slug-based lookup.
-- ============================================================================

-- Helper: We need sector IDs by slug. Using subqueries for portability.

-- === AGRICULTURE (Jain Irrigation) ===
INSERT INTO products (supplier_id, sector_id, title, description, base_price_per_unit, unit_label, bulk_minimum_order, technical_specifications, quality_grade, hsn_code, certifications, hero_image_url, inventory_count) VALUES
  ('a1000001-0001-4000-8000-000000000001', (SELECT id FROM industry_sectors WHERE slug = 'agriculture'),
   'Drip Irrigation System Kit (1 Hectare)', 'Complete drip irrigation system for 1 hectare coverage with inline drippers, main lines, sub-mains, laterals, and filtration unit.',
   45000.00, 'kit', 10,
   '{"coverage_area": "1 hectare", "dripper_spacing_cm": 30, "flow_rate_lph": 4, "pipe_material": "LLDPE", "filtration": "Sand + Disc", "pressure_rating_bar": 2.5}',
   'Premium', '84248990', ARRAY['ISO 9001:2015', 'BIS IS 12786'], 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=800', 500),

  ('a1000001-0001-4000-8000-000000000001', (SELECT id FROM industry_sectors WHERE slug = 'agriculture'),
   'Agricultural Submersible Pumping Kit (5HP)', 'Heavy-duty 5HP submersible pump with motor, control panel, and 30m delivery pipe for deep bore wells.',
   38500.00, 'unit', 25,
   '{"motor_hp": 5, "voltage": "415V 3-Phase", "max_head_m": 90, "discharge_lpm": 180, "material": "SS 304 Impeller", "bore_size_inch": 4}',
   'Industrial', '84131100', ARRAY['BIS IS 8034', 'ISO 9001:2015'], 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800', 300),

  ('a1000001-0001-4000-8000-000000000001', (SELECT id FROM industry_sectors WHERE slug = 'agriculture'),
   'High-Yield Hybrid Tomato Seeds (Arka Rakshak)', 'F1 hybrid tomato seeds resistant to bacterial wilt, TLCV & early blight. 20g packet, approx 3000 seeds.',
   1200.00, 'packet', 500,
   '{"variety": "Arka Rakshak F1", "seed_count_approx": 3000, "maturity_days": 65, "fruit_weight_g": "90-100", "resistance": ["Bacterial Wilt", "TLCV", "Early Blight"], "shelf_life_months": 9}',
   'Premium', '12099190', ARRAY['ISTA Certified', 'Truthful Label'], 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=800', 10000),

-- === APPAREL & FASHION (Arvind Mills) ===
  ('a1000001-0002-4000-8000-000000000002', (SELECT id FROM industry_sectors WHERE slug = 'apparel-fashion'),
   'Premium Selvedge Denim Fabric (12oz Indigo)', 'Japanese-loom inspired selvedge denim fabric bolt, 12oz weight, rope-dyed indigo, raw finish.',
   850.00, 'meter', 500,
   '{"weight_oz": 12, "width_inch": 32, "weave": "3x1 RHT", "composition": "100% Ring Spun Cotton", "dye_method": "Rope Dyed Indigo", "shrinkage_percent": 5}',
   'Premium', '52094200', ARRAY['OEKO-TEX Standard 100', 'GOTS'], 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800', 25000),

  ('a1000001-0002-4000-8000-000000000002', (SELECT id FROM industry_sectors WHERE slug = 'apparel-fashion'),
   'Combed Cotton Yarn (40s Count, Ring Spun)', 'Fine combed cotton yarn, 40s count, suitable for premium knitting and weaving applications.',
   285.00, 'kg', 2000,
   '{"count": "40s", "type": "Combed Ring Spun", "composition": "100% Cotton", "strength_gf_tex": 18.5, "twist_tpi": 28, "evenness_cv_percent": 12.5}',
   'A', '52052400', ARRAY['ISO 9001:2015'], 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800', 50000),

  ('a1000001-0002-4000-8000-000000000002', (SELECT id FROM industry_sectors WHERE slug = 'apparel-fashion'),
   'Handloom Khadi Fabric (Muslin Grade)', 'Authentic handloom khadi muslin fabric, hand-spun and hand-woven, natural off-white.',
   420.00, 'meter', 1000,
   '{"weave": "Plain", "thread_count": 80, "composition": "100% Hand-spun Cotton", "width_inch": 44, "weight_gsm": 90, "origin": "Wardha, Maharashtra"}',
   'Premium', '52091100', ARRAY['Khadi Mark', 'Handloom Mark'], 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800', 15000),

-- === AUTOMOBILE & EV (Sundram Fasteners) ===
  ('a1000001-0003-4000-8000-000000000003', (SELECT id FROM industry_sectors WHERE slug = 'automobile-ev'),
   'High-Tensile Hex Bolt Set (Grade 10.9, M10)', 'Precision cold-forged hex bolts, Grade 10.9 high-tensile steel, zinc-nickel plated, automotive grade.',
   145.00, 'kg', 5000,
   '{"grade": "10.9", "size": "M10x40mm", "material": "Alloy Steel", "coating": "Zinc-Nickel", "tensile_strength_mpa": 1040, "proof_load_mpa": 830, "thread": "Metric Fine"}',
   'Automotive OEM', '73181500', ARRAY['IATF 16949:2016', 'ISO 9001:2015'], 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', 100000),

  ('a1000001-0003-4000-8000-000000000003', (SELECT id FROM industry_sectors WHERE slug = 'automobile-ev'),
   'BLDC Motor Controller Kit (48V/72V, 3KW)', 'Programmable BLDC motor controller for 2W/3W EVs, FOC sine wave control, regenerative braking support.',
   8500.00, 'unit', 50,
   '{"voltage_range": "48V-72V", "power_kw": 3, "max_current_a": 80, "control_type": "FOC Sine Wave", "regen_braking": true, "protection": ["Over-current", "Over-temperature", "Under-voltage"], "protocol": "CAN Bus"}',
   'Premium', '85044090', ARRAY['AIS 038', 'ISO 9001:2015'], 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', 2000),

  ('a1000001-0003-4000-8000-000000000003', (SELECT id FROM industry_sectors WHERE slug = 'automobile-ev'),
   'Disc Brake Assembly (Ventilated, 280mm)', 'Ventilated disc brake assembly with caliper, pads, and mounting hardware for passenger vehicles.',
   3200.00, 'set', 200,
   '{"disc_diameter_mm": 280, "disc_type": "Ventilated", "material": "Grey Cast Iron FC200", "pad_material": "Semi-Metallic", "includes": ["Disc", "Caliper", "Pads", "Hardware"], "fitment": "Universal PCD 4x100"}',
   'OEM Replacement', '87083010', ARRAY['IATF 16949:2016', 'ECE R90'], 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', 5000),

-- === AYURVEDIC & HERBAL (Dabur Industrial) ===
  ('a1000001-0004-4000-8000-000000000004', (SELECT id FROM industry_sectors WHERE slug = 'ayurvedic-herbal'),
   'Standardized Ashwagandha Root Extract (5% Withanolides)', 'KSM-66 equivalent Ashwagandha root extract powder, standardized to 5% withanolides by HPLC.',
   4200.00, 'kg', 100,
   '{"plant_part": "Root", "active_compound": "Withanolides", "standardization": "5% by HPLC", "mesh_size": 80, "solubility": "Water-dispersible", "heavy_metals": "Below WHO limits", "microbial_limits": "USP compliant"}',
   'Pharma Grade', '13021990', ARRAY['FSSAI', 'GMP', 'ISO 22000', 'Organic India'], 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=800', 5000),

  ('a1000001-0004-4000-8000-000000000004', (SELECT id FROM industry_sectors WHERE slug = 'ayurvedic-herbal'),
   'Organic Multiflora Honey (Bulk Industrial)', 'Raw, unprocessed multiflora honey sourced from Sundarbans apiaries, NMR tested for purity.',
   320.00, 'kg', 1000,
   '{"type": "Multiflora Raw", "source": "Sundarbans Apiaries", "moisture_percent": 18, "hmf_mg_per_kg": "<15", "diastase_number": ">8", "purity_test": "NMR Profiling", "packaging": "Food Grade HDPE Drums"}',
   'A', '04090000', ARRAY['FSSAI', 'Organic India', 'AGMARK'], 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800', 20000),

  ('a1000001-0004-4000-8000-000000000004', (SELECT id FROM industry_sectors WHERE slug = 'ayurvedic-herbal'),
   'Herbal Cosmetic Base Material (Aloe Vera Gel 10X)', 'Concentrated 10X Aloe Vera gel base for cosmetic formulations, decolorized and stabilized.',
   280.00, 'kg', 500,
   '{"concentration": "10X", "type": "Decolorized Stabilized", "ph_range": "4.0-5.5", "total_solids_percent": ">1.5", "acemannan_content": "High", "preservative_system": "Phenoxyethanol + Potassium Sorbate"}',
   'Cosmetic Grade', '13021990', ARRAY['FSSAI', 'GMP', 'ISO 22716'], 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800', 10000),

-- === CHEMICALS & POLYMERS (Reliance) ===
  ('a1000001-0005-4000-8000-000000000005', (SELECT id FROM industry_sectors WHERE slug = 'chemicals-polymers'),
   'HDPE Granules (Blow Moulding Grade, MFI 0.35)', 'High-density polyethylene granules for blow moulding, suitable for drums, containers, and jerry cans.',
   115.00, 'kg', 25000,
   '{"grade": "RELENE B46003", "mfi_g_per_10min": 0.35, "density_g_per_cc": 0.946, "tensile_strength_mpa": 25, "vicat_softening_c": 126, "application": "Blow Moulding"}',
   'Industrial', '39012000', ARRAY['ISO 9001:2015', 'BIS'], 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800', 500000),

  ('a1000001-0005-4000-8000-000000000005', (SELECT id FROM industry_sectors WHERE slug = 'chemicals-polymers'),
   'Phthalic Anhydride (99.5% Purity, Flake)', 'High-purity phthalic anhydride flakes for plasticizer, alkyd resin, and UPR manufacturing.',
   98.00, 'kg', 10000,
   '{"purity_percent": 99.5, "form": "Flakes", "melting_point_c": 131, "color_hazen": "<15", "free_acid_percent": "<0.1", "ash_content_percent": "<0.005"}',
   'Technical', '29173500', ARRAY['ISO 9001:2015'], 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800', 200000),

  ('a1000001-0005-4000-8000-000000000005', (SELECT id FROM industry_sectors WHERE slug = 'chemicals-polymers'),
   'Organic Pigment Yellow 14 (Diarylide)', 'High-strength organic yellow pigment for printing inks, paints, and plastics coloration.',
   520.00, 'kg', 500,
   '{"ci_name": "Pigment Yellow 14", "ci_number": 21095, "chemical_class": "Diarylide", "tint_strength_percent": 100, "oil_absorption_ml_per_100g": 55, "heat_stability_c": 200, "light_fastness": "5-6"}',
   'A', '32041700', ARRAY['ISO 9001:2015', 'REACH'], 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800', 20000),

-- === IT HARDWARE (HCL Infosystems) ===
  ('a1000001-0006-4000-8000-000000000006', (SELECT id FROM industry_sectors WHERE slug = 'it-hardware'),
   'Managed L3 Network Switch Rack (48-Port PoE+)', '48-port Gigabit managed L3 switch with PoE+ support, 4x10G SFP+ uplinks, rack mountable.',
   68000.00, 'unit', 10,
   '{"ports": "48x GbE PoE+", "uplinks": "4x 10G SFP+", "poe_budget_w": 740, "switching_capacity_gbps": 176, "management": "CLI/Web/SNMP", "form_factor": "1U Rack Mount", "poe_standard": "802.3af/at"}',
   'Enterprise', '85176290', ARRAY['BIS', 'ISO 9001:2015'], 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800', 200),

  ('a1000001-0006-4000-8000-000000000006', (SELECT id FROM industry_sectors WHERE slug = 'it-hardware'),
   'Industrial Ruggedized Router (4G/5G Ready)', 'Fanless industrial router with dual SIM 4G/5G, IP67 rated, for factory floor and outdoor deployment.',
   42000.00, 'unit', 20,
   '{"connectivity": "Dual SIM 4G LTE / 5G Ready", "wan_ports": 2, "lan_ports": 4, "wifi": "802.11ac Wave 2", "ip_rating": "IP67", "operating_temp_c": "-40 to +70", "vpn": "IPSec/OpenVPN"}',
   'Industrial', '85176290', ARRAY['BIS', 'CE', 'FCC'], 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800', 150),

  ('a1000001-0006-4000-8000-000000000006', (SELECT id FROM industry_sectors WHERE slug = 'it-hardware'),
   'OEM Keyboard + Mouse Combo (USB, Spill-Resistant)', 'Enterprise-grade USB keyboard and optical mouse combo, spill-resistant design, plug-and-play.',
   650.00, 'set', 500,
   '{"interface": "USB 2.0", "keyboard_type": "Membrane", "key_count": 104, "key_life_million": 10, "mouse_dpi": 1200, "mouse_buttons": 3, "spill_resistant": true, "cable_length_m": 1.5}',
   'OEM', '84716060', ARRAY['BIS'], 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 10000),

-- === ELECTRONICS & ELECTRICAL (Polycab) ===
  ('a1000001-0007-4000-8000-000000000007', (SELECT id FROM industry_sectors WHERE slug = 'electronics-electrical'),
   'Armoured Copper Power Cable (3.5C x 240 sq mm)', 'XLPE insulated, steel wire armoured copper power cable for HT/LT distribution, IS 7098 compliant.',
   4800.00, 'meter', 100,
   '{"cores": "3.5 Core", "conductor_size_sqmm": 240, "conductor": "Annealed Copper Class 2", "insulation": "XLPE", "armour": "Galvanized Steel Wire", "voltage_grade": "1.1kV", "current_rating_a": 435}',
   'Industrial', '85446090', ARRAY['BIS IS 7098', 'ISO 9001:2015'], 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', 50000),

  ('a1000001-0007-4000-8000-000000000007', (SELECT id FROM industry_sectors WHERE slug = 'electronics-electrical'),
   'Low-Voltage MCCB Panel (800A, 4-Pole)', 'Factory-assembled MCCB panel board, 800A rated, 4-pole, for industrial LV power distribution.',
   125000.00, 'unit', 5,
   '{"rating_a": 800, "poles": 4, "breaking_capacity_ka": 50, "voltage": "415V AC", "enclosure": "IP54 Sheet Steel", "bus_bar": "Electrolytic Copper", "includes": ["MCCB", "Meters", "Indication Lamps"]}',
   'Industrial', '85372000', ARRAY['BIS IS 8623', 'IEC 61439', 'ISO 9001:2015'], 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800', 100),

  ('a1000001-0007-4000-8000-000000000007', (SELECT id FROM industry_sectors WHERE slug = 'electronics-electrical'),
   'Industrial VFD AC Drive (15kW, 3-Phase)', 'Variable frequency drive for AC motor speed control, 15kW, V/F and sensorless vector control.',
   28000.00, 'unit', 20,
   '{"power_kw": 15, "input": "380-480V 3-Phase", "output_frequency_hz": "0.1-400", "control_mode": ["V/F", "Sensorless Vector"], "overload_percent": "150% for 60s", "protection": ["OC", "OV", "UV", "OH", "SC"], "communication": "Modbus RTU"}',
   'Premium', '85044090', ARRAY['BIS', 'CE', 'ISO 9001:2015'], 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', 500),

-- === FOOD & BEVERAGE (Milan Dry Fruits) ===
  ('a1000001-0008-4000-8000-000000000008', (SELECT id FROM industry_sectors WHERE slug = 'food-beverage'),
   'Premium Cashew Kernels W240 (Bulk)', 'White whole cashew kernels, W240 grade (240 kernels per lb), hand-sorted, low moisture.',
   920.00, 'kg', 1000,
   '{"grade": "W240", "kernels_per_lb": 240, "moisture_percent": "<5", "broken_percent": "<2", "color": "White Ivory", "origin": "Goa/Kerala", "packaging": "Vacuum Sealed Tin Containers"}',
   'Premium Export', '08013200', ARRAY['FSSAI', 'APEDA', 'ISO 22000'], 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=800', 20000),

  ('a1000001-0008-4000-8000-000000000008', (SELECT id FROM industry_sectors WHERE slug = 'food-beverage'),
   'Salem Whole Turmeric Fingers (Erode Quality)', 'Premium whole turmeric fingers from Salem/Erode region, high curcumin content, sun-dried.',
   145.00, 'kg', 5000,
   '{"variety": "Salem/Erode Finger", "curcumin_percent": ">3.5", "moisture_percent": "<10", "ash_percent": "<7", "lead_ppm": "<2.5", "size": "3-5 inch fingers", "processing": "Boiled & Sun-dried"}',
   'A', '09103010', ARRAY['FSSAI', 'AGMARK', 'Spice Board'], 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800', 100000),

  ('a1000001-0008-4000-8000-000000000008', (SELECT id FROM industry_sectors WHERE slug = 'food-beverage'),
   'Basmati Rice 1121 (Extra Long Grain, Aged)', 'Premium aged 1121 Basmati rice, extra-long grain (8.3mm+), 2-year aged for maximum elongation.',
   85.00, 'kg', 10000,
   '{"variety": "1121 Sella", "grain_length_mm": 8.3, "elongation_ratio": "2.2x", "aging_years": 2, "moisture_percent": "<12", "broken_percent": "<1", "aroma": "Natural Strong"}',
   'Premium Export', '10063020', ARRAY['FSSAI', 'APEDA', 'BRC'], 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', 200000),

-- === MEDICAL & SURGICAL (Trivitron Healthcare) ===
  ('a1000001-0009-4000-8000-000000000009', (SELECT id FROM industry_sectors WHERE slug = 'medical-surgical'),
   'Digital X-Ray System (Ceiling Suspended, DR)', 'Complete digital radiography system with ceiling-suspended tube, flat panel detector, and workstation.',
   3500000.00, 'unit', 1,
   '{"type": "Direct Digital Radiography", "detector": "CsI Flat Panel 17x17 inch", "resolution_lp_mm": 3.6, "tube_type": "Ceiling Suspended", "generator_kw": 50, "focal_spots_mm": "0.6/1.2", "software": "DICOM 3.0 with PACS"}',
   'Medical Grade', '90221400', ARRAY['CDSCO', 'ISO 13485', 'CE', 'FDA 510(k)'], 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800', 10),

  ('a1000001-0009-4000-8000-000000000009', (SELECT id FROM industry_sectors WHERE slug = 'medical-surgical'),
   'Surgical Instrument Kit (General Surgery, 94-Piece)', 'Complete general surgery instrument set in stainless steel, autoclave-safe, with sterilization tray.',
   85000.00, 'set', 10,
   '{"piece_count": 94, "material": "AISI 420 Stainless Steel", "includes": ["Scalpel Handles", "Scissors", "Forceps", "Retractors", "Needle Holders", "Towel Clips"], "sterilization": "Autoclave Safe (134°C)", "tray": "Perforated SS Tray with Silicone Mat"}',
   'Surgical Grade', '90189099', ARRAY['CDSCO', 'ISO 13485', 'CE'], 'https://images.unsplash.com/photo-1551190822-a9ce113d0459?w=800', 100),

  ('a1000001-0009-4000-8000-000000000009', (SELECT id FROM industry_sectors WHERE slug = 'medical-surgical'),
   'Disposable PPE Kit (SITRA Certified, Full Body)', 'Complete disposable PPE kit with coverall, face shield, gloves, shoe covers, goggles, and N95 mask.',
   380.00, 'kit', 5000,
   '{"components": ["Laminated Coverall", "Face Shield", "Nitrile Gloves (pair)", "Shoe Covers (pair)", "Safety Goggles", "N95 Respirator"], "material": "SMS + PE Lamination", "gsm": 70, "fluid_resistance": "AAMI Level 3", "size_range": "L/XL/XXL"}',
   'Medical', '62101020', ARRAY['SITRA', 'CDSCO', 'ISO 13485'], 'https://images.unsplash.com/photo-1584634731339-252e7e1ffe13?w=800', 50000),

-- === INDUSTRIAL MACHINERY & CNC (Ace Micromatic) ===
  ('a1000001-0010-4000-8000-000000000010', (SELECT id FROM industry_sectors WHERE slug = 'industrial-cnc'),
   '3-Axis CNC Turning Centre (Slant Bed, 250mm Chuck)', 'High-precision slant bed CNC lathe with 250mm hydraulic chuck, 12-station turret, Fanuc 0i-TF+ control.',
   4500000.00, 'unit', 1,
   '{"chuck_diameter_mm": 250, "spindle_speed_rpm": 4000, "spindle_motor_kw": 11, "turret_stations": 12, "turning_diameter_mm": 350, "turning_length_mm": 500, "cnc_control": "Fanuc 0i-TF+", "positioning_accuracy_mm": 0.005}',
   'Precision', '84589100', ARRAY['ISO 9001:2015', 'CE'], 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800', 15),

  ('a1000001-0010-4000-8000-000000000010', (SELECT id FROM industry_sectors WHERE slug = 'industrial-cnc'),
   'Industrial High-Shear Mixer (500L, SS 316)', 'High-shear batch mixer with bottom-entry rotor-stator, 500L SS 316L vessel, for emulsions and dispersions.',
   1800000.00, 'unit', 1,
   '{"capacity_litres": 500, "vessel_material": "SS 316L", "rotor_speed_rpm": "0-3600", "motor_kw": 22, "mixing_type": "Rotor-Stator High Shear", "features": ["Vacuum", "Heating Jacket", "CIP System"], "pharma_compliance": "cGMP"}',
   'Pharma Grade', '84798990', ARRAY['ISO 9001:2015', 'cGMP', 'CE'], 'https://images.unsplash.com/photo-1581092160607-ee67df30e7a1?w=800', 8),

  ('a1000001-0010-4000-8000-000000000010', (SELECT id FROM industry_sectors WHERE slug = 'industrial-cnc'),
   'Chemical Extraction Column (Glass Lined, 1000L)', 'Glass-lined steel extraction column for solvent extraction processes in chemical and pharma plants.',
   2200000.00, 'unit', 1,
   '{"capacity_litres": 1000, "material": "Carbon Steel + Glass Lining (3009)", "operating_pressure_bar": 4, "temperature_range_c": "-20 to 200", "column_type": "Packed/Agitated", "nozzle_count": 8, "gasket": "PTFE"}',
   'Chemical Grade', '84198990', ARRAY['ISO 9001:2015', 'ASME', 'CE'], 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800', 5);
