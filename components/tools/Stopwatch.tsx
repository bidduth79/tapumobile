
import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

const Stopwatch: React.FC = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor((ms / 60000) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    const milliseconds = Math.floor((ms / 10) % 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-slideUp">
        <div className="relative">
            <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 rounded-full"></div>
            <h2 className="text-7xl font-mono font-bold text-gray-800 dark:text-white relative z-10 tabular-nums">
                {formatTime(time)}
            </h2>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition hover:scale-110 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
                {isRunning ? <Pause size={24}/> : <Play size={24} className="ml-1"/>}
            </button>
            <button 
                onClick={() => { setIsRunning(false); setTime(0); }}
                className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-white flex items-center justify-center shadow-lg transition hover:scale-110 hover:bg-gray-300"
            >
                <RotateCcw size={24}/>
            </button>
        </div>
    </div>
  );
};

export default Stopwatch;
