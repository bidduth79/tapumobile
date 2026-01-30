
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sun, Moon, Server, Video, Music, Droplets, Wind, MapPin, Download, Facebook, UserSearch, StickyNote, QrCode, AlignLeft, Timer, Palette, Image, Type, Flame, Scissors, ChevronUp, ChevronDown, Bot, BrainCircuit, Layers } from 'lucide-react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    Swal: any;
  }
}

const Sidebar: React.FC = () => {
  const { theme, setTheme, user, t, setToolWindowState, setActiveToolTab, isNavbarVisible } = useApp();
  const [time, setTime] = useState(new Date());
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false); // Collapsed by default
  const navigate = useNavigate();

  // Widget States: 0=Clock, 1=Calendar, 2=Weather, 3=Prayer
  const [widgetView, setWidgetView] = useState<0 | 1 | 2 | 3>(0);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Mock Status
    setServerStatus({
      free_space: 450.5, 
      total_space: 1024,
      server_time: new Date().toISOString(),
      software: 'Local Mode (Static)'
    });

    // Fetch Prayer Times (Dhaka)
    const fetchPrayerTimes = async () => {
        try {
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
            const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=Dhaka&country=Bangladesh&method=1`);
            const data = await res.json();
            if(data.code === 200) {
                setPrayerTimes(data.data.timings);
            }
        } catch(e) {
            setPrayerTimes({ Fajr: '04:15', Dhuhr: '12:05', Asr: '16:15', Maghrib: '18:05', Isha: '19:30' });
        }
    };

    // Fetch Weather
    const fetchWeather = async () => {
        try {
            const apiKey = 'cc0ecb915f49441e8df134144262201';
            const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Dhaka&lang=bn`);
            if (res.ok) {
                const data = await res.json();
                setWeather(data);
            }
        } catch (e) {
            console.error("Weather fetch failed", e);
        }
    };

    fetchPrayerTimes();
    fetchWeather();
    
    const weatherTimer = setInterval(fetchWeather, 1800000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleWidgetClick = () => {
      setWidgetView(prev => (prev + 1) % 4 as any);
  };

  const handleToolClick = (toolId: string) => {
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

  // --- Render Helpers (Calendar, Weather, Prayer) ---
  const renderCalendar = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      
      const days = [];
      for(let i=0; i<firstDay; i++) days.push(<div key={`empty-${i}`} className="h-6"></div>);
      for(let d=1; d<=daysInMonth; d++) {
          const isToday = d === today.getDate();
          days.push(
              <div key={d} className={`h-6 w-6 flex items-center justify-center rounded-full text-[10px] ${isToday ? 'bg-white text-blue-600 font-bold' : 'text-white hover:bg-white/20'}`}>
                  {d}
              </div>
          );
      }

      return (
          <div className="animate-fadeIn w-full">
              <div className="flex items-center justify-center gap-2 mb-2 border-b border-white/20 pb-1">
                  <Calendar size={16} />
                  <span className="font-bold text-sm">{today.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="grid grid-cols-7 text-center gap-1">
                  {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-[10px] font-bold opacity-70">{d}</div>)}
                  {days}
              </div>
          </div>
      );
  };

  const renderWeather = () => {
      if (!weather) return <div className="text-white text-xs">Loading Weather...</div>;
      const { current, location } = weather;
      return (
          <div className="animate-fadeIn flex flex-col items-center justify-center h-full text-white">
              <div className="flex items-center gap-2 mb-1">
                  <MapPin size={12} /> <span className="text-[10px] uppercase tracking-wide">{location.name}</span>
              </div>
              <div className="flex items-center gap-3 mb-1">
                  <img src={`https:${current.condition.icon}`} alt="icon" className="w-14 h-14 filter drop-shadow-md" />
                  <div>
                      <h2 className="text-4xl font-bold leading-none">{Math.round(current.temp_c)}°</h2>
                      <p className="text-[10px] opacity-90 text-right">Feels {Math.round(current.feelslike_c)}°</p>
                  </div>
              </div>
              <p className="text-sm font-medium mb-2">{current.condition.text}</p>
              <div className="flex gap-3 text-[9px] opacity-90 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <span className="flex items-center gap-1"><Droplets size={10}/> {current.humidity}%</span>
                  <span className="flex items-center gap-1"><Wind size={10}/> {Math.round(current.wind_kph)} km/h</span>
              </div>
          </div>
      );
  };

  const renderPrayerTimes = () => {
      if(!prayerTimes) return <div className="text-xs">Loading...</div>;
      const list = [
          { name: 'Fajr', time: prayerTimes.Fajr },
          { name: 'Dhuhr', time: prayerTimes.Dhuhr },
          { name: 'Asr', time: prayerTimes.Asr },
          { name: 'Maghrib', time: prayerTimes.Maghrib },
          { name: 'Isha', time: prayerTimes.Isha },
      ];
      return (
          <div className="animate-fadeIn w-full">
              <div className="flex items-center justify-center gap-2 mb-3 border-b border-white/20 pb-1">
                  <Moon size={16} className="text-yellow-300" />
                  <span className="font-bold text-sm">{t('prayer_times')}</span>
              </div>
              <div className="space-y-1.5">
                  {list.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/10 px-3 py-1 rounded text-xs hover:bg-white/20 transition">
                          <span className="opacity-90">{p.name}</span>
                          <span className="font-mono font-bold">{p.time.split(' ')[0]}</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

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

  return (
    <div className={`hidden lg:flex flex-col w-64 fixed right-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-l border-white/20 dark:border-gray-700 transition-all duration-300 shadow-2xl z-10 ${isNavbarVisible ? 'top-20 h-[calc(100vh-80px)]' : 'top-0 h-screen'}`}>
      
      {/* Scrollable Middle Content */}
      <div className="flex-1 overflow-y-auto p-4 gap-6 flex flex-col custom-scrollbar pb-20">
          
          {/* Widget */}
          <div 
            onClick={handleWidgetClick}
            className="bg-gradient-to-r from-blue-500/90 to-cyan-500/90 rounded-xl p-4 text-white shadow-lg backdrop-blur-sm text-center transform transition hover:scale-105 cursor-pointer min-h-[150px] flex items-center justify-center select-none relative overflow-hidden group shrink-0 border border-white/20"
          >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-20 h-20 bg-black/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-50">
                {[0,1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full ${widgetView === i ? 'bg-white' : 'bg-white/30'}`}></div>)}
            </div>
            {widgetView === 0 && (
                <div className="animate-fadeIn">
                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-90 drop-shadow-md" />
                    <h2 className="text-2xl font-bold font-mono tracking-wide drop-shadow-sm">{time.toLocaleTimeString('bn-BD')}</h2>
                    <p className="text-sm opacity-90 mt-1 flex items-center justify-center gap-2"><Calendar size={12} /> {time.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            )}
            {widgetView === 1 && renderCalendar()}
            {widgetView === 2 && renderWeather()}
            {widgetView === 3 && renderPrayerTimes()}
          </div>

          {/* Tools Shortcut Grid */}
          <div className="glass-panel p-4 rounded-xl shadow-lg flex flex-col shrink-0">
             <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">{t('tools_shortcut')}</h3>
             <div className="grid grid-cols-2 gap-2">
                {tools.map(tool => (
                    <button key={tool.id} onClick={() => handleToolClick(tool.id)} className={`p-3 rounded-lg text-xs flex flex-col items-center gap-1 hover:brightness-110 transition shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-600 ${tool.bg} ${tool.color}`}>
                        <tool.icon size={18} />
                        <span className="text-center leading-tight font-medium">{tool.id === 'ai_hub' || tool.id === 'duplicate_checker' ? tool.label : t(tool.label)}</span>
                    </button>
                ))}
             </div>
          </div>
      </div>

      {/* Sticky Bottom Footer Area with Collapse */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shrink-0 transition-all duration-300 ease-in-out absolute bottom-0 w-full mb-10">
          {/* Toggle Handle */}
          <div 
            onClick={() => setIsFooterExpanded(!isFooterExpanded)}
            className="flex justify-center items-center py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 border-b border-gray-200 dark:border-gray-700"
          >
              {isFooterExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
          </div>

          {/* Collapsible Content */}
          <div className={`overflow-hidden transition-all duration-500 px-4 space-y-3 ${isFooterExpanded ? 'max-h-60 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
              {/* User Info */}
              <div className="flex items-center gap-3 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 p-2 rounded-lg transition" onClick={() => navigate('/app/admin?tab=users')}>
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">{user?.name?.charAt(0) || 'U'}</div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">{t('online')}</p>
                </div>
              </div>

              {/* Server Status */}
              <div className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                  <span className="flex items-center gap-1"><Server size={10}/> Server</span>
                  <span className="font-mono text-green-600 dark:text-green-400">Online</span>
              </div>

              {/* Theme Toggle */}
              <button onClick={toggleTheme} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <span className="flex items-center gap-2 dark:text-white font-medium text-xs">
                  {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} {theme === 'dark' ? t('night_mode') : t('day_mode')}
                </span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </button>
          </div>
      </div>
    </div>
  );
};

export default Sidebar;
