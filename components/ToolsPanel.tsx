
import React from 'react';
import { useApp } from '../store';
import { Type, Image, Video, Download, Palette, StickyNote, QrCode, Timer, AlignLeft, Facebook, ScanFace, Scissors, FileSearch, Cloud, ScanText } from 'lucide-react';

// Import all sub-components
import Downloader from './tools/Downloader';
import MediaEditor from './tools/MediaEditor';
import Converter from './tools/Converter';
import OsintTools from './tools/OsintTools';
import FacebookTools from './tools/FacebookTools';
import Notepad from './tools/Notepad';
import QrGenerator from './tools/QrGenerator';
import TextAnalyzer from './tools/TextAnalyzer';
import Stopwatch from './tools/Stopwatch';
import ColorPicker from './tools/ColorPicker';
import ImageResizer from './tools/ImageResizer';
import BijoyConverter from './tools/BijoyConverter';
import AutoDorker from './tools/AutoDorker';
import WordCloudGenerator from './tools/WordCloudGenerator';
import OcrTool from './tools/OcrTool';

const ToolsPanel: React.FC = () => {
  const { activeToolTab, setActiveToolTab } = useApp();

  const tabs = [
    { id: 'downloader', label: 'ডাউনলোডার', icon: Download },
    { id: 'ocr', label: 'OCR (ইমেজ টু টেক্সট)', icon: ScanText },
    { id: 'cloud', label: 'ওয়ার্ড ক্লাউড', icon: Cloud },
    { id: 'dorker', label: 'অটো ডর্কার', icon: FileSearch },
    { id: 'osint', label: 'OSINT / Face Search', icon: ScanFace },
    { id: 'media_editor', label: 'ভিডিও/অডিও এডিটর', icon: Scissors },
    { id: 'converter', label: 'কনভার্টার', icon: Video },
    { id: 'fb_tools', label: 'FB সার্চ', icon: Facebook },
    { id: 'notepad', label: 'নোটপ্যাড', icon: StickyNote },
    { id: 'qr', label: 'QR কোড', icon: QrCode },
    { id: 'text', label: 'শব্দ গণনা', icon: AlignLeft },
    { id: 'timer', label: 'স্টপওয়াচ', icon: Timer },
    { id: 'color', label: 'কালার', icon: Palette },
    { id: 'image', label: 'ইমেজ', icon: Image },
    { id: 'unicode', label: 'বিজয়/ইউনিকোড', icon: Type },
  ];

  const renderTool = () => {
      switch(activeToolTab) {
          case 'downloader': return <Downloader />;
          case 'ocr': return <OcrTool />;
          case 'cloud': return <WordCloudGenerator />;
          case 'dorker': return <AutoDorker />;
          case 'osint': return <OsintTools />;
          case 'media_editor': return <MediaEditor />;
          case 'converter': return <Converter />;
          case 'fb_tools': return <FacebookTools />;
          case 'notepad': return <Notepad />;
          case 'qr': return <QrGenerator />;
          case 'text': return <TextAnalyzer />;
          case 'timer': return <Stopwatch />;
          case 'color': return <ColorPicker />;
          case 'image': return <ImageResizer />;
          case 'unicode': return <BijoyConverter />;
          default: return <Downloader />;
      }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0 border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveToolTab(tab.id)}
            className={`px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap transition-all duration-300 transform scale-100 active:scale-95 text-sm font-medium ${
              activeToolTab === tab.id 
                ? 'bg-primary-600 text-white shadow-lg ring-2 ring-primary-200 dark:ring-primary-900'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-inner border border-gray-100 dark:border-gray-700 p-6 overflow-auto relative">
          {renderTool()}
      </div>
    </div>
  );
};

export default ToolsPanel;
