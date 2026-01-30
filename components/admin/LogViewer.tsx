
import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { Calendar, CheckCircle, XCircle, AlertTriangle, Info, Activity } from 'lucide-react';

const LogViewer: React.FC = () => {
  const { logs } = useApp();
  const [logFilter, setLogFilter] = useState('all'); 
  const [logDateFilter, setLogDateFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
      let result = logs;
      if (logFilter !== 'all') {
          result = result.filter(l => l.type === logFilter);
      }
      if (logDateFilter) {
          const selectedDate = new Date(logDateFilter).toDateString();
          result = result.filter(l => new Date(l.timestamp).toDateString() === selectedDate);
      }
      return result;
  }, [logs, logFilter, logDateFilter]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="font-bold dark:text-white text-xl flex items-center gap-2"><Activity size={24} className="text-blue-500"/> অ্যাক্টিভিটি লগ</h3>
            
            {/* Log Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <input 
                        type="date" 
                        value={logDateFilter} 
                        onChange={(e) => setLogDateFilter(e.target.value)} 
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1.5 px-3 pl-8 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none hover:border-gray-400 cursor-pointer transition-colors shadow-sm"
                    />
                    <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setLogFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${logFilter === 'all' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>All</button>
                    <button onClick={() => setLogFilter('success')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${logFilter === 'success' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>Success</button>
                    <button onClick={() => setLogFilter('error')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${logFilter === 'error' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>Errors</button>
                    <button onClick={() => setLogFilter('warning')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${logFilter === 'warning' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>Warnings</button>
                </div>

                {(logFilter !== 'all' || logDateFilter !== '') && (
                    <button onClick={() => { setLogFilter('all'); setLogDateFilter(''); }} className="text-xs text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-2 py-1 rounded transition">Reset</button>
                )}
            </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left dark:text-gray-300">
                <thead className="bg-gray-100 dark:bg-gray-700 uppercase text-xs font-bold text-gray-600 dark:text-gray-300">
                    <tr>
                        <th className="px-4 py-3">সময়</th>
                        <th className="px-4 py-3">টাইপ</th>
                        <th className="px-4 py-3">অ্যাকশন</th>
                        <th className="px-4 py-3">ইউজার</th>
                        <th className="px-4 py-3 text-right">ডিটেইলস</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLogs.map(log => (
                        <React.Fragment key={log.id}>
                            <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${log.type === 'error' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                        ${log.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 
                                          log.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 
                                          log.type === 'warning' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' : 
                                          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}
                                    `}>
                                        {log.type === 'success' && <CheckCircle size={10}/>}
                                        {log.type === 'error' && <XCircle size={10}/>}
                                        {log.type === 'warning' && <AlertTriangle size={10}/>}
                                        {log.type === 'info' && <Info size={10}/>}
                                        {log.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{log.action}</td>
                                <td className="px-4 py-3 text-gray-500">{log.user}</td>
                                <td className="px-4 py-3 text-right">
                                    {log.details ? (
                                        <button 
                                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                            className="text-xs text-blue-600 hover:underline font-bold"
                                        >
                                            {expandedLogId === log.id ? 'লুকান' : 'দেখুন'}
                                        </button>
                                    ) : <span className="text-gray-300">-</span>}
                                </td>
                            </tr>
                            {expandedLogId === log.id && log.details && (
                                <tr>
                                    <td colSpan={5} className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="text-xs font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all bg-white dark:bg-gray-900 p-2 rounded border dark:border-gray-700">
                                            {log.details}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            {filteredLogs.length === 0 && <p className="text-center py-8 text-gray-500">কোনো লগ পাওয়া যায়নি</p>}
        </div>
    </div>
  );
};

export default LogViewer;
