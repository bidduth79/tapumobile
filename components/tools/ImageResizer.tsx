
import React, { useState, useRef } from 'react';
import { Image, Info, Clock, Download } from 'lucide-react';
import { getApiBaseUrl } from '../../utils';

const ImageResizer: React.FC = () => {
  const API_BASE = getApiBaseUrl();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resizeWidth, setResizeWidth] = useState(800);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Progress & Time State
  const [progress, setProgress] = useState(0);
  const [actualTime, setActualTime] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  const startProgress = () => {
      setProgress(0);
      setActualTime(null);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
          setProgress(prev => {
              if (prev >= 98) return 98; // Image processing is fast
              return prev + Math.random() * 10;
          });
      }, 100);
      return startTime;
  };

  const stopProgress = (startTime: number) => {
      clearInterval(timerRef.current);
      setProgress(100);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      setActualTime(duration + 's');
  };

  const handleResize = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setResult(null);

    const startTime = startProgress();

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('width', resizeWidth.toString());

      const res = await fetch(`${API_BASE}/resize.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'রিসাইজ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setError('সার্ভার এরর');
    } finally {
      stopProgress(startTime);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center pt-8 animate-slideUp">
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2 justify-center"><Info size={16}/>{error}</div>}
        {result && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-fadeIn">
                <p className="text-green-700 font-bold mb-2">কাজ সফল হয়েছে!</p>
                {actualTime && <p className="text-xs text-gray-500 mb-2 flex justify-center items-center gap-1"><Clock size={12}/> সময় লেগেছে: {actualTime}</p>}
                <a href={result.download_url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    ফাইল ডাউনলোড করুন
                </a>
            </div>
        )}

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-300">
            <Image className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-50 file:text-primary-700 cursor-pointer" />
        </div>
        <div className="flex items-center gap-4 justify-center">
            <label className="dark:text-white">প্রস্থ (Width):</label>
            <input type="number" value={resizeWidth} onChange={e => setResizeWidth(Number(e.target.value))} className="p-2 border rounded w-32 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" /> px
        </div>

        {/* Progress Bar */}
        {loading && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner mt-4">
                <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-100 flex items-center justify-center" 
                    style={{ width: `${progress}%` }}
                ></div>
                <p className="text-[10px] text-center mt-1 text-purple-600 font-bold">{Math.round(progress)}%</p>
            </div>
        )}

        <button onClick={handleResize} disabled={!selectedFile || loading} className="bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 transform active:scale-95">
            {loading ? 'প্রসেসিং...' : 'রিসাইজ করুন'}
        </button>
    </div>
  );
};

export default ImageResizer;
