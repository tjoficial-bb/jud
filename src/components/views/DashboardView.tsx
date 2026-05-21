import React from 'react';
import { motion } from 'motion/react';
import { Home, Search, Gavel, TrendingUp, ChevronRight, Brain, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DashboardCharts } from '../DashboardCharts';
import { NewsFeed } from '../NewsFeed';
import { Property, StrategicBrainItem } from '../../types';

export function DashboardView({ properties, allAnalyses, brainItems, onSelectProperty, onViewAll }: { properties: Property[], allAnalyses: any[], brainItems: StrategicBrainItem[], onSelectProperty: (id: string) => void, onViewAll: () => void }) {
  const avgRoi = allAnalyses.length > 0 
    ? (allAnalyses.reduce((acc, curr) => acc + (curr.roi || 0), 0) / allAnalyses.length).toFixed(0) + '%'
    : '--';

  const stats = [
    { label: 'Total Imóveis', value: properties.length, icon: <Home size={24} />, color: 'bg-brand-primary' },
    { label: 'Em Análise', value: properties.filter(p => p.status === 'Analise').length, icon: <Search size={24} />, color: 'bg-brand-primary/80' },
    { label: 'Arrematados', value: properties.filter(p => p.status === 'Arrematado').length, icon: <Gavel size={24} />, color: 'bg-emerald-500' },
    { label: 'ROI Médio', value: avgRoi, icon: <TrendingUp size={24} />, color: 'bg-brand-primary/90' },
  ];

  const booksCount = brainItems.filter(item => item.category === 'Livro' || item.category === 'Estratégia').length;
  const coursesCount = brainItems.filter(item => item.category === 'Curso').length;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-primary flex items-center gap-4">
            Bem-vindo, Thiago
            <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full uppercase tracking-widest font-bold">Versão 2.0</span>
          </h2>
          <p className="text-brand-ink/40 font-medium text-lg">Aqui está o resumo da sua carteira de leilões.</p>
        </div>
        <div className="bg-brand-paper px-6 py-3 rounded-2xl border border-brand-primary/20 flex items-center gap-3 shadow-sm">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">Sistema Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="premium-card p-8 stat-card-hover bg-brand-paper border-brand-primary/10"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-black mb-8 shadow-lg shadow-brand-primary/10", stat.color)}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-2">{stat.label}</p>
            <p className="text-4xl font-serif font-bold text-brand-primary">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <DashboardCharts properties={properties} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 premium-card p-10 bg-brand-paper border-brand-primary/10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-serif font-medium text-brand-primary">Últimos Imóveis Cadastrados</h3>
            <button 
              onClick={onViewAll}
              className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:underline underline-offset-8"
            >
              Ver Todos
            </button>
          </div>
          <div className="space-y-6">
            {properties.slice(0, 5).map(p => (
              <div 
                key={p.id} 
                onClick={() => onSelectProperty(p.id)}
                className="flex items-center justify-between p-6 bg-brand-bg/30 rounded-3xl hover:bg-brand-bg/60 transition-all duration-300 cursor-pointer group border border-transparent hover:border-brand-primary/10"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary shadow-sm border border-brand-primary/5 group-hover:scale-110 transition-transform duration-500">
                    <Home size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg tracking-tight">{p.title}</p>
                    <p className="text-sm text-brand-ink/40 font-medium">{p.city}, {p.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-ink/30 mb-1">Lance Mínimo</p>
                    <p className="font-serif text-xl font-bold text-brand-primary">R$ {p.min_bid?.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-brand-primary/10 flex items-center justify-center text-brand-primary/20 group-hover:text-brand-primary group-hover:border-brand-primary/30 transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            ))}
            {properties.length === 0 && (
              <div className="text-center py-20 text-brand-ink/20 font-serif italic text-xl">Nenhum imóvel cadastrado ainda.</div>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-brand-paper border border-brand-primary/20 text-brand-ink rounded-[40px] p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-brand-secondary opacity-90" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-brand-primary/20">
                <Brain size={32} className="text-brand-primary" />
              </div>
              <h3 className="text-3xl font-serif font-medium mb-6 text-brand-primary">Cérebro Estratégico</h3>
              <p className="text-brand-ink/70 mb-10 leading-relaxed text-lg font-light">Sua base de conhecimento está pronta para analisar novos processos com base nas suas estratégias salvas.</p>
              <div className="space-y-5">
                <div className="flex items-center gap-4 bg-brand-ink/5 p-5 rounded-2xl border border-brand-ink/5 hover:bg-brand-ink/10 transition-all cursor-default">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-brand-primary" />
                  </div>
                  <span className="text-base font-medium tracking-tight">{booksCount} Livros Indexados</span>
                </div>
                <div className="flex items-center gap-4 bg-brand-ink/5 p-5 rounded-2xl border border-brand-ink/5 hover:bg-brand-ink/10 transition-all cursor-default">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-brand-primary" />
                  </div>
                  <span className="text-base font-medium tracking-tight">{coursesCount} Cursos de Leilão</span>
                </div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'brain' }))}
                className="mt-12 w-full py-5 bg-brand-primary text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl"
              >
                Acessar Conhecimento
              </button>
            </div>
            <Brain size={200} className="absolute -bottom-20 -right-20 text-brand-primary/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>
          <NewsFeed />
        </div>
      </div>
    </div>
  );
}
