
import React from 'react';
import { History, Clock, Copy, MessageCircle, Send, Trash2, CheckSquare } from 'lucide-react';
import { ArticleWithSerial } from './types';
import { toBanglaDigit, formatTime24, translateSource } from './utils';
import HighlightKeywordMatch from './HighlightKeyword';
import { Keyword } from '../../types';

interface Props {
    art: ArticleWithSerial;
    isOld: boolean;
    viewMode: 'list' | 'grid';
    visitedIds: Set<string>;
    selectedIds: Set<string>;
    selectionStack: string[];
    filterText: string;
    keywords: Keyword[];
    onLinkClick: (id: string, link: string) => void;
    onToggleSelection: (e: React.MouseEvent, id: string) => void;
    onCopyLink: (e: React.MouseEvent, link: string) => void;
    onShareWhatsApp: (e: React.MouseEvent, article: any) => void;
    onShareTelegram: (e: React.MouseEvent, article: any) => void;
    onDelete: (id: string) => void;
    isSpotlight?: boolean;
    isDuplicate?: boolean; // New Prop for duplicate flagging
}

const ArticleCard: React.FC<Props> = ({ 
    art, isOld, viewMode, visitedIds, selectedIds, selectionStack, 
    filterText, keywords, onLinkClick, onToggleSelection, 
    onCopyLink, onShareWhatsApp, onShareTelegram, onDelete,
    isSpotlight = false,
    isDuplicate = false
}) => {
    
    const isVisited = visitedIds.has(art.id);
    const isSelected = selectedIds.has(art.id);
    const isLastSelected = selectionStack[selectionStack.length - 1] === art.id;
    
    const getKeywordConfig = (keyword: string) => {
        return keywords.find(k => k.keyword === keyword && k.type === 'report');
    };

    const kConfig = getKeywordConfig(art.keyword);
    // Use config color or fallback for the Badge only
    const highlightColor = kConfig?.color || '#0ea5e9';
    
    const highlightTerms: string[] = []; 
    
    // Logic for Background Classes (Updated for Dark Mode Glass Effect)
    let bgClass = '';
    
    if (isSelected) {
        bgClass = 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 ring-1 ring-blue-500 z-10';
    } else if (isOld) {
        bgClass = 'bg-gray-100 dark:bg-gray-800/60 dark:border-gray-700 opacity-70 grayscale hover:grayscale-0 hover:opacity-100';
    } else {
        // Standard Card: White in Light Mode, Glassy Black in Dark Mode
        bgClass = 'bg-white/90 dark:bg-gray-900/60 backdrop-blur-md border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400';
    }
    
    if (isSpotlight) {
        bgClass = `bg-white dark:bg-gray-900 border-l-4 shadow-md ${bgClass}`;
    }

    const titleStyle = isSpotlight ? { color: highlightColor } : {};

    return (
      <div 
          id={`report-article-${art.id}`}
          onContextMenu={(e) => onToggleSelection(e, art.id)}
          className={`group relative rounded-lg p-3 transition-all duration-300 items-start select-none flex gap-3 border shadow-sm ${bgClass} ${viewMode === 'grid' ? 'flex-col h-full' : 'mb-2'}`}
          style={isSpotlight ? { borderLeftColor: highlightColor } : {}}
      >
          {isLastSelected && selectedIds.size > 0 && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20 animate-bounce">মোট: {toBanglaDigit(selectedIds.size)}</div>}
          {isSelected && <div className="absolute top-2 right-2 text-blue-600 dark:text-blue-400 z-20"><CheckSquare size={16} fill="currentColor" className="text-white dark:text-gray-900"/></div>}

          {viewMode === 'list' ? (
              <>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm text-white`} style={{ backgroundColor: isOld ? '#94a3b8' : '#64748b' }}>{toBanglaDigit(art.serial)}</div>
                  <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                          {isOld && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"><History size={10}/> OLD</span>}
                          {isDuplicate && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">DUPLICATE</span>}
                          
                          <span 
                              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white shadow-sm"
                              style={{ backgroundColor: highlightColor }}
                          >
                              {art.keyword}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 transition-transform origin-left cursor-default">
                              <Clock size={10}/> {formatTime24(art.dateStr)}
                          </span>
                      </div>
                      <h4 
                          onClick={() => onLinkClick(art.id, art.link)} 
                          className={`text-sm leading-relaxed cursor-pointer hover:underline ${isVisited ? 'font-normal text-purple-700 dark:text-purple-400' : 'font-bold text-gray-800 dark:text-gray-100'}`}
                          style={!isVisited ? titleStyle : {}}
                      >
                          <HighlightKeywordMatch text={art.title} terms={highlightTerms} fallbackHighlight={filterText} />
                      </h4>
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">{translateSource(art.source)}</div>
                  </div>
              </>
          ) : (
              <>
                  <div className="w-full flex justify-between items-center mb-2">
                      <div className="flex gap-1">
                          <span 
                              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white shadow-sm"
                              style={{ backgroundColor: highlightColor }}
                          >
                              {art.keyword}
                          </span>
                          {isDuplicate && <span className="text-[8px] px-1 py-0.5 rounded font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">DUP</span>}
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white`} style={{ backgroundColor: isOld ? '#94a3b8' : '#64748b' }}>{toBanglaDigit(art.serial)}</div>
                  </div>
                  <h4 
                      onClick={() => onLinkClick(art.id, art.link)} 
                      className={`text-sm leading-relaxed cursor-pointer hover:underline line-clamp-3 ${isVisited ? 'font-normal text-purple-700 dark:text-purple-400' : 'font-bold text-gray-800 dark:text-gray-100'}`}
                      style={!isVisited ? titleStyle : {}}
                  >
                      <HighlightKeywordMatch text={art.title} terms={highlightTerms} fallbackHighlight={filterText} />
                  </h4>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 w-full flex justify-between items-center">
                      <span>{translateSource(art.source)}</span>
                      <span className="hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 transition-transform origin-right cursor-default">
                          {formatTime24(art.dateStr)}
                      </span>
                  </div>
              </>
          )}
          
          <div className={`absolute ${viewMode === 'list' ? 'right-2 top-2' : 'right-2 bottom-2'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded p-1 shadow-sm`}>
              <button onClick={(e) => onCopyLink(e, art.link)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Copy size={14}/></button>
              <button onClick={(e) => onShareWhatsApp(e, art)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"><MessageCircle size={14}/></button>
              <button onClick={(e) => onShareTelegram(e, art)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"><Send size={14}/></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(art.id); }} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14}/></button>
          </div>
      </div>
    );
};

export default ArticleCard;
