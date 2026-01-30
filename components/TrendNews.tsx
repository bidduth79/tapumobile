
import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../utils';
import { RefreshCw, ExternalLink, Clock, TrendingUp, Info, ShieldAlert, Flame, Filter, CheckCircle, History, Calendar, Database } from 'lucide-react';

interface Article {
  link: string;
  title: string;
  date: string;
  source: string;
  time_ago: string;
  keyword: string;
  timestamp: number;
}

const TrendNews: React.FC = () => {
  // Topics List
  const topics = [
      'বিএনপি', 'জামায়াত', 'শিবির', 'ছাত্রদল', 'আওয়ামী লীগ', 'জাতীয় পার্টি', 'হেফাজত', 'গণঅধিকার পরিষদ',
      'রাজনীতি', 'অবরোধ', 'হরতাল', 'বিক্ষোভ',
      'নির্বাচন কমিশন', 'ইসি', 'ইলেকশন', 'ভোট কেন্দ্র', 'ব্যালট পেপার', 'ভোট গ্রহণ',
      'সেনাবাহিনী', 'পুলিশ', 'র‌্যাব', 'আনসার', 'নৌবাহিনী', 'কোস্টগার্ড', 'বিমানবাহিনী', 'পুলিশের অভিযান', 'যৌথ বাহিনী'
  ];
  
  // Safe LocalStorage Helper to prevent QuotaExceededError
  const safeSetItem = (key: string, value: any) => {
      try {
          localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
          console.warn('Storage quota exceeded, clearing old cache.');
          // If quota exceeded, try to keep only the newest 50 items
          if (Array.isArray(value)) {
              try {
                  localStorage.setItem(key, JSON.stringify(value.slice(0, 50)));
              } catch (innerE) {
                  // If still failing, clear it
                  localStorage.removeItem(key);
              }
          }
      }
  };

  // State initialization
  const [recentArticles, setRecentArticles] = useState<Article[]>(() => {
      try {
          const cached = localStorage.getItem('trend_news_recent');
          return cached ? JSON.parse(cached) : [];
      } catch { return []; }
  });

  const [oldArticles, setOldArticles] = useState<Article[]>(() => {
      try {
          const cached = localStorage.getItem('trend_news_old');
          return cached ? JSON.parse(cached) : [];
      } catch { return []; }
  });

  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(() => {
      try {
          const saved = localStorage.getItem('trend_visited_links');
          return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch { return new Set(); }
  });

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [sourceInfo, setSourceInfo] = useState<string>('');
  
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(() => {
      const saved = localStorage.getItem('trend_last_refreshed');
      return saved ? new Date(saved) : null;
  });

  // Filter out previous days' news on mount
  useEffect(() => {
      const todayStr = new Date().toDateString();
      
      const filterTodayOnly = (list: Article[]) => {
          return list.filter(a => {
              const d = new Date(a.timestamp);
              return !isNaN(d.getTime()) && d.toDateString() === todayStr;
          });
      };

      setRecentArticles(prev => filterTodayOnly(prev));
      setOldArticles(prev => filterTodayOnly(prev));
  }, []);

  // Persist State
  useEffect(() => { safeSetItem('trend_news_recent', recentArticles); }, [recentArticles]);
  useEffect(() => { safeSetItem('trend_news_old', oldArticles); }, [oldArticles]);
  useEffect(() => { safeSetItem('trend_visited_links', Array.from(visitedLinks)); }, [visitedLinks]);

  const fetchNews = async (force = false) => {
    setLoading(true);
    const API_BASE = getApiBaseUrl();
    const todayStr = new Date().toDateString(); // Get current date string

    try {
        // Fetch all topics in parallel
        const promises = topics.map(async (key) => {
            try {
                const res = await fetch(`${API_BASE}/election_proxy.php?q=${encodeURIComponent(key)}&t=${Date.now()}`);
                const data = await res.json();
                
                if (data.success && Array.isArray(data.articles)) {
                    return data.articles.map((a: any) => {
                        const ts = new Date(a.date).getTime();
                        return {
                            ...a, 
                            keyword: key,
                            timestamp: isNaN(ts) ? Date.now() : ts
                        };
                    });
                }
                return [];
            } catch (err) { return []; }
        });

        const results = await Promise.all(promises);
        const allArticles = results.flat();

        // Deduplicate based on link
        const uniqueMap = new Map();
        allArticles.forEach(item => {
            if (!uniqueMap.has(item.link)) {
                uniqueMap.set(item.link, item);
            }
        });
        const uniqueArticles = Array.from(uniqueMap.values());
        
        // Filter Logic: Exclude BGB and Keep ONLY TODAY'S News
        const filteredArticles = uniqueArticles.filter(a => {
            const text = (a.title + ' ' + a.keyword).toLowerCase();
            const notBgb = !text.includes('bgb') && !text.includes('বিজিবি') && !text.includes('বর্ডার গার্ড');
            
            // Check Date
            const articleDate = new Date(a.timestamp);
            const isToday = articleDate.toDateString() === todayStr;

            return notBgb && isToday;
        });

        // Sort by Date (Newest First)
        filteredArticles.sort((a, b) => b.timestamp - a.timestamp);

        if (filteredArticles.length > 0) {
            // Archive logic: Move current displayed items to archive if refreshing manually
            if (force && recentArticles.length > 0) {
                setOldArticles(prev => {
                    const existingLinks = new Set(prev.map(a => a.link));
                    // Also make sure we only archive today's items
                    const newOld = recentArticles.filter(a => !existingLinks.has(a.link) && new Date(a.timestamp).toDateString() === todayStr);
                    const combined = [...newOld, ...prev].slice(0, 150); // Keep last 150 to avoid quota limit
                    return combined;
                });
            }

            // Slice to avoid storage overflow
            setRecentArticles(filteredArticles.slice(0, 150));
            
            const now = new Date();
            setLastRefreshed(now);
            localStorage.setItem('trend_last_refreshed', now.toISOString());
            setSourceInfo(`Live: ${filteredArticles.length} items (Today)`);
        } else {
            if (force) setSourceInfo('আজকের নতুন কোনো খবর নেই।');
        }

    } catch (error) {
        console.error("News fetch error", error);
        setSourceInfo('Network Error');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (recentArticles.length === 0) {
        fetchNews();
    }
  }, []);

  const handleLinkClick = useCallback((link: string) => {
      setVisitedLinks(prev => {
          const newSet = new Set(prev);
          newSet.add(link);
          return newSet;
      });
  }, []);

  const toBanglaDigit = (num: number) => num.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

  const filterArticles = (list: Article[]) => {
      if (filter === 'read') return list.filter(a => visitedLinks.has(a.link));
      if (filter === 'unread') return list.filter(a => !visitedLinks.has(a.link));
      return list;
  };

  const filteredRecent = filterArticles(recentArticles);
  const filteredOld = filterArticles(oldArticles);

  const totalRecentCount = recentArticles.length;
  const readRecentCount = recentArticles.filter(a => visitedLinks.has(a.link)).length;

  const isViolenceNews = (title: string) => {
      const keywords = ['নিহত', 'খুন', 'আহত', 'সংঘর্ষ', 'হামলা', 'আগুন', 'ভাঙচুর', 'গুলি', 'ককটেল', 'বিস্ফোরণ', 'লাশ', 'অগ্নিসংযোগ'];
      return keywords.some(k => title.includes(k));
  };

  return (
    <div className="p-4 md:p-6 pb-20 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 glass-panel p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border border-red-100 dark:border-red-900 animate-fadeIn sticky top-20 z-30 shadow-md">
        <div className="flex items-center gap-3">
             <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-lg text-red-700 dark:text-red-400 animate-pulse">
                <Flame size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    ট্রেন্ড নিউজ (আজকের সংবাদ)
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>স্ট্যাটাস: <span className="font-bold text-gray-700 dark:text-gray-300">({toBanglaDigit(readRecentCount)}/{toBanglaDigit(totalRecentCount)})</span></span>
                    {sourceInfo && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono hidden md:inline">| {sourceInfo}</span>}
                </div>
             </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filter === 'all' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>সব</button>
                <button onClick={() => setFilter('unread')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filter === 'unread' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>অপঠিত</button>
                <button onClick={() => setFilter('read')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filter === 'read' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>পঠিত</button>
            </div>

            <button 
                onClick={() => fetchNews(true)} 
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-bold text-sm disabled:opacity-50 active:scale-95 whitespace-nowrap"
            >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
            </button>
        </div>
      </div>

      {loading && recentArticles.length === 0 ? (
          <div className="text-center py-32">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">আজকের সংবাদ খোঁজা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।</p>
          </div>
      ) : (
          <div className="space-y-10 min-h-[500px]">
              
              {/* RECENT NEWS SECTION */}
              <div className="animate-slideUp">
                  <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                      <TrendingUp size={20} className="text-red-500"/> সাম্প্রতিক (আজকের)
                      <span className="text-xs font-normal text-gray-500 ml-auto bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">দেখানো হচ্ছে: {toBanglaDigit(filteredRecent.length)} টি</span>
                  </h3>
                  
                  {filteredRecent.length === 0 ? (
                      <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
                          <Database size={48} className="mb-3 opacity-20"/>
                          <p>আজকের কোনো সংবাদ পাওয়া যায়নি</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredRecent.map((article) => (
                              <NewsCard 
                                key={article.link ? article.link : Math.random().toString()} 
                                article={article} 
                                isVisited={article.link ? visitedLinks.has(article.link) : false} 
                                onLinkClick={handleLinkClick}
                                isViolence={isViolenceNews(article.title || '')}
                              />
                          ))}
                      </div>
                  )}
              </div>

              {/* OLD NEWS SECTION (Today's Archive) */}
              {filteredOld.length > 0 && (
                  <div className="opacity-90 transition-opacity duration-300">
                      <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mt-8">
                          <History size={20} className="text-gray-500"/> পঠিত/আর্কাইভ (আজকের)
                          <span className="text-xs font-normal text-gray-500 ml-auto bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">দেখানো হচ্ছে: {toBanglaDigit(filteredOld.length)} টি</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredOld.map((article) => (
                              <NewsCard 
                                key={`old-${article.link ? article.link : Math.random().toString()}`} 
                                article={article} 
                                isVisited={article.link ? visitedLinks.has(article.link) : false} 
                                onLinkClick={handleLinkClick}
                                isViolence={isViolenceNews(article.title || '')}
                                isOld={true}
                              />
                          ))}
                      </div>
                  </div>
              )}

          </div>
      )}
      
      {lastRefreshed && (
          <div className="text-center mt-12 text-xs text-gray-400 flex justify-center items-center gap-2 pb-4">
              <Info size={12}/> সর্বশেষ আপডেট: {lastRefreshed.toLocaleTimeString('bn-BD')}
          </div>
      )}
    </div>
  );
};

// --- Memoized Card Component to prevent flickering ---
interface NewsCardProps {
    article: Article;
    isVisited: boolean;
    onLinkClick: (l: string) => void;
    isViolence: boolean;
    isOld?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = React.memo(({ article, isVisited, onLinkClick, isViolence, isOld = false }) => {
    // Safety check
    if (!article || !article.title) return null;

    // Date formatting with safety
    let timeStr = "";
    try {
        const d = new Date(article.timestamp);
        if (!isNaN(d.getTime())) {
            timeStr = d.toLocaleTimeString('bn-BD', {hour:'2-digit', minute:'2-digit'});
        } else {
            timeStr = "";
        }
    } catch (e) { timeStr = ""; }

    return (
        <div className={`
            bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition flex flex-col justify-between group h-full relative overflow-hidden hover:shadow-md
            ${isViolence ? 'border-red-200 dark:border-red-900 bg-red-50/30' : 'border-gray-100 dark:border-gray-700'}
            ${isOld ? 'grayscale-[0.5] hover:grayscale-0' : ''}
        `}>
            {isVisited && <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-bl-lg z-10 shadow-sm" title="পঠিত"></div>}
            
            <div>
                <div className="flex justify-between items-start mb-2">
                    {isViolence ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-white bg-red-600 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                        <ShieldAlert size={10}/> অ্যালার্ট
                        </span>
                    ) : (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                        {article.keyword}
                        </span>
                    )}
                    
                    <div className="group/time relative overflow-hidden h-4 min-w-[80px] flex justify-end">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 absolute right-0 top-0 transition-all duration-300 group-hover/time:-top-6 opacity-100 group-hover/time:opacity-0">
                            <Clock size={10} /> {article.time_ago}
                        </span>
                        {timeStr && (
                            <span className="text-[10px] text-blue-600 font-mono font-bold flex items-center gap-1 absolute right-0 top-6 transition-all duration-300 group-hover/time:top-0 opacity-0 group-hover/time:opacity-100">
                                <Calendar size={10}/> {timeStr}
                            </span>
                        )}
                    </div>
                </div>

                <h3 className={`font-bold leading-snug mb-2 line-clamp-3 transition-colors ${isVisited ? 'text-purple-800 dark:text-purple-400 font-medium' : (isViolence ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-200 group-hover:text-blue-600')}`}>
                    <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={() => onLinkClick(article.link)}
                    >
                        {article.title}
                    </a>
                </h3>
            </div>

            <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 font-semibold truncate max-w-[70%]">{article.source}</span>
                <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={() => onLinkClick(article.link)}
                    className={`p-1.5 rounded-full transition ${isVisited ? 'text-purple-500 bg-purple-50' : 'text-gray-400 bg-gray-50 dark:bg-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                    {isVisited ? <CheckCircle size={14}/> : <ExternalLink size={14} />}
                </a>
            </div>
        </div>
    );
});

export default TrendNews;
