
import React, { useState, useRef } from 'react';
import { Video, Info, Download, Clock, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '../../utils';
import { useApp } from '../../store';

const Converter: React.FC = () => {
  const { logAction } = useApp();
  const API_BASE = getApiBaseUrl();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('mp4');
  const [convertQuality, setConvertQuality] = useState('720p');
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
              if (prev >= 95) return 95;
              return prev + Math.random() * 2; // Conversion is slow, increment slowly
          });
      }, 500);
      return startTime;
  };

  const stopProgress = (startTime: number) => {
      clearInterval(timerRef.current);
      setProgress(100);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      setActualTime(duration + 's');
  };

  const handleFormatChange = (fmt: string) => {
      setTargetFormat(fmt);
      // Reset quality based on format type
      if (['mp3', 'aac', 'wav', 'opus'].includes(fmt)) {
          if (fmt === 'opus') setConvertQuality('voice');
          else setConvertQuality('128k');
      } else {
          setConvertQuality('720p');
      }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setResult(null);

    const startTime = startProgress();

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('format', targetFormat);
      formData.append('quality', convertQuality); 

      const res = await fetch(`${API_BASE}/convert.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setResult(data);
        logAction('Converted Media', 'success', `${selectedFile.name} -> ${targetFormat}`);
        
        // Auto trigger download if preferred, or just let user click
        // window.location.href = data.download_url; 
      } else {
        setError(data.message || 'কনভার্সন ব্যর্থ হয়েছে');
        logAction('Convert Failed', 'error', selectedFile.name);
      }
    } catch (err) {
      setError('সার্ভার এরর। FFMPEG পাথ চেক করুন।');
      logAction('Convert Error', 'error', 'Server Error');
    } finally {
      stopProgress(startTime);
      setLoading(false);
    }
  };

  const isVideo = ['mp4', 'mkv', 'avi'].includes(targetFormat);

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center pt-4 animate-slideUp">
        <div className="text-center mb-6">
            <Video className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold dark:text-white">অ্যাডভান্সড মিডিয়া কনভার্টার</h3>
            <p className="text-xs text-gray-500">ভিডিও এবং অডিও ফরম্যাট পরিবর্তন করুন</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2 justify-center"><Info size={16}/>{error}</div>}
        
        {result && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-fadeIn">
                <p className="text-green-700 font-bold mb-2">কাজ সফল হয়েছে!</p>
                {actualTime && <p className="text-xs text-gray-500 mb-2 flex justify-center items-center gap-1"><Clock size={12}/> কনভার্সন সময়: {actualTime}</p>}
                
                {/* Direct Download Button (No New Tab) */}
                <button 
                    onClick={() => window.location.href = result.download_url} 
                    className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-md"
                >
                    <Download size={18} /> ফাইল ডাউনলোড করুন
                </button>
            </div>
        )}

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-300 relative cursor-pointer group">
            <input type="file" accept="video/*,audio/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            <div className="pointer-events-none relative z-10">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition">
                    {selectedFile ? `ফাইল: ${selectedFile.name}` : 'ফাইল ড্রপ করুন বা ক্লিক করুন'}
                </p>
                {selectedFile && <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="text-left">
                <label className="text-xs font-bold text-gray-500 mb-1 block">আউটপুট ফরম্যাট</label>
                <select value={targetFormat} onChange={e => handleFormatChange(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    <optgroup label="Video">
                        <option value="mp4">MP4 (Universal)</option>
                        <option value="mkv">MKV (High Quality)</option>
                        <option value="avi">AVI</option>
                    </optgroup>
                    <optgroup label="Audio Only">
                        <option value="mp3">MP3</option>
                        <option value="aac">AAC</option>
                        <option value="wav">WAV</option>
                        <option value="opus">Opus (Voice/Low Size)</option>
                    </optgroup>
                </select>
            </div>
            <div className="text-left">
                <label className="text-xs font-bold text-gray-500 mb-1 block">
                    {isVideo ? 'রেজোলিউশন (Resolution)' : 'বিটরেট (Bitrate)'}
                </label>
                <select value={convertQuality} onChange={e => setConvertQuality(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    {isVideo ? (
                        <>
                            <option value="720p">720p (HD)</option>
                            <option value="480p">480p (Standard)</option>
                            <option value="360p">360p (Mobile/Low)</option>
                            <option value="240p">240p (Very Low Data)</option>
                        </>
                    ) : (
                        <>
                            {targetFormat === 'opus' ? (
                                <option value="voice">Opus 16k (16kHz Mono Voice)</option>
                            ) : (
                                <>
                                    <option value="128k">128 kbps (Standard)</option>
                                    <option value="64k">64 kbps (Voice)</option>
                                    <option value="24k">24 kbps (Lowest)</option>
                                </>
                            )}
                        </>
                    )}
                </select>
            </div>
        </div>

        {/* Progress Bar */}
        {loading && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner mt-4">
                <div 
                    className="bg-red-500 h-4 rounded-full transition-all duration-300 flex items-center justify-center" 
                    style={{ width: `${progress}%` }}
                >
                    <span className="text-[9px] text-white font-bold">{Math.round(progress)}%</span>
                </div>
                <p className="text-[10px] text-center mt-1 text-gray-500">কনভার্ট হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন</p>
            </div>
        )}

        <button onClick={handleConvert} disabled={!selectedFile || loading} className="w-full bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 transform active:scale-95 shadow-lg flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin"/> : <Video size={18}/>} {loading ? 'প্রসেসিং...' : 'কনভার্ট শুরু করুন'}
        </button>
    </div>
  );
};

export default Converter;
