
import React, { useState, useEffect } from 'react';
import { AlignLeft } from 'lucide-react';

const TextAnalyzer: React.FC = () => {
  const [analyzeText, setAnalyzeText] = useState('');
  const [stats, setStats] = useState({ words: 0, chars: 0, sentences: 0, readTime: 0 });

  useEffect(() => {
     const text = analyzeText.trim();
     const words = text ? text.split(/\s+/).length : 0;
     const chars = text.length;
     const sentences = text ? text.split(/[.!?।]+/).length - 1 : 0;
     const readTime = Math.ceil(words / 200); 
     setStats({ words, chars, sentences, readTime });
  }, [analyzeText]);

  return (
    <div className="h-full flex flex-col gap-4 animate-slideUp">
        <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.words}</h4>
                <p className="text-xs text-gray-500">শব্দ</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.chars}</h4>
                <p className="text-xs text-gray-500">অক্ষর</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.sentences}</h4>
                <p className="text-xs text-gray-500">বাক্য</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.readTime}</h4>
                <p className="text-xs text-gray-500">মিনিট (পড়তে)</p>
            </div>
        </div>
        <textarea 
            className="flex-1 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-green-500 outline-none text-sm"
            placeholder="টেক্সট পেস্ট করুন..."
            value={analyzeText}
            onChange={e => setAnalyzeText(e.target.value)}
        ></textarea>
    </div>
  );
};

export default TextAnalyzer;
