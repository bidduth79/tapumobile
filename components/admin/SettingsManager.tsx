
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Save, FileText, Globe, RefreshCw, Database, Monitor } from 'lucide-react';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const SettingsManager: React.FC<Props> = ({ showToast }) => {
  const { settings, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
      setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
      updateSettings(localSettings);
      showToast('সেটিংস সফলভাবে সেভ করা হয়েছে!', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-10">
        
        {/* --- REPORT GENERATOR SETTINGS --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2 border-b pb-3 dark:border-gray-700">
                <FileText size={24} className="text-blue-600"/> রিপোর্ট জেনারেটর কনফিগারেশন
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Report Config */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm uppercase mb-2">বেসিক সেটিংস</h4>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ডিফল্ট টাইম রেঞ্জ</label>
                        <select 
                            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={localSettings.reportDefaultTimeRange}
                            onChange={e => setLocalSettings({...localSettings, reportDefaultTimeRange: parseInt(e.target.value)})}
                        >
                            <option value={1}>১ ঘণ্টা</option>
                            <option value={3}>৩ ঘণ্টা</option>
                            <option value={6}>৬ ঘণ্টা</option>
                            <option value={12}>১২ ঘণ্টা</option>
                            <option value={24}>২৪ ঘণ্টা</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">রিপোর্ট পেজে ডিফল্ট হিসেবে এই সময়টি সিলেক্ট করা থাকবে।</p>
                    </div>
                </div>

                {/* Advanced Report Config */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm uppercase mb-2">অ্যাডভান্সড মোড</h4>
                    
                    {/* Free Mode Report */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm"><Globe size={16}/> Free Mode (ফ্রি মুড)</h4>
                            <p className="text-[10px] text-gray-500">অন থাকলে কিওয়ার্ড ছাড়াই সব নিউজ আসবে।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.reportFreeMode} onChange={e => setLocalSettings({...localSettings, reportFreeMode: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {localSettings.reportFreeMode && (
                        <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 animate-slideUp">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">ফ্রি মুড ভাষা</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setLocalSettings({...localSettings, reportFreeModeLang: 'bn'})}
                                    className={`flex-1 py-1.5 rounded text-xs font-bold border transition ${localSettings.reportFreeModeLang === 'bn' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                >
                                    বাংলা
                                </button>
                                <button 
                                    onClick={() => setLocalSettings({...localSettings, reportFreeModeLang: 'en'})}
                                    className={`flex-1 py-1.5 rounded text-xs font-bold border transition ${localSettings.reportFreeModeLang === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                >
                                    English
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Force Mode */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm"><RefreshCw size={16}/> Force Mode</h4>
                            <p className="text-[10px] text-gray-500">ডুপ্লিকেট চেক বন্ধ করে সব নতুন করে ফেচ করবে।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.reportForceMode} onChange={e => setLocalSettings({...localSettings, reportForceMode: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    {/* Strict Mode */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm"><Database size={16}/> Strict Mode</h4>
                            <p className="text-[10px] text-gray-500">কিওয়ার্ড হুবহু মিলতে হবে।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.reportStrictMode} onChange={e => setLocalSettings({...localSettings, reportStrictMode: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        {/* --- MONITOR SETTINGS --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600"></div>
            <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2 border-b pb-3 dark:border-gray-700">
                <Monitor size={24} className="text-teal-600"/> মনিটর কনফিগারেশন
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm uppercase mb-2">রিফ্রেশ সেটিংস</h4>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">অটো রিফ্রেশ ইন্টারভাল (মিনিট)</label>
                        <input 
                            type="number" 
                            min="5" 
                            max="60" 
                            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                            value={localSettings.monitorRefreshInterval}
                            onChange={e => setLocalSettings({...localSettings, monitorRefreshInterval: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-sm">Auto Refresh</h4>
                            <p className="text-[10px] text-gray-500">অটোমেটিক নতুন ডাটা ফেচ হবে।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.monitorAutoRefresh} onChange={e => setLocalSettings({...localSettings, monitorAutoRefresh: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm uppercase mb-2">অ্যাডভান্সড ফিল্টার</h4>
                    
                    {/* Free Mode Monitor */}
                    <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm"><Globe size={16}/> Free Mode (ফ্রি মুড)</h4>
                            <p className="text-[10px] text-gray-500">কিওয়ার্ড ছাড়াও সাধারণ ব্রেকিং নিউজ দেখাবে।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.monitorFreeMode} onChange={e => setLocalSettings({...localSettings, monitorFreeMode: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>

                    {localSettings.monitorFreeMode && (
                        <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 animate-slideUp">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">ফ্রি মুড ভাষা (মনিটর)</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setLocalSettings({...localSettings, monitorFreeModeLang: 'bn'})}
                                    className={`flex-1 py-1.5 rounded text-xs font-bold border transition ${localSettings.monitorFreeModeLang === 'bn' ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                >
                                    বাংলা
                                </button>
                                <button 
                                    onClick={() => setLocalSettings({...localSettings, monitorFreeModeLang: 'en'})}
                                    className={`flex-1 py-1.5 rounded text-xs font-bold border transition ${localSettings.monitorFreeModeLang === 'en' ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                >
                                    English
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Force Mode Monitor */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm"><RefreshCw size={16}/> Force Mode</h4>
                            <p className="text-[10px] text-gray-500">মনিটরের ডুপ্লিকেট চেক বন্ধ রাখবে।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.monitorForceMode} onChange={e => setLocalSettings({...localSettings, monitorForceMode: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    {/* Strict Mode Monitor */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm"><Database size={16}/> Strict Mode</h4>
                            <p className="text-[10px] text-gray-500">মনিটরের কিওয়ার্ড হুবহু মিলতে হবে।</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.monitorStrictMode} onChange={e => setLocalSettings({...localSettings, monitorStrictMode: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div className="sticky bottom-4 flex justify-center">
            <button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-10 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transition transform active:scale-95 border-2 border-white/20 backdrop-blur-md">
                <Save size={20}/> সব সেটিংস সেভ করুন
            </button>
        </div>
    </div>
  );
};

export default SettingsManager;
