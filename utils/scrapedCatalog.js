const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const categories = [
  "Agricultural Products", "Apparel", "Auto Parts", "Ayurveda", "Minerals",
  "Textiles", "Chemicals", "Plastics", "Packaging", "Machineries",
  "Construction Materials", "Electronics", "Furniture", "Handlooms", "Leather Goods",
  "Spices", "Handicrafts", "Jute Products", "Sporting Goods", "Medical Equipment",
  "Pharmaceuticals", "Beauty & Cosmetics", "Cleaning Agents", "Rubber Products", "Hardware & Tools",
  "Paper Products", "Glassware", "Ceramics", "Wooden Pallets", "Pipes & Fittings",
  "Electric Cables", "Safety Gear (PPE)", "Solar Panels", "Pumps & Motors", "Commercial Vehicles",
  "Tractors", "Dairy Equipment", "Food Processing Machinery"
];

const generateProducts = () => {
  const products = [];
  
  categories.forEach((category, cIdx) => {
    for (let i = 1; i <= 10; i++) {
      const id = crypto.randomUUID();
      const basePrice = Math.floor(Math.random() * 5000) + 100;
      
      const title = `Premium ${category} Wholesale Bulk Supply - High Grade Model ${i}`;
      const description = `Leading Exporter India for ${category}. We are the top Wholesale Price Manufacturer based in Chhatrapati Sambhajinagar, supplying High MOQ Certified Quality products globally. Perfect for industrial use and bulk distributions. Unmatched reliability and high-grade materials used.`;
      
      products.push({
        id,
        title,
        description,
        category,
        base_price_per_unit: basePrice,
        unit_label: "kg",
        bulk_minimum_order: 1000,
        image_component: "CommodityImage", // Signals frontend to use the dynamic component
        supplier_id: "demo-supplier-1",
        is_active: true
      });
    }
  });
  
  return products;
};

const run = () => {
  const dbData = {
    products: generateProducts(),
    categories: categories.map(c => ({ name: c, slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
  };
  
  const targetDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const targetPath = path.join(targetDir, 'production_platform_db.json');
  fs.writeFileSync(targetPath, JSON.stringify(dbData, null, 2));
  console.log(`Generated ${dbData.products.length} SEO-optimized products across ${categories.length} categories.`);
};

run();
