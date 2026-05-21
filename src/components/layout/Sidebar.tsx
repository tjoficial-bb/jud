import React from 'react';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, DollarSign, Brain, Settings, Users, Search, FileText, Home, LogOut
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, onLogout }: any) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Gestão de Imóveis', icon: Home },
    { id: 'debts', label: 'Débitos', icon: DollarSign },
    { id: 'ai-analysis', label: 'Análise IA', icon: Brain },
    { id: 'documents', label: 'Gestão de Documentos', icon: FileText },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className={cn("fixed left-0 top-0 h-screen w-64 bg-brand-bg transition-all border-r border-brand-primary/10 flex flex-col justify-between z-50", !isSidebarOpen && "-translate-x-full")}>
      <div className="flex flex-col flex-1">
        <div className="p-8 text-2xl font-serif font-bold text-brand-primary flex items-center justify-between">
          <span>TJ INVEST</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

