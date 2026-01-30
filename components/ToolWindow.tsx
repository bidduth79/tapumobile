import React from 'react';
import { useApp } from '../store';
import { X, Minus, Square, Copy, RefreshCw } from 'lucide-react';
import ToolsPanel from './ToolsPanel';

const ToolWindow: React.FC = () => {
  const { toolWindowState, setToolWindowState } = useApp();

  if (toolWindowState === 'closed') return null;

  if (toolWindowState === 'minimized') {
    return (
      <div 
        onClick={() => setToolWindowState('open')}
        className="fixed bottom-4 right-64 z-50 bg-primary-600 text-white p-3 rounded-t-lg shadow-2xl cursor-pointer flex items-center gap-2 hover:bg-primary-700 transition animate-bounce"
      >
        <RefreshCw size={18} />
        <span className="font-bold text-sm">টুলসবক্স (মিনিমাইজড)</span>
      </div>
    );
  }

  const isMaximized = toolWindowState === 'maximized';

  return (
    <div className={`fixed z-[60] flex flex-col bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out
      ${isMaximized 
        ? 'inset-0 m-0 rounded-none' 
        : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[800px] h-[80vh] md:h-[600px]'
      }`}
    >
      {/* Window Header */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-3 flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
           <RefreshCw size={18} />
           <span className="font-bold">এলআই সেল টুলস</span>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={() => setToolWindowState('minimized')} className="p-1 hover:bg-white/20 rounded"><Minus size={18} /></button>
           <button onClick={() => setToolWindowState(isMaximized ? 'open' : 'maximized')} className="p-1 hover:bg-white/20 rounded">
             {isMaximized ? <Copy size={14} className="transform rotate-180" /> : <Square size={14} />}
           </button>
           <button onClick={() => setToolWindowState('closed')} className="p-1 hover:bg-red-500 rounded"><X size={18} /></button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800 relative">
        <ToolsPanel />
      </div>
    </div>
  );
};

export default ToolWindow;