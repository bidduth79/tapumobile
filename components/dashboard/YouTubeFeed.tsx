
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Youtube, RefreshCw, PlayCircle, Calendar, Clock, Trash2, AlertCircle, Wifi, Activity, Search, Filter, CheckCheck, Grid, List, Settings, Volume2, VolumeX, LayoutTemplate, MonitorPlay, Maximize, Minimize, Plus, X, ArrowLeft, FilterX, Home, GripVertical, CircleDot, Play, Pause, Timer, Save, Download, Tv, Edit, ListPlus, Mic, MessageSquare, Layout, Grid3x3, Square, PenTool, Send, Loader2, Video, Headphones, ChevronDown } from 'lucide-react';
import { getApiBaseUrl, formatTimeAgo } from '../../utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp, MonitorChannel } from '../../store';

// Helper for Bengali Digits
const toBanglaDigit = (num: number) => num.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

// --- HLS PLAYER COMPONENT ---
const HlsPlayer: React.FC<{ src: string, autoPlay?: boolean, muted?: boolean, className?: string }> = ({ src, autoPlay = true, muted = true, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (!(window as any).Hls) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
            script.async = true;
            script.onload = () => initPlayer();
            document.body.appendChild(script);
        } else {
            initPlayer();
        }

        function initPlayer() {
            const Hls = (window as any).Hls;
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if(autoPlay) video.play().catch(() => {});
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
                video.addEventListener('loadedmetadata', () => {
                    if(autoPlay) video.play().catch(() => {});
                });
            }
        }
    }, [src]);

    return (
        <video 
            ref={videoRef} 
            className={className} 
            controls
            muted={muted} 
            autoPlay={autoPlay} 
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
    );
};

interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    channel: string;
    publishedAt: string;
    description: string;
    url: string;
}

// Config for Slots (Visual arrangement)
interface SlotConfig {
    channel_id: string;
    name: string;
    type: 'youtube' | 'iptv';
    note?: string; 
}

const DEFAULT_SLOTS: SlotConfig[] = [
    { channel_id: 'UCxH-dK9rL5g5y3w5g', name: 'Somoy TV', type: 'youtube' },
    { channel_id: 'UCel-m0q8qJ5qJ5qJ5qJ5qJ5', name: 'Jamuna TV', type: 'youtube' },
    { channel_id: 'UCnz6h3QyT9sJ3s8K1s8K1s8', name: 'Ekattor TV', type: 'youtube' },
    { channel_id: 'UC1w2w3w4w5w6w7w8w9w0w1w', name: 'Independent', type: 'youtube' },
    { channel_id: 'UC_s0sXj1jL5g5y3w5g', name: 'Channel i', type: 'youtube' },
    { channel_id: 'UCw6hF_5gE74a5_dI89G-9gQ', name: 'Tritiyo Matra', type: 'youtube' },
    { channel_id: 'UCtqvtAVmad5zywaziN6CbfA', name: 'ATN News', type: 'youtube' },
    { channel_id: 'UCN6sm8iHiPd0cnoUardDAnw', name: 'DBC News', type: 'youtube' },
    { channel_id: 'UCnBqX7x8n1', name: 'RTV', type: 'youtube' }, 
];

const YouTubeFeed: React.FC = () => {
  const { settings, setActiveToolTab, setToolWindowState, monitorChannels, fetchMonitorChannels, addMonitorChannel, deleteMonitorChannel, updateSettings, user, logAction } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isFullScreenPage = location.pathname.includes('latest_updates');

  // --- STATES ---
  const [ytVideos, setYtVideos] = useState<VideoItem[]>(() => {
      try { return JSON.parse(localStorage.getItem('app_yt_videos') || '[]'); } catch { return []; }
  });
  const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(() => {
      try { return new Set(JSON.parse(localStorage.getItem('app_yt_watched') || '[]')); } catch { return new Set(); }
  });
  
  const [mode, setMode] = useState<'feed' | 'newsroom'>('feed');
  const [newsroomSource, setNewsroomSource] = useState<'youtube' | 'iptv'>('youtube');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'focus' | '3x3' | '1+5'>('grid');
  
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{user: string, text: string, time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [activeApiKey, setActiveApiKey] = useState<string>(() => {
      if (settings.youtubeApiKey && settings.youtubeApiKey.length > 5) {
          try {
              const parsed = JSON.parse(settings.youtubeApiKey);
              if (Array.isArray(parsed)) return parsed[0]?.key || '';
          } catch { return settings.youtubeApiKey; }
      }
      return localStorage.getItem('app_yt_active_key') || '';
  });

  const [ytSlots, setYtSlots] = useState<SlotConfig[]>(DEFAULT_SLOTS);
  const [iptvSlots, setIptvSlots] = useState<SlotConfig[]>(Array(9).fill({ channel_id: '', name: 'Empty', type: 'iptv' }));

  useEffect(() => {
      if (settings.newsroom_yt_slots) {
          try { 
              const loaded = JSON.parse(settings.newsroom_yt_slots); 
              if (loaded.length < 9) {
                  const filled = [...loaded, ...Array(9 - loaded.length).fill({ channel_id: '', name: 'Empty', type: 'youtube' })];
                  setYtSlots(filled);
              } else {
                  setYtSlots(loaded);
              }
          } catch {}
      }
      if (settings.newsroom_iptv_slots) {
          try { setIptvSlots(JSON.parse(settings.newsroom_iptv_slots)); } catch {}
      }
  }, [settings]);

  const [showChannelConfig, setShowChannelConfig] = useState(false); 
  const [showSourceManager, setShowSourceManager] = useState(false); 
  const [newChName, setNewChName] = useState('');
  const [newChId, setNewChId] = useState('');

  const [focusedChannelIndex, setFocusedChannelIndex] = useState<number>(0); 
  const [mutedAll, setMutedAll] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [loadingYt, setLoadingYt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patrolMode, setPatrolMode] = useState(false);
  const [patrolIntervalMinutes, setPatrolIntervalMinutes] = useState(0.5); 
  const patrolTimerRef = useRef<any>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error' | 'warning'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // --- DIRECT DOWNLOAD STATES ---
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0); // Progress State
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<any>(null);

  const currentSlots = newsroomSource === 'youtube' ? ytSlots : iptvSlots;

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Space') {
              const activeEl = document.activeElement;
              if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                  return;
              }
              e.preventDefault();
              setMutedAll(prev => !prev);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
      fetchMonitorChannels();
      if (ytVideos.length === 0) fetchYoutubeFeed(false);
      else {
          setApiStatus('connected');
          const lastFetch = localStorage.getItem('app_yt_last_fetch');
          setStatusMessage(`অনলাইন (শেষ আপডেট: ${lastFetch ? formatTimeAgo(parseInt(lastFetch)) : 'অজানা'})`);
      }
  }, []);

  useEffect(() => {
      const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Close download menu on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
              setActiveDownloadId(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { localStorage.setItem('app_yt_videos', JSON.stringify(ytVideos)); }, [ytVideos]);
  useEffect(() => { localStorage.setItem('app_yt_watched', JSON.stringify(Array.from(watchedVideoIds))); }, [watchedVideoIds]);
  useEffect(() => { localStorage.setItem('app_yt_active_key', activeApiKey); }, [activeApiKey]);

  useEffect(() => {
      if (patrolMode && mode === 'newsroom') {
          if (layoutMode !== 'focus') setLayoutMode('focus');
          const ms = patrolIntervalMinutes * 60 * 1000;
          patrolTimerRef.current = setInterval(() => {
              setFocusedChannelIndex(prev => (prev + 1) % currentSlots.length);
          }, ms);
      } else {
          clearInterval(patrolTimerRef.current);
      }
      return () => clearInterval(patrolTimerRef.current);
  }, [patrolMode, patrolIntervalMinutes, currentSlots.length, mode]);

  const fetchYoutubeFeed = async (forceRefresh = false) => {
      setLoadingYt(true);
      setApiStatus('checking');
      setStatusMessage('আপডেট চেক করা হচ্ছে...');
      setDebugInfo('');
      
      if (forceRefresh) {
          setFilterDate('');
          setViewFilter('all');
          setFilterChannel('all');
      }
      
      try {
          const keyParam = activeApiKey ? `&key=${encodeURIComponent(activeApiKey)}` : '';
          const refreshParam = forceRefresh ? '&refresh=true' : '';
          
          const res = await fetch(`${getApiBaseUrl()}/youtube_feed.php?t=${Date.now()}${keyParam}${refreshParam}`);
          const text = await res.text();
          let data;
          
          try {
              const firstBrace = text.indexOf('{');
              const lastBrace = text.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1) {
                  const cleanText = text.substring(firstBrace, lastBrace + 1);
                  data = JSON.parse(cleanText);
              } else { throw new Error('Invalid JSON response'); }
          } catch (e) { throw new Error(`Server Error: ${text.substring(0, 100)}...`); }

          if (data && data.success) {
              setApiStatus('connected');
              if (Array.isArray(data.videos)) {
                  setYtVideos(prev => {
                      const existingIds = new Set(prev.map(v => v.id));
                      const newItems = data.videos.filter((v: any) => !existingIds.has(v.id));
                      return [...newItems, ...prev];
                  });
                  localStorage.setItem('app_yt_last_fetch', Date.now().toString());
                  if (data.videos.length > 0) setStatusMessage(`সফল! নতুন ভিডিও এসেছে।`);
                  else setStatusMessage('কোনো নতুন ভিডিও নেই (Up to date)।');
              }
          } else {
              setApiStatus('warning');
              setStatusMessage(data?.message || 'API Limit or Config Error');
              setDebugInfo(JSON.stringify(data?.debug || {}));
          }
      } catch (e: any) {
          setApiStatus('error');
          setStatusMessage('নেটওয়ার্ক এরর');
          setDebugInfo(e.message);
      } finally {
          setLoadingYt(false);
      }
  };

  const processedData = useMemo(() => {
      let filtered = ytVideos;
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(v => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q));
      }
      if (filterChannel !== 'all') filtered = filtered.filter(v => v.channel === filterChannel);
      if (filterDate) {
          const target = new Date(filterDate).toDateString();
          filtered = filtered.filter(v => new Date(v.publishedAt).toDateString() === target);
      }
      if (viewFilter === 'unread') filtered = filtered.filter(v => !watchedVideoIds.has(v.id));
      else if (viewFilter === 'read') filtered = filtered.filter(v => watchedVideoIds.has(v.id));

      filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      const groups: Record<string, VideoItem[]> = {};
      filtered.forEach(video => {
          const date = new Date(video.publishedAt).toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          if (!groups[date]) groups[date] = [];
          groups[date].push(video);
      });
      return { groups, flatList: filtered, count: filtered.length };
  }, [ytVideos, watchedVideoIds, searchQuery, viewFilter, filterChannel, filterDate]);

  const uniqueChannels = useMemo(() => Array.from(new Set(ytVideos.map(v => v.channel))).sort(), [ytVideos]);

  const markAsWatched = (videoId: string) => setWatchedVideoIds(prev => new Set(prev).add(videoId));
  const markAllAsRead = () => {
      const ids = processedData.flatList.map(v => v.id);
      setWatchedVideoIds(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n; });
  };
  const handleVideoClick = (video: VideoItem) => { window.open(video.url, '_blank'); markAsWatched(video.id); };
  const clearArchive = () => { if(window.confirm('আর্কাইভ খালি করতে চান?')) { setYtVideos(prev => prev.filter(v => !watchedVideoIds.has(v.id))); setWatchedVideoIds(new Set()); }};

  const handleAddChannelToLibrary = () => {
      if (!newChName || !newChId) return;
      const type = showSourceManager ? 'youtube' : newsroomSource;
      addMonitorChannel(newChName.trim(), newChId.trim(), type);
      setNewChName(''); setNewChId('');
  };

  const handleDeleteFromLibrary = (id: number) => { if(window.confirm('লাইব্রেরি থেকে মুছতে চান?')) deleteMonitorChannel(id); };

  const updateActiveSlot = (index: number, channelData: MonitorChannel) => {
      const target = newsroomSource === 'youtube' ? [...ytSlots] : [...iptvSlots];
      target[index] = { channel_id: channelData.channel_id, name: channelData.name, type: channelData.type, note: '' };
      if (newsroomSource === 'youtube') { setYtSlots(target); updateSettings({ newsroom_yt_slots: JSON.stringify(target) }); } 
      else { setIptvSlots(target); updateSettings({ newsroom_iptv_slots: JSON.stringify(target) }); }
  };

  const handleNoteChange = (index: number, text: string) => {
      const target = newsroomSource === 'youtube' ? [...ytSlots] : [...iptvSlots];
      target[index].note = text;
      if (newsroomSource === 'youtube') setYtSlots(target); else setIptvSlots(target);
  };

  const handleSendChat = () => {
      if (!chatInput.trim()) return;
      const msg = { user: user?.name || 'Guest', text: chatInput, time: new Date().toLocaleTimeString('bn-BD', {hour: '2-digit', minute: '2-digit'}) };
      setChatMessages(prev => [...prev, msg]); setChatInput('');
  };

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
  };

  const handleRecord = (url: string) => { navigator.clipboard.writeText(url); setActiveToolTab('downloader'); setToolWindowState('open'); };

  const handleDragStart = (e: React.DragEvent, index: number) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault(); if (draggedIndex === null || draggedIndex === dropIndex) return;
      const newSlots = [...currentSlots]; const draggedItem = newSlots[draggedIndex]; const temp = newSlots[dropIndex]; newSlots[dropIndex] = draggedItem; newSlots[draggedIndex] = temp;
      if (newsroomSource === 'youtube') { setYtSlots(newSlots); updateSettings({ newsroom_yt_slots: JSON.stringify(newSlots) }); } 
      else { setIptvSlots(newSlots); updateSettings({ newsroom_iptv_slots: JSON.stringify(newSlots) }); }
      setDraggedIndex(null);
  };

  // --- DIRECT DOWNLOAD LOGIC ---
  const handleDirectDownload = async (video: VideoItem, type: 'video'|'audio', quality: string) => {
      setDownloadingId(video.id);
      setActiveDownloadId(null); // Close menu
      setDownloadProgress(0); // Reset Progress

      // Start Fake Progress Bar
      progressInterval.current = setInterval(() => {
          setDownloadProgress(prev => {
              if (prev >= 90) return 90;
              return prev + Math.random() * 5;
          });
      }, 500);
      
      try {
          const formData = new FormData();
          formData.append('url', video.url);
          formData.append('type', type);
          formData.append('quality', quality);
          // Pass title to set filename
          formData.append('title', video.title);

          const res = await fetch(`${getApiBaseUrl()}/download.php`, {
              method: 'POST',
              body: formData
          });
          const data = await res.json();

          if (data.success && data.download_url) {
              clearInterval(progressInterval.current);
              setDownloadProgress(100);
              logAction('Direct Download', 'success', `${type.toUpperCase()} - ${video.title}`);
              
              // FORCE DOWNLOAD: Navigate current window to the php serve script
              window.location.href = data.download_url;

          } else {
              clearInterval(progressInterval.current);
              setDownloadProgress(0);
              // Show Debug Info in Alert
              alert(`ডাউনলোড ব্যর্থ: ${data.message || 'অজানা ত্রুটি'}\n\nDebug Info: ${data.debug ? data.debug.substring(0, 200) + '...' : 'N/A'}`);
          }
      } catch (e) {
          clearInterval(progressInterval.current);
          setDownloadProgress(0);
          alert('নেটওয়ার্ক বা সার্ভার এরর');
      } finally {
          setDownloadingId(null);
          setDownloadProgress(0);
          clearInterval(progressInterval.current);
      }
  };

  const renderScreen = (slot: SlotConfig, idx: number, isMain: boolean = false) => {
      const isFocused = focusedChannelIndex === idx;
      const shouldMute = mutedAll ? true : (patrolMode ? !isMain : (layoutMode === 'focus' ? !isMain : !isFocused));
      const availableOptions = monitorChannels.filter(c => c.type === newsroomSource);

      return (
          <div 
            key={idx} 
            className={`relative bg-black rounded-lg overflow-hidden border transition-all duration-300 group flex flex-col ${isFocused && layoutMode === 'grid' ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 hover:border-gray-500'} ${isMain ? 'h-full' : ''} ${!isMain && layoutMode === 'focus' ? 'h-full' : ''}`} 
            onClick={() => { setFocusedChannelIndex(idx); if(mutedAll) setMutedAll(false); }}
            onDoubleClick={(e) => {
                const target = e.target as HTMLElement;
                if(target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.tagName === 'INPUT') return;
                const el = e.currentTarget;
                if (!document.fullscreenElement) { if (el.requestFullscreen) el.requestFullscreen(); } else { if (document.exitFullscreen) document.exitFullscreen(); }
            }}
            draggable={!isMain}
            onDragStart={(e) => !isMain && handleDragStart(e, idx)}
            onDragOver={(e) => !isMain && handleDragOver(e, idx)}
            onDrop={(e) => !isMain && handleDrop(e, idx)}
          >
              <div className={`absolute top-0 left-0 w-full bg-gradient-to-b from-black/90 to-transparent p-1 z-30 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity ${isMain || isFocused ? 'opacity-100' : ''}`}>
                  <div className="flex items-center gap-1">
                      {!isMain && <GripVertical size={14} className="text-gray-500 cursor-grab active:cursor-grabbing"/>}
                      <select 
                          className="bg-black/50 text-white text-[10px] border border-gray-600 rounded px-1 max-w-[120px] outline-none"
                          value={slot.channel_id} 
                          onChange={(e) => {
                              const selected = availableOptions.find(opt => opt.channel_id === e.target.value);
                              if (selected) updateActiveSlot(idx, selected);
                          }}
                          onClick={(e) => e.stopPropagation()}
                      >
                          <option value={slot.channel_id}>{slot.name || `Slot ${idx+1}`}</option>
                          {availableOptions.map((opt, i) => (<option key={i} value={opt.channel_id}>{opt.name}</option>))}
                      </select>
                  </div>
                  <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleRecord(`https://www.youtube.com/channel/${slot.channel_id}/live`); }} className="text-red-500 hover:text-white hover:bg-red-600 p-1 rounded-full transition" title="রেকর্ড করুন"><CircleDot size={14}/></button>
                      {newsroomSource === 'iptv' && <span className="text-[8px] bg-blue-600 text-white px-1 rounded">LIVE</span>}
                  </div>
              </div>
              
              <div className="flex-1 w-full relative bg-gray-900 flex items-center justify-center overflow-hidden">
                  {audioOnlyMode && (<div className="absolute inset-0 z-20 bg-gray-900 flex flex-col items-center justify-center text-gray-500"><Mic size={32} className="mb-2 animate-pulse text-green-500"/><span className="text-xs font-bold">Audio Mode</span></div>)}
                  {slot.channel_id ? ( newsroomSource === 'youtube' ? ( <iframe src={`https://www.youtube.com/embed/live_stream?channel=${slot.channel_id}&autoplay=1&mute=${shouldMute ? 1 : 0}&controls=${isMain ? 1 : 0}&modestbranding=1&rel=0`} className={`w-full h-full absolute inset-0 pointer-events-none ${audioOnlyMode ? 'opacity-0' : ''}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={slot.name} ></iframe> ) : ( <HlsPlayer src={slot.channel_id} autoPlay={true} muted={shouldMute} className={`w-full h-full absolute inset-0 ${audioOnlyMode ? 'opacity-0' : ''}`}/> ) ) : ( <div className="text-gray-600 text-xs flex flex-col items-center"><AlertCircle size={24} className="mb-2 opacity-50"/><span>No Signal</span></div> )}
                  {!isMain && layoutMode === 'focus' && <div className="absolute inset-0 z-20 cursor-pointer bg-transparent hover:bg-white/5 transition-colors"></div>}
                  {shouldMute && !audioOnlyMode && <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none group-hover:bg-transparent z-10"><VolumeX size={isMain ? 48 : 24} className="text-white/30 group-hover:hidden"/></div>}
              </div>
              <div className="h-8 bg-black border-t border-gray-800 flex items-center px-1" onClick={e => e.stopPropagation()}>
                  <PenTool size={10} className="text-gray-500 mr-1"/>
                  <input type="text" className="w-full bg-transparent text-[10px] text-gray-300 outline-none placeholder-gray-700" placeholder="নোট লিখুন..." value={slot.note || ''} onChange={(e) => handleNoteChange(idx, e.target.value)} />
              </div>
          </div>
      );
  };

  return (
      <div className={`min-h-screen transition-colors duration-500 ${mode === 'newsroom' ? 'bg-black text-gray-200' : 'bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pb-20'} relative`}>
          {/* ... (Existing Navbar UI) ... */}
          <div className={`flex flex-col xl:flex-row justify-between items-center p-4 rounded-xl shadow-sm border gap-4 sticky z-30 transition-all ${mode === 'newsroom' ? 'bg-gray-900 border-gray-800 top-0' : (isFullScreenPage ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 top-0' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 top-20')}`}>
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <button onClick={() => navigate('/')} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 transition shadow-sm" title="Back to Dashboard"><Home size={20}/></button>
                  {mode === 'newsroom' && (<button onClick={() => setMode('feed')} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 transition" title="Exit Newsroom"><ArrowLeft size={20}/></button>)}
                  <div className="relative">
                      <div className={`p-3 rounded-full ${mode === 'newsroom' ? 'bg-red-900 text-red-500' : 'bg-red-100 text-red-600'}`}>{mode === 'newsroom' ? <Tv size={28}/> : <Youtube size={28}/>}</div>
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-all ${apiStatus === 'connected' ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-600 animate-pulse'}`}></div>
                  </div>
                  <div>
                      <h2 className={`text-xl font-bold flex items-center gap-2 ${mode === 'newsroom' ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{mode === 'newsroom' ? 'নিউজ রুম (LIVE)' : 'ভিডিও মনিটর'}</h2>
                      <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${apiStatus === 'error' ? 'text-red-500' : 'text-gray-500'}`}>{apiStatus === 'connected' ? <Wifi size={12}/> : <Activity size={12}/>}{statusMessage}</p>
                  </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
                  {mode === 'newsroom' ? (
                      <>
                        {/* ... Newsroom Controls ... */}
                        <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                            <button onClick={() => setNewsroomSource('youtube')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${newsroomSource === 'youtube' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Youtube size={14}/> YouTube</button>
                            <button onClick={() => setNewsroomSource('iptv')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${newsroomSource === 'iptv' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><MonitorPlay size={14}/> IPTV</button>
                        </div>
                        <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                            <button onClick={() => setLayoutMode('grid')} className={`p-2 rounded-md transition ${layoutMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400'}`} title="Grid"><Grid size={14}/></button>
                            <button onClick={() => setLayoutMode('3x3')} className={`p-2 rounded-md transition ${layoutMode === '3x3' ? 'bg-gray-600 text-white' : 'text-gray-400'}`} title="3x3 Matrix"><Grid3x3 size={14}/></button>
                            <button onClick={() => setLayoutMode('1+5')} className={`p-2 rounded-md transition ${layoutMode === '1+5' ? 'bg-gray-600 text-white' : 'text-gray-400'}`} title="1+5 Layout"><Layout size={14}/></button>
                            <button onClick={() => setLayoutMode('focus')} className={`p-2 rounded-md transition ${layoutMode === 'focus' ? 'bg-gray-600 text-white' : 'text-gray-400'}`} title="Focus Mode"><LayoutTemplate size={14}/></button>
                        </div>
                        <button onClick={() => setAudioOnlyMode(!audioOnlyMode)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition ${audioOnlyMode ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`} title="ভিডিও বন্ধ করে শুধু অডিও শুনুন (Save Bandwidth)"><Mic size={16}/> {audioOnlyMode ? 'Audio Mode' : 'Video'}</button>
                        <div className="flex items-center gap-2 bg-gray-800 p-1 px-2 rounded-lg border border-gray-700">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="hidden" checked={patrolMode} onChange={(e) => setPatrolMode(e.target.checked)}/>
                                <span className={`text-xs font-bold ${patrolMode ? 'text-green-500' : 'text-gray-400'}`}>Patrol</span>
                                {patrolMode ? <Play size={14} className="text-green-500"/> : <Pause size={14} className="text-gray-500"/>}
                            </label>
                            {patrolMode && (
                                <div className="flex items-center gap-1 border-l border-gray-600 pl-2">
                                    <Timer size={12} className="text-gray-400"/>
                                    <input type="number" className="w-10 bg-black text-white text-[10px] border border-gray-600 rounded px-1 text-center" value={patrolIntervalMinutes} onChange={(e) => setPatrolIntervalMinutes(Number(e.target.value))} min="0.1" step="0.1" />
                                    <span className="text-[9px] text-gray-500">min</span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setMutedAll(!mutedAll)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition ${mutedAll ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-green-900/30 border-green-800 text-green-400'}`}>{mutedAll ? <VolumeX size={16}/> : <Volume2 size={16}/>} {mutedAll ? 'Mute' : 'Sound'}</button>
                        <button onClick={toggleFullScreen} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition ${isFullScreen ? 'bg-gray-700 border-gray-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}>{isFullScreen ? <Minimize size={16}/> : <Maximize size={16}/>}</button>
                        <button onClick={() => setShowChat(!showChat)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition ${showChat ? 'bg-blue-900/50 border-blue-700 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-300'}`}><MessageSquare size={16}/> Chat</button>
                      </>
                  ) : (
                      <>
                          {/* ... Feed Mode Controls ... */}
                          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg border transition ${showFilters ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`} title="Filters"><Filter size={18}/></button>
                          <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                              <button onClick={() => setViewFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewFilter === 'all' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500'}`}>সব (All)</button>
                              <button onClick={() => setViewFilter('unread')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewFilter === 'unread' ? 'bg-white dark:bg-gray-600 shadow text-red-600' : 'text-gray-500'}`}>নতুন (Unread)</button>
                              <button onClick={() => setViewFilter('read')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewFilter === 'read' ? 'bg-white dark:bg-gray-600 shadow text-green-600' : 'text-gray-500'}`}>আর্কাইভ (Read)</button>
                          </div>
                          <div className="relative"><input type="text" placeholder="ভিডিও খুঁজুন..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm w-40 md:w-48 outline-none focus:ring-2 focus:ring-red-500"/><Search className="absolute left-3 top-2.5 text-gray-400" size={16}/></div>
                          <button onClick={() => setShowSourceManager(true)} className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg hover:bg-purple-200 transition border border-purple-200" title="চ্যানেল সোর্স"><ListPlus size={18}/></button>
                          <button onClick={markAllAsRead} className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg hover:bg-green-200 transition border border-green-200" title="Mark All Read"><CheckCheck size={18}/></button>
                          <button onClick={() => setMode('newsroom')} className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg border border-gray-700 text-xs font-bold shadow-lg"><Grid size={14}/> নিউজরুম</button>
                      </>
                  )}
                  <button onClick={() => fetchYoutubeFeed(true)} disabled={loadingYt} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-bold text-sm shadow-md disabled:opacity-50"><RefreshCw size={16} className={loadingYt ? 'animate-spin' : ''} />{loadingYt ? '...' : 'আপডেট'}</button>
              </div>
          </div>

          {/* ... (Keep Feed Filters Panel) ... */}

          {/* Newsroom Content */}
          {mode === 'newsroom' && (
              <div className="flex h-[calc(100vh-100px)] mt-4 gap-4 animate-fadeIn">
                  {/* ... (Existing Newsroom UI) ... */}
                  <div className="flex-1 overflow-hidden">
                      {layoutMode === 'grid' && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-y-auto custom-scrollbar pr-1">{currentSlots.slice(0, 8).map((ch, idx) => renderScreen(ch, idx))}</div>)}
                      {layoutMode === '3x3' && (<div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">{currentSlots.slice(0, 9).map((ch, idx) => renderScreen(ch, idx))}</div>)}
                      {layoutMode === '1+5' && (<div className="grid grid-cols-1 grid-rows-3 gap-4 h-full"><div className="row-span-2 relative bg-black rounded-lg border border-gray-800 overflow-hidden">{renderScreen(currentSlots[focusedChannelIndex], focusedChannelIndex, true)}</div><div className="grid grid-cols-5 gap-2 h-full">{currentSlots.slice(0, 5).map((ch, idx) => (<div key={idx} onClick={() => setFocusedChannelIndex(idx)} className={`cursor-pointer border border-gray-800 rounded-lg overflow-hidden hover:border-red-500 transition ${focusedChannelIndex === idx ? 'ring-2 ring-red-600' : ''}`}>{renderScreen(ch, idx)}</div>))}</div></div>)}
                      {layoutMode === 'focus' && (<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full"><div className="lg:col-span-3 h-full rounded-xl overflow-hidden shadow-2xl border-2 border-red-900 bg-black relative">{renderScreen(currentSlots[focusedChannelIndex], focusedChannelIndex, true)}</div><div className="lg:col-span-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 pb-20">{currentSlots.map((ch, idx) => (<div key={idx} className={`relative cursor-pointer transition-all shrink-0 ${focusedChannelIndex === idx ? 'opacity-100 ring-2 ring-red-500 rounded-lg' : 'opacity-60 hover:opacity-100'}`} style={{ height: '140px' }} onClick={() => setFocusedChannelIndex(idx)}>{renderScreen(ch, idx)}</div>))}</div></div>)}
                  </div>
                  {/* ... (Team Chat) ... */}
                  {showChat && (
                      <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col animate-slideRight">
                          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-800"><h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-blue-500"/> টিম চ্যাট</h3><button onClick={() => setShowChat(false)}><X size={16} className="text-gray-500 hover:text-white"/></button></div>
                          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">{chatMessages.length === 0 && <div className="text-center text-gray-600 text-xs py-10">কোনো বার্তা নেই</div>}{chatMessages.map((msg, i) => (<div key={i} className="flex flex-col text-sm"><div className="flex justify-between items-end mb-1"><span className="font-bold text-blue-400 text-xs">{msg.user}</span><span className="text-[10px] text-gray-600">{msg.time}</span></div><div className="bg-gray-800 text-gray-300 p-2 rounded-lg rounded-tl-none text-xs">{msg.text}</div></div>))}</div>
                          <div className="p-3 border-t border-gray-800 bg-gray-800"><div className="flex gap-2"><input className="flex-1 bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" placeholder="মেসেজ লিখুন..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()}/><button onClick={handleSendChat} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700"><Send size={14}/></button></div></div>
                      </div>
                  )}
              </div>
          )}

          {/* ... (Feed Mode Content) ... */}
          {mode === 'feed' && (
              <div className="space-y-8 mt-6">
                  {/* ... (Existing Feed UI) ... */}
                  {(apiStatus === 'error' || apiStatus === 'warning') && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3"><AlertCircle size={24} className="text-red-600 shrink-0"/><div className="w-full"><h4 className="font-bold text-red-700 dark:text-red-400">সমস্যা রিপোর্ট: {statusMessage}</h4><p className="text-xs text-gray-500 mt-1">লজিক: ১. API কোটা শেষ? ২. চ্যানেল আইডি ভুল? ৩. ফিল্টার চেক করুন।</p>{debugInfo && <div className="text-xs font-mono bg-white/50 p-2 rounded mt-2 text-red-800 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">{debugInfo}</div>}</div></div>
                  )}
                  {processedData.flatList.length === 0 && (
                      <div className="text-center py-20 text-gray-400"><Youtube size={64} className="mx-auto mb-4 opacity-20"/><p className="text-lg font-bold">কোনো ভিডিও নেই</p><p className="text-sm mt-2">চ্যানেল আইডি কনফিগার করুন অথবা রিফ্রেশ করুন।</p><button onClick={() => fetchYoutubeFeed(true)} className="mt-4 text-blue-500 underline text-xs">Force Refresh & Reset Filter</button></div>
                  )}

                  {/* Feed Groups */}
                  {Object.entries(processedData.groups).map(([date, videos], idx) => {
                      const videoList = videos as VideoItem[];
                      return (
                      <div key={idx} className="animate-fadeIn">
                          <div className="sticky top-[85px] z-20 bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm py-2 px-4 mb-4 border-b border-gray-200 dark:border-gray-700 flex justify-between rounded-md shadow-sm">
                              <h3 className="font-bold text-gray-700 dark:text-gray-300 flex gap-2"><Calendar size={16} className="text-red-500"/> {date}</h3>
                              <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">{toBanglaDigit(videoList.length)} টি ভিডিও</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {videoList.map((video) => {
                                  const isWatched = watchedVideoIds.has(video.id);
                                  const isDownloading = downloadingId === video.id;
                                  const isActive = activeDownloadId === video.id;

                                  return (
                                  <div key={video.id} className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border transition-all group relative ${isWatched ? 'opacity-70 grayscale border-gray-200' : 'hover:shadow-lg border-red-100 dark:border-red-900'}`}>
                                      <div className="relative aspect-video bg-gray-200 cursor-pointer" onClick={() => handleVideoClick(video)}>
                                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10"><PlayCircle size={40} className="text-white opacity-80 group-hover:opacity-100"/></div>
                                      </div>
                                      <div className="p-4">
                                          <h3 onClick={() => handleVideoClick(video)} className={`font-bold text-sm line-clamp-2 mb-2 cursor-pointer hover:text-red-600 transition ${isWatched ? 'text-purple-700 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                              {video.title}
                                          </h3>
                                          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">{video.channel}</span> 
                                              <span className="flex items-center gap-1"><Clock size={10}/> {new Date(video.publishedAt).toLocaleTimeString('bn-BD', {hour:'2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          
                                          {/* Direct Download Button with Popup */}
                                          <div className="relative" ref={isActive ? downloadMenuRef : null}>
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); setActiveDownloadId(isActive ? null : video.id); }}
                                                  disabled={isDownloading}
                                                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 transition disabled:opacity-50 overflow-hidden relative"
                                              >
                                                  {isDownloading ? (
                                                      <>
                                                          <div className="absolute left-0 top-0 h-full bg-blue-200/50 transition-all duration-300" style={{width: `${downloadProgress}%`}}></div>
                                                          <Loader2 size={14} className="animate-spin relative z-10"/> 
                                                          <span className="relative z-10">{downloadProgress < 100 ? `ডাউনলোড হচ্ছে... ${Math.round(downloadProgress)}%` : 'সম্পন্ন!'}</span>
                                                      </>
                                                  ) : (
                                                      <>
                                                          <Download size={14}/> ডাউনলোড করুন <ChevronDown size={12}/>
                                                      </>
                                                  )}
                                              </button>

                                              {/* Download Popup Menu */}
                                              {isActive && (
                                                  <div className="absolute bottom-full left-0 w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-600 z-50 mb-2 overflow-hidden animate-slideUp p-1">
                                                      <div className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1">
                                                          <Video size={10}/> ভিডিও ফরম্যাট
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-1 p-1">
                                                          {['1080', '720', '480', '360', '240'].map(q => (
                                                              <button 
                                                                  key={q}
                                                                  onClick={() => handleDirectDownload(video, 'video', q)}
                                                                  className="text-xs py-1.5 px-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 font-bold"
                                                              >
                                                                  {q}p
                                                              </button>
                                                          ))}
                                                      </div>
                                                      
                                                      <div className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-700 flex items-center gap-1 mt-1">
                                                          <Headphones size={10}/> অডিও ফরম্যাট
                                                      </div>
                                                      <div className="flex flex-col gap-1 p-1">
                                                          <button onClick={() => handleDirectDownload(video, 'audio', 'best')} className="text-left text-xs py-1.5 px-2 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded hover:bg-pink-100 dark:hover:bg-pink-900/40 font-bold">
                                                              MP3 Best Quality
                                                          </button>
                                                          <button onClick={() => handleDirectDownload(video, 'audio', 'opus_16k_mono')} className="text-left text-xs py-1.5 px-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 font-bold border border-purple-200 dark:border-purple-800">
                                                              Opus 16kHz Mono (Voice)
                                                          </button>
                                                          <button onClick={() => handleDirectDownload(video, 'audio', '64k')} className="text-left text-xs py-1.5 px-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                                              Low Data (64k)
                                                          </button>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              )})}
                          </div>
                      </div>
                  )})}
              </div>
          )}
      </div>
  );
};

export default YouTubeFeed;