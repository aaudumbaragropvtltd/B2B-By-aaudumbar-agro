import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

/**
 * Intelligent localized fallback generator if Gemini API key is not yet configured or rate-limited
 */
function generateLocalizedFallback({ goal, language = 'english', tone = 'professional', customPrompt = '' }) {
  const portalUrl = 'https://b2bindia.site/dashboard/products';
  
  if (language === 'hindi') {
    if (goal === 'urgent_price_check') {
      return `🌾 *नमस्ते आदरणीय थोक सप्लायर पार्टनर्स!* 🌾\n\nB2B इंडिया (Aaudumbar Agro Pvt. Ltd.) की ओर से महत्वपूर्ण सूचना:\n\nकृपया अपने सभी थोक प्रोडक्ट्स के रेट्स तुरंत अपडेट करें।\n\n📌 *अपडेट करना क्यों ज़रूरी है?*\n• पूरे भारत के वेरिफाइड थोक खरीदार लाइव रेट्स देख रहे हैं।\n• ताज़ा रेट्स वाले सप्लायर्स को RFQ और ऑर्डर्स में सबसे पहले प्राथमिकता दी जाती है।\n\n👉 *अभी अपने रेट्स अपडेट करें:*\n${portalUrl}\n\n(यदि आपने पहले ही अपडेट कर दिया है, तो आपका बहुत-बहुत धन्यवाद!)\n— *B2B इंडिया ट्रेड डेस्क* (+91 84088 41998)`;
    }
    if (goal === 'festive_offer') {
      return `🎉 *नमस्ते थोक सप्लायर पार्टनर्स!* 🌾\n\nत्योहारी सीज़न के उपलक्ष्य में B2B इंडिया पर बल्क खरीदारों की भारी मांग आ रही है!\n\nअपने एग्री कमोडिटीज और प्रोडक्ट्स के स्पेशल डिस्काउंटेड रेट्स अपडेट करें ताकि देश भर के सुपरस्टॉकिस्ट्स आपसे सीधे बल्क ऑर्डर्स बुक कर सकें।\n\n👉 *यहाँ अपनी इन्वेंटरी व रेट्स अपडेट करें:*\n${portalUrl}\n\n— *टीम B2B इंडिया (Aaudumbar Agro Pvt. Ltd.)*`;
    }
    return `🌾 *नमस्ते आदरणीय सप्लायर पार्टनर्स!* 🌾\n\nमहीने की शुरुआत में अपने थोक जिंसों के रेट्स पोर्टल पर अपडेट करें ताकि वेरिफाइड खरीदार आपको सीधे बल्क परचेस ऑर्डर दे सकें।\n\n👉 *अपडेट लिंक:*\n${portalUrl}\n\nधन्यवाद!\n— *टीम B2B इंडिया*`;
  }

  if (language === 'hinglish') {
    return `🌾 *Namaste Valued Suppliers & Trade Partners!* 🌾\n\nB2B India Marketplace ki taraf se monthly price update reminder!\n\nKripya apne portal par sabhi wholesale products ke rates update karein taaki verified bulk buyers aapko direct purchase order de sakein.\n\n📌 *Benefits:*\n• Live accurate rates se buyer order confirmation fast hota hai.\n• Aapka catalog inquiries mein top rank karega.\n\n👉 *Click karke rates update karein:*\n${portalUrl}\n\nKoi bhi help chahiye toh direct reply karein ya trade desk ko call karein.\n— *Team B2B India (Aaudumbar Agro Pvt. Ltd.)*`;
  }

  if (language === 'marathi') {
    return `🌾 *सस्नेह नमस्कार सन्माननीय सप्लायर व्यापारी बंधूंनो!* 🌾\n\nB2B इंडिया (Aaudumbar Agro Pvt. Ltd.) कडून मासिक दर अपडेट रिमाइंडर:\n\nकृपया आपल्या सर्व शेतमाल व होलसेल उत्पादनांचे नवीन चालू बाजारभाव पोर्टलवर अपडेट करावेत.\n\n📌 *महत्त्वाचे फायदे:*\n• संपूर्ण भारतातील खरेदीदारांना अचूक दर मिळतात.\n• नवीन दर असलेल्या सप्लायर्सना थेट खरेदी ऑर्डर्स जलद मिळतात.\n\n👉 *दर अपडेट करण्यासाठी येथे क्लिक करा:*\n${portalUrl}\n\nधन्यवाद!\n— *टीम B2B इंडिया* (+91 84088 41998)`;
  }

  // Default English
  if (goal === 'urgent_price_check') {
    return `🚨 *URGENT: Monthly Price Verification Alert* 🌾\n\nDear Valued Wholesale Suppliers,\n\nGreetings from *B2B India Marketplace (Aaudumbar Agro Pvt. Ltd.)*!\n\nWe noticed your wholesale commodity catalog has not yet refreshed for this trading cycle. High-volume institutional buyers are actively placing RFQs for bulk delivery.\n\n⚠️ *Action Required Today:*\nReview and confirm your active spot prices to avoid quotation suspension.\n\n👉 *Update your rates immediately:*\n${portalUrl}\n\nNeed immediate trade support? Reply to this message or call our trade desk at +91 84088 41998.\n— *Team B2B India Trade Operations*`;
  }

  if (goal === 'demand_inquiry') {
    return `📢 *HIGH DEMAND INQUIRY: Buyers Seeking Fresh Lots!* 🌾\n\nNamaste Wholesale Suppliers!\n\nVerified bulk buyers on *B2B India* have posted fresh high-volume purchase requests today. We require updated wholesale spot rates and lot availability across all categories.\n\n📦 *Buyers are active right now:*\n• Direct 10% escrow advance protection guaranteed.\n• 90% balance payable strictly at godown loading.\n\n👉 *Publish your fresh rates & available quantities:*\n${portalUrl}\n\n— *B2B India Trade Desk (Aaudumbar Agro Pvt. Ltd.)*`;
  }

  return `🌾 *Namaste Valued Suppliers & Trade Partners!* 🌾\n\nGreetings from *B2B India Marketplace (Aaudumbar Agro Pvt. Ltd.)*!\n\n${customPrompt || "This is our monthly reminder for all registered wholesale suppliers to review and update your wholesale commodity and product prices on the portal."}\n\n📌 *Why keeping your rates updated is essential:*\n• Verified bulk buyers across India receive real-time accurate rates.\n• Updated catalogs rank at the top of buyer inquiries & RFQs.\n• Immediate purchase order confirmations without renegotiation delays.\n\n👉 *Click here to update your prices now:*\n${portalUrl}\n\n*(If you have already updated your prices recently, thank you so much!)*\n\n— *Team B2B India (Aaudumbar Agro Pvt. Ltd.)*`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      goal = 'price_reminder', // 'price_reminder' | 'urgent_price_check' | 'demand_inquiry' | 'festive_offer' | 'custom_prompt'
      language = 'english',    // 'english' | 'hindi' | 'hinglish' | 'marathi'
      tone = 'professional',    // 'professional' | 'urgent' | 'friendly' | 'promotional'
      customPrompt = '',
      apiKey: userApiKey,
    } = body;

    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY;

    // If no valid Gemini API key is configured or it's a placeholder, use our intelligent localized fallback
    if (!apiKey || apiKey === 'AIzaSyYourGeminiApiKeyString' || apiKey.length < 15) {
      const message = generateLocalizedFallback({ goal, language, tone, customPrompt });
      return NextResponse.json({
        success: true,
        source: 'localized_engine',
        note: 'Generated using B2B India Localized Trade Engine. Configure a free Gemini API Key for dynamic real-time AI reasoning.',
        message,
      });
    }

    const systemPrompt = `You are the Master B2B WhatsApp Communication Specialist for "B2B India" (operated by Aaudumbar Agro Pvt. Ltd., Maharashtra, India).
Your task is to craft an engaging, high-converting, professional WhatsApp Broadcast message for registered wholesale suppliers and merchants.

CRITICAL RULES FOR WHATSAPP BROADCAST:
1. Do NOT use personal greeting tags like "{{company_name}}" because this broadcast is sent simultaneously to hundreds of suppliers in one blast. Address them collectively/universally (e.g. "🌾 Namaste Valued Wholesale Partners! 🌾" or "नमस्ते सम्मानित सप्लायर पार्टनर्स!").
2. Include emojis strategically for visual hierarchy and readability on mobile screens.
3. Use WhatsApp markdown: *bold* for emphasis, bullet points (•) for key benefits.
4. Keep the message concise (under 180 words) and actionable.
5. ALWAYS include the portal link clearly: https://b2bindia.site/dashboard/products
6. Mention B2B India (Aaudumbar Agro Pvt. Ltd.) as the sender.
7. Language requested: ${language.toUpperCase()} (If Hindi, write in clean Devanagari Hindi. If Hinglish, write in natural conversational Roman Hindi. If Marathi, write in clean Devanagari Marathi. If English, write in crisp Indian Business English).
8. Tone requested: ${tone.toUpperCase()}.`;

    const userMessage = `Objective / Broadcast Goal: ${goal}
Specific admin instructions / details: ${customPrompt || 'Monthly reminder to update wholesale product prices so bulk buyers receive accurate quotes and purchase orders.'}
Target Audience: Verified wholesale suppliers, APMC mandi traders, and commodity distributors across India.

Return ONLY the raw message text ready to be copied and pasted directly into WhatsApp. No conversational pleasantries or markdown code block quotes.`;

    let lastError = null;

    // Try Gemini models
    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\n${userMessage}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generatedText) {
            // Strip any accidental markdown triple-backticks if returned
            const cleanText = generatedText.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
            return NextResponse.json({
              success: true,
              source: `google_gemini (${model})`,
              model,
              message: cleanText,
            });
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    // If Gemini models encountered quota or network issues, fallback seamlessly
    console.warn('Gemini API call failed, using localized engine:', lastError);
    const fallbackMessage = generateLocalizedFallback({ goal, language, tone, customPrompt });
    return NextResponse.json({
      success: true,
      source: 'localized_engine_fallback',
      warning: `Gemini API notice: ${lastError}. Localized trade message provided.`,
      message: fallbackMessage,
    });

  } catch (error) {
    console.error('AI broadcast generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
