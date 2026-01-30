
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " বছর আগে";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " মাস আগে";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " দিন আগে";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " ঘণ্টা আগে";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " মিনিট আগে";
  return Math.floor(seconds) + " সেকেন্ড আগে";
};

export const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    return 'https://picsum.photos/64/64';
  }
};

export const getApiBaseUrl = () => {
  // If running on React Dev Server (Port 3000, 3001, 5173 etc)
  // We assume the Backend (PHP) is running on standard Port 80 (Apache/XAMPP)
  const host = window.location.hostname;
  const port = window.location.port;

  // React usually runs on 3000, but if busy (another app), it goes to 3001, 3002...
  if (['3000', '3001', '3002', '3003', '5173'].includes(port)) {
    // Try to guess based on folder structure, usually /licell_mediahub/api
    // If you renamed the folder, CHANGE THIS LINE:
    return `http://${host}/licell_mediahub/api`;
  }
  
  // Production / XAMPP Build (running on same port as PHP)
  // Use relative path 'api' which resolves to 'current_url/api'
  // ensuring it works even if folder name changes
  return `api`;
};
