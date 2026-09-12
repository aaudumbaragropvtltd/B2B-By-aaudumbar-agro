"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingConversation, setViewingConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [search]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/admin/conversations?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) setConversations(data.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewConversation = async (conv) => {
    setViewingConversation(conv);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/conversations?id=${conv.id}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleModerateMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message content? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/conversations?message_id=${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: '[This message was removed by an administrator]', attachments: null } : m));
      } else {
        alert('Failed to moderate message');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Messages Moderation</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Monitor communication between buyers and suppliers to enforce platform policies.
          </p>
        </div>
        <div className="w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex h-[600px]">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No conversations found.</div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.id} 
                onClick={() => viewConversation(conv)}
                className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                  viewingConversation?.id === conv.id ? 'bg-brand-50 border-l-4 border-l-brand-500' : 'hover:bg-slate-100 border-l-4 border-l-transparent'
                }`}
              >
                <div className="text-xs font-bold text-slate-400 mb-1">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
                <div className="font-bold text-slate-900 text-sm truncate">
                  {conv.users_conversations_buyer_id_fkey?.company_name || 'Buyer'} 
                  <span className="text-slate-400 mx-1">↔</span> 
                  {conv.users_conversations_supplier_id_fkey?.company_name || 'Supplier'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Conversation View */}
        <div className="w-2/3 flex flex-col bg-white">
          {viewingConversation ? (
            <>
              <div className="p-4 border-b border-slate-200 bg-white">
                <h3 className="font-bold text-slate-900">
                  {viewingConversation.users_conversations_buyer_id_fkey?.company_name || 'Buyer'} 
                  <span className="text-slate-400 mx-2">and</span> 
                  {viewingConversation.users_conversations_supplier_id_fkey?.company_name || 'Supplier'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {messagesLoading ? (
                  <div className="text-center text-slate-500 mt-10">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10">No messages in this conversation.</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="group relative bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-slate-900">
                          {msg.users?.company_name || 'Unknown User'} 
                          <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">
                            {msg.users?.role || 'user'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      
                      {/* Moderation Button */}
                      {!msg.content.includes('[This message was removed') && (
                        <button 
                          onClick={() => handleModerateMessage(msg.id)}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2 py-1 rounded"
                        >
                          Remove Message
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
