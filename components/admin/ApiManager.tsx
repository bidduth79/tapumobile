
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Key, Plus, Trash2, Save, Eye, EyeOff, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, Edit2, X, Sparkles } from 'lucide-react';

interface KeyEntry {
    name: string;
    key: string;
    active: boolean;
}

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ApiManager: React.FC<Props> = ({ showToast }) => {
  const { settings, updateSettings } = useApp();
  
  // YouTube States
  const [youtubeEntries, setYoutubeEntries] = useState<KeyEntry[]>([]);
  const [ytName, setYtName] = useState('');
  const [ytKey, setYtKey] = useState('');
  const [showYtKeyInput, setShowYtKeyInput] = useState(false);

  // Gemini States (Updated)
  const [geminiEntries, setGeminiEntries] = useState<KeyEntry[]>([]);
  const [gmName, setGmName] = useState('');
  const [gmKey, setGmKey] = useState('');
  const [showGmKeyInput, setShowGmKeyInput] = useState(false);

  useEffect(() => {
      // 1. Parse YouTube Keys
      parseKeys(settings.youtubeApiKey, setYoutubeEntries, 'Key');

      // 2. Parse Gemini Keys
      parseKeys(settings.geminiApiKey, setGeminiEntries, 'Gemini');
  }, [settings]);

  // Helper to parse existing data (JSON or String)
  const parseKeys = (rawString: string, setter: React.Dispatch<React.SetStateAction<KeyEntry[]>>, defaultNamePrefix: string) => {
      if (rawString) {
          try {
              const parsed = JSON.parse(rawString);
              if (Array.isArray(parsed)) {
                  setter(parsed);
              } else {
                  throw new Error("Not an array");
              }
          } catch (e) {
              // Fallback: Treat as single string (Legacy support)
              const keys = rawString.split(',').filter(k => k.trim().length > 0);
              const formatted = keys.map((k, i) => ({
                  name: `${defaultNamePrefix} ${i + 1}`,
                  key: k.trim(),
                  active: true
              }));
              setter(formatted);
          }
      } else {
          setter([]);
      }
  };

  // Generic Add Function
  const handleAddKey = (
      type: 'youtube' | 'gemini', 
      nameVal: string, 
      keyVal: string, 
      currentEntries: KeyEntry[], 
      setter: React.Dispatch<React.SetStateAction<KeyEntry[]>>,
      resetName: (s: string) => void,
      resetKey: (s: string) => void,
      setShow: (b: boolean) => void
  ) => {
      if (!keyVal.trim()) { showToast('API Key খালি রাখা যাবে না!', 'error'); return; }
      
      const name = nameVal.trim() || `${type === 'youtube' ? 'YT' : 'AI'} Key ${currentEntries.length + 1}`;
      
      if (currentEntries.some(e => e.key === keyVal.trim())) {
          showToast('এই Key টি ইতিমধ্যে যুক্ত আছে', 'warning');
          return;
      }

      const updatedEntries = [...currentEntries, { name, key: keyVal.trim(), active: true }];
      setter(updatedEntries);
      
      // Save
      if (type === 'youtube') saveSettings('youtubeApiKey', updatedEntries);
      else saveSettings('geminiApiKey', updatedEntries);
      
      resetName('');
      resetKey('');
      setShow(false);
  };

  const removeKey = (index: number, type: 'youtube' | 'gemini', entries: KeyEntry[], setter: any) => {
      const updated = entries.filter((_, i) => i !== index);
      setter(updated);
      saveSettings(type === 'youtube' ? 'youtubeApiKey' : 'geminiApiKey', updated);
  };

  const toggleActive = (index: number, type: 'youtube' | 'gemini', entries: KeyEntry[], setter: any) => {
      const updated = [...entries];
      updated[index].active = !updated[index].active;
      setter(updated);
      saveSettings(type === 'youtube' ? 'youtubeApiKey' : 'geminiApiKey', updated);
  };

  const saveSettings = (keyName: string, entries: KeyEntry[]) => {
      const jsonString = JSON.stringify(entries);
      updateSettings({ [keyName]: jsonString });
      showToast('API তালিকা আপডেট হয়েছে', 'success');
  };

  const ytActiveCount = youtubeEntries.filter(e => e.active).length;
  const gmActiveCount = geminiEntries.filter(e => e.active).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        
        {/* --- YOUTUBE KEYS SECTION --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
            <div className="flex justify-between items-start mb-6 border-b pb-3 dark:border-gray-700">
                <div>
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Key size={24} className="text-red-600"/> YouTube API Keys
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">ফিড এবং লাইভ স্ট্যাটাসের জন্য। Quota শেষ হলে অটোমেটিক অন্যটি ব্যবহার হবে।</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold mb-1">Total: {youtubeEntries.length}</span>
                    <span className="text-[10px] text-green-600 font-bold">Active: {ytActiveCount}</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Input Form */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="md:w-1/3">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">নাম (Optional)</label>
                            <input className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-red-500 text-sm" placeholder="ex: Admin Key" value={ytName} onChange={e => setYtName(e.target.value)} />
                        </div>
                        <div className="md:w-2/3">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">API Key</label>
                            <div className="flex gap-2">
                                <input type={showYtKeyInput ? "text" : "password"} className="flex-1 p-2.5 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono" placeholder="AIzaSy..." value={ytKey} onChange={e => setYtKey(e.target.value)} />
                                <button onClick={() => setShowYtKeyInput(!showYtKeyInput)} className="p-2.5 text-gray-500 hover:text-gray-700 bg-white dark:bg-gray-700 border rounded-lg">{showYtKeyInput ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                                <button onClick={() => handleAddKey('youtube', ytName, ytKey, youtubeEntries, setYoutubeEntries, setYtName, setYtKey, setShowYtKeyInput)} className="bg-red-600 text-white px-4 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 transition text-sm whitespace-nowrap"><Plus size={16}/> যোগ করুন</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    {youtubeEntries.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {youtubeEntries.map((entry, idx) => (
                                <div key={idx} className={`flex flex-col md:flex-row justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${!entry.active ? 'opacity-60 bg-gray-50' : ''}`}>
                                    <div className="flex items-center gap-4 w-full md:w-auto mb-2 md:mb-0">
                                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold shrink-0">{idx + 1}</span>
                                        <div>
                                            <p className="font-bold text-sm dark:text-white flex items-center gap-2">{entry.name} {!entry.active && <span className="text-[9px] bg-gray-200 text-gray-600 px-2 rounded-full">Inactive</span>}</p>
                                            <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{entry.key.substring(0, 8)}...{entry.key.substring(entry.key.length - 6)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => toggleActive(idx, 'youtube', youtubeEntries, setYoutubeEntries)} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition border ${entry.active ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}>{entry.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>} {entry.active ? 'Active' : 'Inactive'}</button>
                                        <button onClick={() => removeKey(idx, 'youtube', youtubeEntries, setYoutubeEntries)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" title="মুছে ফেলুন"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400"><AlertTriangle size={32} className="mx-auto mb-2 opacity-50"/><p>কোনো API Key সেট করা নেই। Backend Config ব্যবহার হচ্ছে।</p></div>
                    )}
                </div>
            </div>
        </div>

        {/* --- GEMINI KEY SECTION --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
            <div className="flex justify-between items-start mb-6 border-b pb-3 dark:border-gray-700">
                <div>
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Sparkles size={24} className="text-purple-600"/> Google Gemini Keys
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">AI কমান্ড সেন্টার এবং ইন্টেলিজেন্স টুলের জন্য। একাধিক কী যোগ করলে রোটেশন হবে।</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold mb-1">Total: {geminiEntries.length}</span>
                    <span className="text-[10px] text-green-600 font-bold">Active: {gmActiveCount}</span>
                </div>
            </div>
            
            <div className="space-y-4">
                {/* Input Form */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="md:w-1/3">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">নাম (Optional)</label>
                            <input className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 text-sm" placeholder="ex: Personal Key" value={gmName} onChange={e => setGmName(e.target.value)} />
                        </div>
                        <div className="md:w-2/3">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">API Key</label>
                            <div className="flex gap-2">
                                <input type={showGmKeyInput ? "text" : "password"} className="w-full p-2.5 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" placeholder="AIzaSy..." value={gmKey} onChange={e => setGmKey(e.target.value)} />
                                <button onClick={() => setShowGmKeyInput(!showGmKeyInput)} className="p-2.5 text-gray-500 hover:text-gray-700 bg-white dark:bg-gray-700 border rounded-lg">{showGmKeyInput ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                                <button onClick={() => handleAddKey('gemini', gmName, gmKey, geminiEntries, setGeminiEntries, setGmName, setGmKey, setShowGmKeyInput)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition text-sm whitespace-nowrap flex items-center gap-2"><Plus size={16}/> Add</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    {geminiEntries.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {geminiEntries.map((entry, idx) => (
                                <div key={idx} className={`flex flex-col md:flex-row justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${!entry.active ? 'opacity-60 bg-gray-50' : ''}`}>
                                    <div className="flex items-center gap-4 w-full md:w-auto mb-2 md:mb-0">
                                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold shrink-0">{idx + 1}</span>
                                        <div>
                                            <p className="font-bold text-sm dark:text-white flex items-center gap-2">{entry.name} {!entry.active && <span className="text-[9px] bg-gray-200 text-gray-600 px-2 rounded-full">Inactive</span>}</p>
                                            <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{entry.key.substring(0, 8)}...{entry.key.substring(entry.key.length - 6)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => toggleActive(idx, 'gemini', geminiEntries, setGeminiEntries)} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition border ${entry.active ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}>{entry.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>} {entry.active ? 'Active' : 'Inactive'}</button>
                                        <button onClick={() => removeKey(idx, 'gemini', geminiEntries, setGeminiEntries)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" title="মুছে ফেলুন"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400"><AlertTriangle size={32} className="mx-auto mb-2 opacity-50"/><p>কোনো কী নেই। .env ফাইলের ডিফল্ট কী ব্যবহার হবে (যদি থাকে)।</p></div>
                    )}
                </div>
            </div>
        </div>

    </div>
  );
};

export default ApiManager;
