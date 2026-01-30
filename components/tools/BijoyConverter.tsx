
import React, { useState } from 'react';
import { Type, ArrowRightLeft } from 'lucide-react';
import { convertUnicodeToBijoy, convertBijoyToUnicode } from '../../utils/banglaConverter';

const BijoyConverter: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const handleUniToBijoy = () => { setOutputText(convertUnicodeToBijoy(inputText)); };
  const handleBijoyToUni = () => { setOutputText(convertBijoyToUnicode(inputText)); };

  return (
    <div className="h-full flex flex-col gap-4 animate-slideUp">
        <div className="flex-1 flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">ইনপুট (Input)</label>
            <textarea 
                className="flex-1 w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none outline-none focus:ring-2 focus:ring-teal-500"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="এখানে লিখুন বা পেস্ট করুন..."
            ></textarea>
        </div>
        
        <div className="flex justify-center gap-4">
            <button onClick={handleUniToBijoy} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 shadow-md flex items-center gap-2">
                ইউনিকোড <ArrowRightLeft size={16}/> বিজয়
            </button>
            <button onClick={handleBijoyToUni} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2">
                বিজয় <ArrowRightLeft size={16}/> ইউনিকোড
            </button>
        </div>

        <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-500">আউটপুট (Output)</label>
                <button onClick={() => navigator.clipboard.writeText(outputText)} className="text-xs text-blue-600 hover:underline">কপি করুন</button>
            </div>
            <textarea 
                readOnly
                className="flex-1 w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white resize-none outline-none font-mono"
                value={outputText}
            ></textarea>
        </div>
    </div>
  );
};

export default BijoyConverter;
