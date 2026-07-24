import React, { useState } from 'react';
import { 
  RotateCcw, 
  Trash2, 
  Sliders, 
  Gauge, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Shield,
  Percent
} from 'lucide-react';

interface SmartResetPanelProps {
  tabName: string;
  tabKey: 'edital' | 'matricula' | 'processos' | 'dossier' | 'smart_analysis' | 'assessoria' | 'report' | 'cnj' | 'documents' | 'simulations' | 'investors' | 'instagram';
  hasAnalysis: boolean;
  onResetTab: () => void;
  onResetAll: () => void;
  onApplySettings?: (settings: { depth: string; focus: string }) => void;
}

export const SmartResetPanel: React.FC<SmartResetPanelProps> = ({
  tabName,
  tabKey,
  hasAnalysis,
  onResetTab,
  onResetAll,
  onApplySettings
}) => {
  const [depth, setDepth] = useState<string>('detailed');
  const [focus, setFocus] = useState<string>('general');
  const [showConfirmResetAll, setShowConfirmResetAll] = useState<boolean>(false);
  const [showConfirmResetTab, setShowConfirmResetTab] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApply = () => {
    if (onApplySettings) {
      onApplySettings({ depth, focus });
    }
    setSuccessMsg("Configurações aplicadas! Execute uma nova análise acima para aplicar os novos parâmetros.");
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // The panel is always rendered to allow configuring IA depth and focus even before running the analysis.

  return (
    <div className="mt-8 bg-gradient-to-br from-brand-bg/40 to-brand-bg/15 rounded-3xl border border-brand-primary/20 p-6 space-y-6 font-sans no-print">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-4">
        <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
          <RotateCcw size={20} className="animate-spin-slow" />
        </div>
        <div>
          <h4 className="text-md font-bold text-brand-ink">Central de Reinicialização & Configurações de IA ({tabName})</h4>
          <p className="text-xs text-brand-ink/50 mt-0.5">Refine as regras ou limpe as informações para gerar novos cenários personalizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Ajustes Inteligentes */}
        <div className="space-y-4 bg-brand-paper/50 p-5 rounded-2xl border border-brand-border/40">
          <div className="flex items-center gap-2 mb-2">
            <Sliders size={16} className="text-brand-primary" />
            <h5 className="text-xs font-bold text-brand-ink uppercase tracking-wider">Ajustar Parâmetros para Próxima Análise</h5>
          </div>

          {/* Seletor de Profundidade */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-wide block">Profundidade da IA</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'fast', label: 'Rápido', icon: Zap, desc: 'KPIs imediatos' },
                { id: 'detailed', label: 'Completo', icon: Gauge, desc: 'Equilibrado' },
                { id: 'ultra', label: 'Ultra Deep', icon: Sparkles, desc: 'Jurídico Profundo' }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = depth === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setDepth(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                        : 'bg-brand-bg/20 border-brand-border/30 text-brand-ink/70 hover:bg-brand-bg/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold">{item.label}</span>
                      <Icon size={12} className={isSelected ? 'text-brand-primary' : 'text-brand-ink/40'} />
                    </div>
                    <span className="text-[9px] text-brand-ink/40 mt-1 block leading-tight">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diretriz de Foco */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-wide block">Foco Direcionado</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'general', label: 'Geral & Comercial', icon: Shield, desc: 'Visão holística' },
                { id: 'nulidades', label: 'Risco de Nulidade', icon: AlertTriangle, desc: 'Vícius e intimação' },
                { id: 'fiscal', label: 'Risco Tributário', icon: Percent, desc: 'IPTU e ônus fiscais' },
                { id: 'desocupacao', label: 'Facilidade Posse', icon: CheckCircle2, desc: 'Imissão e amigável' }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = focus === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFocus(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                        : 'bg-brand-bg/20 border-brand-border/30 text-brand-ink/70 hover:bg-brand-bg/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold">{item.label}</span>
                      <Icon size={12} className={isSelected ? 'text-brand-primary' : 'text-brand-ink/40'} />
                    </div>
                    <span className="text-[9px] text-brand-ink/40 mt-1 block leading-tight">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full mt-4 bg-brand-primary/10 border border-brand-primary/30 hover:bg-brand-primary/20 text-brand-primary font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sliders size={14} /> Aplicar Parâmetros Personalizados
          </button>

          {successMsg && (
            <div className="mt-2 text-[11px] text-emerald-500 font-medium flex items-center gap-1.5 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 animate-fade-in">
              <CheckCircle2 size={12} /> {successMsg}
            </div>
          )}
        </div>

        {/* Lado Direito: Ações de Resetar */}
        <div className="space-y-4 bg-brand-paper/50 p-5 rounded-2xl border border-brand-border/40 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 size={16} className="text-rose-500" />
              <h5 className="text-xs font-bold text-brand-ink uppercase tracking-wider">Ações Destrutivas de Limpeza</h5>
            </div>
            <p className="text-xs text-brand-ink/65 leading-relaxed">
              Você pode reiniciar o progresso de triagem de duas formas. A limpeza libera os slots para que você faça upload de novos arquivos ou execute a IA com outras diretrizes.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {/* Botão Resetar Aba Atual */}
            {tabKey !== 'report' && hasAnalysis && (
              <div className="space-y-2">
                {!showConfirmResetTab ? (
                  <button
                    onClick={() => setShowConfirmResetTab(true)}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> Limpar Análise de {tabName}
                  </button>
                ) : (
                  <div className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/20 space-y-2">
                    <p className="text-[11px] text-rose-500 font-semibold text-center">Tem certeza? Isso apagará o relatório gerado nesta aba.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowConfirmResetTab(false)}
                        className="bg-brand-bg/40 text-brand-ink/70 font-semibold py-1.5 px-3 rounded-lg text-[10px] hover:bg-brand-bg/60 border border-brand-border/20"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          onResetTab();
                          setShowConfirmResetTab(false);
                        }}
                        className="bg-rose-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] hover:bg-rose-600 transition-all"
                      >
                        Confirmar Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botão Resetar Tudo */}
            <div className="space-y-2">
              {!showConfirmResetAll ? (
                <button
                  onClick={() => setShowConfirmResetAll(true)}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10"
                >
                  <Trash2 size={14} /> Limpar Tudo (Remover Docs e Análises)
                </button>
              ) : (
                <div className="bg-rose-500/15 p-3.5 rounded-xl border border-rose-500/30 space-y-2">
                  <p className="text-[11px] text-rose-500 font-extrabold text-center uppercase tracking-wider">⚠️ PERIGO: RESET MASTER</p>
                  <p className="text-[10px] text-brand-ink/70 text-center">
                    Isso removerá TODOS os documentos enviados de edital, matrícula e processos, e apagará TODOS os relatórios de IA de uma vez.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setShowConfirmResetAll(false)}
                      className="bg-brand-bg/40 text-brand-ink/70 font-semibold py-1.5 px-3 rounded-lg text-[10px] hover:bg-brand-bg/60 border border-brand-border/20"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        onResetAll();
                        setShowConfirmResetAll(false);
                      }}
                      className="bg-rose-600 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] hover:bg-rose-700 transition-all"
                    >
                      Resetar Master
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
