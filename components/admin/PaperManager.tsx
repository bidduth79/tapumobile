
import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { Plus, Trash2, Edit, Upload, Search, Filter, Save, AlertCircle, X, Globe, Folder, Layers, FileText, Image as ImageIcon } from 'lucide-react';
import { LinkItem } from '../../types';
import { getFavicon, getApiBaseUrl } from '../../utils';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    triggerUndo: (id: string | number, label: string) => void;
}

const PaperManager: React.FC<Props> = ({ showToast, triggerUndo }) => {
  const { links, addLink, addLinks, updateLink, deleteLink, menuStructure } = useApp();
  // ... (Keep existing state and handlers) ...
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('single');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState({ title: '', url: '', category: 'newspaper', subCategory: 'bangla', childCategory: 'national' });
  const [customLogo, setCustomLogo] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [paperSearch, setPaperSearch] = useState('');
  const [suggestions, setSuggestions] = useState<LinkItem[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const [filterChild, setFilterChild] = useState('');

  const getSubItems = (catId: string) => menuStructure.find(m => m.id === catId)?.subItems || [];
  const getChildItems = (catId: string, subId: string) => {
    const sub = menuStructure.find(m => m.id === catId)?.subItems?.find(s => s.id === subId);
    return sub?.subItems || [];
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      
      const formData = new FormData();
      formData.append('logo', file);
      
      try {
          const res = await fetch(`${getApiBaseUrl()}/upload_logo.php`, { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setCustomLogo(data.url);
              showToast('লগো আপলোড সফল হয়েছে', 'success');
          } else {
              showToast('আপলোড ব্যর্থ: ' + data.message, 'error');
          }
      } catch(err) { showToast('সার্ভার এরর', 'error'); }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLinkForm({...linkForm, title: val});

      if (val.trim().length > 1) {
          const matches = links.filter(l => l.title.toLowerCase().includes(val.toLowerCase()));
          setSuggestions(matches.slice(0, 5));
      } else {
          setSuggestions([]);
      }
  };

  const selectSuggestion = (link: LinkItem) => {
      startEditPaper(link);
      setSuggestions([]);
      showToast('পেপার টি এডিট মোডে লোড করা হয়েছে', 'info');
  };

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const logoUrl = customLogo || getFavicon(linkForm.url);
    if (editingId) {
      updateLink(editingId, { ...linkForm, logo: logoUrl });
      showToast('পেপার আপডেট হয়েছে!', 'success');
      setEditingId(null);
    } else {
      const exists = links.some(l => l.url === linkForm.url);
      if(exists) {
          const result = await window.Swal.fire({
              title: 'সতর্কতা',
              text: 'এই URL টি ইতিমধ্যে আছে। আপনি কি তবুও যোগ করতে চান?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'হ্যাঁ, যোগ করুন',
              cancelButtonText: 'না'
          });
          if (!result.isConfirmed) return;
      }

      addLink({ ...linkForm, logo: logoUrl });
      showToast('নতুন পেপার যোগ হয়েছে!', 'success');
    }
    setLinkForm({ title: '', url: '', category: 'newspaper', subCategory: 'bangla', childCategory: 'national' });
    setCustomLogo('');
    setSuggestions([]);
  };

  const handleBulkSubmit = () => {
    if (!bulkText.trim()) { showToast("দয়া করে কিছু লিংক লিখুন", 'warning'); return; }
    if (!linkForm.category) { showToast("দয়া করে ক্যাটাগরি সিলেক্ট করুন", 'warning'); return; }
    const lines = bulkText.split('\n').filter(l => l.trim());
    const newItems: any[] = [];
    lines.forEach(line => {
        const parts = line.split('|');
        let title = '', url = '';
        if (parts.length > 1) { title = parts[0].trim(); url = parts[1].trim(); } 
        else {
            url = parts[0].trim();
            try {
                const u = url.startsWith('http') ? url : `https://${url}`;
                const obj = new URL(u);
                title = obj.hostname.replace('www.', '').split('.')[0];
                title = title.charAt(0).toUpperCase() + title.slice(1);
                url = u;
            } catch (e) { return; }
        }
        if (title && url) {
            newItems.push({ title, url, category: linkForm.category, subCategory: linkForm.subCategory, childCategory: linkForm.childCategory, logo: getFavicon(url) });
        }
    });
    if (newItems.length > 0) { 
        addLinks(newItems); 
        showToast(`${newItems.length} টি লিংক যোগ করা হয়েছে!`, 'success'); 
        setBulkText(''); 
    } else { 
        showToast('কোনো ভ্যালিড লিংক পাওয়া যায়নি।', 'error'); 
    }
  };

  const handleDelete = async (id: string) => {
      const linkToDelete = links.find(l => l.id === id);
      if(!linkToDelete) return;

      const { value: typedText } = await window.Swal.fire({
          title: 'নিশ্চিত করুন',
          html: `আপনি কি <b>${linkToDelete.title}</b> মুছে ফেলতে চান?<br/><span style="font-size:12px;color:red">নিশ্চিত করতে নিচে <b>Delete</b> শব্দটি লিখুন:</span>`,
          input: 'text',
          inputPlaceholder: 'Delete',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'মুছে ফেলুন',
          cancelButtonText: 'বাতিল',
          inputValidator: (value: string) => {
              if (value !== 'Delete') {
                  return 'সঠিকভাবে Delete শব্দটি লিখুন!';
              }
          }
      });

      if (typedText === 'Delete') {
          deleteLink(id);
          // Trigger Undo Toast in Parent
          triggerUndo(id, linkToDelete.title);
      }
  };

  const startEditPaper = (link: LinkItem) => {
    setImportMode('single'); 
    setEditingId(link.id); 
    setLinkForm({ title: link.title, url: link.url, category: link.category, subCategory: link.subCategory || '', childCategory: link.childCategory || '' }); 
    setCustomLogo(link.logo);
    setSuggestions([]);
  };

  const filteredLinks = useMemo(() => {
    return links.filter(l => {
        const matchesSearch = l.title.toLowerCase().includes(paperSearch.toLowerCase()) || l.url.includes(paperSearch);
        const matchesCat = filterCat ? l.category === filterCat : true;
        const matchesSub = filterSub ? l.subCategory === filterSub : true;
        const matchesChild = filterChild ? l.childCategory === filterChild : true;
        return matchesSearch && matchesCat && matchesSub && matchesChild;
    });
  }, [links, paperSearch, filterCat, filterSub, filterChild]);

  return (
    // ... (Keep existing JSX layout same as before) ...
    <div className="grid lg:grid-cols-3 gap-6 md:gap-8 animate-fadeIn">
      {/* ... Add/Edit Form ... */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-fit border border-gray-100 dark:border-gray-700 sticky top-20 z-20">
        {/* ... Form Logic Same ... */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
           <button onClick={() => { setImportMode('single'); setEditingId(null); setLinkForm({ title: '', url: '', category: 'newspaper', subCategory: 'bangla', childCategory: 'national' }); setCustomLogo(''); setSuggestions([]); }} className={`flex-1 pb-2 text-sm font-bold transition-all ${importMode === 'single' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>সিংগেল</button>
           <button onClick={() => { setImportMode('bulk'); setEditingId(null); }} className={`flex-1 pb-2 text-sm font-bold transition-all ${importMode === 'bulk' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>বাল্ক ইম্পোর্ট</button>
        </div>
        
        {/* ... Selectors ... */}
        <div className="grid grid-cols-1 gap-3 mb-4 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <label className="text-xs font-bold text-gray-500 uppercase">মেনু লোকেশন সিলেক্ট করুন</label>
            <select className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" value={linkForm.category} onChange={e => setLinkForm({...linkForm, category: e.target.value, subCategory: '', childCategory: ''})}>
                {menuStructure.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {getSubItems(linkForm.category).length > 0 && (
                <select className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" value={linkForm.subCategory} onChange={e => setLinkForm({...linkForm, subCategory: e.target.value, childCategory: ''})}>
                <option value="">সাব-মেনু সিলেক্ট করুন</option>
                {getSubItems(linkForm.category).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
            )}
            {linkForm.subCategory && getChildItems(linkForm.category, linkForm.subCategory).length > 0 && (
                <select className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" value={linkForm.childCategory} onChange={e => setLinkForm({...linkForm, childCategory: e.target.value})}>
                <option value="">চাইল্ড মেনু সিলেক্ট করুন</option>
                {getChildItems(linkForm.category, linkForm.subCategory).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
            )}
        </div>

        {importMode === 'single' ? (
            <form onSubmit={handlePaperSubmit} className="space-y-4 relative">
                <div className="relative">
                    <input required placeholder="শিরোনাম (যেমন: প্রথম আলো)" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={linkForm.title} onChange={handleTitleChange} />
                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl mt-1 z-50 overflow-hidden animate-slideUp">
                            <div className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-[10px] font-bold text-yellow-700 dark:text-yellow-400 flex items-center justify-between border-b dark:border-gray-700">
                                <span>পাওয়া গেছে ({suggestions.length}) - এডিট করতে ক্লিক করুন</span>
                                <button type="button" onClick={() => setSuggestions([])}><X size={12}/></button>
                            </div>
                            {suggestions.map(s => (
                                <div key={s.id} onClick={() => selectSuggestion(s)} className="px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-0 flex items-center gap-2">
                                    <AlertCircle size={12} className="text-blue-500"/>
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{s.title}</span>
                                    <span className="text-xs text-gray-400 ml-auto">এডিট করুন</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <input required placeholder="URL" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white outline-none" value={linkForm.url} onChange={e => setLinkForm({...linkForm, url: e.target.value})} />
                <div className="flex gap-2 items-center"><input placeholder="লগো URL (অথবা আপলোড করুন)" className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:text-white outline-none" value={customLogo} onChange={e => setCustomLogo(e.target.value)} /><label className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-lg cursor-pointer text-gray-600 dark:text-gray-300"><Upload size={18}/><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label></div>
                {customLogo && <img src={customLogo} className="w-16 h-16 object-contain bg-white border rounded mx-auto" alt="Preview"/>}
                <div className="flex gap-2 pt-2">{editingId && <button type="button" onClick={() => { setEditingId(null); setLinkForm({ title: '', url: '', category: 'newspaper', subCategory: 'bangla', childCategory: 'national' }); setCustomLogo(''); setSuggestions([]); }} className="flex-1 bg-gray-500 text-white py-2 rounded-lg">বাতিল</button>}<button type="submit" className={`flex-1 text-white py-2 rounded-lg shadow-lg flex items-center justify-center gap-2 ${editingId ? 'bg-amber-600' : 'bg-primary-600'}`}>{editingId ? 'আপডেট' : <><Save size={16}/> সেভ করুন</>}</button></div>
            </form>
        ) : (
            <div className="space-y-4">
               <textarea rows={8} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white outline-none text-sm font-mono" value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="Title | URL"></textarea>
               <button onClick={handleBulkSubmit} className="w-full bg-indigo-600 text-white py-2 rounded-lg">ইম্পোর্ট করুন</button>
            </div>
        )}
      </div>
      
      {/* ... List View ... */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-[650px]">
        <div className="flex flex-col gap-4 mb-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <FileText size={24} className="text-blue-500"/> পেপার লিষ্ট ({links.length})
                </h3>
                <div className="relative"><input className="pl-8 pr-4 py-2 border rounded-full text-sm dark:bg-gray-700 dark:text-white outline-none w-48 focus:w-64 transition-all" placeholder="খুঁজুন..." value={paperSearch} onChange={e => setPaperSearch(e.target.value)} /><Search className="absolute left-2.5 top-2.5 text-gray-400" size={16}/></div>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                <Filter size={16} className="text-gray-500 ml-2"/>
                <select className="p-1.5 text-xs border rounded bg-white dark:bg-gray-700 dark:text-white outline-none" value={filterCat} onChange={e => {setFilterCat(e.target.value); setFilterSub(''); setFilterChild('');}}><option value="">সকল ক্যাটাগরি</option>{menuStructure.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
                {filterCat && getSubItems(filterCat).length > 0 && (<select className="p-1.5 text-xs border rounded bg-white dark:bg-gray-700 dark:text-white outline-none" value={filterSub} onChange={e => {setFilterSub(e.target.value); setFilterChild('');}}><option value="">সকল সাব-ক্যাটাগরি</option>{getSubItems(filterCat).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>)}
                {filterSub && getChildItems(filterCat, filterSub).length > 0 && (<select className="p-1.5 text-xs border rounded bg-white dark:bg-gray-700 dark:text-white outline-none" value={filterChild} onChange={e => setFilterChild(e.target.value)}><option value="">সকল চাইল্ড</option>{getChildItems(filterCat, filterSub).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>)}
                {(filterCat || filterSub) && (<button onClick={() => {setFilterCat(''); setFilterSub(''); setFilterChild('');}} className="ml-auto text-xs text-red-500 hover:underline">রিসেট</button>)}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-12 gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-t-lg border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10 font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                <div className="col-span-5 flex items-center gap-2"><ImageIcon size={14}/> শিরোনাম ও লগো</div>
                <div className="col-span-3 flex items-center gap-2"><Folder size={14}/> ক্যাটাগরি</div>
                <div className="col-span-3 flex items-center gap-2"><Globe size={14}/> URL</div>
                <div className="col-span-1 text-right flex justify-end items-center gap-1"><Layers size={14}/> অ্যাকশন</div>
            </div>

            <div className="border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg bg-white dark:bg-gray-800">
                {filteredLinks.map((link, idx) => (
                    <div 
                        key={link.id} 
                        className={`grid grid-cols-12 gap-2 p-3 items-center border-b last:border-0 border-gray-100 dark:border-gray-700 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${editingId === link.id ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
                    >
                        <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                            <span className="text-xs text-gray-400 font-mono w-4">{idx + 1}.</span>
                            <div className="w-8 h-8 shrink-0 rounded bg-white border border-gray-200 p-0.5 shadow-sm">
                                <img src={link.logo || getFavicon(link.url)} className="w-full h-full object-contain" alt="" onError={(e) => (e.target as HTMLImageElement).src = 'https://picsum.photos/64/64'} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold dark:text-white truncate text-sm">{link.title}</p>
                            </div>
                        </div>
                        
                        <div className="col-span-3 flex flex-col justify-center">
                            <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded w-fit truncate max-w-full text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-500">{link.category}</span>
                            {(link.subCategory || link.childCategory) && (
                                <span className="text-[10px] text-gray-500 mt-0.5 truncate">
                                    {link.subCategory} {link.childCategory ? `> ${link.childCategory}` : ''}
                                </span>
                            )}
                        </div>

                        <div className="col-span-3">
                            <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block font-mono" title={link.url}>
                                {link.url}
                            </a>
                        </div>

                        <div className="col-span-1 flex justify-end gap-1">
                            <button onClick={() => startEditPaper(link)} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded transition" title="এডিট করুন"><Edit size={14}/></button>
                            <button onClick={() => handleDelete(link.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition" title="ডিলিট করুন"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
                {filteredLinks.length === 0 && (
                    <div className="text-center py-10 text-gray-400">কোনো পেপার পাওয়া যায়নি</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaperManager;
