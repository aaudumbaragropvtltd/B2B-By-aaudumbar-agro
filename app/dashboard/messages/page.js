"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/services/supabase';

export default function MessagesDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('id, role').eq('firebase_uid', user.id).single();
        setCurrentUser(profile);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const loadConversation = async (conv) => {
    setSelectedConversation(conv);
    try {
      const response = await fetch(`/api/messages/${conv.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8">Loading Messages...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Trade Messages</h1>
        <p className="text-gray-500 mt-1">Negotiate and communicate securely.</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 font-bold text-gray-700 bg-gray-50">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No active conversations.</div>
            ) : (
              conversations.map(conv => {
                const isBuyer = currentUser?.role === 'buyer';
                const otherParty = isBuyer ? conv.supplier : conv.buyer;
                
                return (
                  <button 
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-bold text-gray-500 shrink-0">
                      {otherParty?.company_name?.[0] || '?'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-gray-900 truncate">{otherParty?.company_name || 'Unknown User'}</div>
                      <div className="text-xs text-blue-600 truncate">{conv.product?.title || 'General Inquiry'}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col bg-gray-50/50">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex justify-between items-center">
                <div className="font-bold text-gray-900">
                  {currentUser?.role === 'buyer' ? selectedConversation.supplier?.company_name : selectedConversation.buyer?.company_name}
                </div>
                {selectedConversation.product_id && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    Discussing: {selectedConversation.product?.title}
                  </div>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm mt-10">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === currentUser?.id;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl p-4 ${
                          isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                          <div className="text-sm">{msg.content}</div>
                          <div className={`text-[10px] mt-2 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[100px]"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
