// ============================================================================
// PRODUCT DETAIL PAGE
// ============================================================================
// Full product detail with technical specifications, supplier info card,
// routing agent, and quotation request form. Server Component.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommodityImage from '@/components/CommodityImage';
import QuotationDock from './QuotationDock';

// ── Serverless Mathematical Routing Agent (Haversine) ──
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Demo products for fallback
const DEMO_PRODUCTS = [
  {
    id: 'demo-1',
    title: 'Drip Irrigation System Kit (1 Hectare)',
    description: 'Complete drip irrigation system for 1 hectare coverage with inline drippers, main lines, sub-mains, laterals, and filtration unit.',
    base_price_per_unit: 45000,
    unit_label: 'kit',
    bulk_minimum_order: 10,
    quality_grade: 'Premium',
    hsn_code: '84248990',
    certifications: ['ISO 9001:2015', 'BIS IS 12786'],
    technical_specifications: {
      coverage_area: '1 hectare',
      dripper_spacing_cm: 30,
      flow_rate_lph: 4,
      pipe_material: 'LLDPE',
      filtration: 'Sand + Disc',
      pressure_rating_bar: 2.5,
    },
    hero_image_url: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', geo_lat: 21.0077, geo_lng: 75.5626 },
    sector_id: { name: 'Agriculture', slug: 'agriculture' }
  },
  {
    id: 'demo-2',
    title: 'Three-Phase Electric Motor 5HP',
    description: 'Industrial grade 5HP three-phase electric motor suitable for heavy machinery.',
    base_price_per_unit: 12500,
    unit_label: 'piece',
    bulk_minimum_order: 5,
    quality_grade: 'Industrial',
    hsn_code: '85015210',
    certifications: ['ISO 9001:2015', 'CE Certified'],
    technical_specifications: { power: '5 HP / 3.7 kW', voltage: '415V', phase: '3 Phase', speed: '1440 RPM' },
    hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Bharat Motors Pvt Ltd', city: 'Pune', state: 'Maharashtra', geo_lat: 18.5204, geo_lng: 73.8567 },
    sector_id: { name: 'Electronics', slug: 'electronics-electrical' }
  },
  {
    id: 'p2',
    title: 'Agricultural Submersible Pumping Kit (5HP)',
    description: 'High-efficiency submersible pump designed for deep wells and boreholes.',
    base_price_per_unit: 38500,
    unit_label: 'unit',
    bulk_minimum_order: 2,
    quality_grade: 'Industrial',
    hsn_code: '84137010',
    certifications: ['ISO 9001:2015'],
    technical_specifications: { power: '5 HP', head: '100m', phase: '3 Phase' },
    hero_image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', geo_lat: 21.0077, geo_lng: 75.5626 },
    sector_id: { name: 'Agriculture', slug: 'agriculture' }
  },
  {
    id: 'p3',
    title: 'High-Yield Hybrid Tomato Seeds (Arka Rakshak)',
    description: 'Triple disease resistant hybrid tomato seeds, suitable for long-distance transport.',
    base_price_per_unit: 1200,
    unit_label: 'packet',
    bulk_minimum_order: 50,
    quality_grade: 'Premium',
    hsn_code: '12099140',
    certifications: ['NSSO Certified'],
    technical_specifications: { yield: '90-100 tons/hectare', duration: '140 days', resistance: 'ToLCV, BW, EB' },
    hero_image_url: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', geo_lat: 21.0077, geo_lng: 75.5626 },
    sector_id: { name: 'Agriculture', slug: 'agriculture' }
  },
  {
    id: 'p4',
    title: 'Premium Selvedge Denim Fabric (12oz Indigo)',
    description: 'Authentic ring-spun selvedge denim fabric, perfect for premium jeans.',
    base_price_per_unit: 850,
    unit_label: 'meter',
    bulk_minimum_order: 500,
    quality_grade: 'Premium',
    hsn_code: '52094200',
    certifications: ['Oeko-Tex Standard 100'],
    technical_specifications: { weight: '12 oz', width: '32 inches', material: '100% Cotton' },
    hero_image_url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Arvind Mills Ltd', city: 'Ahmedabad', state: 'Gujarat', geo_lat: 23.0225, geo_lng: 72.5714 },
    sector_id: { name: 'Apparel & Fashion', slug: 'apparel-fashion' }
  },
  {
    id: 'p5',
    title: 'Combed Cotton Yarn (40s Count, Ring Spun)',
    description: 'High-quality combed cotton yarn for knitting and weaving applications.',
    base_price_per_unit: 285,
    unit_label: 'kg',
    bulk_minimum_order: 1000,
    quality_grade: 'A',
    hsn_code: '52052310',
    certifications: ['GOTS Certified'],
    technical_specifications: { count: '40s Ne', type: 'Ring Spun Combed', strength: 'High' },
    hero_image_url: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Arvind Mills Ltd', city: 'Ahmedabad', state: 'Gujarat', geo_lat: 23.0225, geo_lng: 72.5714 },
    sector_id: { name: 'Apparel & Fashion', slug: 'apparel-fashion' }
  },
  {
    id: 'p6',
    title: 'Handloom Khadi Fabric (Muslin Grade)',
    description: 'Authentic hand-spun and hand-woven khadi muslin fabric.',
    base_price_per_unit: 420,
    unit_label: 'meter',
    bulk_minimum_order: 200,
    quality_grade: 'Premium',
    hsn_code: '52083110',
    certifications: ['Khadi Mark'],
    technical_specifications: { weave: 'Plain', width: '44 inches', material: 'Hand-spun Cotton' },
    hero_image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Arvind Mills Ltd', city: 'Ahmedabad', state: 'Gujarat', geo_lat: 23.0225, geo_lng: 72.5714 },
    sector_id: { name: 'Apparel & Fashion', slug: 'apparel-fashion' }
  },
  {
    id: 'p7',
    title: 'High-Tensile Hex Bolt Set (Grade 10.9, M10)',
    description: 'Heavy-duty hex bolts for automotive and industrial machinery.',
    base_price_per_unit: 145,
    unit_label: 'kg',
    bulk_minimum_order: 50,
    quality_grade: 'Automotive OEM',
    hsn_code: '73181500',
    certifications: ['ISO/TS 16949'],
    technical_specifications: { size: 'M10', grade: '10.9', finish: 'Zinc Plated' },
    hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Sundram Fasteners Ltd', city: 'Chennai', state: 'Tamil Nadu', geo_lat: 13.0827, geo_lng: 80.2707 },
    sector_id: { name: 'Automobile Parts', slug: 'automobile-ev' }
  },
  {
    id: 'p8',
    title: 'BLDC Motor Controller Kit (48V/72V, 3KW)',
    description: 'Intelligent motor controller for 2-wheeler and 3-wheeler EVs.',
    base_price_per_unit: 8500,
    unit_label: 'unit',
    bulk_minimum_order: 10,
    quality_grade: 'Premium',
    hsn_code: '85044090',
    certifications: ['ARAI Approved'],
    technical_specifications: { voltage: '48V/72V', power: '3 kW', efficiency: '>92%' },
    hero_image_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Sundram Fasteners Ltd', city: 'Chennai', state: 'Tamil Nadu', geo_lat: 13.0827, geo_lng: 80.2707 },
    sector_id: { name: 'Automobile Parts', slug: 'automobile-ev' }
  },
  {
    id: 'p9',
    title: 'Disc Brake Assembly (Ventilated, 280mm)',
    description: 'High-performance ventilated disc brake assembly for passenger vehicles.',
    base_price_per_unit: 3200,
    unit_label: 'set',
    bulk_minimum_order: 20,
    quality_grade: 'OEM Replacement',
    hsn_code: '87083000',
    certifications: ['ISO/TS 16949'],
    technical_specifications: { diameter: '280 mm', type: 'Ventilated', material: 'Cast Iron' },
    hero_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200',
    is_stale: false,
    supplier_id: { company_name: 'Sundram Fasteners Ltd', city: 'Chennai', state: 'Tamil Nadu', geo_lat: 13.0827, geo_lng: 80.2707 },
    sector_id: { name: 'Automobile Parts', slug: 'automobile-ev' }
  }
];

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  let product = DEMO_PRODUCTS.find(p => p.id === id);
  if (!product) {
    product = {
      ...DEMO_PRODUCTS[0],
      id: id,
      title: `Mock Product (${id})`,
      description: 'This is an auto-generated mock product because Supabase is not connected and this product ID is not explicitly mocked.',
    };
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/services/supabaseServer');
      const supabase = createAdminClient();
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier_id (id, company_name, city, state, status, year_established, gst_number, geo_lat, geo_lng),
          sector_id (name, slug)
        `)
        .eq('id', id)
        .single();
        
      if (!error && data) {
        product = data;
      }
    }
  } catch (e) {
    console.error("Failed to fetch product, using fallback demo product.", e);
  }

  // Parse technical specs (handle JSON string if it comes as text, or object if JSONB is automatically parsed)
  // Accommodating both 'specifications' and 'technical_specifications' per instructions
  let specs = {};
  const rawSpecs = product.specifications || product.technical_specifications;
  
  if (rawSpecs) {
    if (typeof rawSpecs === 'string') {
      try {
        specs = JSON.parse(rawSpecs);
      } catch (e) {
        console.error("Failed to parse technical specs", e);
      }
    } else {
      specs = rawSpecs;
    }
  }

  // Calculate Spatial Routing (Haversine)
  // Simulated Buyer Location (Delhi) for demo purposes
  const buyerLat = 28.6139;
  const buyerLng = 77.2090;
  const supplierLat = product.supplier_id?.geo_lat;
  const supplierLng = product.supplier_id?.geo_lng;
  
  const distanceKm = calculateDistance(buyerLat, buyerLng, supplierLat, supplierLng);
  // Estimate: ₹4 per km per MT (Metric Ton). Assuming average bulk order is 1 MT for display.
  const shippingEstimate = distanceKm ? distanceKm * 4 : 0;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/directory" className="text-gray-500 hover:text-brand-600 transition-colors">
              Directory
            </Link>
            <span className="text-gray-400">/</span>
            {product.sector_id && (
              <>
                <Link href={`/directory?sector=${product.sector_id.slug}`} className="text-gray-500 hover:text-brand-600 transition-colors">
                  {product.sector_id.name}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-md">{product.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Image, Specs & Logistics */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Hero Image */}
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
                <CommodityImage
                  src={product.hero_image_url || 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=1200'}
                  category={product.sector_id?.name || 'Industrial Product'}
                  className="w-full h-80 sm:h-96"
                />
                {product.is_stale && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-warning-500 text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Price Updating (Fallback)
                  </div>
                )}
                {product.quality_grade && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold shadow-sm border border-gray-100">
                    {product.quality_grade} Grade
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{product.title}</h1>
                <p className="mt-4 text-gray-600 leading-relaxed text-base">{product.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.certifications?.map((cert) => (
                    <span key={cert} className="px-3 py-1.5 rounded-lg bg-success-50 text-success-700 text-xs font-semibold border border-success-100 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      {cert}
                    </span>
                  ))}
                  {product.hsn_code && (
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                      HSN: {product.hsn_code}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Logistics & Spatial Routing Agent */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-subtle overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                </div>
                
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 relative z-10">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Spatial Routing & Logistics
                </h2>
                
                {distanceKm ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Transport Path</div>
                      <div className="text-lg font-extrabold text-gray-900">{distanceKm} <span className="text-sm font-medium text-gray-500">km</span></div>
                      <div className="text-xs text-gray-400 mt-1 line-clamp-1">{product.supplier_id?.city} → Delhi (Simulated)</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Bulk Freight (Per MT)</div>
                      <div className="text-lg font-extrabold text-brand-600">₹{shippingEstimate.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase">Calculated at ₹4/km</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Estimated Transit</div>
                      <div className="text-lg font-extrabold text-gray-900">{Math.max(1, Math.ceil(distanceKm / 400))} <span className="text-sm font-medium text-gray-500">Days</span></div>
                      <div className="text-xs text-gray-400 mt-1">Standard Surface</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500 text-center">
                    Precise routing unavailable. Destination or Origin coordinates missing.
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Technical Specifications
                  </h2>
                </div>
                
                <div className="p-0">
                  {Object.keys(specs).length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(specs).map(([key, value], index) => (
                          <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                            <th scope="row" className="px-6 py-4 font-medium text-gray-500 capitalize w-1/3 align-top">
                              {key.replace(/_/g, ' ')}
                            </th>
                            <td className="px-6 py-4 text-gray-900 font-medium">
                              {typeof value === 'boolean' 
                                ? (value ? 'Yes' : 'No') 
                                : Array.isArray(value) 
                                  ? value.join(', ') 
                                  : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-gray-500 text-sm text-center">
                      No technical specifications available for this product.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Pricing & Supplier Card via Client Component */}
            <QuotationDock product={{...product, shippingEstimate, distanceKm}} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
