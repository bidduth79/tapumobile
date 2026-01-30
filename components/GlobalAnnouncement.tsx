
import React from 'react';
import { useApp } from '../store';
import { Megaphone, AlertCircle, Info, X } from 'lucide-react';

const GlobalAnnouncement: React.FC = () => {
  const { settings } = useApp();
  const [visible, setVisible] = React.useState(true);

  if (!settings.noticeActive || !settings.siteNotice || !visible) return null;

  const getStyle = () => {
      switch(settings.noticeType) {
          case 'alert': return 'bg-red-600 text-white';
          case 'warning': return 'bg-orange-500 text-white';
          default: return 'bg-blue-600 text-white';
      }
  };

  const getIcon = () => {
      switch(settings.noticeType) {
          case 'alert': return <AlertCircle size={18} className="animate-pulse"/>;
          case 'warning': return <Megaphone size={18}/>;
          default: return <Info size={18}/>;
      }
  };

  return (
    <div className={`${getStyle()} px-4 py-2 shadow-md relative z-[60] flex items-center justify-between`}>
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-bold">
            {getIcon()}
            <div className="overflow-hidden whitespace-nowrap">
                <span className="animate-marquee inline-block">
                    {settings.siteNotice}
                </span>
            </div>
        </div>
        <button onClick={() => setVisible(false)} className="absolute right-4 p-1 hover:bg-white/20 rounded-full transition">
            <X size={16}/>
        </button>
        <style>{`
            .animate-marquee {
                display: inline-block;
                padding-left: 100%;
                animation: marquee 15s linear infinite;
            }
            @keyframes marquee {
                0% { transform: translate(0, 0); }
                100% { transform: translate(-100%, 0); }
            }
        `}</style>
    </div>
  );
};

export default GlobalAnnouncement;
