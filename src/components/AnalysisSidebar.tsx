import React, { useState } from 'react';
import { 
  Brain, 
  FileText, 
  Plus, 
  Search, 
  Gavel, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Link as LinkIcon,
  Trash2,
  Play,
  ChevronRight,
  ChevronDown,
  Database
} from 'lucide-react';
import { Property, StrategicBrainItem } from '../types';

// Simple cn helper to avoid missing module error
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface AnalysisSidebarProps {
  property: Property;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  brainItems: StrategicBrainItem[];
  onAddBrainItem: (item: Omit<StrategicBrainItem, 'id' | 'timestamp'>) => void;
  onRemoveBrainItem: (id: string) => void;
}

export const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({
  property,
  onAnalyze,
  isAnalyzing,
  brainItems,
  onAddBrainItem,
  onRemoveBrainItem
}) => {
  const [showAddBrain, setShowAddBrain] = useState(false);
  const [newBrainType, setNewBrainType] = useState<'url' | 'file' | 'text'>('url');
  const [newBrainValue, setNewBrainValue] = useState('');
  const [newBrainTitle, setNewBrainTitle] = useState('');

  const handleAddBrain = () => {
    if (!newBrainValue || !newBrainTitle) return;
    onAddBrainItem({
      type: newBrainType,
      title: newBrainTitle,
      content: newBrainValue,
      status: 'synced'
    });
    setNewBrainTitle('');
    setNewBrainValue('');
    setShowAddBrain(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Contexto da Análise */}
      <section className="premium-card p-5 bg-brand-paper/50 backdrop-blur-sm border-brand-primary/10">
        <h3 className="text-xs font-bold text-brand-ink/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Brain size={14} className="text-brand-primary" />
          Contexto da Análise
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-brand-ink/30 uppercase mb-1.5">Análise Avulsa (Sem Cadastro)</label>
            <select className="w-full bg-brand-bg/50 border border-brand-primary/10 rounded-lg p-2 text-xs text-brand-ink focus:outline-none focus:border-brand-primary">
              <option>Análise Avulsa (Sem Cadastro)</option>
              <option>Vincular a Imóvel Existente</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-ink/30 uppercase mb-1.5">Cérebro de IA</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-brand-bg/30 rounded-lg border border-brand-primary/5">
                <span className="text-[10px] font-medium text-brand-ink/60">Gemini 3.1 Flash (Padrão)</span>
                <ChevronDown size={12} className="text-brand-ink/30" />
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {brainItems.map(item => (
                  <div key={item.id} className="group flex items-center justify-between p-2 bg-brand-primary/5 rounded-lg border border-brand-primary/10 hover:bg-brand-primary/10 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.type === 'url' ? <LinkIcon size={10} className="text-brand-primary" /> : <FileText size={10} className="text-brand-primary" />}
                      <span className="text-[10px] text-brand-ink truncate font-medium">{item.title}</span>
                    </div>
                    <button 
                      onClick={() => onRemoveBrainItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                
                {showAddBrain ? (
                  <div className="p-2 bg-brand-paper border border-brand-primary/20 rounded-lg space-y-2 shadow-xl">
                    <input 
                      placeholder="Título" 
                      className="w-full text-[10px] p-1.5 border rounded bg-brand-bg"
                      value={newBrainTitle}
                      onChange={e => setNewBrainTitle(e.target.value)}
                    />
                    <select 
                      className="w-full text-[10px] p-1.5 border rounded bg-brand-bg"
                      value={newBrainType}
                      onChange={e => setNewBrainType(e.target.value as any)}
                    >
                      <option value="url">URL / Link</option>
                      <option value="file">Arquivo Local</option>
                      <option value="text">Texto / Nota</option>
                    </select>
                    <textarea 
                      placeholder={newBrainType === 'url' ? "https://..." : "Conteúdo..."}
                      className="w-full text-[10px] p-1.5 border rounded bg-brand-bg h-16"
                      value={newBrainValue}
                      onChange={e => setNewBrainValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAddBrain} className="flex-1 bg-brand-primary text-black text-[10px] font-bold py-1 rounded">Adicionar</button>
                      <button onClick={() => setShowAddBrain(false)} className="flex-1 bg-brand-bg text-brand-ink text-[10px] py-1 rounded">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAddBrain(true)}
                    className="w-full flex items-center justify-center gap-1 p-2 border border-dashed border-brand-primary/20 rounded-lg text-[10px] text-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    <Plus size={10} /> Adicionar Recurso
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-ink/30 uppercase mb-1.5">Tipo de Leilão (Precisão)</label>
            <div className="flex gap-2">
              <button className="flex-1 py-1.5 px-2 bg-brand-primary text-black text-[10px] font-bold rounded-lg shadow-sm">AUTO</button>
              <button className="flex-1 py-1.5 px-2 bg-brand-bg border border-brand-primary/10 text-brand-ink/40 text-[10px] font-bold rounded-lg">JUDICIAL</button>
              <button className="flex-1 py-1.5 px-2 bg-brand-bg border border-brand-primary/10 text-brand-ink/40 text-[10px] font-bold rounded-lg">EXTRA</button>
            </div>
            <p className="text-[9px] text-brand-ink/30 mt-1 italic">Força análise para este padrão.</p>
          </div>
        </div>
      </section>

      {/* Botão Executar */}
      <button 
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className={cn(
          "w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-bold text-sm transition-all shadow-xl",
          isAnalyzing 
            ? "bg-brand-bg text-brand-ink/20 cursor-not-allowed" 
            : "bg-gradient-to-r from-brand-primary to-orange-600 text-black hover:scale-[1.02] active:scale-[0.98] shadow-brand-primary/20"
        )}
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-brand-ink/20 border-t-brand-primary rounded-full animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            Executar Análise IA
          </>
        )}
      </button>
    </div>
  );
};

const DocItem: React.FC<{ label: string; status: 'synced' | 'pending'; sub?: string }> = ({ label, status, sub }) => (
  <div className="group p-3 bg-brand-bg/30 rounded-xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] font-bold text-brand-ink/80">{label}</span>
      {status === 'synced' ? (
        <CheckCircle2 size={12} className="text-emerald-500" />
      ) : (
        <AlertCircle size={12} className="text-brand-ink/20" />
      )}
    </div>
    {sub && <p className="text-[9px] text-brand-ink/30 leading-tight mb-2">{sub}</p>}
    <button className="flex items-center gap-1 text-[9px] font-bold text-brand-primary/60 hover:text-brand-primary uppercase tracking-wider">
      <Plus size={10} /> Adicionar Arquivos
    </button>
  </div>
);
