
import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';

const QrGenerator: React.FC = () => {
  const [qrText, setQrText] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if(qrText) {
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`);
    } else {
        setQrUrl('');
    }
  }, [qrText]);

  return (
    <div className="max-w-md mx-auto text-center space-y-6 pt-10 animate-slideUp">
        <QrCode className="w-16 h-16 mx-auto text-gray-700 dark:text-gray-300"/>
        <h3 className="text-xl font-bold dark:text-white">QR কোড জেনারেটর</h3>
        <input 
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-gray-500"
            placeholder="টেক্সট বা লিংক দিন..."
            value={qrText}
            onChange={e => setQrText(e.target.value)}
        />
        {qrUrl && (
            <div className="bg-white p-4 rounded-xl shadow-lg inline-block animate-fadeIn">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
                <a href={qrUrl} download="qrcode.png" className="block mt-2 text-xs text-blue-600 font-bold hover:underline">ডাউনলোড ইমেজ</a>
            </div>
        )}
    </div>
  );
};

export default QrGenerator;
