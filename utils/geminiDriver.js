/**
 * B2B Bharat Gemini Autonomous Inference Driver - 100% Free Tier Edge Engine
 */

export async function callGeminiAgent(systemInstruction, userPayload) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable missing. Executing safe localized structural fallback.");
    return JSON.stringify({
      category: "GENERAL_QUERY",
      urgency: "LOW",
      automatedReply: "Thank you for reaching out to B2B Bharat. A verified platform system agent is tracking your request.",
      fraudFlag: false
    });
  }

  try {
    // Calling the native Gemini API developer endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `System Directive: ${systemInstruction}\n\nUser Input Context: ${userPayload}`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.15,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Gateway responded with status: ${response.status}`);
    }

    const data = await response.json();
    const rawTextResponse = data.candidates[0].content.parts[0].text.trim();
    
    return rawTextResponse;
  } catch (error) {
    console.error("Gemini Core Agent Execution Failure:", error);
    throw error;
  }
}
