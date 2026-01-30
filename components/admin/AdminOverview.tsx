
import React, { useEffect, useState } from 'react';
import { useApp } from '../../store';
import { Users, FileText, Tag, Activity, Database, Server, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DashboardStats } from '../../types';
import { toBanglaDigit } from '../monitor/utils';

const AdminOverview: React.FC = () => {
  const { fetchDashboardStats } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
        const data = await fetchDashboardStats();
        if (data) setStats(data);
        setLoading(false);
    };
    loadStats();
  }, []);

  if (loading) return <div className="p-10 text-center"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div><p className="mt-4 text-gray-500">লোড হচ্ছে...</p></div>;

  if (!stats) return <div className="p-10 text-center text-red-500">ডাটা লোড করা যায়নি।</div>;

  // Simple percentage calculation for disk space
  const diskPercent = stats.disk_total > 0 ? ((stats.disk_total - stats.disk_free) / stats.disk_total) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <h2 className="text-3xl font-black mb-2">স্বাগতম, অ্যাডমিন প্যানেলে!</h2>
            <p className="text-indigo-100 text-sm">সিস্টেম ওভারভিউ এবং স্ট্যাটাস রিপোর্ট</p>
            <div className="mt-6 flex gap-4 text-xs font-mono bg-black/20 w-fit px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="flex items-center gap-2"><Server size={14}/> Uptime: {stats.server_uptime}</span>
                <span className="flex items-center gap-2 border-l pl-4 border-white/20"><Database size={14}/> DB Size: {stats.db_size}</span>
            </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:-translate-y-1 transition-transform">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">মোট ইউজার</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white">{toBanglaDigit(stats.total_users)}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={24}/>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:-translate-y-1 transition-transform">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">সংরক্ষিত লিংক</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white">{toBanglaDigit(stats.total_links)}</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={24}/>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:-translate-y-1 transition-transform">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">মনিটর কিওয়ার্ড</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white">{toBanglaDigit(stats.total_keywords)}</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Tag size={24}/>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:-translate-y-1 transition-transform">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">আজকের নিউজ</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white">{toBanglaDigit(stats.todays_news)}</h3>
                </div>
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity size={24}/>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-700">
                    <ShieldCheck size={20} className="text-green-500"/> সিস্টেম হেলথ
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-bold text-gray-600 dark:text-gray-300">
                            <span>Disk Usage (C:)</span>
                            <span>{Math.round(diskPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${diskPercent > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{width: `${diskPercent}%`}}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">Free: {stats.disk_free} GB / Total: {stats.disk_total} GB</p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-white">Database Status</p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-mono">Connected & Active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Logs */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-700">
                    <Clock size={20} className="text-orange-500"/> রিসেন্ট অ্যাক্টিভিটি
                </h3>
                
                <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {stats.recent_logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.type === 'error' ? 'bg-red-500' : log.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{log.action}</p>
                                <p className="text-xs text-gray-500">{log.details || 'No details'}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{log.user}</span>
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                    {stats.recent_logs.length === 0 && <p className="text-center text-gray-400 text-sm">কোনো লগ নেই</p>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminOverview;
