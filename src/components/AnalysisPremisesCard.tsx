import React, { useState } from 'react';
import { Sparkles, DollarSign, Target, FileText, Info, Check, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalysisPremisesCardProps {
  customSaleValue: number | '' | undefined;
  customBidValue: number | '' | undefined;
  customAnalysisNotes: string | undefined;
  onUpdate: (fields: {
    customSaleValue?: number | '';
    customBidValue?: number | '';
    customAnalysisNotes?: string;
  }) => void;
  selectedProperty?: any;
  compact?: boolean;
}

export const AnalysisPremisesCard: React.FC<AnalysisPremisesCardProps> = ({
  customSaleValue,
  customBidValue,
  customAnalysisNotes,
  onUpdate,
  selectedProperty,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const formatCurrencyDisplay = (val: number | '' | undefined) => {
    if (val === '' || val === undefined || isNaN(Number(val))) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  const handleSaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (!raw) {
      onUpdate({ customSaleValue: '' });
      return;
    }
    const num = parseFloat(raw) / 100;
    onUpdate({ customSaleValue: num });
  };

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (!raw) {
      onUpdate({ customBidValue: '' });
      return;
    }
    const num = parseFloat(raw) / 100;
    onUpdate({ customBidValue: num });
  };

  const handleClear = () => {
    onUpdate({
      customSaleValue: '',
      customBidValue: '',
      customAnalysisNotes: ''
    });
  };

  const hasAnyData = Boolean(
    (customSaleValue !== '' && customSaleValue !== undefined && Number(customSaleValue) > 0) ||
    (customBidValue !== '' && customBidValue !== undefined && Number(customBidValue) > 0) ||
    (customAnalysisNotes && customAnalysisNotes.trim().length > 0)
  );

  return (
    <div className={cn(
      "bg-gradient-to-br from-brand-paper to-brand-bg rounded-3xl border border-brand-primary/25 shadow-md p-5 sm:p-6 transition-all duration-200 relative overflow-hidden",
      hasAnyData ? "ring-2 ring-brand-primary/20 border-brand-primary/40" : ""
    )}>
      {/* Subtle top decoration badge */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-brand-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/15 flex items-center justify-center text-brand-primary shrink-0">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                Premissas & Dados Complementares para a Análise
              </h4>
              {hasAnyData && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Check size={11} /> Considerado na IA
                </span>
              )}
            </div>
            <p className="text-xs text-brand-ink/55 mt-0.5">
              Defina o valor pretendido de venda e particularidades do imóvel. A IA utilizará esses dados com prioridade máxima nos cálculos financeiros e no parecer.
            </p>
          </div>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-brand-primary hover:underline px-2 py-1"
          >
            {isExpanded ? 'Recolher' : 'Expandir Premissas'}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Valor de Venda Pretendido */}
            <div className="bg-brand-paper/90 p-4 rounded-2xl border border-brand-border/80 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={13} />
                  <span>Valor de Venda Pretendido (R$)</span>
                </label>
                {customSaleValue !== '' && customSaleValue !== undefined && (
                  <span className="text-[10px] font-mono font-bold text-emerald-600">
                    {formatCurrencyDisplay(customSaleValue)}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-brand-ink/40">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    customSaleValue === '' || customSaleValue === undefined
                      ? ''
                      : Number(customSaleValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }
                  onChange={handleSaleChange}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl text-sm font-bold text-emerald-600 outline-none font-mono placeholder:text-brand-ink/20 focus:bg-brand-paper"
                />
              </div>
              <p className="text-[10px] text-brand-ink/40 leading-tight">
                Seu preço de mercado estimado. A IA calculará o Lucro Líquido e o ROI tendo esse valor como teto de venda.
              </p>
            </div>

            {/* Lance Máximo / Pretendido */}
            <div className="bg-brand-paper/90 p-4 rounded-2xl border border-brand-border/80 focus-within:border-brand-primary/60 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={13} />
                  <span>Lance Pretendido / Máximo (R$)</span>
                </label>
                {customBidValue !== '' && customBidValue !== undefined && (
                  <span className="text-[10px] font-mono font-bold text-brand-primary">
                    {formatCurrencyDisplay(customBidValue)}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-brand-ink/40">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    customBidValue === '' || customBidValue === undefined
                      ? ''
                      : Number(customBidValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }
                  onChange={handleBidChange}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl text-sm font-bold text-brand-primary outline-none font-mono placeholder:text-brand-ink/20 focus:bg-brand-paper"
                />
              </div>
              <p className="text-[10px] text-brand-ink/40 leading-tight">
                Valor estimado para o lance (ex: 2ª praça ou lance máximo suportado). Comporá o custo de aquisição.
              </p>
            </div>
          </div>

          {/* Campo de Texto para Informações Adicionais */}
          <div className="bg-brand-paper/90 p-4 rounded-2xl border border-brand-border/80 focus-within:border-brand-primary/60 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-brand-ink/70 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-brand-primary" />
                <span>Informações Adicionais & Particularidades do Imóvel para a IA</span>
              </label>
              {customAnalysisNotes && (
                <span className="text-[10px] text-brand-ink/40">
                  {customAnalysisNotes.length} caracteres
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={customAnalysisNotes || ''}
              onChange={(e) => onUpdate({ customAnalysisNotes: e.target.value })}
              placeholder="Exemplo: Imóvel desocupado recentemente; bairro com alta demanda de locação; estimativa de reforma de R$ 25 mil; IPTU com acordo em dia; preferência por venda rápida em até 6 meses com 20% de margem líquida..."
              className="w-full p-3 bg-brand-bg/50 border border-brand-border rounded-xl text-xs text-brand-ink outline-none leading-relaxed placeholder:text-brand-ink/30 focus:bg-brand-paper resize-y min-h-[72px]"
            />
            <div className="flex items-center justify-between text-[10px] text-brand-ink/45 pt-1">
              <span className="flex items-center gap-1">
                <Info size={12} className="text-brand-primary shrink-0" />
                A IA interpretará este texto como diretrizes prioritárias na modelagem dos riscos e conclusões.
              </span>
              {hasAnyData && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 font-bold ml-2 cursor-pointer transition-colors"
                  title="Limpar premissas personalizadas"
                >
                  <RotateCcw size={11} /> Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
