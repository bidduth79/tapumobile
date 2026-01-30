
import React from 'react';
import { Database } from 'lucide-react';
import { useApp } from '../../store';

interface Props {
    onSeed: () => void;
    isAdmin: boolean;
    isEmpty: boolean;
}

const EmptyState: React.FC<Props> = ({ onSeed, isAdmin, isEmpty }) => {
  const { t } = useApp();

  return (
    <div className="text-center py-20 opacity-70">
       <Database size={48} className="mx-auto mb-3 text-gray-300"/>
       <p className="text-xl font-bold dark:text-white">{t('no_data')}</p>
       {isAdmin && isEmpty && (
           <div className="mt-4">
               <p className="text-sm mb-3">{t('db_empty')}</p>
               <button 
                onClick={onSeed}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition"
               >
                 {t('load_default')}
               </button>
           </div>
       )}
    </div>
  );
};

export default EmptyState;
