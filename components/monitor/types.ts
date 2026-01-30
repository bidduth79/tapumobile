
export interface Article {
  id: string; 
  title: string;
  link: string;
  date: string;
  source: string;
  time_ago: string;
  keyword: string;
  timestamp: number;
  description?: string; 
  type?: 'news' | 'facebook' | 'youtube' | 'tiktok' | 'direct' | 'twitter' | 'reddit' | 'telegram' | 'telegram_adv' | 'dorking' | 'bing' | 'tor';
}

export type MonitorMode = 'news' | 'facebook' | 'youtube' | 'tiktok' | 'direct' | 'twitter' | 'reddit' | 'telegram' | 'telegram_adv' | 'dorking' | 'bing' | 'tor';
