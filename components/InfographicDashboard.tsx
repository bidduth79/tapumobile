
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  Activity, TrendingUp, Eye, 
  Filter, BarChart3, Layers, Clock, CheckCircle2,
  Newspaper, Search, CalendarDays, Globe, ShieldAlert, ExternalLink
} from 'lucide-react';
import { analyzeSentiment, toBanglaDigit, translateSource } from './monitor/utils';
import { CollectedArticle } from '../types';

// Helper Component for the Popup with Dynamic Positioning
const NewsPopup = ({ items, colorClass, position = 'top' }: { items: CollectedArticle[], colorClass: string, position?: 'top' | 'bottom' }) => {
    if (!items || items.length === 0) return null;

    // FIX: Use padding (pb-3/pt-3) instead of margin (mb-3/mt-3) to bridge the gap between trigger and content.
    // This ensures the mouse stays "hovered" while moving to the popup.
    const wrapperClass = position === 'top' 
        ? "absolute bottom-full left-0 pb-3" 
        : "absolute top-full left-0 pt-3";

    const arrowClass = position === 'top'
        ? "-bottom-1 border-b border-r" 
        : "-top-1 border-t border-l";

    return (
        <div className={`${wrapperClass} w-72 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none group-hover:pointer-events-auto`}>
            {/* Content Container with Background */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 relative transform ${position === 'top' ? 'translate-y-2' : '-translate-y-2'} group-hover:translate-y-0 transition-transform duration-300`}>
                
                {/* Arrow (Visual only, positioned relative to content box) */}
                <div className={`absolute left-6 w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 ${arrowClass} border-gray-200 dark:border-gray-700`}></div>
                
                <div className="relative z-10 flex flex-col max-h-64 rounded-xl overflow-hidden">
                    <div className={`p-3 border-b border-gray-100 dark:border-gray-700 font-bold text-xs ${colorClass} bg-gray-50 dark:bg-gray-900/50`}>
                        নিউজ তালিকা ({toBanglaDigit(items.length)} টি)
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {items.map((item) => (
                            <a 
                                key={item.id} 
                                href={item.link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group/item transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                            >
                                <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200 line-clamp-2 leading-snug group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400">
                                    {item.title}
                                </p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[9px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                        {translateSource(item.source)}
                                    </span>
                                    <ExternalLink size={10} className="text-gray-300 opacity-0 group-hover/item:opacity-100 transition-opacity"/>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfographicDashboard: React.FC = () => {
  const { collectedNews, keywords } = useApp();
  
  // Helper to get local date string (YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  // State for Filters (Default to Today Local Time)
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [filterType, setFilterType] = useState<'all' | 'monitor' | 'report'>('all');

  // Load Visited Data
  const visitedIdsRaw = localStorage.getItem('report_visited');
  const visitedIds = useMemo(() => new Set(JSON.parse(visitedIdsRaw || '[]')), [visitedIdsRaw, collectedNews]);

  // --- DATA PROCESSING & FILTERING ---
  const { stats, filteredData } = useMemo(() => {
    // 1. Filter by Date (Using Local Time)
    let data = collectedNews.filter(n => {
        // Convert timestamp to Local Date String for comparison
        const itemDateStr = getLocalDateString(new Date(n.timestamp));
        return itemDateStr === selectedDate;
    });

    // 2. Filter by Type (Monitor vs Report) based on Keyword Type
    if (filterType !== 'all') {
        data = data.filter(n => {
            if (n.keyword === 'Free Mode') return true; 
            const kDef = keywords.find(k => k.keyword === n.keyword);
            if (!kDef) return true; 
            return kDef.type === filterType || kDef.type === 'both';
        });
    }

    // 3. Calculate Stats & Lists
    const total = data.length;
    const readList = data.filter(n => visitedIds.has(n.id) || visitedIds.has(n.link));
    const read = readList.length;
    
    const unreadList = data.filter(n => !visitedIds.has(n.id) && !visitedIds.has(n.link));
    const unread = unreadList.length;
    
    // Lists for Popups
    const positiveList: CollectedArticle[] = [];
    const negativeList: CollectedArticle[] = [];
    const neutralList: CollectedArticle[] = [];
    const bgbList: CollectedArticle[] = [];
    
    // BGB Specific Terms
    const bgbTerms = ['bgb', 'bsf', 'border', 'বিজিবি', 'সীমান্ত', 'বিএসএফ'];

    // Aggregations
    const keywordCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    const sourceMap: Record<string, CollectedArticle[]> = {}; // Map to store articles per source
    const hourlyCounts: number[] = new Array(24).fill(0); // Ensure 0-23 index exists

    data.forEach(n => {
        // Sentiment & Lists
        const sent = analyzeSentiment(n.title + ' ' + (n.description || ''));
        if (sent === 'positive') positiveList.push(n);
        else if (sent === 'negative') negativeList.push(n);
        else neutralList.push(n);

        // BGB List
        const text = (n.title + ' ' + n.keyword).toLowerCase();
        if (bgbTerms.some(t => text.includes(t))) bgbList.push(n);

        // Keywords
        const k = n.keyword || 'Others';
        keywordCounts[k] = (keywordCounts[k] || 0) + 1;

        // Sources
        const s = n.source || 'Unknown';
        sourceCounts[s] = (sourceCounts[s] || 0) + 1;
        if (!sourceMap[s]) sourceMap[s] = [];
        sourceMap[s].push(n);

        // Hourly (Local Time)
        const d = new Date(n.timestamp);
        if (!isNaN(d.getTime())) {
            const h = d.getHours();
            if (h >= 0 && h < 24) {
                hourlyCounts[h]++;
            }
        }
    });

    // Sorting Rankings
    const topKeywords = Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a); // REMOVED LIMIT: .slice(0, 5)

    const topSources = Object.entries(sourceCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    // Guaranteed 24 hour timeline
    const timeline = hourlyCounts.map((c, h) => ({ 
        hour: h, 
        count: c,
        label: toBanglaDigit(h) + ':00' 
    }));

    return { 
        stats: { 
            total, read, unread, 
            positive: positiveList.length, negative: negativeList.length, neutral: neutralList.length, 
            bgbCount: bgbList.length, 
            topKeywords, topSources, timeline, sourceMap,
            // Pass Lists for Popups
            positiveList, negativeList, neutralList, bgbList, readList, unreadList
        },
        filteredData: data
    };
  }, [collectedNews, visitedIds, selectedDate, filterType, keywords]);

  // Helper for max value in timeline to scale bars
  const maxTimeline = Math.max(...stats.timeline.map(t => t.count)) || 1;

  return (
    <div className="space-y-6 animate-slideUp mb-8 p-1">
        
        {/* --- HEADER SECTION --- */}
        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-500/30">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-none">মিডিয়া অ্যানালিটিক্স</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">একনজরে আজকের মিডিয়া পরিস্থিতি</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                    {/* Source Filter */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Filter size={14}/></div>
                        <select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:border-blue-400 transition-colors appearance-none min-w-[120px]"
                        >
                            <option value="all">সব সোর্স</option>
                            <option value="monitor">মনিটর</option>
                            <option value="report">রিপোর্ট</option>
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><CalendarDays size={14}/></div>
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                        />
                    </div>

                    <button 
                        onClick={() => setSelectedDate(getLocalDateString())}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        title="আজকের তারিখ"
                    >
                        <Clock size={16}/>
                    </button>
                </div>
            </div>
        </div>

        {/* --- KPI CARDS ROW (POPUPS OPEN DOWNWARDS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total News */}
            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-blue-500 hover:translate-y-[-2px] transition-transform shadow-sm relative group cursor-default hover:z-50">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">মোট সংগ্রহ</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white cursor-pointer hover:text-blue-600 transition-colors">{toBanglaDigit(stats.total)}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">তারিখ: {selectedDate}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <Newspaper size={24}/>
                </div>
                {/* Popup for Total (Opens Down) */}
                <NewsPopup items={filteredData} colorClass="text-blue-600" position="bottom" />
            </div>

            {/* BGB/Border News */}
            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-red-500 hover:translate-y-[-2px] transition-transform shadow-sm relative group cursor-default hover:z-50">
                <div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">বিজিবি / সীমান্ত</p>
                    <h3 className="text-3xl font-black text-red-700 dark:text-red-400 cursor-pointer">{toBanglaDigit(stats.bgbCount)}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">গুরুত্বপূর্ণ সংবাদ</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                    <ShieldAlert size={24}/>
                </div>
                {/* Popup for BGB (Opens Down) */}
                <NewsPopup items={stats.bgbList} colorClass="text-red-600" position="bottom" />
            </div>

            {/* Sentiment Balance */}
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-green-500 hover:translate-y-[-2px] transition-transform shadow-sm relative hover:z-50 overflow-visible">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">সেন্টিমেন্ট</p>
                        <div className="flex items-end gap-1">
                            {/* Positive Popup Trigger */}
                            <div className="relative group cursor-pointer">
                                <h3 className="text-3xl font-black text-green-600 hover:underline decoration-green-300 decoration-2">{toBanglaDigit(stats.positive)}</h3>
                                <NewsPopup items={stats.positiveList} colorClass="text-green-600" position="bottom" />
                            </div>
                            
                            <span className="text-xl font-bold text-gray-300">/</span>
                            
                            {/* Negative Popup Trigger */}
                            <div className="relative group cursor-pointer">
                                <span className="text-lg font-bold text-red-500 mb-1 hover:underline decoration-red-300 decoration-2">{toBanglaDigit(stats.negative)}</span>
                                <NewsPopup items={stats.negativeList} colorClass="text-red-600" position="bottom" />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">পজিটিভ / নেগেটিভ</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                        <TrendingUp size={24}/>
                    </div>
                </div>
                {/* Mini Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 flex overflow-hidden rounded-b-2xl">
                    <div style={{width: `${stats.total > 0 ? (stats.positive/stats.total)*100 : 0}%`}} className="bg-green-500"></div>
                    <div style={{width: `${stats.total > 0 ? (stats.neutral/stats.total)*100 : 0}%`}} className="bg-gray-300 dark:bg-gray-600"></div>
                    <div style={{width: `${stats.total > 0 ? (stats.negative/stats.total)*100 : 0}%`}} className="bg-red-500"></div>
                </div>
            </div>

            {/* Reading Progress */}
            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-purple-500 hover:translate-y-[-2px] transition-transform shadow-sm relative hover:z-50 overflow-visible">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">পঠিত সংবাদ</p>
                    <div className="relative group cursor-pointer inline-block">
                        <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 hover:underline decoration-purple-300">{toBanglaDigit(stats.read)}</h3>
                        <NewsPopup items={stats.readList} colorClass="text-purple-600" position="bottom" />
                    </div>
                    
                    <div className="relative group cursor-pointer inline-block ml-2">
                        <p className="text-[10px] text-gray-400 mt-1 hover:text-gray-600 dark:hover:text-gray-200">বাকি: {toBanglaDigit(stats.unread)}</p>
                        <NewsPopup items={stats.unreadList} colorClass="text-gray-600" position="bottom" />
                    </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                    <Eye size={24}/>
                </div>
            </div>
        </div>

        {/* --- DETAILED CHARTS ROW --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Keyword Ranking */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm lg:col-span-1 flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 border-b pb-2 dark:border-gray-700 shrink-0">
                    <Layers size={18} className="text-indigo-500"/> আলোচিত বিষয় ({toBanglaDigit(stats.topKeywords.length)})
                </h3>
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
                    {stats.topKeywords.length > 0 ? stats.topKeywords.map(([keyword, count], idx) => (
                        <div key={idx} className="relative group cursor-default">
                            <div className="flex justify-between text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                                <span>{keyword}</span>
                                <span>{toBanglaDigit(count)}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-blue-500' : 'bg-gray-400'}`} 
                                    style={{width: `${(count / stats.topKeywords[0][1]) * 100}%`}}
                                ></div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-400 text-xs">কোনো ডাটা নেই</div>
                    )}
                </div>
            </div>

            {/* 2. Timeline Graph */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm lg:col-span-2 flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                    <BarChart3 size={18} className="text-blue-500"/> সময়ভিত্তিক নিউজ প্রবাহ (২৪ ঘণ্টা)
                </h3>
                
                {stats.total > 0 ? (
                    <div className="flex items-end justify-between gap-1 h-full w-full pb-2">
                        {stats.timeline.map((item, idx) => {
                            // Ensure calculation handles zeros and max
                            const height = maxTimeline > 0 ? (item.count / maxTimeline) * 100 : 0;
                            // Highlight active hours
                            const isActive = item.count > 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    <div 
                                        className={`w-full min-w-[4px] rounded-t-sm transition-all duration-500 ${isActive ? 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-400 opacity-90' : 'bg-gray-100 dark:bg-gray-800'}`} 
                                        style={{ height: `${Math.max(height, 5)}%` }} // Force min height for visibility
                                    ></div>
                                    
                                    {/* Tooltip (Graph Popup) */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none transform -translate-x-1/2 left-1/2">
                                        {item.label}: {toBanglaDigit(item.count)} টি
                                        {/* Arrow */}
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
                                    </div>
                                    
                                    {/* Axis Label (Every 3 hours) */}
                                    {item.hour % 3 === 0 && (
                                        <span className="text-[9px] text-gray-400 mt-1 font-mono absolute -bottom-4">{toBanglaDigit(item.hour)}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
                        <Activity size={48} className="mb-2 opacity-20"/>
                        <p>সিলেক্ট করা তারিখে কোনো নিউজ নেই</p>
                        <p className="text-xs mt-1">মনিটর বা রিপোর্ট থেকে নিউজ সংগ্রহ করুন</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- BOTTOM ROW: SOURCES & INFO (POPUPS OPEN UPWARDS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TOP SOURCES */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                    <Globe size={18} className="text-teal-500"/> শীর্ষ নিউজ সোর্স
                </h3>
                <div className="flex flex-wrap gap-2">
                    {stats.topSources.length > 0 ? stats.topSources.map(([source, count], idx) => (
                        <div key={idx} className="relative group cursor-pointer">
                            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 hover:border-teal-300 transition-colors">
                                <div className="bg-white dark:bg-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">{idx + 1}</div>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{translateSource(source)}</span>
                                <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 rounded-md font-bold">{toBanglaDigit(count)}</span>
                            </div>
                            {/* Popup for Source Items (Opens Up) */}
                            <NewsPopup items={stats.sourceMap[source] || []} colorClass="text-teal-600" position="top" />
                        </div>
                    )) : (
                        <span className="text-xs text-gray-400">ডাটা নেই</span>
                    )}
                </div>
            </div>

            {/* TODAY'S HIGHLIGHTS */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900">
                <h3 className="font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2 border-b border-indigo-100 dark:border-gray-700 pb-2">
                    <Search size={18}/> আজকের হাইলাইট
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2 relative group cursor-pointer">
                        <CheckCircle2 size={14} className="text-green-500"/> 
                        <p>মোট সংগ্রহ: <span className="font-bold hover:text-blue-600 underline decoration-dotted">{toBanglaDigit(stats.total)}</span> টি</p>
                        <NewsPopup items={filteredData} colorClass="text-blue-600" position="top" />
                    </div>
                    
                    <div className="flex items-center gap-2 relative group cursor-pointer">
                        <CheckCircle2 size={14} className="text-green-500"/> 
                        <p>পজিটিভ নিউজ: <span className="font-bold hover:text-green-600 underline decoration-dotted">{toBanglaDigit(stats.positive)}</span> টি</p>
                        <NewsPopup items={stats.positiveList} colorClass="text-green-600" position="top" />
                    </div>
                    
                    <div className="flex items-center gap-2 relative group cursor-pointer">
                        <CheckCircle2 size={14} className="text-red-500"/> 
                        <p>বিজিবি সংক্রান্ত: <span className="font-bold text-red-600 hover:text-red-800 underline decoration-dotted">{toBanglaDigit(stats.bgbCount)}</span> টি</p>
                        <NewsPopup items={stats.bgbList} colorClass="text-red-600" position="top" />
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2 italic">* তথ্যগুলো অটোমেটিক অ্যালগরিদমের মাধ্যমে বিশ্লেষণ করা হয়েছে।</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InfographicDashboard;
