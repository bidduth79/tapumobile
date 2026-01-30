
import React, { useState, useRef, useEffect } from 'react';
import { Scissors, Layers, Video, Info, Download, Trash2, Plus, Clock, CheckCircle, RefreshCw, X, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../../utils';
import { useApp } from '../../store';

// --- TOAST COMPONENT ---
const EditorToast = ({ msg, type, onClose }: { msg: string, type: 'success'|'error'|'warning', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgClass = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-orange-500';
    const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

    return (
        <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 ${bgClass} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 animate-slideUp text-sm font-bold`}>
            <Icon size={16}/> {msg}
        </div>
    );
};

// Helper Component for Time Input (HH:MM:SS) with Scroll
const TimeInput = ({ label, seconds, onChange, maxDuration }: { label: string, seconds: number, onChange: (val: number) => void, maxDuration?: number }) => {
    
    const toHMS = (totalSec: number) => {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = Math.floor(totalSec % 60);
        const ms = Math.round((totalSec % 1) * 100);
        return { h, m, s, ms };
    };

    const [vals, setVals] = useState(toHMS(seconds));

    useEffect(() => {
        setVals(toHMS(seconds));
    }, [seconds]);

    const updateTime = (type: 'h'|'m'|'s'|'ms', val: number) => {
        let newVals = { ...vals, [type]: val };
        if (type === 's' && val >= 60) { newVals.s = 0; newVals.m += 1; }
        if (type === 's' && val < 0) { newVals.s = 59; newVals.m -= 1; }
        if (type === 'm' && val >= 60) { newVals.m = 0; newVals.h += 1; }
        if (type === 'm' && val < 0) { newVals.m = 59; newVals.h -= 1; }
        if (newVals.h < 0) newVals.h = 0;

        const newTotal = (newVals.h * 3600) + (newVals.m * 60) + newVals.s + (newVals.ms / 100);
        if (maxDuration && newTotal > maxDuration) return; 
        if (newTotal < 0) return;

        onChange(newTotal);
    };

    const handleWheel = (e: React.WheelEvent, type: 'h'|'m'|'s'|'ms') => {
        e.preventDefault(); 
        const delta = e.deltaY < 0 ? 1 : -1;
        updateTime(type, vals[type] + delta);
    };

    return (
        <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">{label}</label>
            <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden w-fit">
                <div className="flex flex-col items-center px-1">
                    <input type="number" className="w-8 p-1 text-center text-sm font-mono bg-transparent outline-none appearance-none" value={vals.h.toString().padStart(2, '0')} onChange={(e) => updateTime('h', parseInt(e.target.value) || 0)} onWheel={(e) => handleWheel(e, 'h')} title="Hours"/>
                    <span className="text-[8px] text-gray-400">HR</span>
                </div>
                <span className="font-bold text-gray-400">:</span>
                <div className="flex flex-col items-center px-1">
                    <input type="number" className="w-8 p-1 text-center text-sm font-mono bg-transparent outline-none appearance-none" value={vals.m.toString().padStart(2, '0')} onChange={(e) => updateTime('m', parseInt(e.target.value) || 0)} onWheel={(e) => handleWheel(e, 'm')} title="Minutes"/>
                    <span className="text-[8px] text-gray-400">MIN</span>
                </div>
                <span className="font-bold text-gray-400">:</span>
                <div className="flex flex-col items-center px-1">
                    <input type="number" className="w-8 p-1 text-center text-sm font-mono bg-transparent outline-none appearance-none" value={vals.s.toString().padStart(2, '0')} onChange={(e) => updateTime('s', parseInt(e.target.value) || 0)} onWheel={(e) => handleWheel(e, 's')} title="Seconds"/>
                    <span className="text-[8px] text-gray-400">SEC</span>
                </div>
            </div>
        </div>
    );
};

const MediaEditor: React.FC = () => {
  const { logAction } = useApp();
  const API_BASE = getApiBaseUrl();
  const [editorMode, setEditorMode] = useState<'cut' | 'join'>('cut');
  
  // Cutter State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState(''); 
  const [mediaToken, setMediaToken] = useState(''); 
  const [mediaDuration, setMediaDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [cutStart, setCutStart] = useState(0);
  const [cutEnd, setCutEnd] = useState(0);
  const [splitParts, setSplitParts] = useState(2);
  const mediaRef = useRef<HTMLVideoElement>(null);

  // Joiner State
  const [joinFiles, setJoinFiles] = useState<File[]>([]);

  // Shared State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'warning'} | null>(null);

  // Progress
  const [progress, setProgress] = useState(0);
  const [actualTime, setActualTime] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  const showToast = (msg: string, type: 'success'|'error'|'warning') => {
      setToast({ msg, type });
  };

  const handleClear = () => {
      setMediaFile(null);
      setMediaUrl('');
      setMediaToken('');
      setMediaDuration(0);
      setCutStart(0);
      setCutEnd(0);
      setJoinFiles([]);
      setResult(null);
      setProgress(0);
      showToast('এডিটর ক্লিয়ার করা হয়েছে', 'warning');
  };

  const startProgress = () => {
      setProgress(0);
      setActualTime(null);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
          setProgress(prev => {
              if (prev >= 95) return 95;
              return prev + Math.random() * 3;
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

  // 2. সরাসরি ডাউনলোড এবং ফাইলের নাম টাইটেল অনুযায়ী হবে
  const triggerDownload = (filename: string, originalName: string, prefix: string) => {
      // Clean original name
      let safeName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, "_");
      if (!safeName) safeName = "video";
      const ext = filename.split('.').pop();
      const finalName = `${safeName}_${prefix}.${ext}`;
      
      const downloadLink = `${API_BASE}/serve.php?file=${filename}&name=${encodeURIComponent(finalName)}`;
      window.location.href = downloadLink;
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setMediaFile(file);
      setLoading(true);
      
      const startTime = startProgress();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'upload_temp');

      try {
          const res = await fetch(`${API_BASE}/media_tools.php`, { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setMediaToken(data.file_token);
              setMediaUrl(data.url);
              setMediaDuration(data.duration);
              setCutEnd(data.duration);
              showToast('ফাইল আপলোড সফল হয়েছে', 'success');
          } else {
              showToast('আপলোড ব্যর্থ: ' + data.message, 'error');
          }
      } catch(e) { showToast('সার্ভার এরর', 'error'); }
      finally { 
          stopProgress(startTime);
          setLoading(false); 
      }
  };

  const handleCut = async (mode: 'manual' | 'split') => {
      if (!mediaToken) return;
      setLoading(true);
      setResult(null);

      const startTime = startProgress();
      const formData = new FormData();
      formData.append('action', 'cut');
      formData.append('token', mediaToken);
      formData.append('mode', mode);
      
      if (mode === 'manual') {
          formData.append('start', cutStart.toString());
          formData.append('end', cutEnd.toString());
      } else {
          formData.append('parts', splitParts.toString());
          formData.append('total_duration', mediaDuration.toString());
      }

      try {
          const res = await fetch(`${API_BASE}/media_tools.php`, { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setResult({ type: 'multi', files: data.files });
              logAction('Edited Media (Cut)', 'success');
              showToast('কাটিং সফল হয়েছে!', 'success');
              
              // Auto download first part
              if(data.files.length === 1 && mediaFile) {
                  triggerDownload(data.files[0].name, mediaFile.name, 'cut');
              }
          } else {
              showToast('কাটিং ব্যর্থ: ' + data.message, 'error');
          }
      } catch (e) { showToast('সার্ভার এরর', 'error'); }
      finally { 
          stopProgress(startTime);
          setLoading(false); 
      }
  };

  // 3. একসাথে ৪-৫ টিও আপলোড করা যাবে
  const handleJoinUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files!);
          setJoinFiles(prev => [...prev, ...newFiles]);
          showToast(`${newFiles.length} টি ফাইল যোগ করা হয়েছে`, 'success');
      }
      e.target.value = '';
  };

  const removeJoinFile = (idx: number) => {
      setJoinFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleJoin = async () => {
      if (joinFiles.length < 2) { showToast('অন্তত দুটি ফাইল সিলেক্ট করুন', 'warning'); return; }
      setLoading(true);
      setResult(null);

      const startTime = startProgress();
      const formData = new FormData();
      formData.append('action', 'join');
      joinFiles.forEach((file) => {
          formData.append(`files[]`, file);
      });

      try {
          const res = await fetch(`${API_BASE}/media_tools.php`, { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              // Direct download with name
              const firstFileName = joinFiles[0].name;
              triggerDownload(data.filename, firstFileName, 'merged');
              
              setResult({ filename: data.filename });
              showToast('ভিডিও জোড়া লাগানো সফল হয়েছে!', 'success');
              logAction('Edited Media (Join)', 'success');
          } else {
              showToast('জয়েন ব্যর্থ: ' + data.message, 'error');
          }
      } catch (e) { showToast('সার্ভার এরর। ফাইল সাইজ বা ফরম্যাট চেক করুন।', 'error'); }
      finally { 
          stopProgress(startTime);
          setLoading(false); 
      }
  };

  return (
    <div className="h-full flex flex-col pt-4 animate-slideUp pb-20">
        {toast && <EditorToast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Clear Button */}
        <div className="absolute top-4 right-4">
            <button onClick={handleClear} className="flex items-center gap-1 text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1.5 rounded transition">
                <RefreshCw size={12}/> রিসেট
            </button>
        </div>

        {result && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-fadeIn mx-auto max-w-lg">
                <p className="text-green-700 font-bold mb-2">প্রসেসিং সম্পন্ন!</p>
                {actualTime && <p className="text-xs text-gray-500 mb-2 flex justify-center items-center gap-1"><Clock size={12}/> সময় লেগেছে: {actualTime}</p>}
                
                {result.type === 'multi' ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold">ডাউনলোড করুন:</p>
                        {result.files.map((f: any, i: number) => (
                            <button key={i} onClick={() => triggerDownload(f.name, mediaFile?.name || 'video', `part_${i+1}`)} className="block text-blue-600 hover:underline text-sm bg-white p-2 rounded border flex justify-between items-center">
                                <span>Part {i+1}</span> <Download size={14}/>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-blue-600">ফাইলটি অটোমেটিক ডাউনলোড শুরু হয়েছে। না হলে আবার চেষ্টা করুন।</p>
                )}
            </div>
        )}

        <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            <button onClick={() => setEditorMode('cut')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition ${editorMode === 'cut' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}><Scissors size={16}/> কাটার (Cutter)</button>
            <button onClick={() => setEditorMode('join')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition ${editorMode === 'join' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}><Layers size={16}/> জয়েনার (Joiner)</button>
        </div>

        {/* Global Progress Bar */}
        {loading && (
            <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-300 flex items-center justify-center" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[10px] text-center mt-1 text-blue-600 font-bold animate-pulse">{progress < 100 ? `কাজ চলছে... ${Math.round(progress)}%` : 'সমাপ্ত!'}</p>
            </div>
        )}

        {editorMode === 'cut' ? (
            <div className="space-y-4 max-w-2xl mx-auto w-full">
                {!mediaUrl ? (
                    <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-10 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center cursor-pointer relative block group">
                        <input type="file" accept="video/*,audio/*" onChange={handleMediaUpload} className="hidden" />
                        <div className="pointer-events-none">
                            <Video className="w-10 h-10 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-bold dark:text-white">ফাইল সিলেক্ট করুন</p>
                            <p className="text-xs text-gray-500">ভিডিও বা অডিও ফাইল (সর্বোচ্চ ১০০MB)</p>
                        </div>
                    </label>
                ) : (
                    <div className="space-y-4 animate-fadeIn">
                        <video ref={mediaRef} src={mediaUrl} controls className="w-full rounded-lg bg-black max-h-[300px]" onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} />
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-sm font-mono dark:text-white flex items-center gap-2">
                                    <Clock size={14}/> কারেন্ট: {(currentTime).toFixed(1)}s / {(mediaDuration).toFixed(1)}s
                                </div>
                            </div>
                            <div className="flex justify-around items-center gap-4 mb-6">
                                <div className="flex flex-col gap-2 items-center">
                                    <TimeInput label="শুরুর সময়" seconds={cutStart} onChange={setCutStart} maxDuration={mediaDuration} />
                                    <button onClick={() => setCutStart(currentTime)} className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded hover:bg-green-200">Set Current</button>
                                </div>
                                <div className="h-10 w-[1px] bg-gray-300"></div>
                                <div className="flex flex-col gap-2 items-center">
                                    <TimeInput label="শেষের সময়" seconds={cutEnd} onChange={setCutEnd} maxDuration={mediaDuration} />
                                    <button onClick={() => setCutEnd(currentTime)} className="px-2 py-1 bg-red-100 text-red-700 text-[10px] rounded hover:bg-red-200">Set Current</button>
                                </div>
                            </div>
                            <button onClick={() => handleCut('manual')} disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold hover:bg-primary-700 transition mb-4 disabled:opacity-50 shadow-md">
                                {loading ? 'Processing...' : 'কেটে ডাউনলোড করুন (Cut & Download)'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="max-w-xl mx-auto w-full space-y-6">
                <label className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition text-center relative cursor-pointer group block">
                    <input type="file" multiple accept="video/*,audio/*" onChange={handleJoinUpload} className="hidden" />
                    <div className="pointer-events-none relative z-10">
                        <Plus className="w-10 h-10 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-bold text-blue-700 dark:text-blue-300">ভিডিও ফাইল যোগ করুন (Add Files)</p>
                        <p className="text-xs text-blue-500">একসাথে একাধিক ভিডিও সিলেক্ট করতে পারেন</p>
                    </div>
                </label>

                {joinFiles.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-bold dark:text-white">তালিকা ({joinFiles.length}টি ফাইল):</p>
                            <button onClick={() => setJoinFiles([])} className="text-xs text-red-500 hover:underline">সব মুছুন</button>
                        </div>
                        <ul className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-700">
                            {joinFiles.map((f, i) => (
                                <li key={i} className="text-xs p-3 flex justify-between items-center group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="bg-gray-200 dark:bg-gray-700 w-6 h-6 flex items-center justify-center rounded-full font-bold text-gray-600 dark:text-gray-300 shrink-0">{i+1}</span>
                                        <span className="truncate font-medium dark:text-gray-200">{f.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 font-mono">{(f.size/1024/1024).toFixed(2)} MB</span>
                                        <button onClick={() => removeJoinFile(i)} className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition"><Trash2 size={14}/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button onClick={handleJoin} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? 'প্রসেসিং হচ্ছে...' : <><Layers size={18}/> জোড়া লাগিয়ে ডাউনলোড করুন</>}
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default MediaEditor;
