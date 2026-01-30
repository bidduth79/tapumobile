
// ... imports ...
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp } from '../store';
import { getApiBaseUrl, generateId } from '../utils';
import { Clock, Calendar, CheckCircle, ChevronLeft, ChevronRight, History, Check, ChevronDown, ChevronUp, Bot, Facebook, Youtube, Music, Zap, Twitter, MessageCircle, Send, ShieldAlert, Globe, Ghost, FileSearch, Newspaper, AlertTriangle, X, Loader2, ExternalLink, Filter, Tag, CalendarDays, Megaphone, Trash2, Unlock, Volume2, VolumeX, PanelTopClose, PanelTopOpen } from 'lucide-react';
import { toBanglaDigit, guessRegion, calculateSimilarity, translateSource, analyzeSentiment } from './monitor/utils';
import { Article, MonitorMode } from './monitor/types';
import ArticleCard from './monitor/ArticleCard';
import DorkingPanel from './monitor/DorkingPanel';
import MonitorControls from './monitor/MonitorControls';
import HighlightKeywordMatch from './news-report/HighlightKeyword';

// --- CONFIGURATION ---
const MAX_STORED_ARTICLES = 2000; 
const FETCH_DELAY_MS = 2000; 

// Professional Notification Sound (Base64 for reliability)
const ALERT_SOUND_B64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABi0K2/5oAAJEIpt/zQAAAEAAAAA0AAAAEAAAAA0AAAA//uQZAAABi0K2/5oAAJEIpt/zQAAAEAAAAA0AAAAEAAAAA0AAAA//uQZAAABi0K2/5oAAJEIpt/zQAAAEAAAAA0AAAAEAAAAA0AAAA"; 
// Note: The above is a placeholder. In real app, use a real base64 mp3 string or file url.
// Using a short beep URL for now if base64 is too long for this snippet context.
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const NewsMonitor: React.FC = () => {
  const { keywords, addKeyword, logAction, settings } = useApp();
  
  const [monitorMode, setMonitorMode] = useState<MonitorMode>(() => {
      return (localStorage.getItem('monitor_mode') as MonitorMode) || 'news';
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [dorkKeyword, setDorkKeyword] = useState('');
  const [dorkType, setDorkType] = useState('pdf');
  const [showBotConfig, setShowBotConfig] = useState(false);
  const [botToken, setBotToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
  const [chatId, setChatId] = useState(() => localStorage.getItem('tg_chat_id') || '');
  
  const [articles, setArticles] = useState<Article[]>(() => { 
      try { 
          const saved = localStorage.getItem('monitor_articles'); 
          return saved ? JSON.parse(saved) : []; 
      } catch { return []; } 
  });

  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => { 
      try { 
          const saved = localStorage.getItem('monitor_visited'); 
          return saved ? new Set(JSON.parse(saved)) : new Set(); 
      } catch { return new Set(); } 
  });
  
  const [viewFilter, setViewFilter] = useState<'all' | 'unread' | 'read'>(() => (localStorage.getItem('monitor_viewFilter') as 'all' | 'unread' | 'read') || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('monitor_viewMode') as 'grid' | 'list') || 'grid');
  const [groupingEnabled, setGroupingEnabled] = useState<boolean>(() => localStorage.getItem('monitor_groupingEnabled') !== 'false');
  const [showFilters, setShowFilters] = useState(false);
  const [enableSound, setEnableSound] = useState(true);
  const [showControls, setShowControls] = useState(true); // New State for toggling header
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(() => { const saved = localStorage.getItem('monitor_last_refreshed'); return saved ? new Date(saved) : null; });
  
  const [filterRegion, setFilterRegion] = useState(() => localStorage.getItem('monitor_filterRegion') || 'all');
  const [filterSource, setFilterSource] = useState(() => localStorage.getItem('monitor_filterSource') || 'all');
  const [filterKeyword, setFilterKeyword] = useState(() => localStorage.getItem('monitor_filterKeyword') || 'all');
  const [filterTime, setFilterTime] = useState(() => localStorage.getItem('monitor_filterTime') || 'all');
  const [filterDate, setFilterDate] = useState(''); 
  const [localSearch, setLocalSearch] = useState('');
  
  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const [recentPage, setRecentPage] = useState(1);
  const [archivePage, setArchivePage] = useState(1);
  const itemsPerPage = 50;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchive, setShowArchive] = useState(true);

  // Audio Context for sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      // Ask for notification permission
      if (Notification.permission !== 'granted') {
          Notification.requestPermission();
      }
  }, []);

  const playNotificationSound = () => {
      if (enableSound && audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio blocked', e));
      }
  };

  const triggerDesktopNotification = (count: number, title: string) => {
      if (Notification.permission === 'granted') {
          new Notification('LI Cell Media Hub', {
              body: `${count} টি নতুন নিউজ: ${title}`,
              icon: '/favicon.ico'
          });
      }
  };

  // Auto-refresh logic based on settings
  useEffect(() => {
      let interval: any;
      if (settings.monitorAutoRefresh && settings.monitorRefreshInterval > 0) {
          const ms = settings.monitorRefreshInterval * 60 * 1000;
          interval = setInterval(() => {
              if (!loading) fetchNews();
          }, ms);
      }
      return () => clearInterval(interval);
  }, [settings.monitorAutoRefresh, settings.monitorRefreshInterval]);

  useEffect(() => { localStorage.setItem('monitor_articles', JSON.stringify(articles)); }, [articles]);
  useEffect(() => { localStorage.setItem('monitor_visited', JSON.stringify(Array.from(visitedIds))); }, [visitedIds]);
  useEffect(() => localStorage.setItem('monitor_viewFilter', viewFilter), [viewFilter]);
  useEffect(() => localStorage.setItem('monitor_viewMode', viewMode), [viewMode]);
  useEffect(() => localStorage.setItem('monitor_groupingEnabled', String(groupingEnabled)), [groupingEnabled]);
  useEffect(() => localStorage.setItem('monitor_filterRegion', filterRegion), [filterRegion]);
  useEffect(() => localStorage.setItem('monitor_filterSource', filterSource), [filterSource]);
  useEffect(() => localStorage.setItem('monitor_filterKeyword', filterKeyword), [filterKeyword]);
  useEffect(() => localStorage.setItem('monitor_filterTime', filterTime), [filterTime]);
  useEffect(() => localStorage.setItem('monitor_mode', monitorMode), [monitorMode]);

  // ... (Keep existing useEffects for search nav and pages) ...
  useEffect(() => {
      if (!localSearch.trim()) { setSearchMatches([]); setCurrentMatchIdx(-1); return; }
      const lowerQ = localSearch.toLowerCase();
      const matches = articles.filter(a => 
          a.title.toLowerCase().includes(lowerQ) || 
          a.source.toLowerCase().includes(lowerQ) ||
          (a.description && a.description.toLowerCase().includes(lowerQ))
      ).sort((a, b) => b.timestamp - a.timestamp).map(a => a.id);
      
      setSearchMatches(matches); setCurrentMatchIdx(-1);
  }, [localSearch, articles]);

  useEffect(() => { setRecentPage(1); setArchivePage(1); }, [localSearch, viewFilter, filterRegion, filterSource, filterKeyword, filterTime, filterDate, groupingEnabled, monitorMode]);

  const handleSearchNav = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (searchMatches.length === 0) return;
          const nextIdx = (currentMatchIdx + 1) % searchMatches.length;
          setCurrentMatchIdx(nextIdx);
          const el = document.getElementById(`article-${searchMatches[nextIdx]}`);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-primary-500', 'bg-yellow-50', 'dark:bg-yellow-900/20'); setTimeout(() => { el.classList.remove('ring-2', 'ring-primary-500', 'bg-yellow-50', 'dark:bg-yellow-900/20'); }, 2000); }
      }
  };

  const mapArticleData = (raw: any, keyword: string, mode: string): Article => ({
      id: generateId(), 
      title: raw.title, 
      link: raw.link, 
      date: raw.date, 
      source: raw.source,
      time_ago: raw.time_ago || 'Just now', 
      keyword: keyword, 
      timestamp: new Date(raw.date).getTime(),
      description: raw.description, 
      type: mode as any
  });

  const stopFetching = () => {
      stopRef.current = true;
      setLoading(false);
      setFetchError('ফেচিং বন্ধ করা হয়েছে।');
  };

  const handleClearArticles = () => {
      if(window.confirm('আপনি কি এই মোডের সব নিউজ ক্লিয়ার করতে চান?')) {
          setArticles(prev => prev.filter(a => (a.type || 'news') !== monitorMode));
      }
  };

  const fetchNews = async () => {
    // ... (Keep existing fetch logic) ...
    // Note: I'm keeping the logic brief here to fit context, 
    // but imagine the existing fetchNews logic is preserved.
    // I will just add the Notification trigger at the end.
    
    if (monitorMode === 'dorking' && !dorkKeyword) return;
    let monitorKeywords = keywords.filter(k => k.type === 'monitor' || k.type === 'both');
    
    if (settings.monitorFreeMode) {
        const freeModeTerm = settings.monitorFreeModeLang === 'en' ? 'Bangladesh' : 'বাংলাদেশ';
        monitorKeywords.push({ id: -1, keyword: 'Free Mode', type: 'monitor', variations: [freeModeTerm], color: '#14b8a6', opacity: 1, is_active: true });
    }

    if (monitorKeywords.length === 0 && monitorMode !== 'dorking') { 
        setFetchError("কোনো মনিটর কিওয়ার্ড নেই।");
        return; 
    }
    
    setLoading(true);
    stopRef.current = false;
    setFetchError(null);
    setProgress(0);
    
    const API_BASE = getApiBaseUrl();
    let fetchedCount = 0;
    let newImportantArticles = 0;

    try {
        if (monitorMode === 'dorking') {
            // ... Dorking Logic ...
            const query = dorkKeyword;
            const res = await fetch(`${API_BASE}/news_proxy.php?q=${encodeURIComponent(query)}&type=${monitorMode}&dork_type=${dorkType}&refresh=true&t=${Date.now()}`);
            const data = await res.json();
            if (data && data.success && Array.isArray(data.articles)) {
                const newArticles = data.articles.map((a: any) => mapArticleData(a, dorkKeyword, monitorMode));
                updateArticles(newArticles);
                fetchedCount = newArticles.length;
            }
            setProgress(100);
        } 
        else {
            // ... Master RSS Logic ...
            if (monitorMode === 'news' || monitorMode === 'direct') {
                try {
                    const rssRes = await fetch(`${API_BASE}/rss_handler.php?action=get_master_json`);
                    const rssData = await rssRes.json();
                    
                    if (rssData.success && Array.isArray(rssData.items)) {
                        const rssArticles: Article[] = [];
                        const seenLinks = new Set<string>();

                        rssData.items.forEach((item: any) => {
                            let matchedKeyword: any = null;
                            const text = (item.title + ' ' + (item.description || '')).toLowerCase();
                            
                            if (settings.monitorFreeMode) {
                                matchedKeyword = { keyword: 'Free Mode' };
                            } else {
                                matchedKeyword = monitorKeywords.find(k => {
                                    if (k.id === -1) return false; 
                                    const terms = [k.keyword, ...(k.variations || [])];
                                    return terms.some(t => text.includes(t.toLowerCase()));
                                });
                            }

                            if (matchedKeyword) {
                                if (!seenLinks.has(item.link)) {
                                    seenLinks.add(item.link);
                                    // Check if this article is already in state to avoid duplicate processing for notifications
                                    // Actually, updateArticles handles deduplication, but we want to know if it's NEW
                                    const isReallyNew = !articles.some(a => a.link === item.link);
                                    
                                    if (isReallyNew) {
                                        if (matchedKeyword.keyword === 'BGB' || text.includes('bgb') || text.includes('বিজিবি')) {
                                            newImportantArticles++;
                                        }
                                    }

                                    rssArticles.push({
                                        id: generateId(), title: item.title, link: item.link, date: item.date, source: item.source, 
                                        time_ago: 'Live RSS', keyword: matchedKeyword.keyword, timestamp: new Date(item.date).getTime(),
                                        description: item.description || '', type: monitorMode
                                    });
                                }
                            }
                        });
                        
                        if (rssArticles.length > 0) {
                            updateArticles(rssArticles);
                            fetchedCount += rssArticles.length;
                        }
                    }
                } catch(e) { }
            }

            // ... Google News Logic ...
            if (!stopRef.current && monitorMode !== 'direct') {
                const total = monitorKeywords.length;
                for (let i = 0; i < total; i++) {
                    if (stopRef.current) break;
                    const kObj = monitorKeywords[i];
                    let terms: string[] = [];
                    let query = "";

                    if (kObj.id === -1) {
                        query = kObj.variations[0];
                    } else {
                        terms = [kObj.keyword, ...(kObj.variations || [])];
                        query = terms.join(' OR ');
                        if (settings.monitorStrictMode) query = `"${kObj.keyword}"`; 
                    }

                    try {
                        const refreshParam = settings.monitorForceMode ? '&refresh=true' : '';
                        const url = `${API_BASE}/news_proxy.php?q=${encodeURIComponent(query)}&type=${monitorMode}${refreshParam}&t=${Date.now()}`;
                        const res = await fetch(url);
                        if (res.status === 429) { setFetchError(`Google blocked requests (429).`); stopRef.current = true; break; }
                        const data = await res.json();
                        if (data && data.success && Array.isArray(data.articles)) {
                            const newArticles = data.articles.map((a: any) => mapArticleData(a, kObj.keyword, monitorMode));
                            
                            // Check for notifications
                            newArticles.forEach((a: Article) => {
                                if (!articles.some(ex => ex.link === a.link)) {
                                    const t = (a.title + ' ' + a.keyword).toLowerCase();
                                    if (t.includes('bgb') || t.includes('বিজিবি') || t.includes('ব্রেকিং')) {
                                        newImportantArticles++;
                                    }
                                }
                            });

                            if (newArticles.length > 0) {
                                updateArticles(newArticles);
                                fetchedCount += newArticles.length;
                            }
                        }
                    } catch (innerError) { }
                    setProgress(Math.round(((i + 1) / total) * 100));
                    if (i < total - 1) await delay(FETCH_DELAY_MS);
                }
            }
        }

        if (fetchedCount === 0 && !stopRef.current && !fetchError) {
            setFetchError("কোনো নতুন তথ্য পাওয়া যায়নি।");
        } else if (fetchedCount > 0) {
            // Trigger Notification if important news found
            if (newImportantArticles > 0) {
                playNotificationSound();
                triggerDesktopNotification(newImportantArticles, "গুরুত্বপূর্ণ আপডেট পাওয়া গেছে!");
            }
        }

    } catch (error: any) { 
        setFetchError("নেটওয়ার্ক এরর অথবা সার্ভার রেসপন্স করছে না।");
    } finally {
        setLoading(false);
        const now = new Date();
        setLastRefreshed(now);
        localStorage.setItem('monitor_last_refreshed', now.toISOString());
    }
  };

  const updateArticles = (newBatch: Article[]) => {
      setArticles(prev => {
          // MONITOR FORCE MODE LOGIC
          let uniqueNew = newBatch;
          if (!settings.monitorForceMode) {
              const existingLinks = new Set(prev.map(p => p.link));
              uniqueNew = newBatch.filter(a => !existingLinks.has(a.link));
          }
          if (uniqueNew.length === 0) return prev;
          let combined = [...uniqueNew, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          if (combined.length > MAX_STORED_ARTICLES) combined = combined.slice(0, MAX_STORED_ARTICLES);
          return combined;
      });
  };

  // ... (Rest of component logic) ...
  
  const saveBotConfig = () => { localStorage.setItem('tg_bot_token', botToken); localStorage.setItem('tg_chat_id', chatId); setShowBotConfig(false); alert('বট কনফিগারেশন সেভ হয়েছে!'); };
  const sendToTelegram = useCallback(async (article: Article) => {
      if (!botToken || !chatId) { setShowBotConfig(true); return; }
      const msg = `📰 *${article.title}*\n\n📅 ${article.date}\n🔗 ${article.link}\n\n#NewsMonitor #${article.keyword.replace(/\s+/g, '_')}`;
      try { await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }) }); alert('টেলিগ্রামে সেন্ড হয়েছে!'); } catch (e) { alert('নেটওয়ার্ক এরর'); }
  }, [botToken, chatId]);
  const sendToWhatsApp = useCallback((article: Article) => { const msg = `📰 *${article.title}*\n\n📅 ${article.date}\n🔗 ${article.link}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); }, []);
  const handlePreview = useCallback(async (e: React.MouseEvent, article: Article) => {
      e.stopPropagation(); setPreviewArticle(article); setPreviewContent(''); setPreviewLoading(true);
      setVisitedIds(prev => { if (prev.has(article.link)) return prev; const next = new Set(prev); next.add(article.link); return next; });
      const API_BASE = getApiBaseUrl();
      try { const formData = new FormData(); formData.append('url', article.link); const res = await fetch(`${API_BASE}/fetch_content.php`, { method: 'POST', body: formData }); const data = await res.json(); if (data.success) { setPreviewContent(data.content); } else { setPreviewContent("দুঃখিত, প্রিভিউ লোড করা সম্ভব হয়নি।"); } } catch (err) { setPreviewContent("নেটওয়ার্ক এরর।"); } finally { setPreviewLoading(false); }
  }, []);
  const closePreview = () => { setPreviewArticle(null); setPreviewContent(''); };
  const handleAddKeyword = (e: React.FormEvent) => { e.preventDefault(); if (newKeyword) { addKeyword(newKeyword, 'monitor', [], '#0ea5e9'); setNewKeyword(''); } };
  const handleCardClick = useCallback((article: Article) => { window.open(article.link, '_blank'); setVisitedIds(prev => { if (prev.has(article.link)) return prev; const next = new Set(prev); next.add(article.link); return next; }); }, []);
  const handleSpecificSourceClick = useCallback((e: React.MouseEvent, article: Article) => { e.stopPropagation(); handleCardClick(article); }, [handleCardClick]);
  const handleOpenAllInGroup = useCallback((e: React.MouseEvent, groupArticles: Article[]) => { e.stopPropagation(); groupArticles.forEach(a => { window.open(a.link, '_blank'); }); setVisitedIds(prev => { const newSet = new Set(prev); groupArticles.forEach(a => newSet.add(a.link)); return newSet; }); }, []);
  const toggleSelection = useCallback((e: React.MouseEvent, article: Article) => { e.preventDefault(); setSelectedIds(prev => { const newSet = new Set(prev); if (newSet.has(article.id)) { newSet.delete(article.id); } else { newSet.add(article.id); } return newSet; }); }, []);
  const handleMarkReadAction = () => { if (selectedIds.size > 0) { const selectedArticles = articles.filter(a => selectedIds.has(a.id)); setVisitedIds(prev => { const newSet = new Set(prev); selectedArticles.forEach(a => newSet.add(a.link)); return newSet; }); setSelectedIds(new Set()); } else { setVisitedIds(prev => { const newSet = new Set(prev); articles.forEach(a => newSet.add(a.link)); return newSet; }); } };
  const getKeywordConfig = (keyword: string) => {
      if (keyword === 'Free Mode') return { color: '#14b8a6' };
      return keywords.find(k => k.keyword === keyword);
  };

  const breakingNews = useMemo(() => {
      const specialTerms = ['বিজিবি', 'বিএসএফ', 'সীমান্ত', 'DG BGB', 'BGB', 'BSF', 'ডিজি বিজিবি', 'Border'];
      return articles.filter(a => 
          specialTerms.some(term => 
              a.title.toLowerCase().includes(term.toLowerCase()) || 
              a.keyword.toLowerCase().includes(term.toLowerCase())
          )
      ).slice(0, 15);
  }, [articles]);

  const processedData = useMemo(() => {
      const now = Date.now(); 
      const recentThreshold = 12 * 60 * 60 * 1000; 

      let filteredArticles = articles.filter(a => (a.type || 'news') === monitorMode);
      
      // Filter Logic ... (Keep existing)
      if (localSearch.trim()) { 
          const lowerQ = localSearch.toLowerCase(); 
          filteredArticles = filteredArticles.filter(a => a.title.toLowerCase().includes(lowerQ) || a.source.toLowerCase().includes(lowerQ) || (a.description && a.description.toLowerCase().includes(lowerQ))); 
      }
      if (filterKeyword !== 'all') filteredArticles = filteredArticles.filter(a => a.keyword === filterKeyword);
      if (filterSource !== 'all') filteredArticles = filteredArticles.filter(a => a.source === filterSource);
      if (filterRegion !== 'all') filteredArticles = filteredArticles.filter(a => guessRegion(a.source) === filterRegion);
      if (filterTime !== 'all') { let timeLimit = 0; if (filterTime === '1h') timeLimit = 3600000; else if (filterTime === '6h') timeLimit = 21600000; else if (filterTime === '12h') timeLimit = 43200000; else if (filterTime === '24h') timeLimit = 86400000; if (timeLimit > 0) filteredArticles = filteredArticles.filter(a => (now - a.timestamp) <= timeLimit); }
      if (filterDate) { const targetDate = new Date(filterDate).toDateString(); filteredArticles = filteredArticles.filter(a => new Date(a.timestamp).toDateString() === targetDate); }

      let groupedLists: Article[][] = [];
      if (groupingEnabled) {
          const groups: Article[][] = [];
          filteredArticles.sort((a, b) => b.timestamp - a.timestamp);
          filteredArticles.forEach(art => {
              let addedToGroup = false;
              const recentGroupsToCheck = groups.slice(-50); 
              for (const group of recentGroupsToCheck) {
                  const representative = group[0];
                  // Use improved similarity check
                  const sim = calculateSimilarity(art.title, representative.title);
                  
                  if (sim > 0.4) { // Threshold for grouping
                      group.push(art); addedToGroup = true; break; 
                  }
              }
              if (!addedToGroup) groups.push([art]);
          });
          groupedLists = groups;
      } else { groupedLists = filteredArticles.map(a => [a]); }

      groupedLists.sort((a, b) => Math.max(...b.map(x => x.timestamp)) - Math.max(...a.map(x => x.timestamp)));
      
      const recentGroups: Article[][] = [], archiveGroups: Article[][] = [];
      groupedLists.forEach(group => { 
          const latestArt = group[0]; 
          const isOld = (now - latestArt.timestamp) > recentThreshold; 
          if (isOld) archiveGroups.push(group); else recentGroups.push(group); 
      });

      let finalRecent = recentGroups, finalArchive = archiveGroups;
      if (viewFilter === 'read') { finalRecent = recentGroups.filter(g => g.every(a => visitedIds.has(a.link))); finalArchive = archiveGroups.filter(g => g.every(a => visitedIds.has(a.link))); }
      else if (viewFilter === 'unread') { finalRecent = recentGroups.filter(g => g.some(a => !visitedIds.has(a.link))); finalArchive = archiveGroups.filter(g => g.some(a => !visitedIds.has(a.link))); }

      // ... Stats logic ...
      const recentArticleCount = finalRecent.reduce((acc, g) => acc + g.length, 0);
      const recentReadCount = finalRecent.reduce((acc, g) => acc + g.filter(a => visitedIds.has(a.link)).length, 0);
      const totalArticleCount = filteredArticles.length;
      const totalReadCount = filteredArticles.filter(a => visitedIds.has(a.link)).length;
      const recentTotalPages = Math.ceil(finalRecent.length / itemsPerPage);
      const recentPaginated = finalRecent.slice((recentPage - 1) * itemsPerPage, recentPage * itemsPerPage);
      const archiveTotalPages = Math.ceil(finalArchive.length / itemsPerPage);
      const archivePaginated = finalArchive.slice((archivePage - 1) * itemsPerPage, archivePage * itemsPerPage);

      const organizeByDate = (groups: Article[][]) => {
          const dateGroups: { date: string, items: Article[][] }[] = [];
          groups.forEach(group => {
              const art = group[0]; const dateLabel = new Date(art.timestamp).toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              const lastGroup = dateGroups[dateGroups.length - 1];
              if (lastGroup && lastGroup.date === dateLabel) lastGroup.items.push(group); else dateGroups.push({ date: dateLabel, items: [group] });
          });
          return dateGroups;
      };

      const uniqueSources = Array.from(new Set(filteredArticles.map(a => a.source))).sort();
      const uniqueKeywords = Array.from(new Set(filteredArticles.map(a => a.keyword))).sort();
      const visibleUniqueSources = new Set<string>(); recentGroups.forEach(g => g.forEach(a => visibleUniqueSources.add(a.source)));
      const archiveArticleTotal = finalArchive.reduce((acc, g) => acc + g.length, 0);
      const archiveArticleRead = finalArchive.reduce((acc, g) => acc + g.filter(a => visitedIds.has(a.link)).length, 0);
      const archiveArticleUnread = archiveArticleTotal - archiveArticleRead;

      return { recentGroups: organizeByDate(recentPaginated), archiveGroups: organizeByDate(archivePaginated), recentTotal: finalRecent.length, recentArticleCount, recentReadCount, archiveTotal: finalArchive.length, archiveArticleTotal, recentTotalPages, archiveTotalPages, totalCount: totalArticleCount, totalReadCount, sourceCount: visibleUniqueSources.size, sourceList: Array.from(visibleUniqueSources).sort(), allSources: uniqueSources, allKeywords: uniqueKeywords, archiveReadCount: archiveArticleRead, archiveUnreadCount: archiveArticleUnread };
  }, [articles, visitedIds, localSearch, viewFilter, filterRegion, filterSource, filterKeyword, filterTime, filterDate, groupingEnabled, recentPage, archivePage, monitorMode]);

  const renderArticleList = (dateGroups: { date: string, items: Article[][] }[], isArchive: boolean) => {
      return dateGroups.map((dateGroup, dIdx) => (
          <div key={dIdx} className="mb-6 animate-fadeIn">
              <div className="sticky top-0 z-10 bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm py-2 px-3 mb-3 border-b border-gray-200 dark:border-gray-700 flex items-center shadow-sm rounded-md transition-all">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar size={14}/> {dateGroup.date}
                  </h4>
                  <span className="text-[10px] text-gray-500 ml-auto bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full font-mono">{toBanglaDigit(dateGroup.items.length)} items</span>
              </div>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                  {dateGroup.items.map((group) => {
                      const article = group[0];
                      const isRead = group.every(a => visitedIds.has(a.link));
                      const isSelected = group.some(a => selectedIds.has(a.id));
                      const kConfig = getKeywordConfig(article.keyword);
                      const highlightColor = kConfig?.color || '#0ea5e9';
                      const highlightTerms: string[] = []; 

                      return (
                          <ArticleCard 
                              key={article.id}
                              article={article}
                              group={group}
                              viewMode={viewMode}
                              monitorMode={monitorMode}
                              isRead={isRead}
                              isSelected={isSelected}
                              highlightTerms={highlightTerms}
                              highlightColor={highlightColor}
                              filterText={localSearch}
                              onToggleSelection={toggleSelection}
                              onCardClick={handleCardClick}
                              onPreview={handlePreview}
                              onSourceClick={handleSpecificSourceClick}
                              onOpenGroup={handleOpenAllInGroup}
                              onSendTelegram={sendToTelegram}
                              onSendWhatsApp={sendToWhatsApp}
                          />
                      );
                  })}
              </div>
          </div>
      ));
  };

  // ... (Keep PaginationControls) ...
  const PaginationControls = ({ currentPage, totalPages, setPage }: { currentPage: number, totalPages: number, setPage: (p: number) => void }) => {
      if (totalPages <= 1) return null;
      return (
          <div className="flex justify-center items-center gap-4 py-6 mt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                  onClick={() => setPage(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1}
                  className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-600 dark:text-gray-300"
              >
                  <ChevronLeft size={20}/>
              </button>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                  পৃষ্ঠা {toBanglaDigit(currentPage)} / {toBanglaDigit(totalPages)}
              </span>
              <button 
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))} 
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-600 dark:text-gray-300"
              >
                  <ChevronRight size={20}/>
              </button>
          </div>
      );
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto flex flex-col gap-4 relative">
      {/* --- HEADER TOGGLE BUTTON (ABSOLUTE POSITIONED) --- */}
      <div className="absolute top-2 right-4 z-[100]">
          <button 
            onClick={() => setShowControls(!showControls)} 
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition opacity-80 hover:opacity-100"
            title={showControls ? "হেডার লুকান" : "হেডার দেখান"}
          >
              {showControls ? <PanelTopClose size={16}/> : <PanelTopOpen size={16}/>}
              <span>{showControls ? 'Hide Controls' : 'Show Controls'}</span>
          </button>
      </div>

      {/* ... (Error/Bot/Preview logic same as before) ... */}
      {fetchError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-2 rounded-r shadow-md flex justify-between items-center animate-fadeIn">
              <div className="flex items-center gap-2"><AlertTriangle size={24} /><div><p className="font-bold">সমস্যা হয়েছে</p><p className="text-sm">{fetchError}</p></div></div><button onClick={() => setFetchError(null)} className="text-red-500 hover:bg-red-200 p-1 rounded"><X size={20}/></button>
          </div>
      )}

      {showBotConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 animate-slideUp">
                  <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><Bot size={24} className="text-blue-500"/> টেলিগ্রাম বট সেটআপ</h3>
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Bot Token</label><input type="text" className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white" placeholder="123456:ABC-DEF..." value={botToken} onChange={e => setBotToken(e.target.value)}/></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Chat ID (Channel/Group)</label><input type="text" className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white" placeholder="-100123456789" value={chatId} onChange={e => setChatId(e.target.value)}/></div>
                      <div className="flex justify-end gap-2 pt-2"><button onClick={() => setShowBotConfig(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">বন্ধ করুন</button><button onClick={saveBotConfig} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">সেভ করুন</button></div>
                  </div>
              </div>
          </div>
      )}

      {previewArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={closePreview}>
              <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slideUp relative" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800">
                      <div><span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded mb-2 inline-block">{previewArticle.source}</span><h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug">{previewArticle.title}</h2><p className="text-xs text-gray-500 mt-1 flex items-center gap-2"><Clock size={12}/> {new Date(previewArticle.timestamp).toLocaleString('bn-BD')}</p></div>
                      <button onClick={closePreview} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><X size={24} className="text-gray-500"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-line">{previewLoading ? (<div className="flex flex-col items-center justify-center h-64 opacity-60"><Loader2 size={48} className="animate-spin text-primary-600 mb-4"/><p>সংবাদ লোড করা হচ্ছে...</p></div>) : (<HighlightKeywordMatch text={previewContent} terms={[previewArticle.keyword]} fallbackHighlight="" />)}</div>
                  <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3"><button onClick={closePreview} className="px-4 py-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition font-bold text-sm">বন্ধ করুন</button><a href={previewArticle.link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition font-bold text-sm flex items-center gap-2">মূল সাইটে পড়ুন <ExternalLink size={16}/></a></div>
              </div>
          </div>
      )}

      {/* --- COLLAPSIBLE HEADER SECTION --- */}
      {showControls && (
          <div className="space-y-4 animate-slideUp">
              <MonitorControls 
                monitorMode={monitorMode} setMonitorMode={setMonitorMode} loading={loading} stopFetching={stopFetching} fetchNews={fetchNews}
                localSearch={localSearch} setLocalSearch={setLocalSearch} searchMatches={searchMatches} currentMatchIdx={currentMatchIdx} handleSearchNav={handleSearchNav}
                groupingEnabled={groupingEnabled} setGroupingEnabled={setGroupingEnabled} viewFilter={viewFilter} setViewFilter={setViewFilter}
                viewMode={viewMode} setViewMode={setViewMode} selectedCount={selectedIds.size} handleMarkReadAction={handleMarkReadAction}
                newKeyword={newKeyword} setNewKeyword={setNewKeyword} handleAddKeyword={handleAddKeyword} setShowBotConfig={setShowBotConfig}
                setArticles={setArticles} allSources={processedData.allSources}
              />

              {monitorMode === 'dorking' && (
                  <DorkingPanel dorkKeyword={dorkKeyword} setDorkKeyword={setDorkKeyword} dorkType={dorkType} setDorkType={setDorkType} fetchNews={fetchNews} loading={loading} />
              )}

              {/* Ticker and Filters */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700 sticky top-[88px] z-30 shadow-sm backdrop-blur-sm">
                  {/* ... Ticker ... */}
                  <div className="flex items-center gap-2">
                      <div className="flex-1 overflow-hidden relative bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 h-8 flex items-center px-2">
                          <div className="absolute left-0 top-0 bottom-0 bg-red-600 text-white px-2 flex items-center z-10 text-xs font-bold shadow-md">
                              <Megaphone size={14} className="mr-1 animate-pulse"/> ব্রেকিং
                          </div>
                          <div className="overflow-hidden w-full h-full flex items-center pl-20">
                              <div className="whitespace-nowrap animate-marquee flex items-center gap-8">
                                  {breakingNews.length > 0 ? breakingNews.map((news, i) => (
                                      <span key={i} className="text-xs font-bold text-red-700 dark:text-red-300 inline-flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                          {news.title}
                                          <span className="text-[10px] text-gray-500">({news.time_ago})</span>
                                      </span>
                                  )) : (
                                      <span className="text-xs text-gray-500 italic">কোনো গুরুত্বপূর্ণ বর্ডার/বিজিবি নিউজ পাওয়া যায়নি।</span>
                                  )}
                              </div>
                          </div>
                          <style>{`@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .animate-marquee { animation: marquee 40s linear infinite; min-width: 100%; } .animate-marquee:hover { animation-play-state: paused; }`}</style>
                      </div>

                      {processedData.totalCount > 0 && (
                          <button onClick={handleClearArticles} className="px-3 py-1.5 rounded-md text-xs font-bold transition hover:scale-105 border bg-red-100 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 flex items-center gap-1">
                              <Trash2 size={14}/> মুছুন
                          </button>
                      )}

                      {/* Sound Toggle */}
                      <button 
                          onClick={() => setEnableSound(!enableSound)} 
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition hover:scale-105 border flex items-center gap-1 ${enableSound ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                          title="সাউন্ড নোটিফিকেশন"
                      >
                          {enableSound ? <Volume2 size={14}/> : <VolumeX size={14}/>}
                      </button>

                      <button 
                          onClick={() => setShowFilters(!showFilters)} 
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition hover:scale-105 border ${showFilters ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                      >
                          <Filter size={14}/> ফিল্টার {showFilters ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </button>
                  </div>

                  {showFilters && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 animate-slideUp">
                          <div className="relative group"><select value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} className="appearance-none bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md py-1.5 pl-7 pr-8 text-xs font-bold text-green-700 dark:text-green-300 outline-none hover:border-green-400 cursor-pointer transition-colors shadow-sm"><option value="all">সকল কিওয়ার্ড</option>{processedData.allKeywords.map(k => (<option key={k} value={k}>{k}</option>))}</select><Tag size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none"/></div>
                          <div className="relative group"><select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="appearance-none bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md py-1.5 pl-7 pr-8 text-xs font-bold text-blue-700 dark:text-blue-300 outline-none hover:border-blue-400 cursor-pointer max-w-[150px] transition-colors shadow-sm"><option value="all">সকল সোর্স</option>{processedData.allSources.map(s => (<option key={s} value={s}>{translateSource(s)}</option>))}</select><Newspaper size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"/></div>
                          <div className="relative group"><select value={filterTime} onChange={(e) => setFilterTime(e.target.value)} className="appearance-none bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md py-1.5 pl-7 pr-8 text-xs font-bold text-orange-700 dark:text-orange-300 outline-none hover:border-orange-400 cursor-pointer transition-colors shadow-sm"><option value="all">যেকোনো সময়</option><option value="1h">গত ১ ঘণ্টা</option><option value="6h">গত ৬ ঘণ্টা</option><option value="12h">গত ১২ ঘণ্টা</option><option value="24h">গত ২৪ ঘণ্টা</option></select><Clock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none"/></div>
                          <div className="relative group"><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-md py-1 px-2 pl-7 text-xs font-bold text-pink-700 dark:text-pink-300 outline-none hover:border-pink-400 cursor-pointer transition-colors shadow-sm"/><CalendarDays size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-pink-500 pointer-events-none"/></div>
                          {(filterRegion !== 'all' || filterKeyword !== 'all' || filterSource !== 'all' || filterTime !== 'all' || filterDate !== '') && (<button onClick={() => { setFilterRegion('all'); setFilterKeyword('all'); setFilterSource('all'); setFilterTime('all'); setFilterDate(''); }} className="ml-auto text-xs text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-2 py-1 rounded transition hover:scale-105">রিসেট</button>)}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- CONTENT AREA (SCROLLABLE) --- */}
      <div className={`overflow-y-auto custom-scrollbar p-2 transition-all duration-300 ${showControls ? 'h-[calc(100vh-380px)]' : 'h-[calc(100vh-140px)]'}`}>
        {loading && articles.length === 0 ? (
            <div className="text-center py-20"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-500">তথ্য খোঁজা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।</p></div>
        ) : processedData.totalCount === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-700 mt-6 flex flex-col items-center">
                <AlertTriangle size={48} className="mx-auto mb-3 opacity-50"/>
                <p className="text-lg font-bold">কোনো তথ্য পাওয়া যায়নি</p>
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-left max-w-md border border-blue-100 dark:border-blue-800">
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2"><Bot size={16}/> সম্ভাব্য কারণ:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                        <li>আপনার কিওয়ার্ড তালিকায় 'Monitor' টাইপের কোনো কিওয়ার্ড নেই।</li>
                        <li>মাস্টার ফিড আপডেট করা হয়নি (RSS Manager থেকে আপডেট করুন)।</li>
                        <li>Force Mode চালু আছে কিনা চেক করুন (এডমিন প্যানেলে)।</li>
                    </ul>
                </div>
            </div>
        ) : (
            <div className="space-y-8">
                <div>
                    <div className="flex items-center justify-between mb-4 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-green-600"/>
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
                                সাম্প্রতিক ফলাফল ({toBanglaDigit(processedData.recentReadCount)}/{toBanglaDigit(processedData.recentArticleCount)}টি)
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 border-l pl-2 border-gray-300">সোর্স: {toBanglaDigit(processedData.sourceCount)} টি</span>
                            </h3>
                            
                            {lastRefreshed && (
                                <span className="text-xs font-bold text-red-600 dark:text-red-400 animate-pulse ml-4 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-1">
                                    <Clock size={12}/> সর্বশেষ আপডেট: {lastRefreshed.toLocaleTimeString('bn-BD')}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex gap-2 items-center">
                            {settings.monitorFreeMode && (
                                <span className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded shadow animate-pulse flex items-center gap-1">
                                    <Unlock size={12}/> FREE MODE
                                </span>
                            )}
                            {settings.monitorForceMode && (
                                <span className="text-xs font-bold text-white bg-red-600 px-3 py-1 rounded shadow animate-pulse">
                                    FORCE
                                </span>
                            )}
                        </div>
                    </div>
                    {processedData.recentGroups.length === 0 ? (<p className="text-center text-gray-400 text-sm py-4">কোন সাম্প্রতিক তথ্য নেই (গত ১২ ঘন্টায়)</p>) : (renderArticleList(processedData.recentGroups, false))}
                    <PaginationControls currentPage={recentPage} totalPages={processedData.recentTotalPages} setPage={setRecentPage} />
                </div>
                <div className="border-t-4 border-gray-300 dark:border-gray-700 pt-6">
                    <div onClick={() => setShowArchive(!showArchive)} className="flex justify-between items-center bg-gray-800 text-white p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition mb-4 shadow-lg sticky top-0 z-20 group"><div className="flex items-center gap-2 group-hover:scale-105 transition-transform duration-300"><History size={20} className="group-hover:rotate-180 transition-transform duration-500"/><h3 className="font-bold">আর্কাইভ (পুরাতন)</h3></div><div className="flex items-center gap-3 text-xs font-bold"><span className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors shadow-sm">মোট: {toBanglaDigit(processedData.archiveArticleTotal)}</span><span className="bg-green-500/40 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-500/60 transition-colors shadow-sm"><Check size={12}/> পড়া: {toBanglaDigit(processedData.archiveReadCount)}</span><span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1 ml-2 transition-all group-hover:bg-white text-gray-200 group-hover:text-gray-800">{showArchive ? 'লুকান' : 'দেখুন'} {showArchive ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span></div></div>
                    {showArchive && (<div className="animate-slideUp bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">{renderArticleList(processedData.archiveGroups, true)}<PaginationControls currentPage={archivePage} totalPages={processedData.archiveTotalPages} setPage={setArchivePage} /></div>)}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default NewsMonitor;
