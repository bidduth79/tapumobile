
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { MenuItem, LinkItem } from '../types';
import { 
  UserCog, Menu as MenuIcon, Search, X, ChevronDown, ChevronRight, 
  LayoutGrid, Circle, Activity, FileText, Newspaper, Facebook, Youtube, 
  Tv, Megaphone, Wrench, Smartphone, TrendingUp, Globe, Mic2, LogIn, 
  FolderOpen, Shield, Home, Bell, BrainCircuit, Layers, Flame, Download, 
  Scissors, Video, UserSearch, StickyNote, QrCode, AlignLeft, Timer, 
  Palette, Image, Type, History
} from 'lucide-react';

interface NavItemProps {
  item: MenuItem;
  depth?: number;
  parentPath?: string;
}

const NavItem: React.FC<NavItemProps> = ({ item, depth = 0, parentPath = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToolWindowState } = useApp();
  
  const currentPath = parentPath ? `${parentPath}/${item.id}` : `/${item.id}`;
  const hasChildren = item.subItems && item.subItems.length > 0;
  const groupName = `nav-${item.id}`;
  const isActive = location.pathname === currentPath || location.pathname.startsWith(currentPath + '/');

  const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.id === 'tools' || item.id === 'open_tools') {
        setToolWindowState('open');
        return;
      }
      if (item.id === 'audio_to_text') {
        window.open('http://localhost:3000', '_blank');
        return;
      }
      if (item.id === 'trend_news') {
        navigate('/trend_news');
        return;
      }
      navigate(currentPath);
  };

  const activeColorClass = "border-[#790000] text-[#790000] bg-red-50/50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500 font-extrabold";
  const inactiveColorClass = "border-transparent text-gray-700 dark:text-gray-200 hover:text-[#790000] hover:bg-red-50 dark:hover:bg-gray-800";

  return (
    <div className={`relative group/${groupName} px-1 h-full flex items-center`}>
      <button 
        onClick={handleClick}
        className={`
          px-4 py-2 transition-all duration-200 whitespace-nowrap flex items-center justify-between w-full
          ${depth === 0 ? 'h-12 border-b-4 rounded-t-md text-base font-bold' : 'rounded-md w-full text-sm font-medium'} 
          ${depth === 0 
              ? (isActive ? activeColorClass : inactiveColorClass)
              : (isActive ? 'bg-[#790000] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-slate-700 hover:text-[#790000] dark:hover:text-white')
          }
        `}
      >
        {item.label}
        {hasChildren && (
            depth === 0 ? (
                <ChevronDown size={16} className={`ml-1 transition-transform duration-200 group-hover/${groupName}:rotate-180`} />
            ) : (
                <ChevronRight size={14} className={`ml-auto transition-transform duration-200 group-hover/${groupName}:translate-x-1`} />
            )
        )}
      </button>

      {hasChildren && (
        <div className={`
          absolute opacity-0 invisible group-hover/${groupName}:opacity-100 group-hover/${groupName}:visible transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-lg py-2 min-w-[200px] z-[100]
          ${depth === 0 ? 'top-full left-0 mt-1' : 'top-0 left-full ml-1'}
        `}>
          {item.subItems!.map(sub => (
            <NavItem key={sub.id} item={sub} depth={depth + 1} parentPath={currentPath} />
          ))}
        </div>
      )}
    </div>
  );
};

const getMenuIcon = (id: string, isActive: boolean) => {
    const className = `transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#790000] dark:text-red-400'}`;
    const size = 20;
    switch (id) {
        case 'monitor': return <Activity size={size} className={className} />;
        case 'report_generator': return <FileText size={size} className={className} />;
        case 'newspaper': return <Newspaper size={size} className={className} />;
        case 'facebook': return <Facebook size={size} className={className} />;
        case 'youtube': return <Youtube size={size} className={className} />;
        case 'talkshow': return <Tv size={size} className={className} />;
        case 'propagandist': return <Megaphone size={size} className={className} />;
        case 'tools': return <Wrench size={size} className={className} />;
        case 'trend_news': return <TrendingUp size={size} className={className} />;
        case 'phonebook': return <Smartphone size={size} className={className} />;
        case 'bangla': case 'indian': case 'myanmar': case 'international': return <Globe size={size} className={className} />;
        case 'radio': case 'fb_radio': return <Mic2 size={size} className={className} />;
        default: return <LayoutGrid size={size} className={className} />;
    }
};

const DrawerItem: React.FC<{ 
  item: MenuItem; links: LinkItem[]; depth?: number; onClose: () => void; ancestors?: string[];
}> = ({ item, links, depth = 0, onClose, ancestors = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { setToolWindowState } = useApp();

  const hasChildren = item.subItems && item.subItems.length > 0;
  const currentPath = ancestors.length > 0 ? `/${ancestors.join('/')}/${item.id}` : `/${item.id}`;
  const isActive = location.pathname === currentPath || location.pathname.startsWith(currentPath + '/');

  const countItems = () => {
      let count = 0;
      if (ancestors.length === 0) count = links.filter(l => l.category === item.id).length;
      else if (ancestors.length === 1) count = links.filter(l => l.category === ancestors[0] && l.subCategory === item.id).length;
      else if (ancestors.length === 2) count = links.filter(l => l.category === ancestors[0] && l.subCategory === ancestors[1] && l.childCategory === item.id).length;
      return count;
  };
  const itemCount = countItems();

  const handleLeftClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.id === 'tools' || item.id === 'open_tools') { setToolWindowState('open'); onClose(); return; }
      if (item.id === 'audio_to_text') { window.open('http://localhost:3000', '_blank'); return; }
      if (item.id === 'trend_news') { navigate('/trend_news'); onClose(); return; }
      
      if (hasChildren) setIsExpanded(!isExpanded); else { navigate(currentPath); onClose(); }
  };

  const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (item.id === 'tools' || item.id === 'open_tools') setToolWindowState('open'); 
      else if (item.id === 'audio_to_text') window.open('http://localhost:3000', '_blank');
      else if (item.id === 'trend_news') navigate('/trend_news');
      else navigate(currentPath);
      onClose();
  };

  return (
    <div className="w-full select-none">
        <div onClick={handleLeftClick} onContextMenu={handleRightClick} className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all border-l-4 ${isActive ? 'bg-[#790000] border-black text-white shadow-md' : 'border-transparent text-gray-800 dark:text-gray-300 hover:bg-red-50/80 dark:hover:bg-gray-800/80 hover:border-[#790000]'} ${depth > 0 ? 'ml-3 text-sm' : 'font-bold uppercase tracking-wide'}`}>
            <div className="flex items-center gap-3">{depth === 0 ? getMenuIcon(item.id, isActive) : <Circle size={6} fill="currentColor" className={`opacity-70 ${isActive ? 'text-white' : 'text-[#790000] dark:text-red-400'} ${hasChildren ? 'scale-125' : ''}`} />}<span className={isActive ? 'font-bold' : 'font-medium'}>{item.label}</span></div>
            <div className="flex items-center gap-3">{itemCount > 0 && (<span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${isActive ? 'bg-white text-[#790000]' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>{itemCount}</span>)}{hasChildren && (<ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`} />)}</div>
        </div>
        {hasChildren && (<div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}><div className={`border-l-2 ${isActive ? 'border-[#790000]' : 'border-gray-200 dark:border-gray-700'} ml-6 my-1`}>{item.subItems!.map(sub => (<DrawerItem key={sub.id} item={sub} links={links} depth={depth + 1} onClose={onClose} ancestors={[...ancestors, item.id]}/>))}</div></div>)}
    </div>
  );
};

const Navbar: React.FC = () => {
  const { user, setSearchQuery, searchQuery, triggerSearchNav, t, language, setLanguage, menuStructure, links, messages, markMessageRead, setToolWindowState, setActiveToolTab } = useApp();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); triggerSearchNav(); setIsSearchFocused(false); } };
  const clearSearch = () => { setSearchQuery(''); };
  const isSearchActive = searchQuery.length > 0 || isSearchFocused || isSearchHovered;

  const unreadMessages = messages.filter(m => !m.is_read);

  // Tools Configuration
  const tools = [
      { id: 'ai_hub', label: 'AI কমান্ড সেন্টার', icon: BrainCircuit, color: 'text-white', bg: 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md col-span-2' },
      { id: 'duplicate_checker', label: 'ডুপ্লিকেট চেকার', icon: Layers, color: 'text-white', bg: 'bg-gradient-to-br from-orange-600 to-red-600 shadow-md col-span-2' },
      { id: 'trend_news', label: 'trend_news', icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
      { id: 'downloader', label: 'downloader', icon: Download, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
      { id: 'media_editor', label: 'media_editor', icon: Scissors, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
      { id: 'converter', label: 'converter', icon: Video, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
      { id: 'fb_tools', label: 'fb_tools', icon: Facebook, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-800/20' },
      { id: 'fb_audit', label: 'fb_audit', icon: UserSearch, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
      { id: 'notepad', label: 'notepad', icon: StickyNote, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
      { id: 'qr', label: 'qr_code', icon: QrCode, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-200 dark:bg-gray-700' },
      { id: 'text', label: 'text', icon: AlignLeft, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
      { id: 'timer', label: 'timer', icon: Timer, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
      { id: 'color', label: 'color', icon: Palette, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30' },
      { id: 'image', label: 'image', icon: Image, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
      { id: 'unicode', label: 'unicode', icon: Type, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  ];

  const handleToolClick = (toolId: string) => {
      setIsDrawerOpen(false);
      if (toolId === 'ai_hub') {
          navigate('/ai-hub');
      } else if (toolId === 'duplicate_checker') {
          navigate('/duplicate-checker');
      } else if (toolId === 'trend_news') {
          navigate('/trend_news');
      } else {
          setActiveToolTab(toolId);
          setToolWindowState('open');
      }
  };

  return (
    <>
      <header className="h-20 bg-gradient-to-r from-white/95 via-gray-50/95 to-gray-200/95 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 fixed top-0 w-full z-[90] px-4 flex items-center justify-between shadow-md transition-all duration-300">
        
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDrawerOpen(true)} className="p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all border border-gray-300 hover:border-[#790000] dark:border-gray-600 group shadow-sm active:scale-95" title="এলআই সেল মিডিয়া ড্রয়ার (নিউজপেপার)">
            <div className="flex flex-col gap-0.5 items-center px-1">
                <LayoutGrid size={18} className="group-hover:text-[#790000] dark:group-hover:text-red-400 transition-colors"/>
                <span className="text-[9px] font-extrabold text-gray-600 group-hover:text-[#790000] dark:group-hover:text-red-400 uppercase tracking-wider">ড্রয়ার</span>
            </div>
          </button>
          
          <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2 select-none group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#790000] to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-white dark:ring-gray-800 group-hover:scale-105 transition-transform">L</div>
              <div className="hidden md:flex flex-col leading-none">
                  <span className="font-bold text-xl text-gray-800 dark:text-white tracking-tight">এলআই <span className="text-[#790000]">সেল মি</span></span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">নিউজপেপার হাব</span>
              </div>
          </div>
        </div>

        <nav className={`hidden lg:flex absolute top-0 h-full transform -translate-x-1/2 items-center gap-1 transition-all duration-300 ease-in-out ${isSearchActive ? 'left-[44%]' : 'left-1/2'}`}>
          {menuStructure.map(item => (<NavItem key={item.id} item={item} />))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5 ml-auto">
          <div className="relative group" onMouseEnter={() => setIsSearchHovered(true)} onMouseLeave={() => setIsSearchHovered(false)}>
             <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} placeholder={t('search_placeholder')} className={`h-11 rounded-full border border-transparent bg-gray-100/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 font-medium focus:bg-white dark:focus:bg-gray-900 focus:text-gray-900 dark:focus:text-white transition-all duration-300 ease-out pl-11 pr-10 outline-none text-sm cursor-pointer focus:cursor-text hover:ring-2 hover:ring-gray-200 dark:hover:ring-gray-600 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 ${isSearchActive ? 'w-[160px] sm:w-72 bg-white dark:bg-gray-900 shadow-lg ring-2 ring-primary-500/20' : 'w-11'}`}/>
             <div className="absolute left-0 top-0 w-11 h-11 flex items-center justify-center pointer-events-none text-gray-500 dark:text-gray-400 group-focus-within:text-primary-600"><Search size={20} /></div>
             {searchQuery && (<button onClick={clearSearch} className="absolute right-2 top-1/2 transform -translate-x-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all animate-fadeIn"><X size={14} /></button>)}
             
             {/* Search Dropdown / Suggestion Panel */}
             {(isSearchFocused || (isSearchActive && searchQuery)) && (
               <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slideUp">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    <Search size={12}/> {searchQuery ? 'Search Results' : 'Recent Searches'}
                  </div>
                  <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {searchQuery ? (
                      <div className="text-center py-4 text-xs text-gray-400">
                        "{searchQuery}" এর জন্য ড্যাশবোর্ডে ফিল্টার করা হচ্ছে...
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition text-sm text-gray-600 dark:text-gray-300">
                          <History size={14} className="text-gray-400"/> Sample History 1
                        </div>
                      </div>
                    )}
                  </div>
               </div>
             )}
          </div>

          {/* MESSAGE NOTIFICATION */}
          {user && (
              <div className="relative">
                  <button onClick={() => setShowMessageDropdown(!showMessageDropdown)} className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-[#790000] transition hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                      <Bell size={22}/>
                      {unreadMessages.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>}
                  </button>
                  
                  {showMessageDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slideUp">
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                              <h4 className="font-bold text-sm dark:text-white">মেসেজ ({unreadMessages.length})</h4>
                              <button onClick={() => setShowMessageDropdown(false)}><X size={14}/></button>
                          </div>
                          <div className="max-h-64 overflow-y-auto custom-scrollbar">
                              {messages.length > 0 ? messages.map(msg => (
                                  <div key={msg.id} onClick={() => !msg.is_read && markMessageRead(msg.id)} className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${!msg.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                      <div className="flex justify-between mb-1">
                                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{msg.sender}</span>
                                          <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{msg.message}</p>
                                  </div>
                              )) : (
                                  <div className="p-4 text-center text-xs text-gray-400">কোনো মেসেজ নেই</div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          )}

          <button onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center font-bold text-[#790000] shadow-sm transition-all hover:scale-105" title={language === 'bn' ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}>{language === 'bn' ? 'B' : 'E'}</button>
          <button onClick={() => navigate('/admin')} className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-[#790000] transition hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-transparent hover:border-gray-200 dark:hover:border-gray-600" title={user ? t('admin_panel') : 'Login'}>{user ? <UserCog size={22} /> : <LogIn size={22} />}</button>
        </div>
      </header>

      {/* Drawer */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsDrawerOpen(false)}></div>
      <div className={`fixed top-0 left-0 h-full w-1/2 md:w-84 bg-white dark:bg-gray-900 shadow-2xl z-[101] transition-transform duration-300 ease-out transform flex flex-col border-r-[5px] border-[#790000] dark:border-red-900 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute bottom-0 left-0 w-full h-[60%] z-0 pointer-events-none">
              <img src="/drawer-bg.jpg" className="w-full h-full object-cover object-bottom opacity-100" alt="Drawer Footer" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop'; }}/>
              <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col h-full bg-transparent">
              <div className="p-6 bg-black text-white border-b-4 border-[#790000] relative overflow-hidden shrink-0">
                  <div className="absolute right-0 top-0 p-4 opacity-10"><Newspaper size={100} /></div>
                  <div className="relative z-10"><div className="flex justify-between items-start"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#790000] rounded-md flex items-center justify-center font-black text-xl shadow-lg border border-white/20">LI</div><div><h3 className="font-black text-xl leading-none tracking-wide text-white uppercase">এলআই সেল মি</h3><p className="text-[9px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-1">মিডিয়া হাব</p></div></div><button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition text-white"><X size={20}/></button></div><p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1 font-mono bg-white/5 w-fit px-2 py-1 rounded"><Globe size={10}/> {new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-3 bg-gray-50/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 shrink-0 backdrop-blur-sm"><div className="bg-white dark:bg-gray-900 rounded-none border border-gray-300 dark:border-gray-600 p-2 flex items-center gap-2 shadow-sm focus-within:ring-1 focus-within:ring-[#790000] transition-all"><Search size={16} className="text-gray-500"/><input type="text" placeholder="ড্রয়ারে খুঁজুন..." className="bg-transparent text-sm w-full outline-none dark:text-white font-serif" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { setIsDrawerOpen(false); triggerSearchNav(); } }}/></div></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
                    {menuStructure.map(item => (<DrawerItem key={item.id} item={item} links={links} onClose={() => setIsDrawerOpen(false)} />))}
                    
                    {/* Tools Shortcut Grid */}
                    <div className="mt-4 px-4 pb-4">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase border-b border-gray-200 dark:border-gray-700 pb-1">টুলস শর্টকাট</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {tools.map(tool => (
                                <button key={tool.id} onClick={() => handleToolClick(tool.id)} className={`p-2 rounded-lg text-[10px] flex flex-col items-center gap-1 hover:brightness-110 transition shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-600 ${tool.bg} ${tool.color}`}>
                                    <tool.icon size={16} />
                                    <span className="text-center leading-tight font-medium">{tool.id === 'ai_hub' || tool.id === 'duplicate_checker' ? tool.label : t(tool.label)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Status - Hidden on Mobile, Block on Medium+ */}
                    <div className="p-4 mt-4 mx-4 bg-white/80 dark:bg-gray-900/80 rounded border border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-sm hidden md:block">
                        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2 uppercase flex items-center gap-2"><Activity size={12}/> সিস্টেম স্ট্যাটাস</h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-700 dark:text-gray-400 font-mono">
                            <div className="flex items-center gap-1 font-semibold"><Shield size={10} className="text-green-600"/> সার্ভার: অনলাইন</div>
                            <div className="flex items-center gap-1 font-semibold"><Activity size={10} className="text-blue-600"/> লিংক: {links.length}</div>
                        </div>
                    </div>
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-5 text-white z-20 pointer-events-none"><div className="flex items-center gap-2 mb-2"><div className="h-0.5 w-8 bg-[#790000]"></div><span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Media Hub</span></div><h4 className="font-bold text-lg leading-tight text-white/90 drop-shadow-md">সঠিক তথ্য,<br/>সঠিক সময়ে।</h4><p className="text-[9px] text-gray-400 mt-2 opacity-70">&copy; 2024 LI Cell Media Hub • Ver 2.5</p></div>
          </div>
      </div>
    </>
  );
};

export default Navbar;
