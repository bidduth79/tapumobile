
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Lock, Shield, UserX, Activity, Save } from 'lucide-react';
import { toBanglaDigit } from '../monitor/utils';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const SecurityManager: React.FC<Props> = ({ showToast }) => {
  const { settings, updateSettings, logs } = useApp();
  const [blockedIps, setBlockedIps] = useState('');
  
  useEffect(() => {
      setBlockedIps(settings.blockedIps || '');
  }, [settings]);

  const handleSave = () => {
      updateSettings({ blockedIps });
      showToast('সিকিউরিটি সেটিংস আপডেট হয়েছে', 'success');
  };

  // Simulate active sessions from recent logs (Last 15 mins)
  const activeSessions = logs.filter(l => (Date.now() - l.timestamp) < 15 * 60 * 1000);
  const uniqueUsers = Array.from(new Set(activeSessions.map(l => l.user)));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-700">
                <Lock size={24} className="text-red-600"/> সিকিউরিটি ম্যানেজার
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* IP Blocker */}
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 h-full">
                        <h4 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                            <UserX size={18}/> IP ব্লকার
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                            নিচের বক্সে ব্লক করতে চাওয়া IP গুলো লিখুন (কমা দিয়ে আলাদা করুন)।
                        </p>
                        <textarea 
                            className="w-full p-3 border border-red-200 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none text-sm font-mono h-32 resize-none"
                            placeholder="192.168.1.1, 10.0.0.5..."
                            value={blockedIps}
                            onChange={e => setBlockedIps(e.target.value)}
                        ></textarea>
                        <button onClick={handleSave} className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-sm shadow-sm transition">
                            ব্লক লিস্ট সেভ করুন
                        </button>
                    </div>
                </div>

                {/* Session Monitor */}
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 h-full">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                            <Activity size={18} className="text-green-500"/> অ্যাক্টিভ সেশন (১৫ মিনিট)
                        </h4>
                        
                        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {uniqueUsers.length > 0 ? uniqueUsers.map((user, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-600 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{user}</span>
                                    </div>
                                    <button className="text-[10px] text-red-500 hover:text-white hover:bg-red-500 px-2 py-1 rounded transition">Force Logout</button>
                                </div>
                            )) : (
                                <div className="text-center text-gray-400 text-xs py-4">কোনো অ্যাক্টিভ ইউজার নেই</div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            মোট অ্যাক্টিভ: {toBanglaDigit(uniqueUsers.length)} জন
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SecurityManager;
