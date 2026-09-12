import { NextResponse } from 'next/server';
import { askGeminiSupport } from '@/services/geminiSupportService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, messages, orderId, userEmail } = body;

    // Build standard conversation history
    let history = [];
    if (Array.isArray(messages) && messages.length > 0) {
      history = messages.map(m => ({
        role: m.role || (m.sender === 'user' ? 'user' : 'model'),
        text: m.text || m.content || ''
      }));
    } else if (message) {
      history = [{ role: 'user', text: message }];
    } else {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    // Call Gemini Support Engine
    const result = await askGeminiSupport(history, { orderId, userEmail });

    return NextResponse.json({
      success: true,
      reply: result.reply,
      model: result.model,
      // Backward compatibility for dashboard terminal
      analysisSummary: {
        automatedReply: result.reply,
        category: "GENERAL_SUPPORT",
        urgency: "NORMAL"
      }
    });

  } catch (error) {
    console.error("Support Chat API Exception:", error);
    return NextResponse.json({
      success: false,
      error: "Support agent temporary delay.",
      reply: "Thank you for reaching out to B2B India Support. Our support desk can also be contacted directly on WhatsApp at **+91 84088 41998** or email **b2bbharat.in@gmail.com**."
    }, { status: 500 });
  }
}
