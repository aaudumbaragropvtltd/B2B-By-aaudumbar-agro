"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/services/supabase';

const DEFAULT_SUGGESTIONS = [
  { label: "📦 My Orders & Live Status", query: "What did I order and what is the current status of my order?" },
  { label: "💰 90% Balance Payment", query: "How much is my remaining 90% balance and when do I pay it?" },
  { label: "🔒 10% Escrow Protection", query: "How does the 10% advance escrow payment protect my purchase?" },
  { label: "📬 Order Receipt & Spam Notice", query: "Where will I receive my 10% payment receipt and why should I check spam?" },
  { label: "🚚 Delivery & Hauling", query: "What is the timeline and process for direct warehouse delivery?" },
  { label: "🏢 Godown Pickup & Gate Pass", query: "What are the visitor requirements and Aadhar details for Self Godown Pickup?" },
  { label: "🌾 Commodity Quotations", query: "How can I get an official quotation for bulk Basmati Rice or commodities?" },
  { label: "📞 Connect to Human Officer", query: "I would like to speak directly with an Aaudumbar Agro customer support officer." }
];

export default function SupportChatPanel({ isDashboard = false }) {
  const { user, profile } = useAuth();
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "init-1",
      role: "model",
      text: `### Namaste! Welcome to B2B India Enterprise Support Desk 🇮🇳\n\nI am your **IndiaAI Support Assistant**, backed by **Aaudumbar Agro Pvt. Ltd.**\n\nI have real-time access to your **user account, orders, delivery tracking, and 10% escrow balances**.\n\nHow can I help you today?\n- **Check Your Live Orders & Delivery Status**\n- **10% Escrow Deposit & 90% Balance Settlement**\n- **Booking Receipts & Gate Pass Logistics**\n- **Wholesale Commodity Sourcing & RFQs**\n\nTap a quick topic below or type your question in English or Hindi!`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [orderQueryId, setOrderQueryId] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isSpeakingId, setIsSpeakingId] = useState(null);
  const [showOrderSelector, setShowOrderSelector] = useState(false);

  const chatContainerRef = useRef(null);

  // Fetch logged in user's orders automatically
  useEffect(() => {
    async function loadUserOrders() {
      const email = profile?.registered_email || user?.email;
      if (!email) return;

      try {
        setLoadingOrders(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`/api/orders/list?email=${encodeURIComponent(email)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            setUserOrders(data.orders);
            if (data.orders.length > 0 && !orderQueryId) {
              setOrderQueryId(data.orders[0].transaction_id || data.orders[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Could not pre-fetch user orders for chat:', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadUserOrders();
  }, [user, profile]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping]);

  const handleSendMessage = async (customQuery = null) => {
    const textToSend = (customQuery || inputText).trim();
    if (!textToSend || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Build conversation history for context
      const conversationPayload = messages.concat(userMessage).map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        text: m.text
      }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: conversationPayload,
          orderId: orderQueryId.trim() || undefined,
          userEmail: profile?.registered_email || user?.email || undefined,
          userId: profile?.id || user?.id || undefined,
          userName: profile?.full_name || profile?.company_name || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const botReply = {
          id: `bot-${Date.now()}`,
          role: "model",
          text: data.reply,
          model: data.model || 'IndiaAI Support',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botReply]);

        // If backend returned refreshed userOrders, update state
        if (data.userOrders && Array.isArray(data.userOrders) && data.userOrders.length > 0) {
          setUserOrders(prev => {
            const combined = [...prev];
            data.userOrders.forEach(no => {
              if (!combined.some(o => o.transaction_id === no.transaction_id || o.id === no.id)) {
                combined.push(no);
              }
            });
            return combined;
          });
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Support message error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `We are experiencing high network demand. You can reach our senior support desk directly:\n\n- 📞 **Helpline:** [+91 84088 41998](tel:+918408841998)\n- 💬 **WhatsApp Support:** [+91 84088 41998](https://wa.me/918408841998)\n- ✉️ **Email:** [b2bbharat.in@gmail.com](mailto:b2bbharat.in@gmail.com)`,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text, id) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Simple Markdown Renderer with robust mobile text wrapping
  const renderMarkdown = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-extrabold text-xs sm:text-sm text-slate-900 mt-2 mb-1 break-words">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-3 sm:ml-4 list-disc text-slate-700 text-xs sm:text-sm my-0.5 break-words">
            {formatBoldAndLinks(line.replace('- ', ''))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="ml-3 sm:ml-4 list-decimal text-slate-700 text-xs sm:text-sm my-0.5 break-words">
            {formatBoldAndLinks(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1 sm:h-1.5" />;
      }
      return (
        <p key={idx} className="text-slate-700 text-xs sm:text-sm leading-relaxed my-0.5 break-words">
          {formatBoldAndLinks(line)}
        </p>
      );
    });
  };

  const formatBoldAndLinks = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-slate-900 break-words">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="bg-slate-100 text-brand-700 px-1 py-0.5 rounded font-mono text-[10px] sm:text-xs font-bold break-all">
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-600 underline hover:text-brand-800 break-all">
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6">
      
      {/* Mobile-Friendly Emergency Contact Quick Bar */}
      <div className="flex sm:hidden items-center justify-between gap-1.5 p-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl text-[11px] shadow-sm">
        <a
          href="https://wa.me/918408841998?text=Hello%20B2B%20India%20Support%2C%20I%20need%20help%20with%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-center"
        >
          <span>💬</span>
          <span>WhatsApp</span>
        </a>
        <a
          href="tel:+918408841998"
          className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-center"
        >
          <span>📞</span>
          <span>Call Desk</span>
        </a>
        <Link
          href="/orders"
          className="flex-1 py-1.5 px-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-center"
        >
          <span>📦</span>
          <span>My Orders</span>
        </Link>
      </div>

      {/* Top Banner Alert regarding Spam Folder */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 sm:p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 rounded-2xl sm:rounded-3xl shadow-sm text-xs text-amber-950 flex items-start gap-2.5 sm:gap-3"
      >
        <span className="text-lg sm:text-xl flex-shrink-0 mt-0.5">📬</span>
        <div className="flex-1 min-w-0 text-[11px] sm:text-xs leading-relaxed">
          <strong className="text-amber-900 font-extrabold block sm:inline">10% Receipt &amp; Spam Notice: </strong>
          Receipts are automatically dispatched from <code className="bg-amber-100 font-mono font-bold px-1 py-0.5 rounded text-amber-900 break-all">b2bbharat.in@gmail.com</code>. 
          If not found in your inbox, check your <strong>Spam / Promotions tab</strong> and mark as <strong>&quot;Not Spam&quot;</strong>. Track orders on <Link href="/orders" className="font-bold underline text-amber-900 hover:text-amber-950">My Orders</Link>.
        </div>
      </motion.div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">

        {/* Left: Chat Terminal Container (8 Cols on desktop, full width on mobile) */}
        <div className="lg:col-span-8 w-full max-w-full min-w-0 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[560px] sm:h-[640px] md:h-[680px] lg:h-[720px]">
          
          {/* Chat Header */}
          <div className="px-3.5 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-500 flex items-center justify-center text-lg sm:text-xl shadow-md shadow-brand-500/30 flex-shrink-0">
                🤖
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h2 className="text-xs sm:text-base font-extrabold text-white tracking-tight truncate">
                    IndiaAI Support Assistant
                  </h2>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-300 font-mono truncate">
                  <span className="text-emerald-400 font-bold">● Active</span>
                  <span>•</span>
                  {profile?.company_name || user?.email ? (
                    <span className="truncate text-amber-300 font-medium">
                      👤 {profile?.company_name || user?.email} {userOrders.length > 0 ? `(${userOrders.length} orders)` : ''}
                    </span>
                  ) : (
                    <span>24/7 Verified Support</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setMessages([messages[0]])}
                className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1"
                title="Reset conversation"
              >
                <span>🔄</span>
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Quick Topics Header (Smooth Touch Horizontal Scroll) */}
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar text-xs w-full max-w-full flex-shrink-0">
            <span className="text-slate-400 font-bold whitespace-nowrap text-[9px] sm:text-[10px] uppercase flex-shrink-0">
              ⚡ Quick:
            </span>
            {DEFAULT_SUGGESTIONS.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(chip.query)}
                className="px-2.5 sm:px-3 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-full border border-slate-200 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all shadow-2xs hover:border-brand-300 flex-shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Active Orders Bar (If user has orders on file) */}
          {userOrders.length > 0 && (
            <div className="px-3 sm:px-4 py-1.5 bg-brand-50/70 border-b border-brand-100 flex items-center justify-between text-[11px] text-brand-950 overflow-x-auto no-scrollbar flex-shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold flex-shrink-0">📦 Your Recent Order:</span>
                <span className="font-mono font-bold text-brand-700 truncate">
                  {userOrders[0].product_name || 'Commodity'}
                </span>
                <span className="bg-brand-200/80 text-brand-900 px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase flex-shrink-0">
                  {userOrders[0].order_status || 'In Transit'}
                </span>
              </div>
              <button
                onClick={() => handleSendMessage(`What is the status of my order ${userOrders[0].transaction_id || userOrders[0].id}?`)}
                className="text-brand-700 font-extrabold underline hover:text-brand-900 flex-shrink-0 ml-2"
              >
                Track Now ➔
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 sm:space-y-4 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 min-w-0">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2 sm:gap-3 min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-900 text-white border border-slate-700'
                  }`}>
                    {isUser ? '👤' : '🤖'}
                  </div>

                  {/* Bubble with robust mobile text wrapping */}
                  <div className={`max-w-[88%] sm:max-w-xl min-w-0 rounded-2xl p-3 sm:p-4 text-xs sm:text-sm shadow-sm relative group break-words overflow-hidden ${
                    isUser
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {isUser ? (
                      <p className="leading-relaxed font-medium break-words">{msg.text}</p>
                    ) : (
                      <div className="space-y-1 min-w-0 break-words">
                        {renderMarkdown(msg.text)}
                      </div>
                    )}

                    {/* Metadata & Actions */}
                    <div className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t text-[10px] ${
                      isUser ? 'border-white/20 text-white/70' : 'border-slate-100 text-slate-400'
                    }`}>
                      <span>{msg.time}</span>

                      {!isUser && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="hover:text-slate-700 font-bold transition-colors py-0.5 px-1"
                            title="Copy reply text"
                          >
                            {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => handleSpeak(msg.text, msg.id)}
                            className="hover:text-slate-700 font-bold transition-colors py-0.5 px-1"
                            title="Listen to reply"
                          >
                            {isSpeakingId === msg.id ? '🔊 Stop' : '🔈 Read'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                  🤖
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-2.5 sm:p-3 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-mono">Assistant replying...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat Input & Context Box (100% Mobile Responsive) */}
          <div className="p-2.5 sm:p-4 bg-white border-t border-slate-100 space-y-2 flex-shrink-0 min-w-0">
            
            {/* Context bar / Order reference selector */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-slate-400 font-bold text-[10px] sm:text-[11px] whitespace-nowrap">
                  Order Ref:
                </span>
                {userOrders.length > 0 ? (
                  <select
                    value={orderQueryId}
                    onChange={(e) => setOrderQueryId(e.target.value)}
                    className="max-w-[200px] sm:max-w-xs px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono font-bold text-slate-800 outline-none focus:border-brand-500 truncate"
                  >
                    <option value="">Auto-Detect All Orders</option>
                    {userOrders.map((ord, idx) => (
                      <option key={idx} value={ord.transaction_id || ord.id}>
                        {ord.transaction_id || ord.id} — {ord.product_name?.slice(0, 20)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. TXN-IND-884920"
                    value={orderQueryId}
                    onChange={(e) => setOrderQueryId(e.target.value)}
                    className="w-36 sm:w-44 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500"
                  />
                )}
              </div>

              {profile?.company_name && (
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  Account: <strong className="text-slate-700">{profile.company_name}</strong>
                </span>
              )}
            </div>

            {/* Send Form with touch-friendly dimensions */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your order status, delivery, 10% escrow..."
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="h-10 sm:h-12 px-3.5 sm:px-6 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm shadow-md shadow-brand-500/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">Send</span>
                <span className="text-sm sm:text-base">➔</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Contact Channels & Escalation Card (4 Cols on desktop, full width on mobile) */}
        <div className="lg:col-span-4 w-full max-w-full space-y-4 sm:space-y-5">
          
          {/* Quick Hotline Card */}
          <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800 space-y-3.5 sm:space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-300 bg-white/10 px-2 py-0.5 rounded">
                Direct Human Support
              </span>
              <h3 className="text-base sm:text-lg font-black mt-2 text-white">Need Immediate Help?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Connect directly with our senior procurement &amp; escrow officers via WhatsApp or phone.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="https://wa.me/918408841998?text=Hello%20B2B%20India%20Support%2C%20I%20have%20an%20inquiry%20regarding%20my%20order%20and%2010%25%20escrow%20payment."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-base">💬</span>
                <span>WhatsApp Live (+91 84088 41998)</span>
              </a>

              <a
                href="tel:+918408841998"
                className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl text-xs font-extrabold border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-base">📞</span>
                <span>Call Helpline (+91 84088 41998)</span>
              </a>

              <a
                href="mailto:b2bbharat.in@gmail.com"
                className="w-full py-2.5 px-3.5 sm:px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>✉️</span>
                <span className="truncate">Email: b2bbharat.in@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Self-Service & Links Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              ⚡ Quick Self-Service Links
            </h4>
            
            <div className="space-y-2 text-xs">
              <Link
                href="/orders"
                className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors group font-bold text-slate-800"
              >
                <div className="flex items-center gap-2 truncate">
                  <span>📦</span>
                  <span className="truncate">My Orders &amp; Booking Receipts</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0">➔</span>
              </Link>

              <Link
                href="/directory"
                className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors group font-bold text-slate-800"
              >
                <div className="flex items-center gap-2 truncate">
                  <span>🌾</span>
                  <span className="truncate">Commodity Directory &amp; RFQs</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0">➔</span>
              </Link>

              <Link
                href="/terms"
                className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors group font-bold text-slate-800"
              >
                <div className="flex items-center gap-2 truncate">
                  <span>🔒</span>
                  <span className="truncate">Escrow Terms &amp; Security</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0">➔</span>
              </Link>
            </div>
          </div>

          {/* Corporate Registered Info */}
          <div className="p-3.5 sm:p-4 bg-slate-100/80 rounded-xl sm:rounded-2xl border border-slate-200 text-[10px] sm:text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>🏢</span>
              <span>Aaudumbar Agro Pvt. Ltd.</span>
            </div>
            <div><strong>GSTIN:</strong> 27ABACA6256A1Z2</div>
            <div className="leading-snug"><strong>Head Office:</strong> Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra</div>
          </div>

        </div>

      </div>

    </div>
  );
}
