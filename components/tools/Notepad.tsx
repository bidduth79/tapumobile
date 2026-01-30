
import React, { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';

const Notepad: React.FC = () => {
  const [note, setNote] = useState(() => localStorage.getItem('app_note') || '');

  useEffect(() => {
    localStorage.setItem('app_note', note);
  }, [note]);

  return (
    <div className="h-full flex flex-col animate-slideUp">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold flex items-center gap-2 dark:text-white"><StickyNote className="text-yellow-500"/> কুইক নোটপ্যাড</h3>
            <span className="text-xs text-gray-400">অটোমেটিক সেভ হয়</span>
        </div>
        <textarea 
            className="flex-1 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-yellow-400 outline-none shadow-inner text-sm leading-relaxed"
            placeholder="এখানে কিছু লিখুন..."
            value={note}
            onChange={e => setNote(e.target.value)}
        ></textarea>
    </div>
  );
};

export default Notepad;
