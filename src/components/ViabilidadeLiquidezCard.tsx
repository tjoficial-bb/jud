import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, Calendar, Calculator, ShieldCheck, 
  Download, FileCheck2, ChevronDown, ChevronUp, AlertCircle, 
  ArrowUpRight, Building2, Percent, Sparkles, Scale, RefreshCw
} from 'lucide-react';
import { SmartAnalysisData } from './SmartAnalysisTab';
import { exportViabilidadeReportToPDF } from '../utils/pdfExporter';
import { Property } from '../types';

interface ViabilidadeLiquidezCardProps {
  data: SmartAnalysisData;
  property?: Property | null;
  onChange?: (key: keyof SmartAnalysisData, val: any) => void;
  onSave?: () => Promise<void>;
}

export const ViabilidadeLiquidezCard: React.FC<ViabilidadeLiquidezCardProps> = ({
  data,
  property,
  onChange,
  onSave
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingCosts, setIsEditingCosts] = useState(false);

  const formatBRL = (val?: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);

  const formatPercent = (val?: number) => (val || 0).toFixed(1) + '%';

  const valAval = data.valor_avaliacao || property?.valuation_value || 0;
  const valPrimeiro = data.primeiro_leilao_valor || valAval;
  const valSegundo = data.segundo_leilao_valor || (valAval > 0 ? Math.round(valAval * 0.5) : 0);
  const desconto = data.desconto_segundo_leilao || (valAval > 0 ? Math.round(((valAval - valSegundo) / valAval) * 100) : 50);

  const lance = data.lance_planejado || valSegundo || (valAval > 0 ? Math.round(valAval * 0.5) : 0);
  const comissao = data.comissao_leiloeiro || Math.round(lance * 0.05);
  const itbi = data.itbi_estimado || Math.round(lance * 0.03);
  const cartorio = data.custos_cartorarios || Math.round(lance * 0.015);
  const reforma = data.custos_reforma || 15000;
  const desocupacao = data.custos_desocupacao_honorarios || data.custo_estimado_desocupacao || 5000;
  const holding = data.holding_costs || 5000;
  const iptuAtraso = data.responsabilidade_iptu === 'Comprador' ? (data.iptu_atraso || 0) : 0;
  const condAtraso = data.responsabilidade_condominio === 'Comprador' ? (data.condominio_atraso || 0) : 0;

  const custoTotal = data.custo_total_aquisicao || Math.round(lance + comissao + itbi + cartorio + reforma + desocupacao + holding + iptuAtraso + condAtraso);
  const revenda = data.valor_mercado_venda || valAval || Math.round(lance * 1.85);
  const corretagemVenda = Math.round(revenda * 0.06);
  const lucroLiquido = data.lucro_liquido_estimado || Math.round(revenda - custoTotal - corretagemVenda);
  const roi = data.roi_estimado || (custoTotal > 0 ? Number(((lucroLiquido / custoTotal) * 100).toFixed(1)) : 0);
  const tir = data.tir_estimada || Number((roi * 1.3).toFixed(1));

  // Financing
  const entrada = data.financiamento_entrada || Math.round(revenda * 0.20);
  const financiado = revenda - entrada;
  const sacPrimeira = data.financiamento_sac_primeira_parcela || Math.round((financiado / 360) + (financiado * 0.0084));
  const sacUltima = data.financiamento_sac_ultima_parcela || Math.round(financiado / 360);
  const priceFixa = data.financiamento_price_parcela_fixa || Math.round(financiado * (0.0084 / (1 - Math.pow(1 + 0.0084, -360))));
  const rendaMinima = data.renda_minima_familiar || Math.round(sacPrimeira / 0.30);

  const handleDownloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportViabilidadeReportToPDF({
      property: property || undefined,
      smartAnalysis: data,
      advisorName: "Assessoria Especializada TJ INVEST"
    });
  };

  const updateNumberField = (field: keyof SmartAnalysisData, valStr: string) => {
    if (!onChange) return;
    const num = parseFloat(valStr.replace(/\D/g, '')) || 0;
    onChange(field, num);
  };

  return (
    <div className="bg-brand-paper rounded-[2rem] border-2 border-emerald-500/20 shadow-sm overflow-hidden" id="card-viabilidade-liquidez">
      {/* Header Banner */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 sm:p-7 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-emerald-950/20 via-brand-bg/30 to-brand-bg/10 hover:bg-emerald-500/5 transition-colors cursor-pointer border-b border-brand-border"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ESTUDO DE VIABILIDADE & LIQUIDEZ
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Projeção Financeira Completa
              </span>
            </div>
            <h4 className="font-serif font-bold text-xl text-brand-ink mt-1 flex items-center gap-2">
              Viabilidade Econômica, Custos de Aquisição & Financiamento Final
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
            title="Exportar Estudo de Viabilidade completo em PDF oficial TJ INVEST"
          >
            <Download size={14} />
            <span>Baixar Dossiê PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditingCosts(!isEditingCosts)}
            className="p-2 px-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border rounded-xl text-xs font-bold text-brand-ink flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Calculator size={14} className="text-brand-primary" />
            <span>{isEditingCosts ? 'Concluir Ajustes' : 'Ajustar Premissas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-brand-ink/50 hover:text-brand-primary rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
          >
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Avaliação vs 2º Leilão */}
            <div className="bg-brand-bg/30 p-4 rounded-2xl border border-brand-border flex flex-col justify-between">
              <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Avaliação x 2º Leilão</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-serif text-brand-ink">{formatBRL(lance)}</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  -{desconto}%
                </span>
              </div>
              <p className="text-[11px] text-brand-ink/60 mt-1">
                Avaliação: <strong className="text-brand-ink">{formatBRL(valAval)}</strong>
              </p>
              <div className="text-[10px] text-brand-ink/50 mt-1 flex items-center gap-1">
                <Calendar size={12} className="text-brand-primary" />
                <span>2ª Praça: {data.data_segundo_leilao || 'Conforme Edital'}</span>
              </div>
            </div>

            {/* KPI 2: Custo Total de Aquisição */}
            <div className="bg-brand-bg/30 p-4 rounded-2xl border border-brand-border flex flex-col justify-between">
              <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Custo Total de Aquisição</span>
              <div className="mt-1">
                <span className="text-xl font-bold font-serif text-blue-900 dark:text-blue-200">{formatBRL(custoTotal)}</span>
              </div>
              <p className="text-[11px] text-brand-ink/60 mt-1">
                Lance + Leiloeiro + ITBI + Registro + Reforma
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                Capital Total a Desembolsar
              </span>
            </div>

            {/* KPI 3: Lucro Líquido & ROI */}
            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Lucro Líquido Projetado</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-serif text-emerald-600">{formatBRL(lucroLiquido)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  ROI: {formatPercent(roi)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  TIR: {formatPercent(tir)} a.a.
                </span>
              </div>
              <span className="text-[10px] text-brand-ink/60 mt-1">
                Prazo estimado de saída: <strong>{data.tempo_estimado_retorno || '6 a 12 meses'}</strong>
              </span>
            </div>

            {/* KPI 4: Financiamento Comprador Final */}
            <div className="bg-brand-bg/30 p-4 rounded-2xl border border-brand-border flex flex-col justify-between">
              <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Liquidez Comprador Final</span>
              <div className="mt-1">
                <span className="text-xl font-bold font-serif text-amber-900 dark:text-amber-200">{formatBRL(sacPrimeira)}</span>
                <span className="text-[10px] text-brand-ink/50 ml-1">/mês (SAC)</span>
              </div>
              <p className="text-[11px] text-brand-ink/60 mt-1">
                Parcela PRICE fixa: <strong>{formatBRL(priceFixa)}</strong>
              </p>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                Renda familiar mínima: <strong>{formatBRL(rendaMinima)}</strong>
              </span>
            </div>
          </div>

          {/* Detailed Financial Tables & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            
            {/* LEFT: Tabela de Composição de Custos de Aquisição */}
            <div className="bg-brand-bg/20 p-5 sm:p-6 rounded-2xl border border-brand-border space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-brand-primary" />
                  <h5 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Estrutura de Desembolso (Custos Detalhados)
                  </h5>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                  {custoTotal > 0 ? ((lance / custoTotal) * 100).toFixed(0) : 0}% em lance
                </span>
              </div>

              {isEditingCosts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">Lance Planejado (R$)</label>
                    <input
                      type="number"
                      value={data.lance_planejado || lance}
                      onChange={e => onChange?.('lance_planejado', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">Comissão Leiloeiro (5%)</label>
                    <input
                      type="number"
                      value={data.comissao_leiloeiro || comissao}
                      onChange={e => onChange?.('comissao_leiloeiro', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">ITBI Estimado (R$)</label>
                    <input
                      type="number"
                      value={data.itbi_estimado || itbi}
                      onChange={e => onChange?.('itbi_estimado', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">Cartório & Registro (R$)</label>
                    <input
                      type="number"
                      value={data.custos_cartorarios || cartorio}
                      onChange={e => onChange?.('custos_cartorarios', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">Reforma Estimada (R$)</label>
                    <input
                      type="number"
                      value={data.custos_reforma || reforma}
                      onChange={e => onChange?.('custos_reforma', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">Desocupação & Honorários (R$)</label>
                    <input
                      type="number"
                      value={data.custos_desocupacao_honorarios || desocupacao}
                      onChange={e => onChange?.('custos_desocupacao_honorarios', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">Valor de Revenda Esperado (R$)</label>
                    <input
                      type="number"
                      value={data.valor_mercado_venda || revenda}
                      onChange={e => onChange?.('valor_mercado_venda', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase">Holding Costs / Carregamento (R$)</label>
                    <input
                      type="number"
                      value={data.holding_costs || holding}
                      onChange={e => onChange?.('holding_costs', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border bg-brand-bg rounded-lg mt-1 text-xs font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">1. Lance de Arrematação Alvo:</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(lance)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">2. Comissão Leiloeiro Oficial (5%):</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(comissao)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">3. ITBI Municipal (~3%):</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(itbi)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">4. Registro da Carta de Arrematação (CRI):</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(cartorio)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">5. Reforma, Pintura e Modernização:</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(reforma)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">6. Desocupação / Honorários Advocatícios:</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(desocupacao)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">7. Débitos IPTU/Condomínio (Arrematante):</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(iptuAtraso + condAtraso)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">8. Holding Costs (IPTU/Cond. 8 meses):</span>
                    <strong className="text-brand-ink font-mono">{formatBRL(holding)}</strong>
                  </div>
                  <div className="flex justify-between py-2 pt-3 border-t-2 border-brand-primary/20 font-bold bg-brand-primary/5 px-2 rounded-lg">
                    <span className="text-brand-primary">CUSTO TOTAL DE AQUISIÇÃO:</span>
                    <span className="text-brand-primary text-sm font-mono">{formatBRL(custoTotal)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Simulação Comprador Final (SAC vs PRICE) & Retorno */}
            <div className="bg-brand-bg/20 p-5 sm:p-6 rounded-2xl border border-brand-border space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-emerald-600" />
                    <h5 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                      Simulação de Saída para o Comprador Final
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700">
                    Venda Caixa / Bancos
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">Valor de Revenda Projetado:</span>
                    <strong className="text-emerald-600 font-mono text-sm">{formatBRL(revenda)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">(-) Corretagem Imobiliária (6%):</span>
                    <span className="text-red-500 font-mono">-{formatBRL(corretagemVenda)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-border/30">
                    <span className="text-brand-ink/70">(-) Custo Total Desembolsado:</span>
                    <span className="text-red-500 font-mono">-{formatBRL(custoTotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-emerald-500/30 bg-emerald-500/10 px-2 rounded-lg font-bold">
                    <span className="text-emerald-700">LUCRO LÍQUIDO REAL DO ARREMATANTE:</span>
                    <span className="text-emerald-700 text-sm font-mono">{formatBRL(lucroLiquido)}</span>
                  </div>
                </div>

                {/* Box de Financiamento */}
                <div className="bg-brand-paper p-4 rounded-xl border border-brand-border space-y-2.5 mt-2">
                  <div className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                    <span>Viabilidade do Comprador Final (Financiamento)</span>
                    <span className="text-brand-primary font-bold">Taxa ~10.5% a.a.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-brand-bg/40 rounded-lg">
                      <span className="text-[10px] text-brand-ink/50 block">Entrada 20%</span>
                      <strong className="font-mono text-xs">{formatBRL(entrada)}</strong>
                    </div>
                    <div className="p-2.5 bg-brand-bg/40 rounded-lg">
                      <span className="text-[10px] text-brand-ink/50 block">Financiado (80%)</span>
                      <strong className="font-mono text-xs">{formatBRL(financiado)}</strong>
                    </div>
                    <div className="p-2.5 bg-brand-bg/40 rounded-lg">
                      <span className="text-[10px] text-brand-ink/50 block">Tabela SAC (1ª Parcela)</span>
                      <strong className="font-mono text-xs text-blue-600">{formatBRL(sacPrimeira)}</strong>
                    </div>
                    <div className="p-2.5 bg-brand-bg/40 rounded-lg">
                      <span className="text-[10px] text-brand-ink/50 block">Tabela PRICE (Fixa)</span>
                      <strong className="font-mono text-xs text-blue-600">{formatBRL(priceFixa)}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-brand-ink/60 pt-1">
                    Renda familiar recomendada para aprovação do comprador: <strong className="text-brand-ink">{formatBRL(rendaMinima)}</strong>
                  </p>
                </div>
              </div>

              {/* Botão de Download integrado no pé do card */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <FileCheck2 size={16} />
                  <span>Gerar & Baixar Estudo de Viabilidade em PDF (Completo)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
