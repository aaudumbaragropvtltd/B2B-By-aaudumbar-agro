import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const conversationId = searchParams.get('id');

    if (conversationId) {
      // Fetch specific conversation and its messages
      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          users!conversations_buyer_id_fkey ( id, company_name, registered_email ),
          users!conversations_supplier_id_fkey ( id, company_name, registered_email ),
          rfqs ( product_name ),
          products ( title )
        `)
        .eq('id', conversationId)
        .single();
        
      if (error) throw error;
      
      const { data: messages, error: msgError } = await supabaseAdmin
        .from('messages')
        .select(`
          *,
          users!messages_sender_id_fkey ( company_name, role )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      return NextResponse.json({ conversation, messages });
    } else {
      // Fetch list of conversations
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          users!conversations_buyer_id_fkey ( id, company_name, registered_email ),
          users!conversations_supplier_id_fkey ( id, company_name, registered_email )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('conversations table notice:', error.message);
        return NextResponse.json({ conversations: [] });
      }

      let filtered = data || [];
      if (search) {
        const q = search.toLowerCase();
        filtered = (data || []).filter(c => 
          c.id?.toLowerCase().includes(q) ||
          (c.users_conversations_buyer_id_fkey?.company_name || '').toLowerCase().includes(q) ||
          (c.users_conversations_supplier_id_fkey?.company_name || '').toLowerCase().includes(q)
        );
      }

      return NextResponse.json({ conversations: filtered });
    }
  } catch (error) {
    console.warn('Error in Admin Conversations GET:', error.message);
    return NextResponse.json({ conversations: [] });
  }
}

export async function DELETE(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('message_id');

    if (messageId) {
      // Delete specific message (moderation)
      const { error } = await supabaseAdmin
        .from('messages')
        .update({ content: '[This message was removed by an administrator]', attachments: null })
        .eq('id', messageId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Message moderated' });
    }

    return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });
  } catch (error) {
    console.error('Error in Admin Conversations DELETE:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
