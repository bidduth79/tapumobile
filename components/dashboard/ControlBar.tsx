
import React from 'react';
import { CheckSquare, Search, Layers, LayoutGrid, List, Grip, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../../store';

interface Props {
    breadcrumb: string;
    totalItems: number;
    selectedCount: number;
    searchQuery: string;
    onCancelSelection: () => void;
    onOpenSelected: () => void;
    onOpenAll: () => void;
    hasFilteredLinks: boolean;
    // New Props for View Control
    viewMode: 'grid' | 'list' | 'compact';
    setViewMode: (mode: 'grid' | 'list' | 'compact') => void;
    gridSize: number;
    setGridSize: (size: number) => void;
}

const ControlBar: React.FC<Props> = ({ 
    breadcrumb, totalItems, selectedCount, searchQuery, 
    onCancelSelection, onOpenSelected, onOpenAll, hasFilteredLinks,
    viewMode, setViewMode, gridSize, setGridSize
}) => {
  const { t } = useApp();

  return (
    <div className={`flex flex-col xl:flex-row justify-between items-center glass-panel p-3 rounded-xl transition-colors duration-300 gap-4 ${selectedCount > 0 ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20' : ''}`}>
        
        {/* Left: Title & Info */}
        <div className="w-full xl:w-auto flex items-center justify-between xl:justify-start gap-4">
          <div>
              <h2 className={`text-lg font-bold capitalize flex items-center gap-2 ${selectedCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'}`}>
                {selectedCount > 0 ? <CheckSquare size={20}/> : (searchQuery ? <Search size={20} className="text-primary-500"/> : <Layers size={20} className="text-primary-500"/>)}
                {breadcrumb}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 ml-7">
                 {selectedCount > 0 ? t('open_ctrl') : `${t('total_items')}: ${totalItems}`}
              </p>
          </div>
        </div>
        
        {/* Right: Actions & View Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center justify-end">
            
            {/* View Controls (Only show if no selection or kept for persistence) */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg border border-gray-200 dark:border-gray-600 w-full sm:w-auto justify-center">
                {/* Mode Switcher */}
                <div className="flex bg-white dark:bg-gray-800 rounded-md shadow-sm p-0.5">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="গ্রিড ভিউ"
                    >
                        <LayoutGrid size={16}/>
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="লিস্ট ভিউ"
                    >
                        <List size={16}/>
                    </button>
                    <button 
                        onClick={() => setViewMode('compact')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'compact' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="কম্প্যাক্ট ভিউ"
                    >
                        <Grip size={16}/>
                    </button>
                </div>

                {/* Size Slider (Hidden for List View) */}
                {viewMode !== 'list' && (
                    <div className="flex items-center gap-2 px-2 border-l border-gray-200 dark:border-gray-600">
                        <SlidersHorizontal size={14} className="text-gray-400"/>
                        <input 
                            type="range" 
                            min={viewMode === 'grid' ? 2 : 4} 
                            max={viewMode === 'grid' ? 8 : 12} 
                            step="1"
                            value={gridSize}
                            onChange={(e) => setGridSize(parseInt(e.target.value))}
                            className="w-20 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-indigo-600"
                            title="সাইজ ছোট/বড় করুন"
                        />
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
                {selectedCount > 0 ? (
                     <>
                         <button 
                            onClick={onCancelSelection}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg dark:text-gray-300 dark:hover:bg-red-900/20 transition border border-transparent hover:border-red-200"
                         >
                            <X size={18}/>
                         </button>
                         <button 
                            onClick={onOpenSelected}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transform active:scale-95 transition-all text-xs flex items-center gap-2"
                         >
                            {t('selected_open')} ({selectedCount})
                         </button>
                     </>
                ) : (
                    <>
                        {hasFilteredLinks && (
                            <button 
                                onClick={onOpenAll}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transform active:scale-95 transition-all text-xs whitespace-nowrap"
                            >
                                {t('open_all')}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default ControlBar;
