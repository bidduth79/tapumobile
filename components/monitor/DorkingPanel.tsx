
import React from 'react';
import { Search, Loader2, Info, ChevronDown } from 'lucide-react';

interface Props {
    dorkKeyword: string;
    setDorkKeyword: (s: string) => void;
    dorkType: string;
    setDorkType: (s: string) => void;
    fetchNews: () => void;
    loading: boolean;
}

const DorkingPanel: React.FC<Props> = ({ dorkKeyword, setDorkKeyword, dorkType, setDorkType, fetchNews, loading }) => {
  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-xl mb-4 animate-slideUp">
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full"><label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 uppercase">কিওয়ার্ড (যেমন: BGB, Confidential)</label><input type="text" value={dorkKeyword} onChange={(e) => setDorkKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchNews()} placeholder="কিওয়ার্ড লিখুন..." className="w-full p-3 rounded-lg border border-purple-200 dark:border-purple-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"/></div>
            <div className="w-full md:w-64"><label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 uppercase">তথ্যের ধরন</label><div className="relative"><select value={dorkType} onChange={(e) => setDorkType(e.target.value)} className="w-full appearance-none p-3 rounded-lg border border-purple-200 dark:border-purple-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm cursor-pointer font-semibold text-sm"><option value="all">সব ধরনের রেজাল্ট (সাধারণ)</option><option value="pdf">PDF ডকুমেন্ট (ফাইল)</option><option value="doc">Word ডকুমেন্ট (DOC/DOCX)</option><option value="excel">Excel শিট (XLS/CSV)</option><option value="image">ছবি / ফটো (JPG/PNG)</option><option value="phone">ফোন নম্বর (০১৭/০১৮...)</option><option value="email">ইমেইল এড্রেস (@gmail...)</option><option value="address">ঠিকানা / লোকেশন</option><option value="confidential">কনফিডেনশিয়াল / গোপন</option><option value="drive">গুগল ড্রাইভ লিংক</option></select><ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/></div></div>
            <button onClick={fetchNews} disabled={!dorkKeyword || loading} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">{loading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18}/>} খুঁজুন (Dork)</button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2"><Info size={12}/> <span>এটি গুগল অ্যাডভান্সড সার্চ ব্যবহার করে গত ১ সপ্তাহের লেটেস্ট তথ্য খুঁজে বের করবে।</span></div>
    </div>
  );
};

export default DorkingPanel;
