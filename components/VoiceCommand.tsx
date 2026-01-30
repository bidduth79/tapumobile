
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Command } from 'lucide-react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';

const VoiceCommand: React.FC = () => {
  const { links, openLink, setSearchQuery, triggerSearchNav } = useApp();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Browser Speech Recognition Type
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US'; // English commands are easier to parse, but it can catch mixed input

      recog.onstart = () => {
        setIsListening(true);
        setFeedback('Listening...');
      };

      recog.onend = () => {
        setIsListening(false);
        setFeedback('');
      };

      recog.onresult = (event: any) => {
        const command = event.results[0][0].transcript;
        setTranscript(command);
        processCommand(command);
      };

      setRecognition(recog);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
        alert("আপনার ব্রাউজার ভয়েস কমান্ড সাপোর্ট করে না। Chrome ব্যবহার করুন।");
        return;
    }
    if (isListening) recognition.stop();
    else recognition.start();
  };

  const processCommand = (cmd: string) => {
      const lowerCmd = cmd.toLowerCase();
      setFeedback(`Recognized: "${cmd}"`);

      // 1. OPEN LINK Logic (e.g. "Open Somoy TV")
      if (lowerCmd.startsWith('open ') || lowerCmd.startsWith('go to ')) {
          const target = lowerCmd.replace('open ', '').replace('go to ', '').trim();
          
          // Match with Link Titles
          const link = links.find(l => l.title.toLowerCase().includes(target));
          if (link) {
              openLink(link);
              setFeedback(`Opening ${link.title}...`);
              return;
          }
          
          // Match with Pages
          if (target.includes('monitor')) { navigate('/monitor'); return; }
          if (target.includes('report')) { navigate('/report_generator'); return; }
          if (target.includes('admin')) { navigate('/admin'); return; }
          if (target.includes('dashboard') || target.includes('home')) { navigate('/'); return; }
      }

      // 2. SEARCH Logic (e.g. "Search BGB")
      if (lowerCmd.startsWith('search ')) {
          const query = lowerCmd.replace('search ', '').trim();
          setSearchQuery(query);
          triggerSearchNav();
          setFeedback(`Searching for "${query}"...`);
          return;
      }

      // 3. UTILITY Logic
      if (lowerCmd.includes('reload') || lowerCmd.includes('refresh')) {
          window.location.reload();
          return;
      }
      
      if (lowerCmd.includes('stop')) {
          setFeedback('Stopped.');
          return;
      }

      setFeedback(`Unknown command: "${cmd}"`);
  };

  if (!recognition) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
        {transcript && (
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm mb-2 backdrop-blur-md animate-fadeIn max-w-[200px] text-right">
                <p className="font-mono text-xs text-green-400">{feedback}</p>
                <p className="italic opacity-80">"{transcript}"</p>
            </div>
        )}
        
        <button 
            onClick={toggleListening}
            className={`p-3 rounded-full shadow-2xl border-4 transition-all transform active:scale-95 ${isListening ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-indigo-600 border-indigo-400 hover:bg-indigo-700'}`}
            title="Voice Command (e.g., 'Open Somoy TV', 'Search BGB')"
        >
            {isListening ? <Mic size={24} className="text-white"/> : <MicOff size={24} className="text-white"/>}
        </button>
    </div>
  );
};

export default VoiceCommand;
