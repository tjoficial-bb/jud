import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Calendar, Calculator, ShieldCheck, 
  Download, FileCheck2, ArrowUpRight, Building2, Percent, 
  Sparkles, Scale, RefreshCw, Save, CheckCircle2, AlertTriangle, 
  Clock, Check, HelpCircle, Layers, Shield, FileText, ArrowRight,
  Maximize2, Minimize2, Edit3, Coins, PieChart, Home, Info
} from 'lucide-react';
import { SmartAnalysisData } from './SmartAnalysisTab';
import { exportViabilidadeReportToPDF, exportElementToPDF } from '../utils/pdfExporter';
import { Property } from '../types';

interface ViabilidadeEstudoTabProps {
  data: SmartAnalysisData | null;
  property?: Property | null;
  onSave?: (updatedData: SmartAnalysisData) => Promise<void>;
  onTriggerAI?: () => Promise<void>;
  isAnalyzing?: boolean;
  onNavigateToSmart?: () => void;
}

export const ViabilidadeEstudoTab: React.FC<ViabilidadeEstudoTabProps> = ({
  data,
  property,
  onSave,
  onTriggerAI,
  isAnalyzing,
  onNavigateToSmart
}) => {
  const [localData, setLocalData] = useState<SmartAnalysisData>(() => data || ({} as any));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'flipping' | 'financing' | 'rental'>('flipping');

  // Keep in sync with parent updates
  React.useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const formatBRL = (val?: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);

  const formatPercent = (val?: number) => (val || 0).toFixed(1) + '%';

  // Extract / Calculate Core Metrics
  const valAval = localData.valor_avaliacao || property?.valuation_value || 0;
  const valPrimeiro = localData.primeiro_leilao_valor || valAval;
  const valSegundo = localData.segundo_leilao_valor || (valAval > 0 ? Math.round(valAval * 0.5) : 0);
  const desconto = localData.desconto_segundo_leilao || (valAval > 0 ? Math.round(((valAval - valSegundo) / valAval) * 100) : 50);

  const lance = localData.lance_planejado || valSegundo || (valAval > 0 ? Math.round(valAval * 0.5) : 0);
  const comissao = localData.comissao_leiloeiro || Math.round(lance * 0.05);
  const itbi = localData.itbi_estimado || Math.round(lance * 0.03);
  const cartorio = localData.custos_cartorarios || Math.round(lance * 0.015);
  const reforma = localData.custos_reforma || 15000;
  const desocupacao = localData.custos_desocupacao_honorarios || localData.custo_estimado_desocupacao || 5000;
  const mesesHolding = localData.meses_holding || 8;
  const iptuAtrasoVal = localData.iptu_atraso || 0;
  const condAtrasoVal = localData.condominio_atraso || 0;
  const holding = localData.holding_costs || Math.round((((iptuAtrasoVal > 0 ? iptuAtrasoVal / 12 : 350) + 
                                         (condAtrasoVal > 0 ? condAtrasoVal / 12 : 550))) * mesesHolding);
  
  const iptuAtraso = localData.responsabilidade_iptu === 'Comprador' ? (localData.iptu_atraso || 0) : 0;
  const condAtraso = localData.responsabilidade_condominio === 'Comprador' ? (localData.condominio_atraso || 0) : 0;

  const custoTotal = localData.custo_total_aquisicao || Math.round(
    lance + comissao + itbi + cartorio + reforma + desocupacao + holding + iptuAtraso + condAtraso
  );

  const revenda = localData.valor_mercado_venda || valAval || Math.round(lance * 1.85);
  const corretagemVenda = Math.round(revenda * 0.06);
  const lucroLiquido = localData.lucro_liquido_estimado || Math.round(revenda - custoTotal - corretagemVenda);
  const roi = localData.roi_estimado || (custoTotal > 0 ? Number(((lucroLiquido / custoTotal) * 100).toFixed(1)) : 0);
  const tir = localData.tir_estimada || Number((roi * 1.3).toFixed(1));

  // Financing for Final Buyer
  const entrada = localData.financiamento_entrada || Math.round(revenda * 0.20);
  const financiado = revenda - entrada;
  const sacPrimeira = localData.financiamento_sac_primeira_parcela || Math.round((financiado / 360) + (financiado * 0.0084));
  const sacUltima = localData.financiamento_sac_ultima_parcela || Math.round(financiado / 360);
  const priceFixa = localData.financiamento_price_parcela_fixa || Math.round(financiado * (0.0084 / (1 - Math.pow(1 + 0.0084, -360))));
  const rendaMinima = localData.renda_minima_familiar || Math.round(sacPrimeira / 0.30);

  // Rental Scenario (Passive Income)
  const estimativaAluguelMensal = Math.round(revenda * 0.0055); // 0.55% a.m.
  const capRateAnual = custoTotal > 0 ? Number(((estimativaAluguelMensal * 12 / custoTotal) * 100).toFixed(1)) : 6.6;

  const handleFieldChange = (key: keyof SmartAnalysisData, value: any) => {
    setLocalData(prev => {
      const updated = { ...prev, [key]: value };
      
      // Auto-recalculate derived totals if relevant fields change
      const newLance = key === 'lance_planejado' ? Number(value) : (updated.lance_planejado || lance);
      const newComissao = key === 'comissao_leiloeiro' ? Number(value) : Math.round(newLance * 0.05);
      const newItbi = key === 'itbi_estimado' ? Number(value) : Math.round(newLance * 0.03);
      const newCartorio = key === 'custos_cartorarios' ? Number(value) : Math.round(newLance * 0.015);
      const newReforma = key === 'custos_reforma' ? Number(value) : (updated.custos_reforma || reforma);
      const newDesocupacao = key === 'custos_desocupacao_honorarios' ? Number(value) : (updated.custos_desocupacao_honorarios || desocupacao);
      const newHolding = key === 'holding_costs' ? Number(value) : (updated.holding_costs || holding);
      const newRevenda = key === 'valor_mercado_venda' ? Number(value) : (updated.valor_mercado_venda || revenda);

      const newCustoTotal = Math.round(newLance + newComissao + newItbi + newCartorio + newReforma + newDesocupacao + newHolding + iptuAtraso + condAtraso);
      const newCorretagem = Math.round(newRevenda * 0.06);
      const newLucro = Math.round(newRevenda - newCustoTotal - newCorretagem);
      const newRoi = newCustoTotal > 0 ? Number(((newLucro / newCustoTotal) * 100).toFixed(1)) : 0;
      const newTir = Number((newRoi * 1.3).toFixed(1));

      return {
        ...updated,
        lance_planejado: newLance,
        comissao_leiloeiro: newComissao,
        itbi_estimado: newItbi,
        custos_cartorarios: newCartorio,
        custo_total_aquisicao: newCustoTotal,
        lucro_liquido_estimado: newLucro,
        roi_estimado: newRoi,
        tir_estimada: newTir
      };
    });
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(localData);
      setIsEditing(false);
      if ((window as any).customToast) {
        (window as any).customToast("Estudo de Viabilidade salvo com sucesso!", "success");
      }
    } catch (e: any) {
      if ((window as any).customToast) {
        (window as any).customToast("Erro ao salvar: " + e.message, "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    exportViabilidadeReportToPDF({
      property: property || undefined,
      smartAnalysis: localData,
      advisorName: "Assessoria Especializada TJ INVEST"
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="tab-estudo-viabilidade">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-brand-paper to-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-emerald-500/30 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <TrendingUp size={12} /> DOSSIÊ EXECUTIVO DE VIABILIDADE
              </span>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                TJ INVEST Inteligência Financeira
              </span>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                Emissão Oficial para PDF
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-brand-ink tracking-tight flex items-center gap-3">
              Estudo de Viabilidade Econômica & Liquidez
            </h2>
            <p className="text-xs sm:text-sm text-brand-ink/70 max-w-3xl leading-relaxed">
              Demonstrativo financeiro completo com decomposição de custos de aquisição, margem líquida do investidor, cenários de desinvestimento e simulação habitacional para compradores finais.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-start lg:self-center">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-700/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Baixar Estudo de Viabilidade em formato PDF oficial pronto para impressão"
              id="btn-viabilidade-download-pdf"
            >
              <FileCheck2 size={16} />
              <span>Baixar Dossiê em PDF</span>
            </button>

            <button
              type="button"
              onClick={() => exportElementToPDF('tab-estudo-viabilidade', 'Estudo_Viabilidade_TJ_INVEST.pdf', 'Estudo de Viabilidade Econômica & Liquidez')}
              className="flex items-center gap-2 bg-brand-bg hover:bg-black/5 text-brand-ink px-4 py-3.5 rounded-2xl text-xs font-bold transition-all border border-brand-border no-print shadow-xs cursor-pointer"
              title="Exportar tela atual para PDF"
              id="btn-viabilidade-export-screen"
            >
              <Download size={15} className="text-brand-primary" />
              <span>Exportar Tela (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border px-4 py-3.5 rounded-2xl text-xs font-bold text-brand-ink transition-all cursor-pointer"
            >
              <Calculator size={15} className="text-brand-primary" />
              <span>{isEditing ? 'Concluir Ajustes' : 'Ajustar Premissas'}</span>
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-brand-primary text-black px-5 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Premissas'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Main Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Avaliação x 2º Leilão */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border shadow-sm flex flex-col justify-between hover:border-brand-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-widest">Lance 2º Leilão (Alvo)</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              -{desconto}% OFF
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-black text-brand-ink">{formatBRL(lance)}</span>
            <div className="flex items-center gap-2 mt-1 text-xs text-brand-ink/60">
              <span>Avaliação:</span>
              <strong className="text-brand-ink">{formatBRL(valAval)}</strong>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/40 text-[11px] text-brand-ink/60 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-brand-primary" /> 2ª Praça
            </span>
            <strong className="text-brand-ink">{localData.data_segundo_leilao || 'Conforme Edital'}</strong>
          </div>
        </div>

        {/* KPI 2: Custo Total de Desembolso */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border shadow-sm flex flex-col justify-between hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-widest">Desembolso Real Total</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
              Capital Necessário
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-black text-blue-900 dark:text-blue-300">{formatBRL(custoTotal)}</span>
            <div className="text-xs text-brand-ink/60 mt-1">
              Lance + ITBI + Leiloeiro + Cartório + Obras
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/40 text-[11px] text-brand-ink/60 flex items-center justify-between">
            <span>Parcela em Lance:</span>
            <strong className="text-blue-700 dark:text-blue-300">{custoTotal > 0 ? ((lance / custoTotal) * 100).toFixed(0) : 0}%</strong>
          </div>
        </div>

        {/* KPI 3: Lucro Líquido Projetado & ROI */}
        <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/30 shadow-sm flex flex-col justify-between hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">Lucro Líquido Projetado</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Revenda
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-black text-emerald-600">{formatBRL(lucroLiquido)}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                ROI: {formatPercent(roi)}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                TIR: {formatPercent(tir)} a.a.
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-500/20 text-[11px] text-brand-ink/70 flex items-center justify-between">
            <span>Prazo de Saída:</span>
            <strong className="text-emerald-700">{localData.tempo_estimado_retorno || '6 a 12 meses'}</strong>
          </div>
        </div>

        {/* KPI 4: Simulação Habitacional Final */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border shadow-sm flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-widest">Liquidez para Comprador</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Caixa / Bancos
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-serif font-black text-amber-900 dark:text-amber-200">{formatBRL(sacPrimeira)}</span>
              <span className="text-[10px] text-brand-ink/50 font-bold">/mês</span>
            </div>
            <div className="text-xs text-brand-ink/60 mt-1">
              PRICE Fixa: <strong>{formatBRL(priceFixa)}</strong>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/40 text-[11px] text-brand-ink/70 flex items-center justify-between">
            <span>Renda Mínima:</span>
            <strong className="text-amber-800 dark:text-amber-300">{formatBRL(rendaMinima)}</strong>
          </div>
        </div>

      </div>

      {/* Main Two-Column Analysis: Costs Breakdown & Exit Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (7 cols): Itemized Acquisition Cost Structure */}
        <div className="lg:col-span-7 bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-border shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <Calculator size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-brand-ink">
                  Estrutura de Desembolso & Custos de Aquisição
                </h3>
                <p className="text-xs text-brand-ink/60">
                  Composição minuciosa do capital necessário para arrematar, regularizar e manter o imóvel.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-xl">
              {custoTotal > 0 ? ((lance / custoTotal) * 100).toFixed(0) : 0}% em lance
            </span>
          </div>

          {/* Form vs Read-only Table */}
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">1. Lance de Arrematação Alvo (R$)</label>
                <input
                  type="number"
                  value={localData.lance_planejado || lance}
                  onChange={e => handleFieldChange('lance_planejado', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-bold text-brand-primary"
                />
              </div>

              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">2. Comissão do Leiloeiro (5%)</label>
                <input
                  type="number"
                  value={localData.comissao_leiloeiro || comissao}
                  onChange={e => handleFieldChange('comissao_leiloeiro', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">3. ITBI Municipal (~3%)</label>
                <input
                  type="number"
                  value={localData.itbi_estimado || itbi}
                  onChange={e => handleFieldChange('itbi_estimado', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">4. Cartório & Registro (CRI ~1.5%)</label>
                <input
                  type="number"
                  value={localData.custos_cartorarios || cartorio}
                  onChange={e => handleFieldChange('custos_cartorarios', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">5. Custos de Reforma e Pintura (R$)</label>
                <input
                  type="number"
                  value={localData.custos_reforma || reforma}
                  onChange={e => handleFieldChange('custos_reforma', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">6. Desocupação & Honorários (R$)</label>
                <input
                  type="number"
                  value={localData.custos_desocupacao_honorarios || desocupacao}
                  onChange={e => handleFieldChange('custos_desocupacao_honorarios', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">7. Meses de Holding (Carregamento)</label>
                <input
                  type="number"
                  value={localData.meses_holding || mesesHolding}
                  onChange={e => handleFieldChange('meses_holding', parseInt(e.target.value, 10) || 8)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border">
                <label className="text-[10px] font-bold text-brand-ink/60 uppercase">8. Preço de Revenda Esperado (R$)</label>
                <input
                  type="number"
                  value={localData.valor_mercado_venda || revenda}
                  onChange={e => handleFieldChange('valor_mercado_venda', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-brand-bg border border-brand-border rounded-lg mt-1 text-xs font-bold text-emerald-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">1. Lance de Arrematação Alvo (2º Leilão):</span>
                <strong className="text-brand-ink font-mono text-sm">{formatBRL(lance)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">2. Comissão do Leiloeiro Oficial (5%):</span>
                <strong className="text-brand-ink font-mono">{formatBRL(comissao)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">3. ITBI Municipal (~3% sobre lance ou valor venal):</span>
                <strong className="text-brand-ink font-mono">{formatBRL(itbi)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">4. Registro e Emolumentos Cartorários (CRI ~1.5%):</span>
                <strong className="text-brand-ink font-mono">{formatBRL(cartorio)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">5. Reforma, Limpeza e Modernização Estética:</span>
                <strong className="text-brand-ink font-mono">{formatBRL(reforma)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">6. Desocupação, Imissão de Posse & Honorários:</span>
                <strong className="text-brand-ink font-mono">{formatBRL(desocupacao)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">
                  7. Débitos Anteriores IPTU/Condomínio ({localData.responsabilidade_iptu || 'Sub-rogado no preço'}):
                </span>
                <strong className="text-brand-ink font-mono">{formatBRL(iptuAtraso + condAtraso)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:bg-brand-bg/60 transition-all">
                <span className="font-medium text-brand-ink/80">
                  8. Custos de Carregamento (Holding {mesesHolding} meses de IPTU e condomínio):
                </span>
                <strong className="text-brand-ink font-mono">{formatBRL(holding)}</strong>
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold mt-3">
                <span className="text-xs uppercase tracking-wider">CUSTO TOTAL DE AQUISIÇÃO (DESEMBOLSO REAL):</span>
                <span className="text-lg font-mono">{formatBRL(custoTotal)}</span>
              </div>
            </div>
          )}

          <div className="pt-2 text-[11px] text-brand-ink/50 italic flex items-center gap-2">
            <Info size={13} className="text-brand-primary shrink-0" />
            <span>Todos os valores podem ser ajustados individualmente clicando em "Ajustar Premissas" acima.</span>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Exit Scenarios & Final Buyer Credit */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Scenario Selector Card */}
          <div className="bg-brand-paper p-6 sm:p-7 rounded-[2.5rem] border border-brand-border shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-emerald-600" />
                <h4 className="font-serif font-bold text-base text-brand-ink">
                  Cenários de Retorno e Saída
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                Flipping x Locação
              </span>
            </div>

            {/* Scenario Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-brand-bg rounded-2xl border border-brand-border">
              <button
                type="button"
                onClick={() => setActiveScenario('flipping')}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  activeScenario === 'flipping' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-brand-ink/60 hover:text-brand-ink'
                }`}
              >
                1. Revenda Rápida
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario('financing')}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  activeScenario === 'financing' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-brand-ink/60 hover:text-brand-ink'
                }`}
              >
                2. Financiado
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario('rental')}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  activeScenario === 'rental' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-brand-ink/60 hover:text-brand-ink'
                }`}
              >
                3. Renda Aluguel
              </button>
            </div>

            {/* Scenario Content */}
            {activeScenario === 'flipping' && (
              <div className="space-y-3 animate-in fade-in text-xs">
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-2.5">
                  <div className="flex justify-between items-center text-brand-ink/70">
                    <span>Preço Estimado de Venda:</span>
                    <strong className="text-emerald-700 font-mono text-sm">{formatBRL(revenda)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-brand-ink/70">
                    <span>(-) Corretagem Imobiliária (6%):</span>
                    <span className="text-red-500 font-mono">-{formatBRL(corretagemVenda)}</span>
                  </div>
                  <div className="flex justify-between items-center text-brand-ink/70">
                    <span>(-) Custo Total Desembolsado:</span>
                    <span className="text-red-500 font-mono">-{formatBRL(custoTotal)}</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center font-bold">
                    <span className="text-emerald-800 dark:text-emerald-300">Lucro Líquido Real:</span>
                    <span className="text-emerald-600 font-mono text-base">{formatBRL(lucroLiquido)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-brand-bg/40 rounded-xl border border-brand-border">
                    <span className="text-[10px] text-brand-ink/50 uppercase block">ROI s/ Capital</span>
                    <strong className="text-base text-emerald-600 font-bold">{formatPercent(roi)}</strong>
                  </div>
                  <div className="p-3 bg-brand-bg/40 rounded-xl border border-brand-border">
                    <span className="text-[10px] text-brand-ink/50 uppercase block">TIR Anualizada</span>
                    <strong className="text-base text-emerald-600 font-bold">{formatPercent(tir)} a.a.</strong>
                  </div>
                </div>
              </div>
            )}

            {activeScenario === 'financing' && (
              <div className="space-y-3 animate-in fade-in text-xs">
                <p className="text-[11px] text-brand-ink/70 leading-relaxed">
                  Permite vender para o maior público comprador do Brasil (famílias usando financiamento Caixa, Itaú ou Santander).
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    <span className="text-[10px] text-brand-ink/50 block">Entrada 20%</span>
                    <strong className="text-xs font-mono">{formatBRL(entrada)}</strong>
                  </div>
                  <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    <span className="text-[10px] text-brand-ink/50 block">Financiado (80%)</span>
                    <strong className="text-xs font-mono">{formatBRL(financiado)}</strong>
                  </div>
                  <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    <span className="text-[10px] text-brand-ink/50 block">SAC (1ª Parcela)</span>
                    <strong className="text-xs font-mono text-blue-700">{formatBRL(sacPrimeira)}</strong>
                  </div>
                  <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    <span className="text-[10px] text-brand-ink/50 block">PRICE (Fixa)</span>
                    <strong className="text-xs font-mono text-blue-700">{formatBRL(priceFixa)}</strong>
                  </div>
                </div>

                <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border text-[11px] text-brand-ink/70">
                  Renda familiar exigida: <strong className="text-brand-ink">{formatBRL(rendaMinima)}</strong> (comprometimento máx. de 30%).
                </div>
              </div>
            )}

            {activeScenario === 'rental' && (
              <div className="space-y-3 animate-in fade-in text-xs">
                <p className="text-[11px] text-brand-ink/70 leading-relaxed">
                  Cenário de geração de renda passiva recorrente com proteção contra inflação patrimonial.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20">
                    <span className="text-[10px] text-brand-ink/50 block">Aluguel Estimado</span>
                    <strong className="text-base text-purple-700 font-bold">{formatBRL(estimativaAluguelMensal)}/mês</strong>
                  </div>
                  <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20">
                    <span className="text-[10px] text-brand-ink/50 block">Cap Rate Anual</span>
                    <strong className="text-base text-purple-700 font-bold">{formatPercent(capRateAnual)} a.a.</strong>
                  </div>
                </div>

                <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border text-[11px] text-brand-ink/70">
                  Receita bruta anual em aluguéis: <strong>{formatBRL(estimativaAluguelMensal * 12)}</strong>.
                </div>
              </div>
            )}

          </div>

          {/* Quick PDF Action Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-[2.5rem] shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl">
                <FileCheck2 size={24} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-white">
                  Dossiê Oficial em PDF
                </h4>
                <p className="text-xs text-emerald-200/80">
                  Relatório executivo de 2 páginas pronto para impressão ou envio ao investidor.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 p-3.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.01]"
            >
              <Download size={15} />
              <span>Gerar e Baixar PDF Agora</span>
            </button>
          </div>

        </div>

      </div>

      {/* Strategic Due Diligence Cross-Check (Connected to Smart Analysis Data) */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-brand-primary" />
            <h4 className="font-serif font-bold text-base text-brand-ink">
              Checklist Estratégico & Segurança da Arrematação
            </h4>
          </div>
          {onNavigateToSmart && (
            <button
              type="button"
              onClick={onNavigateToSmart}
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Análise Smart Completa</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-brand-bg/40 rounded-xl border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-ink/50 uppercase">Ocupação do Imóvel</span>
            <div className="font-bold text-brand-ink">{localData.status_ocupacao || localData.situacao_ocupacional || 'Ocupado'}</div>
            <p className="text-[10px] text-brand-ink/60">Prazo: {localData.prazo_estimado_desocupacao || '3 a 6 meses'}</p>
          </div>

          <div className="p-3.5 bg-brand-bg/40 rounded-xl border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-ink/50 uppercase">Risco de Nulidade</span>
            <div className="font-bold text-emerald-600">{localData.risco_nulidade || localData.risco_geral_nulidade || 'Baixo'}</div>
            <p className="text-[10px] text-brand-ink/60">Preço vil afastado (&gt;50%)</p>
          </div>

          <div className="p-3.5 bg-brand-bg/40 rounded-xl border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-ink/50 uppercase">Matrícula (CRI)</span>
            <div className="font-bold text-brand-ink">{localData.status_matricula || 'Regular sem gravames'}</div>
            <p className="text-[10px] text-brand-ink/60">Matrícula nº {localData.numero_matricula || 'Consultar certidão'}</p>
          </div>

          <div className="p-3.5 bg-brand-bg/40 rounded-xl border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-ink/50 uppercase">Consolidação / Modalidade</span>
            <div className="font-bold text-brand-ink">{localData.tipo_leilao || 'Judicial'}</div>
            <p className="text-[10px] text-brand-ink/60">{localData.status_consolidacao || 'Em leilão judicial'}</p>
          </div>
        </div>
      </div>

    </div>
  );
};
