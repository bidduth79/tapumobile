
import React, { useState, useRef } from 'react';
import { Download, Video, Headphones, Info, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '../../utils';
import { useApp } from '../../store';

const Downloader: React.FC = () => {
  const { logAction } = useApp();
  const API_BASE = getApiBaseUrl();
  const [dlUrl, setDlUrl] = useState('');
  const [dlType, setDlType] = useState('video');
  const [dlQuality, setDlQuality] = useState('best'); 
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
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
              if (prev >= 90) return 90;
              return prev + Math.random() * 2;
          });
      }, 300);
      return startTime;
  };

  const stopProgress = (startTime: number) => {
      clearInterval(timerRef.current);
      setProgress(100);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      setActualTime(duration + 's');
  };

  const fetchVideoInfo = async () => {
    if (!dlUrl) return;
    setFetchingInfo(true);
    setVideoInfo(null);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('url', dlUrl);
      const res = await fetch(`${API_BASE}/video_info.php`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setVideoInfo(data.info);
      } else {
        setError(data.message || 'তথ্য পাওয়া যায়নি');
      }
    } catch (e) {
      setError('সার্ভার এরর');
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleDownload = async () => {
    if (!dlUrl) return;
    setLoading(true);
    setError('');
    setResult(null);
    
    const startTime = startProgress();

    try {
      const formData = new FormData();
      formData.append('url', dlUrl);
      formData.append('type', dlType);
      formData.append('quality', dlQuality);
      
      // ১. ফাইলের নাম টাইটেল অনুযায়ী হবে
      if (videoInfo && videoInfo.title) {
          formData.append('title', videoInfo.title);
      } else {
          // Fallback title generation
          formData.append('title', `Video_${Date.now()}`);
      }

      const res = await fetch(`${API_BASE}/download.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data);
        logAction('Downloaded Media', 'success', `${dlType.toUpperCase()}: ${dlUrl}`);
        
        // ৩. ব্রাউজারের আলাদা ট্যাবে যাবে না, সরাসরি ডাউনলোড হবে
        if (data.download_url) {
            window.location.href = data.download_url;
        }
      } else {
        setError(data.message || 'ডাউনলোড ব্যর্থ হয়েছে');
        logAction('Download Failed', 'error', dlUrl);
      }
    } catch (err) {
      setError('সার্ভার এরর। কনফিগারেশন চেক করুন।');
      logAction('Download Error', 'error', 'Server Error');
    } finally {
      stopProgress(startTime);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pt-4 animate-fadeIn">
        <div className="text-center mb-6">
            <Download className="w-12 h-12 text-primary-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold dark:text-white">সোশ্যাল মিডিয়া ডাউনলোডার</h3>
            <p className="text-xs text-gray-500">Facebook, YouTube, TikTok, Instagram (Direct & High Speed)</p>
        </div>
        
        {/* Messages */}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2"><Info size={16}/>{error}</div>}
        {result && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-fadeIn">
                <p className="text-green-700 font-bold mb-2 flex items-center justify-center gap-2"><CheckCircle size={18}/> ডাউনলোড শুরু হয়েছে!</p>
                {actualTime && <p className="text-xs text-gray-500 mb-2 flex justify-center items-center gap-1"><Clock size={12}/> প্রসেসিং সময়: {actualTime}</p>}
                {result.download_url && (
                    <p className="text-[10px] text-gray-400">ডাউনলোড শুরু না হলে <a href={result.download_url} className="text-blue-600 underline font-bold">এখানে ক্লিক করুন</a></p>
                )}
            </div>
        )}

        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-2">
            <button 
                onClick={() => { setDlType('video'); setDlQuality('best'); }} 
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition ${dlType === 'video' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:bg-white/50'}`}
            >
                <Video size={16}/> ভিডিও
            </button>
            <button 
                onClick={() => { setDlType('audio'); setDlQuality('best'); }} 
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition ${dlType === 'audio' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:bg-white/50'}`}
            >
                <Headphones size={16}/> অডিও
            </button>
        </div>

        <div className="flex gap-2">
            <input 
                className="flex-1 p-3 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                placeholder="ভিডিও লিংক পেস্ট করুন..."
                value={dlUrl}
                onChange={e => setDlUrl(e.target.value)}
            />
            <button onClick={fetchVideoInfo} disabled={!dlUrl || fetchingInfo} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors" title="তথ্য যাচাই"><Info size={20} className={fetchingInfo ? 'animate-spin' : ''} /></button>
        </div>

        {dlType === 'video' ? (
            <div className="flex gap-2 items-center">
                <label className="text-xs font-bold text-gray-500">ভিডিও কোয়ালিটি:</label>
                <select value={dlQuality} onChange={(e) => setDlQuality(e.target.value)} className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 text-sm outline-none">
                    <option value="best">Best Available (Max)</option>
                    <option value="1080">1080p (Full HD)</option>
                    <option value="720">720p (HD)</option>
                    <option value="480">480p (SD)</option>
                    <option value="360">360p (Data Saver)</option>
                </select>
            </div>
        ) : (
            <div className="flex gap-2 items-center">
                <label className="text-xs font-bold text-gray-500">অডিও ফরম্যাট:</label>
                <select value={dlQuality} onChange={(e) => setDlQuality(e.target.value)} className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 text-sm outline-none">
                    <option value="best">MP3 (Best Quality)</option>
                    <option value="128k">MP3 (128kbps)</option>
                    <option value="64k">MP3 (64kbps - Voice)</option>
                    <option value="opus_16k_mono">Opus (Lowest Size)</option>
                </select>
            </div>
        )}

        {videoInfo && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex gap-3 items-start border dark:border-gray-700 animate-fadeIn">
                {videoInfo.thumbnail && <img src={videoInfo.thumbnail} className="w-24 h-16 object-cover rounded bg-black" alt="" />}
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold dark:text-white truncate">{videoInfo.title}</p>
                    <p className="text-xs text-gray-500">{videoInfo.duration_string} • {videoInfo.uploader}</p>
                </div>
            </div>
        )}
        
        {loading && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center" 
                    style={{ width: `${progress}%` }}
                >
                </div>
                <p className="text-[10px] text-center mt-1 text-gray-500 animate-pulse">
                    {dlType === 'audio' ? 'ভিডিও ডাউনলোড ও অডিও কনভার্ট হচ্ছে...' : 'ডাউনলোড প্রসেসিং হচ্ছে...'} {Math.round(progress)}%
                </p>
            </div>
        )}

        <button onClick={handleDownload} disabled={loading || !dlUrl} className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 transform">
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Download size={20}/>} 
            {loading ? 'অনুগ্রহ করে অপেক্ষা করুন...' : `ডাউনলোড করুন (${dlType === 'audio' ? 'Convert to Audio' : 'Video'})`}
        </button>
        
        <p className="text-[10px] text-gray-400 text-center mt-2">
            * বড় ভিডিও বা অডিও কনভার্সনে সার্ভারে কিছুক্ষণ সময় লাগতে পারে।
        </p>
    </div>
  );
};

export default Downloader;
