
export const toBanglaDigit = (num: number) => num.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

export const formatTime24 = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const getHourLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown';
    const h = d.getHours();
    const start = toBanglaDigit(h);
    return `${start}:০০ - ${start}:৫৯`;
};

export const translateSource = (source: string) => {
    const s = source.trim();
    const map: Record<string, string> = {
        'Prothom Alo': 'প্রথম আলো',
        'The Daily Star': 'দ্য ডেইলি স্টার',
        'Daily Star': 'ডেইলি স্টার',
        'Bdnews24': 'বিডিনিউজ২৪',
        'bdnews24.com': 'বিডিনিউজ২৪',
        'Dhaka Tribune': 'ঢাকা ট্রিবিউন',
        'Jugantor': 'যুগান্তর',
        'Daily Jugantor': 'যুগান্তর',
        'Kaler Kantho': 'কালের কণ্ঠ',
        'Samakal': 'সমকাল',
        'The Daily Ittefaq': 'ইত্তেফাক',
        'Ittefaq': 'ইত্তেফাক',
        'Manab Zamin': 'মানবজমিন',
        'Naya Diganta': 'নয়া দিগন্ত',
        'Daily Naya Diganta': 'নয়া দিগন্ত',
        'Bangladesh Pratidin': 'বাংলাদেশ প্রতিদিন',
        'Inqilab': 'ইনকিলাব',
        'Daily Inqilab': 'ইনকিলাব',
        'Jaijaidin': 'যায়যায়দিন',
        'Bhorer Kagoj': 'ভোরের কাগজ',
        'Amader Shomoy': 'আমাদের সময়',
        'Bonik Barta': 'বণিক বার্তা',
        'Desh Rupantor': 'দেশ রূপান্তর',
        'Kalbela': 'কালবেলা',
        'Bangla Tribune': 'বাংলা ট্রিবিউন',
        'Jagonews24': 'জাগোনিউজ২৪',
        'Jago News 24': 'জাগোনিউজ২৪',
        'Dhaka Post': 'ঢাকা পোস্ট',
        'Risingbd': 'রাইজিংবিডি',
        'Somoy TV': 'সময় টিভি',
        'Somoy News': 'সময় নিউজ',
        'Jamuna TV': 'যমুনা টিভি',
        'Jamuna Television': 'যমুনা টিভি',
        'Ekattor TV': 'একাত্তর টিভি',
        'Independent TV': 'ইন্ডিপেন্ডেন্ট টিভি',
        'Channel i': 'চ্যানেল আই',
        'Channel 24': 'চ্যানেল ২৪',
        'DBC News': 'ডিবিসি নিউজ',
        'News24': 'নিউজ২৪',
        'RTV': 'আরটিভি',
        'NTV': 'এনটিভি',
        'BBC News Bangla': 'বিবিসি বাংলা',
        'BBC Bangla': 'বিবিসি বাংলা',
        'DW': 'ডয়চে ভেলে',
        'Deutsche Welle': 'ডয়চে ভেলে',
        'Voice of America': 'ভয়েস অফ আমেরিকা',
        'Al Jazeera': 'আল জাজিরা',
        'Anandabazar Patrika': 'আনন্দবাজার',
        'Anandabazar': 'আনন্দবাজার',
        'Sangbad Pratidin': 'সংবাদ প্রতিদিন',
        'Bartaman': 'বর্তমান',
        'Aajkaal': 'আজকাল',
        'Zee 24 Ghanta': 'জি ২৪ ঘণ্টা',
        'ABP Ananda': 'এবিপি আনন্দ',
        'Republic Bangla': 'রিপাবলিক বাংলা',
        'The Hindu': 'দ্য হিন্দু',
        'Times of India': 'টাইমস অফ ইন্ডিয়া',
        'NDTV': 'এনডিটিভি',
        'Dawn': 'ডন (পাকিস্তান)',
        'Geo News': 'জিও নিউজ',
        'The Irrawaddy': 'ইরাবতী',
        'Myanmar Now': 'মায়ানমার নাও',
        'Mizzima': 'মিজিমা',
        'Facebook': 'ফেসবুক',
        'YouTube': 'ইউটিউব',
        'Twitter': 'টুইটার (X)'
    };
    
    // Direct match
    if (map[s]) return map[s];
    
    // Partial match checks
    if (s.toLowerCase().includes('prothom alo')) return 'প্রথম আলো';
    if (s.toLowerCase().includes('jugantor')) return 'যুগান্তর';
    if (s.toLowerCase().includes('somoy')) return 'সময় টিভি';
    if (s.toLowerCase().includes('jamuna')) return 'যমুনা টিভি';
    
    return s;
};
