
import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils';
import { Phone, Search, MapPin, Briefcase, Copy, Mail, Building, RefreshCw, CheckCircle, Database, Shield, Zap, Flame, Anchor, Scale, Map, Gavel } from 'lucide-react';
import { PhoneContact } from '../types';

const Phonebook: React.FC = () => {
  // Initialize from cache if available
  const [contacts, setContacts] = useState<PhoneContact[]>(() => {
      try {
          const cached = localStorage.getItem('cache_phonebook');
          return cached ? JSON.parse(cached) : [];
      } catch { return []; }
  });
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Updated Categories List
  const categories = [
      'Emergency', 
      'Defense', 
      'Border Guard', 
      'Police', 
      'RAB', 
      'Ansar & VDP', 
      'Coast Guard', 
      'Fire Service', 
      'Administration', 
      'Judiciary',
      'Land',
      'Health'
  ];

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const url = new URL(`${getApiBaseUrl()}/phonebook.php`);
      // Only append search params if they exist, otherwise fetch all for cache
      if (search) url.searchParams.append('q', search);
      if (category) url.searchParams.append('cat', category);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
        // Only cache if fetching ALL contacts (no filters)
        if (!search && !category) {
            localStorage.setItem('cache_phonebook', JSON.stringify(data.data));
        }
      }
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial Fetch (Update Cache)
    if (!search && !category) {
        fetchContacts();
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Debounce search/filter
    const timer = setTimeout(() => {
        if (search || category) {
            fetchContacts();
        } else {
            // Restore from cache if filters cleared
            const cached = localStorage.getItem('cache_phonebook');
            if (cached) setContacts(JSON.parse(cached));
            else fetchContacts();
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleCopy = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to get color/icon based on category
  const getCategoryStyle = (cat: string) => {
      switch(cat) {
          case 'Emergency': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: Zap };
          case 'Defense': return { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: Shield };
          case 'Border Guard': return { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: Shield };
          case 'Police': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Shield };
          case 'RAB': return { color: 'text-black', bg: 'bg-gray-100', border: 'border-gray-300', icon: Shield };
          case 'Fire Service': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Flame };
          case 'Coast Guard': return { color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: Anchor };
          case 'Judiciary': return { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: Scale };
          case 'Land': return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Map };
          case 'Health': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: ActivityIcon };
          case 'Administration': return { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Building };
          default: return { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', icon: Building };
      }
  };

  // Activity Icon Component Wrapper for compatibility
  const ActivityIcon = (props: any) => <RefreshCw {...props} className="rotate-0"/>; 

  return (
    <div className="p-4 md:p-6 pb-20 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 glass-panel p-6 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border border-teal-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
             <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-full text-teal-600 dark:text-teal-400 animate-pulse">
                <Phone size={28} />
             </div>
             <div>
                <h2 className="text-2xl font-bold dark:text-white">সরকারি জরুরি ফোনবুক</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">বাংলাদেশের ৬৪ জেলার সকল গুরুত্বপূর্ণ নম্বর</p>
             </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 mb-6 rounded-xl flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
          <div className="relative flex-1 w-full">
              <input 
                type="text" 
                placeholder="নাম, পদবী বা জেলা দিয়ে খুঁজুন (যেমন: ডিসি ঢাকা, ওসি ধানমন্ডি)..." 
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
          
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
              <button 
                onClick={() => setCategory('')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${category === '' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
              >
                  সব দেখুন
              </button>
              {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${category === cat ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                  >
                      {cat}
                  </button>
              ))}
          </div>
      </div>

      {/* Content Grid */}
      {loading && contacts.length === 0 ? (
          <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      ) : contacts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <Database size={48} className="mx-auto mb-3 opacity-20"/>
              <p className="text-lg font-bold">কোনো নম্বর পাওয়া যায়নি</p>
              <p className="text-sm mt-1">অন্য কিওয়ার্ড দিয়ে চেষ্টা করুন</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact) => {
                  const style = getCategoryStyle(contact.category);
                  const Icon = style.icon;
                  return (
                      <div key={contact.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all group relative overflow-hidden">
                          {/* Decorative BG Icon */}
                          <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform rotate-12 scale-150`}>
                              <Icon size={100} className={style.color.replace('text-', 'text-')}/>
                          </div>

                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${style.color} ${style.border} ${style.bg}`}>
                                      {contact.category}
                                  </span>
                                  {contact.district && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1 font-semibold">
                                          <MapPin size={12}/> {contact.district}
                                      </span>
                                  )}
                              </div>

                              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 leading-tight">{contact.name_bn}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">{contact.name_en}</p>

                              <div className="space-y-3">
                                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600 transition-colors hover:border-gray-300 dark:hover:border-gray-500">
                                      <div className={`bg-white dark:bg-gray-600 p-2 rounded-full shadow-sm ${style.color}`}>
                                          <Phone size={18} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xs text-gray-400 uppercase font-bold">ফোন নম্বর</p>
                                          <a href={`tel:${contact.phone}`} className="text-lg font-mono font-bold text-gray-800 dark:text-white hover:text-teal-600 truncate block">
                                              {contact.phone}
                                          </a>
                                      </div>
                                      <button 
                                        onClick={() => handleCopy(contact.phone, contact.id)}
                                        className="p-2 text-gray-400 hover:text-teal-600 transition bg-white dark:bg-gray-600 rounded-lg shadow-sm"
                                        title="কপি করুন"
                                      >
                                          {copiedId === contact.id ? <CheckCircle size={18} className="text-green-500"/> : <Copy size={18}/>}
                                      </button>
                                  </div>

                                  {(contact.designation || contact.email) && (
                                      <div className="text-xs text-gray-500 space-y-1 pl-1">
                                          {contact.designation && (
                                              <div className="flex items-center gap-2">
                                                  <Briefcase size={12} className="text-gray-400"/> {contact.designation}
                                              </div>
                                          )}
                                          {contact.email && (
                                              <div className="flex items-center gap-2 truncate">
                                                  <Mail size={12} className="text-gray-400"/> {contact.email}
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};

export default Phonebook;
