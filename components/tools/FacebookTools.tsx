
import React, { useState } from 'react';
import { Facebook } from 'lucide-react';

const FacebookTools: React.FC = () => {
  const [fbKeyword, setFbKeyword] = useState('');
  const [fbUrlToClean, setFbUrlToClean] = useState('');
  const [cleanedFbUrl, setCleanedFbUrl] = useState('');

  const executeFbSearch = (type: string) => {
      if (!fbKeyword) return;
      const q = encodeURIComponent(fbKeyword);
      let url = '';
      if (type === 'posts') url = `https://www.facebook.com/search/posts?q=${q}&filters=eyJycF9jcmVhdGlvbl90aW1lIjoie1cibmFtZSI6InJlY2VudCIsImFyZ3MiOiIifSJ9`;
      else if (type === 'people') url = `https://www.facebook.com/search/people?q=${q}`;
      else if (type === 'photos') url = `https://www.facebook.com/search/photos?q=${q}`;
      else if (type === 'videos') url = `https://www.facebook.com/search/videos?q=${q}`;
      else if (type === 'pages') url = `https://www.facebook.com/search/pages?q=${q}`;
      else if (type === 'groups') url = `https://www.facebook.com/search/groups?q=${q}`;
      
      window.open(url, '_blank');
  };

  const cleanFbLink = () => {
      if (!fbUrlToClean) return;
      try {
          const urlObj = new URL(fbUrlToClean);
          urlObj.searchParams.delete('fbclid');
          urlObj.searchParams.delete('__cft__');
          urlObj.searchParams.delete('__tn__');
          setCleanedFbUrl(urlObj.toString());
      } catch (e) {
          setCleanedFbUrl('Invalid URL');
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slideUp">
        <div className="text-center mb-6">
            <Facebook className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold dark:text-white">ফেসবুক অ্যাডভান্সড সার্চ</h3>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold mb-2 dark:text-white">কিওয়ার্ড সার্চ (লগিন থাকা অবস্থায়)</h4>
            <input className="w-full p-3 mb-2 rounded border dark:bg-gray-700 dark:text-white" placeholder="কিওয়ার্ড লিখুন..." value={fbKeyword} onChange={e => setFbKeyword(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => executeFbSearch('posts')} className="bg-blue-600 text-white py-2 rounded text-xs hover:bg-blue-700">Posts (Recent)</button>
                <button onClick={() => executeFbSearch('people')} className="bg-blue-600 text-white py-2 rounded text-xs hover:bg-blue-700">People</button>
                <button onClick={() => executeFbSearch('photos')} className="bg-blue-600 text-white py-2 rounded text-xs hover:bg-blue-700">Photos</button>
                <button onClick={() => executeFbSearch('videos')} className="bg-blue-600 text-white py-2 rounded text-xs hover:bg-blue-700">Videos</button>
                <button onClick={() => executeFbSearch('pages')} className="bg-blue-600 text-white py-2 rounded text-xs hover:bg-blue-700">Pages</button>
                <button onClick={() => executeFbSearch('groups')} className="bg-blue-600 text-white py-2 rounded text-xs hover:bg-blue-700">Groups</button>
            </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold mb-2 dark:text-white">লিংক ক্লিনার (Tracking Remove)</h4>
            <div className="flex gap-2">
                <input className="flex-1 p-2 rounded border dark:bg-gray-700 dark:text-white text-xs" placeholder="বড় ফেসবুক লিংক পেস্ট করুন..." value={fbUrlToClean} onChange={e => setFbUrlToClean(e.target.value)} />
                <button onClick={cleanFbLink} className="bg-green-600 text-white px-4 rounded text-xs">Clean</button>
            </div>
            {cleanedFbUrl && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 text-xs break-all cursor-pointer hover:bg-green-100" onClick={() => navigator.clipboard.writeText(cleanedFbUrl)}>
                    {cleanedFbUrl}
                </div>
            )}
        </div>
    </div>
  );
};

export default FacebookTools;
