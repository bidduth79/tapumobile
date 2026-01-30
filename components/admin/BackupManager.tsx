
import React, { useState } from 'react';
import { Database, Download, Trash2, RefreshCw, CheckCircle, AlertTriangle, HardDrive } from 'lucide-react';
import { getApiBaseUrl } from '../../utils';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const BackupManager: React.FC<Props> = ({ showToast }) => {
  const API_BASE = getApiBaseUrl();
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
      setLoading(true);
      try {
          const res = await fetch(`${API_BASE}/backup.php`);
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToast('ব্যাকআপ ডাউনলোড সফল হয়েছে!', 'success');
      } catch (e) {
          showToast('ব্যাকআপ তৈরি করতে সমস্যা হয়েছে', 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleMaintenance = async (action: 'optimize' | 'clear_cache' | 'clear_logs') => {
      if (!confirm('আপনি কি নিশ্চিত?')) return;
      setLoading(true);
      try {
          const res = await fetch(`${API_BASE}/maintenance.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action })
          });
          const data = await res.json();
          if (data.success) {
              showToast(data.message, 'success');
          } else {
              showToast('অপারেশন ব্যর্থ: ' + data.message, 'error');
          }
      } catch (e) {
          showToast('সার্ভার এরর', 'error');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-700">
                <Database size={24} className="text-cyan-600"/> ডাটাবেস ব্যাকআপ ও মেইনটেন্যান্স
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Backup Section */}
                <div className="space-y-4">
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-100 dark:border-cyan-800">
                        <h4 className="font-bold text-cyan-800 dark:text-cyan-300 mb-2 flex items-center gap-2">
                            <Download size={18}/> SQL ব্যাকআপ
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                            পুরো ডাটাবেসের একটি SQL ডাম্প ফাইল ডাউনলোড করুন। এটি দিয়ে পরবর্তীতে রিস্টোর করা যাবে।
                        </p>
                        <button 
                            onClick={handleBackup} 
                            disabled={loading}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition disabled:opacity-50"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin"/> : <Download size={18}/>} ডাউনলোড ব্যাকআপ
                        </button>
                    </div>
                </div>

                {/* Maintenance Section */}
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <HardDrive size={18}/> সিস্টেম টুলস
                        </h4>
                        <div className="space-y-3">
                            <button 
                                onClick={() => handleMaintenance('optimize')}
                                disabled={loading}
                                className="w-full flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-400 transition group"
                            >
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">ডাটাবেস অপটিমাইজ</span>
                                <CheckCircle size={16} className="text-green-500 opacity-50 group-hover:opacity-100"/>
                            </button>

                            <button 
                                onClick={() => handleMaintenance('clear_cache')}
                                disabled={loading}
                                className="w-full flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-orange-400 transition group"
                            >
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Temp ফাইল ক্লিয়ার</span>
                                <Trash2 size={16} className="text-orange-500 opacity-50 group-hover:opacity-100"/>
                            </button>

                            <button 
                                onClick={() => handleMaintenance('clear_logs')}
                                disabled={loading}
                                className="w-full flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-red-400 transition group"
                            >
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">অ্যাক্টিভিটি লগ মুছুন</span>
                                <AlertTriangle size={16} className="text-red-500 opacity-50 group-hover:opacity-100"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BackupManager;
