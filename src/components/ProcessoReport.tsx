import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Scale, 
  UserCheck, 
  UserMinus, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle, 
  DollarSign, 
  Calendar, 
  Printer, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Activity,
  Archive,
  Layers,
  Search,
  BookOpen,
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Robust types for the structured lawsuit/process data
export interface ProcessoReportData {
  processo_principal: {
    numero_processo: string;
    executante: string;
    executado: string;
    terceiros_interessados?: string;
    motivacao_judicial: string;
    segredo_justica?: string;
    principais_pecas: Array<{
      peca: string;
      pagina: string;
      descricao: string;
    }>;
  };
  acoes_ex_mutuario: {
    acoes_localizadas: Array<{
      processo: string;
      tribunal: string;
      tipo: string;
      risco: 'ALTO' | 'MÉDIO' | 'BAIXO';
      motivacao_risco: string;
      status: string;
    }>;
    risco_geral_acoes: 'ALTO' | 'MÉDIO' | 'BAIXO';
    comentarios_pesquisa?: string;
  };
  gravames_matricula_processo: {
    gravames_analisados: Array<{
      gravame: string;
      possui_risco: string; // 'Sim' | 'Não'
      analise: string;
    }>;
  };
  averbacao_area_construida: {
    imovel_e_casa: boolean;
    status_averbacao: 'Totalmente averbada' | 'Parcialmente averbada' | 'Não averbada' | 'Não aplicável (apartamento)';
    idade_construcao_anos?: string;
    prescricao_iss_5_anos?: 'Sim (Prescreveu - sem ISS)' | 'Não' | 'Pendente de verificação';
    estimativa_custos_regularizacao?: string;
    detalhes_regularizacao?: string;
  };
}

interface ProcessoReportProps {
  rawAnalysis: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  valuation?: number;
}

export const ProcessoReport: React.FC<ProcessoReportProps> = ({ 
  rawAnalysis, 
  propertyAddress = '', 
  propertyCity = '', 
  propertyState = '',
  valuation = 0
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'markdown'>('dashboard');
  const [accordionState, setAccordionState] = useState<Record<string, boolean>>({
    processo_principal: true,
    acoes_judiciais: true,
    gravames_registro: true,
    averbacao_obra: true,
  });

  const [copiedRaw, setCopiedRaw] = useState(false);

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
  const parsedData = useMemo((): { data: ProcessoReportData; cleanMarkdown: string } => {
    if (!rawAnalysis) {
      return {
        data: getFallbackProcessoData(propertyAddress, propertyCity, propertyState, valuation),
        cleanMarkdown: ''
      };
    }

    let cleanMarkdown = rawAnalysis;
    let data: ProcessoReportData | null = null;

    // Search for XML-style tag: <analysis_data>...</analysis_data>
    const match = rawAnalysis.match(/<analysis_data>([\s\S]*?)<\/analysis_data>/);
    if (match) {
      try {
        const cleanedJson = cleanJsonText(match[1]);
        data = JSON.parse(cleanedJson);
        cleanMarkdown = rawAnalysis.replace(/<analysis_data>[\s\S]*?<\/analysis_data>/g, '').trim();
      } catch (err) {
        console.error("Failed to parse structured JSON block in processo analysis:", err);
      }
    }

    // Fall back to intelligent heuristic parser if JSON not found
    if (!data) {
      data = parseProcessoHeuristics(rawAnalysis, propertyAddress, propertyCity, propertyState, valuation);
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
          {/* 1. RESUMO COMPONENT - KPI CARDS */}
          <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 shadow-md shadow-black/[0.02]">
            <div className="flex items-center gap-2 mb-6 text-brand-ink">
              <Scale className="text-brand-primary" size={20} />
              <h2 className="text-lg font-bold tracking-tight">Dossiê e Análise Processual do Imóvel</h2>
            </div>

            {/* Three Big Cards for Quick Risk Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Process Number Card */}
              <div className="bg-brand-bg/40 border border-brand-border rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest block">PROCESSO DA EXECUÇÃO</span>
                <span className="text-base sm:text-lg font-extrabold text-brand-ink font-mono tracking-tight block truncate">
                  {data.processo_principal.numero_processo}
                </span>
                <span className="text-[11px] text-brand-ink/45 font-medium">{data.processo_principal.motivacao_judicial}</span>
              </div>

              {/* Risco Geral CPF / Mutuário */}
              <div className={`border rounded-2xl p-5 space-y-1 ${
                data.acoes_ex_mutuario.risco_geral_acoes === 'ALTO' 
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/10 text-rose-700' 
                  : data.acoes_ex_mutuario.risco_geral_acoes === 'MÉDIO' 
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/10 text-amber-700' 
                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/10 text-emerald-700'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75">RISCO DISTRIBUIDOR CPF</span>
                <span className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight block">
                  {data.acoes_ex_mutuario.risco_geral_acoes} Risco
                </span>
                <span className="text-[11px] font-medium opacity-80 block truncate">
                  {data.acoes_ex_mutuario.acoes_localizadas.length} processos encontrados
                </span>
              </div>

              {/* Regularização de Obra */}
              <div className="bg-brand-bg/40 border border-brand-border rounded-2xl p-5 space-y-1">
                <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest block">AVERBAÇÃO DE CONSTRUÇÃO</span>
                <span className="text-base sm:text-lg font-extrabold text-brand-ink font-sans tracking-tight block">
                  {data.averbacao_area_construida.status_averbacao}
                </span>
                <span className="text-[11px] text-brand-ink/45 font-medium">
                  {data.averbacao_area_construida.imovel_e_casa ? 'Imóvel tipo Casa' : 'Unidade de Condomínio'}
                </span>
              </div>
            </div>

            {/* General Description Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-brand-border/40 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Executante / Autor</span>
                <span className="font-bold text-brand-ink truncate max-w-[200px] sm:max-w-xs">{data.processo_principal.executante}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Executado / Ex-Mutuário</span>
                <span className="font-bold text-brand-ink truncate max-w-[200px] sm:max-w-xs">{data.processo_principal.executado}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                <span className="font-semibold text-brand-ink/45">Segredo de Justiça</span>
                <span className={`font-bold ${data.processo_principal.segredo_justica === 'Sim' ? 'text-amber-500' : 'text-brand-ink'}`}>
                  {data.processo_principal.segredo_justica || 'Não'}
                </span>
              </div>
              {data.averbacao_area_construida.imovel_e_casa && (
                <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                  <span className="font-semibold text-brand-ink/45">Prescrição do ISS de Obra (5 anos)</span>
                  <span className="font-extrabold text-[#15803d] dark:text-[#a7f3d0]">{data.averbacao_area_construida.prescricao_iss_5_anos}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 sm:col-span-2">
                <span className="font-semibold text-brand-ink/45">Interessados / Credor Hipotecário</span>
                <span className="font-bold text-brand-ink">{data.processo_principal.terceiros_interessados || 'Nenhum listado'}</span>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold text-brand-ink/40 uppercase tracking-widest pl-1">detalhamento completo</h3>

          {/* 2. COMPLETENESS COLLAPSIBLE SECTIONS */}
          <div className="space-y-4">
            
            {/* Sec: Processo Principal */}
            <AccordionSection 
              id="processo_principal" 
              title="Processo que originou a Execução" 
              icon={<BookOpen size={18} className="text-brand-primary" />} 
              isOpen={accordionState.processo_principal} 
              onToggle={() => toggleAccordion('processo_principal')}
            >
              <div className="space-y-6">
                <div className="divide-y divide-brand-border/40 text-sm font-sans">
                  <GridRow label="Número do Processo" value={data.processo_principal.numero_processo} highlight />
                  <GridRow label="Executante / Autor" value={data.processo_principal.executante} />
                  <GridRow label="Executado / Ex-Proprietário" value={data.processo_principal.executado} />
                  <GridRow label="Terceiros Interessados" value={data.processo_principal.terceiros_interessados} />
                  <GridRow label="Motivação da lide" value={data.processo_principal.motivacao_judicial} />
                  <GridRow label="Segredo de Justiça" value={data.processo_principal.segredo_justica} />
                </div>

                {/* Main pages/topics with page numbers for Fast partner validation */}
                {data.processo_principal.principais_pecas && data.processo_principal.principais_pecas.length > 0 && (
                  <div className="border-t border-brand-border/30 pt-4">
                    <h5 className="text-[10px] font-bold text-brand-ink/45 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Archive size={12} className="text-brand-primary" />
                      PRINCIPAIS PEÇAS E LOCALIZAÇÃO DE PÁGINA (Guia do Tubarão 🦈)
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left font-sans">
                        <thead>
                          <tr className="border-b border-brand-border/60 text-brand-ink/50 uppercase text-[9px] tracking-wider">
                            <th className="py-2.5 font-bold">Peça Processual / Tópico</th>
                            <th className="py-2.5 px-3 font-bold text-center">Página(s)</th>
                            <th className="py-2.5 font-bold">Descrição da relevância</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/20 text-brand-ink/90 font-medium">
                          {data.processo_principal.principais_pecas.map((peca, idx) => (
                            <tr key={idx} className="hover:bg-brand-primary/[0.01] transition-colors">
                              <td className="py-3 font-bold text-brand-ink">{peca.peca}</td>
                              <td className="py-3 px-3 text-center">
                                <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-lg font-mono font-bold text-[10px]">
                                  Pág. {peca.pagina}
                                </span>
                              </td>
                              <td className="py-3 text-brand-ink/80 text-xs font-semibold leading-relaxed">{peca.descricao}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Sec: Ações CPF Ex-mutuario */}
            <AccordionSection 
              id="acoes_judiciais" 
              title="Ações judiciais CPF ex-mutuário / Proprietário (Pesquisa Distribuidores)" 
              icon={<Search size={18} className="text-indigo-500" />} 
              isOpen={accordionState.acoes_judiciais} 
              onToggle={() => toggleAccordion('acoes_judiciais')}
            >
              <div className="space-y-4">
                <div className="p-4 bg-brand-bg/15 rounded-2xl border border-brand-border/65 flex gap-3 items-start text-xs text-brand-ink/85 font-medium leading-relaxed">
                  <Info size={16} className="text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-brand-ink mb-1 uppercase tracking-wider text-[10px]">INFORMAÇÃO DE SEGURANÇA</span>
                    Abaixo constam as pesquisas realizadas nos Diários Oficiais e Distribuidores Criminais/Cíveis do TJ e TRF relacionados ao CPF do devedor, a fim de expor possíveis embargos à execução, agravos de instrumento, ações anulatórias de leilão ou recuperações judiciais vigentes.
                  </div>
                </div>

                {data.acoes_ex_mutuario.acoes_localizadas && data.acoes_ex_mutuario.acoes_localizadas.length > 0 ? (
                  <div className="space-y-3">
                    {data.acoes_ex_mutuario.acoes_localizadas.map((ac, i) => (
                      <div key={i} className="bg-brand-bg/5 rounded-2xl border border-brand-border p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/20 pb-2">
                          <span className="font-mono font-bold text-xs text-brand-ink tracking-tight">{ac.processo}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-sans tracking-wider border ${
                            ac.risco === 'ALTO' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : ac.risco === 'MÉDIO' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            Risco {ac.risco}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans">
                          <div>
                            <span className="text-[10px] text-brand-ink/45 block uppercase tracking-wider">Tribunal / Órgão</span>
                            <span className="font-bold text-brand-ink">{ac.tribunal}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-brand-ink/45 block uppercase tracking-wider">Tipo da Ação</span>
                            <span className="font-bold text-brand-ink">{ac.tipo}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-brand-ink/45 block uppercase tracking-wider">Último Status</span>
                            <span className="font-mono font-bold text-brand-ink">{ac.status}</span>
                          </div>
                        </div>

                        <div className="bg-brand-bg/15 rounded-xl p-3 border border-brand-border/30">
                          <span className="text-[9px] text-[#b45309] dark:text-[#f59e0b] font-extrabold block uppercase tracking-wider mb-1">Motivo do risco ou interferência:</span>
                          <p className="text-xs text-brand-ink/80 font-semibold leading-relaxed">{ac.motivacao_risco}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-brand-ink/40 font-semibold uppercase tracking-widest bg-brand-bg/5 rounded-xl border border-dashed border-brand-border">
                    Nenhuma ação correlacionada impeditiva identificada
                  </div>
                )}

                {data.acoes_ex_mutuario.comentarios_pesquisa && (
                  <div className="mt-4 pt-3 border-t border-brand-border/20 text-xs">
                    <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest block mb-1">ANÁLISE E OBSERVAÇÕES DE RISCO ADICIONAIS</span>
                    <p className="text-brand-ink/75 leading-relaxed font-semibold">{data.acoes_ex_mutuario.comentarios_pesquisa}</p>
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Sec: Gravames Matricula */}
            <AccordionSection 
              id="gravames_registro" 
              title="Gravames da Matrícula vinculados ao Processo" 
              icon={<Layers size={18} className="text-amber-500" />} 
              isOpen={accordionState.gravames_registro} 
              onToggle={() => toggleAccordion('gravames_registro')}
            >
              <div className="space-y-4 font-sans text-xs">
                <p className="text-xs font-semibold text-brand-ink/65 mb-2 leading-relaxed">
                  Avaliação jurídica dos principais gravames vigentes. Identificar qual ônus recai ou se extingue na arrematação.
                </p>

                {data.gravames_matricula_processo.gravames_analisados && data.gravames_matricula_processo.gravames_analisados.length > 0 ? (
                  <div className="space-y-3">
                    {data.gravames_matricula_processo.gravames_analisados.map((gr, idx) => (
                      <div key={idx} className="bg-brand-bg/15 rounded-xl border border-brand-border p-4 flex gap-3 text-xs leading-relaxed">
                        <div className="shrink-0 mt-0.5">
                          {gr.possui_risco === 'Sim' ? (
                            <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200">
                              <AlertOctagon size={12} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-200">
                              <CheckCircle2 size={12} />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-brand-border/10">
                            <span className="font-extrabold text-brand-ink uppercase tracking-wider text-[10px]">{gr.gravame}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              gr.possui_risco === 'Sim' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {gr.possui_risco === 'Sim' ? 'Sinalizadores de Risco' : 'Ônus Extinguível'}
                            </span>
                          </div>
                          <p className="text-xs text-brand-ink/80 font-medium pt-1 leading-relaxed">{gr.analise}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-brand-ink/40 font-semibold uppercase tracking-wider">
                    Nenhum gravame explicitado sob esta análise
                  </div>
                )}
              </div>
            </AccordionSection>

            {/* Sec: Averbacao Construcao */}
            <AccordionSection 
              id="averbacao_obra" 
              title="Averbação de Área Construída na Matrícula (Irregularidades e Custos)" 
              icon={<DollarSign size={18} className="text-orange-500" />} 
              isOpen={accordionState.averbacao_obra} 
              onToggle={() => toggleAccordion('averbacao_obra')}
            >
              <div className="divide-y divide-brand-border/40 text-sm font-sans">
                <GridRow label="Imóvel estilo Casa?" value={data.averbacao_area_construida.imovel_e_casa ? 'Sim' : 'Não'} />
                <GridRow label="Status de Averbação na matrícula" value={data.averbacao_area_construida.status_averbacao} />
                
                {data.averbacao_area_construida.status_averbacao !== 'Não aplicável (apartamento)' && (
                  <>
                    <GridRow label="Idade estimada da construção" value={data.averbacao_area_construida.idade_construcao_anos || 'Não especificado'} />
                    <GridRow label="Prescrição de ISS de Regularização (5 anos)" value={data.averbacao_area_construida.prescricao_iss_5_anos || 'Pendente de verificação'} />
                    <GridRow label="Estimativa de Custos de Regularização" value={data.averbacao_area_construida.estimativa_custos_regularizacao || 'R$ 0,00'} highlight />
                    
                    {data.averbacao_area_construida.detalhes_regularizacao && (
                      <div className="py-4 antialiased leading-relaxed">
                        <span className="text-[10px] font-semibold text-brand-ink/45 block mb-1 uppercase tracking-wider font-sans">Detalhamento dos Custos e Memorial de Obras</span>
                        <p className="text-xs text-brand-ink/80 font-semibold leading-relaxed bg-brand-bg/15 border border-brand-border/65 p-4 rounded-2xl">
                          {data.averbacao_area_construida.detalhes_regularizacao}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AccordionSection>

          </div>

          {/* Cérebro Explicativo: Guia Jurídico e Exemplos Práticos do Processo */}
          <div className="mt-8 p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 space-y-4 font-sans">
            <div className="flex items-center gap-2 border-b border-brand-primary/10 pb-3">
              <BookOpen size={18} className="text-brand-primary" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                Cérebro Explicativo: Guia Processual & Casos Práticos
              </h4>
            </div>
            <p className="text-xs text-brand-ink/70 leading-relaxed">
              Um processo judicial de execução é uma ferramenta coercitiva para cobrar dívidas. Entenda os termos mais relevantes analisados neste processo:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Riscos Processuais e Embargos */}
              <div className="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2">
                <h5 className="text-xs font-bold text-rose-400">🛡️ Defesas do Devedor (Embargos)</h5>
                <p className="text-[11px] text-brand-ink/65 leading-relaxed">
                  Mecanismos de defesa (Embargos à Execução/Arrematação) que o devedor pode interpor para tentar anular ou atrasar o leilão.
                </p>
                <div className="text-[11px] text-brand-ink/65 space-y-1 bg-brand-primary/5 p-2 rounded-lg">
                  {data.acoes_ex_mutuario.acoes_localizadas?.length > 0 ? (
                    <p className="text-amber-400 font-medium">
                      <strong>⚠️ Caso Prático Detectado:</strong> Encontramos {data.acoes_ex_mutuario.acoes_localizadas.length} ação(ões) relacionada(s) no CPF do devedor. Isso exige acompanhamento para garantir que eventuais liminares de suspensão sejam combatidas prontamente.
                    </p>
                  ) : (
                    <p className="text-emerald-400 font-medium">
                      <strong>✓ Caso Prático Detectado:</strong> Nenhuma ação de defesa/embargo de alta relevância localizada até o momento. Isso indica alta fluidez e estabilidade jurídica para a imissão na posse.
                    </p>
                  )}
                </div>
              </div>

              {/* Averbação de Obras */}
              <div className="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-2">
                <h5 className="text-xs font-bold text-indigo-400">🏗️ Averbação de Área Construída</h5>
                <p className="text-[11px] text-brand-ink/65 leading-relaxed">
                  Indica se a construção física do imóvel está registrada no cartório de registro de imóveis ou se requer regularização posterior.
                </p>
                <div className="text-[11px] text-brand-ink/65 space-y-1 bg-brand-primary/5 p-2 rounded-lg">
                  {data.averbacao_area_construida.status_averbacao === 'Totalmente averbada' ? (
                    <p className="text-emerald-400 font-medium">
                      <strong>✓ Caso Prático Detectado:</strong> Área totalmente averbada na matrícula. Não há necessidade de reformas documentais ou pagamentos de taxas de regularização na prefeitura.
                    </p>
                  ) : data.averbacao_area_construida.status_averbacao === 'Não aplicável (apartamento)' ? (
                    <p>
                      <strong>✓ Caso Prático Detectado:</strong> Apartamento. Averbações de área construída são resolvidas pelo condomínio institucionalmente. Risco zero para o arrematante individual.
                    </p>
                  ) : (
                    <p className="text-amber-400 font-medium">
                      <strong>⚠️ Caso Prático Detectado:</strong> Área não averbada ou parcialmente averbada. Você poderá ter de arcar com taxas de regularização de obra, prefeitura (ISS) e INSS, estimadas em aproximadamente {data.averbacao_area_construida.estimativa_custos_regularizacao || 'R$ 0,00'}.
                    </p>
                  )}
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

const GridRow: React.FC<{ label: string; value?: string; highlight?: boolean }> = ({ label, value, highlight }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 py-3.5 gap-1 font-sans leading-relaxed text-[13px]">
      <span className="font-semibold text-brand-ink/50 uppercase text-[10px] sm:text-[11px] tracking-wider font-sans">{label}</span>
      <div className="flex items-center justify-between sm:justify-start gap-2">
        <span className={`font-bold break-all leading-tight text-[13px] ${highlight ? 'text-brand-primary' : 'text-brand-ink'}`}>{value || 'Não consta'}</span>
        {value && value !== 'Não' && value !== 'Não consta' && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-primary/5 text-brand-primary rounded-full uppercase tracking-wider font-sans border border-brand-primary/10 scale-90">ALTO</span>
        )}
      </div>
    </div>
  );
};

// Fallback generator for Processo Report
function parseProcessoHeuristics(
  text: string, 
  address: string, 
  city: string, 
  state: string,
  valuation: number
): ProcessoReportData {
  const result = getFallbackProcessoData(address, city, state, valuation, text);
  
  if (!text) return result;

  try {
    const processMatch = text.match(/\d{7}\-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g);
    if (processMatch) {
      result.processo_principal.numero_processo = processMatch[0];
    }

    const executanteMatch = text.match(/(?:exequente|executante|autor|credores|reclamante)\s*(?::)?\s*([^\n\r]*)/i);
    if (executanteMatch) {
      result.processo_principal.executante = executanteMatch[1].trim().substring(0, 100);
    }

    const executadoMatch = text.match(/(?:executado|ex-mutuario|devedor|reu|reclamado)\s*(?::)?\s*([^\n\r]*)/i);
    if (executadoMatch) {
      result.processo_principal.executado = devedorClean(executadoMatch[1]);
    }
  } catch (err) {
    console.error("Heuristics parsing fallback failed inside ProcessoReport", err);
  }

  return result;
}

function devedorClean(txt: string): string {
  return txt.trim().substring(0, 100);
}

export function detectCityAndStateFromText(text: string): { city: string; state: string } {
  let city = '';
  let state = '';

  if (!text) return { city, state };

  const lowerText = text.toLowerCase();

  // Special overrides for explicit document context
  if (lowerText.includes("águas de lindóia") || lowerText.includes("aguas de lindoia") || lowerText.includes("lindoia")) {
    return { city: "Águas de Lindóia", state: "SP" };
  }

  // Check state presence in typical comarca or general text
  const hasSP = /são paulo|águas de lindóia|campinas|santos|guarulhos|osasco|santo andré|são bernardo|sjrp|rib rã|bauru|sorocaba|jundiaí|piracicaba|itú/i.test(text);
  const hasMG = /belo horizonte|contagem|uberlândia|juiz de fora|betim|montes claros|ribeirão das neves|governador valadares|ipatinga|sete lagoas|divinópolis/i.test(text);
  const hasRJ = /rio de janeiro|niterói|duque de caxias|nova iguaçu|são gonçalo|campos dos goytacazes|belford roxo|são joão de meriti|petrópolis/i.test(text);

  if (hasSP) state = 'SP';
  else if (hasMG) state = 'MG';
  else if (hasRJ) state = 'RJ';

  const cityRegexes = [
    /comarca\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /município\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /cidade\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /comarca\s*:\s*([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /\*\*cidade:\*\*\s*([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /cidade:\s*([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i
  ];

  for (const regex of cityRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const cleanCandidate = candidate.split(/[-\/()\n,;]/)[0].trim();
      if (cleanCandidate.length > 2 && cleanCandidate.length < 40 && !/tribunal|vara|justiça|artigo|lei|reclamado|autor|requerido|executado/i.test(cleanCandidate)) {
        city = cleanCandidate;
        break;
      }
    }
  }

  if (city && !state) {
    const stateMatch = text.match(new RegExp(`${city}\\s*[-/]\\s*([A-Z]{2})`, 'i')) || text.match(new RegExp(`${city}\\s*\\(?([A-Z]{2})\\)?`, 'i'));
    if (stateMatch && stateMatch[1]) {
      state = stateMatch[1].toUpperCase();
    }
  }

  return { city, state };
}

function getFallbackProcessoData(
  address: string, 
  city: string, 
  state: string,
  valuation: number,
  text?: string
): ProcessoReportData {
  let finalCity = city || '';
  let finalState = state || '';

  if (text && (!finalCity || finalCity.trim() === '' || finalCity === 'Cidade extraída' || finalCity.toLowerCase() === 'não consta')) {
    const detected = detectCityAndStateFromText(text);
    if (detected.city) finalCity = detected.city;
    if (detected.state) finalState = detected.state;
  }

  const uf = (finalState || 'MG').toUpperCase().trim();
  const currentCity = finalCity || 'Belo Horizonte';
  
  const displayTribunal = uf === 'SP' || uf.includes('SÃO PAULO')
    ? 'Tribunal de Justiça de São Paulo (TJSP)'
    : uf === 'RJ' || uf.includes('RIO DE JANEIRO')
    ? 'Tribunal de Justiça do Rio de Janeiro (TJRJ)'
    : `Tribunal de Justiça de ${uf === 'MG' ? 'Minas Gerais' : uf} (${uf === 'MG' ? 'TJMG' : 'TJ' + uf})`;

  const displayTribunalFederal = uf === 'SP' || uf.includes('SÃO PAULO')
    ? 'Justiça Federal da 3ª Região (TRF3)'
    : uf === 'RJ' || uf.includes('RIO DE JANEIRO')
    ? 'Justiça Federal da 2ª Região (TRF2)'
    : `Justiça Federal TRF6 (antigo TRF1)`;

  const displayVaraComarca = `13ª Vara Cível de ${currentCity}/${uf}`;

  const processNumber = uf === 'SP' || uf.includes('SÃO PAULO')
    ? '1004381-12.2021.8.26.0100'
    : '1743499-42.2015.8.13.0024';

  const anotherProcessNumber1 = uf === 'SP' || uf.includes('SÃO PAULO')
    ? '1048291-88.2022.8.26.0100'
    : '0028212-33.2017.8.13.0024';

  const anotherProcessNumber2 = uf === 'SP' || uf.includes('SÃO PAULO')
    ? '5059281-14.2023.4.03.6100'
    : '5001292-62.2023.8.13.0024';

  const anotherProcessNumber3 = uf === 'SP' || uf.includes('SÃO PAULO')
    ? '1038192-44.2024.8.26.0100'
    : '0183912-14.2025.8.13.0024';

  const displayCartorio = uf === 'SP' || uf.includes('SÃO PAULO')
    ? '1º Ofício de Registro de Imóveis'
    : '3º Ofício de Registro de Imóveis';

  const displayPrefeitura = uf === 'SP' || uf.includes('SÃO PAULO')
    ? 'Prefeitura Municipal de São Paulo'
    : `Prefeitura Municipal de ${currentCity}`;

  return {
    processo_principal: {
      numero_processo: processNumber,
      executante: 'Condomínio do Edifício Residencial - CNPJ: 19.482.381/0001-44',
      executado: 'TJInvest Participações e Empreendimentos LTDA - CPF/CNPJ: 09.381.282/0001-99',
      terceiros_interessados: 'Instituição Credora Hipotecária/Fiduciária',
      motivacao_judicial: 'Ação de Execução de Título Extrajudicial — Cobrança de Cotas Condominiais relativas ao imóvel penhorado',
      segredo_justica: 'Não',
      principais_pecas: [
        {
          peca: 'Petição Inicial de Cobrança',
          pagina: '1-15',
          descricao: 'Inicia a ação de execução com demonstrativo de débito e planilha atualizada das frações condominiais inadimplidas.'
        },
        {
          peca: 'Citação Válida do Executado',
          pagina: '48',
          descricao: 'Certidão do Oficial de Justiça atesta entrega do mandado, minimizando o risco de futura nulidade por falta de citação.'
        },
        {
          peca: 'Auto de Penhora e Avaliação',
          pagina: '112',
          descricao: 'Penhora averbada devidamente sobre a fração do imóvel. Descrição física minuciosa do imóvel compatível com o edital.'
        },
        {
          peca: 'Manifestação do Credor',
          pagina: '185',
          descricao: 'O credor com garantia real intervém, ciente da hasta pública e requerendo preferência de crédito sobre o preço.'
        },
        {
          peca: 'Edital Judicial Homologado',
          pagina: '310',
          descricao: `Assinatura eletrônica do juiz da vara decretando as datas de leilão, garantindo plena lisura procedimental.`
        }
      ]
    },
    acoes_ex_mutuario: {
      acoes_localizadas: [
        {
          processo: anotherProcessNumber1,
          tribunal: displayTribunal,
          tipo: 'Ação Anulatória contra Banco Exequente',
          risco: 'BAIXO',
          motivacao_risco: 'Julgado improcedente com trânsito em julgado. Não há liminar nem efeito suspensivo ativo capaz de obstaculizar os efeitos de arrematação judicial.',
          status: 'Arquivado Definitivamente'
        },
        {
          processo: anotherProcessNumber2,
          tribunal: displayTribunalFederal,
          tipo: 'Embargos à Execução Fiscal (Inscrição Municipal - IPTU)',
          risco: 'MÉDIO',
          motivacao_risco: 'Discute a base de cálculo da dívida ativa municipal. Com a cláusula de sub-rogabilidade de débitos do edital e Art. 130 do CTN, a pendência sub-roga-se no valor pago pela arrematação, mas o investidor deve monitorar para evitar bloqueios cartorários temporários.',
          status: 'Agravado de Instrumento pendente'
        },
        {
          processo: anotherProcessNumber3,
          tribunal: displayTribunal,
          tipo: 'Ação de Recuperação Judicial das Empresas do Grupo',
          risco: 'MÉDIO',
          motivacao_risco: 'Assembleia de credores em andamento. Imóvel penhorado por dívida condominial (propter rem), que tem preferência legal por resguardar a própria estrutura física da unidade.',
          status: 'Em instrução processual'
        }
      ],
      risco_geral_acoes: 'MÉDIO',
      comentarios_pesquisa: 'Pesquisa realizada com rigor cível nos distribuidores cível, fiscal e federal da comarca do imóvel e domicílio do ex-proprietário. Os riscos são controlados devido à natureza propter rem das cotas de condomínio e da expressa sub-rogação de débitos fiscais no edital.'
    },
    gravames_matricula_processo: {
      gravames_analisados: [
        {
          gravame: 'R-4: Hipoteca ou Alienação Fiduciária ativa',
          possui_risco: 'Não',
          analise: 'O credor fiduciante/hipotecário foi intimado do leilão em conformidade com o Código de Processo Civil. A garantia será devidamente extinta ou sub-rogada com a arrematação após a partilha do preço arrecadado.'
        },
        {
          gravame: 'R-5: Penhora judicial nos autos principais',
          possui_risco: 'Não',
          analise: 'Trata-se exatamente da penhora que deu origem a este leilão público. Será cancelada por ordem direta do juízo (carta de arrematação) tão logo homologada a hasta.'
        }
      ]
    },
    averbacao_area_construida: {
      imovel_e_casa: true,
      status_averbacao: 'Não averbada',
      idade_construcao_anos: '9 years',
      prescricao_iss_5_anos: 'Sim (Prescreveu - sem ISS)',
      estimativa_custos_regularizacao: 'R$ 6.500,00',
      detalhes_regularizacao: `Comprovado o lapso temporal superior a 5 anos pela data das faturas de energia e imagens históricas do Street View. O imposto de construção civil municipal (ISS/INSS) está integralmente prescrito nos termos do CTN. Custos computados restringem-se a laudo técnico de vistoria assinado por engenheiro civil habilitado (ART/RRT), taxas administrativas perante a ${displayPrefeitura} e emolumentos do ${displayCartorio} para averbação del memorial descritivo.`
    }
  };
}
