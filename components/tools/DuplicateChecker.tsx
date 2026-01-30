
import React, { useState, useEffect } from 'react';
import { Clipboard, CheckCircle, AlertTriangle, XCircle, Save, Trash2, Search, History, RotateCcw, ArrowRight, Clock, FileText, Send } from 'lucide-react';
import { calculateSimilarity } from '../monitor/utils';
import { toBanglaDigit } from '../news-report/utils';

interface SentItem {
    id: string;
    text: string;
    timestamp: number;
}

interface ProcessedLine {
    text: string;
    status: 'new' | 'duplicate' | 'similar';
    match?: SentItem;
    similarity: number;
}

const DuplicateChecker: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [processedLines, setProcessedLines] = useState<ProcessedLine[]>([]);
  const [history, setHistory] = useState<SentItem[]>(() => {
      try {
          const saved = localStorage.getItem('sent_news_history');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });
  
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
      localStorage.setItem('sent_news_history', JSON.stringify(history));
  }, [history]);

  const handleCheck = () => {
      if (!inputText.trim()) {
          setProcessedLines([]);
          return;
      }

      const lines = inputText.split('\n').filter(l => l.trim().length > 0);
      
      const results: ProcessedLine[] = lines.map(line => {
          let bestMatch: SentItem | undefined;
          let maxSim = 0;

          // Check against history
          for (const item of history) {
              const sim = calculateSimilarity(line, item.text);
              if (sim > maxSim) {
                  maxSim = sim;
                  bestMatch = item;
              }
          }

          let status: 'new' | 'duplicate' | 'similar' = 'new';
          if (maxSim >= 0.85) status = 'duplicate'; // High confidence duplicate
          else if (maxSim >= 0.5) status = 'similar'; // Potential match

          return {
              text: line.trim(),
              status,
              match: bestMatch,
              similarity: maxSim
          };
      });

      setProcessedLines(results);
  };

  const handleSaveToHistory = () => {
      const newItems = processedLines
          .filter(p => p.status === 'new' || p.status === 'similar')
          .map(p => ({
              id: Math.random().toString(36).substr(2, 9),
              text: p.text,
              timestamp: Date.now()
          }));

      if (newItems.length === 0) {
          alert("কোনো নতুন নিউজ নেই সেভ করার মতো।");
          return;
      }

      if (confirm(`${toBanglaDigit(newItems.length)} টি নতুন নিউজ হিস্ট্রিতে যোগ করবেন?`)) {
          setHistory(prev => [...newItems, ...prev]);
          setInputText('');
          setProcessedLines([]);
      }
  };

  const clearHistory = () => {
      if (confirm("পুরো হিস্ট্রি মুছে ফেলতে চান? এটি আর ফেরত পাওয়া যাবে না।")) {
          setHistory([]);
      }
  };

  const getRelativeTime = (ts: number) => {
      const diff = Date.now() - ts;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) return `${toBanglaDigit(Math.floor(hours/24))} দিন আগে`;
      if (hours > 0) return `${toBanglaDigit(hours)} ঘণ্টা আগে`;
      return `${toBanglaDigit(minutes)} মিনিট আগে`;
  };

  const filteredHistory = history.filter(h => h.text.toLowerCase().includes(historySearch.toLowerCase()));

  // Count stats for output header
  const newCount = processedLines.filter(p => p.status === 'new').length;
  const dupCount = processedLines.filter(p => p.status === 'duplicate').length;

  return (
    <div className="h-[calc(100vh-100px)] p-2 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            
            {/* COLUMN 1: INPUT PANEL */}
            <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Clipboard size={18}/> ১. ইনপুট
                    </h3>
                    <button onClick={() => { setInputText(''); setProcessedLines([]); }} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm" title="রিসেট">
                        <RotateCcw size={12}/> Clear
                    </button>
                </div>
                
                <div className="flex-1 p-4 flex flex-col gap-4">
                    <textarea 
                        className="flex-1 w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-mono leading-relaxed"
                        placeholder="আজকের সংগৃহীত নিউজগুলো এখানে পেস্ট করুন (প্রতি লাইনে একটি)..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    ></textarea>

                    <button 
                        onClick={handleCheck}
                        disabled={!inputText.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Search size={18}/> চেক করুন
                    </button>
                </div>
            </div>

            {/* COLUMN 2: OUTPUT PANEL */}
            <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                        <CheckCircle size={18}/> ২. ফলাফল
                    </h3>
                    {processedLines.length > 0 && (
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full border shadow-sm text-gray-600 font-bold">
                            নতুন: {toBanglaDigit(newCount)} | ডুপ্লিকেট: {toBanglaDigit(dupCount)}
                        </span>
                    )}
                </div>

                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-black/20">
                    {processedLines.length > 0 ? (
                        <div className="space-y-3">
                            {processedLines.map((line, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-3 rounded-lg border shadow-sm flex flex-col gap-2 transition-all ${
                                        line.status === 'duplicate' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 
                                        line.status === 'similar' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                                        'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="mt-0.5 shrink-0">
                                            {line.status === 'duplicate' && <XCircle size={18} className="text-red-600"/>}
                                            {line.status === 'similar' && <AlertTriangle size={18} className="text-yellow-600"/>}
                                            {line.status === 'new' && <CheckCircle size={18} className="text-green-600"/>}
                                        </div>
                                        <p className={`text-sm font-medium leading-snug ${line.status === 'duplicate' ? 'text-red-800 dark:text-red-300 line-through opacity-70' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {line.text}
                                        </p>
                                    </div>
                                    {line.match && (
                                        <div className="ml-6 text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-500 flex items-center gap-2">
                                            <History size={12}/> 
                                            <span>
                                                আগে পাঠানো হয়েছে: <span className="font-bold text-gray-700 dark:text-gray-300">{getRelativeTime(line.match.timestamp)}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2">
                            <ArrowRight size={40} className="mb-2"/>
                            <p className="text-sm text-center">বাম পাশে নিউজ পেস্ট করে<br/>'চেক করুন' বাটনে চাপ দিন</p>
                        </div>
                    )}
                </div>

                {/* Bottom Save Action */}
                {processedLines.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                        <button 
                            onClick={handleSaveToHistory}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition"
                        >
                            <Save size={18}/> কনফার্ম & সেভ করুন
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-2">
                            * শুধুমাত্র সবুজ (নতুন) নিউজগুলো ৩নং কলামে সেভ হবে।
                        </p>
                    </div>
                )}
            </div>

            {/* COLUMN 3: HISTORY PANEL */}
            <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <History size={18}/> ৩. পাঠানো নিউজ
                    </h3>
                    {history.length > 0 && (
                        <button onClick={clearHistory} className="text-red-500 hover:bg-red-100 p-1.5 rounded transition" title="হিস্ট্রি ক্লিয়ার করুন">
                            <Trash2 size={14}/>
                        </button>
                    )}
                </div>
                
                {/* Search History */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="হিস্ট্রি খুঁজুন..." 
                            value={historySearch}
                            onChange={e => setHistorySearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400"/>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.slice().reverse().map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition group">
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-3">
                                    {item.text}
                                </p>
                                <div className="mt-2 flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-700">
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                                        <Clock size={10}/> {new Date(item.timestamp).toLocaleString('bn-BD')}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-400 text-xs flex flex-col items-center">
                            <FileText size={32} className="mb-2 opacity-30"/>
                            কোনো পাঠানো নিউজ নেই
                        </div>
                    )}
                </div>
                
                <div className="p-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-center shrink-0">
                    <span className="text-[10px] text-gray-500">মোট পাঠানো হয়েছে: {toBanglaDigit(history.length)} টি</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DuplicateChecker;
