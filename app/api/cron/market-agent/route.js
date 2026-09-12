import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ask Gemini API to analyze current market rates for the commodity
async function fetchMarketDataFromGemini(productName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const prompt = `
  You are an expert market intelligence agent specializing in Indian B2B commodities and machinery.
  Analyze the current wholesale market rate for the product: "${productName}".
  Return ONLY a valid JSON array containing exactly 3 realistic competitor/vendor pricing estimates in INR (₹).
  Format your response exactly like this, with no markdown or backticks:
  [
    {"name": "Vendor A", "price": 4500, "url": "https://indiamart.com/search"},
    {"name": "Vendor B", "price": 4650, "url": "https://tradeindia.com/search"},
    {"name": "Vendor C", "price": 4400, "url": "https://exportersindia.com/search"}
  ]
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent factual formatting
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', errorText);
    throw new Error(`Failed to fetch from Gemini API: ${response.status}`);
  }

  const result = await response.json();
  const textContent = result.candidates[0].content.parts[0].text;
  
  // Clean up any potential markdown formatting the AI might add despite instructions
  const cleanedText = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    const parsedData = JSON.parse(cleanedText);
    return parsedData;
  } catch (err) {
    console.error('Failed to parse Gemini response:', cleanedText);
    throw new Error('Gemini returned invalid JSON');
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch active products to track
    const { data: products, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, title, base_price_per_unit')
      .eq('is_active', true)
      .limit(5); // Process in batches

    if (fetchErr) throw fetchErr;

    const results = [];

    // 2. Run the Gemini AI Market Intelligence workflow for each product
    for (const product of products) {
      console.log(`[Market Agent] Asking Gemini to analyze market rates for: ${product.title}`);
      
      try {
        const vendorPrices = await fetchMarketDataFromGemini(product.title);
        
        // Calculate ranges
        const prices = vendorPrices.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        // 3. Save to market_rates table
        const { data: rateData, error: insertErr } = await supabaseAdmin
          .from('market_rates')
          .insert([{
            product_id: product.id,
            commodity_name: product.title,
            min_price: minPrice,
            max_price: maxPrice,
            average_price: avgPrice,
            source_url: 'Gemini AI Aggregation',
            is_competitor: true
          }])
          .select()
          .single();
          
        if (insertErr) {
          console.error('Error saving market rate:', insertErr);
          continue;
        }
        
        results.push({
          product: product.title,
          ourPrice: product.base_price_per_unit,
          marketAvg: avgPrice,
          min: minPrice,
          max: maxPrice,
          vendorsAnalyzed: vendorPrices.length
        });

      } catch (agentErr) {
        console.error(`Skipping ${product.title} due to agent error:`, agentErr.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Market Agent workflow completed.",
      analyzed: results.length,
      data: results 
    });

  } catch (error) {
    console.error('Market Agent Error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
