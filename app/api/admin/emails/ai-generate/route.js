import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

function generateFallbackEmail({ goal, language = 'english' }) {
  if (language === 'hindi') {
    if (goal === 'urgent_price_check') {
      return {
        subject: '🚨 [अति महत्वपूर्ण: 5 तारीख] अपने थोक जिंसों के रेट्स तुरंत अपडेट करें | B2B इंडिया',
        body: `नमस्ते आदरणीय सप्लायर व्यापारी बंधुओं,\n\nB2B इंडिया (Aaudumbar Agro Pvt. Ltd.) की ओर से महत्वपूर्ण सूचना।\n\nहमने देखा है कि इस महीने के लिए आपके थोक उत्पादों के दाम अभी तक अपडेट नहीं हुए हैं।\n\n📌 अपडेट करना क्यों आवश्यक है?\n• पूरे देश भर के वेरिफाइड थोक खरीदार तुरंत बल्क कोटेशन्स खोज रहे हैं।\n• पुराने रेट्स वाले उत्पादों को सर्च रिजल्ट्स में पीछे कर दिया जाता है।\n• 10% सुरक्षित एस्क्रो एडवांस के साथ त्वरित खरीद आदेश पाने के लिए आज ही अपने रेट्स अपडेट करें।\n\n👉 तुरंत पोर्टल पर लॉगिन करके रेट्स अपडेट करें:\nhttps://b2bindia.site/dashboard/products\n\nधन्यवाद!\n— B2B इंडिया ट्रेड ऑपरेशन्स डेस्क (+91 84088 41998)`
      };
    }
    return {
      subject: '🌾 [मासिक अपडेट] 1 तारीख रिमाइंडर: अपने सभी थोक प्रोडक्ट्स के रेट्स अपडेट करें | B2B इंडिया',
      body: `नमस्ते सम्मानित सप्लायर पार्टनर्स,\n\nनए महीने की शुरुआत पर B2B इंडिया की ओर से हार्दिक शुभकामनाएं।\n\nकृपया अपने सभी कृषि उत्पादों, जिंसों और मशीनरी के नए चालू बाजार भाव पोर्टल पर अपडेट करें ताकि वेरिफाइड खरीदार आपको सीधे बल्क ऑर्डर्स दे सकें।\n\n📌 मुख्य लाभ:\n• आपका कैटलॉग सर्च में सबसे ऊपर दिखेगा।\n• 10% एडवांस एस्क्रो सुरक्षा के साथ सीधे परचेस ऑर्डर प्राप्त करें।\n• मोलभाव के बिना तुरंत ऑर्डर कन्फर्मेशन।\n\n👉 यहाँ क्लिक करके नए रेट्स भरें:\nhttps://b2bindia.site/dashboard/products\n\n— टीम B2B इंडिया (Aaudumbar Agro Pvt. Ltd.)`
    };
  }

  // Default English
  if (goal === 'urgent_price_check') {
    return {
      subject: '🚨 [Urgent: 5th of Month] Verify Your Wholesale Commodity Prices Today | B2B India',
      body: `Dear Valued Wholesale Supplier,\n\nGreetings from B2B India Marketplace (Aaudumbar Agro Pvt. Ltd.)!\n\nThis is an urgent reminder that your wholesale catalog spot prices have not yet been refreshed for the current monthly trading cycle.\n\n⚠️ Why you must update today:\n• Institutional buyers are actively placing high-volume procurement RFQs this week.\n• Catalogs without updated rates will temporarily lose the "Verified Active Spot Rate" badge.\n• Unrefreshed listings are deprioritized in automated quotation matching.\n\n👉 Update your spot rates now:\nhttps://b2bindia.site/dashboard/products\n\nIf you have already updated your prices this week, thank you for keeping your catalog active!\n\n— Team B2B India Trade Desk (+91 84088 41998)`
    };
  }

  return {
    subject: '🌾 [1st of Month Reminder] Update Your Wholesale Prices & Catalog | B2B India',
    body: `Dear Valued Supplier Partner,\n\nGreetings from B2B India Marketplace (Aaudumbar Agro Pvt. Ltd.)!\n\nAs we begin the new trading month, please review and update your wholesale commodity and product prices on your dashboard.\n\n📌 Why updating on the 1st is critical:\n• Verified bulk buyers across India receive real-time accurate rates.\n• Updated catalogs rank at the top of buyer inquiries and category searches.\n• 10% escrow advance protection ensures prompt payment upon loading.\n\n👉 Update your prices here:\nhttps://b2bindia.site/dashboard/products\n\nThank you for your valued trade partnership!\n\n— Team B2B India (Aaudumbar Agro Pvt. Ltd.)`
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      goal = 'price_reminder',
      language = 'english',
      tone = 'professional',
      customPrompt = '',
      apiKey: userApiKey,
    } = body;

    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.length < 15 || apiKey === 'AIzaSyYourGeminiApiKeyString') {
      const fallback = generateFallbackEmail({ goal, language });
      return NextResponse.json({
        success: true,
        source: 'localized_engine',
        subject: fallback.subject,
        body: fallback.body,
      });
    }

    const prompt = `You are an elite B2B Email Copywriter for "B2B India" (operated by Aaudumbar Agro Pvt. Ltd., Maharashtra, India).
Craft an official, high-converting, professional B2B Wholesale Email for registered wholesale suppliers and merchants.

OBJECTIVE: ${goal}
LANGUAGE: ${language.toUpperCase()} (If Hindi, write in clean Devanagari Hindi. If English, write in crisp Indian Business English).
TONE: ${tone.toUpperCase()}
CUSTOM INSTRUCTIONS: ${customPrompt || 'Monthly reminder to update wholesale prices so bulk buyers receive accurate quotes and purchase orders.'}

Format your output STRICTLY as a valid JSON object with exactly two fields:
{
  "subject": "Clear, compelling email subject line (under 65 chars with relevant emoji)",
  "body": "Formatted email body text with salutation, key bullet points, call-to-action link (https://b2bindia.site/dashboard/products), and official signoff."
}
Return ONLY raw JSON, no markdown code block fences.`;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 800,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            const cleanJson = rawText.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json({
              success: true,
              source: `google_gemini (${model})`,
              subject: parsed.subject,
              body: parsed.body,
            });
          }
        }
      } catch (err) {
        console.warn(`Gemini model ${model} attempt failed:`, err.message);
      }
    }

    const fallback = generateFallbackEmail({ goal, language });
    return NextResponse.json({
      success: true,
      source: 'localized_fallback',
      subject: fallback.subject,
      body: fallback.body,
    });
  } catch (error) {
    console.error('AI Email generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
