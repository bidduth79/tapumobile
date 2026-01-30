
import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils';
import { Wifi, WifiOff, Activity, HelpCircle, X, Server, Database, AlertTriangle, RefreshCw, User, Phone, Mail, MessageCircle, BookOpen, Zap, Layers, Terminal, CheckCircle, Play, XCircle } from 'lucide-react';
import { useApp } from '../store';

const Footer: React.FC = () => {
  const { t, language } = useApp();
  const currentYear = new Date().getFullYear();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string>('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showUserManual, setShowUserManual] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/system_status.php?t=${Date.now()}`);
      if (res.ok) {
          const data = await res.json();
          setIsConnected(data.success);
          if (!data.success) {
              setDbError(data.db_error || 'অজানা সমস্যা');
          } else {
              setDbError('');
          }
      } else {
          setIsConnected(false);
          setDbError(`HTTP Error: ${res.status}`);
      }
    } catch (e: any) {
      setIsConnected(false);
      setDbError('সার্ভার রেসপন্স করছে না।');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000); 
    return () => clearInterval(interval);
  }, []);

  const runSetup = async () => {
    if (!confirm('আপনি কি ডাটাবেজ সেটআপ রান করতে চান? এটি টেবিল তৈরি করবে।')) return;
    
    setLoadingSetup(true);
    try {
        const res = await fetch(`${getApiBaseUrl()}/setup.php`);
        const data = await res.json();
        if (data.success) {
            alert('সেটআপ সফল হয়েছে!');
            checkConnection();
            setShowSetupGuide(false);
        } else {
            alert('সেটআপ ব্যর্থ: ' + data.message);
        }
    } catch (e) {
        alert('কানেকশন এরর। setup.php ফাইলটি api ফোল্ডারে আছে কিনা দেখুন।');
    } finally {
        setLoadingSetup(false);
    }
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 hidden md:block">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs">
          
          {/* Left: Server Status */}
          <div className="flex items-center gap-3 order-2 md:order-1 min-w-[200px]">
             {/* Frontend Status (Always active) */}
             <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-800 transition-all shadow-sm cursor-help" title="Frontend Running">
                 <CheckCircle size={12} strokeWidth={3} fill="currentColor" className="text-white dark:text-gray-900" />
                 <span className="font-bold tracking-wide">{t('footer_server_vite')}</span>
             </div>

             {/* Backend Status */}
             {isConnected === null ? (
                 <div className="flex items-center gap-1.5 text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-600">
                     <Activity size={12} className="animate-spin" />
                     <span>{t('footer_connecting')}</span>
                 </div>
             ) : isConnected ? (
                 <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-800 transition-all shadow-sm cursor-help" title="Database Connected">
                     <Database size={12} strokeWidth={3} />
                     <span className="font-bold tracking-wide">{t('footer_server_local')} (Active)</span>
                 </div>
             ) : (
                 <button 
                    onClick={() => setShowSetupGuide(true)}
                    className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-800 transition-all shadow-sm hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer animate-pulse"
                    title={dbError}
                 >
                     <XCircle size={12} strokeWidth={3} />
                     <span className="font-bold tracking-wide">{t('footer_disconnected')}</span>
                 </button>
             )}
          </div>

          {/* Center: Copyright */}
          <div className="text-gray-500 dark:text-gray-400 font-medium order-3 md:order-2 w-full md:w-auto text-center md:text-left">
            {t('footer_copyright')}
          </div>

          {/* Right: Guides & Developer */}
          <div className="flex gap-2 text-gray-400 dark:text-gray-500 order-1 md:order-3 md:min-w-[200px] justify-end items-center">
             
             {/* User Manual Button */}
             <button 
                onClick={() => setShowUserManual(true)} 
                className="flex items-center gap-1.5 font-bold text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition shadow-sm"
             >
                 <BookOpen size={14}/> {t('footer_user_manual')}
             </button>

             {/* Setup Guide Button */}
             <button 
                onClick={() => setShowSetupGuide(true)} 
                className="flex items-center gap-1.5 font-bold text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition shadow-sm"
             >
                 <HelpCircle size={14}/> {t('footer_setup_guide')}
             </button>

             {/* Developer Profile with Hover Card */}
             <div className="relative group">
                <a 
                    href="https://wa.me/8801829300000" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 font-bold text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer shadow-sm relative z-20"
                >
                    <User size={14}/> LNK CT R@KIB
                </a>

                {/* Hover Profile Card */}
                <div className="absolute bottom-full right-0 mb-3 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            LI
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-sm">LI CELL</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">LNK CT R@KIB</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {/* Click to Call */}
                        <a href="tel:01829300000" className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer group/item">
                            <div className="p-1 bg-green-50 dark:bg-green-900/30 rounded text-green-600 group-hover/item:bg-green-100">
                                <Phone size={12} />
                            </div>
                            <span className="font-mono font-bold">01829300000</span>
                        </a>
                        
                        {/* Click to Email */}
                        <a href="mailto:ctrkb79@gmail.com" className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group/item">
                            <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600 group-hover/item:bg-blue-100">
                                <Mail size={12} />
                            </div>
                            <span>ctrkb79@gmail.com</span>
                        </a>

                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <div className="p-1 bg-purple-50 dark:bg-purple-900/30 rounded text-purple-600">
                                <MessageCircle size={12} />
                            </div>
                            <span>WhatsApp Available</span>
                        </div>
                    </div>
                    {/* Tail Arrow */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 border-b border-r border-gray-200 dark:border-gray-700"></div>
                </div>
             </div>
          </div>
        </div>
      </footer>

      {/* --- SETUP GUIDE MODAL --- */}
      {showSetupGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-slideUp border border-gray-200 dark:border-gray-700">
                <div className="bg-orange-600 p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2"><Terminal size={20}/> সেটআপ গাইড & স্ট্যাটাস</h3>
                    <button onClick={() => setShowSetupGuide(false)} className="text-white/80 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-2">স্ট্যাটাস রিপোর্ট:</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Frontend:</span>
                                <span className="text-green-600 font-bold">Running</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Backend (PHP):</span>
                                <span className={isConnected ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                    {isConnected ? "Connected" : "Disconnected"}
                                </span>
                            </div>
                            {!isConnected && (
                                <div className="text-xs text-red-500 mt-1 bg-red-50 p-2 rounded">
                                    Error: {dbError || "XAMPP Apache/MySQL চালু নেই অথবা পোর্ট মিলছে না।"}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">অটোমেটিক সেটআপ:</h4>
                        <p className="text-xs text-gray-500">যদি ডাটাবেজ কানেকশন থাকে কিন্তু টেবিল না থাকে, নিচের বাটনটি চাপুন। এটি ডাটাবেজ টেবিল তৈরি করবে এবং ডিফল্ট ডাটা ইনসার্ট করবে।</p>
                        <button 
                            onClick={runSetup} 
                            disabled={loadingSetup}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            {loadingSetup ? <RefreshCw size={18} className="animate-spin"/> : <Play size={18}/>}
                            সেটআপ রান করুন (Run Setup)
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- USER MANUAL MODAL --- */}
      {showUserManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-slideUp border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col">
                <div className="bg-blue-600 p-4 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold flex items-center gap-2"><BookOpen size={20}/> ব্যবহার নির্দেশিকা</h3>
                    <button onClick={() => setShowUserManual(false)} className="text-white/80 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <section>
                        <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">১. ড্যাশবোর্ড পরিচিতি</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            ড্যাশবোর্ডে বিভিন্ন ক্যাটাগরির নিউজপেপার ও মিডিয়া লিংক সাজানো আছে। আপনি উপরে সার্চ বার ব্যবহার করে যেকোনো পত্রিকা বা চ্যানেল খুঁজতে পারেন। রাইট ক্লিক করে একাধিক আইটেম সিলেক্ট করে একসাথে ওপেন করতে পারেন।
                        </p>
                    </section>
                    <section>
                        <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">২. কিওয়ার্ড মনিটর</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            'কিওয়ার্ড মনিটর' মেনু থেকে আপনি বিভিন্ন টপিকের উপর রিয়েল-টাইম নিউজ দেখতে পারবেন। ফেসবুক, ইউটিউব বা গুগল নিউজ থেকে তথ্য ফিল্টার করা যায়। 'এডমিন প্যানেল' থেকে নতুন কিওয়ার্ড যোগ করা যাবে।
                        </p>
                    </section>
                    <section>
                        <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">৩. রিপোর্ট জেনারেটর</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            অটোমেটিক রিপোর্ট তৈরির জন্য এটি ব্যবহার করুন। এটি নির্দিষ্ট সময় পর পর নিউজ কালেক্ট করে এবং আপনি সহজেই সেই নিউজগুলো কপি করে রিপোর্ট হিসেবে পাঠাতে পারেন।
                        </p>
                    </section>
                    <section>
                        <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">৪. টুলস ও সেটিংস</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            ডানপাশের সাইডবারে বিভিন্ন টুলস (যেমন: ভিডিও ডাউনলোডার, কনভার্টার, নোটপ্যাড) এবং সিস্টেম সেটিংস পাওয়া যাবে।
                        </p>
                    </section>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-right shrink-0">
                    <button onClick={() => setShowUserManual(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-bold">বন্ধ করুন</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Footer;
