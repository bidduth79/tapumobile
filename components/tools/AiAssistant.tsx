
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../store';
import { GoogleGenAI } from "@google/genai";
import { Bot, FileText, MessageSquare, ShieldAlert, Sparkles, Send, Loader2, RefreshCw, Copy, AlignLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AiAssistant: React.FC = () => {
  const { collectedNews, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'briefing' | 'chat' | 'scanner' | 'clustering'>('briefing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scanner State
  const [scanText, setScanText] = useState('');

  // --- HELPER: Safe Key Retrieval with Rotation ---
  const getApiKey = () => {
      // 1. Try Settings (Multi-key supported)
      if (settings.geminiApiKey) {
          try {
              const parsed = JSON.parse(settings.geminiApiKey);
              if (Array.isArray(parsed)) {
                  // Filter active keys
                  const activeKeys = parsed.filter((k: any) => k.active && k.key);
                  if (activeKeys.length > 0) {
                      // Pick random key to distribute load
                      const randomIndex = Math.floor(Math.random() * activeKeys.length);
                      return activeKeys[randomIndex].key;
                  }
              }
          } catch (e) {
              // Legacy string support
              if (settings.geminiApiKey.length > 5) return settings.geminiApiKey;
          }
      }
      
      // 2. Fallback to Env
      if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
          return (import.meta as any).env.VITE_API_KEY;
      }
      return '';
  };

  const apiKey = getApiKey();
  // Safe init: if key missing, provide dummy to prevent crash, check later
  // Note: We re-instantiate in calls if we want true rotation per request, 
  // but for simple usage, one key per session load is okay-ish, 
  // BUT better to instantiate inside function calls for rotation.
  
  // --- HELPER: Prepare Context from News ---
  const getRecentNewsContext = (limit = 50) => {
      const recent = collectedNews.slice(0, limit);
      return recent.map(n => `- ${n.title} (${n.source}, ${n.dateStr})`).join('\n');
  };

  // Helper to get client on demand (for key rotation)
  const getAiClient = () => {
      const key = getApiKey();
      return new GoogleGenAI({ apiKey: key || 'MISSING_KEY' });
  }

  // 1. SMART BRIEFING
  const generateBriefing = async () => {
      const key = getApiKey();
      if (!key) { setResult('Error: API Key সেট করা নেই।'); return; }
      
      setLoading(true);
      try {
          const aiClient = new GoogleGenAI({ apiKey: key });
          const context = getRecentNewsContext(100); 
          if (!context) { setResult('বিশ্লেষণ করার জন্য পর্যাপ্ত নিউজ নেই।'); setLoading(false); return; }

          const prompt = `You are a senior intelligence analyst. Analyze the following news headlines collected today:
          
          ${context}
          
          Generate a professional "Daily Intelligence Briefing" in Bengali.
          Structure:
          1. **Top Highlight:** The most critical event.
          2. **Border & Security:** Summary of BGB/Border related news.
          3. **Political Landscape:** Key political updates.
          4. **International/Others:** Important global or other news.
          
          Keep it concise, professional, and point-wise.`;

          const response = await aiClient.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          
          setResult(response.text || 'কোনো উত্তর পাওয়া যায়নি।');
      } catch (e: any) {
          setResult('Error: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  // 2. CHAT WITH DATA
  const handleChat = async () => {
      const key = getApiKey();
      if (!key) { setChatHistory(prev => [...prev, { role: 'model', text: 'Error: API Key Missing.' }]); return; }
      if (!chatInput.trim()) return;
      
      const userMsg = chatInput;
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setChatInput('');
      setLoading(true);

      try {
          const aiClient = new GoogleGenAI({ apiKey: key });
          const context = getRecentNewsContext(50);
          const prompt = `Context (Recent News Data):\n${context}\n\nUser Question: ${userMsg}\n\nAnswer the user's question based on the provided context in Bengali. If the answer is not in the context, use general knowledge but mention it.`;

          const response = await aiClient.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });

          setChatHistory(prev => [...prev, { role: 'model', text: response.text || '' }]);
      } catch (e) {
          setChatHistory(prev => [...prev, { role: 'model', text: 'Error generating response.' }]);
      } finally {
          setLoading(false);
      }
  };

  // 3. PROPAGANDA SCANNER
  const scanPropaganda = async () => {
      const key = getApiKey();
      if (!key) { setResult('Error: API Key Missing.'); return; }
      if (!scanText.trim()) return;
      setLoading(true);
      try {
          const aiClient = new GoogleGenAI({ apiKey: key });
          const prompt = `Analyze the following text for propaganda, bias, and sentiment in Bengali:
          "${scanText}"
          
          Output Format:
          **Risk Score:** (0-100%)
          **Sentiment:** (Positive/Negative/Neutral)
          **Category:** (Propaganda/Rumor/News/Opinion)
          **Analysis:** Brief explanation.`;

          const response = await aiClient.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          setResult(response.text || '');
      } catch (e) { setResult('Error.'); } finally { setLoading(false); }
  };

  // 4. CLUSTERING
  const generateClusters = async () => {
      const key = getApiKey();
      if (!key) { setResult('Error: API Key Missing.'); return; }
      setLoading(true);
      try {
          const aiClient = new GoogleGenAI({ apiKey: key });
          const context = getRecentNewsContext(60);
          const prompt = `Group the following news headlines into distinct "Story Clusters" based on the event, not just keywords.
          News:
          ${context}
          
          Output in Bengali as a list of groups. give each group a headline.`;

          const response = await aiClient.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          setResult(response.text || '');
      } catch (e) { setResult('Error.'); } finally { setLoading(false); }
  };

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <Bot size={24} className="text-white"/>
                <div>
                    <h3 className="font-bold text-lg leading-none">AI ইন্টেলিজেন্স হাব (Tools)</h3>
                    <p className="text-[10px] opacity-80">Powered by Google Gemini</p>
                </div>
            </div>
            <div className="flex bg-white/20 rounded-lg p-1 gap-1">
                <button onClick={() => { setActiveTab('briefing'); setResult(''); }} className={`p-2 rounded-md transition ${activeTab === 'briefing' ? 'bg-white text-indigo-600' : 'hover:bg-white/10 text-white'}`}><FileText size={18}/></button>
                <button onClick={() => { setActiveTab('chat'); setResult(''); }} className={`p-2 rounded-md transition ${activeTab === 'chat' ? 'bg-white text-indigo-600' : 'hover:bg-white/10 text-white'}`}><MessageSquare size={18}/></button>
                <button onClick={() => { setActiveTab('scanner'); setResult(''); }} className={`p-2 rounded-md transition ${activeTab === 'scanner' ? 'bg-white text-indigo-600' : 'hover:bg-white/10 text-white'}`}><ShieldAlert size={18}/></button>
                <button onClick={() => { setActiveTab('clustering'); setResult(''); }} className={`p-2 rounded-md transition ${activeTab === 'clustering' ? 'bg-white text-indigo-600' : 'hover:bg-white/10 text-white'}`}><AlignLeft size={18}/></button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50 dark:bg-gray-800">
            
            {/* 1. BRIEFING MODE */}
            {activeTab === 'briefing' && (
                <div className="space-y-4">
                    <div className="text-center py-6">
                        <h4 className="text-gray-600 dark:text-gray-300 font-bold mb-2">আজকের অটোমেটিক নিউজ ব্রিফিং</h4>
                        <button onClick={generateBriefing} disabled={loading} className="bg-violet-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-violet-700 transition flex items-center gap-2 mx-auto disabled:opacity-50">
                            {loading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>} ব্রিফিং তৈরি করুন
                        </button>
                    </div>
                    {result && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none text-sm animate-slideUp">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}

            {/* 2. CHAT MODE */}
            {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                        {chatHistory.length === 0 && (
                            <div className="text-center text-gray-400 mt-10">
                                <Bot size={48} className="mx-auto mb-2 opacity-20"/>
                                <p>আপনার ডাটাবেসের নিউজ সম্পর্কে যা খুশি জিজ্ঞেস করুন।</p>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-none shadow-sm'}`}>
                                    <div className="prose dark:prose-invert max-w-none text-sm">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && <div className="flex justify-start"><div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-xl rounded-bl-none"><Loader2 size={16} className="animate-spin text-gray-500"/></div></div>}
                        <div ref={chatEndRef}></div>
                    </div>
                    <div className="relative">
                        <input 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleChat()}
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            placeholder="বিজিবি সম্পর্কে আজকের আপডেট কি?"
                        />
                        <button onClick={handleChat} className="absolute right-2 top-2 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"><Send size={16}/></button>
                    </div>
                </div>
            )}

            {/* 3. SCANNER MODE */}
            {activeTab === 'scanner' && (
                <div className="space-y-4">
                    <textarea 
                        value={scanText}
                        onChange={e => setScanText(e.target.value)}
                        className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="যাচাই করার জন্য টেক্সট বা নিউজের অংশ এখানে পেস্ট করুন..."
                    ></textarea>
                    <button onClick={scanPropaganda} disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex justify-center items-center gap-2">
                        {loading ? <Loader2 size={18} className="animate-spin"/> : <ShieldAlert size={18}/>} স্ক্যান ও বিশ্লেষণ করুন
                    </button>
                    {result && (
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-l-4 border-red-500 shadow animate-slideUp">
                            <div className="prose dark:prose-invert text-sm">
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. CLUSTERING MODE */}
            {activeTab === 'clustering' && (
                <div className="space-y-4">
                    <div className="text-center py-4">
                        <p className="text-gray-500 text-xs mb-3">এলোমেলো নিউজগুলোকে ঘটনার ভিত্তিতে সাজান</p>
                        <button onClick={generateClusters} disabled={loading} className="bg-teal-600 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-teal-700 transition flex items-center gap-2 mx-auto disabled:opacity-50">
                            {loading ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18}/>} ক্লাস্টারিং শুরু করুন
                        </button>
                    </div>
                    {result && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none text-sm animate-slideUp">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {/* Footer Notice */}
        {activeTab !== 'chat' && (
            <div className="bg-gray-100 dark:bg-gray-800 p-2 text-center text-[10px] text-gray-400">
                AI can make mistakes. Verify important information.
            </div>
        )}
    </div>
  );
};

export default AiAssistant;
