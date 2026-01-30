
import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, X, FileText } from 'lucide-react';

interface WordData {
  text: string;
  value: number;
}

const WordCloudGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [words, setWords] = useState<WordData[]>([]);

  // Common Bengali Stop Words
  const stopWords = new Set([
    'এই', 'কি', 'না', 'হয়', 'ও', 'এবং', 'থেকে', 'করে', 'করা', 'আছে', 
    'জন্য', 'নে', 'হল', 'তবে', 'তাই', 'যে', 'কে', 'বা', 'তার', 'এর',
    'উপর', 'দিয়ে', 'যা', 'তা', 'সে', 'হলো', 'হয়েছে', 'বলেন', 'বল',
    'নিয়ে', 'পর', 'কোন', 'কিছু', 'করতে', 'সাথে', 'কিন্তু', 'যদি', 'এখন',
    'সব', 'সহ', 'মধ্যে', 'একটি', 'আজ', 'গতকাল', 'আগামীকাল', 'পর্যন্ত',
    'কারণে', 'দিকে', 'যখন', 'তখন', 'আর', 'আরও', 'খুব', 'বেশি', 'কম',
    'হত', 'হলে', 'হয়ে', 'গেল', 'গেছে', 'যায়', 'যাবে'
  ]);

  const generateCloud = () => {
    if (!inputText.trim()) {
      setWords([]);
      return;
    }

    // Cleaning and tokenizing
    const tokens = inputText
      .replace(/[.,/#!$%^&*;:{}=\-_`~()।]/g, "") // Remove punctuation
      .replace(/\s{2,}/g, " ") // Collapse whitespace
      .toLowerCase()
      .split(" ");

    const counts: Record<string, number> = {};

    tokens.forEach(token => {
      const word = token.trim();
      if (word.length > 1 && !stopWords.has(word)) {
        counts[word] = (counts[word] || 0) + 1;
      }
    });

    // Convert to array and sort
    const wordArray = Object.keys(counts)
      .map(key => ({ text: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // Top 50 words

    setWords(wordArray);
  };

  const getFontSize = (value: number, max: number) => {
    // Linear scaling: Min 12px, Max 40px
    const minSize = 12;
    const maxSize = 40;
    if (max === 1) return (minSize + maxSize) / 2;
    return minSize + ((value - 1) / (max - 1)) * (maxSize - minSize);
  };

  const maxCount = words.length > 0 ? words[0].value : 0;

  const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#db2777', '#0891b2'];

  return (
    <div className="h-full flex flex-col gap-4 animate-slideUp">
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* Input Section */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
            <h3 className="font-bold dark:text-white flex items-center gap-2 mb-2">
              <FileText size={18} className="text-blue-500"/> সোর্স টেক্সট
            </h3>
            <textarea 
              className="flex-1 w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:text-white outline-none resize-none text-sm"
              placeholder="এখানে রিপোর্ট বা আর্টিকেলের টেক্সট পেস্ট করুন..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-2 mt-3">
              <button 
                onClick={() => { setInputText(''); setWords([]); }}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 bg-gray-100 dark:bg-gray-700 rounded-lg transition"
              >
                <X size={14}/> রিসেট
              </button>
              <button 
                onClick={generateCloud}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2 shadow-md"
              >
                <RefreshCw size={14}/> জেনারেট করুন
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="w-full md:w-2/3">
          <div className="h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 relative overflow-hidden flex items-center justify-center">
            {words.length === 0 ? (
              <div className="text-center text-gray-400">
                <Cloud size={64} className="mx-auto mb-3 opacity-20"/>
                <p className="text-sm">টেক্সট ইনপুট দিয়ে জেনারেট করুন</p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center content-center gap-2 h-full overflow-y-auto custom-scrollbar">
                {words.map((w, i) => (
                  <span 
                    key={i}
                    style={{ 
                      fontSize: `${getFontSize(w.value, maxCount)}px`,
                      color: colors[i % colors.length],
                      opacity: 0.8 + (w.value / maxCount) * 0.2
                    }}
                    className="font-bold cursor-default hover:scale-110 transition-transform duration-200 select-none inline-block m-1"
                    title={`Count: ${w.value}`}
                  >
                    {w.text}
                  </span>
                ))}
              </div>
            )}
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Cloud size={200} className="text-blue-500"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCloudGenerator;
