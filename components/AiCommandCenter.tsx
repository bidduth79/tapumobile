
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { 
  Bot, FileText, MessageSquare, ShieldAlert, Sparkles, Send, 
  Loader2, RefreshCw, AlignLeft, CheckCircle2, BrainCircuit, 
  Newspaper, Image as ImageIcon, Upload, X, AlertTriangle, ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AiCommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { collectedNews, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'briefing' | 'chat' | 'scanner' | 'clustering' | 'factcheck' | 'visual'>('briefing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // API Status State
  const [apiStatus, setApiStatus] = useState<'checking' | 'active' | 'missing'>('checking');
  
  // Inputs
  const [chatInput, setChatInput] = useState('');
  const [scanText, setScanText] = useState('');
  const [factQuery, setFactQuery] = useState('');
  
  // Visual Analysis State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- HELPER: Safe API Key Retrieval with Rotation ---
  const getApiKey = () => {
      if (settings.geminiApiKey) {
          try {
              const parsed = JSON.parse(settings.geminiApiKey);
              if (Array.isArray(parsed)) {
                  const activeKeys = parsed.filter((k: any) => k.active && k.key);
                  if (activeKeys.length > 0) {
                      const randomIndex = Math.floor(Math.random() * activeKeys.length);
                      return activeKeys[randomIndex].key;
                  }
              }
          } catch (e) {
              if (settings.geminiApiKey.length > 5) return settings.geminiApiKey;
          }
      }
      if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
          return (import.meta as any).env.VITE_API_KEY;
      }
      return '';
  };

  useEffect(() => {
      const key = getApiKey();
      if (key && key.length > 10) {
          setApiStatus('active');
      } else {
          setApiStatus('missing');
      }
  }, [settings.geminiApiKey]); 

  const getRecentNewsContext = (limit = 100) => {
      const recent = collectedNews.slice(0, limit);
      return recent.map(n => `- ${n.title} (${n.source}, ${n.dateStr})`).join('\n');
  };

  const callGeminiAPI = async (prompt: string, imageBase64?: string, mimeType?: string) => {
      const apiKey = getApiKey();
      if (!apiKey) {
          setApiStatus('missing');
          throw new Error("API Key পাওয়া যায়নি। এডমিন প্যানেলে 'Settings > API কনফিগারেশন' থেকে Key সেট করুন।");
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const parts: any[] = [{ text: prompt }];
      if (imageBase64 && mimeType) {
          parts.push({ inlineData: { mimeType: mimeType, data: imageBase64 } });
      }
      try {
          const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: parts }] })
          });
          if (!response.ok) {
              const errData = await response.json();
              throw new Error(`API Error: ${errData.error?.message || response.status}`);
          }
          const data = await response.json();
          setApiStatus('active');
          return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'কোনো উত্তর পাওয়া যায়নি।';
      } catch (error) {
          console.error("Gemini Request Failed:", error);
          throw error;
      }
  };

  const generateBriefing = async () => {
      setLoading(true);
      try {
          const context = getRecentNewsContext(150);
          if (!context) { setResult('বিশ্লেষণ করার জন্য পর্যাপ্ত নিউজ নেই।'); setLoading(false); return; }
          const prompt = `Act as a Senior Intelligence Officer. Analyze these news headlines:\n${context}\n\nGenerate a "Daily Intelligence Briefing" in Bengali. Format:\n1. **Top Highlight:** The single most critical event.\n2. **Security & Border:** Updates on BGB, borders, or defense.\n3. **Political Trends:** Key political movements.\n4. **Public Sentiment:** General mood based on news.\nKeep it professional and concise.`;
          const responseText = await callGeminiAPI(prompt);
          setResult(responseText);
      } catch (e: any) { setResult('Error: ' + e.message); } finally { setLoading(false); }
  };

  const handleChat = async () => {
      if (!chatInput.trim()) return;
      const userMsg = chatInput;
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setChatInput('');
      setLoading(true);
      try {
          const context = getRecentNewsContext(60);
          const prompt = `Context:\n${context}\n\nUser Question: ${userMsg}\n\nAnswer in Bengali based on the context. If info is missing, say so.`;
          const responseText = await callGeminiAPI(prompt);
          setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
      } catch (e: any) { 
          setChatHistory(prev => [...prev, { role: 'model', text: 'Error: ' + e.message }]); 
      } 
      finally { setLoading(false); }
  };

  const scanPropaganda = async () => {
      if (!scanText.trim()) return;
      setLoading(true);
      try {
          const prompt = `Analyze this text for propaganda/bias in Bengali:\n"${scanText}"\n\nOutput:\n- **Risk Score:** (0-100%)\n- **Sentiment:**\n- **Bias Type:** (Political/Religious/Neutral)\n- **Verdict:** Explain why.`;
          const responseText = await callGeminiAPI(prompt);
          setResult(responseText);
      } catch (e: any) { setResult('Error: ' + e.message); } finally { setLoading(false); }
  };

  const generateClusters = async () => {
      setLoading(true);
      try {
          const context = getRecentNewsContext(80);
          const prompt = `Group these headlines into "Story Clusters" (events). \n${context}\n\nOutput in Bengali list format. Example:\n**1. [Event Name]**\n- Headline 1\n- Headline 2`;
          const responseText = await callGeminiAPI(prompt);
          setResult(responseText);
      } catch (e: any) { setResult('Error: ' + e.message); } finally { setLoading(false); }
  };

  const verifyFact = async () => {
      if (!factQuery.trim()) return;
      setLoading(true);
      try {
          const context = getRecentNewsContext(100);
          const prompt = `Context:\n${context}\n\nClaim to Verify: "${factQuery}"\n\nBased on the collected news, is this claim True, False, or Unverified? Answer in Bengali with evidence from the context.`;
          const responseText = await callGeminiAPI(prompt);
          setResult(responseText);
      } catch (e: any) { setResult('Error: ' + e.message); } finally { setLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(file);
          setResult('');
      }
  };

  const analyzeImage = async () => {
      if (!imageFile) return;
      setLoading(true);
      try {
          const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(imageFile);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
          });
          const base64Content = base64Data.split(',')[1];
          const prompt = "এই ছবিটির বিস্তারিত বিশ্লেষণ করুন। এটি কোনো নিউজের অংশ হলে কনটেক্সট, কোনো টেক্সট থাকলে তা এক্সট্র্যাক্ট করুন এবং ছবিটি রিয়েল নাকি জেনারেটেড/এডিটেড হতে পারে সে সম্পর্কে মতামত দিন। উত্তর বাংলায় দিন।";
          const responseText = await callGeminiAPI(prompt, base64Content, imageFile.type);
          setResult(responseText);
      } catch (e: any) { setResult('Error: ' + e.message); } finally { setLoading(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const tabs = [
      { id: 'briefing', label: 'স্মার্ট ব্রিফিং', icon: Sparkles, color: 'text-yellow-400' },
      { id: 'chat', label: 'ডাটাবেস চ্যাট', icon: MessageSquare, color: 'text-blue-400' },
      { id: 'scanner', label: 'প্রোপাগান্ডা', icon: ShieldAlert, color: 'text-red-400' },
      { id: 'visual', label: 'ভিজুয়াল ডিটেকটিভ', icon: ImageIcon, color: 'text-pink-400' },
      { id: 'clustering', label: 'ক্লাস্টারিং', icon: AlignLeft, color: 'text-purple-400' },
      { id: 'factcheck', label: 'ফ্যাক্ট চেক', icon: CheckCircle2, color: 'text-green-400' },
  ];

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col animate-fadeIn">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white mr-2" title="ফিরে যান">
                    <ArrowLeft size={24} />
                </button>
                <div className="relative">
                    <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                        <BrainCircuit size={32} className="text-purple-400"/>
                    </div>
                    <div className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 transition-all duration-500 ${apiStatus === 'active' ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]'} animate-pulse`} title={apiStatus === 'active' ? "API Connected" : "API Missing"}></div>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black tracking-tight">AI ইন্টেলিজেন্স হাব</h1>
                        {apiStatus === 'missing' && <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/50 font-bold flex items-center gap-1"><AlertTriangle size={10}/> API Missing</span>}
                    </div>
                    <p className="text-sm text-gray-400">অ্যাডভান্সড মিডিয়া অ্যানালিটিক্স & ইনভেস্টিগেশন</p>
                </div>
            </div>
            
            <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700 overflow-x-auto max-w-full no-scrollbar">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => { setActiveTab(t.id as any); setResult(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <t.icon size={16} className={activeTab === t.id ? 'text-gray-900' : t.color}/>{t.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Input Panel */}
            <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 overflow-y-auto">
                {activeTab === 'briefing' && (
                    <div className="text-center space-y-4 my-auto">
                        <FileText size={64} className="mx-auto text-yellow-500 opacity-80"/>
                        <h3 className="text-lg font-bold dark:text-white">অটোমেটিক নিউজ ব্রিফিং</h3>
                        <p className="text-sm text-gray-500">গত ২৪ ঘণ্টার সকল সংগৃহীত নিউজ বিশ্লেষণ করে সারসংক্ষেপ তৈরি করুন।</p>
                        <button onClick={generateBriefing} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
                            {loading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>} ব্রিফিং তৈরি করুন
                        </button>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 flex flex-col justify-center items-center text-gray-400 text-center mb-4">
                            <Bot size={48} className="mb-2 opacity-50"/>
                            <p className="text-sm">ডাটাবেসের নিউজ সম্পর্কে প্রশ্ন করুন।</p>
                        </div>
                        <div className="relative">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} className="w-full pl-4 pr-12 py-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" placeholder="প্রশ্ন লিখুন..."/>
                            <button onClick={handleChat} disabled={loading} className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                {loading ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'scanner' && (
                    <div className="space-y-4">
                        <h3 className="font-bold dark:text-white flex items-center gap-2"><ShieldAlert className="text-red-500"/> প্রোপাগান্ডা স্ক্যানার</h3>
                        <textarea value={scanText} onChange={e => setScanText(e.target.value)} className="w-full h-48 p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none" placeholder="যাচাই করার জন্য টেক্সট পেস্ট করুন..."></textarea>
                        <button onClick={scanPropaganda} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin"/> : <ShieldAlert/>} বিশ্লেষণ করুন
                        </button>
                    </div>
                )}

                {activeTab === 'visual' && (
                    <div className="space-y-4">
                        <h3 className="font-bold dark:text-white flex items-center gap-2"><ImageIcon className="text-pink-500"/> ভিজুয়্যাল ডিটেকটিভ</h3>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition relative group">
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm"/>
                                    <button onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"><X size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="mx-auto text-gray-400 mb-2 group-hover:text-pink-500 transition-colors"/>
                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">ছবি আপলোড করুন</p>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={!!imagePreview}/>
                        </div>
                        <button onClick={analyzeImage} disabled={loading || !imageFile} className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin"/> : <Sparkles/>} বিশ্লেষণ করুন
                        </button>
                    </div>
                )}

                {activeTab === 'clustering' && (
                    <div className="text-center space-y-4 my-auto">
                        <AlignLeft size={64} className="mx-auto text-purple-500 opacity-80"/>
                        <h3 className="text-lg font-bold dark:text-white">স্মার্ট ক্লাস্টারিং</h3>
                        <p className="text-sm text-gray-500">নিউজগুলোকে ঘটনার ভিত্তিতে গ্রুপ করুন।</p>
                        <button onClick={generateClusters} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin"/> : <RefreshCw/>} ক্লাস্টারিং শুরু করুন
                        </button>
                    </div>
                )}

                {activeTab === 'factcheck' && (
                    <div className="space-y-4">
                        <h3 className="font-bold dark:text-white flex items-center gap-2"><CheckCircle2 className="text-green-500"/> ফ্যাক্ট চেকার</h3>
                        <textarea value={factQuery} onChange={e => setFactQuery(e.target.value)} className="w-full h-40 p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-green-500 outline-none" placeholder="গুজব বা তথ্য যাচাই করতে লিখুন..."></textarea>
                        <button onClick={verifyFact} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin"/> : <CheckCircle2/>} সত্যতা যাচাই করুন
                        </button>
                    </div>
                )}
            </div>

            {/* Right Output Panel */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-gray-800">
                {activeTab === 'chat' ? (
                    <div className="space-y-4">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-none'}`}>
                                    <div className="prose dark:prose-invert max-w-none text-sm"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                                </div>
                            </div>
                        ))}
                        {chatHistory.length === 0 && <div className="h-full flex items-center justify-center text-gray-400 text-sm">চ্যাট শুরু করার জন্য বামপাশে প্রশ্ন লিখুন...</div>}
                        <div ref={chatEndRef}></div>
                    </div>
                ) : (
                    <div className="h-full">
                        {result ? (
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none text-sm leading-7 animate-slideUp">
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                <Newspaper size={64} className="mb-4"/>
                                <p>ফলাফল এখানে দেখানো হবে</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AiCommandCenter;
