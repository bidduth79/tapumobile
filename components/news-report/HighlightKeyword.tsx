
import React, { useMemo } from 'react';
import { useApp } from '../../store';

interface Props {
    text: string;
    terms: string[];
    fallbackHighlight: string;
}

const HighlightKeywordMatch: React.FC<Props> = ({ text, terms, fallbackHighlight }) => {
    const { spotlightItems } = useApp();

    const parts = useMemo(() => {
        if (!text) return [];

        // 1. Build a map of all terms to highlight (Standard + Spotlight)
        const activeSpotlights = spotlightItems.filter(s => s.isActive);
        
        // Combine all terms to regex
        let allTerms = [...terms];
        if (fallbackHighlight.trim()) allTerms.push(fallbackHighlight.trim());
        
        // Add Spotlight words & variations
        activeSpotlights.forEach(s => {
            allTerms.push(s.word);
            if (s.variations) allTerms.push(...s.variations);
        });

        const uniqueTerms = Array.from(new Set(allTerms.filter(t => t.trim().length > 0)));
        if (uniqueTerms.length === 0) return [{ text, type: 'normal' }];

        // Sort by length (desc) to match longest phrases first
        const sortedTerms = uniqueTerms.sort((a, b) => b.length - a.length);
        const escapedTerms = sortedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        
        const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
        
        const splitParts = text.split(regex);
        
        return splitParts.map(part => {
            const lowerPart = part.toLowerCase();
            
            // Check Spotlight Match First
            const spotlightMatch = activeSpotlights.find(s => 
                s.word.toLowerCase() === lowerPart || 
                (s.variations || []).some(v => v.toLowerCase() === lowerPart)
            );

            if (spotlightMatch) {
                return { text: part, type: 'spotlight', config: spotlightMatch };
            }

            // Check Standard Match
            const isStandardMatch = terms.some(t => t.toLowerCase() === lowerPart) || 
                                    (fallbackHighlight.trim() && lowerPart.includes(fallbackHighlight.toLowerCase()));
            
            if (isStandardMatch) {
                return { text: part, type: 'standard' };
            }

            return { text: part, type: 'normal' };
        });

    }, [text, terms, fallbackHighlight, spotlightItems]);

    return (
        <span>
            {parts.map((p, i) => {
                if (p.type === 'spotlight' && p.config) {
                    return (
                        <span 
                            key={i} 
                            style={{ 
                                backgroundColor: p.config.color, 
                                opacity: Math.max(0.2, p.config.opacity), // Ensure visibility
                                color: '#fff',
                                padding: '0px 2px',
                                borderRadius: '2px',
                                fontWeight: 'bold'
                            }}
                        >
                            {p.text}
                        </span>
                    );
                } else if (p.type === 'standard') {
                    return <span key={i} className="bg-yellow-200 dark:bg-yellow-700 dark:text-white text-black px-1 rounded font-bold">{p.text}</span>;
                } else {
                    return p.text;
                }
            })}
        </span>
    );
};

export default HighlightKeywordMatch;
