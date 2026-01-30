
import React, { useState } from 'react';
import { FileSearch, Globe, FileText, Database, Lock } from 'lucide-react';

const AutoDorker: React.FC = () => {
  const [target, setTarget] = useState('');

  const dorkTypes = [
    { id: 'files', label: 'পাবলিক ফাইলস (PDF/DOC)', icon: FileText, query: 'site:TARGET filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xls OR filetype:xlsx' },
    { id: 'login', label: 'এডমিন লগিন পেজ', icon: Lock, query: 'site:TARGET inurl:admin OR inurl:login OR inurl:wp-login' },
    { id: 'config', label: 'কনফিগ ফাইল', icon: Database, query: 'site:TARGET ext:xml OR ext:conf OR ext:cnf OR ext:reg OR ext:inf OR ext:rdp OR ext:cfg OR ext:txt OR ext:ini OR ext:env' },
    { id: 'backup', label: 'ব্যাকআপ ফাইল', icon: Database, query: 'site:TARGET ext:bkf OR ext:bkp OR ext:bak OR ext:old OR ext:backup' },
    { id: 'directory', label: 'ডিরেক্টরি লিস্টিং', icon: Globe, query: 'site:TARGET intitle:"index of"' },
    { id: 'subdomains', label: 'সাবডোমেইন', icon: Globe, query: 'site:*.TARGET -www' },
    { id: 'email', label: 'ইমেইল লিস্ট', icon: FileSearch, query: 'site:TARGET intext:"@TARGET"' },
    { id: 'pastebin', label: 'পেস্টবিন লিকস', icon: FileSearch, query: 'site:pastebin.com "TARGET"' },
  ];

  const handleDork = (queryTemplate: string) => {
      if (!target) return;
      const query = queryTemplate.replace(/TARGET/g, target);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slideUp">
        <div className="text-center">
            <FileSearch className="w-12 h-12 text-primary-500 mx-auto mb-2" />
            <h3 className="text-xl font-bold dark:text-white">অটো ডর্কার (Google Dork Generator)</h3>
            <p className="text-xs text-gray-500">টার্গেট ডোমেইন বা নাম দিলে অটোমেটিক অ্যাডভান্সড সার্চ লিংক তৈরি করবে।</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">টার্গেট (ডোমেইন বা নাম)</label>
            <input 
                className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-lg font-mono"
                placeholder="example.com"
                value={target}
                onChange={e => setTarget(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">* কোনো http/https ছাড়া শুধু ডোমেইন বা নাম লিখুন।</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dorkTypes.map(dork => (
                <button 
                    key={dork.id}
                    onClick={() => handleDork(dork.query)}
                    disabled={!target}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                        <dork.icon size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-primary-600"/>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">{dork.label}</h4>
                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{dork.query.replace('TARGET', target || '...')}</p>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );
};

export default AutoDorker;
