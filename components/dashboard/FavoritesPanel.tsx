
import React from 'react';
import { Star } from 'lucide-react';
import { LinkItem } from '../../types';
import LinkCard from '../LinkCard';
import { useApp } from '../../store';

interface Props {
    favorites: LinkItem[];
    category?: string;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
}

const FavoritesPanel: React.FC<Props> = ({ favorites, category, selectedIds, onToggleSelection }) => {
  const { t } = useApp();

  if (favorites.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl p-5 shadow-sm animate-fadeIn">
        <div className="flex items-center gap-2 mb-3 text-purple-800 dark:text-purple-300">
            <Star size={20} fill="currentColor"/>
            <h2 className="font-bold text-lg">{t('favorite_panel')} {category ? `(${t(category)})` : ''}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {favorites.map(link => (
            <LinkCard 
                key={link.id} 
                link={link} 
                isSelected={selectedIds.has(link.id)}
                onContextSelect={() => onToggleSelection(link.id)}
            />
            ))}
        </div>
    </div>
  );
};

export default FavoritesPanel;
