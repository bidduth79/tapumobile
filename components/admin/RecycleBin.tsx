
import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { Trash2, RotateCcw, Calendar, Filter, X, CheckSquare, Search, FileText, User, Tag, Rss, Newspaper, Zap } from 'lucide-react';
import { TrashItem } from '../../types';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const RecycleBin: React.FC<Props> = ({ showToast }) => {
  const { trashBin, restoreFromTrash, emptyTrash, deleteForever } = useApp();
  
  const [filterType, setFilterType] = useState<'all' | 'link' | 'user' | 'keyword' | 'feed' | 'news' | 'spotlight'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const filteredItems = useMemo(() => {
      let items = trashBin;

      // Type Filter
      if (filterType !== 'all') {
          items = items.filter(i => i.type === filterType);
      }

      // Date Filter
      if (filterDate) {
          const target = new Date(filterDate).toDateString();
          items = items.filter(i => new Date(i.deletedAt).toDateString() === target);
      }

      // Search Query
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          items = items.filter(i => {
              // Search in data structure depending on type
              if (i.type === 'link') return i.data.title.toLowerCase().includes(q) || i.data.url.includes(q);
              if (i.type === 'user') return i.data.username.toLowerCase().includes(q) || i.data.name.toLowerCase().includes(q);
              if (i.type === 'keyword') return i.data.keyword.toLowerCase().includes(q);
              if (i.type === 'news') return i.data.title.toLowerCase().includes(q);
              if (i.type === 'feed') return i.data.name.toLowerCase().includes(q);
              if (i.type === 'spotlight') return i.data.word.toLowerCase().includes(q);
              return false;
          });
      }

      return items.sort((a, b) => b.deletedAt - a.deletedAt);
  }, [trashBin, filterType, filterDate, searchQuery]);

  const handleRestore = (id: string | number) => {
      restoreFromTrash(id);
      showToast('আইটেম সফলভাবে রিষ্টোর করা হয়েছে', 'success');
  };

  const handleDeleteForever = (id: string | number) => {
      if (window.confirm('আপনি কি নিশ্চিত যে এটি চিরতরে মুছে ফেলতে চান?')) {
          deleteForever(id);
          showToast('আইটেম চিরতরে মুছে ফেলা হয়েছে', 'warning');
      }
  };

  const handleRestoreAll = () => {
      if (filteredItems.length === 0) return;
      if (window.confirm('আপনি কি এই তালিকার সব আইটেম রিষ্টোর করতে চান?')) {
          filteredItems.forEach(i => restoreFromTrash(i.id));
          showToast('সব আইটেম রিষ্টোর করা হয়েছে', 'success');
      }
  };

  const handleEmptyTrash = () => {
      if (trashBin.length === 0) return;
      emptyTrash(); // This handles confirmation internally in store
  };

  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'link': return <FileText size={16} className="text-blue-500"/>;
          case 'user': return <User size={16} className="text-purple-500"/>;
          case 'keyword': return <Tag size={16} className="text-green-500"/>;
          case 'feed': return <Rss size={16} className="text-orange-500"/>;
          case 'news': return <Newspaper size={16} className="text-red-500"/>;
          case 'spotlight': return <Zap size={16} className="text-yellow-500"/>;
          default: return <Trash2 size={16} className="text-gray-500"/>;
      }
  };

  const getItemLabel = (item: TrashItem) => {
      switch(item.type) {
          case 'link': return item.data.title;
          case 'user': return `${item.data.name} (@${item.data.username})`;
          case 'keyword': return item.data.keyword;
          case 'news': return item.data.title;
          case 'feed': return item.data.name;
          case 'spotlight': return item.data.word;
          default: return 'Unknown Item';
      }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fadeIn h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-full text-red-600">
                    <Trash2 size={24}/>
                </div>
                <div>
                    <h3 className="font-bold dark:text-white text-xl">রিসাইকেল বিন (Recycle Bin)</h3>
                    <p className="text-xs text-gray-500">ডিলিট করা আইটেম পুনরুদ্ধার বা চিরতরে মুছুন</p>
                </div>
            </div>
            
            <div className="flex gap-2">
                {filteredItems.length > 0 && (
                    <button 
                        onClick={handleRestoreAll}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                    >
                        <RotateCcw size={16}/> সব রিষ্টোর করুন
                    </button>
                )}
                {trashBin.length > 0 && (
                    <button 
                        onClick={handleEmptyTrash}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-sm"
                    >
                        <Trash2 size={16}/> বিন খালি করুন
                    </button>
                )}
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="relative">
                <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value as any)} 
                    className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-xs font-bold outline-none cursor-pointer hover:border-blue-400 appearance-none min-w-[140px] dark:text-gray-200"
                >
                    <option value="all">সকল ধরণ (All)</option>
                    <option value="link">লিংক / নিউজপেপার</option>
                    <option value="user">ইউজার</option>
                    <option value="keyword">কিওয়ার্ড</option>
                    <option value="news">নিউজ (Report)</option>
                    <option value="feed">RSS Feed</option>
                    <option value="spotlight">স্পটলাইট</option>
                </select>
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
            </div>

            <div className="relative">
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-xs font-bold outline-none cursor-pointer hover:border-blue-400 dark:text-gray-200"
                />
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
            </div>

            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="খুঁজুন..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-xs font-bold outline-none focus:border-blue-400 dark:text-gray-200"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                        <X size={14}/>
                    </button>
                )}
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/20">
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                    <Trash2 size={48} className="mb-4 opacity-20"/>
                    <p className="text-sm font-bold">রিসাইকেল বিন খালি</p>
                    {trashBin.length > 0 && <p className="text-xs mt-1">ফিল্টার পরিবর্তন করে দেখুন</p>}
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 sticky top-0 z-10 uppercase tracking-wide">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-2">টাইপ</div>
                        <div className="col-span-4">বিবরণ / নাম</div>
                        <div className="col-span-3">ডিলিট সময়</div>
                        <div className="col-span-2 text-right">অ্যাকশন</div>
                    </div>
                    {filteredItems.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-white dark:hover:bg-gray-800 transition-colors group text-sm">
                            <div className="col-span-1 text-center text-gray-400 font-mono text-xs">{idx + 1}</div>
                            <div className="col-span-2 flex items-center gap-2">
                                <span className="bg-white dark:bg-gray-900 p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                                    {getTypeIcon(item.type)}
                                </span>
                                <span className="uppercase text-xs font-bold text-gray-600 dark:text-gray-400">{item.type}</span>
                            </div>
                            <div className="col-span-4 font-medium dark:text-gray-200 truncate" title={getItemLabel(item)}>
                                {getItemLabel(item)}
                            </div>
                            <div className="col-span-3 text-xs text-gray-500 font-mono">
                                {new Date(item.deletedAt).toLocaleString('bn-BD')}
                            </div>
                            <div className="col-span-2 flex justify-end gap-2 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleRestore(item.id)}
                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition border border-green-200" 
                                    title="উইথড্র / রিষ্টোর করুন"
                                >
                                    <RotateCcw size={14}/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteForever(item.id)}
                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-200" 
                                    title="চিরতরে ডিলিট করুন"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default RecycleBin;
