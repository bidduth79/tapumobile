
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Tag, X, Edit, Trash2, CheckCircle, Circle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Keyword } from '../../types';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    triggerUndo: (id: string | number, label: string) => void;
}

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b', '#000000'];

const KeywordManager: React.FC<Props> = ({ showToast, triggerUndo }) => {
  const { keywords, addKeyword, updateKeyword, removeKeyword } = useApp();
  // ... (Keep existing state) ...
  const [editingKeywordId, setEditingKeywordId] = useState<number | null>(null);
  const [isMonitor, setIsMonitor] = useState(true);
  const [isReport, setIsReport] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [subKeywordInput, setSubKeywordInput] = useState('');
  const [subKeywords, setSubKeywords] = useState<string[]>([]);
  
  const [keywordColor, setKeywordColor] = useState('#0ea5e9');
  const [opacity, setOpacity] = useState(1.0);
  const [listFilter, setListFilter] = useState<'all'|'monitor'|'report'>('all');

  const handleAddSubKeyword = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && subKeywordInput.trim()) { e.preventDefault(); setSubKeywords([...subKeywords, subKeywordInput.trim()]); setSubKeywordInput(''); } };
  const removeSubKeyword = (idx: number) => { setSubKeywords(subKeywords.filter((_, i) => i !== idx)); };
  
  const startEditKeyword = (k: Keyword) => { 
      setEditingKeywordId(k.id); 
      setNewKeyword(k.keyword); 
      setIsMonitor(k.type === 'monitor' || k.type === 'both');
      setIsReport(k.type === 'report' || k.type === 'both');
      setSubKeywords(k.variations || []); 
      setKeywordColor(k.color || '#0ea5e9'); 
      setOpacity(k.opacity !== undefined ? k.opacity : 1.0);
  };
  
  const cancelKeywordEdit = () => { 
      setEditingKeywordId(null); 
      setNewKeyword(''); 
      setSubKeywords([]); 
      setKeywordColor('#0ea5e9'); 
      setOpacity(1.0);
      setIsMonitor(true); 
      setIsReport(false);
  };
  
  const handleKeywordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newKeyword.trim()) { showToast('কিওয়ার্ড ফিল্ড খালি হতে পারে না', 'error'); return; }
      if (!isMonitor && !isReport) { showToast('অন্তত একটি টাইপ (মনিটর বা রিপোর্ট) সিলেক্ট করুন', 'warning'); return; }

      const type = (isMonitor && isReport) ? 'both' : (isMonitor ? 'monitor' : 'report');

      if (editingKeywordId) { 
          updateKeyword(editingKeywordId, { keyword: newKeyword.trim(), type, variations: subKeywords, color: keywordColor, opacity }); 
          showToast('কিওয়ার্ড আপডেট হয়েছে!', 'success');
          cancelKeywordEdit(); 
      } 
      else { 
          addKeyword(newKeyword.trim(), type, subKeywords, keywordColor, opacity, true); 
          setNewKeyword(''); setSubKeywords([]); 
          showToast('নতুন কিওয়ার্ড যুক্ত হয়েছে!', 'success'); 
      }
  };

  const handleDelete = async (keyword: Keyword) => {
      const result = await window.Swal.fire({
          title: 'আপনি কি নিশ্চিত?',
          text: "কিওয়ার্ডটি ডিলিট করতে চান?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'হ্যাঁ, ডিলিট করুন',
          cancelButtonText: 'বাতিল'
      });

      if (result.isConfirmed) {
          removeKeyword(keyword.id);
          triggerUndo(keyword.id, keyword.keyword);
      }
  };

  const toggleActive = (k: Keyword) => {
      updateKeyword(k.id, { is_active: !k.is_active });
  };

  const filteredList = keywords.filter(k => {
      if (listFilter === 'all') return true;
      if (listFilter === 'monitor') return k.type === 'monitor' || k.type === 'both';
      if (listFilter === 'report') return k.type === 'report' || k.type === 'both';
      return true;
  });

  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
        {/* ... (Keep form panel JSX same) ... */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit sticky top-20">
            <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2"><Tag size={20} className="text-primary-600"/> {editingKeywordId ? 'কিওয়ার্ড এডিট' : 'নতুন কিওয়ার্ড'}</h3>
            <form onSubmit={handleKeywordSubmit} className="space-y-5">
                <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${isMonitor ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <input type="checkbox" checked={isMonitor} onChange={() => setIsMonitor(!isMonitor)} className="hidden" />
                        {isMonitor ? <CheckCircle size={18}/> : <Circle size={18}/>}
                        <span className="font-bold text-sm">মনিটর</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${isReport ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <input type="checkbox" checked={isReport} onChange={() => setIsReport(!isReport)} className="hidden" />
                        {isReport ? <CheckCircle size={18}/> : <Circle size={18}/>}
                        <span className="font-bold text-sm">রিপোর্ট</span>
                    </label>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">মূল কিওয়ার্ড</label>
                    <input required placeholder="যেমন: নির্বাচন, বিজিবি..." className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">ভ্যারিয়েশন / ভুল বানান (Enter চাপুন)</label>
                    <input placeholder="যেমন: election, vot..." className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" value={subKeywordInput} onChange={e => setSubKeywordInput(e.target.value)} onKeyDown={handleAddSubKeyword} />
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">{subKeywords.map((sk, idx) => (<span key={idx} className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs flex items-center gap-1">{sk} <button type="button" onClick={() => removeSubKeyword(idx)}><X size={12}/></button></span>))}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">কালার প্যালেট</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setKeywordColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition transform hover:scale-110 ${keywordColor === c ? 'border-gray-600 dark:border-white scale-110 shadow-md' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 ml-2">
                                <input type="color" value={keywordColor} onChange={e => setKeywordColor(e.target.value)} className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">স্বচ্ছতা (Opacity)</label>
                            <span className="text-xs font-mono">{Math.round(opacity * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.1" max="1.0" step="0.1" 
                            value={opacity} 
                            onChange={e => setOpacity(parseFloat(e.target.value))} 
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                        />
                    </div>
                    <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                        <span className="px-4 py-1 rounded text-sm font-bold text-white transition-all" style={{ backgroundColor: keywordColor, opacity: opacity }}>{newKeyword || 'Preview Text'}</span>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    {editingKeywordId && <button type="button" onClick={cancelKeywordEdit} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition">বাতিল</button>}
                    <button type="submit" className={`flex-1 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition ${editingKeywordId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-600 hover:bg-primary-700'}`}>{editingKeywordId ? 'আপডেট করুন' : 'সেভ করুন'}</button>
                </div>
            </form>
        </div>

        {/* List Panel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-[650px]">
            <div className="flex flex-col gap-3 mb-4">
                <h3 className="font-bold dark:text-white">সেভ করা কিওয়ার্ড ({filteredList.length})</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    <button onClick={() => setListFilter('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${listFilter === 'all' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>All</button>
                    <button onClick={() => setListFilter('monitor')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${listFilter === 'monitor' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>Monitor</button>
                    <button onClick={() => setListFilter('report')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${listFilter === 'report' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Report</button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {filteredList.map(k => (
                    <div key={k.id} className={`group border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex justify-between items-center hover:shadow-md transition-all ${k.is_active === false ? 'opacity-60 bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`}>
                        <div className="flex-1 min-w-0 pr-3 flex items-center gap-3">
                            <div className="w-4 h-10 rounded-full shrink-0" style={{ backgroundColor: k.color, opacity: k.opacity ?? 1 }} title={`Opacity: ${k.opacity}`}></div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                                    {k.keyword}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${k.type === 'both' ? 'bg-purple-100 text-purple-700 border-purple-200' : (k.type === 'monitor' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200')}`}>
                                        {k.type === 'both' ? 'BOTH' : (k.type === 'monitor' ? 'MON' : 'RPT')}
                                    </span>
                                </h4>
                                {k.variations && k.variations.length > 0 ? (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug truncate max-w-[200px]">{k.variations.join(', ')}</p>
                                ) : (
                                    <p className="text-[10px] text-gray-400 italic mt-1">No variations</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleActive(k)} className={`transition-colors ${k.is_active !== false ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`} title={k.is_active !== false ? "Active" : "Inactive"}>
                                {k.is_active !== false ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                            </button>
                            <button onClick={() => startEditKeyword(k)} className="text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(k)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
                {filteredList.length === 0 && (
                    <div className="text-center py-10 text-gray-400">এই ফিল্টারে কোনো কিওয়ার্ড নেই</div>
                )}
            </div>
        </div>
    </div>
  );
};

export default KeywordManager;
