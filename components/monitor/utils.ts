
export const toBanglaDigit = (num: number | string) => {
    return num.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
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

export const guessRegion = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('tt:') || s.includes('tiktok')) return 'TikTok';
    if (s.includes('yt:') || s.includes('youtube')) return 'YouTube';
    if (s.includes('fb:') || s.includes('facebook')) return 'Facebook';
    if (s.includes('twitter') || s.includes('x.com')) return 'Social (X)';
    if (s.includes('reddit')) return 'Social (Reddit)';
    if (s.includes('telegram') || s.includes('t.me')) return 'Telegram';
    if (s.includes('tor') || s.includes('onion')) return 'Dark Web';
    if (s.includes('prothom') || s.includes('jugantor') || s.includes('somoy') || s.includes('dhaka') || s.includes('bd') || s.includes('kalbela') || s.includes('ittefaq') || s.includes('kaler') || s.includes('bangla') || s.includes('jago')) return 'Bangladesh';
    if (s.includes('hindu') || s.includes('times of india') || s.includes('ndtv') || s.includes('anandabazar') || s.includes('delhi') || s.includes('kolkata') || s.includes('indian') || s.includes('business standard') || s.includes('mint')) return 'India';
    if (s.includes('dawn') || s.includes('geo') || s.includes('tribune.com.pk') || s.includes('pakistan') || s.includes('ary') || s.includes('thenews.com.pk') || s.includes('nation.com.pk')) return 'Pakistan';
    if (s.includes('global times') || s.includes('xinhua') || s.includes('scmp') || s.includes('china') || s.includes('cgtn') || s.includes('people\'s daily')) return 'China';
    if (s.includes('irrawaddy') || s.includes('mizzima') || s.includes('myanmar') || s.includes('eleven') || s.includes('gnlm')) return 'Myanmar';
    if (s.includes('bbc') || s.includes('cnn') || s.includes('reuters') || s.includes('al jazeera') || s.includes('guardian') || s.includes('fp') || s.includes('ap news')) return 'International';
    return 'International/Others';
};

// Smart Similarity Logic (Levenshtein + Token Overlap)
export const calculateSimilarity = (str1: string, str2: string) => {
    const s1 = str1.toLowerCase().replace(/[^\w\s\u0980-\u09FF]/g, '');
    const s2 = str2.toLowerCase().replace(/[^\w\s\u0980-\u09FF]/g, '');

    // 1. Token Jaccard Index
    const tokenize = (s: string) => new Set(s.split(/\s+/).filter(w => w.length > 2));
    const set1 = tokenize(s1);
    const set2 = tokenize(s2);
    
    if (set1.size === 0 || set2.size === 0) return 0;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    const jaccard = intersection.size / union.size;

    // 2. If Jaccard is high, return it
    if (jaccard > 0.3) return jaccard;

    // 3. Fallback: Check if one contains the other (for breaking news updates)
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    return jaccard;
};

// AI Sentiment Analysis (Keyword Based)
export const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const t = text.toLowerCase();
    
    const negativeWords = [
        'মৃত্যু', 'নিহত', 'আহত', 'দুর্ঘটনা', 'আগুন', 'খুন', 'ধর্ষণ', 'গ্রেপ্তার', 'আটক', 'মামলা', 'সংঘর্ষ', 'হামলা', 
        'death', 'killed', 'injured', 'accident', 'fire', 'murder', 'rape', 'arrest', 'clash', 'attack', 'dead', 'disaster'
    ];
    
    const positiveWords = [
        'উন্নয়ন', 'উদ্বোধন', 'জয়', 'স্বর্ণ', 'পুরস্কার', 'সাফল্য', 'মুক্তি', 'শান্তি', 'চুক্তি', 'বৃদ্ধি', 'লাভ',
        'development', 'inauguration', 'win', 'gold', 'award', 'success', 'peace', 'agreement', 'growth', 'profit'
    ];

    let score = 0;
    
    negativeWords.forEach(w => { if (t.includes(w)) score--; });
    positiveWords.forEach(w => { if (t.includes(w)) score++; });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
};
