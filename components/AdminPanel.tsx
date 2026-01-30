
import React, { useState } from 'react';
import { Activity, Database, Menu, Users, Tag, List, FileText, Settings, Zap, Rss, ShieldAlert, Sliders, Key, Trash2, RotateCcw, X, Home, Lock, PenTool, Moon, Sun } from 'lucide-react';
import { getApiBaseUrl } from '../utils';
import { useApp } from '../store';

// Import Sub-components
import PaperManager from './admin/PaperManager';
import UserManager from './admin/UserManager';
import KeywordManager from './admin/KeywordManager';
import MenuManager from './admin/MenuManager';
import LogViewer from './admin/LogViewer';
import RulesManager from './admin/RulesManager';
import SpotlightManager from './admin/SpotlightManager';
import RssManager from './admin/RssManager';
import SettingsManager from './admin/SettingsManager';
import ApiManager from './admin/ApiManager';
import RecycleBin from './admin/RecycleBin';
import AdminOverview from './admin/AdminOverview';
import BackupManager from './admin/BackupManager';
import BrandingManager from './admin/BrandingManager';
import SecurityManager from './admin/SecurityManager';

const AdminPanel: React.FC = () => {
  const { restoreFromTrash, theme, setTheme } = useApp();
  const [tab, setTab] = useState<'home' | 'papers' | 'users' | 'keywords' | 'rules' | 'logs' | 'menus' | 'spotlight' | 'rss' | 'settings' | 'api' | 'trash' | 'backup' | 'branding' | 'security'>('home');
  
  // Undo State
  const [undoData, setUndoData] = useState<{id: string | number, label: string, timeout: any} | null>(null);

  const tabs = [
    { id: 'home', label: 'হোম', icon: Home, color: 'text-indigo-600', activeColor: 'bg-indigo-600' },
    { id: 'papers', label: 'নিউজ পেপার', icon: FileText, color: 'text-blue-600', activeColor: 'bg-blue-600' }, 
    { id: 'menus', label: 'মেনু', icon: Menu, color: 'text-violet-600', activeColor: 'bg-violet-600' }, 
    { id: 'keywords', label: 'কিওয়ার্ড', icon: Tag, color: 'text-emerald-600', activeColor: 'bg-emerald-600' }, 
    { id: 'rules', label: 'রুলস', icon: ShieldAlert, color: 'text-rose-600', activeColor: 'bg-rose-600' }, 
    { id: 'spotlight', label: 'স্পটলাইট', icon: Zap, color: 'text-amber-600', activeColor: 'bg-amber-600' },
    { id: 'rss', label: 'RSS', icon: Rss, color: 'text-teal-600', activeColor: 'bg-teal-600' },
    { id: 'api', label: 'API Keys', icon: Key, color: 'text-purple-600', activeColor: 'bg-purple-600' },
    { id: 'backup', label: 'ব্যাকআপ', icon: Database, color: 'text-cyan-600', activeColor: 'bg-cyan-600' },
    { id: 'branding', label: 'ব্র্যান্ডিং', icon: PenTool, color: 'text-pink-600', activeColor: 'bg-pink-600' },
    { id: 'security', label: 'সিকিউরিটি', icon: Lock, color: 'text-red-600', activeColor: 'bg-red-600' },
    { id: 'settings', label: 'সেটিংস', icon: Sliders, color: 'text-gray-600', activeColor: 'bg-gray-600' },
    { id: 'users', label: 'ইউজার', icon: Users, color: 'text-cyan-600', activeColor: 'bg-cyan-600' }, 
    { id: 'logs', label: 'লগ', icon: List, color: 'text-slate-600', activeColor: 'bg-slate-600' },
    { id: 'trash', label: 'রিসাইকেল বিন', icon: Trash2, color: 'text-red-500', activeColor: 'bg-red-500' }
  ];

  const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      if (window.Swal) {
          window.Swal.fire({
              toast: true,
              position: 'top-end',
              icon: icon,
              title: title,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
              color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
          });
      } else {
          alert(title);
      }
  };

  const triggerUndo = (id: string | number, label: string) => {
      if (undoData?.timeout) clearTimeout(undoData.timeout);
      
      const timeout = setTimeout(() => {
          setUndoData(null);
      }, 5000);

      setUndoData({ id, label, timeout });
  };

  const handleUndoClick = () => {
      if (undoData) {
          restoreFromTrash(undoData.id);
          clearTimeout(undoData.timeout);
          setUndoData(null);
          showToast('সফলভাবে রিষ্টোর করা হয়েছে', 'success');
      }
  };

  const handleFixDatabase = async () => {
      const result = await window.Swal.fire({
          title: 'নিশ্চিত করুন',
          text: "আপনি কি ডাটাবেজ টেবিলগুলো রি-ইনিশিয়ালাইজ করতে চান?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'হ্যাঁ, ফিক্স করুন'
      });

      if (!result.isConfirmed) return;

      try {
          const res = await fetch(`${getApiBaseUrl()}/setup.php`);
          const data = await res.json();
          if (data.success) {
              showToast('সফল হয়েছে: ' + data.message, 'success');
              setTimeout(() => window.location.reload(), 1500);
          } else {
              showToast('এরর: ' + data.message, 'error');
          }
      } catch (e) {
          showToast('কানেকশন এরর। setup.php ফাইলটি আছে কিনা চেক করুন।', 'error');
      }
  };

  const handleCheckSession = async () => {
      try {
          const res = await fetch(`${getApiBaseUrl()}/system_status.php?t=${Date.now()}`);
          const data = await res.json();
          if (data.success) {
              showToast(`System Online | Time: ${data.server_time}`, 'success');
          } else {
              showToast(`DB Error: ${data.db_error}`, 'error');
          }
      } catch (e) {
          showToast('Failed to connect to backend.', 'error');
      }
  };

  const toggleTheme = () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="p-4 md:p-6 pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen relative">
      
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl font-black dark:text-white flex items-center gap-3">
                <span className="bg-gradient-to-r from-primary-600 to-indigo-600 text-transparent bg-clip-text">এডমিন প্যানেল</span>
            </h2>
            <div className="flex gap-2 items-center">
                <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 text-gray-600 dark:text-gray-300 shadow-sm transition hover:shadow-md"
                    title={theme === 'dark' ? 'Day Mode' : 'Night Mode'}
                >
                    {theme === 'dark' ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-indigo-600"/>}
                </button>
                <button onClick={handleCheckSession} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 hover:border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md">
                    <Activity size={16}/> সেশন স্ট্যাটাস
                </button>
                <button onClick={handleFixDatabase} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 hover:border-red-400 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md">
                    <Database size={16}/> টেবিল ফিক্স
                </button>
            </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {tabs.map((t: any) => {
                    const isActive = tab === t.id;
                    return (
                        <button 
                            key={t.id} 
                            onClick={() => setTab(t.id)} 
                            className={`
                                relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300
                                ${isActive 
                                    ? `${t.activeColor} text-white shadow-lg transform scale-105` 
                                    : `bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md`
                                }
                            `}
                        >
                            <t.icon size={18} className={!isActive ? t.color : 'text-white'} />
                            <span>{t.label}</span>
                            {isActive && (
                                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-70"></span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* Dynamic Content Rendering */}
      <div className="min-h-[600px] animate-fadeIn">
          {tab === 'home' && <AdminOverview />}
          {tab === 'papers' && <PaperManager showToast={showToast} triggerUndo={triggerUndo} />}
          {tab === 'users' && <UserManager showToast={showToast} triggerUndo={triggerUndo} />}
          {tab === 'keywords' && <KeywordManager showToast={showToast} triggerUndo={triggerUndo} />}
          {tab === 'rules' && <RulesManager showToast={showToast} />}
          {tab === 'spotlight' && <SpotlightManager showToast={showToast} />}
          {tab === 'rss' && <RssManager showToast={showToast} />}
          {tab === 'api' && <ApiManager showToast={showToast} />}
          {tab === 'backup' && <BackupManager showToast={showToast} />}
          {tab === 'branding' && <BrandingManager showToast={showToast} />}
          {tab === 'security' && <SecurityManager showToast={showToast} />}
          {tab === 'settings' && <SettingsManager showToast={showToast} />}
          {tab === 'menus' && <MenuManager showToast={showToast} />}
          {tab === 'logs' && <LogViewer />}
          {tab === 'trash' && <RecycleBin showToast={showToast} />}
      </div>

      {/* Undo Toast */}
      {undoData && (
          <div className="fixed bottom-6 right-6 z-[100] animate-slideUp">
              <div className="bg-gray-900 text-white pl-4 pr-3 py-3 rounded-lg shadow-2xl flex items-center gap-4 border border-gray-700">
                  <span className="text-sm font-medium">মুছে ফেলা হয়েছে: <b>{undoData.label}</b></span>
                  <div className="h-4 w-[1px] bg-gray-600"></div>
                  <button 
                      onClick={handleUndoClick} 
                      className="text-yellow-400 font-bold text-sm hover:underline flex items-center gap-1 transition-colors hover:text-yellow-300"
                  >
                      <RotateCcw size={14}/> UNDO
                  </button>
                  <button onClick={() => setUndoData(null)} className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800">
                      <X size={14}/>
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
