"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function AdminWhatsAppBroadcastPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'outdated' | 'updated' | 'real_only' | 'in_broadcast' | 'new_pending'
  const [selectedTemplate, setSelectedTemplate] = useState('universal_broadcast');
  const [customMessage, setCustomMessage] = useState('');
  const [sentMap, setSentMap] = useState({}); // { [supplierId]: timestamp }
  const [previewSupplierId, setPreviewSupplierId] = useState(null);

  // WhatsApp Broadcast List state
  const [broadcastMembers, setBroadcastMembers] = useState([]); // Array of supplier IDs in the broadcast list
  const [isNewMembersModalOpen, setIsNewMembersModalOpen] = useState(false);
  const [isBroadcastInfoModalOpen, setIsBroadcastInfoModalOpen] = useState(false);
  const [isAutoPilotModalOpen, setIsAutoPilotModalOpen] = useState(false);
  const [copiedAutoPilotScript, setCopiedAutoPilotScript] = useState(false);
  const [copiedBroadcastMsg, setCopiedBroadcastMsg] = useState(false);
  const [copiedNumbersFeedback, setCopiedNumbersFeedback] = useState(false);
  const [selectedNewMemberIds, setSelectedNewMemberIds] = useState([]);

  // Gemini AI Studio state
  const [aiGoal, setAiGoal] = useState('price_reminder');
  const [aiLanguage, setAiLanguage] = useState('english');
  const [aiTone, setAiTone] = useState('professional');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [showAiKeyModal, setShowAiKeyModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Quick Test Sandbox state
  const [testPhone, setTestPhone] = useState('9226497450');
  const [testCompanyName, setTestCompanyName] = useState('Demo Agro Foods');
  const [testCopied, setTestCopied] = useState(false);

  // Edit Phone Modal state
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);

  // Bulk Convert State
  const [convertingDummy, setConvertingDummy] = useState(false);
  const [convertFeedback, setConvertFeedback] = useState(null);

  // Pre-configured templates
  const TEMPLATES = {
    'universal_broadcast': {
      title: '📢 Universal Broadcast (Same for All Suppliers)',
      description: 'One standard message for all suppliers. Perfect for WhatsApp Broadcast Lists & Groups (no placeholders required).',
      badge: 'Unified Broadcast',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      isUniversal: true,
      text: `🌾 *Namaste Valued Suppliers & Wholesale Partners!* 🌾

Greetings from *B2B India Marketplace (Aaudumbar Agro Pvt. Ltd.)*!

This is our monthly reminder for all registered wholesale suppliers to review and update your wholesale commodity and product prices on the portal.

📌 *Why keeping your rates updated is essential:*
• Verified bulk buyers across India receive real-time accurate rates.
• Updated catalogs rank at the top of buyer inquiries & RFQs.
• Immediate purchase order confirmations without price renegotiation delays.

👉 *Click here to update your prices now:*
https://b2bindia.site/dashboard/products

*(If you have already updated your prices this week, thank you so much!)*

Need assistance or wish to list new bulk wholesale lots? Reply directly to this WhatsApp message or contact our trade desk.

Thank you for your valued partnership!
— *Team B2B India (Aaudumbar Agro Pvt. Ltd.)*`,
    },
    '1st_of_month': {
      title: '1st of Month: Price Update Reminder',
      description: 'Monthly reminder sent on the 1st to request updated wholesale commodity rates.',
      badge: '1st of Month',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      text: `Namaste {{company_name}}! 🌾

Greetings from B2B India! It's the beginning of the month — kindly review and update your wholesale commodity prices on your portal.

Keeping your prices updated ensures verified bulk buyers receive accurate rates and keeps your catalog at the top of buyer inquiries.

👉 Update your prices here: https://b2bindia.site/dashboard/products

Thank you for your partnership!
— Team B2B India (Aaudumbar Agro Pvt. Ltd.)`,
    },
    '5th_of_month': {
      title: '5th of Month: Urgent Price Check',
      description: 'Follow-up for suppliers who have not yet refreshed their rates this month.',
      badge: '5th of Month',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      text: `Namaste {{company_name}}! 🌾

This is a gentle follow-up from B2B India.

We noticed your wholesale product prices haven't been updated yet for this month. Please update your rates today so your catalog remains active and highlighted for incoming Request for Quotations (RFQs).

👉 Update your prices now: https://b2bindia.site/dashboard/products

(If you have already updated your prices recently, thank you so much!)
— Team B2B India (Aaudumbar Agro Pvt. Ltd.)`,
    },
    custom: {
      title: '✨ Gemini AI & Custom Broadcast',
      description: 'Compose manually or generate dynamically with Google Gemini AI for customized wholesale campaigns.',
      badge: '✨ Gemini AI',
      badgeColor: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30',
      text: customMessage || `🌾 *Namaste Wholesale Partners & Suppliers!* 🌾\n\nImportant trade announcement from B2B India:\n\n[Write your custom message or click 'Generate with Gemini AI']\n\nAccess your supplier dashboard: https://b2bindia.site/dashboard/products\n— Team B2B India (Aaudumbar Agro Pvt. Ltd.)`,
    },
  };

  // Fetch suppliers list and saved states
  useEffect(() => {
    fetchSuppliers();
    try {
      const savedSent = sessionStorage.getItem('b2b_whatsapp_sent_session');
      if (savedSent) setSentMap(JSON.parse(savedSent));
    } catch {}
    try {
      const savedBroadcast = localStorage.getItem('b2b_whatsapp_broadcast_members');
      if (savedBroadcast) {
        setBroadcastMembers(JSON.parse(savedBroadcast));
      }
    } catch {}
    try {
      const savedKey = localStorage.getItem('b2b_gemini_api_key');
      if (savedKey) setAiApiKey(savedKey);
    } catch {}
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/suppliers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch suppliers');
      setSuppliers(data.suppliers || []);
      if (data.suppliers?.length > 0) {
        setPreviewSupplierId(data.suppliers[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save broadcast members to localStorage
  const saveBroadcastMembers = (newMembersList) => {
    setBroadcastMembers(newMembersList);
    try {
      localStorage.setItem('b2b_whatsapp_broadcast_members', JSON.stringify(newMembersList));
    } catch {}
  };

  const markAsAddedToBroadcast = (supplierIds) => {
    const idsToAdd = Array.isArray(supplierIds) ? supplierIds : [supplierIds];
    const currentSet = new Set(broadcastMembers);
    idsToAdd.forEach((id) => currentSet.add(id));
    const updated = Array.from(currentSet);
    saveBroadcastMembers(updated);
  };

  const removeFromBroadcast = (supplierId) => {
    const updated = broadcastMembers.filter((id) => id !== supplierId);
    saveBroadcastMembers(updated);
  };

  // Generate and download .vcf contact card for immediate phone sync
  const generateAndDownloadVCF = (targetSuppliers, filename = 'B2B_Suppliers_Contacts.vcf') => {
    if (!targetSuppliers || targetSuppliers.length === 0) {
      alert('No suppliers with valid phone numbers to export.');
      return;
    }
    let vcfContent = '';
    targetSuppliers.forEach((s) => {
      const name = (s.company_name || s.contact_name || 'B2B Supplier').replace(/[;,\n]/g, ' ');
      const cleanDigits = String(s.phone || '').replace(/\D/g, '');
      const finalPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
      vcfContent += `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:B2B - ${name}\r\nORG:${name}\r\nTEL;TYPE=CELL:${finalPhone}\r\nEND:VCARD\r\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy candidate phone numbers
  const handleCopyNewNumbers = (candidates) => {
    if (!candidates || candidates.length === 0) return;
    const numbers = candidates.map((c) => (c.phone?.startsWith('91') ? `+${c.phone}` : `+91${c.phone}`)).join(', ');
    navigator.clipboard.writeText(numbers);
    setCopiedNumbersFeedback(true);
    setTimeout(() => setCopiedNumbersFeedback(false), 2500);
  };

  // Open WhatsApp Web and Add Members
  const handleOpenWhatsAppAndAddMembers = (membersToAdd) => {
    const list = membersToAdd && membersToAdd.length > 0 ? membersToAdd : newBroadcastCandidates;
    if (list.length === 0) {
      alert('No new members to add.');
      return;
    }
    // Copy universal broadcast text
    const universalText = TEMPLATES.universal_broadcast.text;
    navigator.clipboard.writeText(universalText);
    setCopiedBroadcastMsg(true);
    setTimeout(() => setCopiedBroadcastMsg(false), 3000);

    // Mark as added
    const ids = list.map((s) => s.id);
    markAsAddedToBroadcast(ids);

    // Open WhatsApp Web in desktop view
    openWhatsAppWebHome();
  };

  const openNewMembersModal = () => {
    setSelectedNewMemberIds(newBroadcastCandidates.map((s) => s.id));
    setIsNewMembersModalOpen(true);
  };

  // Save or clear Gemini API key
  const handleSaveGeminiKey = (key) => {
    const cleanKey = (key || '').trim();
    setAiApiKey(cleanKey);
    try {
      if (cleanKey) {
        localStorage.setItem('b2b_gemini_api_key', cleanKey);
      } else {
        localStorage.removeItem('b2b_gemini_api_key');
      }
    } catch {}
    setShowAiKeyModal(false);
  };

  // Generate broadcast via Gemini AI API
  const handleGenerateAiBroadcast = async () => {
    setAiGenerating(true);
    setAiError(null);
    setAiGeneratedResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: aiGoal,
          language: aiLanguage,
          tone: aiTone,
          customPrompt: aiCustomPrompt,
          apiKey: aiApiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate broadcast message');
      
      setAiGeneratedResult(data);
      if (data.message) {
        setCustomMessage(data.message);
        setSelectedTemplate('custom');
      }
    } catch (err) {
      console.error('Gemini AI generation error:', err);
      setAiError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Generate self-contained WhatsApp Web Auto-Pilot script for automated broadcasting
  const generateWhatsAppAutoPilotScript = () => {
    const list = suppliers.filter((s) => s.has_valid_whatsapp && !s.is_dummy);
    const text = selectedTemplate === 'custom' ? customMessage || TEMPLATES.custom.text : TEMPLATES[selectedTemplate].text;
    
    return `// == B2B INDIA WHATSAPP WEB AUTO-BROADCASTER ==
// 1. Open https://web.whatsapp.com in Chrome
// 2. Press F12 -> Click "Console" tab
// 3. Paste this code and press Enter
(function runB2BBroadcast() {
  const contacts = ${JSON.stringify(list.map(s => ({ id: s.id, name: s.company_name || s.contact_name, phone: s.phone })))};
  const rawMessage = ${JSON.stringify(text)};
  
  if (!contacts.length) {
    alert("No verified suppliers found to broadcast to!");
    return;
  }
  
  let currentIndex = 0;
  let isPaused = false;
  
  const existing = document.getElementById("b2b-whatsapp-autopilot");
  if (existing) existing.remove();
  
  const bar = document.createElement("div");
  bar.id = "b2b-whatsapp-autopilot";
  bar.style = "position:fixed;top:24px;right:24px;z-index:9999999;background:#090d16;color:#f8fafc;padding:18px 22px;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);border:2px solid #10b981;font-family:sans-serif;min-width:340px;backdrop-filter:blur(12px);";
  bar.innerHTML = \`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;">🤖</span>
        <strong style="color:#34d399;font-size:14px;">B2B India Auto-Pilot</strong>
      </div>
      <button id="b2b-close-btn" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;font-weight:bold;">✕</button>
    </div>
    <div id="b2b-status" style="font-size:12px;color:#cbd5e1;margin-bottom:10px;line-height:1.4;">Ready to broadcast to \${contacts.length} verified suppliers...</div>
    <div style="background:#1e293b;border-radius:10px;height:8px;overflow:hidden;margin-bottom:14px;">
      <div id="b2b-progress" style="background:linear-gradient(90deg,#10b981,#059669);height:100%;width:0%;transition:width 0.3s;"></div>
    </div>
    <div style="display:flex;gap:8px;">
      <button id="b2b-start-btn" style="flex:1;background:#10b981;color:#022c22;font-weight:800;border:none;padding:10px 14px;border-radius:12px;cursor:pointer;font-size:12px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">▶ Start Auto-Pilot</button>
      <button id="b2b-pause-btn" style="background:#334155;color:#fff;border:none;padding:10px 14px;border-radius:12px;cursor:pointer;font-size:12px;display:none;">⏸ Pause</button>
    </div>
  \`;
  document.body.appendChild(bar);
  
  const statusEl = document.getElementById("b2b-status");
  const progEl = document.getElementById("b2b-progress");
  const startBtn = document.getElementById("b2b-start-btn");
  const pauseBtn = document.getElementById("b2b-pause-btn");
  
  document.getElementById("b2b-close-btn").onclick = () => bar.remove();
  
  function sendNext() {
    if (isPaused || currentIndex >= contacts.length) {
      if (currentIndex >= contacts.length) {
        statusEl.innerHTML = "🎉 <b style='color:#34d399'>Broadcast Complete!</b> Dispatched to all " + contacts.length + " suppliers.";
        progEl.style.width = "100%";
        startBtn.style.display = "none";
        pauseBtn.style.display = "none";
      }
      return;
    }
    
    const target = contacts[currentIndex];
    const pct = Math.round(((currentIndex + 1) / contacts.length) * 100);
    progEl.style.width = pct + "%";
    statusEl.innerHTML = \`Broadcasting (\${currentIndex + 1}/\${contacts.length}): <b>\${target.name}</b> (+91 \${target.phone.slice(-10)})...\`;
    
    const personalized = rawMessage.replace(/{{company_name}}/g, target.name);
    const cleanPhone = target.phone.replace(/\\D/g, "");
    
    window.location.href = "https://web.whatsapp.com/send?phone=" + cleanPhone + "&text=" + encodeURIComponent(personalized);
    
    setTimeout(() => {
      const sendBtn = document.querySelector('button[aria-label="Send"], span[data-icon="send"]');
      if (sendBtn) {
        sendBtn.closest("button")?.click();
      }
      currentIndex++;
      setTimeout(sendNext, 4500);
    }, 4000);
  }
  
  startBtn.onclick = () => {
    startBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
    isPaused = false;
    sendNext();
  };
  
  pauseBtn.onclick = () => {
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? "▶ Resume" : "⏸ Pause";
    if (!isPaused) sendNext();
  };
})();
`;
  };

  // Compile message
  const getCompiledMessage = (templateKey, supplier) => {
    const tpl = TEMPLATES[templateKey] || TEMPLATES['universal_broadcast'];
    const baseText = templateKey === 'custom' ? customMessage || TEMPLATES.custom.text : tpl.text;
    if (tpl.isUniversal || !supplier) {
      return baseText;
    }
    return baseText
      .replace(/{{company_name}}/g, supplier.company_name || 'Partner')
      .replace(/{{contact_name}}/g, supplier.contact_name || 'Partner')
      .replace(/{{phone}}/g, supplier.phone || '')
      .replace(/{{location}}/g, supplier.location || 'India')
      .replace(/{{portal_url}}/g, 'https://b2bindia.site/dashboard/products');
  };

  // Mark supplier as sent
  const markAsSent = (supplierId) => {
    const updated = { ...sentMap, [supplierId]: new Date().toISOString() };
    setSentMap(updated);
    try {
      sessionStorage.setItem('b2b_whatsapp_sent_session', JSON.stringify(updated));
    } catch {}
  };

  // Build WhatsApp URL helpers
  const getWhatsAppWebUrl = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppAppUrl = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppWindowsAppUrl = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `whatsapp://send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
  };

  // Open WhatsApp Web in a dedicated Desktop Popout Window (forces width >= 1120px to prevent /mobile/ redirect)
  const openDesktopWhatsAppWeb = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const webUrl = `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
    const width = 1120;
    const height = 850;
    const left = Math.max(0, (window.screen.availWidth - width) / 2);
    const top = Math.max(0, (window.screen.availHeight - height) / 2);
    window.open(webUrl, 'WhatsAppWebDesktop', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  };

  // Open WhatsApp Web Home (1120px desktop view)
  const openWhatsAppWebHome = () => {
    const width = 1120;
    const height = 850;
    const left = Math.max(0, (window.screen.availWidth - width) / 2);
    const top = Math.max(0, (window.screen.availHeight - height) / 2);
    window.open('https://web.whatsapp.com', 'WhatsAppWebMain', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  };

  // Dispatch via Server API (Twilio / Mock)
  const [serverDispatching, setServerDispatching] = useState(false);
  const [serverDispatchResult, setServerDispatchResult] = useState(null);

  const handleServerDispatch = async (phone, message, companyName) => {
    setServerDispatching(true);
    setServerDispatchResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_single',
          toPhone: phone,
          messageBody: message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server dispatch failed');
      setServerDispatchResult(data);
    } catch (err) {
      alert(`Server Dispatch Notice: ${err.message}`);
    } finally {
      setServerDispatching(false);
    }
  };

  // Bulk "Send to All" Modal & Execution State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAudience, setBulkAudience] = useState('outdated'); // 'outdated' | 'all' | 'filtered'
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentSupplier: '' });
  const [bulkResult, setBulkResult] = useState(null);

  // Execute Bulk Dispatch: Sends message to all selected suppliers
  const handleExecuteSendAll = async () => {
    let targetList = [];
    if (bulkAudience === 'outdated') {
      targetList = suppliers.filter((s) => !s.has_updated_this_month && s.has_valid_whatsapp);
    } else if (bulkAudience === 'all') {
      targetList = suppliers.filter((s) => s.has_valid_whatsapp);
    } else {
      targetList = filteredSuppliers.filter((s) => s.has_valid_whatsapp);
    }

    if (targetList.length === 0) {
      alert('No suppliers with valid WhatsApp numbers found in this audience. You can set real numbers or use the batch convert tool first.');
      return;
    }

    setBulkSending(true);
    setBulkResult(null);
    setBulkProgress({ current: 0, total: targetList.length, currentSupplier: targetList[0].company_name });

    try {
      const templateText = selectedTemplate === 'custom' ? customMessage || TEMPLATES.custom.text : TEMPLATES[selectedTemplate].text;
      
      const res = await fetch('/api/admin/whatsapp/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_bulk',
          suppliers: targetList,
          messageTemplate: templateText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk broadcast failed');

      // Update sent session map for all successful deliveries
      const updatedSent = { ...sentMap };
      const nowISO = new Date().toISOString();
      (data.details || []).forEach((item) => {
        if (item.success && item.supplierId) {
          updatedSent[item.supplierId] = nowISO;
        }
      });
      setSentMap(updatedSent);
      try {
        sessionStorage.setItem('b2b_whatsapp_sent_session', JSON.stringify(updatedSent));
      } catch {}

      setBulkResult(data);
    } catch (err) {
      alert(`Bulk Dispatch Notice: ${err.message}`);
    } finally {
      setBulkSending(false);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = (text, label = 'Message') => {
    navigator.clipboard.writeText(text);
    setTestCopied(true);
    setTimeout(() => setTestCopied(false), 2500);
  };

  // Save single supplier phone edit
  const handleSavePhone = async () => {
    if (!editingSupplier || !editPhoneValue.trim()) return;
    setUpdatingPhone(true);
    try {
      const res = await fetch('/api/admin/whatsapp/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_single',
          supplierId: editingSupplier.id,
          newPhone: editPhoneValue.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update phone');
      await fetchSuppliers();
      setEditingSupplier(null);
      setEditPhoneValue('');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingPhone(false);
    }
  };

  // Replace dummy suppliers with test phone
  const handleReplaceAllDummy = async () => {
    const confirmMsg = `This will update all demo/dummy placeholder suppliers (9999999999) to your test phone (+91 ${testPhone}) so you can test sending to any of them.\n\nProceed?`;
    if (!confirm(confirmMsg)) return;

    setConvertingDummy(true);
    setConvertFeedback(null);
    try {
      const res = await fetch('/api/admin/whatsapp/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'replace_dummy_with_test',
          testPhone: testPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert numbers');
      setConvertFeedback(`✓ Successfully updated ${data.updated_count} demo suppliers to +91 ${testPhone}`);
      await fetchSuppliers();
    } catch (err) {
      alert(err.message);
    } finally {
      setConvertingDummy(false);
    }
  };

  // New members not yet added to WhatsApp broadcast
  const newBroadcastCandidates = useMemo(() => {
    const broadcastSet = new Set(broadcastMembers);
    return suppliers.filter((s) => !broadcastSet.has(s.id) && s.has_valid_whatsapp);
  }, [suppliers, broadcastMembers]);

  const existingBroadcastMembers = useMemo(() => {
    const broadcastSet = new Set(broadcastMembers);
    return suppliers.filter((s) => broadcastSet.has(s.id));
  }, [suppliers, broadcastMembers]);

  // Filter & Search Suppliers
  const filteredSuppliers = useMemo(() => {
    const broadcastSet = new Set(broadcastMembers);
    return suppliers.filter((s) => {
      if (activeFilter === 'outdated' && s.has_updated_this_month) return false;
      if (activeFilter === 'updated' && !s.has_updated_this_month) return false;
      if (activeFilter === 'real_only' && (s.is_dummy || !s.has_valid_whatsapp)) return false;
      if (activeFilter === 'in_broadcast' && !broadcastSet.has(s.id)) return false;
      if (activeFilter === 'new_pending' && (broadcastSet.has(s.id) || !s.has_valid_whatsapp)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.company_name?.toLowerCase().includes(q);
        const matchContact = s.contact_name?.toLowerCase().includes(q);
        const matchPhone = s.phone?.includes(q) || s.raw_phone?.includes(q);
        const matchLoc = s.location?.toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchPhone && !matchLoc) return false;
      }
      return true;
    });
  }, [suppliers, activeFilter, searchQuery, broadcastMembers]);

  // Next unsent supplier in queue
  const nextUnsentSupplier = useMemo(() => {
    return filteredSuppliers.find((s) => !sentMap[s.id] && s.has_valid_whatsapp);
  }, [filteredSuppliers, sentMap]);

  // Preview Supplier
  const previewSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === previewSupplierId) || suppliers[0] || {
      company_name: testCompanyName || 'Aaudumbar Agro Pvt Ltd',
      contact_name: 'Raghavendra',
      phone: testPhone || '919226497450',
      location: 'Maharashtra, India',
    };
  }, [suppliers, previewSupplierId, testCompanyName, testPhone]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const realPhones = suppliers.filter((s) => s.has_valid_whatsapp && !s.is_dummy).length;
    const dummyPhones = suppliers.filter((s) => s.is_dummy).length;
    const outdated = suppliers.filter((s) => !s.has_updated_this_month).length;
    const updated = suppliers.filter((s) => s.has_updated_this_month).length;
    const sentCount = Object.keys(sentMap).length;
    const inBroadcast = existingBroadcastMembers.length;
    const pendingBroadcast = newBroadcastCandidates.length;
    return { total, realPhones, dummyPhones, outdated, updated, sentCount, inBroadcast, pendingBroadcast };
  }, [suppliers, sentMap, existingBroadcastMembers, newBroadcastCandidates]);

  // Compiled text for the Test Sandbox
  const testMessageText = useMemo(() => {
    const mockSupplier = {
      company_name: testCompanyName || 'Your Enterprise Partner',
      contact_name: 'Partner',
      phone: testPhone,
      location: 'India',
    };
    return getCompiledMessage(selectedTemplate, mockSupplier);
  }, [selectedTemplate, customMessage, testCompanyName, testPhone]);

  return (
    <div className="min-h-full w-full bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      {/* Top Breadcrumb & Return to Admin */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-emerald-400">Admin</Link>
          <span>/</span>
          <span className="text-white font-medium">WhatsApp Broadcast Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/emails"
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 flex items-center gap-1.5 font-semibold"
          >
            <span>📧</span>
            <span>Email Broadcast Hub (1st &amp; 5th)</span>
          </Link>
          <Link
            href="/admin/users"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5"
          >
            👥 Manage Users &amp; Roles
          </Link>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <WhatsAppLogoIcon className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                WhatsApp Supplier Broadcast Hub
                <span className="text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Zero Cost • Direct
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Dispatch monthly price update reminders (1st &amp; 5th of month) and custom announcements directly into WhatsApp Web or mobile app.
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons: Add New Members, Send to All & Send Next */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary User Action: Add New Members to Broadcast */}
          <button
            type="button"
            onClick={openNewMembersModal}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
              stats.pendingBroadcast > 0
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/60'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="View new registered suppliers and add them to your WhatsApp Broadcast List"
          >
            <span className="text-sm">➕</span>
            <span>Add New Members</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              stats.pendingBroadcast > 0 ? 'bg-black/40 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
            }`}>
              {stats.pendingBroadcast}
            </span>
          </button>

          {/* Send to All Button */}
          <button
            type="button"
            onClick={() => {
              setBulkAudience('outdated');
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs rounded-xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Broadcast reminder to all suppliers simultaneously"
          >
            <span className="text-sm">🚀</span>
            <span>Send to All Suppliers</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
              {stats.outdated} Pending
            </span>
          </button>

          {/* 🤖 WhatsApp Web Auto-Pilot Button */}
          <button
            type="button"
            onClick={() => setIsAutoPilotModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-purple-600/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Auto-run broadcast directly inside WhatsApp Web without manual clicking"
          >
            <span className="text-sm">🤖</span>
            <span>WhatsApp Web Auto-Pilot</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-purple-200">
              Auto-Bot
            </span>
          </button>

          {/* Quick Launch Next Supplier in Queue */}
          {nextUnsentSupplier && (
            <button
              type="button"
              onClick={() => {
                openDesktopWhatsAppWeb(
                  nextUnsentSupplier.phone,
                  getCompiledMessage(selectedTemplate, nextUnsentSupplier)
                );
                markAsSent(nextUnsentSupplier.id);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all transform active:scale-95 cursor-pointer"
            >
              <WhatsAppLogoIcon className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Next: {nextUnsentSupplier.company_name.slice(0, 14)}...</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Web ↗</span>
            </button>
          )}
        </div>
      </div>

      {/* 📢 OFFICIAL WHATSAPP BROADCAST COMMAND CENTER */}
      <div className="w-full p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-2xl relative overflow-visible">
        {/* Glowing background aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
              📢
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black tracking-tight text-white">
                  WhatsApp Broadcast List &amp; Community Hub
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Single Standard Message • 100% Free
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Send <strong>one identical reminder</strong> to all suppliers at once via WhatsApp Broadcast. When a new supplier registers, simply click <strong>&quot;Add New Members&quot;</strong> to open WhatsApp and include them.
              </p>
            </div>
          </div>

          {/* Broadcast Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">In Broadcast List</div>
              <div className="text-xl font-black text-emerald-400">{stats.inBroadcast}</div>
            </div>
            <div className={`px-4 py-2 rounded-2xl border text-center transition-all ${
              stats.pendingBroadcast > 0
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/30 animate-pulse'
                : 'bg-slate-950/80 border-slate-800 text-slate-400'
            }`}>
              <div className="text-[10px] uppercase font-bold">New Pending Members</div>
              <div className={`text-xl font-black ${stats.pendingBroadcast > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                {stats.pendingBroadcast}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Add New Members Button */}
            <button
              type="button"
              onClick={openNewMembersModal}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all transform active:scale-95 cursor-pointer shadow-xl ${
                stats.pendingBroadcast > 0
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'
              }`}
            >
              <span className="text-sm">➕</span>
              <span>Add New Members ({stats.pendingBroadcast} Waiting)</span>
              {stats.pendingBroadcast > 0 && (
                <span className="bg-black/30 text-white px-1.5 py-0.5 rounded text-[10px] font-mono">
                  Action Required
                </span>
              )}
            </button>

            {/* 2. Open WhatsApp Web */}
            <button
              type="button"
              onClick={openWhatsAppWebHome}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow"
              title="Open WhatsApp Web in full 1120px desktop view to manage your Broadcast List"
            >
              <WhatsAppLogoIcon className="w-4 h-4 fill-emerald-400" />
              <span>🌐 Open WhatsApp Web</span>
            </button>

            {/* 3. Copy Universal Message */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(TEMPLATES.universal_broadcast.text);
                setCopiedBroadcastMsg(true);
                setTimeout(() => setCopiedBroadcastMsg(false), 2500);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <span>{copiedBroadcastMsg ? '✓ Copied Message!' : '📋 Copy Universal Broadcast Message'}</span>
            </button>

            {/* 4. Export Contacts (.vcf) */}
            <button
              type="button"
              onClick={() => generateAndDownloadVCF(suppliers.filter((s) => s.has_valid_whatsapp), 'B2B_All_Suppliers_Contacts.vcf')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-semibold transition-all"
              title="Download all supplier contacts as a .vcf file to import into your phone contacts in 1 tap"
            >
              <span>📥 Export All Contacts (.vcf)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBroadcastInfoModalOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium flex items-center gap-1"
            >
              <span>ℹ️ How WhatsApp Broadcast works</span>
            </button>
            {stats.inBroadcast > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset Broadcast List tracking? This will mark all suppliers as new pending members again.')) {
                    saveBroadcastMembers([]);
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300 ml-2"
              >
                Reset Tracking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🧪 INSTANT TEST DISPATCH SANDBOX CARD */}
      <div className="w-full p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/30 shadow-2xl relative overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              🧪 Instant Test Sandbox: Verify WhatsApp Directly on Your Phone
            </h2>
          </div>
          <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ Desktop Popout (1120px) forces Desktop mode &amp; bypasses /mobile/ screen restriction
          </div>
        </div>

        {/* Split screen guidance banner */}
        <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-0.5">
            <span>ℹ️ Why did WhatsApp Web redirect to &quot;/mobile/&quot;?</span>
          </div>
          WhatsApp Web has a hardcoded screen requirement: if the window width is less than <strong>768px</strong> (such as when your browser is in split-screen mode on the right half of your monitor), WhatsApp Web redirects to <code>web.whatsapp.com/mobile/</code>.
          <div className="mt-1 font-medium text-white flex flex-wrap gap-2 items-center">
            <span>👉 <strong>Instant Solution:</strong> Click</span>
            <button
              type="button"
              onClick={() => openDesktopWhatsAppWeb(testPhone, testMessageText)}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow"
            >
              Desktop Popout (1120px) ↗
            </button>
            <span>below to force a full-width desktop window, or <strong>maximize your Chrome browser window</strong>!</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-center">
          {/* Phone Input */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Your Mobile / Test WhatsApp Number:
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus-within:border-emerald-500">
              <span className="text-slate-500 font-mono mr-2 font-bold">+91</span>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile (e.g. 9226497450)"
                className="bg-transparent text-white font-mono font-bold w-full outline-none placeholder-slate-600"
              />
            </div>
            <div className="flex gap-2 mt-1.5 text-[10px] text-slate-400">
              <span>Quick pick:</span>
              <button
                type="button"
                onClick={() => setTestPhone('9226497450')}
                className="text-emerald-400 hover:underline font-mono"
              >
                9226497450
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTestPhone('8408841998')}
                className="text-emerald-400 hover:underline font-mono"
              >
                8408841998 (Aaudumbar)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTestPhone('9405912371')}
                className="text-emerald-400 hover:underline font-mono"
              >
                9405912371
              </button>
            </div>
          </div>

          {/* Test Name Input */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Test Company Name:
            </label>
            <input
              type="text"
              value={testCompanyName}
              onChange={(e) => setTestCompanyName(e.target.value)}
              placeholder="e.g. Aaudumbar Agro"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white w-full outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Dispatch Buttons */}
          <div className="md:col-span-5 flex flex-wrap items-center gap-2 pt-2 md:pt-4">
            {/* Primary Desktop Popout (Recommended) */}
            <button
              type="button"
              onClick={() => openDesktopWhatsAppWeb(testPhone, testMessageText)}
              className="flex-1 min-w-[170px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all transform active:scale-95 text-center"
              title="Opens in an 1120px desktop popout window to bypass /mobile/ redirect"
            >
              <WhatsAppLogoIcon className="w-4 h-4 fill-current" />
              <span>🌐 Desktop Popout (1120px)</span>
            </button>

            {/* Windows Desktop App Protocol Link */}
            <a
              href={getWhatsAppWindowsAppUrl(testPhone, testMessageText)}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all text-center"
              title="Opens WhatsApp for Windows Desktop app directly"
            >
              <span>💻 PC App</span>
            </a>

            {/* Direct Server API Dispatch */}
            <button
              type="button"
              onClick={() => handleServerDispatch(testPhone, testMessageText, testCompanyName)}
              disabled={serverDispatching}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
              title="Dispatches directly via server (Twilio / API)"
            >
              <span>{serverDispatching ? 'Sending...' : '⚡ Server API'}</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={() => handleCopyMessage(testMessageText)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
            >
              {testCopied ? '✓ Copied!' : '📋 Copy Text'}
            </button>
          </div>
        </div>

        {serverDispatchResult && (
          <div className="mt-3 p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
            <span>
              {serverDispatchResult.twilioUsed
                ? `✓ Dispatched via Twilio WhatsApp API (Message SID: ${serverDispatchResult.messageId})`
                : `✓ Dispatched to server console logger for ${serverDispatchResult.recipient} (Configure Twilio in Platform Settings for automated delivery)`}
            </span>
            <button
              type="button"
              onClick={() => setServerDispatchResult(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Suppliers</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
            {stats.realPhones} real numbers
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            In Broadcast
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{stats.inBroadcast}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Active in WhatsApp list</div>
        </div>

        <div className={`bg-slate-900/90 rounded-2xl p-4 border transition-all ${
          stats.pendingBroadcast > 0 ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'
        }`}>
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full bg-amber-400 ${stats.pendingBroadcast > 0 ? 'animate-ping' : ''}`} />
            New to Add
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{stats.pendingBroadcast}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Pending WhatsApp sync</div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Outdated Rates
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{stats.outdated}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Pending 1st/5th update</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Sent Today</div>
          <div className="text-2xl font-black text-indigo-300 mt-1">{stats.sentCount}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5">Session dispatches</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <button
            onClick={() => {
              if (confirm('Clear session sent markers?')) {
                setSentMap({});
                sessionStorage.removeItem('b2b_whatsapp_sent_session');
              }
            }}
            className="text-xs text-slate-400 hover:text-white underline text-left"
          >
            Reset Sent Markers
          </button>
          <button
            onClick={fetchSuppliers}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold mt-1 text-left"
          >
            ↻ Refresh Suppliers
          </button>
        </div>
      </div>

      {/* Demo Numbers Quick Convert Callout */}
      {stats.dummyPhones > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚠️ Notice: {stats.dummyPhones} suppliers currently have dummy placeholder numbers (9999999999)</span>
            </div>
            <p className="text-slate-300 mt-0.5">
              WhatsApp shows &quot;Phone number invalid&quot; when messaging fake 9999999999 numbers. You can either edit individual suppliers or batch-convert them to your test phone.
            </p>
            {convertFeedback && (
              <div className="text-emerald-400 font-bold mt-1">{convertFeedback}</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleReplaceAllDummy}
            disabled={convertingDummy}
            className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow transition-all disabled:opacity-50"
          >
            {convertingDummy ? 'Updating in Database...' : `⚡ Convert All ${stats.dummyPhones} to +91 ${testPhone}`}
          </button>
        </div>
      )}

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Template Selection & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* ✨ GEMINI AI BROADCAST STUDIO CARD */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border-2 border-purple-500/40 rounded-2xl p-5 shadow-2xl relative overflow-visible">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-lg shadow-purple-500/25">
                  ✨
                </div>
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    Gemini AI Broadcast Studio
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Google AI
                    </span>
                  </h2>
                  <p className="text-[11px] text-purple-200/70">
                    Generate high-converting wholesale broadcasts tailored to your trading objectives.
                  </p>
                </div>
              </div>

              {/* API Key settings trigger */}
              <button
                type="button"
                onClick={() => setShowAiKeyModal(true)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                  aiApiKey
                    ? 'bg-purple-950/60 border-purple-400/50 text-purple-300 hover:bg-purple-900/60'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                title="Configure Google Gemini API Key"
              >
                <span>⚙️</span>
                <span>{aiApiKey ? 'Gemini Key Active' : 'API Key'}</span>
              </button>
            </div>

            {/* Campaign Objective Presets */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Campaign Objective:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'price_reminder', icon: '🌾', label: 'Monthly Price Update', desc: '1st of Month catalog refresh' },
                  { id: 'urgent_price_check', icon: '🚨', label: 'Urgent 5th Check', desc: 'Prevent quote suspension' },
                  { id: 'demand_inquiry', icon: '📦', label: 'Bulk Buyer Demand', desc: 'New institutional RFQs waiting' },
                  { id: 'festive_offer', icon: '🎉', label: 'Festive Bulk Offer', desc: 'Seasonal discounts & volume' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAiGoal(item.id);
                      if (item.id === 'price_reminder') setAiCustomPrompt('Monthly reminder to update wholesale prices so bulk buyers receive accurate quotes.');
                      else if (item.id === 'urgent_price_check') setAiCustomPrompt('Urgent follow-up for suppliers who have not updated rates this month.');
                      else if (item.id === 'demand_inquiry') setAiCustomPrompt('Institutional buyers are looking for fresh wholesale lots with guaranteed 10% advance escrow.');
                      else if (item.id === 'festive_offer') setAiCustomPrompt('Festive season bulk buying surge. Update rates with special discounts.');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      aiGoal === item.id
                        ? 'bg-purple-900/40 border-purple-400 ring-1 ring-purple-400/40 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Tone Controls */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Language:
                </label>
                <select
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-purple-400"
                >
                  <option value="english">🌐 English (Indian Trade)</option>
                  <option value="hindi">🇮🇳 हिंदी (Devanagari Hindi)</option>
                  <option value="hinglish">💬 Hinglish (Conversational)</option>
                  <option value="marathi">🚩 मराठी (Devanagari Marathi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Communication Tone:
                </label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-purple-400"
                >
                  <option value="professional">💼 Professional & Respectful</option>
                  <option value="urgent">⚡ Urgent & Action-Oriented</option>
                  <option value="friendly">🤝 Friendly & Supportive</option>
                  <option value="promotional">🏷️ Promotional & Volume</option>
                </select>
              </div>
            </div>

            {/* Custom Prompt / Context Input */}
            <div className="mt-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Custom Instructions or Specific Commodities (Optional):
              </label>
              <textarea
                value={aiCustomPrompt}
                onChange={(e) => setAiCustomPrompt(e.target.value)}
                placeholder="e.g., Mention that onion & basmati rice buyers from Mumbai & Delhi are actively placing bulk orders today..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAiBroadcast}
                disabled={aiGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {aiGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing Broadcast with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generate with Gemini AI</span>
                    <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono font-normal">1-Click</span>
                  </>
                )}
              </button>

              {aiGeneratedResult && (
                <button
                  type="button"
                  onClick={() => {
                    if (aiGeneratedResult.message) {
                      setCustomMessage(aiGeneratedResult.message);
                      setSelectedTemplate('custom');
                      handleCopyMessage(aiGeneratedResult.message);
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs border border-purple-500/30 transition-all"
                  title="Copy and apply to custom template"
                >
                  📋 Copy
                </button>
              )}
            </div>

            {/* Status & Results Notice */}
            {aiGeneratedResult && (
              <div className="mt-3 p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-[11px] text-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓ Applied to Live Preview!</span>
                  <span className="text-slate-400">({aiGeneratedResult.source})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate('custom');
                  }}
                  className="text-purple-300 hover:underline font-semibold"
                >
                  View Preview ↓
                </button>
              </div>
            )}

            {aiError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-[11px] text-rose-300 flex items-center justify-between">
                <span>⚠️ {aiError}</span>
                <button type="button" onClick={() => setAiError(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
            )}
          </div>

          {/* Template Selector Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <span>📋 Step 1: Choose Broadcast Template</span>
            </h2>

            <div className="space-y-2.5">
              {Object.entries(TEMPLATES).map(([key, tpl]) => {
                const isSelected = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplate(key)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tpl.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tpl.badgeColor}`}>
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tpl.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Custom message textarea if custom selected */}
            {selectedTemplate === 'custom' && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Custom Message Content:
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type custom announcement message here..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 mr-1 self-center">Insert tag:</span>
                  {['{{company_name}}', '{{contact_name}}', '{{portal_url}}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCustomMessage((prev) => (prev ? `${prev} ${tag}` : tag))}
                      className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live WhatsApp Chat Bubble Preview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live WhatsApp Chat Preview
              </span>
              <span className="text-[11px] text-slate-400">
                Previewing for: <strong className="text-white">{previewSupplier.company_name}</strong>
              </span>
            </div>

            {/* WhatsApp Chat Container */}
            <div className="bg-[#0b141a] rounded-xl p-4 border border-slate-800/80 relative overflow-hidden">
              <div className="max-w-[92%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-sm p-3.5 shadow text-xs whitespace-pre-line leading-relaxed font-sans border border-[#025142]">
                {getCompiledMessage(selectedTemplate, previewSupplier)}
                <div className="text-[9px] text-emerald-200/60 text-right mt-2 flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-emerald-300">✓✓</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Target Phone: +{previewSupplier.phone || '91XXXXXXXXXX'}</span>
              <button
                type="button"
                onClick={() => handleCopyMessage(getCompiledMessage(selectedTemplate, previewSupplier))}
                className="text-emerald-400 hover:underline font-medium"
              >
                Copy Preview Text
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Suppliers Directory & Dispatch Queue (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('in_broadcast')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'in_broadcast'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                In Broadcast ({stats.inBroadcast})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('new_pending')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'new_pending'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                🆕 New Pending ({stats.pendingBroadcast})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('real_only')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'real_only'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Real Phones ({stats.realPhones})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('outdated')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'outdated'
                    ? 'bg-amber-500/80 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Outdated ({stats.outdated})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('updated')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'updated'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Updated ({stats.updated})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, phone..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
 
          {/* Automated Broadcast to Everyone Banner */}
          <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                🚀
              </div>
              <div>
                <div className="font-extrabold text-white text-xs flex items-center gap-2">
                  <span>Automated 1-Click Broadcast</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    Everyone Gets Their Message
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click to broadcast the active monthly reminder to all {activeFilter === 'all' ? stats.total : activeFilter === 'updated' ? stats.updated : stats.outdated} suppliers automatically in the background.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setBulkAudience(activeFilter === 'all' ? 'all' : activeFilter === 'updated' ? 'all' : 'outdated');
                setIsBulkModalOpen(true);
              }}
              className="shrink-0 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>🚀 Send to All ({activeFilter === 'all' ? stats.total : activeFilter === 'updated' ? stats.updated : stats.outdated})</span>
            </button>
          </div>

          {/* Table of Suppliers */}
          <div className="flex-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <div>Loading verified suppliers and price records...</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400 text-sm">
                <div>Error loading suppliers: {error}</div>
                <button
                  type="button"
                  onClick={fetchSuppliers}
                  className="mt-3 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 text-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No suppliers match your current filter or search criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3">Supplier / Company</th>
                    <th className="py-3 px-3">WhatsApp Number</th>
                    <th className="py-3 px-3">Price Status</th>
                    <th className="py-3 px-3">Broadcast List</th>
                    <th className="py-3 px-3 text-right">Dispatch Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSuppliers.map((supplier) => {
                    const isSent = !!sentMap[supplier.id];
                    const isPreviewing = previewSupplierId === supplier.id;
                    const compiledText = getCompiledMessage(selectedTemplate, supplier);
                    const webUrl = getWhatsAppWebUrl(supplier.phone, compiledText);
                    const appUrl = getWhatsAppAppUrl(supplier.phone, compiledText);

                    return (
                      <tr
                        key={supplier.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isPreviewing ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        {/* Company Info */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{supplier.company_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Contact: {supplier.contact_name}</span>
                            <span>•</span>
                            <span>{supplier.location}</span>
                          </div>
                        </td>

                        {/* Phone Number & Edit Phone Button */}
                        <td className="py-3 px-3">
                          {supplier.has_valid_whatsapp ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-emerald-400 font-bold">+{supplier.phone}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setEditPhoneValue(supplier.raw_phone || supplier.phone);
                                }}
                                className="text-[10px] text-slate-500 hover:text-slate-300 p-0.5"
                                title="Edit phone number"
                              >
                                ✏️
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                                <span>{supplier.raw_phone || 'No phone'}</span>
                                <span className="text-[9px] bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
                                  {supplier.is_dummy ? 'Demo Seed' : 'Invalid'}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setEditPhoneValue(testPhone);
                                }}
                                className="text-[10px] text-emerald-400 hover:underline font-bold"
                              >
                                + Set Real Number
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Price Status */}
                        <td className="py-3 px-3">
                          {supplier.has_updated_this_month ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Updated ({supplier.product_count} items)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Pending Update
                            </span>
                          )}
                        </td>

                        {/* Broadcast List Status & Quick Action */}
                        <td className="py-3 px-3">
                          {broadcastMembers.includes(supplier.id) ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                In Broadcast
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFromBroadcast(supplier.id)}
                                className="text-[10px] text-slate-500 hover:text-red-400 px-1"
                                title="Remove from broadcast tracking"
                              >
                                ✕
                              </button>
                            </div>
                          ) : supplier.has_valid_whatsapp ? (
                            <button
                              type="button"
                              onClick={() => markAsAddedToBroadcast(supplier.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                              title="Click to mark as added to your WhatsApp broadcast list"
                            >
                              <span>+ Add to List</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Needs Phone</span>
                          )}
                        </td>

                        {/* Direct Native Anchor Action Buttons (Never Blocked by Popups) */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview button */}
                            <button
                              type="button"
                              onClick={() => setPreviewSupplierId(supplier.id)}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                              title="Preview personalized message for this supplier"
                            >
                              Preview
                            </button>

                            {/* 1-Click WhatsApp Dispatch Buttons */}
                            {supplier.has_valid_whatsapp ? (
                              <>
                                {/* Primary Desktop Popout Button (Forces 1120px to bypass /mobile/) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    openDesktopWhatsAppWeb(supplier.phone, compiledText);
                                    markAsSent(supplier.id);
                                  }}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                                    isSent
                                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95'
                                  }`}
                                  title="Opens in 1120px desktop popout window to bypass /mobile/ redirect"
                                >
                                  <WhatsAppLogoIcon className="w-3.5 h-3.5 fill-current" />
                                  <span>{isSent ? 'Resend' : 'Web ↗'}</span>
                                  {isSent && <span className="text-emerald-400 font-bold">✓</span>}
                                </button>

                                {/* Windows PC App Link */}
                                <a
                                  href={getWhatsAppWindowsAppUrl(supplier.phone, compiledText)}
                                  onClick={() => markAsSent(supplier.id)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
                                  title="Open in WhatsApp for Windows PC Desktop app"
                                >
                                  PC App
                                </a>

                                {/* Copy message icon */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(compiledText)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
                                  title="Copy message to clipboard"
                                >
                                  📋
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setEditPhoneValue(testPhone);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/30"
                              >
                                Fix Phone
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Guidance */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>
              💡 <strong>Why WhatsApp Web is Recommended:</strong> On desktop browsers, WhatsApp Web opens directly with the pre-filled reminder without asking to install Windows software.
            </span>
            <span className="text-slate-500 font-mono">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </span>
          </div>
        </div>
      </div>

      {/* Edit Supplier Phone Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>✏️ Update Supplier WhatsApp Number</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <span className="text-xs text-slate-400">Supplier:</span>
                <div className="text-sm font-bold text-white">{editingSupplier.company_name}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  10-Digit Mobile Number (India):
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus-within:border-emerald-500">
                  <span className="text-slate-500 font-mono mr-2 font-bold">+91</span>
                  <input
                    type="text"
                    value={editPhoneValue}
                    onChange={(e) => setEditPhoneValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 9226497450"
                    className="bg-transparent text-white font-mono font-bold w-full outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-2 text-[11px] text-slate-400 pt-1">
                <span>Fill with:</span>
                <button
                  type="button"
                  onClick={() => setEditPhoneValue('9226497450')}
                  className="text-emerald-400 hover:underline font-mono"
                >
                  9226497450
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setEditPhoneValue('8408841998')}
                  className="text-emerald-400 hover:underline font-mono"
                >
                  8408841998
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={updatingPhone || editPhoneValue.length !== 10}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {updatingPhone ? 'Saving...' : 'Save & Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 BULK BROADCAST CONFIRMATION & EXECUTION MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Send Broadcast to Everyone
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatch automated price update reminders to suppliers in bulk.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!bulkSending) {
                    setIsBulkModalOpen(false);
                    setBulkResult(null);
                  }
                }}
                disabled={bulkSending}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="my-5 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Audience Selector Tabs */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Select Target Audience:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkAudience('outdated')}
                    disabled={bulkSending}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkAudience === 'outdated'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Outdated Only</span>
                      <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded text-[10px]">
                        {stats.outdated}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Pending update this month</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAudience('all')}
                    disabled={bulkSending}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkAudience === 'all'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>All Suppliers</span>
                      <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded text-[10px]">
                        {stats.total}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">All verified vendors</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAudience('filtered')}
                    disabled={bulkSending}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkAudience === 'filtered'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Current Filter</span>
                      <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded text-[10px]">
                        {filteredSuppliers.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Matches active search</div>
                  </button>
                </div>
              </div>

              {/* Template Preview */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  2. Selected Message Template ({TEMPLATES[selectedTemplate].title}):
                </label>
                <div className="bg-[#0b141a] border border-slate-800 rounded-xl p-3.5 text-xs text-[#e9edef] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-sans">
                  {TEMPLATES[selectedTemplate].text.replace(/{{company_name}}/g, 'ABC Exports Pvt Ltd')}
                </div>
              </div>

              {/* Live Sending Progress Animation */}
              {bulkSending && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      Sending broadcast in progress...
                    </span>
                    <span>Please do not close this window</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full animate-pulse w-full" />
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {bulkResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>🎉 Server Dispatch Executed!</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {bulkResult.sent} / {bulkResult.total} Processed
                    </span>
                  </div>

                  {!bulkResult.twilioUsed ? (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span>ℹ️ Running in Simulation (Dev) Mode</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        The server generated and logged all {bulkResult.sent} personalized messages to the local server console. However, delivering messages to a physical mobile phone requires either:
                      </p>
                      <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <strong className="text-emerald-400">1. 100% Free (No API keys needed):</strong> Close this modal, maximize your browser, and click the green <strong className="text-white">Web ↗</strong> or <strong className="text-white">Desktop Popout</strong> button on any supplier row to send directly from your WhatsApp account.
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <strong className="text-indigo-400">2. Real Background Delivery:</strong> Add your <code className="text-white bg-slate-950 px-1 py-0.5 rounded">TWILIO_SID</code> and <code className="text-white bg-slate-950 px-1 py-0.5 rounded">TWILIO_AUTH_TOKEN</code> in your environment settings so Twilio can physically transmit messages across the carrier network.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-300">
                      All {bulkResult.sent} suppliers have been dispatched via Twilio WhatsApp Business API.
                    </p>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Engine: {bulkResult.twilioUsed ? 'Twilio WhatsApp API (Live)' : 'Local Server Simulator (Mock)'}</span>
                    <span className={bulkResult.twilioUsed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {bulkResult.twilioUsed ? 'Delivered to Carrier' : 'Logged to Console'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkResult(null);
                }}
                disabled={bulkSending}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                {bulkResult ? 'Close' : 'Cancel'}
              </button>

              {!bulkResult ? (
                <button
                  type="button"
                  onClick={handleExecuteSendAll}
                  disabled={bulkSending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-xs shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <WhatsAppLogoIcon className="w-4 h-4 fill-current" />
                  <span>{bulkSending ? 'Sending to Everyone...' : '⚡ Send to Everyone Now'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkResult(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ➕ ADD NEW MEMBERS TO WHATSAPP BROADCAST MODAL */}
      {isNewMembersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xl">
                  ➕
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Add New Members to WhatsApp Broadcast
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      {newBroadcastCandidates.length} New Suppliers
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Open WhatsApp to add new supplier contacts to your Broadcast List or dispatch the universal reminder.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMembersModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="my-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Step instructions banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>⚡ Quick 2-Step Workflow:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="font-bold text-emerald-400 mb-1">Step 1: Save Contacts</div>
                    Download the <strong>.vcf contact card</strong> below so these new suppliers are in your phone address book.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="font-bold text-emerald-400 mb-1">Step 2: Add in WhatsApp</div>
                    Open WhatsApp Web/App, add them into your Broadcast List or message them directly.
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedNewMemberIds.length === newBroadcastCandidates.length) {
                        setSelectedNewMemberIds([]);
                      } else {
                        setSelectedNewMemberIds(newBroadcastCandidates.map((s) => s.id));
                      }
                    }}
                    className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-semibold"
                  >
                    {selectedNewMemberIds.length === newBroadcastCandidates.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedNewMemberIds.length} of {newBroadcastCandidates.length} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generateAndDownloadVCF(
                      newBroadcastCandidates.filter((s) => selectedNewMemberIds.includes(s.id)),
                      'B2B_New_Members_Contacts.vcf'
                    )}
                    className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold border border-slate-700"
                    title="Download .vcf card for selected new suppliers"
                  >
                    📥 Download Contacts (.vcf)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyNewNumbers(
                      newBroadcastCandidates.filter((s) => selectedNewMemberIds.includes(s.id))
                    )}
                    className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700"
                  >
                    {copiedNumbersFeedback ? '✓ Copied!' : '📋 Copy Numbers'}
                  </button>
                </div>
              </div>

              {/* List of New Suppliers */}
              {newBroadcastCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-2xl border border-slate-800">
                  🎉 All verified suppliers are already added to your WhatsApp Broadcast List!
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 w-8"></th>
                        <th className="py-2.5 px-3">Company / Name</th>
                        <th className="py-2.5 px-3">WhatsApp Number</th>
                        <th className="py-2.5 px-3 text-right">Direct Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {newBroadcastCandidates.map((supplier) => {
                        const isChecked = selectedNewMemberIds.includes(supplier.id);
                        return (
                          <tr key={supplier.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNewMemberIds([...selectedNewMemberIds, supplier.id]);
                                  } else {
                                    setSelectedNewMemberIds(selectedNewMemberIds.filter((id) => id !== supplier.id));
                                  }
                                }}
                                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{supplier.company_name}</div>
                              <div className="text-[10px] text-slate-400">{supplier.contact_name} • {supplier.location}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                              +{supplier.phone}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    openDesktopWhatsAppWeb(supplier.phone, TEMPLATES.universal_broadcast.text);
                                    markAsAddedToBroadcast(supplier.id);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow"
                                  title="Open chat in WhatsApp with universal message and mark added"
                                >
                                  Chat &amp; Add ↗
                                </button>
                                <button
                                  type="button"
                                  onClick={() => markAsAddedToBroadcast(supplier.id)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                                  title="Mark added to broadcast without opening chat"
                                >
                                  ✓ Added
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsNewMembersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {/* Open WhatsApp & Add Selected */}
                <button
                  type="button"
                  onClick={() => {
                    const toAdd = newBroadcastCandidates.filter((s) => selectedNewMemberIds.includes(s.id));
                    handleOpenWhatsAppAndAddMembers(toAdd.length > 0 ? toAdd : newBroadcastCandidates);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <WhatsAppLogoIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Open WhatsApp &amp; Add Members</span>
                </button>

                {/* Mark Selected as Added */}
                <button
                  type="button"
                  onClick={() => {
                    markAsAddedToBroadcast(selectedNewMemberIds);
                  }}
                  disabled={selectedNewMemberIds.length === 0}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40"
                >
                  ✓ Mark ({selectedNewMemberIds.length}) Added
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ℹ️ HOW BROADCAST WORKS INFO MODAL */}
      {isBroadcastInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>ℹ️ How WhatsApp Broadcast Works</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBroadcastInfoModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold">
                WhatsApp Broadcast allows you to send 1 single message to up to 256 contacts at the same time for ₹0 cost!
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-white">Save Supplier Contacts:</strong>
                    <p className="text-slate-400 mt-0.5">Click <em>Export All Contacts (.vcf)</em> to save all verified supplier numbers into your phone contacts in 1 click.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-white">Create Broadcast List in WhatsApp:</strong>
                    <p className="text-slate-400 mt-0.5">In WhatsApp Mobile or Web, click the menu (3 dots) → <strong>New Broadcast</strong>, and select your suppliers.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-white">Send the Universal Message:</strong>
                    <p className="text-slate-400 mt-0.5">Copy our pre-formatted Universal Broadcast message and paste it. Every supplier receives it as an individual private chat.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">4</span>
                  <div>
                    <strong className="text-white">Adding New Members:</strong>
                    <p className="text-slate-400 mt-0.5">When a new supplier registers on B2B India, the dashboard automatically highlights them. Click <strong>&quot;Add New Members&quot;</strong> to open WhatsApp and add them to your Broadcast List!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBroadcastInfoModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ GEMINI API KEY CONFIGURATION MODAL */}
      {showAiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm shadow">
                  ✨
                </div>
                <h3 className="text-base font-black text-white">
                  Google Gemini API Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiKeyModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <p>
                Provide your Google Gemini API key to unlock dynamic AI synthesis for WhatsApp Broadcast reminders, urgent checks, and high-demand inquiries.
              </p>

              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <span>💡 How to get a 100% Free Gemini API Key:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-300 font-bold underline hover:text-purple-200">Google AI Studio (aistudio.google.com)</a></li>
                  <li>Sign in with any standard Google account.</li>
                  <li>Click <strong>&quot;Create API key&quot;</strong> (Free tier has no charge).</li>
                  <li>Copy and paste the key below.</li>
                </ol>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Google Gemini API Key:
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Key is securely stored in your local browser storage and never leaked.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSaveGeminiKey('')}
                className="text-xs text-slate-400 hover:text-rose-400 underline"
              >
                Clear / Remove Key
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiKeyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveGeminiKey(aiApiKey)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Save API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 WHATSAPP WEB AUTO-PILOT MODAL */}
      {isAutoPilotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-purple-500/30">
                  🤖
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    WhatsApp Web Auto-Pilot &amp; Broadcaster
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase tracking-wider">
                      Zero Manual Clicks
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automate broadcasting to all registered suppliers directly inside WhatsApp Web.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoPilotModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="my-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs text-slate-300">
              {/* Status summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Total Targets</div>
                  <div className="text-lg font-black text-white mt-0.5">{stats.realPhones}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">New Pending</div>
                  <div className="text-lg font-black text-amber-400 mt-0.5">{stats.pendingBroadcast}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Template</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1 truncate">
                    {TEMPLATES[selectedTemplate]?.badge || 'Gemini Custom'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Cost</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">₹0.00</div>
                </div>
              </div>

              {/* Option 1: WhatsApp Web Auto-Pilot Script */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/30 to-slate-950 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-white text-sm flex items-center gap-2">
                    <span>⚡ Option 1: Direct Message Auto-Pilot (Sends to Each Supplier)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    Automated Loop
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Runs directly inside your logged-in WhatsApp Web tab. It injects a floating control overlay and automatically opens each chat, types the Gemini broadcast message, and dispatches it with human safe intervals.
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-400">
                  <div className="text-emerald-400 font-bold font-sans">How to run in 10 seconds:</div>
                  <div>1. Open <strong className="text-white">web.whatsapp.com</strong> in your Chrome browser and make sure you are logged in.</div>
                  <div>2. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white">F12</kbd> (or right click → Inspect) and click the <strong className="text-white">Console</strong> tab.</div>
                  <div>3. Click the button below, paste the script into the console, and press <strong className="text-white">Enter</strong>.</div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generateWhatsAppAutoPilotScript());
                      setCopiedAutoPilotScript(true);
                      setTimeout(() => setCopiedAutoPilotScript(false), 3000);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <span>{copiedAutoPilotScript ? '✓ Script Copied to Clipboard!' : '📋 Copy WhatsApp Web Auto-Pilot Script'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openWhatsAppWebHome}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <WhatsAppLogoIcon className="w-3.5 h-3.5 fill-current" />
                    <span>Open Web ↗</span>
                  </button>
                </div>
              </div>

              {/* Option 2: WhatsApp Announcement Group (Native to WhatsApp Web) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-white text-sm flex items-center gap-2">
                    <span>📢 Option 2: Create WhatsApp Announcement Group (Recommended)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    100% Reliable
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  <strong>Why Announcement Group is superior:</strong> Meta only puts &quot;New Broadcast&quot; on mobile phones. On WhatsApp Web, Meta supports <strong>Groups &amp; Communities</strong>. When you set group permissions to &quot;Send Messages: Only Admins&quot;, it works exactly like a Broadcast, and suppliers receive messages even if they haven&apos;t saved your phone number!
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-white">1. Create Group:</strong>
                    <p className="text-slate-400 mt-0.5">In WhatsApp Web, click <strong>+</strong> → <strong>New Group</strong>. Name: <em>B2B India Suppliers</em>.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-white">2. Paste Numbers:</strong>
                    <p className="text-slate-400 mt-0.5">Click &quot;Copy All Numbers&quot; below and paste into WhatsApp participant search to add all suppliers.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-white">3. Admin Only:</strong>
                    <p className="text-slate-400 mt-0.5">In Group Info → Group Permissions → set <em>Send Messages: Only Admins</em>.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const allNums = suppliers
                        .filter((s) => s.has_valid_whatsapp && !s.is_dummy)
                        .map((s) => (s.phone.startsWith('91') ? `+${s.phone}` : `+91${s.phone}`))
                        .join(', ');
                      navigator.clipboard.writeText(allNums);
                      setCopiedNumbersFeedback(true);
                      setTimeout(() => setCopiedNumbersFeedback(false), 2500);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <span>{copiedNumbersFeedback ? '✓ Copied All Supplier Numbers!' : `📋 Copy All (${stats.realPhones}) Numbers for Group`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => generateAndDownloadVCF(suppliers.filter((s) => s.has_valid_whatsapp && !s.is_dummy))}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                  >
                    📥 Export .vcf
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Connected to Gemini AI Broadcast Engine
              </span>
              <button
                type="button"
                onClick={() => setIsAutoPilotModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline SVG Icon for WhatsApp
function WhatsAppLogoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
