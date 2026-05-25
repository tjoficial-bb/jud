import React from 'react';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, DollarSign, Brain, Settings, Users, Search, FileText, Home, LogOut, Cpu, Lightbulb
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, onLogout }: any) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Gestão de Imóveis', icon: Home },
    { id: 'ai-analysis', label: 'Análise IA', icon: Brain },
    { id: 'brain', label: 'Cérebro Estratégico', icon: Lightbulb },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className={cn("fixed left-0 top-0 h-screen w-64 bg-brand-bg transition-all duration-300 border-r border-brand-primary/10 flex flex-col justify-between z-50", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex flex-col flex-1">
        <div className="p-8 text-2xl font-serif font-bold text-brand-primary flex items-center justify-between">
          <span>TJ INVEST</span>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="p-2 hover:bg-brand-primary/10 rounded-xl text-brand-primary lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === item.id ? "bg-brand-primary text-black" : "text-brand-ink/40 hover:text-brand-primary"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {onLogout && (
        <div className="p-4 border-t border-brand-primary/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Sair do Painel
          </button>
        </div>
      )}
    </aside>
  );
};

