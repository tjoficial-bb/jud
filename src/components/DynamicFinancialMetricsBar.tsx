import React, { useState } from 'react';
import { TrendingUp, DollarSign, Target, Sparkles, Save, Check, RefreshCw, AlertCircle, Edit3, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeAuctionDocuments } from '../services/aiService';

interface DynamicFinancialMetricsBarProps {
  metrics: any;
  tir: number;
  roi: number;
  simulationData: any;
  onUpdateSimulationValue: (key: string, value: any, subkey?: string) => void;
  selectedPropertyId?: string;
  selectedProperty?: any;
  token?: string;
  onPropertySaved?: () => void;
  currentReportText?: string | null;
  onReportUpdated?: (newReportText: string) => void;
  selectedModel?: string;
  userApiKey?: string;
}

export const DynamicFinancialMetricsBar: React.FC<DynamicFinancialMetricsBarProps> = ({
  metrics,
  tir,
  roi,
  simulationData,
  onUpdateSimulationValue,
  selectedPropertyId,
  selectedProperty,
  token,
  onPropertySaved,
  currentReportText,
  onReportUpdated,
  selectedModel = 'gemini-3.7-flash',
  userApiKey
}) => {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRegeneratingReport, setIsRegeneratingReport] = useState(false);
  const [aiUpdateSuccess, setAiUpdateSuccess] = useState(false);

  const saleVal = Number(simulationData?.saleValue?.value ?? metrics?.saleValue ?? selectedProperty?.expected_sale_value ?? 0);
  const bidVal = Number(simulationData?.bid?.value ?? metrics?.bid ?? selectedProperty?.min_bid ?? 0);
  const totalCost = Number(metrics?.totalInvestment ?? 0);
  const netProfit = Number(metrics?.netProfit ?? 0);
  const currentRoi = Number(roi ?? metrics?.roi ?? 0);
  const currentTir = Number(tir ?? 0);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleSaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw ? parseFloat(raw) / 100 : 0;
    onUpdateSimulationValue('saleValue', num, 'value');
  };

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw ? parseFloat(raw) / 100 : 0;
    onUpdateSimulationValue('bid', num, 'value');
  };

  const handleSaveToProperty = async () => {
    if (!selectedPropertyId || !token) {
      alert("Selecione ou vincule um imóvel para salvar estas alterações no banco de dados.");
      return;
    }

    setIsSavingProperty(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/properties/${selectedPropertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expected_sale_value: saleVal,
          min_bid: bidVal,
          valuation_value: simulationData?.valuation?.value || selectedProperty?.valuation_value || 0
        })
      });

      if (!res.ok) throw new Error("Falha ao salvar valores no imóvel.");

      setSaveSuccess(true);
      if (onPropertySaved) onPropertySaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar no imóvel: " + (err.message || 'Tente novamente.'));
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleRealignReportWithAI = async () => {
    if (!currentReportText || !onReportUpdated) {
      alert("Gere um relatório primeiro para poder readequar o parecer com a IA.");
      return;
    }

    setIsRegeneratingReport(true);
    setAiUpdateSuccess(false);

    try {
      const realignmentPrompt = `Você é o Cérebro Estratégico TJ INVEST. 
O investidor acabou de calibrar/alterar dinamicamente os valores financeiros deste imóvel para:
- Novo Valor de Venda Estimado: ${formatBRL(saleVal)}
- Novo Lance de Arrematação / Compra: ${formatBRL(bidVal)}
- Custos Totais de Arrematação: ${formatBRL(totalCost)}
- Novo Lucro Líquido Projetado: ${formatBRL(netProfit)}
- Novo ROI Projetado: ${currentRoi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
- Nova TIR Projetada (Anual): ${currentTir.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%

RELATÓRIO ATUAL PRECEDENTE:
${currentReportText}

DIRETRIZ DE READEQUAÇÃO:
Reescreva e atualize o relatório acima incorporando de forma 100% harmoniosa estes NOVOS valores financeiros. 
Ajuste a seção de Viabilidade Financeira, a tabela de custos/lucros e a Conclusão Estratégica do Parecer para refletir exatamente esta nova rentabilidade e margem de segurança. Mantenha os apontamentos jurídicos, de matrícula e edital inalterados. Retorne o relatório completo reformulado em Markdown rico e profissional.`;

      const updatedText = await analyzeAuctionDocuments(
        [],
        realignmentPrompt,
        selectedModel,
        userApiKey || undefined,
        [],
        'geral'
      );

      if (updatedText && !updatedText.startsWith('### ERRO')) {
        onReportUpdated(updatedText);
        setAiUpdateSuccess(true);
        setTimeout(() => setAiUpdateSuccess(false), 4000);
      } else {
        throw new Error(updatedText || "Erro ao recalibrar parecer.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Não foi possível readequar o parecer automaticamente: " + (err.message || 'Verifique sua conexão.'));
    } finally {
      setIsRegeneratingReport(false);
    }
  };

  return (
    <div className="bg-brand-paper rounded-3xl border border-brand-primary/25 shadow-md p-5 sm:p-6 space-y-5 transition-all">
      {/* Header bar with dynamic live badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                Métricas Financeiras & Ajuste Dinâmico
              </h4>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Recálculo em Tempo Real
              </span>
            </div>
            <p className="text-xs text-brand-ink/50 mt-0.5">
              Altere o valor de venda ou lance abaixo para recalcular instantaneamente Lucro Líquido, Custos, ROI e TIR.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            type="button"
            onClick={() => setIsEditingInline(!isEditingInline)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
              isEditingInline 
                ? "bg-brand-primary text-black border-brand-primary shadow-sm" 
                : "bg-brand-bg text-brand-ink/70 hover:text-brand-primary border-brand-border"
            )}
          >
            <Edit3 size={13} />
            <span>{isEditingInline ? 'Concluir Edição' : 'Editar Valores nos Cards'}</span>
          </button>

          {selectedPropertyId && (
            <button
              type="button"
              onClick={handleSaveToProperty}
              disabled={isSavingProperty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Salvar os novos valores de venda e lance diretamente no cadastro do imóvel"
            >
              {saveSuccess ? (
                <>
                  <Check size={13} />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{isSavingProperty ? 'Salvando...' : 'Salvar no Imóvel'}</span>
                </>
              )}
            </button>
          )}

          {currentReportText && (
            <button
              type="button"
              onClick={handleRealignReportWithAI}
              disabled={isRegeneratingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-primary/15 text-brand-primary hover:bg-brand-primary hover:text-black transition-all border border-brand-primary/30 disabled:opacity-50 cursor-pointer"
              title="Solicitar à IA que reescreva a conclusão e a viabilidade do parecer com base nos novos valores calculados"
            >
              {aiUpdateSuccess ? (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span>Parecer Readequado!</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className={isRegeneratingReport ? "animate-spin" : ""} />
                  <span>{isRegeneratingReport ? 'Readequando com IA...' : 'Readequar Parecer IA'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Interactive 5 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Valor de Venda Estimado */}
        <div className={cn(
          "bg-brand-paper/70 p-4 sm:p-5 rounded-2xl border transition-all relative group",
          isEditingInline ? "ring-2 ring-emerald-500/30 border-emerald-500/50 bg-emerald-500/5" : "border-brand-border"
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
              <DollarSign size={11} /> Valor de Venda Estimado
            </p>
            <button
              type="button"
              onClick={() => setIsEditingInline(true)}
              className="opacity-60 hover:opacity-100 text-emerald-600 p-0.5 rounded hover:bg-emerald-500/10 cursor-pointer"
              title="Editar valor de venda estimado"
            >
              <Edit3 size={11} />
            </button>
          </div>

          {isEditingInline ? (
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-emerald-600">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={saleVal ? saleVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                  onChange={handleSaleChange}
                  className="w-full pl-8 pr-2 py-1.5 bg-brand-paper border border-emerald-500 rounded-lg text-sm font-bold text-emerald-600 outline-none font-mono focus:ring-1 focus:ring-emerald-500"
                  placeholder="0,00"
                  autoFocus
                />
              </div>
              <span className="text-[9px] text-emerald-600/70 font-semibold block">
                Pressione para recalcular em tempo real
              </span>
            </div>
          ) : (
            <div>
              <p 
                onClick={() => setIsEditingInline(true)}
                className="text-sm sm:text-lg font-bold text-emerald-600 font-mono break-all cursor-pointer hover:underline"
                title="Clique para editar este valor"
              >
                {formatBRL(saleVal)}
              </p>
              <span className="text-[9px] text-brand-ink/40 block mt-0.5">
                Revenda no mercado
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Lance de Arrematação */}
        <div className={cn(
          "bg-brand-paper/70 p-4 sm:p-5 rounded-2xl border transition-all relative group",
          isEditingInline ? "ring-2 ring-brand-primary/30 border-brand-primary/50 bg-brand-primary/5" : "border-brand-border"
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-primary flex items-center gap-1">
              <Target size={11} /> Lance de Arrematação
            </p>
            <button
              type="button"
              onClick={() => setIsEditingInline(true)}
              className="opacity-60 hover:opacity-100 text-brand-primary p-0.5 rounded hover:bg-brand-primary/10 cursor-pointer"
              title="Editar lance de arrematação"
            >
              <Edit3 size={11} />
            </button>
          </div>

          {isEditingInline ? (
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-brand-primary">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bidVal ? bidVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                  onChange={handleBidChange}
                  className="w-full pl-8 pr-2 py-1.5 bg-brand-paper border border-brand-primary rounded-lg text-sm font-bold text-brand-primary outline-none font-mono focus:ring-1 focus:ring-brand-primary"
                  placeholder="0,00"
                />
              </div>
              <span className="text-[9px] text-brand-primary/70 font-semibold block">
                Custo base de aquisição
              </span>
            </div>
          ) : (
            <div>
              <p 
                onClick={() => setIsEditingInline(true)}
                className="text-sm sm:text-lg font-bold text-brand-primary font-mono break-all cursor-pointer hover:underline"
                title="Clique para editar o lance"
              >
                {formatBRL(bidVal)}
              </p>
              <span className="text-[9px] text-brand-ink/40 block mt-0.5">
                Custo de compra (1ª ou 2ª praça)
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Custos Totais da Arrematação */}
        <div className="bg-brand-paper/70 p-4 sm:p-5 rounded-2xl border border-brand-border">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-1.5">
            Custos Totais
          </p>
          <p className="text-sm sm:text-lg font-bold text-brand-primary font-mono break-all">
            {formatBRL(totalCost)}
          </p>
          <span className="text-[9px] text-brand-ink/40 block mt-0.5">
            Lance + taxas + reformas + ITBI
          </span>
        </div>

        {/* Card 4: Lucro Líquido Estimado */}
        <div className="bg-brand-paper/70 p-4 sm:p-5 rounded-2xl border border-brand-border">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-1.5">
            Lucro Líquido Estimado
          </p>
          <p className={cn(
            "text-sm sm:text-lg font-bold font-mono break-all",
            netProfit >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {formatBRL(netProfit)}
          </p>
          <span className="text-[9px] text-brand-ink/40 block mt-0.5">
            Venda líq. - Custo total - IR
          </span>
        </div>

        {/* Card 5: Retorno (ROI & TIR) */}
        <div className="bg-brand-paper/70 p-4 sm:p-5 rounded-2xl border border-brand-border col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">
              ROI & TIR (Anual)
            </p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded">
              Líquido
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-sm sm:text-lg font-bold text-brand-primary font-mono break-all">
              {currentRoi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </p>
            <span className="text-xs text-brand-ink/50 font-mono">
              (TIR: {currentTir.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% a.a.)
            </span>
          </div>
          <span className="text-[9px] text-brand-ink/40 block mt-0.5">
            Retorno sobre o capital investido
          </span>
        </div>
      </div>
    </div>
  );
};
