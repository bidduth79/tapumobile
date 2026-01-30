
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Edit, Trash2, Plus, ChevronRight, ChevronDown, CornerDownRight, FolderTree, X } from 'lucide-react';
import { MenuItem } from '../../types';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const MenuManager: React.FC<Props> = ({ showToast }) => {
  const { menuStructure, addMenu, updateMenu, deleteMenu } = useApp();
  const [menuForm, setMenuForm] = useState({ id: '', label: '', parentId: '' });
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  
  // State for collapsible items
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
      const newSet = new Set(expandedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setExpandedIds(newSet);
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingMenuId) { 
          if (menuForm.label) { 
              updateMenu(editingMenuId, menuForm.label, menuForm.parentId); 
              showToast('মেনু আপডেট হয়েছে', 'success');
              resetForm();
          } else {
              showToast('লেবেল আবশ্যক', 'error');
          }
      } 
      else { 
          if (menuForm.id && menuForm.label) { 
              addMenu(menuForm.id, menuForm.label, menuForm.parentId); 
              showToast('মেনু যোগ হয়েছে', 'success');
              resetForm();
          } else {
              showToast('আইডি এবং লেবেল আবশ্যক', 'error');
          }
      }
  };

  const handleDelete = async (id: string, label: string) => {
      // Secure Delete Prompt using SweetAlert
      const { value: typedText } = await window.Swal.fire({
          title: 'নিশ্চিত করুন',
          html: `আপনি কি <b>${label}</b> মেনুটি ডিলিট করতে চান?<br/><span style="font-size:12px;color:red">নিশ্চিত করতে নিচে <b>Delete</b> শব্দটি লিখুন:</span>`,
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
          deleteMenu(id);
          showToast('মেনু সফলভাবে ডিলিট করা হয়েছে', 'warning');
      }
  };

  const startEditMenu = (menu: MenuItem, parentId: string = '') => { 
      setEditingMenuId(menu.id); 
      setMenuForm({ id: menu.id, label: menu.label, parentId: parentId }); 
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAddSubMenu = (parentId: string) => {
      setEditingMenuId(null);
      setMenuForm({ id: '', label: '', parentId: parentId });
      // Auto expand the parent to see result later
      const newSet = new Set(expandedIds);
      newSet.add(parentId);
      setExpandedIds(newSet);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { 
      setEditingMenuId(null); 
      setMenuForm({ id: '', label: '', parentId: '' }); 
  };

  // Recursive rendering of menu tree
  const renderMenuTree = (items: MenuItem[], depth: number = 0, parentId: string = '') => {
      return items.map(item => {
          const hasChildren = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedIds.has(item.id);
          
          return (
              <div key={item.id} className="select-none">
                  <div 
                      className={`
                        flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                        ${depth === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/20'}
                      `}
                      style={{ paddingLeft: `${depth * 20 + 12}px` }}
                  >
                      <div className="flex items-center gap-3 flex-1">
                          {hasChildren ? (
                              <button onClick={() => toggleExpand(item.id)} className="text-gray-500 hover:text-blue-600 transition">
                                  {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                              </button>
                          ) : (
                              <div className="w-[18px]">
                                  {depth > 0 && <CornerDownRight size={14} className="text-gray-300 ml-1"/>}
                              </div>
                          )}
                          
                          <div className="flex flex-col">
                              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.label}</span>
                              <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                          </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 md:opacity-60 md:hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startAddSubMenu(item.id)} 
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded tooltip-btn"
                            title="সাব-মেনু যোগ করুন"
                          >
                              <Plus size={16}/>
                          </button>
                          <button 
                            onClick={() => startEditMenu(item, parentId)} 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="এডিট করুন"
                          >
                              <Edit size={16}/>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id, item.label)} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="ডিলিট করুন"
                          >
                              <Trash2 size={16}/>
                          </button>
                      </div>
                  </div>
                  
                  {/* Recursively render children if expanded */}
                  {hasChildren && isExpanded && (
                      <div className="animate-slideUp">
                          {renderMenuTree(item.subItems!, depth + 1, item.id)}
                      </div>
                  )}
              </div>
          );
      });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn">
        {/* Form Section */}
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 sticky top-20">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600"><FolderTree size={24}/></div>
                    <div>
                        <h3 className="font-bold dark:text-white text-lg">{editingMenuId ? 'মেনু এডিট' : 'নতুন মেনু'}</h3>
                        <p className="text-xs text-gray-500">
                            {menuForm.parentId ? `প্যারেন্ট: ${menuForm.parentId}` : 'রুট (Root) মেনু তৈরি হচ্ছে'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleMenuSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">মেনু ID (Unique English)</label>
                        <input 
                            placeholder="ex: sports, bangla..." 
                            required 
                            disabled={!!editingMenuId} 
                            className={`w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 ${editingMenuId ? 'opacity-60 cursor-not-allowed' : ''}`} 
                            value={menuForm.id} 
                            onChange={e => setMenuForm({...menuForm, id: e.target.value.replace(/\s+/g, '_').toLowerCase()})} 
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">লেবেল (Bangla)</label>
                        <input 
                            placeholder="মেনুর নাম..." 
                            required 
                            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" 
                            value={menuForm.label} 
                            onChange={e => setMenuForm({...menuForm, label: e.target.value})} 
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">প্যারেন্ট ID (Optional)</label>
                        <div className="flex gap-2">
                            <input 
                                placeholder="ফাঁকা থাকলে মেইন মেনু হবে" 
                                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" 
                                value={menuForm.parentId} 
                                onChange={e => setMenuForm({...menuForm, parentId: e.target.value})} 
                            />
                            {menuForm.parentId && (
                                <button 
                                    type="button" 
                                    onClick={() => setMenuForm({...menuForm, parentId: ''})}
                                    className="p-3 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-lg transition"
                                    title="Clear Parent"
                                >
                                    <X size={18}/>
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                            * ডানপাশের তালিকা থেকে (+) আইকনে ক্লিক করে প্যারেন্ট সিলেক্ট করতে পারেন।
                        </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingMenuId && (
                            <button 
                                type="button" 
                                onClick={resetForm} 
                                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition"
                            >
                                বাতিল
                            </button>
                        )}
                        <button 
                            type="submit" 
                            className={`flex-1 text-white py-3 rounded-lg font-bold shadow-lg transition transform active:scale-95 ${editingMenuId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {editingMenuId ? 'আপডেট করুন' : 'সেভ করুন'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[650px]">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold dark:text-white">মেনু স্ট্রাকচার</h3>
                    <button 
                        onClick={() => startAddSubMenu('')} 
                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 transition flex items-center gap-1"
                    >
                        <Plus size={14}/> নতুন রুট মেনু
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {menuStructure.length > 0 ? (
                        <div className="pb-10">
                            {renderMenuTree(menuStructure)}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            কোনো মেনু পাওয়া যায়নি
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default MenuManager;
