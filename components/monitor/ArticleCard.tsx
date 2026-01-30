
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Facebook, Youtube, Music, Zap, Twitter, MessageCircle, Send, FileSearch, Globe, Ghost, Clock, CheckCircle, Trash2, Copy, Eye, CheckSquare, ExternalLink, Calendar, Layers, Smile, Frown, Minus, Bot, X } from 'lucide-react';
import { Article, MonitorMode } from './types';
import { toBanglaDigit, translateSource, analyzeSentiment } from './utils'; 
import HighlightKeywordMatch from '../news-report/HighlightKeyword';

// Helper for time formatting
const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('bn-BD', {
        day: 'numeric', month: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
};

// --- HELPER: Safe API Key Retrieval ---
const getApiKey = () => {
    if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
        return (import.meta as any).env.VITE_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    return '';
};

interface ArticleCardProps {
    article: Article;
    group: Article[];
    viewMode: 'grid' | 'list';
    monitorMode: MonitorMode;
    isRead: boolean;
    isSelected: boolean;
    highlightTerms: string[];
    highlightColor: string;
    filterText?: string; 
    onToggleSelection: (e: React.MouseEvent, article: Article) => void;
    onCardClick: (article: Article) => void;
    onPreview: (e: React.MouseEvent, article: Article) => void;
    onSourceClick: (e: React.MouseEvent, article: Article) => void;
    onOpenGroup: (e: React.MouseEvent, groupArticles: Article[]) => void;
    onSendTelegram: (article: Article) => void;
    onSendWhatsApp: (article: Article) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = React.memo(({ 
    article, group, viewMode, monitorMode, isRead, isSelected, 
    highlightTerms, highlightColor, filterText, onToggleSelection, onCardClick, 
    onPreview, onSourceClick, onOpenGroup, onSendTelegram, onSendWhatsApp
}) => {
    const [isHoveringTime, setIsHoveringTime] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [apiReady, setApiReady] = useState(false);
    
    // AI Popup State
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const popupRef = useRef<HTMLDivElement>(null);

    // Check API Status on Mount
    useEffect(() => {
        const key = getApiKey();
        setApiReady(!!key && key.length > 5);
    }, []);

    // Close popup on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setShowAnalysis(false);
            }
        };
        if (showAnalysis) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAnalysis]);

    // AI Sentiment Analysis
    const sentiment = useMemo(() => analyzeSentiment(article.title + ' ' + (article.description || '')), [article.title, article.description]);

    const hasMultipleSources = group.length > 1;
    const specialKeywords = ['বিজিবি', 'বিএসএফ', 'সীমান্ত', 'বিজিবি মহাপরিচালক', 'ডিজি বিজিবি', 'BGB', 'BSF', 'DG BGB', 'Border Guard Bangladesh', 'পিলখানা', 'Border'];
    const isSpecialKeyword = specialKeywords.some(k => article.keyword.toLowerCase().includes(k.toLowerCase()) || article.title.toLowerCase().includes(k.toLowerCase()));

    // Dynamic Border Class based on Sentiment
    let borderClass = 'border border-gray-100 dark:border-gray-700';
    
    if (sentiment === 'negative') {
        borderClass = 'border border-red-200 dark:border-red-900 bg-red-50/10 hover:border-red-400';
    } else if (sentiment === 'positive') {
        borderClass = 'border border-green-200 dark:border-green-900 bg-green-50/10 hover:border-green-400';
    } else if (isSpecialKeyword) {
        borderClass = 'border border-orange-200 dark:border-orange-900 bg-orange-50/10 hover:border-orange-400';
    } else {
        borderClass = 'border border-gray-200 dark:border-gray-700 hover:border-blue-300';
    }

    if (isSelected) {
        borderClass = 'border-2 border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30';
    }

    // Source Specific Left Border
    const isFB = monitorMode === 'facebook';
    const isYT = monitorMode === 'youtube';
    const isTT = monitorMode === 'tiktok';
    const isDirect = monitorMode === 'direct';
    const isTwitter = monitorMode === 'twitter';
    const isTelegram = monitorMode === 'telegram' || monitorMode === 'telegram_adv';
    const isDorking = monitorMode === 'dorking';
    
    let bgClass = 'bg-white dark:bg-gray-800';

    const SourceIcon = () => {
        const size = viewMode === 'grid' ? 14 : 12;
        if (isFB) return <Facebook size={size} className="text-blue-600"/>;
        if (isYT) return <Youtube size={size} className="text-red-600"/>;
        if (isTT) return <Music size={size} className="text-black dark:text-white"/>;
        if (isDirect) return <Zap size={size} className="text-orange-500"/>;
        if (isTwitter) return <Twitter size={size} className="text-sky-500"/>;
        if (isTelegram) return <Send size={size} className="text-blue-400"/>;
        if (isDorking) return <FileSearch size={size} className="text-purple-500"/>;
        return <Globe size={size} className="text-gray-500"/>;
    };

    const SentimentIcon = () => {
        if (sentiment === 'positive') return <Smile size={12} className="text-green-600"/>;
        if (sentiment === 'negative') return <Frown size={12} className="text-red-600"/>;
        return null;
    };

    const handleQuickAnalyze = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // If already showing, toggle off
        if (showAnalysis) {
            setShowAnalysis(false);
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            alert("⚠️ API Key পাওয়া যায়নি।");
            return;
        }

        // If we already have a result, just show it
        if (analysisResult) {
            setShowAnalysis(true);
            return;
        }

        setAnalyzing(true);
        try {
            const prompt = `Analyze this news briefly in Bengali (Max 50 words):\nTitle: ${article.title}\nDesc: ${article.description || 'N/A'}\n\nProvide: 1. Main point 2. Bias/Truth probability`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            
            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                setAnalysisResult(text);
                setShowAnalysis(true);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    const displaySource = translateSource(article.source);
    const fullDate = formatDateTime(article.timestamp);
    const displayTime = article.time_ago ? toBanglaDigit(article.time_ago) : new Date(article.timestamp).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'});

    const GroupPopup = () => (
        <div className="absolute bottom-full left-0 mb-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-slideUp opacity-0 invisible group-hover/source:opacity-100 group-hover/source:visible transition-all duration-200">
            <button onClick={(e) => onOpenGroup(e, group)} className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border-b border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-2">
                <Layers size={12}/> সব ওপেন করুন ({toBanglaDigit(group.length)})
            </button>
            <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                {group.slice(1).map((item, idx) => (
                    <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="block px-2 py-1.5 text-[10px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded truncate border-b border-gray-50 dark:border-gray-800 last:border-0" onClick={(e) => e.stopPropagation()}>
                        <span className="font-bold">{translateSource(item.source)}</span>: {item.title.substring(0, 30)}...
                    </a>
                ))}
            </div>
        </div>
    );

    // AI Analysis Popup Component
    const AnalysisPopup = () => (
        <div 
            ref={popupRef}
            className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-xl z-50 overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <Bot size={12}/> AI বিশ্লেষণ
                </span>
                <button onClick={() => setShowAnalysis(false)} className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-white/50 transition">
                    <X size={12}/>
                </button>
            </div>
            <div className="p-3 max-h-60 overflow-y-auto custom-scrollbar text-xs leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium">
                {analysisResult}
            </div>
        </div>
    );

    return (
        <div 
            id={`article-${article.id}`}
            onContextMenu={(e) => onToggleSelection(e, article)}
            className={`
                transition duration-200 relative group cursor-default overflow-hidden
                ${viewMode === 'grid' ? 'rounded-xl p-4 shadow-sm hover:shadow-md flex flex-col justify-between h-full' : 'rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                ${bgClass} ${borderClass}
                ${isRead ? 'opacity-70 grayscale-[0.3]' : ''}
                hover:scale-[1.01]
            `}
        >
            <div className={`absolute top-0 left-0 w-1 h-full ${sentiment === 'positive' ? 'bg-green-500' : (sentiment === 'negative' ? 'bg-red-500' : 'bg-transparent')}`}></div>

            {isSelected && (
                <div className="absolute top-2 right-2 z-20 text-blue-600 bg-white rounded-full transition-transform hover:scale-110 shadow-sm">
                    <CheckCircle size={20} fill="currentColor" className="text-white"/>
                </div>
            )}

            {viewMode === 'grid' ? (
                <>
                    <div className="relative z-10 pl-2">
                        <div className="flex justify-between items-start mb-2">
                            <span 
                                className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded text-white transition-all duration-300 transform hover:scale-105 shadow-sm"
                                style={{ backgroundColor: highlightColor }}
                            >
                                {article.keyword}
                            </span>
                            
                            <span onMouseEnter={() => setIsHoveringTime(true)} onMouseLeave={() => setIsHoveringTime(false)} className="text-[10px] text-gray-400 flex items-center gap-1 transition-all duration-500 hover:text-blue-600 cursor-help font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded relative min-w-[80px] justify-end overflow-hidden">
                                <Clock size={10} className={isHoveringTime ? "opacity-0 absolute" : "opacity-100"} /> 
                                <Calendar size={10} className={isHoveringTime ? "opacity-100" : "opacity-0 absolute"} />
                                <span className={`transition-all duration-300 transform ${isHoveringTime ? '-translate-y-full opacity-0 absolute' : 'translate-y-0 opacity-100'}`}>{displayTime}</span>
                                <span className={`transition-all duration-300 transform ${isHoveringTime ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 absolute'}`}>{fullDate}</span>
                            </span>
                        </div>
                        
                        <h3 onClick={() => onCardClick(article)} className={`font-bold leading-snug mb-2 line-clamp-3 transition-colors duration-200 cursor-pointer ${isRead ? 'text-purple-700 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600'}`}>
                            <HighlightKeywordMatch text={article.title} terms={highlightTerms} fallbackHighlight={filterText || ''} />
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-2">
                            <SentimentIcon />
                            {sentiment !== 'neutral' && <span className={`text-[9px] font-bold uppercase ${sentiment === 'positive' ? 'text-green-600' : 'text-red-600'}`}>{sentiment}</span>}
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700/50 relative z-10 pl-2">
                        <div className="relative group/source max-w-[60%]">
                            {hasMultipleSources && <GroupPopup />}
                            <div onClick={(e) => onSourceClick(e, article)} className={`flex items-center gap-1 truncate text-xs font-semibold transition-colors rounded px-1 py-0.5 select-none ${hasMultipleSources ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                                <SourceIcon />
                                {displaySource}
                                {hasMultipleSources && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded-full ml-1 font-bold">+{toBanglaDigit(group.length - 1)}</span>}
                            </div>
                        </div>

                        <div className="flex gap-1.5 items-center relative">
                            {/* AI Analysis Popup */}
                            {showAnalysis && <AnalysisPopup />}

                            {/* Clean AI Button (No Glow) */}
                            <button 
                                onClick={handleQuickAnalyze} 
                                className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 border 
                                    ${apiReady 
                                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700' 
                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    } 
                                    ${analyzing ? 'animate-spin bg-purple-200 dark:bg-purple-800' : ''}
                                    ${showAnalysis ? 'ring-2 ring-purple-400' : ''}
                                `} 
                                title={apiReady ? "AI Analyze" : "API Key Missing"}
                            >
                                <Bot size={12}/>
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); onSendWhatsApp(article); }} className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-full text-green-600 hover:bg-green-100 transition hover:scale-110"><MessageCircle size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onSendTelegram(article); }} className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-500 hover:bg-blue-100 transition hover:scale-110"><Send size={12}/></button>
                            <button onClick={(e) => onPreview(e, article)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 hover:bg-gray-200 transition hover:scale-110"><Eye size={12} /></button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
                        <span onMouseEnter={() => setIsHoveringTime(true)} onMouseLeave={() => setIsHoveringTime(false)} className="text-[10px] w-28 text-gray-400 flex-shrink-0 transition-transform duration-300 hover:text-blue-600 cursor-help font-mono origin-left bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-center overflow-hidden relative">
                             <span className={`block transition-all duration-300 ${isHoveringTime ? '-mt-6 opacity-0' : 'mt-0 opacity-100'}`}>{displayTime}</span>
                             <span className={`block transition-all duration-300 absolute inset-0 flex items-center justify-center ${isHoveringTime ? 'top-0 opacity-100' : 'top-6 opacity-0'}`}>{fullDate}</span>
                        </span>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 onClick={() => onCardClick(article)} className={`text-sm font-bold truncate transition-colors cursor-pointer ${isRead ? 'text-purple-700 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200 hover:text-primary-600'}`}>
                                    <HighlightKeywordMatch text={article.title} terms={highlightTerms} fallbackHighlight={filterText || ''} />
                                </h3>
                                <SentimentIcon />
                            </div>
                            <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5 items-center">
                                <div className="relative group/source">
                                    {hasMultipleSources && <GroupPopup />}
                                    <span onClick={(e) => onSourceClick(e, article)} className={`font-semibold cursor-pointer select-none flex items-center gap-1 ${hasMultipleSources ? 'text-red-600 hover:bg-red-50 rounded px-1' : 'hover:text-gray-700'}`}>
                                        <SourceIcon /> {displaySource} {hasMultipleSources && <span className="text-[9px] font-bold">(+{toBanglaDigit(group.length - 1)})</span>}
                                    </span>
                                </div>
                                <span>•</span>
                                <span 
                                    className="font-bold px-1.5 py-0.5 rounded text-white hover:scale-105 inline-block transition-transform shadow-sm"
                                    style={{ backgroundColor: highlightColor }}
                                >
                                    {article.keyword}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2 relative">
                        {/* AI Analysis Popup (List View) */}
                        {showAnalysis && <AnalysisPopup />}

                        {/* Clean AI Button (List Mode) */}
                        <button 
                            onClick={handleQuickAnalyze} 
                            className={`p-1.5 rounded transition-all duration-300 hover:scale-110 
                                ${apiReady 
                                    ? 'text-purple-600 bg-purple-50 border border-purple-100 dark:bg-purple-900/30 dark:border-purple-800' 
                                    : 'text-gray-400 cursor-not-allowed'
                                } 
                                ${analyzing ? 'animate-spin' : ''}
                                ${showAnalysis ? 'ring-2 ring-purple-300' : ''}
                            `} 
                            title="AI Analyze"
                        >
                            <Bot size={12}/>
                        </button>

                        <button onClick={(e) => { e.stopPropagation(); onSendWhatsApp(article); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition hover:scale-110"><MessageCircle size={12}/></button>
                        <button onClick={(e) => { e.stopPropagation(); onSendTelegram(article); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition hover:scale-110"><Send size={12}/></button>
                        <button onClick={(e) => onPreview(e, article)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition hover:scale-110"><Eye size={12} /></button>
                    </div>
                </>
            )}
        </div>
    );
});

export default ArticleCard;
