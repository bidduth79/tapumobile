
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import ToolWindow from './components/ToolWindow';
import NewsMonitor from './components/NewsMonitor';
import TrendNews from './components/TrendNews';
import NewsReportGenerator from './components/NewsReportGenerator';
import Phonebook from './components/Phonebook';
import AiCommandCenter from './components/AiCommandCenter';
import ScrollButton from './components/ScrollButton';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import DuplicateChecker from './components/tools/DuplicateChecker';
import VoiceCommand from './components/VoiceCommand';

const ProtectedLayout = () => {
  const { isNavbarVisible } = useApp();
  const location = useLocation();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Check for full screen routes
    const path = location.pathname.toLowerCase();
    const fullScreenRoutes = ['latest_updates', 'ai-hub'];
    const match = fullScreenRoutes.some(route => path.includes(route));
    setIsFullScreen(match);
  }, [location]);
  
  return (
    <div className={`min-h-screen flex flex-col relative pb-12 transition-all duration-300 
      ${isFullScreen ? '' : 'lg:pr-64'} 
      ${isFullScreen ? 'pt-0' : (isNavbarVisible ? 'pt-20' : 'pt-0')}
    `}>
      
      {/* Global Announcement Banner */}
      {!isFullScreen && <div className="fixed top-0 left-0 w-full z-[100]"><GlobalAnnouncement /></div>}
      
      {/* Conditionally render Navbar */}
      {!isFullScreen && <Navbar />}
      
      <ToolWindow />
      <ScrollButton />
      <VoiceCommand />
      
      <main className="flex-1 mt-2">
        <Outlet />
      </main>
      
      <Footer />
      
      {!isFullScreen && <Sidebar />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="monitor" element={<NewsMonitor />} />
            <Route path="trend_news" element={<TrendNews />} />
            <Route path="report_generator" element={<NewsReportGenerator />} />
            <Route path="phonebook" element={<Phonebook />} />
            <Route path="ai-hub" element={<AiCommandCenter />} />
            <Route path="duplicate-checker" element={<DuplicateChecker />} />
            
            {/* Dynamic Routes */}
            <Route path=":category" element={<Dashboard />} />
            <Route path=":category/:subCategory" element={<Dashboard />} />
            <Route path=":category/:subCategory/:childCategory" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
