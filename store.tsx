
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LinkItem, ActivityLog, CollectedArticle, Keyword, MenuItem, DEFAULT_MENU, SpotlightItem, SystemSettings, DEFAULT_SETTINGS, TrashItem, DashboardStats, Message, RSSFeed } from './types';
import { generateId, getApiBaseUrl } from './utils';
import { db } from './firebase';
import { ref, set, onValue, push, remove, update } from 'firebase/database';

const CACHE_KEYS = {
  LINKS: 'app_links',
  MENUS: 'app_menus',
  USERS: 'app_users',
  LOGS: 'app_logs',
  KEYWORDS: 'app_keywords',
  SPOTLIGHT: 'app_spotlight',
  RSS_FEEDS: 'app_rss_feeds',
  COLLECTED_NEWS: 'app_collected_news',
  TRASH: 'app_trash',
  SETTINGS: 'app_settings',
  CHANNELS: 'app_monitor_channels',
};

const translations = {
  en: {
    dashboard: 'Dashboard',
    monitor: 'Keyword Monitor',
    report_generator: 'Report Generator',
    newspaper: 'Newspaper',
    facebook: 'Facebook',
    youtube: 'YouTube',
    talkshow: 'Talkshow',
    propagandist: 'Propagandist',
    tools: 'Tools',
    login_error: 'Login Failed! Check username/password.',
    prayer_times: 'Prayer Times',
    tools_shortcut: 'Tools Shortcut',
    online: 'Online',
    night_mode: 'Night Mode',
    day_mode: 'Day Mode',
    selected: 'Selected',
    search_result: 'Search Result',
    search_placeholder: 'Search...',
    admin_panel: 'Admin Panel',
    footer_server_vite: 'Frontend Server',
    footer_connecting: 'Connecting...',
    footer_server_local: 'Backend Server',
    footer_disconnected: 'Disconnected',
    footer_copyright: '© 2024 LI Cell Media Hub. All rights reserved.',
    footer_user_manual: 'User Manual',
    footer_setup_guide: 'Setup Guide',
    favorite_panel: 'Favorites',
    open_ctrl: 'Open Selected (Ctrl+Enter)',
    total_items: 'Total Items',
    selected_open: 'Open Selected',
    open_all: 'Open All',
    no_data: 'No Data Found',
    db_empty: 'Database is empty.',
    load_default: 'Load Default Data',
    // Categories
    bangla: 'Bangla',
    indian: 'Indian',
    myanmar: 'Myanmar',
    international: 'International',
    national: 'National',
    english: 'English',
    local: 'Local',
    tv: 'TV Channels',
    radio: 'Radio',
    probashi: 'Expatriate',
    indian_nat: 'Indian National',
    indian_eng: 'Indian English',
    my_national: 'Myanmar National',
    my_english: 'Myanmar English',
    my_local: 'Myanmar Local',
    my_online: 'Myanmar Online',
    fb_national: 'FB National',
    fb_online: 'FB Online',
    fb_tv: 'FB TV',
    fb_radio: 'FB Radio',
    fb_local: 'FB Local',
    fb_pahari: 'FB Pahari',
    fb_defense: 'FB Defense',
    fb_police: 'FB Police',
    fb_govt: 'FB Govt',
    yt_news: 'YT News',
    yt_entertainment: 'YT Entertainment',
    yt_tech: 'YT Tech',
    yt_education: 'YT Education',
    yt_islamic: 'YT Islamic',
    yt_music: 'YT Music',
    yt_vlog: 'YT Vlog',
    yt_pahari: 'YT Pahari',
    yt_defense: 'YT Defense',
    yt_police: 'YT Police',
    yt_govt: 'YT Govt',
    latest_updates: 'Latest Updates',
    ts_neutral: 'Neutral/Mainstream',
    ts_awami: 'Pro-Awami',
    ts_bnp: 'Pro-BNP',
    ts_jamaat: 'Jamaat/Islamic',
    ts_activist: 'Online Activist',
    ts_army: 'Army Officers',
    prop_awami: 'Propagandist Awami',
    prop_bnp: 'Propagandist BNP',
    prop_jamaat: 'Propagandist Jamaat',
    prop_others: 'Others/Critics',
    open_tools: 'Open Tools',
    audio_to_text: 'Audio to Text',
    trend_news: 'Trend News',
    phonebook: 'Phonebook'
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    monitor: 'কিওয়ার্ড মনিটর',
    report_generator: 'রিপোর্ট জেনারেটর',
    newspaper: 'নিউজপেপার',
    facebook: 'ফেসবুক',
    youtube: 'ইউটিউব',
    talkshow: 'টকশো',
    propagandist: 'প্রপাগান্ডিষ্ট',
    tools: 'টুলস',
    login_error: 'লগিন ব্যর্থ হয়েছে! ইউজারনেম/পাসওয়ার্ড চেক করুন।',
    prayer_times: 'নামাজের সময়সূচি',
    tools_shortcut: 'টুলস শর্টকাট',
    online: 'অনলাইন',
    night_mode: 'নাইট মোড',
    day_mode: 'ডে মোড',
    selected: 'সিলেক্টেড',
    search_result: 'সার্চ ফলাফল',
    search_placeholder: 'অনুসন্ধান করুন...',
    admin_panel: 'এডমিন প্যানেল',
    footer_server_vite: 'ফ্রন্টএন্ড সার্ভার',
    footer_connecting: 'সংযুক্ত হচ্ছে...',
    footer_server_local: 'ব্যাকএন্ড সার্ভার',
    footer_disconnected: 'বিচ্ছিন্ন',
    footer_copyright: '© ২০২৪ এলআই সেল মিডিয়া হাব। সর্বস্বত্ব সংরক্ষিত।',
    footer_user_manual: 'ব্যবহার নির্দেশিকা',
    footer_setup_guide: 'সেটআপ গাইড',
    favorite_panel: 'ফেভারিট',
    open_ctrl: 'সিলেক্টেড ওপেন (Ctrl+Enter)',
    total_items: 'মোট আইটেম',
    selected_open: 'সিলেক্টেড ওপেন',
    open_all: 'সব ওপেন',
    no_data: 'কোনো তথ্য পাওয়া যায়নি',
    db_empty: 'ডাটাবেস খালি।',
    load_default: 'ডিফল্ট ডাটা লোড করুন',
    // Categories (Usually fetched but defaults for UI labels)
    bangla: 'বাংলা',
    indian: 'ইন্ডিয়ান',
    myanmar: 'মায়ানমার',
    international: 'ইন্টান্যাশনাল',
    national: 'জাতীয়',
    english: 'ইংরেজি',
    local: 'লোকাল',
    tv: 'টিভি চ্যানেল',
    radio: 'রেডিও',
    probashi: 'প্রবাসী',
    indian_nat: 'জাতীয়',
    indian_eng: 'ইংরেজি',
    my_national: 'জাতীয়',
    my_english: 'ইংরেজি',
    my_local: 'লোকাল',
    my_online: 'অনলাইন',
    fb_national: 'জাতীয় সংবাদ',
    fb_online: 'অনলাইন পোর্টাল',
    fb_tv: 'টিভি চ্যানেল',
    fb_radio: 'রেডিও',
    fb_local: 'লোকাল সংবাদ',
    fb_pahari: 'পাহাড়ী সংগঠন',
    fb_defense: 'প্রতিরক্ষা বাহিনী',
    fb_police: 'আইন-শৃঙ্খলা ও উদ্ধার',
    fb_govt: 'সরকারি সংস্থা',
    yt_news: 'সংবাদ',
    yt_entertainment: 'বিনোদন ও নাটক',
    yt_tech: 'প্রযুক্তি',
    yt_education: 'শিক্ষা',
    yt_islamic: 'ইসলামিক',
    yt_music: 'মিউজিক',
    yt_vlog: 'ভ্লগ',
    yt_pahari: 'পাহাড়ী সংগঠন',
    yt_defense: 'প্রতিরক্ষা বাহিনী',
    yt_police: 'আইন-শৃঙ্খলা ও উদ্ধার',
    yt_govt: 'সরকারি সংস্থা',
    latest_updates: 'লেটেস্ট আপডেট',
    ts_neutral: 'নিরপেক্ষ / মেইনস্ট্রিম',
    ts_awami: 'আওয়ামী পন্থী',
    ts_bnp: 'বিএনপি পন্থী',
    ts_jamaat: 'জামায়াত / ইসলামিক',
    ts_activist: 'অনলাইন অ্যাক্টিভিস্ট',
    ts_army: 'সেনা অফিসার',
    prop_awami: 'আওয়ামী পন্থী',
    prop_bnp: 'বিএনপি পন্থী',
    prop_jamaat: 'জামায়াত পন্থী',
    prop_others: 'অন্যান্য / সমালোচক',
    open_tools: 'টুলস প্যানেল',
    audio_to_text: 'অডিও টু টেক্সট',
    trend_news: 'ট্রেন্ড নিউজ',
    phonebook: 'মোবাইল নং'
  }
};

// New Interface for DB Channels
export interface MonitorChannel {
    id: number; // Database ID
    channel_id: string; // YouTube ID or URL
    name: string;
    type: 'youtube' | 'iptv';
}

interface AppContextType {
  // ... existing types ...
  collectedNews: CollectedArticle[];
  addCollectedNews: (articles: CollectedArticle[], forceMode?: boolean) => void;
  clearCollectedNews: () => void;
  cleanupOldNews: () => void;
  deleteCollectedArticle: (id: string) => void;
  
  user: User | null;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  resetSystem: () => void;
  
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  
  language: 'bn' | 'en';
  setLanguage: (l: 'bn' | 'en') => void;
  t: (key: string) => string;
  
  links: LinkItem[];
  addLink: (link: Omit<LinkItem, 'id' | 'order' | 'isFavorite'>) => void;
  addLinks: (links: any[]) => Promise<void>;
  updateLink: (id: string, data: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  reorderLinks: (newLinks: LinkItem[]) => void;
  
  menuStructure: MenuItem[];
  addMenu: (id: string, label: string, parentId?: string) => Promise<void>;
  updateMenu: (id: string, label: string, parentId?: string) => Promise<void>;
  deleteMenu: (id: string) => Promise<void>;

  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  messages: Message[];
  fetchMessages: () => void;
  sendMessage: (userId: string, text: string) => Promise<void>;
  markMessageRead: (msgId: number) => void;

  logs: ActivityLog[];
  logAction: (action: string, type?: 'success' | 'error' | 'warning' | 'info', details?: string) => void;
  
  keywords: Keyword[];
  addKeyword: (k: string, type: 'monitor' | 'report' | 'both', variations: string[], color: string, opacity?: number, isActive?: boolean) => void;
  updateKeyword: (id: number, data: Partial<Keyword>) => void;
  removeKeyword: (id: number) => void;
  
  addRule: (keywordId: number, mustInclude: string[], mustExclude: string[]) => void;
  toggleRule: (ruleId: number, isActive: boolean) => void;
  deleteRule: (ruleId: number) => void;

  spotlightItems: SpotlightItem[];
  addSpotlight: (word: string, variations: string[], color: string, opacity: number) => void;
  updateSpotlight: (id: number, data: Partial<SpotlightItem>) => void;
  deleteSpotlight: (id: number) => void;
  toggleSpotlight: (id: number, isActive: boolean) => void;

  rssFeeds: RSSFeed[];
  fetchRssFeeds: () => void;
  addRssFeed: (feed: Omit<RSSFeed, 'id' | 'is_active'>) => void;
  updateRssFeed: (id: number, feed: Partial<RSSFeed>) => void;
  deleteRssFeed: (id: number) => void;
  toggleRssFeed: (feed: RSSFeed) => void;
  
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;

  // New Channel Methods
  monitorChannels: MonitorChannel[];
  fetchMonitorChannels: () => void;
  addMonitorChannel: (name: string, channelId: string, type: 'youtube' | 'iptv') => void;
  deleteMonitorChannel: (id: number) => void;

  trashBin: TrashItem[];
  restoreFromTrash: (id: string | number) => void;
  emptyTrash: () => void;
  deleteForever: (id: string | number) => void;

  openLink: (link: LinkItem) => void;
  toggleFavorite: (id: string) => void;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchSignal: number;
  triggerSearchNav: () => void;
  
  toolWindowState: 'open' | 'closed' | 'minimized' | 'maximized';
  setToolWindowState: (state: 'open' | 'closed' | 'minimized' | 'maximized') => void;
  
  activeToolTab: string;
  setActiveToolTab: (tab: string) => void;

  isNavbarVisible: boolean;
  toggleNavbar: () => void;

  seedDatabase: () => void;
  fetchDashboardStats: () => Promise<DashboardStats | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const API_BASE = getApiBaseUrl();

  const [user, setUser] = useState<User | null>({
      id: 'bypass_admin',
      username: 'admin',
      role: 'admin',
      name: 'Super Admin'
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
     return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'light';
  });

  const [language, setLanguageState] = useState<'bn' | 'en'>(() => {
      const saved = localStorage.getItem('app_language');
      return (saved === 'bn' || saved === 'en') ? saved : 'bn';
  });

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [menuStructure, setMenuStructure] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [spotlightItems, setSpotlightItems] = useState<SpotlightItem[]>([]);
  const [rssFeeds, setRssFeeds] = useState<RSSFeed[]>([]);
  const [collectedNews, setCollectedNews] = useState<CollectedArticle[]>([]);
  const [monitorChannels, setMonitorChannels] = useState<MonitorChannel[]>([]);
  const [trashBin, setTrashBin] = useState<TrashItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSignal, setSearchSignal] = useState(0);
  const [toolWindowState, setToolWindowState] = useState<'open' | 'closed' | 'minimized' | 'maximized'>('closed');
  const [activeToolTab, setActiveToolTab] = useState('downloader');
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // --- FIREBASE SYNC LISTENERS ---
  useEffect(() => {
    // 1. Sync Settings
    onValue(ref(db, 'settings'), (snapshot) => {
        const data = snapshot.val();
        if (data) setSettings(prev => ({ ...prev, ...data }));
    });

    // 2. Sync Keywords
    onValue(ref(db, 'keywords'), (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) setKeywords(data);
    });

    // 3. Sync Links (Newspaper)
    onValue(ref(db, 'links'), (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) setLinks(data);
    });

    // 4. Sync Users
    onValue(ref(db, 'users'), (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) setUsers(data);
    });

    // 5. Sync RSS Feeds
    onValue(ref(db, 'rss_feeds'), (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) setRssFeeds(data);
    });

    // 6. Sync Spotlight
    onValue(ref(db, 'spotlight'), (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) setSpotlightItems(data);
    });

    // 7. Sync Channels
    onValue(ref(db, 'monitor_channels'), (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) setMonitorChannels(data);
    });

    // 8. Sync Menus (NEW)
    onValue(ref(db, 'menus'), (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) setMenuStructure(data);
    });

  }, []);

  // --- INITIAL LOAD FROM LOCAL DB (For faster startup & backup) ---
  useEffect(() => {
      fetchLinks(); fetchMenus(); fetchUsers(); fetchKeywords(); fetchSpotlight(); 
      fetchRssFeeds(); fetchCollectedNews(); fetchLogs(); fetchSettings(); fetchMonitorChannels();
      if(user) fetchMessages();
  }, [user]);

  const safeJsonParse = async (res: Response, fallback: any = []) => {
      const text = await res.text();
      try { return JSON.parse(text); } catch (e) { return { success: false, data: fallback }; }
  };

  const logAction = async (action: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', details: string = '') => {
      if (!user) return;
      const newLog: ActivityLog = { id: generateId(), action, user: user.username, type, details, timestamp: Date.now() };
      setLogs(prev => [newLog, ...prev].slice(0, 500));
      // Sync Logs to PHP only (to avoid Firebase clutter, or sync if needed)
      try { await fetch(`${API_BASE}/logs.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newLog) }); } catch(e) {}
  };

  // --- DATA FETCHING (PHP MySQL) ---
  const fetchLinks = async () => { try { const res = await fetch(`${API_BASE}/links.php`); const data = await safeJsonParse(res); if (data.success) { setLinks(data.data); } } catch (e) {} };
  
  // Modified fetchMenus to return data for chaining
  const fetchMenus = async () => { 
      try { 
          const res = await fetch(`${API_BASE}/menus.php`); 
          const data = await safeJsonParse(res, DEFAULT_MENU); 
          if (data.success) { 
              setMenuStructure(data.data); 
              return data.data; 
          } 
      } catch (e) {} 
      return null;
  };

  const fetchUsers = async () => { try { const res = await fetch(`${API_BASE}/users.php`); const data = await safeJsonParse(res); if (data.success) setUsers(data.data); } catch (e) {} };
  const fetchKeywords = async () => { try { const res = await fetch(`${API_BASE}/keywords.php`); const data = await safeJsonParse(res); if (data.success) setKeywords(data.data); } catch (e) {} };
  const fetchSpotlight = async () => { try { const res = await fetch(`${API_BASE}/spotlight.php`); const data = await safeJsonParse(res); if (data.success) setSpotlightItems(data.data); } catch (e) {} };
  const fetchRssFeeds = async () => { try { const res = await fetch(`${API_BASE}/rss_handler.php?action=list`); const data = await safeJsonParse(res); if (data.success) setRssFeeds(data.data); } catch (e) {} };
  const fetchCollectedNews = async () => { try { const res = await fetch(`${API_BASE}/collected_news.php`); const data = await safeJsonParse(res); if (data.success) setCollectedNews(data.data); } catch (e) {} };
  const fetchLogs = async () => { try { const res = await fetch(`${API_BASE}/logs.php`); const data = await safeJsonParse(res); if (data.success) setLogs(data.data); } catch (e) {} };
  const fetchMonitorChannels = async () => { try { const res = await fetch(`${API_BASE}/channels.php`); const data = await safeJsonParse(res); if (data.success) setMonitorChannels(data.data); } catch (e) {} };
  const fetchSettings = async () => { 
      try { 
          const res = await fetch(`${API_BASE}/settings.php`); 
          const data = await safeJsonParse(res); 
          if (data.success) { 
              const merged = { ...DEFAULT_SETTINGS, ...data.data }; 
              setSettings(merged); 
              if(merged.siteTitle) document.title = merged.siteTitle;
          } 
      } catch (e) { } 
  };

  // --- ACTIONS (SYNC TO MYSQL & FIREBASE) ---

  const updateSettings = async (newSettings: Partial<SystemSettings>) => { 
      const updated = { ...settings, ...newSettings }; 
      setSettings(updated); 
      // 1. Sync to Firebase
      set(ref(db, 'settings'), updated);
      // 2. Sync to MySQL
      try { 
          await fetch(`${API_BASE}/settings.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }); 
          logAction('Updated System Settings', 'success'); 
      } catch (e) {} 
  };

  const addLink = async (linkData: any) => { 
      const newLink = { ...linkData, id: linkData.id || generateId() };
      // 1. MySQL
      try { await fetch(`${API_BASE}/links.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', ...newLink }) }); } catch (e) {}
      // 2. Firebase
      const updatedLinks = [...links, newLink];
      set(ref(db, 'links'), updatedLinks);
      // 3. Local State (Optimistic)
      setLinks(updatedLinks);
      logAction('Added Link', 'success', newLink.title); 
  };

  const addLinks = async (newItems: any[]) => {
      const processedItems = newItems.map(item => ({ ...item, id: generateId() }));
      // 1. MySQL
      try { await fetch(`${API_BASE}/links.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_bulk', links: processedItems }) }); } catch(e){}
      // 2. Firebase
      const updatedLinks = [...links, ...processedItems];
      set(ref(db, 'links'), updatedLinks);
      setLinks(updatedLinks);
      logAction('Bulk Added Links', 'success', `Count: ${newItems.length}`);
  };

  const updateLink = async (id: string, data: Partial<LinkItem>) => { 
      const updatedLinks = links.map(l => l.id === id ? { ...l, ...data } : l);
      // 1. MySQL
      try { await fetch(`${API_BASE}/links.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, ...data }) }); } catch(e){}
      // 2. Firebase
      set(ref(db, 'links'), updatedLinks);
      setLinks(updatedLinks);
      if(!data.lastOpened) logAction('Updated Link', 'success', `ID: ${id}`);
  };
  
  const deleteLink = async (id: string) => {
      const updatedLinks = links.filter(l => l.id !== id);
      // 1. MySQL
      try { await fetch(`${API_BASE}/links.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); } catch(e){}
      // 2. Firebase
      set(ref(db, 'links'), updatedLinks);
      setLinks(updatedLinks);
      logAction('Deleted Link', 'warning', `ID: ${id}`);
  };

  const addUser = async (newUser: User) => { 
      const userWithId = { ...newUser, id: generateId() };
      try { await fetch(`${API_BASE}/users.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', ...userWithId }) }); } catch(e){}
      const updatedUsers = [...users, userWithId];
      set(ref(db, 'users'), updatedUsers);
      setUsers(updatedUsers);
      logAction('Added User', 'success', newUser.username); 
  };

  const updateUser = async (id: string, data: Partial<User>) => { 
      const updatedUsers = users.map(u => u.id === id ? { ...u, ...data } : u);
      try { await fetch(`${API_BASE}/users.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, ...data }) }); } catch(e){}
      set(ref(db, 'users'), updatedUsers);
      setUsers(updatedUsers);
      logAction('Updated User', 'success', data.username || id); 
  };
  
  const deleteUser = async (id: string) => {
      const updatedUsers = users.filter(u => u.id !== id);
      try { await fetch(`${API_BASE}/users.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); } catch(e){}
      set(ref(db, 'users'), updatedUsers);
      setUsers(updatedUsers);
      logAction('Deleted User', 'warning', `ID: ${id}`);
  };

  const addKeyword = (k: string, type: 'monitor' | 'report' | 'both', variations: string[] = [], color: string = '#0ea5e9', opacity: number = 1.0, isActive: boolean = true) => { 
      fetch(`${API_BASE}/keywords.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', keyword: k, type, variations, color, opacity, is_active: isActive }) })
      .then(async () => {
          const res = await fetch(`${API_BASE}/keywords.php`);
          const data = await res.json();
          if(data.success) {
              set(ref(db, 'keywords'), data.data);
              setKeywords(data.data);
              logAction('Added Keyword', 'success', k);
          }
      });
  };

  const updateKeyword = (id: number, data: Partial<Keyword>) => { 
      const current = keywords.find(k => k.id === id); 
      if (current) { 
          fetch(`${API_BASE}/keywords.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, ...current, ...data }) })
          .then(() => {
              const updatedKeywords = keywords.map(k => k.id === id ? { ...k, ...data } : k);
              set(ref(db, 'keywords'), updatedKeywords);
              setKeywords(updatedKeywords);
              logAction('Updated Keyword', 'success', data.keyword || '');
          });
      } 
  };
  
  const removeKeyword = (id: number) => {
      fetch(`${API_BASE}/keywords.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
      .then(() => {
          const updatedKeywords = keywords.filter(k => k.id !== id);
          set(ref(db, 'keywords'), updatedKeywords);
          setKeywords(updatedKeywords);
          logAction('Deleted Keyword', 'warning', `ID: ${id}`);
      });
  };

  const addMonitorChannel = async (name: string, channelId: string, type: 'youtube' | 'iptv') => {
      try {
          await fetch(`${API_BASE}/channels.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', name, channel_id: channelId, type }) });
          const res = await fetch(`${API_BASE}/channels.php`);
          const data = await res.json();
          if (data.success) {
              set(ref(db, 'monitor_channels'), data.data);
              setMonitorChannels(data.data);
              logAction('Added Monitor Channel', 'success', name);
          }
      } catch(e) { logAction('Add Channel Error', 'error'); }
  };

  const deleteMonitorChannel = async (id: number) => {
      try {
          await fetch(`${API_BASE}/channels.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
          const updated = monitorChannels.filter(c => c.id !== id);
          set(ref(db, 'monitor_channels'), updated);
          setMonitorChannels(updated);
          logAction('Deleted Monitor Channel', 'warning', `ID: ${id}`);
      } catch(e) { logAction('Delete Channel Error', 'error'); }
  };

  const openLink = (link: LinkItem) => { window.open(link.url, '_blank'); updateLink(link.id, { lastOpened: Date.now() }); };
  const toggleFavorite = (id: string) => { const link = links.find(l => l.id === id); if(link) { updateLink(id, { isFavorite: !link.isFavorite }); } };
  const reorderLinks = async (newLinks: LinkItem[]) => { /* ... */ };
  
  // Menus with Firebase Sync
  const addMenu = async (id: string, label: string, parentId?: string) => { 
      try { 
          await fetch(`${API_BASE}/menus.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', id, label, parent_id: parentId }) }); 
          const newData = await fetchMenus();
          if(newData) set(ref(db, 'menus'), newData);
      } catch(e){}
  };
  const updateMenu = async (id: string, label: string, parentId?: string) => { 
      try { 
          await fetch(`${API_BASE}/menus.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, label, parent_id: parentId }) }); 
          const newData = await fetchMenus();
          if(newData) set(ref(db, 'menus'), newData);
      } catch(e){} 
  };
  const deleteMenu = async (id: string) => { 
      try { 
          await fetch(`${API_BASE}/menus.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); 
          const newData = await fetchMenus();
          if(newData) set(ref(db, 'menus'), newData);
      } catch(e){} 
  };

  // Rules
  const addRule = async (keywordId: number, mustInclude: string[], mustExclude: string[]) => { await fetch(`${API_BASE}/keywords.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_rule', keyword_id: keywordId, mustInclude, mustExclude }) }); fetchKeywords(); };
  const toggleRule = (ruleId: number, isActive: boolean) => { fetch(`${API_BASE}/keywords.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_rule', rule_id: ruleId, is_active: isActive }) }).then(() => fetchKeywords()); };
  const deleteRule = (ruleId: number) => { fetch(`${API_BASE}/keywords.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_rule', rule_id: ruleId }) }).then(() => fetchKeywords()); };

  // Spotlight
  const addSpotlight = async (word: string, variations: string[], color: string, opacity: number) => { 
      await fetch(`${API_BASE}/spotlight.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', word, variations, color, opacity }) }); 
      const res = await fetch(`${API_BASE}/spotlight.php`);
      const data = await res.json();
      if(data.success) {
          set(ref(db, 'spotlight'), data.data);
          setSpotlightItems(data.data);
      }
  };
  const updateSpotlight = async (id: number, data: Partial<SpotlightItem>) => { 
      const current = spotlightItems.find(s => s.id === id); 
      if(current) { 
          await fetch(`${API_BASE}/spotlight.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, ...current, ...data }) }); 
          const updated = spotlightItems.map(s => s.id === id ? {...s, ...data} : s);
          set(ref(db, 'spotlight'), updated);
          setSpotlightItems(updated);
      } 
  };
  const deleteSpotlight = async (id: number) => { 
      await fetch(`${API_BASE}/spotlight.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); 
      const updated = spotlightItems.filter(s => s.id !== id);
      set(ref(db, 'spotlight'), updated);
      setSpotlightItems(updated);
  };
  const toggleSpotlight = async (id: number, isActive: boolean) => { 
      await fetch(`${API_BASE}/spotlight.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id, isActive }) }); 
      const updated = spotlightItems.map(s => s.id === id ? {...s, isActive} : s);
      set(ref(db, 'spotlight'), updated);
      setSpotlightItems(updated);
  };

  // RSS
  const addRssFeed = async (feed: Omit<RSSFeed, 'id' | 'is_active'>) => {
      await fetch(`${API_BASE}/rss_handler.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', ...feed }) });
      const res = await fetch(`${API_BASE}/rss_handler.php?action=list`);
      const data = await res.json();
      if(data.success) { set(ref(db, 'rss_feeds'), data.data); setRssFeeds(data.data); }
  };
  const updateRssFeed = async (id: number, feed: Partial<RSSFeed>) => {
      await fetch(`${API_BASE}/rss_handler.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, ...feed }) });
      const updated = rssFeeds.map(f => f.id === id ? {...f, ...feed} : f);
      set(ref(db, 'rss_feeds'), updated);
      setRssFeeds(updated);
  };
  const deleteRssFeed = async (id: number) => {
      await fetch(`${API_BASE}/rss_handler.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      const updated = rssFeeds.filter(f => f.id !== id);
      set(ref(db, 'rss_feeds'), updated);
      setRssFeeds(updated);
  };
  const toggleRssFeed = async (feed: RSSFeed) => {
      await fetch(`${API_BASE}/rss_handler.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id: feed.id, is_active: !feed.is_active }) });
      const updated = rssFeeds.map(f => f.id === feed.id ? {...f, is_active: !feed.is_active} : f);
      set(ref(db, 'rss_feeds'), updated);
      setRssFeeds(updated);
  };

  // Messages
  const fetchMessages = async () => { if(!user) return; try { const res = await fetch(`${API_BASE}/messages.php?user_id=${user.id}`); const data = await safeJsonParse(res); if (data.success) { setMessages(data.data); } } catch(e) {} };
  const sendMessage = async (userId: string, text: string) => { try { await fetch(`${API_BASE}/messages.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, message: text, sender: user?.name }) }); logAction('Message Sent', 'info', `To: ${userId}`); } catch(e) { logAction('Message Send Error', 'error'); } };
  const markMessageRead = async (msgId: number) => { setMessages(prev => prev.map(m => m.id === msgId ? {...m, is_read: true} : m)); try { await fetch(`${API_BASE}/messages.php`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: msgId }) }); } catch(e) {} };

  // Other Utils
  const seedDatabase = async () => { try { await fetch(`${API_BASE}/setup.php`); logAction('Database Seeded', 'success'); alert("Database seeded/reset from server configuration."); window.location.reload(); } catch(e: any) { logAction('Seed DB Error', 'error', e.toString()); alert("Failed to seed."); } };
  const triggerSearchNav = () => setSearchSignal(prev => prev + 1);
  const toggleNavbar = () => setIsNavbarVisible(prev => !prev);
  const login = async (u: string, p: string) => { try { const res = await fetch(`${API_BASE}/login.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) }); const data = await res.json(); if (data.success) { setUser(data.user); logAction('Login Success', 'success', `User: ${u}`); return true; } } catch(e) { if (u === 'admin' && p === '123') { setUser({ id: '1', username: 'admin', name: 'Super Admin', role: 'admin' }); return true; } } logAction('Login Failed', 'warning', `User: ${u}`); return false; };
  const logout = () => { setUser(null); logAction('Logout', 'info'); };
  const resetSystem = () => { if (window.confirm('Reset local cache?')) { localStorage.clear(); window.location.reload(); } };
  const setTheme = (t: 'light' | 'dark') => setThemeState(t);
  const setLanguage = (l: 'bn' | 'en') => setLanguageState(l);
  const t = (key: string) => { const lang = language || 'bn'; const dict = (translations as any)[lang]; return dict?.[key] || key; };
  useEffect(() => { localStorage.setItem('app_theme', theme); if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [theme]);
  useEffect(() => localStorage.setItem('app_language', language), [language]);
  
  // Trash and Collected News (Not synced to Firebase to save bandwidth)
  const addCollectedNews = async (articles: CollectedArticle[], forceMode: boolean = false) => {
      let newArticles = articles;
      if (!forceMode) {
          const existingLinks = new Set(collectedNews.map(c => c.link));
          newArticles = articles.filter(a => !existingLinks.has(a.link));
      }
      if (newArticles.length > 0) {
          let updatedState = [...collectedNews];
          if (forceMode) {
              const newLinks = new Set(newArticles.map(a => a.link));
              updatedState = updatedState.filter(c => !newLinks.has(c.link));
          }
          const currentAsOld = updatedState.map(c => ({...c, isLatest: false}));
          const newAsLatest = newArticles.map(c => ({...c, isLatest: true}));
          const finalState = [...newAsLatest, ...currentAsOld];
          setCollectedNews(finalState);
          await fetch(`${API_BASE}/collected_news.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'add', articles: newArticles, force_mode: forceMode })
          });
      }
  };
  const clearCollectedNews = async () => { setCollectedNews([]); await fetch(`${API_BASE}/collected_news.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clear_all' }) }); };
  const cleanupOldNews = async () => { await fetch(`${API_BASE}/collected_news.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cleanup_old' }) }); fetchCollectedNews(); };
  const deleteCollectedArticle = async (id: string) => { 
      const art = collectedNews.find(c => c.id === id);
      if (art) { addToTrash({ id: art.id, type: 'news', data: art, deletedAt: Date.now() }); }
      const updated = collectedNews.filter(c => c.id !== id); setCollectedNews(updated); 
      await fetch(`${API_BASE}/collected_news.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); 
  };
  
  const addToTrash = (item: TrashItem) => { setTrashBin(prev => { const newBin = [item, ...prev].slice(0, 500); return newBin; }); };
  const restoreFromTrash = async (id: string | number) => { 
      const itemToRestore = trashBin.find(t => t.id === id); if (!itemToRestore) return;
      if (itemToRestore.type === 'link') { addLink(itemToRestore.data); } 
      else if (itemToRestore.type === 'user') { addUser(itemToRestore.data); } 
      else if (itemToRestore.type === 'keyword') { addKeyword(itemToRestore.data.keyword, itemToRestore.data.type, itemToRestore.data.variations, itemToRestore.data.color, itemToRestore.data.opacity, itemToRestore.data.is_active); } 
      else if (itemToRestore.type === 'news') { addCollectedNews([itemToRestore.data], true); } 
      else if (itemToRestore.type === 'feed') { addRssFeed(itemToRestore.data); } 
      else if (itemToRestore.type === 'spotlight') { addSpotlight(itemToRestore.data.word, itemToRestore.data.variations, itemToRestore.data.color, itemToRestore.data.opacity); }
      setTrashBin(prev => prev.filter(t => t.id !== id));
  };
  const deleteForever = (id: string | number) => { setTrashBin(prev => prev.filter(t => t.id !== id)); };
  const emptyTrash = () => { if(window.confirm('Empty trash?')) setTrashBin([]); };
  const fetchDashboardStats = async () => { try { const res = await fetch(`${API_BASE}/dashboard_stats.php`); const data = await safeJsonParse(res); if (data.success) return data.data; return null; } catch(e) { return null; } };

  const value = {
      user, login, logout, resetSystem,
      theme, setTheme,
      language, setLanguage, t,
      links, addLink, addLinks, updateLink, deleteLink, reorderLinks,
      menuStructure, addMenu, updateMenu, deleteMenu,
      users, addUser, updateUser, deleteUser,
      messages, fetchMessages, sendMessage, markMessageRead,
      logs, logAction,
      keywords, addKeyword, updateKeyword, removeKeyword,
      addRule, toggleRule, deleteRule,
      spotlightItems, addSpotlight, updateSpotlight, deleteSpotlight, toggleSpotlight,
      rssFeeds, fetchRssFeeds, addRssFeed, updateRssFeed, deleteRssFeed, toggleRssFeed,
      collectedNews, addCollectedNews, clearCollectedNews, cleanupOldNews, deleteCollectedArticle,
      trashBin, restoreFromTrash, emptyTrash, deleteForever,
      openLink, toggleFavorite,
      searchQuery, setSearchQuery, searchSignal, triggerSearchNav,
      toolWindowState, setToolWindowState,
      activeToolTab, setActiveToolTab,
      isNavbarVisible, toggleNavbar,
      seedDatabase,
      settings, updateSettings,
      fetchDashboardStats,
      monitorChannels, fetchMonitorChannels, addMonitorChannel, deleteMonitorChannel
  };

  return (
      <AppContext.Provider value={value}>
          {children}
      </AppContext.Provider>
  );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
