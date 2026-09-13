"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTION_CHIPS = [
  { label: "🔒 10% Escrow Protection", query: "How does the 10% advance escrow payment protect my purchase?" },
  { label: "📬 Order Receipt & Spam Notice", query: "Where will I receive my 10% payment receipt and why should I check spam?" },
  { label: "🚚 Direct Delivery Hauling", query: "What is the timeline and process for direct warehouse delivery?" },
  { label: "🏢 Self Godown Pickup & Aadhar", query: "What are the visitor requirements and Aadhar details for Self Godown Pickup?" },
  { label: "🌾 Basmati Rice Quotations", query: "How can I get an official quotation for bulk Basmati Rice?" },
  { label: "📞 Connect to Human Agent", query: "I would like to speak directly with an Aaudumbar Agro customer support officer." }
];

export default function SupportChatPanel({ isDashboard = false }) {
  const [messages, setMessages] = useState([
    {
      id: "init-1",
      role: "model",
      text: `### Namaste! Welcome to B2B India Enterprise Support Desk 🇮🇳\n\nI am your **IndiaAI Support Assistant**, backed by **Aaudumbar Agro Pvt. Ltd.**\n\nHow can I help you today?\n- **10% Escrow Advance & Payment Security**\n- **Order Booking Receipts & Tracking**\n- **Delivery & Self Godown Gate Passes**\n- **Commodity Sourcing & Quotations**\n\nSelect a quick topic below or type your question in English or Hindi!`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [orderQueryId, setOrderQueryId] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isSpeakingId, setIsSpeakingId] = useState(null);

  const chatContainerRef = useRef(null);

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
      // Build conversation history for context
      const conversationPayload = messages.concat(userMessage).map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        text: m.text
      }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationPayload,
          orderId: orderQueryId.trim() || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const botReply = {
          id: `bot-${Date.now()}`,
          role: "model",
          text: data.reply,
          model: data.model || 'Gemini 3.6 Flash',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botReply]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Support message error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `We are currently experiencing high network demand. You can reach our dedicated human support desk directly:\n\n- 📞 **Helpline:** [+91 84088 41998](tel:+918408841998)\n- 💬 **WhatsApp Support:** [+91 84088 41998](https://wa.me/918408841998)\n- ✉️ **Email:** [b2bbharat.in@gmail.com](mailto:b2bbharat.in@gmail.com)`,
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
    // Strip markdown formatting for voice
    const cleanText = text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Simple Markdown Renderer
  const renderMarkdown = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="font-extrabold text-sm text-slate-900 mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-xs sm:text-sm my-0.5">
            {formatBoldAndLinks(line.replace('- ', ''))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-700 text-xs sm:text-sm my-0.5">
            {formatBoldAndLinks(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="text-slate-700 text-xs sm:text-sm leading-relaxed my-0.5">{formatBoldAndLinks(line)}</p>;
    });
  };

  const formatBoldAndLinks = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
      }
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-600 underline hover:text-brand-800">
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Banner Alert regarding Spam Folder */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-300 rounded-2xl sm:rounded-3xl shadow-sm text-xs text-amber-950 flex items-start gap-3"
      >
        <span className="text-xl flex-shrink-0">📬</span>
        <div className="flex-1 leading-relaxed">
          <strong className="text-amber-900 font-extrabold text-xs sm:text-sm">Email Receipt & Spam Box Help: </strong>
          All 10% Advance Receipts and gate passes are dispatched from <code className="bg-amber-100 font-mono font-bold px-1.5 py-0.5 rounded text-amber-900">b2bbharat.in@gmail.com</code>. 
          If you don&apos;t see our email in your inbox, please check your <strong>Spam / Promotions tab</strong> and mark as <strong>&quot;Not Spam&quot;</strong>. You can also view or resend receipts directly on <Link href="/orders" className="font-bold underline text-amber-900 hover:text-amber-950">My Orders</Link>.
        </div>
      </motion.div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Chat Terminal Container (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[650px] sm:h-[700px]">
          
          {/* Chat Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-500 flex items-center justify-center text-xl shadow-md shadow-brand-500/30">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">IndiaAI Support Assistant</h2>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
                  <span className="text-emerald-400 font-bold">● Support Assistant Active</span>
                  <span>•</span>
                  <span>Verified 24/7 Engine</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setMessages([messages[0]])}
                className="px-2.5 py-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                title="Clear conversation"
              >
                🔄 Reset Chat
              </button>
            </div>
          </div>

          {/* Quick Filter Chips Header */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-slate-400 font-bold whitespace-nowrap text-[10px] uppercase">Quick Topics:</span>
            {SUGGESTION_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(chip.query)}
                className="px-3 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-full border border-slate-200 text-xs font-semibold whitespace-nowrap transition-all shadow-2xs hover:border-brand-300"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-900 text-white border border-slate-700'
                  }`}>
                    {isUser ? '👤' : '🤖'}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs sm:text-sm shadow-sm relative group ${
                    isUser
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {isUser ? (
                      <p className="leading-relaxed font-medium">{msg.text}</p>
                    ) : (
                      <div className="space-y-1">
                        {renderMarkdown(msg.text)}
                      </div>
                    )}

                    {/* Metadata & Actions */}
                    <div className={`flex items-center justify-between gap-3 mt-2 pt-1 border-t text-[10px] ${
                      isUser ? 'border-white/20 text-white/70' : 'border-slate-100 text-slate-400'
                    }`}>
                      <span>{msg.time}</span>

                      {!isUser && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="hover:text-slate-700 font-bold transition-colors"
                            title="Copy reply text"
                          >
                            {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => handleSpeak(msg.text, msg.id)}
                            className="hover:text-slate-700 font-bold transition-colors"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm">
                  🤖
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Support Assistant typing...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat Input Box */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-100 space-y-2">
            
            {/* Optional Order context input */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold text-[11px] whitespace-nowrap">Order Context (Optional):</span>
              <input
                type="text"
                placeholder="e.g. TXN-IND-994120"
                value={orderQueryId}
                onChange={(e) => setOrderQueryId(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 w-44"
              />
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about 10% escrow, delivery schedule, godown Aadhar pass, or receipt..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="px-5 sm:px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-md shadow-brand-500/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Send</span>
                <span>➔</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Contact Channels & Escalation Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Quick Hotline Card */}
          <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-300 bg-white/10 px-2 py-0.5 rounded">
                Direct Human Support
              </span>
              <h3 className="text-lg font-black mt-2 text-white">Need Urgent Assistance?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Connect with our senior procurement & escrow officers immediately via phone or WhatsApp.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href="https://wa.me/918408841998?text=Hello%20B2B%20India%20Support%2C%20I%20have%20an%20inquiry%20regarding%20my%20order%20and%2010%25%20escrow%20payment."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-base">💬</span>
                <span>Chat on WhatsApp Live (+91 84088 41998)</span>
              </a>

              <a
                href="tel:+918408841998"
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-extrabold border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-base">📞</span>
                <span>Call Helpline (+91 84088 41998)</span>
              </a>

              <a
                href="mailto:b2bbharat.in@gmail.com"
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>✉️</span>
                <span>Email: b2bbharat.in@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Self-Service & Links Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              ⚡ Quick Self-Service Links
            </h4>
            
            <div className="space-y-2 text-xs">
              <Link
                href="/orders"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors group font-bold text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>My Orders & Booking Receipts</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                href="/directory"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors group font-bold text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span>🌾</span>
                  <span>Commodity Directory & RFQ</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                href="/terms"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors group font-bold text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Escrow Terms & Protection Policy</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>
            </div>
          </div>

          {/* Corporate Registered Info */}
          <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>🏢</span>
              <span>Aaudumbar Agro Pvt. Ltd.</span>
            </div>
            <div><strong>GSTIN:</strong> 27ABACA6256A1Z2</div>
            <div><strong>Registered Office:</strong> Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra</div>
          </div>

        </div>

      </div>

    </div>
  );
}
