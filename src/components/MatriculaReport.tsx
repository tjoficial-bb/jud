import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Users, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Printer, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Gavel, 
  Calculator, 
  TrendingUp, 
  Building,
  Activity,
  Award,
  DollarSign
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Robust types for the structured matrícula data
export interface MatriculaReportData {
  kpis: {
    num_vendas: number;
    ultimo_venda_valor: string;
    num_onus_ativos: number;
    num_processos_judiciais: number;
  };
  proprietario_atual: string[];
  proprietarios_anteriores: Array<{ nome: string; documento?: string }>;
  valores_transacao: Array<{ valor: string; data?: string }>;
  imovel_tipo?: string;
  localizacao_resumo?: string;
  identificacao_matricula?: {
    numero_matricula?: string;
    cadastro_imobiliario?: string;
    inscricao_municipal?: string;
    codigo_cartografico?: string;
    cartorio?: string;
    comarca?: string;
    uf?: string;
    livro?: string;
  };
  caracteristicas_fisicas?: {
    tipo_imovel?: string;
    categoria?: string;
    endereco?: string;
    area_total?: string;
    fracao_ideal?: string;
    unidade_autonoma?: string;
    valor_fiscal?: string;
    cadastro_imobiliario?: string;
    inscricao_imobiliaria?: string;
    descricao_completa?: string;
  };
  condominio?: {
    nome?: string;
  };
  cadeia_registral?: Array<{
    tipo: string;
    data?: string;
    valor?: string;
    descricao?: string;
    partes?: string;
    natureza?: string;
    impacto?: string;
  }>;
  proprietarios_e_partes?: {
    atuais?: Array<{ nome: string; documento?: string; tipo?: string; participacao?: string; estado_civil?: string; regime?: string; detalhes?: string }>;
    anteriores?: Array<{ nome: string; documento?: string; tipo?: string; detalhes?: string }>;
    credores?: Array<{ nome: string; documento?: string; tipo?: string; detalhes?: string }>;
  };
  onus_gravames?: Array<{
    tipo?: string;
    status?: string;
    subtipo?: string;
    prioridade?: string;
    valor?: string;
    credor?: string;
    devedor?: string;
    data_constituicao?: string;
  }>;
  restricoes_clausulas?: {
    inalienabilidade?: string;
    impenhorabilidade?: string;
    incomunicabilidade?: string;
  };
  eventos_leilao?: Array<{
    tipo?: string;
    data?: string;
    status?: string;
    descricao?: string;
    impacto_atual?: string;
  }>;
  processos_judiciais?: Array<{
    numero?: string;
    natureza?: string;
    vara_comarca?: string;
    fase?: string;
    partes?: string;
    impacto?: string;
  }>;
  alertas?: {
    problemas_arrematacao?: string;
    pendencias_juridicas?: string;
    pontos_atencao?: string;
  };
  qualidade_analise?: {
    qualidade_ocr?: string;
    confianca_extracao?: string;
    data_analise?: string;
    arquivo_analisado?: string;
  };
}

interface MatriculaReportProps {
  rawAnalysis: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  valuation?: number;
  bidValue?: number;
}

export const MatriculaReport: React.FC<MatriculaReportProps> = ({ 
  rawAnalysis, 
  propertyAddress = '', 
  propertyCity = '', 
  propertyState = '',
  valuation = 0,
  bidValue = 0
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'markdown'>('dashboard');
  const [accordionState, setAccordionState] = useState<Record<string, boolean>>({
    identificacao: true,
    caracteristicas: true,
    condominio: true,
    cadeia: true,
    partes: true,
    onus: true,
    restricoes: true,
    eventos: true,
    processos: true,
    alertas: true,
    qualidade: true,
  });

  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedData, setCopiedData] = useState<string | null>(null);

  // Estados Interativos para as melhorias inteligentes sugeridas
  const [customBid, setCustomBid] = useState<number>(bidValue || (valuation ? valuation * 0.5 : 150000));
  const [diligenceChecklist, setDiligenceChecklist] = useState<Record<number, boolean>>({
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

  // Extract structured JSON block or fall back to high-quality heuristics
  const parsedData = useMemo((): { data: MatriculaReportData; cleanMarkdown: string } => {
    if (!rawAnalysis) {
      return {
        data: getFallbackData(propertyAddress, propertyCity, propertyState, valuation, bidValue),
        cleanMarkdown: ''
      };
    }

    let cleanMarkdown = rawAnalysis;
    let data: MatriculaReportData | null = null;

    // Search for XML-style tag: <analysis_data>...</analysis_data>
    const match = rawAnalysis.match(/<analysis_data>([\s\S]*?)<\/analysis_data>/);
    if (match) {
      try {
        const cleanedJson = cleanJsonText(match[1]);
        data = JSON.parse(cleanedJson);
        cleanMarkdown = rawAnalysis.replace(/<analysis_data>[\s\S]*?<\/analysis_data>/g, '').trim();
      } catch (err) {
        console.error("Failed to parse structured JSON block in matrix analysis:", err);
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
          console.error("Failed to parse fallback JSON block in matrix analysis:", err);
        }
      }
    }

    // Fall back to intelligent heuristic parser if JSON not found
    if (!data) {
      data = parseHeuristics(rawAnalysis, propertyAddress, propertyCity, propertyState, valuation, bidValue);
    }

    return { data, cleanMarkdown };
  }, [rawAnalysis, propertyAddress, propertyCity, propertyState, valuation, bidValue]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedData(id);
    setTimeout(() => setCopiedData(null), 2000);
  };

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
        <div className="bg-brand-paper p-6 sm:p-10 rounded-3xl border border-brand-border shadow-md select-text relative">
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

            {/* Micro KPIs Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-brand-bg/40 border border-brand-border rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest block">Transações de Venda</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-brand-ink font-sans">{data.kpis.num_vendas}</span>
                  {data.kpis.ultimo_venda_valor && (
                    <span className="text-[11px] text-emerald-500 font-bold font-mono">Último: {data.kpis.ultimo_venda_valor}</span>
                  )}
                </div>
              </div>

              <div className="bg-[#FFFDF5] dark:bg-yellow-950/10 border border-yellow-200/50 dark:border-yellow-900/10 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-yellow-600/70 dark:text-yellow-400/70 uppercase tracking-widest block">Ônus / Gravames Ativos</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 font-sans">{data.kpis.num_onus_ativos}</span>
                  <span className="text-[10px] text-yellow-600/60 dark:text-yellow-400/60 font-semibold">averbados na matrícula</span>
                </div>
              </div>

              <div className="bg-[#FFFDF5] dark:bg-yellow-950/10 border border-yellow-200/50 dark:border-yellow-900/10 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-yellow-600/70 dark:text-yellow-400/70 uppercase tracking-widest block">Processos Judiciais</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 font-sans">{data.kpis.num_processos_judiciais}</span>
                  <span className="text-[10px] text-yellow-600/60 dark:text-yellow-400/60 font-semibold">mencionados</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="space-y-4 pt-2 border-t border-brand-border/40">
              {data.proprietario_atual && data.proprietario_atual.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider block mb-1">Proprietário Atual</span>
                  <p className="text-sm font-bold text-brand-ink leading-tight">
                    {data.proprietario_atual.join(' · ')}
                  </p>
                </div>
              )}

              {data.proprietarios_anteriores && data.proprietarios_anteriores.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider block mb-1">Proprietários Anteriores</span>
                  <p className="text-xs text-brand-ink/70 leading-relaxed font-semibold">
                    {data.proprietarios_anteriores.map((p, idx) => (
                      <span key={idx} className="block sm:inline sm:after:content-['·'] sm:last:after:content-none sm:after:mx-2">
                        {p.nome} {p.documento ? `(${p.documento})` : ''}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {data.valores_transacao && data.valores_transacao.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider block mb-1.5">valores de transação</span>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {data.valores_transacao.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-500 font-mono">{t.valor}</span>
                        {t.data && <span className="text-xs text-brand-ink/40 font-mono">({t.data})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-brand-border/40">
                <div>
                  <span className="text-[10px] font-semibold text-brand-ink/45 block">Tipo do imóvel</span>
                  <span className="text-sm font-semibold text-brand-ink">{data.imovel_tipo || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-brand-ink/45 block">Localização</span>
                  <span className="text-sm font-semibold text-brand-ink">{data.localizacao_resumo || 'Não informado'}</span>
                </div>
                <div className="col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                      Inscrição Imobiliária / IPTU (Prefeitura)
                    </span>
                    <span className="text-xs font-mono font-bold text-brand-ink">
                      {data.identificacao_matricula?.cadastro_imobiliario || data.caracteristicas_fisicas?.cadastro_imobiliario || data.identificacao_matricula?.inscricao_municipal || 'Não identificada na matrícula'}
                    </span>
                  </div>
                  {(data.identificacao_matricula?.cadastro_imobiliario || data.caracteristicas_fisicas?.cadastro_imobiliario || data.identificacao_matricula?.inscricao_municipal) && (
                    <button
                      type="button"
                      onClick={() => {
                        const val = data.identificacao_matricula?.cadastro_imobiliario || data.caracteristicas_fisicas?.cadastro_imobiliario || data.identificacao_matricula?.inscricao_municipal || '';
                        navigator.clipboard.writeText(val);
                      }}
                      className="px-2 py-1 bg-amber-200/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-300 rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 shadow-xs"
                      title="Copiar número para consulta de débitos de IPTU na Prefeitura"
                    >
                      <Copy size={11} /> Copiar IPTU
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold text-brand-ink/40 uppercase tracking-widest pl-1">detalhamento completo</h3>

          {/* 2. COMPLETENESS COLLAPSIBLE SECTIONS */}
          <div className="space-y-4">
            
            {/* Sec: Identificação */}
            <AccordionSection 
              id="identificacao" 
              title="Identificação da matrícula e Cadastro Imobiliário (IPTU)" 
              icon={<FileText size={18} className="text-orange-500" />} 
              isOpen={accordionState.identificacao} 
              onToggle={() => toggleAccordion('identificacao')}
            >
              {data.identificacao_matricula ? (
                <div className="divide-y divide-brand-border/40 text-sm font-sans">
                  <GridRow label="Nº da matrícula" value={data.identificacao_matricula.numero_matricula} />
                  <GridRow 
                    label="Inscrição Imobiliária / Cadastro IPTU" 
                    value={data.identificacao_matricula.cadastro_imobiliario || data.caracteristicas_fisicas?.cadastro_imobiliario || data.identificacao_matricula.inscricao_municipal || 'Não identificada na matrícula (verificar edital)'} 
                  />
                  {data.identificacao_matricula.codigo_cartografico && (
                    <GridRow label="Código Cartográfico / SQL" value={data.identificacao_matricula.codigo_cartografico} />
                  )}
                  <GridRow label="Cartório" value={data.identificacao_matricula.cartorio} />
                  <GridRow label="Comarca" value={data.identificacao_matricula.comarca} />
                  <GridRow label="UF" value={data.identificacao_matricula.uf} />
                  <GridRow label="Livro" value={data.identificacao_matricula.livro} />
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Características físicas */}
            <AccordionSection 
              id="caracteristicas" 
              title="Características físicas" 
              icon={<TrendingUp size={18} className="text-orange-500" />} 
              isOpen={accordionState.caracteristicas} 
              onToggle={() => toggleAccordion('caracteristicas')}
            >
              {data.caracteristicas_fisicas ? (
                <div className="divide-y divide-brand-border/40 text-sm font-sans">
                  <GridRow label="Tipo do imóvel" value={data.caracteristicas_fisicas.tipo_imovel} />
                  <GridRow label="Categoria" value={data.caracteristicas_fisicas.categoria} />
                  <GridRow label="Endereço" value={data.caracteristicas_fisicas.endereco} />
                  <GridRow label="Área total" value={data.caracteristicas_fisicas.area_total} />
                  <GridRow label="Fração ideal" value={data.caracteristicas_fisicas.fracao_ideal} />
                  <GridRow label="Unidade autônoma" value={data.caracteristicas_fisicas.unidade_autonoma} />
                  <GridRow label="Valor Fiscal (Venal) do Imóvel" value={data.caracteristicas_fisicas.valor_fiscal || 'Não informado'} />
                  <div className="py-3 font-sans">
                    <span className="text-[11px] font-semibold text-brand-ink/40 block mb-1 uppercase tracking-wider">Descrição completa</span>
                    <p className="text-[13px] text-brand-ink/80 leading-relaxed font-sans">{data.caracteristicas_fisicas.descricao_completa || 'Não informada na descrição'}</p>
                  </div>
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Condomínio */}
            <AccordionSection 
              id="condominio" 
              title="Condomínio" 
              icon={<Building size={18} className="text-orange-500" />} 
              isOpen={accordionState.condominio} 
              onToggle={() => toggleAccordion('condominio')}
            >
              {data.condominio ? (
                <div className="divide-y divide-brand-border/40 text-sm font-sans">
                  <GridRow label="Condomínio" value={data.condominio.nome || 'Não consta ou não identificado'} />
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Cadeia registral */}
            <AccordionSection 
              id="cadeia" 
              title="Cadeia registral (sequência de atos)" 
              icon={<Layers size={18} className="text-orange-500" />} 
              isOpen={accordionState.cadeia} 
              onToggle={() => toggleAccordion('cadeia')}
            >
              {data.cadeia_registral && data.cadeia_registral.length > 0 ? (
                <div className="space-y-4 font-sans">
                  {data.cadeia_registral.map((ato, idx) => (
                    <div key={idx} className="bg-brand-bg/20 rounded-2xl border border-brand-border/50 p-4 relative space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/10 rounded-md tracking-wider">{ato.tipo}</span>
                          {ato.data && <span className="text-[11px] text-brand-ink/40 font-mono">{ato.data}</span>}
                        </div>
                        {ato.valor && (
                          <span className="text-sm font-bold text-emerald-500 font-mono tracking-tight">{ato.valor}</span>
                        )}
                      </div>
                      <div className="text-xs space-y-1 shadow-none">
                        {ato.descricao && <p className="font-bold text-brand-ink text-[13px]">{ato.descricao}</p>}
                        {ato.partes && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/60">Partes:</span> {ato.partes}</p>}
                        {ato.natureza && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/60">Natureza:</span> {ato.natureza}</p>}
                        {ato.impacto && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/60 font-sans">Impacto:</span> {ato.impacto}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Proprietários e partes */}
            <AccordionSection 
              id="partes" 
              title="Proprietários e partes" 
              icon={<Users size={18} className="text-orange-500" />} 
              isOpen={accordionState.partes} 
              onToggle={() => toggleAccordion('partes')}
            >
              {data.proprietarios_e_partes ? (
                <div className="space-y-6 font-sans">
                  {/* Atuais */}
                  {data.proprietarios_e_partes.atuais && data.proprietarios_e_partes.atuais.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider pl-1">Proprietários Atuais</h4>
                      <div className="space-y-2">
                        {data.proprietarios_e_partes.atuais.map((p, i) => (
                          <div key={i} className="bg-brand-bg/10 rounded-2xl border border-brand-border/40 p-4">
                            <p className="font-bold text-sm text-brand-ink leading-snug">{p.nome}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-ink/60 mt-1 pb-1">
                              {p.documento && <span className="font-mono">Doc: {p.documento}</span>}
                              {p.tipo && <span>Tipo: {p.tipo}</span>}
                              {p.participacao && <span>Part: {p.participacao}</span>}
                              {p.estado_civil && <span>Est. Civil: {p.estado_civil}</span>}
                              {p.regime && <span>Regime: {p.regime}</span>}
                            </div>
                            {p.detalhes && <p className="text-[11px] text-brand-primary leading-snug pt-1 border-t border-brand-border/20 mt-1">{p.detalhes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anteriores */}
                  {data.proprietarios_e_partes.anteriores && data.proprietarios_e_partes.anteriores.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider pl-1">Proprietários Anteriores</h4>
                      <div className="space-y-2">
                        {data.proprietarios_e_partes.anteriores.map((p, i) => (
                          <div key={i} className="bg-brand-bg/10 rounded-2xl border border-brand-border/40 p-4">
                            <p className="font-semibold text-sm text-brand-ink leading-snug">{p.nome}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-ink/60 mt-1">
                              {p.documento && <span className="font-mono">Doc: {p.documento}</span>}
                              {p.tipo && <span>Tipo: {p.tipo}</span>}
                            </div>
                            {p.detalhes && <p className="text-[11px] text-brand-ink/50 leading-snug pt-1 border-t border-brand-border/20 mt-1">{p.detalhes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Credores */}
                  {data.proprietarios_e_partes.credores && data.proprietarios_e_partes.credores.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider pl-1">Credores</h4>
                      <div className="space-y-2">
                        {data.proprietarios_e_partes.credores.map((p, i) => (
                          <div key={i} className="bg-brand-bg/10 rounded-2xl border border-brand-border/40 p-4">
                            <p className="font-bold text-sm text-brand-ink leading-snug">{p.nome}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-ink/60 mt-1">
                              {p.documento && <span className="font-mono">Doc: {p.documento}</span>}
                              {p.tipo && <span>Tipo: {p.tipo}</span>}
                            </div>
                            {p.detalhes && <p className="text-[11px] text-brand-ink/50 leading-snug pt-1 border-t border-brand-border/20 mt-1">{p.detalhes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Ônus e gravames */}
            <AccordionSection 
              id="onus" 
              title="Ônus e gravames" 
              icon={<Scale size={18} className="text-orange-500" />} 
              isOpen={accordionState.onus} 
              onToggle={() => toggleAccordion('onus')}
            >
              {data.onus_gravames && data.onus_gravames.length > 0 ? (
                <div className="space-y-3 font-sans">
                  {data.onus_gravames.map((onus, idx) => {
                    const tipoLower = (onus.tipo || '').toLowerCase();
                    const isGrav = tipoLower.includes('penhora') || tipoLower.includes('indisponibilidade') || tipoLower.includes('bloqueio') || tipoLower.includes('gravame') || tipoLower.includes('arresto') || tipoLower.includes('seqüestro') || tipoLower.includes('sequestro') || tipoLower.includes('execução');
                    
                    return (
                      <div key={idx} className={`rounded-2xl border-l-[4px] border border-brand-border p-4 space-y-2 bg-brand-bg/10 ${isGrav ? 'border-l-rose-500 bg-rose-500/[0.01]' : 'border-l-amber-500 bg-amber-500/[0.01]'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/20 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg flex items-center justify-center ${isGrav ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {isGrav ? <AlertTriangle size={14} /> : <Scale size={14} />}
                            </div>
                            <span className="font-bold text-[13px] text-brand-ink">{onus.tipo}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              isGrav 
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50' 
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50'
                            }`}>
                              {isGrav ? '🚫 GRAVAME (Restrição Judicial)' : '🔑 ÔNUS (Garantia/Encargo)'}
                            </span>
                            {onus.status && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 rounded-full">{onus.status}</span>
                            )}
                            {onus.subtipo && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-200/50 rounded-full">{onus.subtipo}</span>
                            )}
                            {onus.prioridade && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 rounded-full">{onus.prioridade}</span>
                            )}
                          </div>
                        </div>
                        
                        {onus.valor && (
                          <p className="text-md font-bold text-emerald-500 font-mono">{onus.valor}</p>
                        )}

                        <div className="text-xs space-y-1 leading-snug">
                          {onus.credor && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/50">Credor:</span> {onus.credor}</p>}
                          {onus.devedor && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/50">Devedor:</span> {onus.devedor}</p>}
                          {onus.data_constituicao && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/50">Constituído em:</span> {onus.data_constituicao}</p>}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bloco de Explicações Contextuais de Acordo com o que foi Detectado */}
                  <div className="mt-6 pt-6 border-t border-brand-border/40 space-y-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-brand-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                        Análise de Ônus e Gravames Detectados
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Explicação Geral de Ônus e Gravames */}
                      <div className="bg-brand-bg/5 p-4 rounded-xl border border-brand-border space-y-2">
                        <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider block">Conceitos Gerais</span>
                        <p className="text-xs text-brand-ink/80 leading-relaxed">
                          <strong>Ônus</strong> refere-se a encargos, obrigações ou garantias voluntárias ligadas à propriedade (como uma hipoteca ou alienação fiduciária). 
                          Já o <strong>Gravame</strong> é uma restrição forçada, de natureza judicial ou administrativa (como uma penhora ou indisponibilidade de bens).
                        </p>
                      </div>

                      {/* Explicando dinamicamente cada tipo encontrado */}
                      {data.onus_gravames.map((onus, idx) => {
                        const tipoLower = (onus.tipo || '').toLowerCase();
                        
                        if (tipoLower.includes('penhora')) {
                          return (
                            <div key={`exp-${idx}`} className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 space-y-2 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Gravame Detectado: PENHORA ({onus.tipo})</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded-full">Exigibilidade Judicial</span>
                              </div>
                              <p className="text-xs text-brand-ink/80 leading-relaxed">
                                <strong>O que é:</strong> A penhora é uma ordem judicial que bloqueia o imóvel para garantir o pagamento de uma dívida do antigo proprietário em um processo de execução.
                              </p>
                              <p className="text-xs text-brand-ink/70 leading-relaxed bg-brand-bg/50 p-2.5 rounded-lg border border-brand-border/20 italic">
                                <strong>Exemplo Prático neste caso:</strong> Como o imóvel está indo a leilão por esta ou outra dívida, o dinheiro arrecadado será prioritariamente usado para saldar os débitos. Após a arrematação, o juiz do processo emitirá um "Mandado de Cancelamento de Penhora", permitindo que você registre o imóvel livre dessa pendência.
                              </p>
                            </div>
                          );
                        }
                        
                        if (tipoLower.includes('aliena') || tipoLower.includes('fiduci')) {
                          return (
                            <div key={`exp-${idx}`} className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 space-y-2 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Ônus Detectado: ALIENAÇÃO FIDUCIÁRIA</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">Garantia Financeira</span>
                              </div>
                              <p className="text-xs text-brand-ink/80 leading-relaxed">
                                <strong>O que é:</strong> O imóvel foi financiado e a propriedade legal pertence à instituição financeira (credor fiduciário) até a quitação total da dívida.
                              </p>
                              <p className="text-xs text-brand-ink/70 leading-relaxed bg-brand-bg/50 p-2.5 rounded-lg border border-brand-border/20 italic">
                                <strong>Exemplo Prático neste caso:</strong> Se o leilão for extrajudicial (promovido pelo banco credor devido à inadimplência do comprador), o banco está leiloando a sua própria propriedade para recuperar o valor emprestado. O valor pago pelo seu lance quita esse ônus e transfere a propriedade plena para você.
                              </p>
                            </div>
                          );
                        }
                        
                        if (tipoLower.includes('hipoteca')) {
                          return (
                            <div key={`exp-${idx}`} className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 space-y-2 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Ônus Detectado: HIPOTECA</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded-full">Garantia Real</span>
                              </div>
                              <p className="text-xs text-brand-ink/80 leading-relaxed">
                                <strong>O que é:</strong> O antigo proprietário deu o imóvel como garantia de um empréstimo ou dívida corporativa, registrando esse direito real em favor do credor hipotecário.
                              </p>
                              <p className="text-xs text-brand-ink/70 leading-relaxed bg-brand-bg/50 p-2.5 rounded-lg border border-brand-border/20 italic">
                                <strong>Exemplo Prático neste caso:</strong> O credor hipotecário tem preferência para receber o dinheiro do leilão. Com o leilão concluído e homologado, o juiz determina o cancelamento (baixa) da hipoteca na matrícula, transferindo o imóvel livre de ônus ao novo comprador.
                              </p>
                            </div>
                          );
                        }
                        
                        if (tipoLower.includes('indisponibilidade')) {
                          return (
                            <div key={`exp-${idx}`} className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 space-y-2 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Gravame Detectado: INDISPONIBILIDADE DE BENS</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-full">Bloqueio Judicial</span>
                              </div>
                              <p className="text-xs text-brand-ink/80 leading-relaxed">
                                <strong>O que é:</strong> Uma ordem judicial (frequentemente via CNIB) que proíbe o devedor de vender ou transferir o imóvel para evitar fraude a credores ou ocultação de patrimônio.
                              </p>
                              <p className="text-xs text-brand-ink/70 leading-relaxed bg-brand-bg/50 p-2.5 rounded-lg border border-brand-border/20 italic">
                                <strong>Exemplo Prático neste caso:</strong> Trata-se de um gravame sério que impede a transferência direta imediata. O arrematante (ou seu advogado) deverá peticionar formalmente ao juiz que determinou a indisponibilidade, apresentando a "Carta de Arrematação" para comprovar que a aquisição ocorreu de forma pública e legítima em leilão, solicitando a baixa do gravame.
                              </p>
                            </div>
                          );
                        }
                        
                        if (tipoLower.includes('usufruto')) {
                          return (
                            <div key={`exp-${idx}`} className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-2 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Ônus Detectado: USUFRUTO ATIVO</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Direito de Uso</span>
                              </div>
                              <p className="text-xs text-brand-ink/80 leading-relaxed">
                                <strong>O que é:</strong> Um direito real que confere a outra pessoa (usufrutuária) o direito de morar ou usufruir (ex: alugar e receber o valor) do imóvel de propriedade do devedor.
                              </p>
                              <p className="text-xs text-brand-ink/70 leading-relaxed bg-brand-bg/50 p-2.5 rounded-lg border border-brand-border/20 italic">
                                <strong>Exemplo Prático neste caso:</strong> Atenção extrema! Se o leilão vender apenas a "nua-propriedade" do devedor, o usufrutuário manterá o direito de habitar o imóvel vitaliciamente. O usufruto só é cancelado se o usufrutuário falecer, renunciar ou se o próprio usufruto estiver sendo executado conjuntamente.
                              </p>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  <NoData />
                  
                  {/* Bloco de Explicações Gerais de Ônus e Gravames quando lista vazia */}
                  <div className="mt-6 pt-6 border-t border-brand-border/40 space-y-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-brand-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                        Guia Educativo: Ônus e Gravames
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-brand-bg/10 p-4 rounded-xl border border-brand-border space-y-2">
                        <h5 className="text-xs font-bold text-orange-400">⚖️ O que é um Ônus?</h5>
                        <p className="text-[11px] text-brand-ink/65 leading-relaxed">
                          É um encargo ou obrigação de caráter financeiro ou contratual que recai sobre o imóvel (como uma Hipoteca ou Alienação Fiduciária).
                        </p>
                        <p className="text-[11px] text-brand-ink/50 italic bg-brand-bg/50 p-2 rounded-lg">
                          Exemplo Prático: Um financiamento bancário pendente. No leilão, o banco utiliza o produto do leilão para extinguir essa dívida fiduciária.
                        </p>
                      </div>

                      <div className="bg-brand-bg/10 p-4 rounded-xl border border-brand-border space-y-2">
                        <h5 className="text-xs font-bold text-brand-primary">🚫 O que é um Gravame?</h5>
                        <p className="text-[11px] text-brand-ink/65 leading-relaxed">
                          É uma restrição coercitiva, ordenada pela Justiça ou pela administração pública, que bloqueia o imóvel (como uma Penhora ou Indisponibilidade).
                        </p>
                        <p className="text-[11px] text-brand-ink/50 italic bg-brand-bg/50 p-2 rounded-lg">
                          Exemplo Prático: Uma penhora decorrente de um processo trabalhista do antigo dono. Após a arrematação, o juiz manda baixar esse bloqueio judicial.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AccordionSection>

            {/* Sec: Restrições e cláusulas */}
            <AccordionSection 
              id="restricoes" 
              title="Restrições e cláusulas" 
              icon={<Scale size={18} className="text-orange-500" />} 
              isOpen={accordionState.restricoes} 
              onToggle={() => toggleAccordion('restricoes')}
            >
              {data.restricoes_clausulas ? (
                <div className="divide-y divide-brand-border/40 text-sm font-sans">
                  <GridRow label="Inalienabilidade" value={data.restricoes_clausulas.inalienabilidade || 'Não'} />
                  <GridRow label="Impenhorabilidade" value={data.restricoes_clausulas.impenhorabilidade || 'Não'} />
                  <GridRow label="Incomunicabilidade" value={data.restricoes_clausulas.incomunicabilidade || 'Não'} />
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Eventos de leilão na matrícula */}
            <AccordionSection 
              id="eventos" 
              title="Eventos de leilão na matrícula" 
              icon={<Gavel size={18} className="text-orange-500" />} 
              isOpen={accordionState.eventos} 
              onToggle={() => toggleAccordion('eventos')}
            >
              {data.eventos_leilao && data.eventos_leilao.length > 0 ? (
                <div className="space-y-3 font-sans">
                  {data.eventos_leilao.map((ev, idx) => (
                    <div key={idx} className="bg-brand-bg/15 rounded-2xl border border-brand-border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-brand-ink">{ev.tipo}</span>
                        {ev.data && <span className="text-xs text-brand-ink/45 font-mono">{ev.data}</span>}
                        {ev.status && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 rounded-full">{ev.status}</span>
                        )}
                      </div>
                      <div className="text-xs space-y-1 text-brand-ink/75 leading-relaxed">
                        <p>{ev.descricao}</p>
                        {ev.impacto_atual && (
                          <p><span className="font-semibold text-brand-ink/50">Impacto atual:</span> {ev.impacto_atual}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Processos judiciais mencionados */}
            <AccordionSection 
              id="processos" 
              title="Processos judiciais mencionados" 
              icon={<Gavel size={18} className="text-orange-500" />} 
              isOpen={accordionState.processos} 
              onToggle={() => toggleAccordion('processos')}
            >
              {data.processos_judiciais && data.processos_judiciais.length > 0 ? (
                <div className="space-y-4 font-sans">
                  {data.processos_judiciais.map((proc, idx) => (
                    <div key={idx} className="bg-brand-bg/15 rounded-2xl border border-brand-border p-4 space-y-2">
                      <p className="font-bold text-[13px] text-brand-ink font-mono">{proc.numero}</p>
                      
                      <div className="text-xs space-y-1.5 leading-relaxed">
                        {proc.natureza && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/50">Natureza:</span> {proc.natureza}</p>}
                        {proc.vara_comarca && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/50">Vara/Comarca:</span> {proc.vara_comarca}</p>}
                        {proc.fase && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/50">Fase:</span> {proc.fase}</p>}
                        {proc.partes && <p className="text-brand-ink/75"><span className="font-semibold text-brand-ink/50 font-sans">Partes:</span> {proc.partes}</p>}
                        {proc.impacto && <p className="text-brand-primary font-bold"><span className="font-semibold text-brand-ink/50">Impacto:</span> {proc.impacto}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Alertas e pontos de atenção */}
            <AccordionSection 
              id="alertas" 
              title="Alertas e pontos de atenção" 
              icon={<AlertTriangle size={18} className="text-orange-500" />} 
              isOpen={accordionState.alertas} 
              onToggle={() => toggleAccordion('alertas')}
            >
              {data.alertas ? (
                <div className="space-y-4 font-sans text-xs">
                  {data.alertas.problemas_arrematacao && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider block">POSSÍVEIS PROBLEMAS PARA ARREMATAÇÃO</h4>
                      <p className="text-amber-600 dark:text-amber-400 font-semibold">{data.alertas.problemas_arrematacao}</p>
                    </div>
                  )}

                  {data.alertas.pendencias_juridicas && (
                    <div className="space-y-1 border-t border-brand-border/30 pt-3">
                      <h4 className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider block">PENDÊNCIAS JURÍDICAS</h4>
                      <p className="text-brand-ink/80 leading-relaxed font-semibold">{data.alertas.pendencias_juridicas}</p>
                    </div>
                  )}

                  {data.alertas.pontos_atencao && (
                    <div className="space-y-1 border-t border-brand-border/30 pt-3">
                      <h4 className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider block text-rose-500">PONTOS DE ATENÇÃO CHAVE</h4>
                      <p className="text-brand-ink/80 leading-relaxed font-semibold">{data.alertas.pontos_atencao}</p>
                    </div>
                  )}
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Qualidade e transparência */}
            <AccordionSection 
              id="qualidade" 
              title="Qualidade e transparência da análise" 
              icon={<Award size={18} className="text-orange-500" />} 
              isOpen={accordionState.qualidade} 
              onToggle={() => toggleAccordion('qualidade')}
            >
              {data.qualidade_analise ? (
                <div className="divide-y divide-brand-border/40 text-sm font-sans">
                  <GridRow label="Qualidade do OCR" value={data.qualidade_analise.qualidade_ocr || 'BOA'} />
                  <GridRow label="Confiança da extração" value={data.qualidade_analise.confianca_extracao || 'ALTO'} />
                  <GridRow label="Data da análise" value={data.qualidade_analise.data_analise ? new Date(data.qualidade_analise.data_analise).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')} />
                  <GridRow label="Descrição do Arquivo analisado" value={data.qualidade_analise.arquivo_analisado || 'matricula.pdf'} />
                </div>
              ) : <NoData />}
            </AccordionSection>

            {/* NOVO: Campo de Análise Geral da Matrícula e Impactos para o Arrematante */}
            <div className="mt-8 bg-gradient-to-br from-brand-bg/40 to-brand-bg/10 rounded-3xl border border-brand-primary/20 p-6 space-y-6 font-sans">
              <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-4">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-md font-bold text-brand-ink">Análise Geral da Matrícula & Impactos para o Arrematante</h4>
                  <p className="text-xs text-brand-ink/50 mt-0.5">Visão consolidada de riscos, facilidade de registro e recomendações pós-arrematação</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lado Esquerdo: Diagnóstico e Resumo */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Diagnóstico de Segurança Jurídica</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      {data.kpis.num_onus_ativos > 0 ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-tight">Médio/Alto Risco (Requer Cancelamentos de Ônus)</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-bold text-emerald-500 uppercase tracking-tight">Segurança Elevada (Sem Ônus Graves Ativos)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-brand-bg/20 p-4 rounded-2xl border border-brand-border/40 space-y-2">
                    <h5 className="text-xs font-bold text-brand-ink/80">Parecer Geral da Cadeia de Propriedade:</h5>
                    <p className="text-xs text-brand-ink/70 leading-relaxed">
                      A matrícula registra {data.kpis.num_vendas || 0} transferências de propriedade. O proprietário atual é {data.proprietario_atual?.[0] || 'não identificado claramente no cabeçalho'}. 
                      {data.kpis.num_onus_ativos > 0 
                        ? ` Foram identificados ${data.kpis.num_onus_ativos} ônus ou gravames ativos na matrícula que demandarão baixa jurídica pós-leilão.`
                        : " Não foram detectados gravames impeditivos graves, simplificando o processo de transferência pós-arrematação."}
                    </p>
                  </div>

                  {data.alertas?.pontos_atencao && (
                    <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 space-y-1">
                      <h5 className="text-xs font-bold text-rose-500">Atenção Especial na Matrícula:</h5>
                      <p className="text-xs text-brand-ink/75 leading-relaxed font-medium">
                        {data.alertas.pontos_atencao}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lado Direito: Impactos para o Arrematante */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Impactos no Leilão & Procedimento do Arrematante</span>
                  
                  <div className="space-y-3">
                    {/* Item de cancelamento de penhoras */}
                    <div className="flex gap-3 text-xs leading-relaxed">
                      <div className="mt-1 flex-shrink-0 text-brand-primary">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-brand-ink/80">
                        <strong>Cancelamento de Penhoras/Hipotecas:</strong> Os gravames judiciais e hipotecas de credores que participam do rateio do leilão são extintos com a arrematação. Caberá ao arrematante peticionar solicitando a expedição dos respectivos Mandados de Cancelamento de Ônus para o Cartório.
                      </p>
                    </div>

                    {/* Item de responsabilidade */}
                    <div className="flex gap-3 text-xs leading-relaxed">
                      <div className="mt-1 flex-shrink-0 text-brand-primary">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-brand-ink/80">
                        <strong>Registro da Propriedade:</strong> Após homologação, você receberá a <em>Carta de Arrematação</em>. Ela substitui a escritura pública. Você deve levá-la ao Cartório de Registro de Imóveis (CRI) competente para registrar-se como proprietário definitivo, recolhendo previamente o ITBI correspondente.
                      </p>
                    </div>

                    {/* Alerta de Custo Extra */}
                    <div className="flex gap-3 text-xs leading-relaxed">
                      <div className="mt-1 flex-shrink-0 text-brand-primary">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-brand-ink/80">
                        <strong>Custos do Cartório:</strong> O arrematante é responsável pelas taxas cartorárias (emolumentos) de registro da Carta de Arrematação e pelos atos de cancelamento de cada penhora/ônus ativo na matrícula.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* NOVO: Simulador de Custos e Checklist Pós-Arrematação */}
              <div className="border-t border-brand-primary/10 pt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Simulador Inteligente de Gastos Reais */}
                  <div className="bg-brand-primary/[0.03] rounded-2xl border border-brand-primary/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Calculator size={16} className="text-brand-primary" />
                      <h5 className="text-sm font-bold text-brand-ink">Simulador Inteligente de Gastos Reais</h5>
                    </div>
                    <p className="text-xs text-brand-ink/65 leading-relaxed">
                      Ajuste o seu lance planejado para ver uma estimativa exata de todas as taxas, impostos e custos finais de cartório:
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 mb-1">
                          Valor Estimado do seu Lance (R$)
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
                          <span className="text-brand-ink/60">Lance de Arrematação:</span>
                          <span className="font-mono font-medium">R$ {customBid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-brand-ink/60">Comissão do Leiloeiro (5%):</span>
                          <span className="font-mono font-medium">R$ {(customBid * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-brand-ink/60">ITBI Estimado (3%):</span>
                          <span className="font-mono font-medium">R$ {(customBid * 0.03).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-brand-ink/60">Custos de Registro e Emolumentos (1.2%):</span>
                          <span className="font-mono font-medium">R$ {(customBid * 0.012).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {data.kpis.num_onus_ativos > 0 && (
                          <div className="py-2 flex justify-between text-brand-ink/65">
                            <span>Baixa de {data.kpis.num_onus_ativos || 1} Ônus/Penhora(s) (Est.):</span>
                            <span className="font-mono font-medium">R$ {(1200).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="py-3 flex justify-between font-bold text-brand-primary border-t-2 border-brand-primary/20">
                          <span>CUSTO REAL TOTAL ESTIMADO:</span>
                          <span className="font-mono">R$ {(customBid + (customBid * 0.092) + 1200).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Interativo */}
                  <div className="bg-brand-primary/[0.03] rounded-2xl border border-brand-primary/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-brand-primary" />
                      <h5 className="text-sm font-bold text-brand-ink">Diligência pós-Arrematação (Checklist Inteligente)</h5>
                    </div>
                    <p className="text-xs text-brand-ink/65 leading-relaxed">
                      Siga o roteiro passo a passo para registrar o imóvel e dar baixa nos gravames mapeados de forma segura:
                    </p>

                    <div className="space-y-2.5">
                      {[
                        { id: 1, label: "Solicitar homologação e expedição da Carta de Arrematação e Mandados de Baixa.", desc: "Feito por meio de petição do seu advogado no processo judicial." },
                        { id: 2, label: "Efetuar o recolhimento da guia de ITBI municipal.", desc: "Imposto obrigatório calculado sobre o valor da arrematação ou da prefeitura." },
                        { id: 3, label: "Apresentar a Carta de Arrematação no Cartório de Registro de Imóveis.", desc: "Substitui a escritura convencional para averbar sua nova propriedade definitiva." },
                        { id: 4, label: "Apresentar mandados de baixa para cancelar as penhoras/ônus ativos.", desc: "Cada gravame anterior listado na matrícula precisa de cancelamento explícito." },
                        { id: 5, label: "Tomar posse física (Amigável ou Imissão de Posse judicial).", desc: "No leilão judicial, o próprio juiz do caso emite a ordem de imissão na posse." },
                      ].map((step) => (
                        <div key={step.id} className="flex items-start gap-3 text-xs">
                          <input
                            type="checkbox"
                            id={`step-check-${step.id}`}
                            className="mt-1 h-3.5 w-3.5 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                            checked={!!diligenceChecklist[step.id]}
                            onChange={(e) => {
                              setDiligenceChecklist(prev => ({ ...prev, [step.id]: e.target.checked }));
                            }}
                          />
                          <label htmlFor={`step-check-${step.id}`} className="cursor-pointer select-none">
                            <span className={`font-semibold block ${diligenceChecklist[step.id] ? 'line-through text-brand-ink/40' : 'text-brand-ink'}`}>
                              {step.id}. {step.label}
                            </span>
                            <span className={`text-[11px] block mt-0.5 ${diligenceChecklist[step.id] ? 'text-brand-ink/30' : 'text-brand-ink/50'}`}>
                              {step.desc}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Sugestão de Viabilidade Cruzada */}
              <div className="mt-4 pt-4 border-t border-brand-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-brand-primary">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-brand-ink">💡 Sugestão de Viabilidade Cruzada Inteligente</h5>
                    <p className="text-[11px] text-brand-ink/70 leading-relaxed mt-0.5">
                      <strong>Recomendação de Especialista:</strong> Sempre cruze os dados desta matrícula com a aba <strong>Edital</strong>. Desconfie se houver menção a débitos tributários de IPTU ou despesas condominiais pesadas que não estejam descritas de forma transparente na matrícula original.
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
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-full uppercase tracking-wider font-sans border border-emerald-200/50 scale-90">ALTO</span>
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

// Fallback generator if analysis_data tag is missing or not fully created
function parseHeuristics(
  text: string, 
  address: string, 
  city: string, 
  state: string,
  valuation: number,
  bid: number
): MatriculaReportData {
  const result = getFallbackData(address, city, state, valuation, bid);
  
  if (!text) return result;

  try {
    // 1. Try to find Matricula number using regex
    const matMatch = text.match(/(?:Matrícula|Nº|Número)\s*(?:nº|no|num|:)?\s*(\d[\d\.\-\/]*)/i);
    if (matMatch && result.identificacao_matricula) {
      result.identificacao_matricula.numero_matricula = matMatch[1];
    }

    // 1.1. Try to find Inscrição Imobiliária / Cadastro Imobiliário / IPTU / SQL
    const iptuMatch = text.match(/(?:Inscrição\s+Municipal|Inscrição\s+Imobiliária|Inscricao\s+Imobiliaria|Inscricao\s+Municipal|Cadastro\s+Imobiliário|Cadastro\s+Imobiliario|Cadastro\s+Municipal|Inscrição\s+Cadastral|Inscricao\s+Cadastral|Inscrição\s+do\s+Imóvel|Nº\s+do\s+Contribuinte|Contribuinte\s+nº?|SQL\s*[:\-\s]|Código\s+Cartográfico|IPTU\s*(?:nº|no|num|:|cadastrado sob|inscrição)?|Cód\.\s*Imóvel|Inscrição\s*nº)\s*(?:nº|no|num|:|de)?\s*([0-9A-Z\.\-\/\_]+)/i);
    if (iptuMatch && result.identificacao_matricula) {
      result.identificacao_matricula.cadastro_imobiliario = iptuMatch[1].trim();
      if (result.caracteristicas_fisicas) {
        result.caracteristicas_fisicas.cadastro_imobiliario = iptuMatch[1].trim();
      }
    }

    // Try to parse valor_fiscal or valor venal using regex
    const fiscalMatch = text.match(/(?:valor\s+fiscal|valor\s+venal|valor\s+de\s+referência|valor\s+de\s+referencia|venal\s+de|fiscal\s+de)\s*(?:de|do|imovel|imóvel)?\s*(?:nº|:)?\s*R\$\s*(\d[\d\.\,]*)/i);
    if (fiscalMatch && result.caracteristicas_fisicas) {
      result.caracteristicas_fisicas.valor_fiscal = `R$ ${fiscalMatch[1]}`;
    }

    // 2. Try to find Cartório
    const cartMatch = text.match(/(?:Cartório|Ofício|Oficio|Registro)\s*(?:de Registro)?(?:\s+\d[ºª]?)?[\w\s]{5,40}/i);
    if (cartMatch && result.identificacao_matricula) {
      result.identificacao_matricula.cartorio = cartMatch[0].trim().toUpperCase();
    }

    // 3. Try to find Comarca
    const comMatch = text.match(/(?:Comarca|Cidade|Municipio|Município)\s*(?:de)?\s*([A-Za-zÀ-ÿ\s]{4,30})/i);
    if (comMatch && result.identificacao_matricula) {
      result.identificacao_matricula.comarca = comMatch[1].trim().toUpperCase();
    }

    // 4. Try to parse transaction amounts
    const matchesCurrency = text.match(/R\$\s*\d[\d\.\,]+/g);
    if (matchesCurrency && matchesCurrency.length > 0) {
      result.valores_transacao = matchesCurrency.slice(0, 3).map(val => ({
        valor: val,
        data: 'Averbado'
      }));
      result.kpis.ultimo_venda_valor = matchesCurrency[0];
      result.kpis.num_vendas = matchesCurrency.length;
    }

    // 5. Try to find owner
    const propMatch = text.match(/(?:proprietário|proprietaria|proprietários|adquirente|adquirentes)\s*(?:atual|S)?:\s*([A-Z\s]{8,50})/i);
    if (propMatch) {
      result.proprietario_atual = [propMatch[1].trim().toUpperCase()];
    }

    // 6. Active liens number heuristic
    const lienKeywords = ['penhora', 'alienação', 'hipoteca', 'indisponibilidade', 'restrição'];
    let lienCount = 0;
    lienKeywords.forEach(kw => {
      const occurrences = (text.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
      lienCount += occurrences;
    });
    result.kpis.num_onus_ativos = Math.min(Math.max(lienCount, 1), 6);

    // 7. Lawsuits number heuristic
    const lawMatches = text.match(/\d{7}\-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g);
    if (lawMatches) {
      result.kpis.num_processos_judiciais = lawMatches.length;
      result.processos_judiciais = lawMatches.map(no => ({
        numero: no,
        natureza: 'Execução de Título / Cobrança',
        impacto: 'RISCO DE HASTA PÚBLICA'
      }));
    }
  } catch (err) {
    console.error("Heuristics parser failed moderately", err);
  }

  return result;
}

function getFallbackData(
  address: string, 
  city: string, 
  state: string,
  valuation: number,
  bid: number
): MatriculaReportData {
  const formattedValuation = valuation > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valuation) : 'Não informado';
  const formattedBid = bid > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bid) : 'Não informado';
  const displayAddress = address || 'Não informado';
  const displayLocation = (city && state) ? `${city}/${state}` : (city || state || 'Não informada');

  return {
    kpis: {
      num_vendas: 0,
      ultimo_venda_valor: 'Não informado',
      num_onus_ativos: 0,
      num_processos_judiciais: 0
    },
    proprietario_atual: ['Não informado (consulte matrícula completa)'],
    proprietarios_anteriores: [],
    valores_transacao: [],
    imovel_tipo: 'Não informado',
    localizacao_resumo: displayLocation,
    identificacao_matricula: {
      numero_matricula: 'Não informado',
      cartorio: 'Não informado',
      comarca: (city || 'Não informada').toUpperCase(),
      uf: (state || 'Não informada').toUpperCase(),
      livro: '2'
    },
    caracteristicas_fisicas: {
      tipo_imovel: 'Não informado',
      categoria: 'Não informado',
      endereco: displayAddress,
      area_total: 'Não informado',
      fracao_ideal: 'Não informado',
      unidade_autonoma: 'Não informado',
      valor_fiscal: 'Não informado',
      descricao_completa: 'Mapeamento pendente. Verifique a análise textual.'
    },
    condominio: {
      nome: 'Não informado'
    },
    cadeia_registral: [],
    proprietarios_e_partes: {
      atuais: [],
      anteriores: [],
      credores: []
    },
    onus_gravames: [],
    restricoes_clausulas: {
      inalienabilidade: 'Não informado',
      impenhorabilidade: 'Não informado',
      incomunicabilidade: 'Não informado'
    },
    eventos_leilao: [],
    processos_judiciais: [],
    alertas: {
      problemas_arrematacao: 'Mapeamento de riscos em andamento.',
      pendencias_juridicas: 'Mapeamento de pendências em andamento.',
      pontos_atencao: 'Consulte a análise completa textual.'
    },
    qualidade_analise: {
      qualidade_ocr: 'Aguardando documento',
      confianca_extracao: 'Baixo',
      data_analise: new Date().toISOString(),
      arquivo_analisado: 'Não informado'
    }
  };
}
