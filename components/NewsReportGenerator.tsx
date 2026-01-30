
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FileText, Copy, Trash2, Calendar, Search, Database, Download, Clock, History, ChevronUp, ChevronDown, X, Filter, CheckCheck, ChevronLeft, ChevronRight, Eye, Info, FolderOpen, LayoutGrid, List, Plus, GitMerge, PanelTopClose, PanelTopOpen, BookOpen, Circle, Play, Pause, Gauge, HelpCircle, Unlock, Save } from 'lucide-react';
import { getApiBaseUrl, generateId } from '../utils';
import { useApp } from '../store';
import { CollectedArticle } from '../types';
import { ArticleWithSerial, DateGroup } from './news-report/types';
import { toBanglaDigit, formatTime24, getHourLabel, translateSource } from './news-report/utils';
import ArticleCard from './news-report/ArticleCard';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const ITEMS_PER_PAGE = 25;
const SCANNING_SOURCES = ['Prothom Alo', 'The Daily Star', 'BBC Bangla', 'Somoy TV', 'Jamuna TV', 'Master Feed', 'Google News'];

// SUCCESS SOUND URL
const SUCCESS_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3";

const NewsReportGenerator: React.FC = () => {
  const { collectedNews, addCollectedNews, clearCollectedNews, deleteCollectedArticle, keywords, addKeyword, settings } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanningSource, setScanningSource] = useState('Initializing...');
  const [filterText, setFilterText] = useState('');
  
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [smartGroup, setSmartGroup] = useState(true);
  const [newReportKeyword, setNewReportKeyword] = useState('');
  
  const [showControls, setShowControls] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  
  const [collectTimeRange, setCollectTimeRange] = useState<number>(settings.reportDefaultTimeRange || 3);
  const [lastBatchIds, setLastBatchIds] = useState<Set<string>>(new Set());

  // --- READING MODE STATE ---
  const [readingMode, setReadingMode] = useState(false);
  const [readingSource, setReadingSource] = useState<'latest' | 'bgb'>('latest');
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(3); 
  const readingContainerRef = useRef<HTMLDivElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      audioRef.current = new Audio(SUCCESS_SOUND_URL);
  }, []);

  useEffect(() => {
      setCollectTimeRange(settings.reportDefaultTimeRange);
  }, [settings.reportDefaultTimeRange]);

  // READING MODE AUTO SCROLL LOGIC
  useEffect(() => {
      let scrollInterval: any;
      if (readingMode && !isAutoScrollPaused) {
          const delayTime = Math.max(10, 110 - (scrollSpeed * 10));
          scrollInterval = setInterval(() => {
              if (readingContainerRef.current) {
                  readingContainerRef.current.scrollTop += 1;
              }
          }, delayTime);
      }
      return () => clearInterval(scrollInterval);
  }, [readingMode, isAutoScrollPaused, scrollSpeed]);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
      const saved = localStorage.getItem('report_last_updated');
      return saved ? new Date(saved) : null;
  });

  const [showBgbFolder, setShowBgbFolder] = useState(true);
  const [showOldNews, setShowOldNews] = useState(true);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [showSourceSummary, setShowSourceSummary] = useState(false);

  const [viewFilter, setViewFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [filterKeyword, setFilterKeyword] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterTime, setFilterTime] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const [oldViewFilter, setOldViewFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [oldFilterKeyword, setOldFilterKeyword] = useState('all');
  const [oldFilterSource, setOldFilterSource] = useState('all');
  const [oldFilterDate, setOldFilterDate] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionStack, setSelectionStack] = useState<string[]>([]); 
  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => {
      try { return new Set(JSON.parse(localStorage.getItem('report_visited') || '[]')); } catch { return new Set(); }
  });

  const [latestPage, setLatestPage] = useState(1);
  const [oldPage, setOldPage] = useState(1);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      localStorage.setItem('report_visited', JSON.stringify(Array.from(visitedIds)));
  }, [visitedIds]);

  useEffect(() => {
      let interval: any;
      if (loading) {
          interval = setInterval(() => {
              const randomSource = SCANNING_SOURCES[Math.floor(Math.random() * SCANNING_SOURCES.length)];
              setScanningSource(randomSource);
          }, 150); 
      }
      return () => clearInterval(interval);
  }, [loading]);

  const activeSources24h = useMemo(() => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recent = collectedNews.filter(n => n.timestamp > oneDayAgo);
      const sources = new Set(recent.map(n => n.source));
      return Array.from(sources).sort();
  }, [collectedNews]);

  const groupedData = useMemo(() => {
      // INSTRUCTION: Detect duplicates to tag them
      const linkCounts = new Map<string, number>();
      collectedNews.forEach(a => linkCounts.set(a.link, (linkCounts.get(a.link) || 0) + 1));

      let searchFiltered = collectedNews;
      if (filterText) {
          const lowerText = filterText.toLowerCase().trim();
          const tokens = lowerText.split(/\s+/);
          searchFiltered = collectedNews.filter(a => {
              const content = (a.title + ' ' + a.keyword + ' ' + a.source + ' ' + (a.description || '')).toLowerCase();
              return tokens.every(token => content.includes(token));
          });
      }

      const bgbKeywords = ['বিজিবি', 'বিএসএফ', 'সীমান্ত', 'bgb', 'border', 'bsf'];
      const checkIsBgb = (a: CollectedArticle) => {
          const content = (a.title + ' ' + a.keyword + ' ' + (a.description || '')).toLowerCase();
          return bgbKeywords.some(k => content.includes(k));
      };

      const mainCandidates = searchFiltered.filter(a => a.isLatest || checkIsBgb(a));
      const oldCandidates = searchFiltered.filter(a => !a.isLatest && !checkIsBgb(a));

      let filteredMain = mainCandidates;
      if (filterKeyword !== 'all') filteredMain = filteredMain.filter(a => a.keyword === filterKeyword);
      if (filterSource !== 'all') filteredMain = filteredMain.filter(a => a.source === filterSource);
      if (filterDate) {
          const target = new Date(filterDate).toDateString();
          filteredMain = filteredMain.filter(a => new Date(a.timestamp).toDateString() === target);
      }
      if (filterTime !== 'all') {
          const now = Date.now();
          let timeLimit = 0;
          if (filterTime === '1h') timeLimit = 3600000;
          else if (filterTime === '6h') timeLimit = 21600000;
          else if (filterTime === '12h') timeLimit = 43200000;
          else if (filterTime === '24h') timeLimit = 86400000;
          if (timeLimit > 0) filteredMain = filteredMain.filter(a => (now - a.timestamp) <= timeLimit);
      }
      // Apply view filter to main list
      if (viewFilter === 'unread') filteredMain = filteredMain.filter(a => !visitedIds.has(a.id));
      else if (viewFilter === 'read') filteredMain = filteredMain.filter(a => visitedIds.has(a.id));

      let filteredOld = oldCandidates;
      if (oldFilterKeyword !== 'all') filteredOld = filteredOld.filter(a => a.keyword === oldFilterKeyword);
      if (oldFilterSource !== 'all') filteredOld = filteredOld.filter(a => a.source === oldFilterSource);
      if (oldFilterDate) {
          const target = new Date(oldFilterDate).toDateString();
          filteredOld = filteredOld.filter(a => new Date(a.timestamp).toDateString() === target);
      }
      if (oldViewFilter === 'unread') filteredOld = filteredOld.filter(a => !visitedIds.has(a.id));
      else if (oldViewFilter === 'read') filteredOld = filteredOld.filter(a => visitedIds.has(a.id));

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); 
      
      // BGB Folder Sorting - Unread First, then Time
      const bgbArticlesRaw = filteredMain
          .filter(a => checkIsBgb(a) && a.timestamp >= todayStart.getTime()) 
          .sort((a,b) => {
              const readA = visitedIds.has(a.id);
              const readB = visitedIds.has(b.id);
              if (readA === readB) {
                  return b.timestamp - a.timestamp; // Both read or unread -> sort by time
              }
              return readA ? 1 : -1; // Unread first (false < true)
          });
      
      const bgbArticles: ArticleWithSerial[] = bgbArticlesRaw.map((a, i) => ({ ...a, serial: i + 1 }));

      const latestRaw = filteredMain.filter(a => a.isLatest).sort((a,b) => b.timestamp - a.timestamp);
      const latestFull: ArticleWithSerial[] = latestRaw.map((a, i) => ({ ...a, serial: i + 1 }));

      const oldRaw = filteredOld.sort((a,b) => b.timestamp - a.timestamp);
      const oldFull: ArticleWithSerial[] = oldRaw.map((a, i) => ({ ...a, serial: i + 1 }));

      const allKeywords = Array.from(new Set(collectedNews.map(a => a.keyword))).sort();
      const allSources = Array.from(new Set(collectedNews.map(a => a.source))).sort();

      const latestPaged = latestFull.slice((latestPage - 1) * ITEMS_PER_PAGE, latestPage * ITEMS_PER_PAGE);
      const oldPaged = oldFull.slice((oldPage - 1) * ITEMS_PER_PAGE, oldPage * ITEMS_PER_PAGE);

      const groupArticlesByDateAndHour = (articles: ArticleWithSerial[]): DateGroup[] => {
          if (!smartGroup) {
              const dateGroups: DateGroup[] = [];
              articles.forEach(art => {
                  const d = new Date(art.timestamp);
                  const dateLabel = d.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  let dGroup = dateGroups.find(g => g.label === dateLabel);
                  if (!dGroup) {
                      dGroup = { label: dateLabel, hours: [] };
                      dateGroups.push(dGroup);
                  }
                  let hGroup = dGroup.hours[0];
                  if (!hGroup) {
                      hGroup = { label: 'সকল সংবাদ', items: [], sortTime: 24 };
                      dGroup.hours.push(hGroup);
                  }
                  hGroup.items.push(art);
              });
              return dateGroups;
          }

          const dateGroups: DateGroup[] = [];
          articles.forEach(art => {
              const d = new Date(art.timestamp);
              const dateLabel = d.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              const hourLabel = getHourLabel(art.dateStr);
              const sortH = d.getHours();

              let dGroup = dateGroups.find(g => g.label === dateLabel);
              if (!dGroup) {
                  dGroup = { label: dateLabel, hours: [] };
                  dateGroups.push(dGroup);
              }
              let hGroup = dGroup.hours.find(h => h.label === hourLabel);
              if (!hGroup) {
                  hGroup = { label: hourLabel, items: [], sortTime: sortH };
                  dGroup.hours.push(hGroup);
              }
              hGroup.items.push(art);
          });
          dateGroups.forEach(dg => dg.hours.sort((a, b) => b.sortTime - a.sortTime));
          return dateGroups;
      };

      return {
          latestListFull: latestFull, 
          latestGroups: groupArticlesByDateAndHour(latestPaged), 
          oldListFull: oldFull, 
          oldGroups: groupArticlesByDateAndHour(oldPaged), 
          totalLatest: latestFull.length,
          totalOld: oldRaw.length,
          readOld: oldRaw.filter(a => visitedIds.has(a.id)).length,
          readLatest: latestRaw.filter(a => visitedIds.has(a.id)).length,
          unreadOld: oldRaw.length - oldRaw.filter(a => visitedIds.has(a.id)).length,
          bgbArticles,
          totalBgbLatest: bgbArticles.length,
          readBgbLatest: bgbArticles.filter(a => visitedIds.has(a.id)).length,
          allKeywords,
          allSources,
          linkCounts // Passed for duplication checking
      };
  }, [collectedNews, filterText, viewFilter, oldViewFilter, visitedIds, latestPage, oldPage, filterKeyword, filterSource, filterTime, filterDate, oldFilterKeyword, oldFilterSource, oldFilterDate, smartGroup]);

  const readingList = readingSource === 'bgb' ? groupedData.bgbArticles : groupedData.latestListFull;
  const totalReadCount = collectedNews.filter(a => visitedIds.has(a.id)).length;
  const hasAnyOldNews = collectedNews.some(a => !a.isLatest); 
  const latestReadCount = groupedData.readLatest;

  useEffect(() => {
      setLatestPage(1);
      setOldPage(1);
  }, [filterText, viewFilter, oldViewFilter, filterKeyword, filterSource, filterTime, filterDate, oldFilterKeyword, oldFilterSource, oldFilterDate, smartGroup]);

  useEffect(() => {
      if (!filterText.trim()) {
          setSearchMatches([]);
          setCurrentMatchIdx(-1);
          return;
      }
      const timeout = setTimeout(() => {
          const visibleArticles = groupedData.latestListFull.concat(
              groupedData.oldGroups.flatMap(g => g.hours.flatMap(h => h.items))
          );
          const ids = visibleArticles.map(a => a.id);
          setSearchMatches(ids);
          setCurrentMatchIdx(-1);
      }, 300);
      return () => clearTimeout(timeout);
  }, [filterText, groupedData]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (helpRef.current && !helpRef.current.contains(event.target as Node)) setShowHelp(false);
          if (showSourceSummary) setShowSourceSummary(false);
          if (filterRef.current && !filterRef.current.contains(event.target as Node)) setShowFilters(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSourceSummary]);

  const handleAddReportKeyword = () => { if (newReportKeyword.trim()) { addKeyword(newReportKeyword.trim(), 'report', [], '#ef4444'); setNewReportKeyword(''); showToast('কিওয়ার্ড যুক্ত হয়েছে!', 'success'); } };
  const handleSearchNav = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); if (searchMatches.length === 0) return; const nextIdx = (currentMatchIdx + 1) % searchMatches.length; setCurrentMatchIdx(nextIdx); const targetId = searchMatches[nextIdx]; const el = document.getElementById(`report-article-${targetId}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-green-500', 'bg-yellow-50'); setTimeout(() => el.classList.remove('ring-2', 'ring-green-500', 'bg-yellow-50'), 1500); } } };
  const clearSearch = () => { setFilterText(''); setSearchMatches([]); setCurrentMatchIdx(-1); };
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const handleLinkClick = (id: string, link: string) => { window.open(link, '_blank'); setVisitedIds(prev => new Set(prev).add(id)); };
  const toggleSelection = (e: React.MouseEvent, id: string) => { e.preventDefault(); const newSet = new Set(selectedIds); if (newSet.has(id)) { newSet.delete(id); setSelectionStack(prev => prev.filter(i => i !== id)); } else { newSet.add(id); setSelectionStack(prev => [...prev, id]); } setSelectedIds(newSet); };
  const handleMarkReadAction = () => { if (selectedIds.size > 0) { setVisitedIds(prev => { const next = new Set(prev); selectedIds.forEach(id => next.add(id)); return next; }); setSelectedIds(new Set()); setSelectionStack([]); showToast(`${toBanglaDigit(selectedIds.size)} টি নিউজ পড়া হয়েছে`, 'success'); } else { const visibleIds = [ ...groupedData.latestListFull.map(a => a.id), ...groupedData.bgbArticles.map(a => a.id) ]; setVisitedIds(prev => { const next = new Set(prev); visibleIds.forEach(id => next.add(id)); return next; }); showToast('সব নিউজ পড়া হয়েছে হিসেবে মার্ক করা হয়েছে', 'success'); } };
  const handleMarkAllOldRead = (e: React.MouseEvent) => { e.stopPropagation(); const ids = groupedData.oldListFull.map(a => a.id); if (ids.length === 0) { showToast('মার্ক করার মত কোনো পুরাতন নিউজ নেই', 'info'); return; } setVisitedIds(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next; }); showToast(`${toBanglaDigit(ids.length)} টি পুরাতন সংবাদ পঠিত হয়েছে`, 'success'); };

  const collectNews = async () => {
    setLoading(true); setProgress(0);
    const API_BASE = getApiBaseUrl(); const now = new Date(); const startTime = new Date(now.getTime() - (collectTimeRange * 60 * 60 * 1000));
    
    // Include specific keywords AND Free Mode if enabled
    let reportKeywords = keywords.filter(k => k.type === 'report' || k.type === 'both');
    if (settings.reportFreeMode) { 
        reportKeywords.push({ 
            id: 0, 
            keyword: settings.reportFreeModeLang === 'bn' ? 'বাংলাদেশ সংবাদ' : 'Bangladesh News', 
            type: 'report', 
            variations: [], 
            color: '#22c55e', 
            opacity: 1, 
            is_active: true 
        }); 
    }

    if (reportKeywords.length === 0) { setLoading(false); showToast("কিওয়ার্ড নেই", 'error'); return; }
    
    let fetchedArticles: CollectedArticle[] = []; const seenLinks = new Set<string>();
    try {
      // 1. Master Feed
      const rssRes = await fetch(`${API_BASE}/rss_handler.php?action=get_master_json`); const rssData = await rssRes.json();
      if (rssData.success && Array.isArray(rssData.items)) { rssData.items.forEach((item: any) => { const articleDate = new Date(item.date); if (articleDate < startTime) return; const content = (item.title + ' ' + (item.description || '')).toLowerCase(); let matchedKeyword: any = null; if (settings.reportFreeMode) { matchedKeyword = { keyword: 'All News' }; } else { matchedKeyword = reportKeywords.find(k => { const vars = [k.keyword, ...(k.variations || [])]; return vars.some(v => content.includes(v.toLowerCase())); }); } if (matchedKeyword) { if (!seenLinks.has(item.link)) { 
          // INSTRUCTION: Prevent duplicate news unless Force Mode
          if (settings.reportForceMode || !collectedNews.some(c => c.link === item.link)) { 
              seenLinks.add(item.link); fetchedArticles.push({ id: generateId(), title: item.title, link: item.link, dateStr: item.date, timestamp: articleDate.getTime(), source: item.source, keyword: matchedKeyword.keyword, isLatest: true, description: '' }); 
          } 
      } } }); }
      
      // 2. Google News
      const totalSteps = reportKeywords.length; 
      for (let i = 0; i < totalSteps; i++) { 
          const kObj = reportKeywords[i]; 
          let query = kObj.keyword; 
          if (kObj.id === 0) {
             query = kObj.keyword;
          } else if (settings.reportStrictMode) { 
             query = `"${kObj.keyword}"`; 
          } else if ((kObj.variations || []).length > 0) { 
             query = `${kObj.keyword} OR ${kObj.variations?.join(' OR ')}`; 
          } 
          
          if (i > 0) await delay(1000 + Math.random() * 500); 
          
          try { 
              const refreshParam = settings.reportForceMode ? '&refresh=true' : ''; 
              const res = await fetch(`${API_BASE}/news_proxy.php?q=${encodeURIComponent(query)}&refresh=true`); 
              const data = await res.json(); 
              if (data.success && Array.isArray(data.articles)) { 
                  data.articles.forEach((art: any) => { 
                      const articleDate = new Date(art.date); 
                      if (articleDate < startTime) return; 
                      if (settings.reportStrictMode && kObj.id !== 0) { 
                          const combinedText = (art.title + ' ' + (art.description || '')).toLowerCase(); 
                          if (!combinedText.includes(kObj.keyword.toLowerCase())) return; 
                      } 
                      if (seenLinks.has(art.link)) return; 
                      // INSTRUCTION: Prevent duplicate news unless Force Mode
                      if (!settings.reportForceMode && collectedNews.some(existing => existing.link === art.link)) return; 
                      seenLinks.add(art.link); 
                      let cleanTitle = art.title.split(' - ')[0]; 
                      fetchedArticles.push({ id: generateId(), title: cleanTitle, link: art.link, dateStr: art.date, timestamp: articleDate.getTime(), source: art.source, keyword: kObj.keyword, isLatest: true, description: art.description }); 
                  }); 
              } 
          } catch (e) {} 
          setProgress(Math.round(((i + 1) / totalSteps) * 100)); 
      }
      
      setLastUpdated(new Date()); localStorage.setItem('report_last_updated', new Date().toISOString());
      if (fetchedArticles.length > 0) { 
          // Note: addCollectedNews in store handles deleting old news if Force Mode is on
          addCollectedNews(fetchedArticles, settings.reportForceMode); 
          setSelectedIds(new Set()); setSelectionStack([]); const newBatchIds = new Set(fetchedArticles.map(a => a.id)); setLastBatchIds(newBatchIds); if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(e => console.log('Audio blocked', e)); } showToast(`${toBanglaDigit(fetchedArticles.length)} টি নিউজ সংগ্রহ`, 'success'); 
      } else { showToast(`কোনো নতুন নিউজ নেই`, 'info'); }
    } catch (err) { showToast('নিউজ সংগ্রহে সমস্যা হয়েছে', 'error'); } finally { setLoading(false); }
  };

  // HELPER: Deduplicate Articles using ID for Download/Copy
  const getUniqueArticles = (sourceArticles: CollectedArticle[]) => {
      const unique = new Map<string, CollectedArticle>();
      sourceArticles.forEach(a => {
          if (!unique.has(a.id)) {
              unique.set(a.id, a);
          }
      });
      // Return sorted by timestamp desc
      return Array.from(unique.values()).sort((a, b) => b.timestamp - a.timestamp);
  };

  const handleCopyReport = async () => { 
      let targets: CollectedArticle[] = []; 
      
      if (selectedIds.size > 0) { 
          targets = collectedNews.filter(a => selectedIds.has(a.id)); 
      } else { 
          // Deduplicate items from BGB folder and Latest list
          const combined = groupedData.latestListFull;
          targets = getUniqueArticles(combined);
      }

      if (targets.length === 0) { showToast('ডাটা নেই', 'info'); return; }
      
      const grouped = targets.reduce((acc, curr) => { const k = curr.keyword || 'Others'; (acc[k] = acc[k] || []).push(curr); return acc; }, {} as Record<string, CollectedArticle[]>);
      const reportLines: string[] = []; reportLines.push(`--- সাম্প্রতিক সময়ের সংবাদ ---`); reportLines.push(`তারিখ: ${new Date().toLocaleDateString('bn-BD')}`); reportLines.push(``);
      let serial = 1; Object.keys(grouped).sort().forEach((keyword) => { const items = grouped[keyword]; items.forEach((item) => { const source = translateSource(item.source); const time = formatTime24(item.dateStr); reportLines.push(`*${toBanglaDigit(serial)}। ${item.title} (${source}, ${time})*`); serial++; }); });
      const textToCopy = reportLines.join('\n'); try { await navigator.clipboard.writeText(textToCopy); showToast('কপি হয়েছে!', 'success'); } catch (err) { showToast('কপি ব্যর্থ', 'error'); }
  };

  const handleDownload = (type: 'txt') => {
      let items: CollectedArticle[] = [];
      if (selectedIds.size > 0) {
          items = collectedNews.filter(a => selectedIds.has(a.id));
      } else {
          // Deduplicate items from BGB folder and Latest list
          const combined = groupedData.latestListFull;
          items = getUniqueArticles(combined);
      }

      if (items.length === 0) {
          showToast('ডাউনলোড করার মত কোনো নিউজ নেই', 'error');
          return;
      }

      const d = new Date();
      const dateStr = `${toBanglaDigit(d.getDate())}/${toBanglaDigit(d.getMonth() + 1)}/${toBanglaDigit(d.getFullYear())}`;
      const fileName = `News_Report_${new Date().toISOString().split('T')[0]}`;

      const getFormattedItem = (item: CollectedArticle, idx: number) => {
          const source = translateSource(item.source);
          const time = formatTime24(item.dateStr); 
          return `*${toBanglaDigit(idx + 1)}। ${item.title} (${source}, ${time})*`;
      };

      let content = `--- সাম্প্রতিক সময়ের সংবাদ ---\n`;
      content += `তারিখ: ${dateStr}\n\n`;
      items.forEach((item, idx) => {
          content += `${getFormattedItem(item, idx)}\n`;
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('নোটপ্যাড ফাইল ডাউনলোড হচ্ছে', 'success');
  };

  const handleCopyLink = (e: React.MouseEvent, link: string) => { e.stopPropagation(); navigator.clipboard.writeText(link); showToast('লিংক কপি হয়েছে!', 'success'); };
  const handleShareWhatsApp = (e: React.MouseEvent, article: any) => { e.stopPropagation(); window.open(`https://wa.me/?text=${encodeURIComponent(`*${article.title}*\n${article.link}`)}`, '_blank'); };
  const handleShareTelegram = (e: React.MouseEvent, article: any) => { e.stopPropagation(); window.open(`https://t.me/share/url?url=${encodeURIComponent(article.link)}&text=${encodeURIComponent(article.title)}`, '_blank'); };

  const renderPagination = (currentPage: number, totalCount: number, setPage: (p: number) => void) => {
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col gap-4 relative">
       {toast && <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-fadeIn bg-blue-600/90 text-white`}><Info size={18}/><span className="font-bold text-sm">{toast.msg}</span></div>}

       {/* HEADER TOGGLE BUTTON */}
       <div className="absolute top-0 right-4 z-[50]">
          <button 
            onClick={() => setShowControls(!showControls)} 
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition opacity-80 hover:opacity-100"
            title={showControls ? "হেডার লুকান" : "হেডার দেখান"}
          >
              {showControls ? <PanelTopClose size={16}/> : <PanelTopOpen size={16}/>}
              <span>{showControls ? 'Hide Controls' : 'Show Controls'}</span>
          </button>
       </div>

       {/* READING MODE FULL SCREEN OVERLAY */}
       {readingMode && (
           <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col animate-fadeIn">
               {/* Reading Header */}
               <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
                   <div className="flex items-center gap-4">
                       <h2 className="text-xl font-bold text-red-500 flex items-center gap-2 animate-pulse">
                           <Circle size={16} fill="currentColor" className="text-red-500"/>
                           লাইভ রিডিং মুড
                       </h2>
                       
                       {/* Source Toggle */}
                       <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                           <button 
                               onClick={() => setReadingSource('latest')}
                               className={`px-3 py-1 text-xs font-bold rounded transition ${readingSource === 'latest' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                           >
                               সাম্প্রতিক সংবাদ
                           </button>
                           <button 
                               onClick={() => setReadingSource('bgb')}
                               className={`px-3 py-1 text-xs font-bold rounded transition ${readingSource === 'bgb' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                           >
                               বিজিবি / সীমান্ত
                           </button>
                       </div>

                       {/* Speed Control Slider */}
                       <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1 border border-gray-700 mx-2">
                           <span className="text-[10px] text-gray-400 font-bold uppercase"><Gauge size={12} className="inline mr-1"/>Speed</span>
                           <input 
                               type="range" 
                               min="1" 
                               max="10" 
                               value={scrollSpeed} 
                               onChange={(e) => setScrollSpeed(Number(e.target.value))}
                               className="w-24 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-colors"
                               title={`Current Speed: ${scrollSpeed}`}
                           />
                           <span className="text-[10px] font-mono text-red-400 font-bold w-4 text-center">{scrollSpeed}</span>
                       </div>
                   </div>

                   <div className="flex items-center gap-3">
                       <div className="text-xs text-gray-400 font-mono">
                           Total: {toBanglaDigit(readingList.length)}
                       </div>
                       <button 
                           onClick={() => setIsAutoScrollPaused(!isAutoScrollPaused)}
                           className="p-2 rounded-full hover:bg-gray-800 transition"
                           title={isAutoScrollPaused ? "Play Scroll" : "Pause Scroll"}
                       >
                           {isAutoScrollPaused ? <Play size={20}/> : <Pause size={20}/>}
                       </button>
                       <button onClick={() => setReadingMode(false)} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition">
                           <X size={20} />
                       </button>
                   </div>
               </div>

               {/* Reading Content (Scrollable) */}
               <div 
                   ref={readingContainerRef}
                   className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar scroll-smooth"
                   onMouseEnter={() => setIsAutoScrollPaused(true)}
                   onMouseLeave={() => setIsAutoScrollPaused(false)}
               >
                   <div className="max-w-4xl mx-auto space-y-12 pb-40">
                       {readingList.length > 0 ? (
                           readingList.map((art, idx) => (
                               <div key={art.id} className="border-l-4 border-gray-700 pl-6 py-2 transition-all hover:border-blue-500 hover:bg-white/5 rounded-r-xl">
                                   <div className="flex items-center gap-3 mb-2">
                                       <span className="text-sm font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">
                                           {idx + 1}
                                       </span>
                                       <span className="text-xs text-gray-400 uppercase tracking-widest">
                                           {formatTime24(art.dateStr)} • {translateSource(art.source)}
                                       </span>
                                       {art.keyword && (
                                           <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300 border border-gray-700">
                                               {art.keyword}
                                           </span>
                                       )}
                                   </div>
                                   <h1 className="text-2xl md:text-4xl font-bold leading-tight text-gray-100 mb-4 cursor-pointer hover:text-blue-400 transition" onClick={() => window.open(art.link, '_blank')}>
                                       {art.title}
                                   </h1>
                                   {art.description && (
                                       <p className="text-lg text-gray-400 leading-relaxed line-clamp-3">
                                           {art.description}
                                       </p>
                                   )}
                               </div>
                           ))
                       ) : (
                           <div className="text-center text-gray-500 py-20 text-2xl">
                               কোনো সংবাদ নেই
                           </div>
                       )}
                       
                       {/* Bottom Spacer for Auto Scroll */}
                       <div className="h-96 flex items-center justify-center text-gray-600">
                           --- শেষ ---
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* --- HEADER CONTROL PANEL --- */}
       {showControls && (
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 md:p-3 shrink-0 animate-slideUp relative z-40">
              
              {/* --- ROW 1: Title, Keyword & Collect --- */}
              <div className="flex flex-col xl:flex-row justify-between items-center gap-3 mb-3">
                  {/* Left: Title & Help */}
                  <div className="flex items-center gap-3 w-full xl:w-auto">
                      <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 border border-green-200 dark:border-green-800"><Database size={20}/></div>
                      <div className="flex items-center gap-1 relative">
                          <h2 className="text-lg font-bold dark:text-white leading-none uppercase tracking-wide">রিপোর্ট</h2>
                          <div ref={helpRef}>
                              <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-green-500 transition" title="সাহায্য"><HelpCircle size={14}/></button>
                              {showHelp && (<div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 z-50 text-sm animate-fadeIn"><h4 className="font-bold text-gray-800 dark:text-white mb-2">গাইডলাইন</h4><p className="text-gray-600 dark:text-gray-300 text-xs">কিওয়ার্ড অনুযায়ী নিউজ সংগ্রহ করে রিপোর্ট তৈরি করুন।</p></div>)}
                          </div>
                      </div>

                      {/* Keyword Input Mini Form */}
                      <div className="flex relative ml-2 flex-1 xl:flex-none">
                          <input type="text" placeholder="Add..." className="w-full xl:w-32 pl-2 pr-7 py-1.5 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs outline-none dark:text-white" value={newReportKeyword} onChange={e => setNewReportKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddReportKeyword()}/>
                          <button onClick={handleAddReportKeyword} className="bg-gray-200 hover:bg-green-500 hover:text-white text-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 px-2 rounded-r-md transition"><Plus size={14}/></button>
                      </div>
                  </div>

                  {/* Right: Controls Group */}
                  <div className="flex flex-wrap items-center gap-2 justify-center w-full xl:w-auto">
                        
                        {/* Time & Smart Group */}
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 p-0.5">
                            <select 
                               value={collectTimeRange} 
                               onChange={(e) => setCollectTimeRange(Number(e.target.value))} 
                               className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 outline-none px-2 py-1.5 cursor-pointer hover:text-blue-600"
                               title="Time Range"
                           >
                               <option value={1}>1 Hour</option>
                               <option value={3}>3 Hours</option>
                               <option value={6}>6 Hours</option>
                               <option value={12}>12 Hours</option>
                               <option value={24}>24 Hours</option>
                           </select>
                           <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
                           <button onClick={() => setSmartGroup(!smartGroup)} className={`p-1.5 rounded transition ${smartGroup ? 'bg-white dark:bg-gray-600 text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title={smartGroup ? "Smart Group ON" : "Smart Group OFF"}><GitMerge size={16}/></button>
                           <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
                           <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'text-gray-500 hover:text-gray-700' : 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'}`} title="Change View">{viewMode === 'list' ? <LayoutGrid size={16}/> : <List size={16}/>}</button>
                        </div>

                        {/* Collect Button */}
                        <button onClick={() => collectNews()} disabled={loading} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shadow-md transition disabled:opacity-50">
                            <Download size={16} className={loading ? 'animate-spin' : ''}/> {loading ? `Collecting...` : 'Collect'}
                        </button>
                        
                        {/* Clear Button */}
                        <button onClick={() => { if(window.confirm('সব মুছবেন?')) clearCollectedNews(); }} className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition" title="Clear All"><Trash2 size={16}/></button>
                  </div>
              </div>

              {/* --- ROW 2: Search & Exports --- */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  {/* Search */}
                  <div className="relative w-full md:w-64">
                      <input value={filterText} onChange={e => setFilterText(e.target.value)} onKeyDown={handleSearchNav} placeholder="Search report..." className="w-full pl-8 pr-12 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs focus:ring-1 focus:ring-green-500 outline-none dark:text-white"/>
                      <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
                      {filterText && <div className="absolute right-2 top-1.5 flex gap-1">{searchMatches.length > 0 && <span className="text-[9px] bg-yellow-100 px-1 rounded font-bold text-gray-600">{currentMatchIdx + 1}/{searchMatches.length}</span>}<button onClick={clearSearch}><X size={12} className="text-gray-400 hover:text-red-500"/></button></div>}
                  </div>
                  
                  {/* Exports */}
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button 
                          onClick={() => handleDownload('txt')} 
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1 shadow-sm"
                      >
                          <FileText size={14}/> Download Txt
                      </button>
                      <button onClick={handleCopyReport} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-bold hover:bg-green-100 transition flex items-center gap-1 shadow-sm">
                          <Copy size={14}/> Copy Report
                      </button>
                  </div>
              </div>
           </div>
       )}

       {/* ... (Rest of component) ... */}
       <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col relative z-0 transition-all duration-300 ${showControls ? '' : 'mt-2'}`}>
          <div className="pt-6 px-6 pb-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-30 rounded-t-xl">
               <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
                          <FileText size={24}/> নিউজ ফিড <span className="text-sm font-bold text-gray-500">({toBanglaDigit(totalReadCount)}/{toBanglaDigit(collectedNews.length)})</span>
                      </h3>
                      
                      {/* READING MODE BUTTON (ICON ONLY) */}
                      <button 
                          onClick={() => setReadingMode(true)}
                          className="p-2 bg-black text-white hover:bg-gray-800 rounded-lg transition shadow-md border border-gray-700 animate-pulse-slow flex items-center justify-center"
                          title="ফুল স্ক্রিন রিডিং মুড"
                      >
                          <BookOpen size={18}/>
                      </button>

                      {settings.reportFreeMode && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold border border-blue-200 animate-pulse"><Unlock size={10} className="inline mr-1"/> Free Mode</span>}
                      {settings.reportForceMode && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold border border-red-200">Force</span>}
                      {settings.reportStrictMode && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold border border-orange-200">Strict</span>}
                  </div>
                  
                  {/* Collapsible Filter Button */}
                  <div className="relative flex items-center justify-end" ref={filterRef}>
                      <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition shadow-sm ${showFilters ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-50'}`}
                      >
                          <Filter size={16}/> ফিল্টার অপশন {showFilters ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </button>

                      {showFilters && (
                          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-3 rounded-xl z-50 w-full md:w-auto flex flex-col md:flex-row gap-2 animate-slideUp">
                                <select value={viewFilter} onChange={(e) => setViewFilter(e.target.value as 'all' | 'unread' | 'read')} className="bg-purple-50 border rounded text-xs py-2 px-3 font-bold text-purple-700 outline-none w-full md:w-auto cursor-pointer">
                                    <option value="all">সব (All)</option>
                                    <option value="unread">অপঠিত (Unread)</option>
                                    <option value="read">পঠিত (Read)</option>
                                </select>
                                <select value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} className="bg-green-50 border rounded text-xs py-2 px-3 font-bold text-green-700 outline-none w-full md:w-auto cursor-pointer"><option value="all">সকল কিওয়ার্ড</option>{groupedData.allKeywords.map(k => <option key={k} value={k}>{k}</option>)}</select>
                                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="bg-blue-50 border rounded text-xs py-2 px-3 font-bold text-blue-700 outline-none w-full md:w-auto cursor-pointer"><option value="all">সকল সোর্স</option>{groupedData.allSources.map(s => <option key={s} value={s}>{translateSource(s)}</option>)}</select>
                                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-pink-50 border rounded text-xs py-2 px-3 font-bold text-pink-700 outline-none w-full md:w-auto cursor-pointer"/>
                                <button onClick={() => { setFilterKeyword('all'); setFilterSource('all'); setFilterDate(''); setViewFilter('all'); }} className="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-2 rounded border border-red-100 w-full md:w-auto">Reset</button>
                          </div>
                      )}
                  </div>
               </div>
          </div>

          <div className={`min-h-[500px] overflow-y-auto custom-scrollbar p-6 pt-0 relative scroll-smooth rounded-b-xl transition-all duration-300 ${showControls ? 'h-[calc(100vh-380px)]' : 'h-[calc(100vh-200px)]'}`} ref={scrollContainerRef}>
              {/* ... (Keep rendering logic for articles) ... */}
              {groupedData.latestGroups.length > 0 && (
                  <div className="mb-8 pt-4"> 
                      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm flex justify-between items-end mb-4 border-b-2 border-green-100 pb-2 pt-2">
                          <h3 className="text-sm font-bold flex items-center gap-2 text-green-600">
                              <Calendar size={16}/> সাম্প্রতিক সংবাদ ({toBanglaDigit(latestReadCount)}/{toBanglaDigit(groupedData.totalLatest)})
                              {lastUpdated && (
                                <span className="text-xs font-bold text-red-600 dark:text-red-400 animate-pulse ml-4 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-1">
                                    <Clock size={12}/> আপডেট: {lastUpdated.toLocaleTimeString('bn-BD')}
                                </span>
                              )}
                          </h3>
                          <div className="flex items-center gap-2 relative">
                              <button 
                                onClick={() => setShowSourceSummary(!showSourceSummary)}
                                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition"
                                title="গত ২৪ ঘণ্টার সোর্স দেখুন"
                              >
                                  <Eye size={16}/>
                              </button>
                              
                              {showSourceSummary && (
                                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-3 z-50 animate-fadeIn">
                                      <h4 className="text-xs font-bold border-b pb-2 mb-2 dark:text-white flex justify-between items-center">
                                          <span>২৪ ঘণ্টার সক্রিয় সোর্স ({activeSources24h.length})</span>
                                          <button onClick={() => setShowSourceSummary(false)}><X size={12}/></button>
                                      </h4>
                                      <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                          {activeSources24h.length > 0 ? (
                                              activeSources24h.map(s => (
                                                  <span key={s} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                                                      {translateSource(s)}
                                                  </span>
                                              ))
                                          ) : (
                                              <span className="text-xs text-gray-400">কোন সোর্স নেই</span>
                                          )}
                                      </div>
                                  </div>
                              )}

                              <button onClick={handleMarkReadAction} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"><CheckCheck size={14}/> {selectedIds.size > 0 ? "Mark Selected" : "Mark All"}</button>
                          </div>
                      </div>

                      {/* INSTRUCTION: BGB Folder always visible regardless of news count */}
                      <div className="mb-6 mt-2 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 overflow-hidden">
                          <div className="flex items-center justify-between p-3 cursor-pointer bg-red-100 hover:bg-red-200 transition" onClick={() => setShowBgbFolder(!showBgbFolder)}>
                              <div className="flex items-center gap-2"><FolderOpen size={20} className="text-red-700"/><h3 className="font-bold text-red-800">বিজিবি/বর্ডার ফোল্ডার (আজকের)</h3><span className="text-xs bg-white px-2 py-0.5 rounded-full text-red-700 font-bold">{toBanglaDigit(groupedData.totalBgbLatest)}</span></div>
                              <span className="p-1 hover:bg-red-300 rounded-full">{showBgbFolder ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</span>
                          </div>
                          {showBgbFolder && (
                              <div className={`p-3 bg-white/50 dark:bg-black/20 max-h-[500px] overflow-y-auto custom-scrollbar ${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 gap-3' : 'space-y-1'}`}>
                                  {groupedData.bgbArticles.length > 0 ? (
                                      groupedData.bgbArticles.map(art => {
                                          // Check for duplicate in current collection (simple link count check)
                                          const isDup = (groupedData.linkCounts.get(art.link) || 0) > 1;
                                          return (
                                              <ArticleCard 
                                                key={art.id}
                                                art={art}
                                                isOld={false}
                                                viewMode={viewMode}
                                                visitedIds={visitedIds}
                                                selectedIds={selectedIds}
                                                selectionStack={selectionStack}
                                                filterText={filterText}
                                                keywords={keywords}
                                                onLinkClick={handleLinkClick}
                                                onToggleSelection={toggleSelection}
                                                onCopyLink={handleCopyLink}
                                                onShareWhatsApp={handleShareWhatsApp}
                                                onShareTelegram={handleShareTelegram}
                                                onDelete={deleteCollectedArticle}
                                                isSpotlight={false}
                                                isDuplicate={isDup}
                                              />
                                          );
                                      })
                                  ) : (
                                      <div className="text-center text-gray-400 py-4 text-xs">আজকের কোনো বিজিবি নিউজ নেই</div>
                                  )}
                              </div>
                          )}
                      </div>
                      
                      {groupedData.latestGroups.map((dateGroup, dIdx) => (
                        <div key={dIdx} className="mb-6">
                            {dateGroup.hours.map((hourGroup, hIdx) => (
                                <div key={hIdx} className="relative mb-4">
                                    <div className="sticky top-[50px] z-10 bg-indigo-50/95 dark:bg-indigo-900/40 backdrop-blur-sm py-1.5 px-2 mb-2 border-b border-indigo-100 dark:border-indigo-800 flex items-center shadow-sm rounded-md">
                                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-indigo-950 px-2 py-0.5 rounded mr-2 shadow-sm border border-indigo-100 dark:border-indigo-700">{hourGroup.label}</span>
                                        <span className="text-[10px] text-indigo-400 dark:text-indigo-400 font-medium">{dateGroup.label}</span>
                                    </div>
                                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3' : 'space-y-1'}>{hourGroup.items.map((art) => (
                                        <ArticleCard 
                                            key={art.id}
                                            art={art}
                                            isOld={false}
                                            viewMode={viewMode}
                                            visitedIds={visitedIds}
                                            selectedIds={selectedIds}
                                            selectionStack={selectionStack}
                                            filterText={filterText}
                                            keywords={keywords}
                                            onLinkClick={handleLinkClick}
                                            onToggleSelection={toggleSelection}
                                            onCopyLink={handleCopyLink}
                                            onShareWhatsApp={handleShareWhatsApp}
                                            onShareTelegram={handleShareTelegram}
                                            onDelete={deleteCollectedArticle}
                                            isSpotlight={false}
                                        />
                                    ))}</div>
                                </div>
                            ))}
                        </div>
                      ))}
                      {renderPagination(latestPage, groupedData.totalLatest, setLatestPage)}
                  </div>
              )}

              {/* ... Old News ... */}
              {hasAnyOldNews && (
                  <div className="mb-8 pt-4">
                      {/* ... (Keep existing code for old news header) ... */}
                      <div className="bg-black text-white rounded-xl shadow-md border border-gray-800 mb-6 sticky top-0 z-20">
                           <div className="p-3 flex flex-row justify-between items-center gap-2 cursor-pointer border-b border-gray-800" onClick={() => setShowOldNews(!showOldNews)}>
                                <h3 className="font-bold flex items-center gap-2 text-sm whitespace-nowrap">
                                    <History size={18}/> আর্কাইভ (পুরাতন) 
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs text-gray-200">মোট: {toBanglaDigit(groupedData.totalOld)}</span>
                                </h3>
                                
                                {showOldNews && (
                                    <div className="flex flex-row items-center gap-2 text-black overflow-x-auto no-scrollbar scroll-smooth flex-1 justify-end" onClick={(e) => e.stopPropagation()}>
                                         {/* ... (Keep old filters) ... */}
                                         <select value={oldViewFilter} onChange={(e) => setOldViewFilter(e.target.value as 'all' | 'unread' | 'read')} className="bg-purple-100 border border-purple-300 rounded text-xs py-1 px-2 font-bold text-purple-900 outline-none w-auto min-w-fit cursor-pointer">
                                             <option value="all">সব</option>
                                             <option value="unread">অপঠিত</option>
                                             <option value="read">পঠিত</option>
                                         </select>
                                         <Filter size={14} className="text-gray-400 shrink-0"/>
                                         <select value={oldFilterKeyword} onChange={(e) => setOldFilterKeyword(e.target.value)} className="bg-green-100 border border-green-300 rounded text-xs py-1 px-2 font-bold text-green-900 outline-none w-auto min-w-fit cursor-pointer max-w-[120px]"><option value="all">কিওয়ার্ড</option>{groupedData.allKeywords.map(k => <option key={k} value={k}>{k}</option>)}</select>
                                         <select value={oldFilterSource} onChange={(e) => setOldFilterSource(e.target.value)} className="bg-blue-100 border border-blue-300 rounded text-xs py-1 px-2 font-bold text-blue-900 outline-none w-auto min-w-fit cursor-pointer max-w-[120px]"><option value="all">সোর্স</option>{groupedData.allSources.map(s => <option key={s} value={s}>{translateSource(s)}</option>)}</select>
                                         <input type="date" value={oldFilterDate} onChange={(e) => setOldFilterDate(e.target.value)} className="bg-pink-100 border border-pink-300 rounded text-xs py-1 px-2 font-bold text-pink-900 outline-none w-auto cursor-pointer"/>
                                         <button onClick={handleMarkAllOldRead} className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition border border-green-500 whitespace-nowrap"><CheckCheck size={14}/> মার্ক অল</button>
                                         <button onClick={() => { setOldFilterKeyword('all'); setOldFilterSource('all'); setOldFilterDate(''); setOldViewFilter('all'); }} className="text-red-300 text-xs font-bold hover:bg-white/10 px-2 py-1 rounded whitespace-nowrap">Reset</button>
                                    </div>
                                )}
                                
                                <span className="p-1 hover:bg-white/20 rounded-full shrink-0">{showOldNews ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                           </div>
                      </div>

                      {showOldNews && groupedData.oldGroups.map((dateGroup, dIdx) => (
                        <div key={dIdx} className="mb-4 opacity-70 hover:opacity-100 transition-opacity">
                            {dateGroup.hours.map((hourGroup, hIdx) => (
                                <div key={hIdx} className="relative mb-4">
                                    <div className="sticky top-[110px] z-10 bg-gray-100/95 dark:bg-gray-800/90 backdrop-blur-sm py-1.5 px-2 mb-2 border-b border-gray-200 dark:border-gray-700 flex items-center shadow-sm rounded-md">
                                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-2 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-600">
                                            {dateGroup.label} | {hourGroup.label}
                                        </span>
                                    </div>
                                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3' : 'space-y-1'}>{hourGroup.items.map((art) => (
                                        <ArticleCard 
                                            key={art.id}
                                            art={art}
                                            isOld={true}
                                            viewMode={viewMode}
                                            visitedIds={visitedIds}
                                            selectedIds={selectedIds}
                                            selectionStack={selectionStack}
                                            filterText={filterText}
                                            keywords={keywords}
                                            onLinkClick={handleLinkClick}
                                            onToggleSelection={toggleSelection}
                                            onCopyLink={handleCopyLink}
                                            onShareWhatsApp={handleShareWhatsApp}
                                            onShareTelegram={handleShareTelegram}
                                            onDelete={deleteCollectedArticle}
                                            isSpotlight={false}
                                        />
                                    ))}</div>
                                </div>
                            ))}
                        </div>
                      ))}
                      {showOldNews && renderPagination(oldPage, groupedData.totalOld, setOldPage)}
                  </div>
              )}

              {collectedNews.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400"><Database size={48} className="mb-4 opacity-20"/><p className="text-xl font-bold">কোনো নিউজ নেই</p></div>
              )}
          </div>
       </div>

       {loading && (
           <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
               {/* ... (Keep existing loading spinner) ... */}
               <div className="relative w-48 h-48 flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-full shadow-2xl border border-white/20">
                   <svg className="w-full h-full transform -rotate-90">
                       <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-300 dark:text-gray-700 opacity-30"/>
                       <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 80} strokeDashoffset={2 * Math.PI * 80 - (progress / 100) * 2 * Math.PI * 80} className="text-cyan-400 transition-all duration-500 ease-out" strokeLinecap="round"/>
                   </svg>
                   <div className="absolute flex flex-col items-center text-white drop-shadow-md">
                       <span className="text-4xl font-black">{progress}%</span>
                       <span className="text-xs font-bold uppercase tracking-wider text-cyan-200 mt-1">Collecting</span>
                   </div>
               </div>
               <div className="mt-8 text-center space-y-2">
                   <p className="text-cyan-300 font-mono text-sm font-bold tracking-widest uppercase animate-pulse">System Active</p>
                   <div className="text-2xl font-bold text-white tracking-wide h-8 w-80 text-center mx-auto whitespace-nowrap overflow-hidden">
                       Searching in: <span className="text-yellow-400">{scanningSource}</span>
                   </div>
                   {settings.reportForceMode && <p className="text-red-300 text-xs font-bold uppercase animate-pulse">FORCE MODE ACTIVE</p>}
                   {settings.reportFreeMode && <p className="text-blue-300 text-xs font-bold uppercase animate-pulse">FREE MODE ACTIVE ({settings.reportFreeModeLang})</p>}
               </div>
           </div>
       )}
    </div>
  );
};

export default NewsReportGenerator;
