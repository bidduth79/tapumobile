
export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; 
  role: Role;
  name: string;
}

export interface Message {
    id: number;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
    sender: string;
}

export interface SystemSettings {
    // API Keys
    youtubeApiKey: string;
    geminiApiKey: string;

    // Report Generator Settings
    reportDefaultTimeRange: number;
    reportForceMode: boolean;
    reportStrictMode: boolean;
    reportFreeMode: boolean;
    reportFreeModeLang: 'bn' | 'en';

    // Monitor Settings
    monitorForceMode: boolean;
    monitorStrictMode: boolean;
    monitorFreeMode: boolean;          
    monitorFreeModeLang: 'bn' | 'en';  
    monitorRefreshInterval: number;
    monitorAutoRefresh: boolean;

    // Branding & Announcement (New)
    siteTitle: string;
    siteNotice: string;
    noticeActive: boolean;
    noticeType: 'info' | 'warning' | 'alert';
    blockedIps: string;

    // Newsroom Settings
    newsroom_yt_slots?: string;
    newsroom_iptv_slots?: string;
}

export const DEFAULT_SETTINGS: SystemSettings = {
    // API Defaults
    youtubeApiKey: '',
    geminiApiKey: '',

    // Report Defaults
    reportDefaultTimeRange: 3,
    reportForceMode: false,
    reportStrictMode: false,
    reportFreeMode: false,
    reportFreeModeLang: 'bn',

    // Monitor Defaults
    monitorForceMode: false,
    monitorStrictMode: false,
    monitorFreeMode: false,            
    monitorFreeModeLang: 'bn',         
    monitorRefreshInterval: 15,
    monitorAutoRefresh: true,

    // Branding Defaults
    siteTitle: 'LI Cell Media Hub',
    siteNotice: '',
    noticeActive: false,
    noticeType: 'info',
    blockedIps: '',

    // Newsroom Defaults
    newsroom_yt_slots: '',
    newsroom_iptv_slots: ''
};

export interface DashboardStats {
    total_users: number;
    total_links: number;
    total_keywords: number;
    todays_news: number;
    db_size: string;
    server_uptime: string;
    recent_logs: ActivityLog[];
    disk_free: number;
    disk_total: number;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  logo: string; 
  category: string;
  subCategory?: string;
  childCategory?: string;
  lastOpened?: number; 
  isFavorite: boolean;
  order: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  type: 'success' | 'error' | 'warning' | 'info'; 
  details?: string;
  timestamp: number;
}

export interface KeywordRule {
  id: number;
  keyword_id: number;
  must_include: string[];
  must_exclude: string[];
  is_active: boolean;
}

export interface Keyword {
  id: number;
  keyword: string;
  type: 'monitor' | 'report' | 'both';
  variations: string[];
  color?: string;
  opacity?: number;
  is_active?: boolean;
  rules?: KeywordRule[]; 
}

export interface SpotlightItem {
  id: number;
  word: string;
  variations: string[];
  color: string;
  opacity: number;
  isActive: boolean;
}

export interface CollectedArticle {
  id: string;
  title: string;
  link: string;
  dateStr: string; 
  timestamp: number; 
  source: string;
  keyword: string;
  isLatest: boolean;
  description?: string; 
}

export interface RSSFeed {
    id: number;
    name: string;
    url: string;
    type: string;
    is_active: boolean;
    status?: 'active' | 'error';
}

export interface PhoneContact {
  id: string;
  name_bn: string;
  name_en: string;
  designation: string;
  phone: string;
  email: string;
  category: string;
  district?: string;
}

export interface MenuItem {
  label: string;
  id: string;
  subItems?: MenuItem[];
}

export interface TrashItem {
  id: string | number;
  type: 'link' | 'user' | 'keyword' | 'news' | 'feed' | 'spotlight';
  data: any;
  deletedAt: number;
}

export const DEFAULT_MENU: MenuItem[] = [
  // ... (Keep existing menu) ...
  { label: 'কিওয়ার্ড মনিটর', id: 'monitor' },
  { label: 'রিপোর্ট জেনারেটর', id: 'report_generator' },
  { label: 'নিউজপেপার', id: 'newspaper', subItems: [ { label: 'বাংলা', id: 'bangla', subItems: [ { label: 'জাতীয়', id: 'national' }, { label: 'ইংরেজি', id: 'english' }, { label: 'লোকাল', id: 'local' }, { label: 'অনলাইন', id: 'online' }, { label: 'টিভি চ্যানেল', id: 'tv' }, { label: 'রেডিও', id: 'radio' }, { label: 'প্রবাসী', id: 'probashi' } ] }, { label: 'ইন্ডিয়ান', id: 'indian', subItems: [ { label: 'জাতীয়', id: 'indian_nat' }, { label: 'ইংরেজি', id: 'indian_eng' }, { label: 'লোকাল', id: 'local' }, { label: 'অনলাইন', id: 'online' }, ] }, { label: 'মায়ানমার', id: 'myanmar', subItems: [ { label: 'জাতীয়', id: 'my_national' }, { label: 'ইংরেজি', id: 'my_english' }, { label: 'লোকাল', id: 'my_local' }, { label: 'অনলাইন', id: 'my_online' } ] }, { label: 'ইন্টান্যাশনাল', id: 'international' } ] },
  { label: 'ফেসবুক', id: 'facebook', subItems: [ { label: 'জাতীয় সংবাদ', id: 'fb_national' }, { label: 'অনলাইন পোর্টাল', id: 'fb_online' }, { label: 'টিভি চ্যানেল', id: 'fb_tv' }, { label: 'রেডিও', id: 'fb_radio' }, { label: 'লোকাল সংবাদ', id: 'fb_local' }, { label: 'পাহাড়ী সংগঠন', id: 'fb_pahari' }, { label: 'প্রতিরক্ষা বাহিনী', id: 'fb_defense' }, { label: 'আইন-শৃঙ্খলা ও উদ্ধার', id: 'fb_police' }, { label: 'সরকারি সংস্থা', id: 'fb_govt' } ] },
  { label: 'ইউটিউব', id: 'youtube', subItems: [ { label: 'সংবাদ', id: 'yt_news' }, { label: 'বিনোদন ও নাটক', id: 'yt_entertainment' }, { label: 'প্রযুক্তি', id: 'yt_tech' }, { label: 'শিক্ষা', id: 'yt_education' }, { label: 'ইসলামিক', id: 'yt_islamic' }, { label: 'মিউজিক', id: 'yt_music' }, { label: 'ভ্লগ', id: 'yt_vlog' }, { label: 'পাহাড়ী সংগঠন', id: 'yt_pahari' }, { label: 'প্রতিরক্ষা বাহিনী', id: 'yt_defense' }, { label: 'আইন-শৃঙ্খলা ও উদ্ধার', id: 'yt_police' }, { label: 'সরকারি সংস্থা', id: 'yt_govt' } ] },
  { label: 'টকশো', id: 'talkshow', subItems: [ { label: 'লেটেস্ট আপডেট', id: 'latest_updates' }, { label: 'নিরপেক্ষ / মেইনস্ট্রিম', id: 'ts_neutral' }, { label: 'আওয়ামী পন্থী', id: 'ts_awami' }, { label: 'বিএনপি পন্থী', id: 'ts_bnp' }, { label: 'জামায়াত / ইসলামিক', id: 'ts_jamaat' }, { label: 'অনলাইন অ্যাক্টিভিস্ট', id: 'ts_activist' }, { label: 'সেনা অফিসার', id: 'ts_army' } ] },
  { label: 'প্রপাগান্ডিষ্ট', id: 'propagandist', subItems: [ { label: 'আওয়ামী পন্থী', id: 'prop_awami' }, { label: 'বিএনপি পন্থী', id: 'prop_bnp' }, { label: 'জামায়াত পন্থী', id: 'prop_jamaat' }, { label: 'অন্যান্য / সমালোচক', id: 'prop_others' } ] },
  { label: 'টুলস', id: 'tools', subItems: [ { label: 'টুলস প্যানেল', id: 'open_tools' }, { label: 'অডিও টু টেক্সট', id: 'audio_to_text' }, { label: 'ট্রেন্ড নিউজ', id: 'trend_news' }, { label: 'মোবাইল নং', id: 'phonebook' } ] }
];