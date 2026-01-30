
import React, { useState } from 'react';
import { Zap, Plus, Trash2, Edit, X, Eye, Type } from 'lucide-react';
import { useApp } from '../../store';
import { SpotlightItem } from '../../types';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b', '#000000'];

const SpotlightManager: React.FC<Props> = ({ showToast }) => {
  const { spotlightItems, addSpotlight, updateSpotlight, deleteSpotlight, toggleSpotlight } = useApp();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [word, setWord] = useState('');
  const [variations, setVariations] = useState<string[]>([]);
  const [varInput, setVarInput] = useState('');
  const [color, setColor] = useState('#ff0000');
  const [opacity, setOpacity] = useState(1.0);

  const handleVarKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && varInput.trim()) {
          e.preventDefault();
          if (!variations.includes(varInput.trim())) {
              setVariations([...variations, varInput.trim()]);
          }
          setVarInput('');
      }
  };

  const removeVariation = (idx: number) => {
      setVariations(variations.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
      if (!word.trim()) {
          showToast('মূল শব্দটি লিখতে হবে!', 'error');
          return;
      }
      if (editingId) {
          updateSpotlight(editingId, { word, variations, color, opacity });
          showToast('স্পটলাইট আপডেট হয়েছে!', 'success');
          setEditingId(null);
      } else {
          addSpotlight(word, variations, color, opacity);
          showToast('নতুন স্পটলাইট যোগ হয়েছে!', 'success');
      }
      resetForm();
  };

  const handleDelete = async (id: number) => {
      const result = await window.Swal.fire({
          title: 'আপনি কি নিশ্চিত?',
          text: "এটি মুছে ফেলা হবে!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'হ্যাঁ, মুছে ফেলুন',
          cancelButtonText: 'বাতিল'
      });

      if (result.isConfirmed) {
          deleteSpotlight(id);
          showToast('স্পটলাইট মুছে ফেলা হয়েছে', 'warning');
      }
  };

  const startEdit = (item: SpotlightItem) => {
      setEditingId(item.id);
      setWord(item.word);
      setVariations(item.variations || []);
      setColor(item.color);
      setOpacity(item.opacity);
  };

  const resetForm = () => {
      setEditingId(null);
      setWord('');
      setVariations([]);
      setColor('#ff0000');
      setOpacity(1.0);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn">
        {/* Config Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit sticky top-20">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600"><Zap size={24}/></div>
                <div>
                    <h3 className="font-bold dark:text-white text-lg">{editingId ? 'স্পটলাইট এডিট' : 'নতুন স্পটলাইট'}</h3>
                    <p className="text-xs text-gray-500">শব্দ হাইলাইটিং কনফিগারেশন</p>
                </div>
            </div>
            
            <div className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">মূল শব্দ (Main Word)</label>
                    <input 
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                        placeholder="যেমন: বিজিবি, ব্রেকিং..." 
                        value={word} 
                        onChange={e => setWord(e.target.value)} 
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">ভ্যারিয়েশন (Enter চাপুন)</label>
                    <input 
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="ভুল বানান বা সমার্থক শব্দ..." 
                        value={varInput} 
                        onChange={e => setVarInput(e.target.value)} 
                        onKeyDown={handleVarKeyDown} 
                    />
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                        {variations.map((v, i) => (
                            <span key={i} className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-xs flex items-center gap-1 border border-gray-200 dark:border-gray-500">
                                {v} <button onClick={() => removeVariation(i)} className="hover:text-red-500"><X size={12}/></button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                    <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">কালার প্যালেট</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${color === c ? 'border-gray-600 dark:border-white scale-110 shadow-md' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 p-2 border rounded-lg bg-white dark:bg-gray-800">
                            <input 
                                type="color" 
                                value={color} 
                                onChange={e => setColor(e.target.value)} 
                                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                            />
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{color}</span>
                        </div>
                        <div>
                            <input 
                                type="range" 
                                min="0.1" max="1.0" step="0.1" 
                                value={opacity} 
                                onChange={e => setOpacity(parseFloat(e.target.value))} 
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-orange-600 mt-3"
                                title={`Opacity: ${opacity}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Box */}
                <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-xs text-gray-400 mb-2 font-bold uppercase flex items-center gap-1"><Eye size={12}/> প্রিভিউ</p>
                    <p className="text-sm dark:text-gray-300">
                        আজকের সংবাদে <span style={{ backgroundColor: color, opacity: opacity, padding: '2px 4px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>{word || 'Word'}</span> এর উপস্থিতি লক্ষ্য করা গেছে।
                    </p>
                </div>

                <div className="flex gap-2">
                    {editingId && <button onClick={resetForm} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold">বাতিল</button>}
                    <button onClick={handleSubmit} className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700 transition flex items-center justify-center gap-2">
                        {editingId ? 'আপডেট করুন' : <><Plus size={18}/> স্পটলাইটে যোগ করুন</>}
                    </button>
                </div>
            </div>
        </div>

        {/* List Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-[650px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold dark:text-white">স্পটলাইট লিস্ট ({spotlightItems.length})</h3>
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded font-bold border border-orange-200">Active</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {spotlightItems.map(item => (
                    <div key={item.id} className={`flex items-start justify-between p-4 rounded-xl border transition-all group ${item.isActive ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 opacity-60'}`}>
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                                {/* Visual Badge of the word */}
                                <span 
                                    className="px-2 py-0.5 rounded text-sm font-bold text-white shadow-sm"
                                    style={{ backgroundColor: item.color, opacity: item.opacity }}
                                >
                                    {item.word}
                                </span>
                                {!item.isActive && <span className="text-[10px] text-red-500 font-bold">(Inactive)</span>}
                            </div>
                            
                            {item.variations && item.variations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {item.variations.map((v, idx) => (
                                        <span key={idx} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleSpotlight(item.id, !item.isActive)} className={`p-2 rounded-lg transition ${item.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`} title="Toggle Active">
                                <Zap size={16} fill={item.isActive ? 'currentColor' : 'none'}/>
                            </button>
                            <button onClick={() => startEdit(item)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition" title="Edit">
                                <Edit size={16}/>
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition" title="Delete">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                ))}
                {spotlightItems.length === 0 && <div className="text-center py-20 text-gray-400">কোনো স্পটলাইট শব্দ নেই</div>}
            </div>
        </div>
    </div>
  );
};

export default SpotlightManager;
