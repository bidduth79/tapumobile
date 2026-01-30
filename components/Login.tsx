
import React, { useState } from 'react';
import { useApp } from '../store';
import { LogIn, User, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';

const Login: React.FC = () => {
  const { login, resetSystem, t } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network delay for effect
    await new Promise(r => setTimeout(r, 800));
    
    const success = await login(username, password);
    if (!success) {
        setError(t('login_error'));
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden font-sans">
      
      {/* Background Ambience / Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* System Reset (Hidden/Corner) */}
      <button 
          onClick={resetSystem}
          title="Emergency Reset"
          className="absolute top-6 right-6 text-slate-700 hover:text-red-500 transition opacity-50 hover:opacity-100 z-50"
      >
          <RefreshCw size={18} />
      </button>

      {/* Main Card Container */}
      <div className="w-full max-w-[850px] min-h-[500px] flex rounded-2xl shadow-2xl overflow-hidden bg-[#111827] border border-gray-800 m-4 relative z-10">
        
        {/* Left Side: Logo & Branding Area */}
        <div className="hidden md:flex w-5/12 flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-[#0f172a] relative border-r border-gray-800">
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative group mb-6">
                    {/* Glow behind logo */}
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    
                    {/* Logo Container */}
                    <div className="relative w-36 h-36 rounded-full bg-[#1e293b] border-4 border-gray-800 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
                        {/* LOGO IMAGE - Looks for 'logo.png' in public folder */}
                        <img 
                            src="./logo.png" 
                            alt="Logo" 
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                                // Fallback icon if no logo found
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                            <ShieldCheck size={50}/>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white tracking-wider uppercase mb-2">MediaHub</h2>
                <div className="h-1 w-16 bg-blue-600 rounded-full mb-3"></div>
                <p className="text-gray-400 text-xs text-center leading-relaxed px-4">
                    ইন্টেলিজেন্স মনিটরিং এবং অ্যাডভান্সড রিপোর্ট ম্যানেজমেন্ট সিস্টেম
                </p>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-[#111827] flex flex-col justify-center relative">
            
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">স্বাগতম!</h3>
                <p className="text-gray-500 text-sm">আপনার অ্যাকাউন্টে প্রবেশ করতে নিচে তথ্য দিন</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ইউজারনেম</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                            <User size={18} />
                        </div>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 bg-[#1f2937] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-600 transition-all text-sm"
                            placeholder="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">পাসওয়ার্ড</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                            <Lock size={18} />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            className="w-full pl-10 pr-10 py-3 bg-[#1f2937] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-600 transition-all font-mono text-sm"
                            placeholder="••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800 cursor-pointer" 
                        />
                        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition">মনে রাখুন</span>
                    </label>
                    <a href="#" className="text-xs text-blue-500 hover:text-blue-400 hover:underline">পাসওয়ার্ড ভুলে গেছেন?</a>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse mt-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-red-900/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            প্রবেশ করা হচ্ছে...
                        </>
                    ) : (
                        <>
                            Login <LogIn size={18} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-800">
                <p className="text-[10px] text-gray-500 flex justify-center items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    System Status: Online
                </p>
                <div className="mt-2 flex justify-center gap-4 text-xs text-gray-600">
                    <span className="bg-gray-800 px-2 py-1 rounded">Demo: admin / 123</span>
                </div>
            </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-center text-gray-600 text-[10px] opacity-60">
          Developed by LI Cell | Ver 3.0
      </div>
    </div>
  );
};

export default Login;
