
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { PenTool, Megaphone, Save, Globe, Layout, Type } from 'lucide-react';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const BrandingManager: React.FC<Props> = ({ showToast }) => {
  const { settings, updateSettings } = useApp();
  
  const [siteTitle, setSiteTitle] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeActive, setNoticeActive] = useState(false);
  const [noticeType, setNoticeType] = useState<'info' | 'warning' | 'alert'>('info');

  useEffect(() => {
      setSiteTitle(settings.siteTitle || 'LI Cell Media Hub');
      setNotice(settings.siteNotice || '');
      setNoticeActive(settings.noticeActive || false);
      setNoticeType(settings.noticeType || 'info');
  }, [settings]);

  const handleSave = () => {
      updateSettings({
          siteTitle,
          siteNotice: notice,
          noticeActive,
          noticeType
      });
      showToast('সেটিংস আপডেট করা হয়েছে!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-700">
                <PenTool size={24} className="text-pink-600"/> ব্র্যান্ডিং ও অ্যানাউন্সমেন্ট
            </h3>

            <div className="space-y-8">
                
                {/* Site Identity */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm uppercase flex items-center gap-2"><Globe size={16}/> সাইট পরিচিতি</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">সাইট টাইটেল</label>
                            <div className="relative">
                                <input 
                                    className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                    value={siteTitle}
                                    onChange={e => setSiteTitle(e.target.value)}
                                    placeholder="LI Cell Media Hub"
                                />
                                <Type size={18} className="absolute left-3 top-3.5 text-gray-400"/>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">ব্রাউজার ট্যাবে এই নামটি দেখাবে।</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">লোগো পরিবর্তন</label>
                            <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/30">
                                <img src="./logo.png" alt="Current Logo" className="w-10 h-10 rounded-full border shadow-sm"/>
                                <div className="text-xs text-gray-500">
                                    লোগো পরিবর্তন করতে <code>public/logo.png</code> ফাইলটি রিপ্লেস করুন।
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Announcement System */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm uppercase flex items-center gap-2"><Megaphone size={16}/> গ্লোবাল নোটিশ / অ্যানাউন্সমেন্ট</h4>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">নোটিশ স্ট্যাটাস</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={noticeActive} onChange={e => setNoticeActive(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">নোটিশের ধরন</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setNoticeType('info')} className={`flex-1 py-2 rounded text-xs font-bold border transition ${noticeType === 'info' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>Info (Blue)</button>
                                    <button onClick={() => setNoticeType('warning')} className={`flex-1 py-2 rounded text-xs font-bold border transition ${noticeType === 'warning' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}>Warning (Orange)</button>
                                    <button onClick={() => setNoticeType('alert')} className={`flex-1 py-2 rounded text-xs font-bold border transition ${noticeType === 'alert' ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}>Alert (Red)</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">মেসেজ</label>
                                <textarea 
                                    className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                    rows={3}
                                    placeholder="নোটিশ লিখুন..."
                                    value={notice}
                                    onChange={e => setNotice(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} className="bg-pink-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-pink-700 transition flex items-center gap-2">
                        <Save size={18}/> সেভ করুন
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BrandingManager;
