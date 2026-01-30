
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Settings, X, Plus, Trash2, ToggleLeft, ToggleRight, ShieldAlert, FileText, Monitor, Layers } from 'lucide-react';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const RulesManager: React.FC<Props> = ({ showToast }) => {
  const { keywords, addRule, toggleRule, deleteRule } = useApp();

  const [activeTab, setActiveTab] = useState<'monitor' | 'report' | 'both'>('monitor');
  const [selectedRuleKeywordId, setSelectedRuleKeywordId] = useState<string>('');
  const [mustIncludeInput, setMustIncludeInput] = useState('');
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [mustExcludeInput, setMustExcludeInput] = useState('');
  const [mustExclude, setMustExclude] = useState<string[]>([]);

  const handleAddInclude = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && mustIncludeInput.trim()) { e.preventDefault(); setMustInclude([...mustInclude, mustIncludeInput.trim()]); setMustIncludeInput(''); } };
  const removeInclude = (idx: number) => setMustInclude(mustInclude.filter((_, i) => i !== idx));
  const handleAddExclude = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && mustExcludeInput.trim()) { e.preventDefault(); setMustExclude([...mustExclude, mustExcludeInput.trim()]); setMustExcludeInput(''); } };
  const removeExclude = (idx: number) => setMustExclude(mustExclude.filter((_, i) => i !== idx));
  
  const handleRuleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedRuleKeywordId) { showToast('দয়া করে একটি কিওয়ার্ড সিলেক্ট করুন', 'error'); return; }
      if (mustInclude.length === 0 && mustExclude.length === 0) { showToast('অন্তত একটি ইনক্লুড বা এক্সক্লুড শর্ত দিন', 'warning'); return; }
      
      addRule(parseInt(selectedRuleKeywordId), mustInclude, mustExclude);
      setMustInclude([]); setMustExclude([]); 
      showToast('নতুন রুল যুক্ত হয়েছে', 'success');
  };

  const handleDeleteRule = async (id: number) => {
      const result = await window.Swal.fire({
          title: 'আপনি কি নিশ্চিত?',
          text: "এই রুলটি ডিলিট করা হবে!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'হ্যাঁ, মুছে ফেলুন',
          cancelButtonText: 'বাতিল'
      });

      if (result.isConfirmed) {
          deleteRule(id);
          showToast('রুল মুছে ফেলা হয়েছে', 'warning');
      }
  };

  const handleToggleRule = (id: number, status: boolean) => {
      toggleRule(id, status);
      showToast(status ? 'রুল চালু করা হয়েছে' : 'রুল বন্ধ করা হয়েছে', 'info');
  };

  // Filter keywords based on active tab
  const filteredKeywords = keywords.filter(k => k.type === activeTab);

  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
        {/* Left Column: Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit sticky top-20">
            
            {/* Header Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                <button 
                    onClick={() => { setActiveTab('monitor'); setSelectedRuleKeywordId(''); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition ${activeTab === 'monitor' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Monitor size={14}/> মনিটর
                </button>
                <button 
                    onClick={() => { setActiveTab('report'); setSelectedRuleKeywordId(''); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition ${activeTab === 'report' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FileText size={14}/> রিপোর্ট
                </button>
                <button 
                    onClick={() => { setActiveTab('both'); setSelectedRuleKeywordId(''); }}
                    className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition ${activeTab === 'both' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Layers size={14}/> Both
                </button>
            </div>

            <div className={`flex items-center gap-2 mb-6 border-b pb-4 ${activeTab === 'monitor' ? 'border-teal-100' : (activeTab === 'report' ? 'border-blue-100' : 'border-purple-100')} dark:border-gray-700`}>
                <div className={`p-2 rounded-lg ${activeTab === 'monitor' ? 'bg-teal-100 text-teal-600' : (activeTab === 'report' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600')}`}>
                    <Settings size={24}/>
                </div>
                <div>
                    <h3 className="font-bold dark:text-white text-lg">রুলস ইঞ্জিন: {activeTab === 'both' ? 'Both (Common Rules)' : activeTab.toUpperCase()}</h3>
                    <p className="text-xs text-gray-500">
                        {activeTab === 'both' ? 'মনিটর ও রিপোর্ট উভয়ের জন্য রুল সেট করুন' : `${activeTab} এর জন্য লজিক সেট করুন`}
                    </p>
                </div>
            </div>

            <form onSubmit={handleRuleSubmit} className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">কিওয়ার্ড সিলেক্ট করুন ({activeTab})</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm" value={selectedRuleKeywordId} onChange={e => setSelectedRuleKeywordId(e.target.value)}>
                        <option value="">-- সিলেক্ট --</option>
                        {filteredKeywords.map(k => (<option key={k.id} value={k.id}>{k.keyword}</option>))}
                    </select>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-green-600 mb-2 uppercase"><Plus size={14}/> Must Include (অবশ্যই থাকতে হবে)</label>
                        <input placeholder="শব্দ লিখুন এবং Enter চাপুন..." className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-white text-sm outline-none focus:border-green-500 shadow-sm" value={mustIncludeInput} onChange={e => setMustIncludeInput(e.target.value)} onKeyDown={handleAddInclude} />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {mustInclude.map((wd, idx) => (
                                <span key={idx} className="bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded text-xs flex items-center gap-1 font-bold animate-fadeIn shadow-sm">
                                    {wd} <button type="button" onClick={() => removeInclude(idx)} className="hover:text-red-500"><X size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-red-600 mb-2 uppercase"><ShieldAlert size={14}/> Must Exclude (বাদ দিতে হবে)</label>
                        <input placeholder="শব্দ লিখুন এবং Enter চাপুন..." className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-white text-sm outline-none focus:border-red-500 shadow-sm" value={mustExcludeInput} onChange={e => setMustExcludeInput(e.target.value)} onKeyDown={handleAddExclude} />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {mustExclude.map((wd, idx) => (
                                <span key={idx} className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-xs flex items-center gap-1 font-bold animate-fadeIn shadow-sm">
                                    {wd} <button type="button" onClick={() => removeExclude(idx)} className="hover:text-red-900"><X size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <button type="submit" className={`w-full text-white py-3 rounded-lg font-bold shadow-lg hover:opacity-90 transition transform active:scale-95 ${activeTab === 'monitor' ? 'bg-teal-600' : (activeTab === 'report' ? 'bg-blue-600' : 'bg-purple-600')}`}>রুল তৈরি করুন</button>
            </form>
        </div>

        {/* Right Column: List */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-[650px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold dark:text-white">অ্যাক্টিভ রুলস লিস্ট</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${activeTab === 'monitor' ? 'bg-teal-100 text-teal-700' : (activeTab === 'report' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}`}>Total: {filteredKeywords.reduce((acc, k) => acc + (k.rules?.length || 0), 0)}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {filteredKeywords.map(k => (
                    <div key={k.id} className="space-y-2">
                        {k.rules && k.rules.length > 0 && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-0 overflow-hidden shadow-sm">
                                <div className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center ${activeTab === 'monitor' ? 'bg-teal-50 dark:bg-teal-900/20' : (activeTab === 'report' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20')}`}>
                                    <h4 className="font-bold text-gray-700 dark:text-gray-200 text-sm">{k.keyword}</h4>
                                    <span className="text-[10px] text-gray-500 font-mono">{k.rules.length} rules</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-800 space-y-2">
                                    {k.rules.map((rule, idx) => (
                                        <div key={rule.id} className={`relative group flex justify-between items-start p-3 rounded-lg border transition-all ${rule.is_active ? 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 shadow-sm' : 'bg-gray-100 dark:bg-gray-900 border-transparent opacity-60'}`}>
                                            <div className="text-xs space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 rounded text-[10px] font-bold">#{idx + 1}</span>
                                                    <span className={`text-[10px] font-bold ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`}>{rule.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                                                </div>
                                                {rule.must_include.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 items-center">
                                                        <span className="font-bold text-green-600 text-[10px] uppercase w-12">Include:</span>
                                                        {rule.must_include.map((t, i) => <span key={i} className="bg-green-50 text-green-700 px-1.5 rounded border border-green-100">{t}</span>)}
                                                    </div>
                                                )}
                                                {rule.must_exclude.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 items-center">
                                                        <span className="font-bold text-red-600 text-[10px] uppercase w-12">Exclude:</span>
                                                        {rule.must_exclude.map((t, i) => <span key={i} className="bg-red-50 text-red-700 px-1.5 rounded border border-red-100">{t}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 ml-2">
                                                <button onClick={() => handleToggleRule(rule.id, !rule.is_active)} className={`${rule.is_active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}>
                                                    {rule.is_active ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                                </button>
                                                <button onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {filteredKeywords.every(k => !k.rules || k.rules.length === 0) && (
                    <div className="text-center py-20 text-gray-400">এই বিভাগে কোনো রুলস নেই</div>
                )}
            </div>
        </div>
    </div>
  );
};

export default RulesManager;
