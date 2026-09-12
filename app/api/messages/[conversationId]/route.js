import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

// Get messages for a conversation
export async function GET(request, { params }) {
  try {
    const { conversationId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) return new NextResponse('User profile not found', { status: 404 });

    // Validate access
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) return new NextResponse('Conversation not found', { status: 404 });
    if (conversation.buyer_id !== profile.id && conversation.supplier_id !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*, sender:sender_id(company_name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', profile.id);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Send a message
export async function POST(request, { params }) {
  try {
    const { conversationId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) return new NextResponse('User profile not found', { status: 404 });

    // Validate access
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) return new NextResponse('Conversation not found', { status: 404 });
    if (conversation.buyer_id !== profile.id && conversation.supplier_id !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { text, fileUrl, fileType, fileName, fileSize } = body;

    if (!text && !fileUrl) {
      return new NextResponse('Message cannot be empty', { status: 400 });
    }

    // Insert message
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: profile.id,
        text: text || '',
        file_url: fileUrl || null,
        file_type: fileType || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        is_read: false
      }])
      .select('*, sender:sender_id(company_name)')
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
