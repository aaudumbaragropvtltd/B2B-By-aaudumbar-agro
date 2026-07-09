import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callGeminiAgent } from '@/utils/geminiDriver';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { message, userId, orderId = null } = await request.json();

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing required conversational telemetry points." }, { status: 400 });
    }

    // 1. Fetch user data to enrich the LLM context window
    const { data: profile } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();

    // 2. Define strict system instructions for structured evaluation
    const systemInstruction = `You are the Lead Multi-Agent Compliance System for B2B Bharat. 
    Analyze the inbound message from a corporate client. Classify into: ESCROW_DISPUTE, LOGISTICS_HAULING_DELAY, ONBOARDING_GST_FAIL, or COMPLIMENTARY_FEEDBACK.
    Identify if statements indicate intentional contract break or chargeback fraud threats. 
    Return EXACTLY a valid JSON object matching this structure:
    {
      "category": "ONE_OF_THE_ABOVE_FOUR",
      "urgency": "HIGH" | "MEDIUM" | "LOW",
      "fraudFlag": true | false,
      "automatedReply": "A highly professional, localized response referencing official marketplace protocols."
    }`;

    const contextualPayload = `User Corporate Node: ${JSON.stringify(profile)}\nTarget Order Context ID: ${orderId}\nMessage Log: "${message}"`;

    // 3. Trigger Free Tier LLM Processing Execution Loop
    const rawAgentAnalysis = await callGeminiAgent(systemInstruction, contextualPayload);
    const parsedAnalysis = JSON.parse(rawAgentAnalysis);

    // 4. Self-Healing Trigger: Flag high-risk accounts or freeze disputed orders instantly if fraud flag is active
    if (parsedAnalysis.fraudFlag === true || parsedAnalysis.urgency === 'HIGH') {
      await supabaseAdmin
        .from('users')
        .update({ status: 'suspended' })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      analysisSummary: parsedAnalysis
    });

  } catch (error) {
    console.error("Agent Hub Route Exception Intercepted:", error);
    return NextResponse.json({ error: "Serverless execution layer timeout error.", details: error.message }, { status: 500 });
  }
}
