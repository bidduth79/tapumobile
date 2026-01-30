
import React, { useState } from 'react';
import { ScanFace, Camera, UserSearch, Phone, ExternalLink } from 'lucide-react';

const OsintTools: React.FC = () => {
  const [osintUsername, setOsintUsername] = useState('');
  const [osintPhone, setOsintPhone] = useState('');

  const handleUsernameSearch = () => {
      if(!osintUsername) return;
      const sites = [
          `https://www.facebook.com/${osintUsername}`,
          `https://twitter.com/${osintUsername}`,
          `https://www.instagram.com/${osintUsername}`,
          `https://www.tiktok.com/@${osintUsername}`,
          `https://www.linkedin.com/in/${osintUsername}`,
          `https://www.pinterest.com/${osintUsername}`,
          `https://github.com/${osintUsername}`,
          `https://t.me/${osintUsername}`
      ];
      sites.forEach(url => window.open(url, '_blank'));
  };

  const handlePhoneSearch = () => {
      if(!osintPhone) return;
      window.open(`https://www.truecaller.com/search/bd/${osintPhone}`, '_blank');
      window.open(`https://sync.me/search/?number=88${osintPhone}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slideUp">
        <div className="text-center">
            <ScanFace className="w-12 h-12 text-primary-500 mx-auto mb-2" />
            <h3 className="text-xl font-bold dark:text-white">OSINT & ফেস আইডেন্টিফিকেশন</h3>
            <p className="text-xs text-gray-500">ছবি দিয়ে পরিচয় এবং সোশ্যাল মিডিয়া ট্র্যাকিং</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold flex items-center gap-2 mb-4 dark:text-white text-lg">
                    <Camera size={20} className="text-purple-600"/> ছবি দিয়ে খুঁজুন (Face Search)
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                    নিচের টুলগুলো ব্যবহার করে ছবি আপলোড করলে সেই ব্যক্তির অন্যান্য ছবি, নাম এবং সোশ্যাল প্রোফাইল খুঁজে পাওয়া সম্ভব।
                </p>
                
                <div className="space-y-3">
                    <a href="https://pimeyes.com/en" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-red-500 group">
                        <div>
                            <span className="font-bold text-gray-800 dark:text-white">PimEyes (Paid/Premium)</span>
                            <p className="text-[10px] text-gray-500">সবচেয়ে শক্তিশালী ফেস সার্চ ইঞ্জিন।</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400 group-hover:text-red-500"/>
                    </a>
                    
                    <a href="https://facecheck.id/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-blue-500 group">
                        <div>
                            <span className="font-bold text-gray-800 dark:text-white">FaceCheck.ID</span>
                            <p className="text-[10px] text-gray-500">সোশ্যাল মিডিয়া প্রোফাইল এবং অপরাধী খোঁজার জন্য।</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500"/>
                    </a>

                    <a href="https://yandex.com/images/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-yellow-500 group">
                        <div>
                            <span className="font-bold text-gray-800 dark:text-white">Yandex Images (Free)</span>
                            <p className="text-[10px] text-gray-500">রাশিয়ান ইঞ্জিন, ফেসবুকের ছবি খোঁজার জন্য গুগলের চেয়ে ভালো।</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400 group-hover:text-yellow-500"/>
                    </a>

                    <a href="https://socialcatfish.com/reverse-image-search/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition border-l-4 border-green-500 group">
                        <div>
                            <span className="font-bold text-gray-800 dark:text-white">Social Catfish (Paid)</span>
                            <p className="text-[10px] text-gray-500">ফেইক প্রোফাইল এবং আসল পরিচয় বের করার জন্য।</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400 group-hover:text-green-500"/>
                    </a>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold flex items-center gap-2 mb-3 dark:text-white">
                        <UserSearch size={18} className="text-blue-600"/> ইউজারনেম ট্র্যাকার
                    </h4>
                    <div className="flex gap-2">
                        <input 
                            value={osintUsername}
                            onChange={e => setOsintUsername(e.target.value)}
                            className="flex-1 p-2 border rounded text-sm dark:bg-gray-700 dark:text-white outline-none"
                            placeholder="username (ex: rakib123)"
                        />
                        <button onClick={handleUsernameSearch} className="bg-blue-600 text-white px-4 rounded text-xs font-bold hover:bg-blue-700">খুঁজুন</button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">এটি একসাথে Facebook, Twitter, Instagram, TikTok, Github ইত্যাদিতে এই ইউজারনেমটি খুঁজবে।</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold flex items-center gap-2 mb-3 dark:text-white">
                        <Phone size={18} className="text-green-600"/> ফোন নম্বর ট্র্যাকার
                    </h4>
                    <div className="flex gap-2">
                        <input 
                            value={osintPhone}
                            onChange={e => setOsintPhone(e.target.value)}
                            className="flex-1 p-2 border rounded text-sm dark:bg-gray-700 dark:text-white outline-none"
                            placeholder="017xxxxxxxx"
                        />
                        <button onClick={handlePhoneSearch} className="bg-green-600 text-white px-4 rounded text-xs font-bold hover:bg-green-700">TrueCaller</button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">সরাসরি TrueCaller এবং Sync.ME ডাটাবেসে সার্চ করবে।</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OsintTools;
