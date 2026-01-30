
import React, { useRef, useState, useEffect } from 'react';
import { Newspaper, Facebook, Youtube, Music, Zap, Twitter, MessageCircle, Send, ShieldAlert, Globe, Ghost, FileSearch, HelpCircle, BookOpen, GitMerge, Search, X, CheckCheck, List, LayoutGrid, Plus, StopCircle, RefreshCw, Bot, Info, Eye, EyeOff, CheckSquare, Grid, Filter, MoreHorizontal } from 'lucide-react';
import { MonitorMode } from './types';

interface Props {
    monitorMode: MonitorMode;
    setMonitorMode: (m: MonitorMode) => void;
    loading: boolean;
    stopFetching: () => void;
    fetchNews: () => void;
    localSearch: string;
    setLocalSearch: (s: string) => void;
    searchMatches: string[];
    currentMatchIdx: number;
    handleSearchNav: (e: React.KeyboardEvent) => void;
    groupingEnabled: boolean;
    setGroupingEnabled: (b: boolean) => void;
    viewFilter: string;
    setViewFilter: (v: 'all'|'unread'|'read') => void;
    viewMode: 'grid'|'list';
    setViewMode: (v: 'grid'|'list') => void;
    selectedCount: number;
    handleMarkReadAction: () => void;
    newKeyword: string;
    setNewKeyword: (s: string) => void;
    handleAddKeyword: (e: any) => void;
    setShowBotConfig: (b: boolean) => void;
    setArticles: (a: any[]) => void;
    allSources: string[];
}

const MonitorControls: React.FC<Props> = ({ 
    monitorMode, setMonitorMode, loading, stopFetching, fetchNews,
    localSearch, setLocalSearch, searchMatches, currentMatchIdx, handleSearchNav,
    groupingEnabled, setGroupingEnabled, viewFilter, setViewFilter,
    viewMode, setViewMode, selectedCount, handleMarkReadAction,
    newKeyword, setNewKeyword, handleAddKeyword, setShowBotConfig, setArticles,
    allSources
}) => {
    const [showHelp, setShowHelp] = useState(false);
    const [showSourceList, setShowSourceList] = useState(false);
    
    const helpRef = useRef<HTMLDivElement>(null);
    const sourceRef = useRef<HTMLDivElement>(null);

    const getIcon = () => {
        switch (monitorMode) { case 'facebook': return <Facebook size={20} />; case 'youtube': return <Youtube size={20} />; case 'tiktok': return <Music size={20} />; case 'direct': return <Zap size={20} />; case 'twitter': return <Twitter size={20} />; case 'reddit': return <MessageCircle size={20} />; case 'telegram': return <Send size={20} />; case 'telegram_adv': return <ShieldAlert size={20} />; case 'bing': return <Globe size={20} />; case 'tor': return <Ghost size={20} />; case 'dorking': return <FileSearch size={20} />; default: return <Globe size={20} />; }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(event.target as Node)) setShowHelp(false);
            if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) setShowSourceList(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 md:p-3 shrink-0 z-40 sticky top-16">
            <div className="flex flex-col xl:flex-row justify-between items-center gap-3">
                {/* LEFT: Mode Icon + Title + Help */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600`}>
                        {getIcon()}
                    </div>
                    <div className="flex items-center gap-1 relative">
                        <h2 className="text-lg font-bold dark:text-white leading-none uppercase tracking-wide">মনিটর</h2>
                        <div ref={helpRef}>
                            <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-blue-500 transition" title="গাইডলাইন"><HelpCircle size={14}/></button>
                            {showHelp && (<div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 z-50 text-sm animate-fadeIn"><h4 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2 border-b pb-2 dark:border-gray-700"><BookOpen size={16} className="text-primary-500"/> গাইডলাইন</h4><p className="text-gray-600 dark:text-gray-300 text-xs">রিয়েল-টাইম নিউজ মনিটরিং সিস্টেম।</p></div>)}
                        </div>
                    </div>
                    
                    {/* Add Keyword Mini Form */}
                    <div className="flex relative ml-2 flex-1 xl:flex-none">
                        <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="Add..." className="w-full xl:w-28 pl-2 pr-7 py-1.5 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs outline-none dark:text-white" onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(e)}/>
                        <button onClick={handleAddKeyword} className="bg-gray-200 hover:bg-green-500 hover:text-white text-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 px-2 rounded-r-md transition"><Plus size={14}/></button>
                    </div>
                </div>

                {/* CENTER: Toolbar Groups */}
                <div className="flex flex-wrap items-center gap-2 justify-center w-full xl:w-auto">
                    
                    {/* Group 1: Search */}
                    <div className="relative w-full sm:w-auto">
                        <input type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} onKeyDown={handleSearchNav} placeholder="Find..." className="w-full sm:w-32 pl-7 pr-6 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs focus:ring-1 focus:ring-blue-500 outline-none dark:text-white transition-all"/>
                        <Search className="absolute left-2 top-2 text-gray-400" size={12} />
                        {localSearch && <button onClick={() => setLocalSearch('')} className="absolute right-1 top-1.5 text-gray-400 hover:text-red-500"><X size={12}/></button>}
                        {searchMatches.length > 0 && <span className="absolute right-6 top-2 text-[9px] text-gray-500 font-bold">{currentMatchIdx + 1}/{searchMatches.length}</span>}
                    </div>

                    {/* Group 2: View Toggles (Merged) */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 p-0.5">
                        <button onClick={() => setGroupingEnabled(!groupingEnabled)} className={`p-1.5 rounded transition ${groupingEnabled ? 'bg-white dark:bg-gray-600 text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title={groupingEnabled ? "Smart Group ON" : "Smart Group OFF"}><GitMerge size={16}/></button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
                        <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'text-gray-500 hover:text-gray-700' : 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'}`} title="Change View">{viewMode === 'grid' ? <LayoutGrid size={16}/> : <List size={16}/>}</button>
                    </div>

                    {/* Group 3: Filters (Merged) */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 p-0.5">
                        <button onClick={() => setViewFilter('all')} className={`p-1.5 rounded transition ${viewFilter === 'all' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400'}`} title="All"><Grid size={16}/></button>
                        <button onClick={() => setViewFilter('unread')} className={`p-1.5 rounded transition ${viewFilter === 'unread' ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm' : 'text-gray-400'}`} title="Unread"><EyeOff size={16}/></button>
                        <button onClick={() => setViewFilter('read')} className={`p-1.5 rounded transition ${viewFilter === 'read' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-400'}`} title="Read"><CheckCheck size={16}/></button>
                    </div>

                    {/* Group 4: Actions */}
                    <div className="flex items-center gap-1">
                        <button onClick={handleMarkReadAction} className={`p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 transition`} title="Mark Read"><CheckSquare size={16}/></button>
                        {loading ? (
                            <button onClick={stopFetching} className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition" title="Stop"><StopCircle size={16}/></button>
                        ) : (
                            <button onClick={fetchNews} className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition" title="Refresh"><RefreshCw size={16}/></button>
                        )}
                    </div>
                </div>

                {/* RIGHT: Source Icons & Advanced */}
                <div className="flex items-center gap-2 justify-center xl:justify-end w-full xl:w-auto border-t xl:border-t-0 pt-2 xl:pt-0 border-gray-100 dark:border-gray-700">
                    {/* Sources Row */}
                    <div className="flex bg-gray-50 dark:bg-gray-800 p-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                        <button onClick={() => setMonitorMode('news')} className={`p-1.5 rounded transition ${monitorMode === 'news' ? 'bg-white dark:bg-gray-600 shadow text-red-600' : 'text-gray-400 hover:text-gray-600'}`} title="News"><Newspaper size={14}/></button>
                        <button onClick={() => setMonitorMode('facebook')} className={`p-1.5 rounded transition ${monitorMode === 'facebook' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} title="Facebook"><Facebook size={14}/></button>
                        <button onClick={() => setMonitorMode('youtube')} className={`p-1.5 rounded transition ${monitorMode === 'youtube' ? 'bg-white dark:bg-gray-600 shadow text-red-600' : 'text-gray-400 hover:text-gray-600'}`} title="YouTube"><Youtube size={14}/></button>
                        <button onClick={() => setMonitorMode('tiktok')} className={`p-1.5 rounded transition ${monitorMode === 'tiktok' ? 'bg-white dark:bg-gray-600 shadow text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`} title="TikTok"><Music size={14}/></button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5 my-auto"></div>
                        <button onClick={() => setShowBotConfig(true)} className="p-1.5 text-gray-400 hover:text-purple-500 transition" title="Bot"><Bot size={14}/></button>
                        <button onClick={() => { setMonitorMode('dorking'); setArticles([]); }} className={`p-1.5 rounded transition ${monitorMode === 'dorking' ? 'text-purple-600 bg-white shadow' : 'text-gray-400 hover:text-gray-600'}`} title="Dork"><FileSearch size={14}/></button>
                    </div>
                    
                    {/* Advanced Dropdown Trigger (Optional, kept inline for now to save clicks) */}
                    <div className="relative" ref={sourceRef}>
                        <button onClick={() => setShowSourceList(!showSourceList)} className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-md hover:text-blue-600 transition" title="More Sources"><MoreHorizontal size={16}/></button>
                        {showSourceList && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 animate-fadeIn overflow-hidden">
                                <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                    <button onClick={() => setMonitorMode('direct')} className={`p-1.5 rounded hover:bg-white shadow-sm text-center flex justify-center ${monitorMode === 'direct' ? 'text-orange-600' : 'text-gray-500'}`} title="RSS"><Zap size={14}/></button>
                                    <button onClick={() => setMonitorMode('twitter')} className={`p-1.5 rounded hover:bg-white shadow-sm text-center flex justify-center ${monitorMode === 'twitter' ? 'text-sky-600' : 'text-gray-500'}`} title="Twitter"><Twitter size={14}/></button>
                                    <button onClick={() => setMonitorMode('telegram')} className={`p-1.5 rounded hover:bg-white shadow-sm text-center flex justify-center ${monitorMode === 'telegram' ? 'text-blue-500' : 'text-gray-500'}`} title="Telegram"><Send size={14}/></button>
                                    <button onClick={() => setMonitorMode('tor')} className={`p-1.5 rounded hover:bg-white shadow-sm text-center flex justify-center ${monitorMode === 'tor' ? 'text-gray-800' : 'text-gray-500'}`} title="Tor"><Ghost size={14}/></button>
                                </div>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                                    {allSources.length > 0 ? allSources.map((s, i) => <div key={i} className="px-2 py-1 text-[10px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded truncate cursor-default">{s}</div>) : <div className="text-[10px] text-center text-gray-400 p-2">No sources</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitorControls;
