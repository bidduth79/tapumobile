
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Edit, Trash2, User as UserIcon, Shield, Lock, Settings, MessageCircle, Send, X, Mail } from 'lucide-react';
import { User, Role } from '../../types';

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    triggerUndo: (id: string | number, label: string) => void;
}

const UserManager: React.FC<Props> = ({ showToast, triggerUndo }) => {
  const { users, addUser, updateUser, deleteUser, sendMessage } = useApp();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<{username: string, password: string, name: string, role: Role}>({ username: '', password: '', name: '', role: 'user' });
  
  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [msgTargetUser, setMsgTargetUser] = useState<User | null>(null);
  const [msgText, setMsgText] = useState('');

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.name.trim()) { showToast("নাম এবং ইউজারনেম আবশ্যক", 'error'); return; }
    if (editingUserId) {
        const d: Partial<User> = { name: userForm.name, username: userForm.username, role: userForm.role };
        if (userForm.password) d.password = userForm.password;
        updateUser(editingUserId, d);
        showToast("ইউজার আপডেট হয়েছে", 'success');
        setEditingUserId(null);
    } else {
        if (!userForm.password) { showToast('নতুন ইউজারের জন্য পাসওয়ার্ড আবশ্যক', 'error'); return; }
        addUser({ id: '', name: userForm.name, username: userForm.username, password: userForm.password, role: userForm.role });
        showToast("নতুন ইউজার তৈরি হয়েছে", 'success');
    }
    setUserForm({ username: '', password: '', name: '', role: 'user' });
  };

  const handleDelete = async (user: User) => {
      const result = await window.Swal.fire({
          title: 'আপনি কি নিশ্চিত?',
          text: "ইউজারটি মুছে ফেলার পর আর ফিরিয়ে আনা যাবে না!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'হ্যাঁ, মুছে ফেলুন',
          cancelButtonText: 'বাতিল'
      });

      if (result.isConfirmed) {
          deleteUser(user.id);
          triggerUndo(user.id, user.name);
      }
  };

  const startEditUser = (user: User) => { setEditingUserId(user.id); setUserForm({ name: user.name, username: user.username, role: user.role, password: '' }); };

  const openMessageModal = (user: User) => {
      setMsgTargetUser(user);
      setMsgText('');
      setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
      if (!msgTargetUser || !msgText.trim()) return;
      await sendMessage(msgTargetUser.id, msgText);
      showToast('মেসেজ পাঠানো হয়েছে!', 'success');
      setShowMessageModal(false);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn relative">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
            <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2"><UserIcon size={20}/> {editingUserId ? 'ইউজার আপডেট' : 'নতুন ইউজার'}</h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
                <input required placeholder="পুরো নাম" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                <input required placeholder="ইউজারনেম" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                <input type="password" placeholder={editingUserId ? "পাসওয়ার্ড (পরিবর্তন না করলে খালি রাখুন)" : "পাসওয়ার্ড"} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                <div className="relative">
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white outline-none appearance-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as Role})}><option value="user">User</option><option value="admin">Admin</option></select>
                    <Shield size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"/>
                </div>
                <div className="flex gap-2">
                    {editingUserId && <button type="button" onClick={() => { setEditingUserId(null); setUserForm({ username: '', password: '', name: '', role: 'user' }); }} className="flex-1 bg-gray-500 text-white py-3 rounded-lg">বাতিল</button>}
                    <button type="submit" className={`flex-1 text-white py-3 rounded-lg font-bold shadow-lg ${editingUserId ? 'bg-amber-600' : 'bg-blue-600'}`}>{editingUserId ? 'আপডেট করুন' : 'তৈরি করুন'}</button>
                </div>
            </form>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><UserIcon size={24} className="text-blue-500"/> ইউজার লিস্ট ({users.length})</h3>
            
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-12 gap-2 bg-gray-100 dark:bg-gray-700 p-3 border-b border-gray-200 dark:border-gray-600 font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    <div className="col-span-4 flex items-center gap-2"><UserIcon size={14}/> নাম ও ইউজারনেম</div>
                    <div className="col-span-3 flex items-center gap-2"><Shield size={14}/> রোল (Role)</div>
                    <div className="col-span-5 text-right flex justify-end items-center gap-2"><Settings size={14}/> অ্যাকশন & মেসেজ</div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map((u, idx) => (
                        <div key={u.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold dark:text-white text-sm">{u.name}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Lock size={10}/> @{u.username}</p>
                                </div>
                            </div>
                            
                            <div className="col-span-3">
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {u.role}
                                </span>
                            </div>
                            
                            <div className="col-span-5 flex justify-end gap-2">
                                <button onClick={() => openMessageModal(u)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 shadow-sm" title="মেসেজ পাঠান">
                                    <Mail size={12}/> Message
                                </button>
                                <button onClick={() => startEditUser(u)} className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition border border-amber-100" title="এডিট"><Edit size={14}/></button>
                                {u.username !== 'admin' && (
                                    <button onClick={() => handleDelete(u)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition border border-red-100" title="ডিলিট"><Trash2 size={14}/></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Message Modal */}
        {showMessageModal && msgTargetUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 animate-slideUp">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                            <MessageCircle className="text-blue-500"/> মেসেজ পাঠান: {msgTargetUser.name}
                        </h3>
                        <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
                    </div>
                    <textarea 
                        className="w-full h-32 p-3 rounded-lg border dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
                        placeholder="আপনার বার্তা লিখুন..."
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowMessageModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">বাতিল</button>
                        <button onClick={handleSendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                            <Send size={16}/> পাঠান
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserManager;
