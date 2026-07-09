"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportTerminal() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "system", text: "Welcome to B2B Bharat Verified Support Network. System agents are online." }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: userText }]);
    setInputMessage("");
    setIsProcessing(true);

    try {
      const response = await fetch('/api/support/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, userId: "mock-user-uuid" })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: "system", 
          text: result.analysisSummary.automatedReply 
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "system", text: "Connection error. Operational failover applied." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white p-4 md:p-8 pt-24 flex items-center justify-center">
      <div className="w-full max-w-4xl h-[75vh] bg-slate-900/40 border border-slate-800/80 rounded-3xl backdrop-blur-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">Gemini Autonomous Triage Node</h2>
          </div>
          <span className="text-xs font-mono text-slate-500">Secure TLS Tunnel Enabled</span>
        </div>

        {/* Messaging Stream Window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white shadow-lg rounded-tr-none' 
                    : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="text-xs font-mono text-indigo-400 animate-pulse">Agent parsing contract vectors...</div>
          )}
        </div>

        {/* Input Interface Block */}
        <form onSubmit={sendMessage} className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type corporate dispute query or request logistics routing update..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Transmit
          </button>
        </form>
      </div>
    </div>
  );
}
