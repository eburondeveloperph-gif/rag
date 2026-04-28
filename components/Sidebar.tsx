
import React, { useState, useEffect } from 'react';
import { logout, auth } from '../services/firebaseService';
import { onAuthStateChanged, User } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { id: 'docs', icon: 'fa-box-archive', label: 'Case Files' },
    { id: 'chat', icon: 'fa-magnifying-glass-location', label: 'Gov Search' },
    { id: 'purge', icon: 'fa-shield-halved', label: 'Compliance Purge' },
    { id: 'audit', icon: 'fa-stamp', label: 'Administrative Audit' },
    { id: 'settings', icon: 'fa-building-columns', label: 'FPS Settings' },
  ];

  return (
    <div className={`
      fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-[#E5E5EA] text-[#1D1D1F] z-50
      flex flex-col
      transition-transform duration-300 ease-in-out w-64
      ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6 flex flex-col gap-1 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-3">
          <div className="bg-[#007AFF] w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border border-black/5 shadow-sm">
             <div className="flex gap-0.5">
                <div className="w-1.5 h-3 bg-black"></div>
                <div className="w-1.5 h-3 bg-yellow-400"></div>
                <div className="w-1.5 h-3 bg-red-600"></div>
             </div>
             <i className="fa-solid fa-crown text-[10px] text-yellow-400 mt-1"></i>
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight block leading-none">EBURON</span>
            <span className="text-[9px] text-[#86868B] font-medium uppercase tracking-widest">BE-Gov Compliance</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-[#007AFF] text-white shadow-sm' 
                : 'text-[#515154] hover:bg-[#0000000A] hover:text-[#1D1D1F]'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg ${activeTab === item.id ? 'scale-105' : ''}`}></i>
            <span className="font-medium text-[15px]">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#E5E5EA] bg-transparent flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-black/5" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center text-xs font-bold text-[#1D1D1F] border border-black/5">
              OFF
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold truncate text-[#1D1D1F]">{user?.displayName || "Administrative Officer"}</p>
            <p className="text-[11px] text-[#86868B] truncate">{user?.email || "FPS BOSA | Level 2 Auth"}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          Secure Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
