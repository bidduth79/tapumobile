
import React, { forwardRef } from 'react';
import { LinkItem } from '../types';
import { useApp } from '../store';
import { ExternalLink, Star, Clock, CheckCircle } from 'lucide-react';
import { formatTimeAgo, getFavicon } from '../utils';

interface Props {
  link: LinkItem;
  isSelected?: boolean;
  onContextSelect?: () => void;
  viewMode?: 'grid' | 'list' | 'compact';
}

const LinkCard = forwardRef<HTMLDivElement, Props>(({ link, isSelected, onContextSelect, viewMode = 'grid' }, ref) => {
  const { openLink, toggleFavorite } = useApp();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        openLink(link);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault(); 
      if (onContextSelect) {
          onContextSelect();
      }
  };

  // Check if visited (has lastOpened timestamp)
  const isVisited = link.lastOpened && link.lastOpened > 0;

  // --- LIST VIEW ---
  if (viewMode === 'list') {
      return (
        <div 
            ref={ref}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            onClick={() => openLink(link)}
            className={`
                group relative flex items-center gap-4 p-3 bg-white dark:bg-gray-800 
                border-2 border-gray-100 dark:border-gray-700 transition-all duration-200 cursor-pointer
                hover:shadow-lg hover:border-blue-300/40 dark:hover:border-blue-500/30
                ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500' : ''}
                rounded-xl
            `}
        >
            {/* Selection Check */}
            {isSelected && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-indigo-600">
                    <CheckCircle size={16} fill="currentColor" className="text-white"/>
                </div>
            )}

            {/* Logo */}
            <div className="w-10 h-10 shrink-0 bg-white p-1 rounded-lg border border-gray-100 dark:border-gray-600 overflow-hidden shadow-sm">
                <img 
                    src={link.logo || getFavicon(link.url)} 
                    alt={link.title} 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/64/64'; }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-700' : (isVisited ? 'text-purple-700 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200')} group-hover:text-blue-600`}>
                    {link.title}
                </h3>
                <p className="text-[10px] text-gray-400 truncate hover:underline">{link.url}</p>
            </div>

            {/* Meta / Actions */}
            <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full hidden sm:block">
                    {link.category}
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(link.id); }}
                    className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition ${link.isFavorite ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                    <Star size={14} fill={link.isFavorite ? "currentColor" : "none"} />
                </button>
            </div>
        </div>
      );
  }

  // --- COMPACT VIEW ---
  if (viewMode === 'compact') {
      return (
        <div 
            ref={ref}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            onClick={() => openLink(link)}
            className={`
                group relative flex items-center gap-2 p-2 bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 transition-all cursor-pointer
                hover:shadow-md hover:border-blue-300/50 dark:hover:border-blue-500/30 hover:-translate-y-0.5
                ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : ''}
                rounded-lg h-12 overflow-hidden
            `}
            title={link.title}
        >
            {isSelected && <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-bl"></div>}
            
            <div className="w-6 h-6 shrink-0 bg-white rounded-md overflow-hidden shadow-sm p-0.5">
                <img 
                    src={link.logo || getFavicon(link.url)} 
                    alt="" 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/64/64'; }}
                />
            </div>
            
            <h3 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-indigo-700' : (isVisited ? 'text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300')} group-hover:text-blue-600`}>
                {link.title}
            </h3>
        </div>
      );
  }

  // --- GRID VIEW (DEFAULT - ENHANCED) ---
  return (
    <div 
        ref={ref}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
        className={`
            group relative bg-white dark:bg-gray-800 p-2 transition-all duration-300 ease-out
            flex flex-col items-center justify-between min-h-[120px] cursor-pointer
            focus:outline-none 
            /* Bolder Border & Rounder Corners */
            border-2 border-gray-100 dark:border-gray-700 rounded-2xl
            
            ${isSelected 
                ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-inner border-indigo-500' 
                : `
                    /* Professional Hover Effect: Glassy Border & Lift */
                    hover:-translate-y-1 
                    hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] 
                    hover:border-blue-300/50 dark:hover:border-blue-500/30
                    hover:bg-gradient-to-b hover:from-white hover:to-blue-50/30 dark:hover:from-gray-800 dark:hover:to-gray-800
                `
            }
            shadow-sm
        `}
    >
      
      {/* Selection Indicator */}
      {isSelected && (
          <div className="absolute top-2 left-2 text-indigo-600 dark:text-indigo-400 z-10 animate-fadeIn">
              <CheckCircle size={18} fill="currentColor" className="text-white dark:text-gray-900" />
          </div>
      )}

      {/* Favorite Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(link.id); }}
        className={`absolute top-2 right-2 p-1 transition-colors z-10 ${link.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
        tabIndex={-1}
      >
        <Star size={14} fill={link.isFavorite ? "currentColor" : "none"} />
      </button>

      {/* Logo & Content - Centered */}
      <div 
        onClick={() => openLink(link)} 
        className="w-full flex flex-col items-center justify-center flex-1"
      >
        {/* Logo Container with consistent shape */}
        <div className={`w-full h-[50px] flex items-center justify-center overflow-hidden transition-all p-1`}>
          <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl p-1.5 shadow-sm border border-gray-50 dark:border-gray-600 group-hover:shadow-md transition-shadow">
              <img 
                src={link.logo || getFavicon(link.url)} 
                alt={link.title} 
                loading="lazy"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/64/64'; }}
              />
          </div>
        </div>
        
        <h3 className={`text-center font-bold transition-colors line-clamp-2 w-full text-sm mt-3 leading-tight px-1 ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : (isVisited ? 'text-purple-700 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200')} group-hover:text-blue-600`}>
          {link.title}
        </h3>
      </div>

      {/* Footer Info */}
      <div className="mt-2 w-full flex justify-center items-center text-[9px] text-gray-400 dark:text-gray-500 h-4">
        {link.lastOpened && (
            <span className="flex items-center gap-1 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <Clock size={9} /> {formatTimeAgo(link.lastOpened)}
            </span>
        )}
      </div>
    </div>
  );
});

export default LinkCard;
