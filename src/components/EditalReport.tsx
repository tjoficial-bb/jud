import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  DollarSign, 
  Percent, 
  Calendar, 
  Scale, 
  Gavel, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building, 
  Building2, 
  Printer, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Activity,
  PenTool,
  MessageSquare,
  BookOpen,
  Sparkles,
  Calculator
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Robust types for the structured edital data
export interface EditalReportData {
  kpis: {
    avaliacao: string;
    lance_minimo: string;
    lance_minimo_subtexto?: string;
    comissao_leiloeiro: string;
    primeira_praca?: string;
    segunda_praca?: string;
  };
  valores_lances: {
    valor_avaliacao: string;
    lance_minimo_1a_praca: string;
    lance_minimo_2a_praca: string;
    percentual_minimo_2a_praca?: string;
    forma_leilao?: string;
  };
  condicoes_pagamento: {
    permite_parcelamento: string;
    entrada_minima?: string;
    num_max_parcelas?: string;
    correcao_parcelas?: string;
    garantias_exigidas?: string;
    formas_pagamento?: string;
    prazo_pagamento?: string;
    parcelamento_especifico?: string;
    tem_desconto_vista?: string;
    percentual_desconto_vista?: string;
    condicoes_diferenciadas?: string;
  };
  comissao_leiloeiro_detalhe: {
    percentual: string;
    quem_paga: string;
    momento_pagamento?: string;
  };
  responsabilidade_dividas: {
    propter_rem_no_edital: string;
    sub_rogacao_no_preco: string;
    responsabilidade_propter_rem?: string;
  };
  situacao_juridica: {
    onus_reais: string[];
  };
  penalidades_desistencia: {
    multa_inadimplencia: string;
    perda_sinal: string;
    permite_desistencia: string;
    penalidades_desistencia_detalhe?: string;
  };
  datas_importantes: {
    publicacao_edital?: string;
    primeira_praca?: string;
    segunda_praca?: string;
    inicio_lances?: string;
    fim_lances?: string;
  };
  identificacao_leilao: {
    titulo?: string;
    tipo_leilao?: string;
    modalidade?: string;
    orgao_origem?: string;
    processo?: string;
    vara?: string;
    comarca?: string;
    tribunal?: string;
  };
  leiloeiro_plataforma: {
    leiloeiro: string;
    matricula_leiloeiro?: string;
    telefone?: string;
    email?: string;
    site?: string;
    plataforma: string;
    url_plataforma?: string;
  };
  caracteristicas_imovel_edital: {
    tipo_imovel?: string;
    area_total?: string;
    quartos?: string;
    andar?: string;
    uso_destinado?: string;
    descricao_edital?: string;
    endereco?: string;
    matricula?: string;
    cartorio?: string;
    comarca_matricula?: string;
  };
  clausulas_observacoes: {
    clausulas_relevantes: string[];
    observacoes_edital: string[];
  };
}

interface EditalReportProps {
  rawAnalysis: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  valuation?: number;
}

export const EditalReport: React.FC<EditalReportProps> = ({ 
  rawAnalysis, 
  propertyAddress = '', 
  propertyCity = '', 
  propertyState = '',
  valuation = 0
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'markdown'>('dashboard');
  const [accordionState, setAccordionState] = useState<Record<string, boolean>>({
    valores_lances: true,
    condicoes_pagamento: true,
    comissao_leiloeiro: true,
    responsabilidade_dividas: true,
    situacao_juridica: true,
    penalidades: true,
    datas_importantes: true,
    identificacao_leilao: true,
    leiloeiro_plataforma: true,
    caracteristicas_imovel: true,
    clausulas_observacoes: true,
  });

  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedData, setCopiedData] = useState<string | null>(null);

  // Estados Interativos para as melhorias inteligentes sugeridas
  const [customBid, setCustomBid] = useState<number>(valuation ? valuation * 0.5 : 150000);
  const [preDiligenceChecklist, setPreDiligenceChecklist] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  const toggleAccordion = (key: string) => {
    setAccordionState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllAccordion = (open: boolean) => {
    const updated: Record<string, boolean> = {};
    Object.keys(accordionState).forEach(k => {
      updated[k] = open;
    });
    setAccordionState(updated);
  };

  // Helper to clean potential markdown wrappers from JSON string
  const cleanJsonText = (str: string): string => {
    let cleaned = str.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    // Extrai o bloco JSON que está entre a primeira chave aberta { e a última chave fechada }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // Remove vírgulas extras no final de arrays/objetos antes de fechar chaves/colchetes
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    return cleaned;
  };

  // Convert raw analysis into structured JSON block or fall back to high-quality heuristics
  const parsedData = useMemo((): { data: EditalReportData; cleanMarkdown: string } => {
    if (!rawAnalysis) {
      return {
        data: getFallbackEditalData(propertyAddress, propertyCity, propertyState, valuation),
        cleanMarkdown: ''
      };
    }

    let cleanMarkdown = rawAnalysis;
    let data: EditalReportData | null = null;

    // Search for XML-style tag: <analysis_data>...</analysis_data>
    const match = rawAnalysis.match(/<analysis_data>([\s\S]*?)<\/analysis_data>/);
    if (match) {
      try {
        const cleanedJson = cleanJsonText(match[1]);
        data = JSON.parse(cleanedJson);
        cleanMarkdown = rawAnalysis.replace(/<analysis_data>[\s\S]*?<\/analysis_data>/g, '').trim();
      } catch (err) {
        console.error("Failed to parse structured JSON block in edital analysis:", err);
      }
    }

    // Fall back to searching for raw JSON object if XML-style tags are missing
    if (!data) {
      const jsonRegex = /(\{[\s\S]*"kpis"[\s\S]*\})/i;
      const jsonMatch = rawAnalysis.match(jsonRegex);
      if (jsonMatch) {
        try {
          const cleanedJson = cleanJsonText(jsonMatch[1]);
          data = JSON.parse(cleanedJson);
          cleanMarkdown = rawAnalysis.replace(jsonMatch[1], '').trim();
        } catch (err) {
          console.error("Failed to parse fallback JSON block in edital analysis:", err);
        }
      }
    }

    // Fall back to intelligent heuristic parser if JSON not found
    if (!data) {
      data = parseEditalHeuristics(rawAnalysis, propertyAddress, propertyCity, propertyState, valuation);
    }

    return { data, cleanMarkdown };
  }, [rawAnalysis, propertyAddress, propertyCity, propertyState, valuation]);

  const data = parsedData.data;

  return (
    <div className="space-y-6 antialiased">
      {/* Header and Toggle Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-brand-primary/10 pb-4">
        <div className="flex items-center gap-2 bg-brand-bg/65 p-1.5 rounded-2xl border border-brand-primary/10 max-w-sm">
          <button 
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-brand-primary text-black' : 'text-brand-ink/65 hover:text-brand-primary'}`}
          >
            <Activity size={14} /> Painel Interativo
          </button>
          <button 
            onClick={() => setViewMode('markdown')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'markdown' ? 'bg-brand-primary text-black' : 'text-brand-ink/65 hover:text-brand-primary'}`}
          >
            <FileText size={14} /> Texto Completo
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {viewMode === 'dashboard' && (
            <>
              <button 
                onClick={() => setAllAccordion(true)}
                className="text-xs bg-brand-bg hover:bg-brand-primary/5 text-brand-primary border border-brand-primary/10 px-3 py-2 rounded-xl font-medium transition-all"
              >
                Expandir Todos
              </button>
              <button 
                onClick={() => setAllAccordion(false)}
                className="text-xs bg-brand-bg hover:bg-brand-primary/5 text-brand-primary border border-brand-primary/10 px-3 py-2 rounded-xl font-medium transition-all"
              >
                Recolher Todos
              </button>
            </>
          )}
          <button 
            onClick={() => window.print()}
            className="text-xs bg-brand-primary text-black px-4 py-2 rounded-xl font-bold hover:bg-brand-primary/95 transition-all flex items-center gap-1.5 shadow-sm shadow-brand-primary/10"
          >
            <Printer size={14} /> Imprimir Relatório
          </button>
        </div>
      </div>

      {viewMode === 'markdown' ? (
        <div className="bg-brand-paper p-6 sm:p-10 rounded-3xl border border-brand-border shadow-md select-text relative w-full">
          <div className="absolute right-4 top-4 no-print">
            <button
              onClick={() => {
                navigator.clipboard.writeText(parsedData.cleanMarkdown);
                setCopiedRaw(true);
                setTimeout(() => setCopiedRaw(false), 2000);
              }}
              className="flex items-center gap-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 text-brand-primary px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              {copiedRaw ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copiedRaw ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="markdown-body font-sans text-brand-ink/90 leading-relaxed text-sm antialiased space-y-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedData.cleanMarkdown}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. RESUMO GERAL KPI PANEL */}
          <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 shadow-md shadow-black/[0.02]">
            <div className="flex items-center gap-2 mb-6 text-brand-ink">
              <FileText className="text-brand-primary" size={20} />
              <h2 className="text-lg font-bold tracking-tight">Resumo geral</h2>
            </div>

            {/* Four Big Cards (Including Discount for Cash Payment) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Avaliação Card */}
              <div className="bg-brand-bg/40 border border-brand-border rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest block">AVALIAÇÃO</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-ink font-sans tracking-tight">{data.kpis.avaliacao}</span>
              </div>

              {/* Lance Mínimo Card */}
              <div className="bg-[#f0fdf4] dark:bg-emerald-950/25 border border-emerald-200/50 dark:border-emerald-900/10 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest block">LANCE MÍNIMO</span>
                <div className="space-y-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#15803d] dark:text-[#a7f3d0] font-sans tracking-tight block">
                    {data.kpis.lance_minimo}
                  </span>
                  {data.kpis.lance_minimo_subtexto && (
                    <span className="text-[11px] text-[#166534] dark:text-[#34d399]/85 font-bold font-mono">
                      -{data.kpis.lance_minimo_subtexto}
                    </span>
                  )}
                </div>
              </div>

              {/* Comissão Leiloeiro Card */}
              <div className="bg-brand-bg/40 border border-brand-border rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest block">COMISSÃO DO LEILOEIRO</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-ink font-sans tracking-tight">{data.kpis.comissao_leiloeiro}</span>
              </div>

              {/* Desconto à Vista Card */}
              <div className="bg-brand-bg/40 border border-brand-border rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest block">DESCONTO À VISTA</span>
                <div className="space-y-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-brand-ink font-sans tracking-tight block text-brand-primary">
                    {data.condicoes_pagamento.tem_desconto_vista === 'Sim' ? (data.condicoes_pagamento.percentual_desconto_vista || 'Sim') : (data.condicoes_pagamento.tem_desconto_vista || 'Não')}
                  </span>
                  {data.condicoes_pagamento.tem_desconto_vista === 'Sim' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                      Desconto para pagamento à vista
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Table Grid (Matching exact layout from Image 10) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-brand-border/40 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">1ª praça</span>
                <span className="font-bold text-brand-ink font-mono">{data.datas_importantes.primeira_praca || 'Não consta'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">2ª praça</span>
                <span className="font-bold text-brand-ink font-mono">{data.datas_importantes.segunda_praca || 'Não consta'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Lance mínimo 1ª praça</span>
                <span className="font-bold text-brand-ink">{data.valores_lances.lance_minimo_1a_praca}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Lance mínimo 2ª praça</span>
                <span className="font-bold text-brand-ink">{data.valores_lances.lance_minimo_2a_praca}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">% mínimo na 2ª praça</span>
                <span className="font-extrabold text-brand-ink font-mono">{data.valores_lances.percentual_minimo_2a_praca || '50%'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Permite parcelamento</span>
                <span className="font-bold text-brand-ink">{data.condicoes_pagamento.permite_parcelamento}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Comissão — quem paga</span>
                <span className="font-bold text-brand-ink">{data.comissao_leiloeiro_detalhe.quem_paga}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Dívidas propter rem</span>
                <span className="font-bold text-[#15803d] dark:text-[#a7f3d0]">{data.responsabilidade_dividas.propter_rem_no_edital === 'Sim' ? (data.responsabilidade_dividas.responsabilidade_propter_rem || 'Sub-rogadas no preço') : 'Não'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20 sm:col-span-2">
                <span className="font-semibold text-brand-ink/45">Leiloeiro</span>
                <span className="font-bold text-brand-ink">{data.leiloeiro_plataforma.leiloeiro}</span>
              </div>
              <div className="flex justify-between items-center py-2 sm:col-span-2">
                <span className="font-semibold text-brand-ink/45">Plataforma</span>
                <span className="font-bold text-brand-ink">{data.leiloeiro_plataforma.plataforma}</span>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold text-brand-ink/40 uppercase tracking-widest pl-1">detalhamento completo</h3>

          {/* 2. COMPLETENESS COLLAPSIBLE SECTIONS */}
          <div className="space-y-4">
            
            {/* Sec: Valores e lances */}
            <AccordionSection 
              id="valores_lances" 
              title="Valores e lances" 
              icon={<DollarSign size={18} className="text-orange-500" />} 
              isOpen={accordionState.valores_lances} 
              onToggle={() => toggleAccordion('valores_lances')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Valor de avaliação" value={data.valores_lances.valor_avaliacao} />
                <GridRow label="Lance mínimo 1ª praça" value={data.valores_lances.lance_minimo_1a_praca} />
                <GridRow label="Lance mínimo 2ª praça" value={data.valores_lances.lance_minimo_2a_praca} />
                <GridRow label="% mínimo na 2ª praça" value={data.valores_lances.percentual_minimo_2a_praca} />
                <GridRow label="Forma do leilão" value={data.valores_lances.forma_leilao} />
              </div>
            </AccordionSection>

            {/* Sec: Condições de pagamento */}
            <AccordionSection 
              id="condicoes_pagamento" 
              title="Condições de pagamento" 
              icon={<Calendar size={18} className="text-orange-500" />} 
              isOpen={accordionState.condicoes_pagamento} 
              onToggle={() => toggleAccordion('condicoes_pagamento')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Permite parcelamento" value={data.condicoes_pagamento.permite_parcelamento} />
                <GridRow label="Entrada mínima" value={data.condicoes_pagamento.entrada_minima} />
                <GridRow label="Nº máximo de parcelas" value={data.condicoes_pagamento.num_max_parcelas} />
                <GridRow label="Correção das parcelas" value={data.condicoes_pagamento.correcao_parcelas} />
                <GridRow label="Garantias exigidas" value={data.condicoes_pagamento.garantias_exigidas} />
                <GridRow label="Formas de pagamento" value={data.condicoes_pagamento.formas_pagamento} />
                <GridRow label="Prazo de pagamento" value={data.condicoes_pagamento.prazo_pagamento} />
                <GridRow label="Parcelamento específico" value={data.condicoes_pagamento.parcelamento_especifico} />
                <GridRow label="Desconto para pagamento à vista" value={data.condicoes_pagamento.tem_desconto_vista} />
                <GridRow label="Percentual de desconto à vista" value={data.condicoes_pagamento.percentual_desconto_vista} />
                {data.condicoes_pagamento.condicoes_diferenciadas && (
                  <div className="py-3">
                    <span className="text-[10px] font-semibold text-brand-ink/40 block mb-1 uppercase tracking-wider">Condições diferenciadas</span>
                    <p className="text-xs text-brand-ink/80 leading-relaxed">{data.condicoes_pagamento.condicoes_diferenciadas}</p>
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Sec: Comissão do leiloeiro */}
            <AccordionSection 
              id="comissao_leiloeiro" 
              title="Comissão do leiloeiro" 
              icon={<Percent size={18} className="text-orange-500" />} 
              isOpen={accordionState.comissao_leiloeiro} 
              onToggle={() => toggleAccordion('comissao_leiloeiro')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Percentual" value={data.comissao_leiloeiro_detalhe.percentual} />
                <GridRow label="Quem paga" value={data.comissao_leiloeiro_detalhe.quem_paga} />
                <GridRow label="Momento do pagamento" value={data.comissao_leiloeiro_detalhe.momento_pagamento} />
              </div>
            </AccordionSection>

            {/* Sec: Responsabilidade por dívidas (propter rem) */}
            <AccordionSection 
              id="responsabilidade_dividas" 
              title="Responsabilidade por dívidas (propter rem)" 
              icon={<Scale size={18} className="text-orange-500" />} 
              isOpen={accordionState.responsabilidade_dividas} 
              onToggle={() => toggleAccordion('responsabilidade_dividas')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Propter rem no edital" value={data.responsabilidade_dividas.propter_rem_no_edital} />
                <GridRow label="Sub-rogação no preço" value={data.responsabilidade_dividas.sub_rogacao_no_preco} />
                {data.responsabilidade_dividas.responsabilidade_propter_rem && (
                  <div className="py-3">
                    <span className="text-[10px] font-semibold text-brand-ink/40 block mb-1 uppercase tracking-wider">Responsabilidade propter rem</span>
                    <p className="text-xs text-[#b45309] dark:text-[#f59e0b] leading-relaxed font-semibold">{data.responsabilidade_dividas.responsabilidade_propter_rem}</p>
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Sec: Situação jurídica do imóvel */}
            <AccordionSection 
              id="situacao_juridica" 
              title="Situação jurídica do imóvel" 
              icon={<Scale size={18} className="text-orange-500" />} 
              isOpen={accordionState.situacao_juridica} 
              onToggle={() => toggleAccordion('situacao_juridica')}
            >
              <div className="space-y-4 text-xs font-sans">
                {data.situacao_juridica.onus_reais && data.situacao_juridica.onus_reais.length > 0 ? (
                  <div>
                    <h5 className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider mb-2">ÔNUS REAIS</h5>
                    <div className="space-y-2">
                      {data.situacao_juridica.onus_reais.map((onus, i) => (
                        <div key={i} className="bg-brand-bg/15 rounded-xl border border-brand-border p-3 flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-[#15803d] dark:text-[#a7f3d0] mt-0.5" />
                          <span className="text-brand-ink/80 font-medium">{onus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <NoData />}
              </div>
            </AccordionSection>

            {/* Sec: Penalidades e desistência */}
            <AccordionSection 
              id="penalidades" 
              title="Penalidades e desistência" 
              icon={<AlertTriangle size={18} className="text-orange-500" />} 
              isOpen={accordionState.penalidades} 
              onToggle={() => toggleAccordion('penalidades')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Multa por inadimplência" value={data.penalidades_desistencia.multa_inadimplencia} />
                <GridRow label="Perda do sinal" value={data.penalidades_desistencia.perda_sinal} />
                <GridRow label="Permite desistência" value={data.penalidades_desistencia.permite_desistencia} />
                {data.penalidades_desistencia.penalidades_desistencia_detalhe && (
                  <div className="py-3">
                    <span className="text-[10px] font-semibold text-brand-ink/40 block mb-1 uppercase tracking-wider">Penalidades por desistência</span>
                    <p className="text-xs text-brand-ink/80 leading-relaxed">{data.penalidades_desistencia.penalidades_desistencia_detalhe}</p>
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Sec: Datas importantes */}
            <AccordionSection 
              id="datas_importantes" 
              title="Datas importantes" 
              icon={<Calendar size={18} className="text-orange-500" />} 
              isOpen={accordionState.datas_importantes} 
              onToggle={() => toggleAccordion('datas_importantes')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Publicação do edital" value={data.datas_importantes.publicacao_edital} />
                <GridRow label="1ª praça" value={data.datas_importantes.primeira_praca} />
                <GridRow label="2ª praça" value={data.datas_importantes.segunda_praca} />
                <GridRow label="Início dos lances" value={data.datas_importantes.inicio_lances} />
                <GridRow label="Fim dos lances" value={data.datas_importantes.fim_lances} />
              </div>
            </AccordionSection>

            {/* Sec: Identificação do leilão */}
            <AccordionSection 
              id="identificacao_leilao" 
              title="Identificação do leilão" 
              icon={<Gavel size={18} className="text-orange-500" />} 
              isOpen={accordionState.identificacao_leilao} 
              onToggle={() => toggleAccordion('identificacao_leilao')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Título" value={data.identificacao_leilao.titulo} />
                <GridRow label="Tipo de leilão" value={data.identificacao_leilao.tipo_leilao} />
                <GridRow label="Modalidade" value={data.identificacao_leilao.modalidade} />
                <GridRow label="Órgão de origem" value={data.identificacao_leilao.orgao_origem} />
                <GridRow label="Processo" value={data.identificacao_leilao.processo} />
                <GridRow label="Vara" value={data.identificacao_leilao.vara} />
                <GridRow label="Comarca" value={data.identificacao_leilao.comarca} />
                <GridRow label="Tribunal" value={data.identificacao_leilao.tribunal} />
              </div>
            </AccordionSection>

            {/* Sec: Leiloeiro e plataforma */}
            <AccordionSection 
              id="leiloeiro_plataforma" 
              title="Leiloeiro e plataforma" 
              icon={<Building size={18} className="text-orange-500" />} 
              isOpen={accordionState.leiloeiro_plataforma} 
              onToggle={() => toggleAccordion('leiloeiro_plataforma')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Leiloeiro" value={data.leiloeiro_plataforma.leiloeiro} />
                <GridRow label="Matrícula do leiloeiro" value={data.leiloeiro_plataforma.matricula_leiloeiro} />
                <GridRow label="Telefone" value={data.leiloeiro_plataforma.telefone} />
                <GridRow label="E-mail" value={data.leiloeiro_plataforma.email} />
                <GridRow label="Site" value={data.leiloeiro_plataforma.site} />
                <GridRow label="Plataforma" value={data.leiloeiro_plataforma.plataforma} />
                <GridRow label="URL da plataforma" value={data.leiloeiro_plataforma.url_plataforma} />
              </div>
            </AccordionSection>

            {/* Sec: Características do imóvel (segundo o edital) */}
            <AccordionSection 
              id="caracteristicas_imovel" 
              title="Características do imóvel (segundo o edital)" 
              icon={<Building2 size={18} className="text-orange-500" />} 
              isOpen={accordionState.caracteristicas_imovel} 
              onToggle={() => toggleAccordion('caracteristicas_imovel')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Tipo de imóvel" value={data.caracteristicas_imovel_edital.tipo_imovel} />
                <GridRow label="Área total" value={data.caracteristicas_imovel_edital.area_total} />
                <GridRow label="Quartos" value={data.caracteristicas_imovel_edital.quartos} />
                <GridRow label="Andar" value={data.caracteristicas_imovel_edital.andar} />
                <GridRow label="Uso destinado" value={data.caracteristicas_imovel_edital.uso_destinado} />
                <GridRow label="Endereço" value={data.caracteristicas_imovel_edital.endereco} />
                <GridRow label="Matrícula" value={data.caracteristicas_imovel_edital.matricula} />
                <GridRow label="Cartório" value={data.caracteristicas_imovel_edital.cartorio} />
                <GridRow label="Comarca da matrícula" value={data.caracteristicas_imovel_edital.comarca_matricula} />
                {data.caracteristicas_imovel_edital.descricao_edital && (
                  <div className="py-3">
                    <span className="text-[10px] font-semibold text-brand-ink/40 block mb-1 uppercase tracking-wider">Descrição do edital</span>
                    <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">{data.caracteristicas_imovel_edital.descricao_edital}</p>
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Sec: Cláusulas relevantes e observações */}
            <AccordionSection 
              id="clausulas_observacoes" 
              title="Cláusulas relevantes e observações" 
              icon={<PenTool size={18} className="text-orange-500" />} 
              isOpen={accordionState.clausulas_observacoes} 
              onToggle={() => toggleAccordion('clausulas_observacoes')}
            >
              <div className="space-y-4 text-xs font-sans">
                {data.clausulas_observacoes.clausulas_relevantes && data.clausulas_observacoes.clausulas_relevantes.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider mb-2">CLÁUSULAS RELEVANTES</h5>
                    <div className="bg-brand-bg/15 rounded-2xl border border-brand-border p-4 space-y-2">
                      {data.clausulas_observacoes.clausulas_relevantes.map((cl, i) => (
                        <div key={i} className="flex gap-2 items-start text-brand-ink/80 font-semibold leading-relaxed">
                          <CheckCircle2 size={13} className="text-amber-500 mt-0.5 shrink-0" />
                          <span>{cl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.clausulas_observacoes.observacoes_edital && data.clausulas_observacoes.observacoes_edital.length > 0 && (
                  <div className="border-t border-brand-border/30 pt-3">
                    <h5 className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider mb-2">OBSERVAÇÕES DO EDITAL</h5>
                    <div className="bg-brand-bg/15 rounded-2xl border border-brand-border p-4 space-y-2">
                      {data.clausulas_observacoes.observacoes_edital.map((obs, i) => (
                        <div key={i} className="flex gap-2 items-start text-brand-ink/80 font-semibold leading-relaxed">
                          <MessageSquare size={13} className="text-blue-500 mt-0.5 shrink-0" />
                          <span>{obs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Cérebro Explicativo: Guia Jurídico e Exemplos Práticos */}
            <div className="mt-8 p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 space-y-4 font-sans">
              <div className="flex items-center gap-2 border-b border-brand-primary/10 pb-3">
                <BookOpen size={18} className="text-brand-primary" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                  Cérebro Explicativo: Guia de Regras do Edital & Exemplos Práticos
                </h4>
              </div>
              <p className="text-xs text-brand-ink/70 leading-relaxed">
                O edital é a "lei do leilão". Ele estabelece quem paga as contas, como pagar e quando. Veja as explicações dos principais conceitos extraídos deste edital:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Condições de pagamento */}
                <div className="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2">
                  <h5 className="text-xs font-bold text-orange-400">💵 Parcelamento do Lance</h5>
                  <p className="text-[11px] text-brand-ink/65 leading-relaxed">
                    Determina se o investidor pode pagar o lance de forma parcelada ou se precisa pagar 100% à vista.
                  </p>
                  <div className="text-[11px] text-brand-ink/65 space-y-1 bg-brand-primary/5 p-2 rounded-lg">
                    {data.condicoes_pagamento.permite_parcelamento?.toLowerCase().includes('sim') ? (
                      <p className="text-emerald-400 font-medium">
                        <strong>✓ Caso Prático Detectado:</strong> Este edital permite parcelamento ({data.condicoes_pagamento.num_max_parcelas || 'conforme as regras'}). Você pode oferecer um lance dando uma entrada (ex: {data.condicoes_pagamento.entrada_minima || '25%'}) e dividir o saldo em até {data.condicoes_pagamento.num_max_parcelas || 'parcelas'}.
                      </p>
                    ) : (
                      <p>
                        <strong>✗ Caso Prático Detectado:</strong> Parcelamento indisponível ou exige regras específicas. Lances à vista têm prioridade legal absoluta sobre lances parcelados de acordo com o Art. 895 do CPC.
                      </p>
                    )}
                  </div>
                </div>

                {/* Dívidas do Imóvel */}
                <div className="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2">
                  <h5 className="text-xs font-bold text-brand-primary">⚖️ Responsabilidade por Dívidas (Propter Rem)</h5>
                  <p className="text-[11px] text-brand-ink/65 leading-relaxed">
                    Define quem arca com dívidas anteriores de IPTU e condomínio (propter rem, que acompanham o imóvel).
                  </p>
                  <div className="text-[11px] text-brand-ink/65 space-y-1 bg-brand-primary/5 p-2 rounded-lg">
                    {data.responsabilidade_dividas.sub_rogacao_no_preco?.toLowerCase().includes('sim') || data.responsabilidade_dividas.propter_rem_no_edital?.toLowerCase().includes('não assume') ? (
                      <p className="text-emerald-400 font-medium">
                        <strong>✓ Caso Prático Detectado:</strong> Sub-rogação de preço ativa ou arrematante livre de dívidas. O dinheiro que você pagar pelo imóvel será usado para quitar o IPTU e o condomínio acumulados. Você receberá o imóvel limpo de débitos!
                      </p>
                    ) : (
                      <p className="text-red-400 font-medium">
                        <strong>⚠️ Caso Prático Detectado:</strong> Atenção! O edital aponta responsabilidade do arrematante pelas dívidas ou não especifica sub-rogação completa. Você precisará somar as dívidas conhecidas (IPTU/Condomínio) ao seu teto de lance máximo!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* NOVO: Campo de Análise Geral do Edital e Impactos para o Arrematante */}
            <div className="mt-8 bg-gradient-to-br from-brand-bg/40 to-brand-bg/10 rounded-3xl border border-brand-primary/20 p-6 space-y-6 font-sans">
              <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-4">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-md font-bold text-brand-ink">Análise Geral do Edital & Impactos para o Arrematante</h4>
                  <p className="text-xs text-brand-ink/50 mt-0.5">Visão consolidada de regras, facilidades financeiras, penalidades e teto de lances</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lado Esquerdo: Diagnóstico e Resumo Financeiro */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Análise de Viabilidade Financeira</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      {data.condicoes_pagamento.permite_parcelamento?.toLowerCase().includes('sim') ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-bold text-emerald-500 uppercase tracking-tight">Excelente Viabilidade (Alavancagem com Parcelamento Ativo)</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-tight">Requer Capital à Vista (Sem Parcelamento Direto)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-brand-bg/20 p-4 rounded-2xl border border-brand-border/40 space-y-2">
                    <h5 className="text-xs font-bold text-brand-ink/80">Parecer Geral das Datas e Lances:</h5>
                    <p className="text-xs text-brand-ink/70 leading-relaxed">
                      O leilão está estruturado em {data.datas_importantes.segunda_praca ? "duas praças" : "uma praça"}. 
                      A primeira praça ocorre em <strong>{data.datas_importantes.primeira_praca || "data não especificada"}</strong> pelo valor total da avaliação de <strong>{data.kpis.avaliacao || "não informado"}</strong>. 
                      A segunda praça, com desconto expressivo, está agendada para <strong>{data.datas_importantes.segunda_praca || "data não especificada"}</strong> com lance mínimo de <strong>{data.valores_lances.lance_minimo_2a_praca || data.kpis.lance_minimo || "não informado"}</strong>.
                    </p>
                  </div>

                  {data.penalidades_desistencia.multa_inadimplencia && (
                    <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 space-y-1">
                      <h5 className="text-xs font-bold text-rose-500">Multas e Penalidades por Desistência:</h5>
                      <p className="text-xs text-brand-ink/75 leading-relaxed font-medium">
                        O edital prevê multa de <strong>{data.penalidades_desistencia.multa_inadimplencia}</strong> em caso de não pagamento ou de desistência imotivada do lance. Avalie com critério o seu limite antes de ofertar para evitar sanções judiciais graves.
                      </p>
                    </div>
                  )}
                </div>

                {/* Lado Direito: Impactos Cruciais para o Arrematante */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Impactos Práticos para o Comprador</span>
                  
                  <div className="space-y-3">
                    {/* Comissão */}
                    <div className="flex gap-3 text-xs leading-relaxed">
                      <div className="mt-1 flex-shrink-0 text-brand-primary">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-brand-ink/80">
                        <strong>Comissão do Leiloeiro:</strong> O arrematante deve pagar <strong>{data.kpis.comissao_leiloeiro || '5%'}</strong> sobre o valor do lance vencedor diretamente ao leiloeiro oficial. Este valor não está embutido no lance e deve ser pago imediatamente (geralmente em até 24h ou 48h).
                      </p>
                    </div>

                    {/* Dívidas */}
                    <div className="flex gap-3 text-xs leading-relaxed">
                      <div className="mt-1 flex-shrink-0 text-brand-primary">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-brand-ink/80">
                        <strong>Dívidas de IPTU e Condomínio:</strong> {data.responsabilidade_dividas.sub_rogacao_no_preco?.toLowerCase().includes('sim') || data.responsabilidade_dividas.propter_rem_no_edital?.toLowerCase().includes('não assume')
                          ? "Há previsão expressa de sub-rogação dos débitos anteriores sobre o preço do lance vencedor. O comprador adquire o imóvel livre de débitos anteriores de IPTU/Condomínio."
                          : "Atenção redobrada! Caso as dívidas propter rem de condomínio e IPTU não fiquem sub-rogadas no preço conforme este edital, elas acompanharão o imóvel e serão cobradas do novo adquirente."}
                      </p>
                    </div>

                    {/* Desocupação */}
                    <div className="flex gap-3 text-xs leading-relaxed">
                      <div className="mt-1 flex-shrink-0 text-brand-primary">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-brand-ink/80">
                        <strong>Desocupação e Posse:</strong> Caso o imóvel esteja ocupado por devedores ou inquilinos, a desocupação é de responsabilidade do arrematante. Em leilões judiciais, o juiz do processo emite uma <em>Imissão na Posse</em> facilitada. Em extrajudiciais, pode demandar ação própria de reintegração de posse.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* NOVO: Simulador de Lance Máximo e Checklist Pré-Leilão */}
              <div className="border-t border-brand-primary/10 pt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Simulador Inteligente de Margem de Lucro */}
                  <div className="bg-brand-primary/[0.03] rounded-2xl border border-brand-primary/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Calculator size={16} className="text-brand-primary" />
                      <h5 className="text-sm font-bold text-brand-ink">Simulador Inteligente de Margem de Lucro</h5>
                    </div>
                    <p className="text-xs text-brand-ink/65 leading-relaxed">
                      Simule o desconto real em relação ao valor de avaliação e veja o custo total estimado de aquisição:
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 mb-1">
                          Seu Lance Proposto (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-brand-ink/40">R$</span>
                          <input
                            type="number"
                            className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-brand-border bg-brand-bg text-brand-ink focus:outline-none focus:border-brand-primary"
                            value={customBid}
                            onChange={(e) => setCustomBid(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="divide-y divide-brand-border/30 text-xs pt-1">
                        <div className="py-2 flex justify-between">
                          <span className="text-brand-ink/60">Avaliação de Mercado:</span>
                          <span className="font-mono font-medium">R$ {(valuation || 300000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-brand-ink/60">Lance Simulado:</span>
                          <span className="font-mono font-medium text-brand-primary font-bold">R$ {customBid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-brand-ink/60">Desconto Bruto:</span>
                          <span className="font-mono font-medium text-emerald-500 font-bold">
                            {valuation ? `${(((valuation - customBid) / valuation) * 100).toFixed(1)}%` : '50.0%'} de desconto
                          </span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-brand-ink/60">Custos Iniciais (Comissão + ITBI + Registro 9.2%):</span>
                          <span className="font-mono font-medium">R$ {(customBid * 0.092).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="py-3 flex justify-between font-bold text-brand-primary border-t-2 border-brand-primary/20">
                          <span>INVESTIMENTO TOTAL ESTIMADO:</span>
                          <span className="font-mono">R$ {(customBid + (customBid * 0.092)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Pré-Arrematação */}
                  <div className="bg-brand-primary/[0.03] rounded-2xl border border-brand-primary/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-brand-primary" />
                      <h5 className="text-sm font-bold text-brand-ink">Diligência Pré-Leilão (Checklist de Segurança)</h5>
                    </div>
                    <p className="text-xs text-brand-ink/65 leading-relaxed">
                      Complete estas etapas de verificação cruciais antes do dia do leilão para evitar surpresas judiciais ou financeiras:
                    </p>

                    <div className="space-y-2.5">
                      {[
                        { id: 1, label: "Fazer vistoria externa da vizinhança e fachada do imóvel.", desc: "Avalie o estado de conservação, segurança da rua e se está ocupado." },
                        { id: 2, label: "Verificar a existência de ações judiciais de defesa do devedor.", desc: "Checar se há Embargos à Execução ou Ações Anulatórias ativas de alto risco." },
                        { id: 3, label: "Consultar débitos de IPTU na prefeitura municipal.", desc: "Descubra se há dívidas tributárias passadas que não estão sub-rogadas no edital." },
                        { id: 4, label: "Solicitar declaração de inexistência de débitos ao condomínio.", desc: "Evita cobranças surpresa de cotas condominiais atrasadas de caráter propter rem." },
                        { id: 5, label: "Confirmar edital com advogado especialista em leilões.", desc: "Garanta uma análise fria sobre a segurança jurídica global da venda." },
                      ].map((step) => (
                        <div key={step.id} className="flex items-start gap-3 text-xs">
                          <input
                            type="checkbox"
                            id={`pre-step-check-${step.id}`}
                            className="mt-1 h-3.5 w-3.5 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                            checked={!!preDiligenceChecklist[step.id]}
                            onChange={(e) => {
                              setPreDiligenceChecklist(prev => ({ ...prev, [step.id]: e.target.checked }));
                            }}
                          />
                          <label htmlFor={`pre-step-check-${step.id}`} className="cursor-pointer select-none">
                            <span className={`font-semibold block ${preDiligenceChecklist[step.id] ? 'line-through text-brand-ink/40' : 'text-brand-ink'}`}>
                              {step.id}. {step.label}
                            </span>
                            <span className={`text-[11px] block mt-0.5 ${preDiligenceChecklist[step.id] ? 'text-brand-ink/30' : 'text-brand-ink/50'}`}>
                              {step.desc}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sugestão Inteligente (Aumentando inteligência da análise) */}
              <div className="mt-4 pt-4 border-t border-brand-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-brand-primary">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-brand-ink">💡 Sugestão Inteligente de Margem de Lucro</h5>
                    <p className="text-[11px] text-brand-ink/70 leading-relaxed mt-0.5">
                      Para uma arrematação segura, some ao valor máximo do seu lance: a comissão do leiloeiro (5%), o custo do ITBI (geralmente 2% a 4%), as taxas de registro cartorário e uma reserva de contingência (cerca de 5% a 10% para eventuais reformas ou desocupação).
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// Help sub components
interface AccordionSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ 
  id, 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children 
}) => {
  return (
    <div className="bg-brand-paper border border-brand-border rounded-3xl overflow-hidden shadow-sm shadow-black/[0.01]">
      <button 
        type="button"
        onClick={onToggle}
        className="w-full text-left p-5 flex items-center justify-between gap-3 text-brand-ink hover:bg-brand-primary/[0.02] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-1 w-7 h-7 flex items-center justify-center bg-brand-primary/10 rounded-lg">
            {icon}
          </div>
          <span className="font-bold text-sm tracking-tight text-brand-ink">{title}</span>
        </div>
        <div className="text-brand-ink/40">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-brand-border/40 bg-brand-bg/5 antialiased shadow-none break-words">
          {children}
        </div>
      )}
    </div>
  );
};

const GridRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 py-3 gap-1 font-sans leading-relaxed text-[13px]">
      <span className="font-semibold text-brand-ink/50 uppercase text-[10px] sm:text-[11px] tracking-wider font-sans">{label}</span>
      <div className="flex items-center justify-between sm:justify-start gap-2">
        <span className="text-brand-ink font-bold break-all leading-tight text-[13px]">{value || 'Não consta'}</span>
        {value && value !== 'Não' && value !== 'Não consta' && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-990/10 dark:text-emerald-400 rounded-full uppercase tracking-wider font-sans border border-emerald-200/50 scale-90">ALTO</span>
        )}
      </div>
    </div>
  );
};

const NoData: React.FC = () => (
  <div className="py-4 text-center text-xs text-brand-ink/40 font-semibold uppercase tracking-wider">
    Nenhum dado extraído para este segmento
  </div>
);

// Fallback generator for Edital Report
function parseEditalHeuristics(
  text: string, 
  address: string, 
  city: string, 
  state: string,
  valuation: number
): EditalReportData {
  const result = getFallbackEditalData(address, city, state, valuation);
  
  if (!text) return result;

  try {
    // Basic regex parsers corresponding to common patterns in the edital text
    const valuationMatch = text.match(/(?:avaliação|avaliado|valor da avaliação)\s*(?:nº|:)?\s*R\$\s*(\d[\d\.\,]*)/i);
    if (valuationMatch) {
      result.kpis.avaliacao = `R$ ${valuationMatch[1]}`;
      result.valores_lances.valor_avaliacao = `R$ ${valuationMatch[1]}`;
    }

    const firstAuction = text.match(/(?:1ª\s*praça|1º\s*leilão|primeira\s*praça)\s*(?:realizar-se-á|em|dia|:)?\s*(\d{2}[\d\.\-\/]*)/i);
    if (firstAuction) {
      result.datas_importantes.primeira_praca = firstAuction[1];
      result.kpis.primeira_praca = firstAuction[1];
    }

    const secondAuction = text.match(/(?:2ª\s*praça|2º\s*leilão|segunda\s*praça)\s*(?:realizar-se-á|em|dia|:)?\s*(\d{2}[\d\.\-\/]*)/i);
    if (secondAuction) {
      result.datas_importantes.segunda_praca = secondAuction[1];
      result.kpis.segunda_praca = secondAuction[1];
    }

    const processMatch = text.match(/\d{7}\-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g);
    if (processMatch && result.identificacao_leilao) {
      result.identificacao_leilao.processo = processMatch[0];
    }

    const commissionMatch = text.match(/(?:comissão|comissao)\s*(?:do leiloeiro|de)?\s*(\d+)%/i);
    if (commissionMatch) {
      result.kpis.comissao_leiloeiro = `${commissionMatch[1]}%`;
      result.comissao_leiloeiro_detalhe.percentual = `${commissionMatch[1]}%`;
    }
  } catch (err) {
    console.error("Heuristics parsing fallback failed moderately inside EditalReport", err);
  }

  return result;
}

function getFallbackEditalData(
  address: string, 
  city: string, 
  state: string,
  valuation: number
): EditalReportData {
  const formattedValuation = valuation > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valuation) : 'Não informado';
  const displayAddress = address || 'Não informado';
  const displayLocation = (city && state) ? `${city}/${state}` : (city || state || 'Não informada');

  return {
    kpis: {
      avaliacao: formattedValuation,
      lance_minimo: 'A definir (consulte edital)',
      lance_minimo_subtexto: 'Sob consulta',
      comissao_leiloeiro: '5%',
      primeira_praca: 'Não informada',
      segunda_praca: 'Não informada'
    },
    valores_lances: {
      valor_avaliacao: formattedValuation,
      lance_minimo_1a_praca: '100% da avaliação',
      lance_minimo_2a_praca: '50% da avaliação',
      percentual_minimo_2a_praca: '50%',
      forma_leilao: 'Eletrônico'
    },
    condicoes_pagamento: {
      permite_parcelamento: 'Não informado',
      entrada_minima: 'Não informado',
      num_max_parcelas: 'Não informado',
      correcao_parcelas: 'Não informado',
      garantias_exigidas: 'Não informado',
      formas_pagamento: 'Não informado',
      prazo_pagamento: 'Não informado',
      parcelamento_especifico: 'Não informado',
      tem_desconto_vista: 'Não informado',
      percentual_desconto_vista: 'Não informado',
      condicoes_diferenciadas: 'Não informado'
    },
    comissao_leiloeiro_detalhe: {
      percentual: '5%',
      quem_paga: 'Arrematante',
      momento_pagamento: 'Não informado'
    },
    responsabilidade_dividas: {
      propter_rem_no_edital: 'Não informado',
      sub_rogacao_no_preco: 'Não informado',
      responsabilidade_propter_rem: 'Mapeamento pendente. Verifique a análise textual.'
    },
    situacao_juridica: {
      onus_reais: [
        'Mapeamento pendente. Verifique a análise textual.'
      ]
    },
    penalidades_desistencia: {
      multa_inadimplencia: 'Não informado',
      perda_sinal: 'Não informado',
      permite_desistencia: 'Não informado',
      penalidades_desistencia_detalhe: 'Não informado'
    },
    datas_importantes: {
      publicacao_edital: 'Não informada',
      primeira_praca: 'Não informada',
      segunda_praca: 'Não informada',
      inicio_lances: 'Não informada',
      fim_lances: 'Não informada'
    },
    identificacao_leilao: {
      titulo: 'EDITAL DE LEILÃO',
      tipo_leilao: 'Não informado',
      modalidade: 'Eletrônico',
      orgao_origem: 'Não informado',
      processo: 'Não informado',
      vara: 'Não informada',
      comarca: displayLocation,
      tribunal: 'Não informado'
    },
    leiloeiro_plataforma: {
      leiloeiro: 'Não informado',
      matricula_leiloeiro: 'Não informado',
      telefone: 'Não informado',
      email: 'Não informado',
      site: 'Não informado',
      plataforma: 'Não informado',
      url_plataforma: 'Não informado'
    },
    caracteristicas_imovel_edital: {
      tipo_imovel: 'Não informado',
      area_total: 'Não informado',
      quartos: 'Não informado',
      andar: 'Não informado',
      uso_destinado: 'Não informado',
      descricao_edital: 'Mapeamento pendente. Verifique o texto completo da análise.',
      endereco: displayAddress,
      matricula: 'Não informado',
      cartorio: 'Não informado',
      comarca_matricula: displayLocation
    },
    clausulas_observacoes: {
      clausulas_relevantes: [
        'Mapeamento pendente. Verifique a análise textual.'
      ],
      observacoes_edital: [
        'Mapeamento pendente. Verifique a análise textual.'
      ]
    }
  };
}
