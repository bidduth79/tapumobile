
import React, { useState, useEffect, useRef } from 'react';
import { Rss, Plus, Trash2, Globe, FileUp, Play, CheckCircle, AlertTriangle, Loader2, RefreshCw, ToggleLeft, ToggleRight, Edit, Copy, ExternalLink, Clock, Database } from 'lucide-react';
import { getApiBaseUrl, formatTimeAgo } from '../../utils';
import { useApp } from '../../store';
import { RSSFeed } from '../../types';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const RssManager: React.FC<Props> = ({ showToast }) => {
  const { rssFeeds, fetchRssFeeds, addRssFeed, updateRssFeed, deleteRssFeed, toggleRssFeed } = useApp();
  const [newFeed, setNewFeed] = useState({ id: 0, name: '', url: '', type: 'News' });
  const [loading, setLoading] = useState(false);
  const [updatingMaster, setUpdatingMaster] = useState(false);
  const [testResult, setTestResult] = useState<{status: string, message: string, items?: any[]}>({ status: '', message: '' });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = getApiBaseUrl();

  useEffect(() => {
      fetchRssFeeds();
  }, []);

  const handleTest = async () => {
      if(!newFeed.url) return;
      setTestResult({ status: 'loading', message: 'যাচাই করা হচ্ছে...' });
      try {
          const res = await fetch(`${API_BASE}/rss_handler.php?action=test&url=${encodeURIComponent(newFeed.url)}`);
          const data = await res.json();
          if(data.success) {
              setTestResult({ 
                  status: 'success', 
                  message: `সফল! ${data.items.length} টি আইটেম পাওয়া গেছে।`, 
                  items: data.items 
              });
              if (!newFeed.name && data.items.length > 0) {
                  try {
                      const host = new URL(data.items[0].link).hostname.replace('www.', '').split('.')[0];
                      setNewFeed(prev => ({...prev, name: host.charAt(0).toUpperCase() + host.slice(1)}));
                  } catch(e){}
              }
              showToast('RSS লিংক যাচাই সফল হয়েছে', 'success');
          } else {
              setTestResult({ status: 'error', message: data.message || 'ব্যর্থ হয়েছে।' });
              showToast('RSS লিংক যাচাই ব্যর্থ', 'error');
          }
      } catch(e) {
          setTestResult({ status: 'error', message: 'কানেকশন এরর।' });
          showToast('সার্ভার কানেকশন এরর', 'error');
      }
  };

  const handleSave = async () => {
      if(!newFeed.name || !newFeed.url) { showToast('নাম এবং লিংক আবশ্যক', 'error'); return; }
      setLoading(true);
      try {
          if (isEditing) {
              updateRssFeed(newFeed.id, { name: newFeed.name, url: newFeed.url, type: newFeed.type });
              showToast('RSS আপডেট হয়েছে!', 'success');
          } else {
              addRssFeed(newFeed);
              showToast('RSS ফিড যোগ করা হয়েছে!', 'success');
          }
          resetForm();
      } catch(e) { showToast('সার্ভার এরর', 'error'); }
      finally { setLoading(false); }
  };

  const resetForm = () => {
      setNewFeed({ id: 0, name: '', url: '', type: 'News' });
      setTestResult({ status: '', message: '' });
      setIsEditing(false);
  };

  const startEdit = (feed: RSSFeed) => {
      setNewFeed({ id: feed.id, name: feed.name, url: feed.url, type: feed.type });
      setIsEditing(true);
      setTestResult({ status: '', message: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
      const result = await window.Swal.fire({
          title: 'আপনি কি নিশ্চিত?',
          text: "এই ফিডটি ডিলিট করা হবে!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'হ্যাঁ, মুছে ফেলুন',
          cancelButtonText: 'বাতিল'
      });

      if (result.isConfirmed) {
          deleteRssFeed(id);
          showToast('ফিড মুছে ফেলা হয়েছে', 'warning');
      }
  };

  const generateGoogleRss = () => {
      if(!newFeed.url) return;
      try {
          let query = newFeed.url;
          if (query.startsWith('http')) {
              query = new URL(query).hostname.replace('www.', '');
          }
          const rssUrl = `https://news.google.com/rss/search?q=site:${query}+when:24h&hl=bn&gl=BD&ceid=BD:bn`;
          setNewFeed({ ...newFeed, url: rssUrl });
          showToast('Google RSS লিংক তৈরি করা হয়েছে। এবার যাচাই করুন।', 'info');
      } catch(e) { showToast('লিংক থেকে ডোমেইন পাওয়া যায়নি', 'error'); }
  };

  const copyMasterRss = () => {
      const masterUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}api/rss_handler.php?action=master_feed`;
      navigator.clipboard.writeText(masterUrl);
      showToast('Master RSS লিংক কপি হয়েছে!', 'success');
  };

  const updateMasterFeed = async () => {
      setUpdatingMaster(true);
      try {
          const res = await fetch(`${API_BASE}/rss_handler.php?action=force_update_master`);
          const data = await res.json();
          if (data.success) {
              showToast(`মাস্টার ফিড আপডেট হয়েছে! মোট নিউজ: ${data.count}`, 'success');
          } else {
              showToast('আপডেট ব্যর্থ হয়েছে', 'error');
          }
      } catch (e) {
          showToast('কানেকশন এরর', 'error');
      } finally {
          setUpdatingMaster(false);
      }
  };

  // Helper for time ago display
  const getTimeAgo = (dateStr: string) => {
      if(!dateStr) return '';
      const date = new Date(dateStr);
      if(isNaN(date.getTime())) return '';
      return formatTimeAgo(date.getTime());
  };

  // OPML Parser and Upload Logic
  const handleOpmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (!text) return;

          // Simple parsing logic
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          const outlines = xmlDoc.getElementsByTagName("outline");
          const feedsToImport = [];

          for (let i = 0; i < outlines.length; i++) {
              const node = outlines[i];
              const url = node.getAttribute("xmlUrl") || node.getAttribute("url");
              if (url) {
                  feedsToImport.push({
                      title: node.getAttribute("title") || node.getAttribute("text") || "Untitled Feed",
                      url: url,
                      category: "News"
                  });
              }
          }

          if (feedsToImport.length > 0) {
              setLoading(true);
              try {
                  const res = await fetch(`${API_BASE}/rss_handler.php`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'import_opml', feeds: feedsToImport })
                  });
                  const data = await res.json();
                  if (data.success) {
                      showToast(`${data.count} টি ফিড ইম্পোর্ট করা হয়েছে!`, 'success');
                      fetchRssFeeds();
                  } else {
                      showToast('ইম্পোর্ট ব্যর্থ হয়েছে: ' + data.message, 'error');
                  }
              } catch (err) {
                  showToast('সার্ভার এরর', 'error');
              } finally {
                  setLoading(false);
              }
          } else {
              showToast('ফাইলে কোনো ভ্যালিড RSS ফিড পাওয়া যায়নি', 'warning');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit sticky top-20">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg text-teal-600"><Rss size={24}/></div>
                <div>
                    <h3 className="font-bold dark:text-white text-lg">{isEditing ? 'ফিড এডিট' : 'নতুন RSS ফিড'}</h3>
                    <p className="text-xs text-gray-500">নিউজ অটোমেশন কনফিগারেশন</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">RSS/Web লিংক</label>
                    <div className="flex gap-2">
                        <input className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 text-sm" placeholder="https://..." value={newFeed.url} onChange={e => setNewFeed({...newFeed, url: e.target.value})} />
                        <button onClick={handleTest} disabled={!newFeed.url} className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-teal-600 disabled:opacity-50" title="যাচাই করুন">
                            <Play size={18}/>
                        </button>
                    </div>
                    
                    {/* Error Handling / Creation Assistant */}
                    {testResult.status === 'error' && (
                        <div className="mt-2 text-xs p-2 rounded bg-red-50 text-red-700 border border-red-200">
                            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={12}/> লিংকটি সঠিক RSS ফিড নয়।</div>
                            <button onClick={generateGoogleRss} className="w-full py-1 bg-white border border-red-300 rounded hover:bg-red-100 font-bold shadow-sm flex items-center justify-center gap-1">
                                <RefreshCw size={10}/> Google News RSS তৈরি করুন
                            </button>
                        </div>
                    )}

                    {testResult.status === 'success' && (
                        <div className="mt-2 space-y-2">
                            <div className="text-xs p-2 rounded bg-green-50 text-green-700 flex items-center gap-2 border border-green-200">
                                <CheckCircle size={12}/> {testResult.message}
                            </div>
                            
                            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg flex flex-col gap-2">
                                <span className="text-[10px] text-blue-600 font-bold">নিউজ পুরাতন মনে হচ্ছে?</span>
                                <button onClick={generateGoogleRss} className="w-full py-1.5 bg-white border border-blue-300 text-blue-600 rounded hover:bg-blue-100 font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition">
                                    <RefreshCw size={12}/> Google News RSS তৈরি করুন
                                </button>
                            </div>
                        </div>
                    )}

                    {testResult.items && testResult.items.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 max-h-40 overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] font-bold text-gray-500 mb-1 sticky top-0 bg-gray-50 dark:bg-gray-800">Preview (Click to check):</p>
                            {testResult.items.map((item:any, i:number) => (
                                <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block text-[10px] border-b border-gray-100 dark:border-gray-700 py-1.5 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 px-1 rounded transition">
                                    <div className="truncate font-bold">{i+1}. {item.title}</div>
                                    <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
                                        <Clock size={8}/> {getTimeAgo(item.date)} <ExternalLink size={8}/>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">মিডিয়া নাম</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" placeholder="যেমন: বিবিসি বাংলা" value={newFeed.name} onChange={e => setNewFeed({...newFeed, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">ক্যাটাগরি</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" value={newFeed.type} onChange={e => setNewFeed({...newFeed, type: e.target.value})}>
                        <option value="News">News</option>
                        <option value="International">International</option>
                        <option value="Sports">Sports</option>
                        <option value="Entertainment">Entertainment</option>
                    </select>
                </div>
                
                <div className="flex gap-2">
                    {isEditing && <button onClick={resetForm} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition">বাতিল</button>}
                    <button onClick={handleSave} disabled={loading} className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                        {isEditing ? <RefreshCw size={18}/> : <Plus size={18}/>} {isEditing ? 'আপডেট করুন' : 'ফিড যোগ করুন'}
                    </button>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-[650px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold dark:text-white">সংরক্ষিত ফিড তালিকা ({rssFeeds.length})</h3>
                <div className="flex gap-2">
                    {/* OPML Import Button */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".opml,.xml" 
                        onChange={handleOpmlUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg font-bold hover:bg-orange-100 flex items-center gap-2 transition"
                    >
                        <FileUp size={14}/> OPML ইম্পোর্ট
                    </button>

                    <button 
                        onClick={updateMasterFeed} 
                        disabled={updatingMaster}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 transition shadow-md disabled:opacity-50"
                    >
                        <Database size={14} className={updatingMaster ? 'animate-pulse' : ''}/> {updatingMaster ? 'আপডেট হচ্ছে...' : 'মাস্টার ফিড আপডেট'}
                    </button>
                    <button onClick={copyMasterRss} className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 flex items-center gap-2 transition">
                        <Rss size={14}/> কপি লিংক
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {rssFeeds.map(feed => (
                    <div key={feed.id} className={`flex items-center justify-between p-3 rounded-xl border transition group ${feed.is_active ? 'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 opacity-60'}`}>
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${feed.status === 'active' ? 'bg-green-500 shadow-green-500/50 shadow-sm' : 'bg-red-500'}`} title={feed.status === 'active' ? 'Feed OK' : 'Feed Broken/Blocked'}></div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{feed.name}</h4>
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-500">{feed.type}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 truncate font-mono ml-4">
                                <Globe size={10}/> {feed.url}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleRssFeed(feed)} className={`${feed.is_active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`} title={feed.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}>
                                {feed.is_active ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                            </button>
                            <button onClick={() => startEdit(feed)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="এডিট">
                                <Edit size={16}/>
                            </button>
                            <button onClick={() => handleDelete(feed.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="মুছুন">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                ))}
                {rssFeeds.length === 0 && <div className="text-center py-20 text-gray-400">কোনো RSS ফিড নেই</div>}
            </div>
        </div>
    </div>
  );
};

export default RssManager;
