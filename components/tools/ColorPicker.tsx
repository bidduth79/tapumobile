
import React, { useState } from 'react';
import { Palette } from 'lucide-react';

const ColorPicker: React.FC = () => {
  const [color, setColor] = useState('#0ea5e9');

  return (
    <div className="max-w-md mx-auto text-center space-y-6 pt-10 animate-slideUp">
        <Palette className="w-16 h-16 mx-auto" style={{color}} />
        <div className="p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <input 
                type="color" 
                value={color} 
                onChange={e => setColor(e.target.value)}
                className="w-full h-20 cursor-pointer rounded-lg border-0 p-0 mb-4"
            />
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <span className="font-mono text-lg flex-1 dark:text-white uppercase">{color}</span>
                <button 
                    onClick={() => navigator.clipboard.writeText(color)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500"
                >
                    কপি
                </button>
            </div>
        </div>
    </div>
  );
};

export default ColorPicker;
