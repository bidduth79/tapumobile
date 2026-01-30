
import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { ScanText, Upload, Copy, Loader2, Image as ImageIcon, RotateCcw } from 'lucide-react';

const OcrTool: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setText('');
      setProgress(0);
      setStatus('');
    }
  };

  const performOcr = async () => {
    if (!image) return;
    setLoading(true);
    setText('');
    
    try {
      const worker = await createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatus(`বিশ্লেষণ চলছে... ${Math.round(m.progress * 100)}%`);
          } else {
            setStatus(m.status);
          }
        }
      });
      
      // Load languages (Bengali and English)
      await worker.loadLanguage('ben+eng');
      await worker.initialize('ben+eng');
      
      const { data: { text } } = await worker.recognize(image);
      setText(text);
      await worker.terminate();
    } catch (err) {
      console.error(err);
      setStatus('ত্রুটি হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(text);
    setStatus('টেক্সট কপি করা হয়েছে!');
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 animate-slideUp">
      <div className="text-center mb-6">
          <ScanText className="w-12 h-12 text-teal-600 mx-auto mb-2" />
          <h3 className="text-xl font-bold dark:text-white">OCR (ইমেজ টু টেক্সট)</h3>
          <p className="text-xs text-gray-500">ছবি থেকে বাংলা বা ইংরেজি লেখা টেক্সট আকারে বের করুন</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition relative group h-64 flex flex-col items-center justify-center bg-white dark:bg-gray-800">
            {image ? (
              <img src={image} alt="Upload" className="max-h-full max-w-full object-contain rounded shadow-sm" />
            ) : (
              <div className="pointer-events-none">
                <Upload size={40} className="mx-auto text-gray-400 mb-2 group-hover:text-teal-500 transition-colors"/>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">এখানে ছবি আপলোড করুন</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG supported</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>

          <div className="flex gap-2">
             <button 
                onClick={() => { setImage(null); setText(''); setProgress(0); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
             >
               <RotateCcw size={18}/>
             </button>
             <button 
                onClick={performOcr} 
                disabled={!image || loading} 
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {loading ? <Loader2 size={18} className="animate-spin"/> : <ScanText size={18}/>} টেক্সট এক্সট্রাক্ট করুন
             </button>
          </div>
          
          {loading && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          )}
          
          {status && <p className="text-xs text-center text-teal-600 dark:text-teal-400 font-mono animate-pulse">{status}</p>}
        </div>

        {/* Output Area */}
        <div className="flex flex-col h-64 md:h-auto">
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="text-xs font-bold text-gray-500 uppercase">ফলাফল (Output)</label>
            <button onClick={copyText} disabled={!text} className="text-xs text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50">
              <Copy size={12}/> কপি করুন
            </button>
          </div>
          <textarea 
            readOnly 
            value={text} 
            className="flex-1 w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-teal-500 outline-none text-sm leading-relaxed"
            placeholder="ফলাফল এখানে দেখাবে..."
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default OcrTool;
