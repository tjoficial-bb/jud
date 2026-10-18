import React, { useState, useMemo } from 'react';
import {
  FileText,
  Home,
  Ruler,
  BedDouble,
  Bath,
  Car,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Compass,
  Wrench,
  Award,
  TrendingUp,
  Layers,
  Copy,
  Check,
  Printer,
  Sparkles,
  Scale,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  ClipboardCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsonrepair } from 'jsonrepair';
import { ReportCustomExporterBar } from './ReportCustomExporterBar';
import { ExportSectionItem } from '../utils/modularReportExporter';
import { SmartAnalysisData } from './SmartAnalysisTab';

export interface LaudoAmostraComparativa {
  identificacao?: string;
  endereco_referencia?: string;
  area_m2?: string;
  valor_total?: string;
  valor_m2?: string;
  quartos_vagas?: string;
  fonte_imobiliaria?: string;
}

export interface LaudoReportData {
  kpis?: {
    valor_avaliacao_mercado?: string;
    valor_avaliacao_numerico?: number;
    valor_liquidacao_forcada?: string;
    valor_liquidacao_numerico?: number;
    valor_m2_avaliado?: string;
    valor_m2_numerico?: number;
    data_laudo?: string;
    estado_conservacao_resumo?: string;
    padrao_construtivo_resumo?: string;
    liquidez_estimada?: string;
  };
  valores_avaliacao?: {
    valor_mercado?: string;
    valor_liquidacao_forcada?: string;
    valor_minimo_campo_arbitrio?: string;
    valor_maximo_campo_arbitrio?: string;
    valor_terreno_isolado?: string;
    valor_benfeitorias?: string;
    valor_unitario_m2?: string;
    data_base_avaliacao?: string;
    defasagem_temporal_analise?: string;
    custo_estimado_reforma_numerico?: number;
    custo_estimado_reforma_texto?: string;
  };
  caracteristicas_imovel?: {
    tipo_imovel?: string;
    uso_vocacao?: string;
    quartos?: string | number;
    suites?: string | number;
    banheiros?: string | number;
    lavabos?: string | number;
    vagas_garagem?: string | number;
    tipo_vaga_garagem?: string;
    salas?: string;
    cozinha_copa?: string;
    area_servico_lavanderia?: string;
    varanda_sacada_gourmet?: string;
    outros_comodos?: string;
    divisao_interna_completa?: string;
    posicao_solar_andar?: string;
    mobilia_equipamentos?: string;
  };
  quadro_areas?: {
    area_privativa_m2?: string | number;
    area_construida_m2?: string | number;
    area_terreno_m2?: string | number;
    area_comum_m2?: string | number;
    area_total_m2?: string | number;
    fracao_ideal?: string;
    testada_frente?: string;
    dimensoes_terreno?: string;
    topografia?: string;
    formato_terreno?: string;
    divergencia_area_averbada?: string;
  };
  padrao_e_vistoria?: {
    padrao_acabamento?: string;
    estado_conservacao?: string;
    idade_aparente_anos?: string;
    vida_util_estimada?: string;
    tipo_vistoria?: string;
    ocupacao_constatada?: string;
    acesso_interno_permitido?: string;
    materiais_acabamento?: string;
    estrutura_cobertura?: string;
    patologias_e_avarias?: string[];
    benfeitorias_relevantes?: string[];
  };
  condominio_e_regiao?: {
    nome_condominio_edificio?: string;
    numero_andares_pavimentos?: string;
    unidades_por_andar?: string;
    numero_elevadores?: string;
    portaria_seguranca?: string;
    itens_lazer?: string[];
    endereco_completo_laudo?: string;
    bairro?: string;
    cidade_uf?: string;
    matricula_referenciada?: string;
    inscricao_iptu_sql?: string;
    infraestrutura_urbana?: string;
    equipamentos_comunitarios_entorno?: string;
    polo_valorizacao_liquidez?: string;
  };
  metodologia_tecnica?: {
    metodo_utilizado?: string;
    norma_abnt?: string;
    grau_fundamentacao?: string;
    grau_precisao?: string;
    responsavel_tecnico?: string;
    registro_profissional_crea_cau?: string;
    orgao_destinatario?: string;
    numero_laudo_processo?: string;
    amostras_comparativas?: LaudoAmostraComparativa[];
  };
  relacao_estrategica?: {
    comparativo_laudo_vs_edital_matricula?: string;
    analise_preco_vil_e_margem?: string;
    pontos_fortes_valorizacao?: string[];
    pontos_atencao_riscos_tecnicos?: string[];
    parecer_conclusivo_investidor?: string;
  };
}

interface LaudoReportProps {
  rawAnalysis: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  valuation?: number;
  bidValue?: number;
  expectedSaleValue?: number;
  estimatedProfit?: number;
  roi?: number;
  tir?: number;
  smartAnalysis?: SmartAnalysisData | null;
  editalAnalysis?: string | null;
  matriculaAnalysis?: string | null;
  onSyncToSystem?: (laudoData: LaudoReportData) => void;
}

export function parseLaudoAnalysisData(rawAnalysis: string): {
  parsedData: LaudoReportData | null;
  cleanMarkdown: string;
} {
  if (!rawAnalysis) return { parsedData: null, cleanMarkdown: '' };

  let data: LaudoReportData | null = null;
  let text = rawAnalysis;

  const extractJsonBlock = (input: string): { jsonCandidate: string | null; remainingText: string } => {
    const startTag = '<analysis_data>';
    const endTag = '</analysis_data>';
    const startIdx = input.indexOf(startTag);
    const endIdx = input.lastIndexOf(endTag);

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonCandidate = input.substring(startIdx + startTag.length, endIdx).trim();
      const remainingText = (input.substring(0, startIdx) + input.substring(endIdx + endTag.length)).trim();
      return { jsonCandidate, remainingText };
    }

    if (startIdx !== -1 && endIdx === -1) {
      const jsonCandidate = input.substring(startIdx + startTag.length).trim();
      const remainingText = input.substring(0, startIdx).trim();
      return { jsonCandidate, remainingText };
    }

    const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"(?:caracteristicas_imovel|valores_avaliacao|quadro_areas)"[\s\S]*?\})\s*```/i;
    const match = input.match(codeBlockRegex);
    if (match) {
      return {
        jsonCandidate: match[1].trim(),
        remainingText: input.replace(match[0], '').trim()
      };
    }

    return { jsonCandidate: null, remainingText: input };
  };

  const { jsonCandidate, remainingText } = extractJsonBlock(rawAnalysis);
  text = remainingText;

  if (jsonCandidate) {
    let cleanCandidate = jsonCandidate
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      data = JSON.parse(cleanCandidate);
    } catch {
      try {
        const repaired = jsonrepair(cleanCandidate);
        data = JSON.parse(repaired);
      } catch (e) {
        console.warn('Falha ao reparar JSON do Laudo Técnico:', e);
      }
    }
  }

  return { parsedData: data, cleanMarkdown: text };
}

function parseNumericCurrency(val?: string | number | null): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/[^\d.,-]/g, '').trim();
  if (!str) return 0;
  if (str.includes(',') && str.includes('.')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  return parseFloat(str) || 0;
}

export const LaudoReport: React.FC<LaudoReportProps> = ({
  rawAnalysis,
  propertyTitle = 'Imóvel em Análise Técnica',
  propertyAddress = '',
  propertyCity = '',
  propertyState = '',
  valuation = 0,
  bidValue = 0,
  expectedSaleValue = 0,
  smartAnalysis,
  onSyncToSystem
}) => {
  const [copied, setCopied] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);

  const { parsedData, cleanMarkdown } = useMemo(
    () => parseLaudoAnalysisData(rawAnalysis),
    [rawAnalysis]
  );

  const laudoValuationNum = useMemo(() => {
    if (!parsedData) return 0;
    return (
      parsedData.kpis?.valor_avaliacao_numerico ||
      parseNumericCurrency(parsedData.kpis?.valor_avaliacao_mercado) ||
      parseNumericCurrency(parsedData.valores_avaliacao?.valor_mercado) ||
      0
    );
  }, [parsedData]);

  const laudoForcedSaleNum = useMemo(() => {
    if (!parsedData) return 0;
    return (
      parsedData.kpis?.valor_liquidacao_numerico ||
      parseNumericCurrency(parsedData.kpis?.valor_liquidacao_forcada) ||
      parseNumericCurrency(parsedData.valores_avaliacao?.valor_liquidacao_forcada) ||
      0
    );
  }, [parsedData]);

  const effectiveBid = bidValue || smartAnalysis?.segundo_leilao_valor || smartAnalysis?.lance_planejado || 0;
  const effectiveSystemValuation = valuation || smartAnalysis?.valor_avaliacao || 0;

  const discountVsLaudo = useMemo(() => {
    if (laudoValuationNum > 0 && effectiveBid > 0 && effectiveBid < laudoValuationNum) {
      return ((laudoValuationNum - effectiveBid) / laudoValuationNum) * 100;
    }
    return null;
  }, [laudoValuationNum, effectiveBid]);

  const handleCopyFull = () => {
    navigator.clipboard.writeText(cleanMarkdown || rawAnalysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncClick = () => {
    if (parsedData && onSyncToSystem) {
      onSyncToSystem(parsedData);
      setSyncedSuccess(true);
      setTimeout(() => setSyncedSuccess(false), 3000);
    }
  };

  const exportSections = useMemo((): ExportSectionItem[] => {
    const sections: ExportSectionItem[] = [];
    if (parsedData) {
      sections.push({
        id: 'laudo-kpis',
        title: '1. Resumo de Avaliação e Valores do Laudo Técnico',
        text: `Valor de Mercado: ${parsedData.kpis?.valor_avaliacao_mercado || parsedData.valores_avaliacao?.valor_mercado || 'Não informado'}\nValor de Liquidação Forçada: ${parsedData.kpis?.valor_liquidacao_forcada || parsedData.valores_avaliacao?.valor_liquidacao_forcada || 'Não informado'}\nValor por m²: ${parsedData.kpis?.valor_m2_avaliado || parsedData.valores_avaliacao?.valor_unitario_m2 || 'Não informado'}\nData Base do Laudo: ${parsedData.kpis?.data_laudo || parsedData.valores_avaliacao?.data_base_avaliacao || 'Não informada'}`,
        selected: true
      });
      sections.push({
        id: 'laudo-caracteristicas',
        title: '2. Características Físicas e Cômodos do Imóvel',
        text: `Tipo: ${parsedData.caracteristicas_imovel?.tipo_imovel || '-'}\nQuartos: ${parsedData.caracteristicas_imovel?.quartos ?? '-'} | Suítes: ${parsedData.caracteristicas_imovel?.suites ?? '-'}\nBanheiros: ${parsedData.caracteristicas_imovel?.banheiros ?? '-'} | Vagas de Garagem: ${parsedData.caracteristicas_imovel?.vagas_garagem ?? '-'}\nDivisão Interna: ${parsedData.caracteristicas_imovel?.divisao_interna_completa || '-'}`,
        selected: true
      });
      sections.push({
        id: 'laudo-areas',
        title: '3. Quadro de Áreas e Metragens',
        text: `Área Privativa: ${parsedData.quadro_areas?.area_privativa_m2 || '-'} m²\nÁrea Construída: ${parsedData.quadro_areas?.area_construida_m2 || '-'} m²\nÁrea do Terreno: ${parsedData.quadro_areas?.area_terreno_m2 || '-'} m²\nÁrea Total: ${parsedData.quadro_areas?.area_total_m2 || '-'} m²\nSituação de Averbação: ${parsedData.quadro_areas?.divergencia_area_averbada || '-'}`,
        selected: true
      });
      sections.push({
        id: 'laudo-relacao',
        title: '4. Relação Cruzada (Laudo × Edital × Matrícula)',
        text: `${parsedData.relacao_estrategica?.comparativo_laudo_vs_edital_matricula || ''}\n\nParecer Conclusivo: ${parsedData.relacao_estrategica?.parecer_conclusivo_investidor || ''}`,
        selected: true
      });
    }
    if (cleanMarkdown) {
      sections.push({
        id: 'laudo-markdown',
        title: '5. Parecer Técnico Detalhado de Engenharia',
        text: cleanMarkdown,
        selected: true
      });
    }
    return sections;
  }, [parsedData, cleanMarkdown]);

  const caract = parsedData?.caracteristicas_imovel;
  const areas = parsedData?.quadro_areas;
  const valores = parsedData?.valores_avaliacao;
  const vistoria = parsedData?.padrao_e_vistoria;
  const condominio = parsedData?.condominio_e_regiao;
  const metodo = parsedData?.metodologia_tecnica;
  const relacao = parsedData?.relacao_estrategica;

  return (
    <div className="space-y-8 font-sans text-brand-ink" id="laudo-report-printable">
      {/* Barra de Exportação e Ações Rápidas */}
      <div className="no-print">
        <ReportCustomExporterBar
          reportTitle={`Análise Técnica de Laudo de Avaliação - ${propertyTitle}`}
          propertyTitle={propertyTitle}
          propertyAddress={`${propertyAddress} ${propertyCity ? `- ${propertyCity}/${propertyState}` : ''}`}
          sections={exportSections}
        />
      </div>

      {/* Header Executivo do Laudo */}
      <div className="bg-gradient-to-br from-brand-paper via-brand-paper to-brand-primary/5 border border-brand-primary/20 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-primary">
              <Ruler size={15} />
              <span>Engenharia de Avaliações & Perícia Imobiliária (ABNT NBR 14.653)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-primary">
              {condominio?.nome_condominio_edificio || propertyTitle}
            </h2>
            <p className="text-xs sm:text-sm text-brand-ink/60 flex items-center gap-2 flex-wrap">
              <MapPin size={14} className="text-brand-primary shrink-0" />
              <span>
                {condominio?.endereco_completo_laudo ||
                  propertyAddress ||
                  'Endereço técnico extraído do laudo pericial'}
                {condominio?.cidade_uf ? ` · ${condominio.cidade_uf}` : propertyCity ? ` · ${propertyCity}/${propertyState}` : ''}
              </span>
              {condominio?.matricula_referenciada && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-brand-ink/80">
                    Matrícula: {condominio.matricula_referenciada}
                  </span>
                </>
              )}
              {condominio?.inscricao_iptu_sql && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-brand-ink/80">
                    IPTU/SQL: {condominio.inscricao_iptu_sql}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 no-print">
            {parsedData && onSyncToSystem && (
              <button
                type="button"
                onClick={handleSyncClick}
                className="flex items-center gap-2 bg-brand-primary text-black px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
                title="Preenche automaticamente os valores de avaliação, metragens, quartos, vagas e características na Análise Smart e no Estudo de Viabilidade"
              >
                {syncedSuccess ? <Check size={15} /> : <RefreshCw size={15} />}
                {syncedSuccess
                  ? 'Sincronizado com Viabilidade & Smart!'
                  : 'Aplicar Dados na Análise Smart & Viabilidade'}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyFull}
              className="flex items-center gap-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar Parecer'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Printer size={14} />
              Imprimir
            </button>
          </div>
        </div>

        {/* Linha de KPIs de Avaliação */}
        {parsedData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-brand-primary/10">
            <div className="bg-brand-bg/50 border border-brand-primary/15 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-brand-ink/50 text-[11px] font-bold uppercase tracking-wider">
                <span>Valor de Avaliação (Mercado)</span>
                <DollarSign size={15} className="text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-500 font-mono">
                {parsedData.kpis?.valor_avaliacao_mercado ||
                  valores?.valor_mercado ||
                  'Não informado'}
              </p>
              <p className="text-[11px] text-brand-ink/50">
                {valores?.valor_minimo_campo_arbitrio && valores?.valor_maximo_campo_arbitrio
                  ? `Intervalo: ${valores.valor_minimo_campo_arbitrio} a ${valores.valor_maximo_campo_arbitrio}`
                  : 'Valor central de mercado apurado no laudo'}
              </p>
            </div>

            <div className="bg-brand-bg/50 border border-brand-primary/15 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-brand-ink/50 text-[11px] font-bold uppercase tracking-wider">
                <span>Valor de Liquidação Forçada</span>
                <TrendingUp size={15} className="text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-amber-500 font-mono">
                {parsedData.kpis?.valor_liquidacao_forcada ||
                  valores?.valor_liquidacao_forcada ||
                  (laudoValuationNum > 0
                    ? `R$ ${(laudoValuationNum * 0.75).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Est.)`
                    : 'Não informado')}
              </p>
              <p className="text-[11px] text-brand-ink/50">
                Referência de venda rápida / liquidez imediata
              </p>
            </div>

            <div className="bg-brand-bg/50 border border-brand-primary/15 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-brand-ink/50 text-[11px] font-bold uppercase tracking-wider">
                <span>Valor Unitário (R$ / m²)</span>
                <Ruler size={15} className="text-brand-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-brand-primary font-mono">
                {parsedData.kpis?.valor_m2_avaliado ||
                  valores?.valor_unitario_m2 ||
                  'Não informado'}
              </p>
              <p className="text-[11px] text-brand-ink/50">
                Data do Laudo: {parsedData.kpis?.data_laudo || valores?.data_base_avaliacao || 'Não consta'}
              </p>
            </div>

            <div className="bg-brand-bg/50 border border-brand-primary/15 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-brand-ink/50 text-[11px] font-bold uppercase tracking-wider">
                <span>Deságio do Leilão vs. Laudo</span>
                <Award size={15} className="text-brand-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-brand-primary font-mono">
                {discountVsLaudo !== null
                  ? `${discountVsLaudo.toFixed(1)}% de Desconto`
                  : parsedData.kpis?.liquidez_estimada || 'A calcular'}
              </p>
              <p className="text-[11px] text-brand-ink/50">
                {effectiveBid > 0
                  ? `Baseado no lance de R$ ${effectiveBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : `Conservação: ${parsedData.kpis?.estado_conservacao_resumo || vistoria?.estado_conservacao || 'Ver abaixo'}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {parsedData && (
        <>
          {/* SEÇÃO 1: CARACTERÍSTICAS DO IMÓVEL E PROGRAMA ARQUITETÔNICO (DESTAQUE PRINCIPAL SOLICITADO) */}
          <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-primary/10 pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-brand-primary flex items-center gap-2.5">
                  <Home size={22} className="text-brand-primary" />
                  Características Físicas e Cômodos do Imóvel
                </h3>
                <p className="text-xs text-brand-ink/60 mt-1">
                  Detalhamento construtivo, distribuição interna de ambientes, vagas de garagem e padrão de acabamento apurados no laudo técnico.
                </p>
              </div>
              <span className="text-xs font-bold text-brand-primary">
                Tipologia: {caract?.tipo_imovel || 'Imóvel Urbano'}
              </span>
            </div>

            {/* Cards Visuais de Cômodos Principais */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-brand-bg/40 border border-brand-primary/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-brand-ink/50 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Quartos / Dorm.</span>
                  <BedDouble size={18} className="text-brand-primary" />
                </div>
                <p className="text-2xl font-bold text-brand-ink">
                  {caract?.quartos !== undefined && caract?.quartos !== '' ? caract.quartos : 'N/I'}
                </p>
                <span className="text-[11px] text-brand-ink/50 mt-1">Dormitórios totais</span>
              </div>

              <div className="bg-brand-bg/40 border border-brand-primary/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-brand-ink/50 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Suítes</span>
                  <Sparkles size={18} className="text-brand-primary" />
                </div>
                <p className="text-2xl font-bold text-brand-ink">
                  {caract?.suites !== undefined && caract?.suites !== '' ? caract.suites : '0'}
                </p>
                <span className="text-[11px] text-brand-ink/50 mt-1">Dormitórios c/ banho</span>
              </div>

              <div className="bg-brand-bg/40 border border-brand-primary/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-brand-ink/50 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Banheiros</span>
                  <Bath size={18} className="text-brand-primary" />
                </div>
                <p className="text-2xl font-bold text-brand-ink">
                  {caract?.banheiros !== undefined && caract?.banheiros !== '' ? caract.banheiros : 'N/I'}
                </p>
                <span className="text-[11px] text-brand-ink/50 mt-1">
                  {caract?.lavabos ? `Inclui ${caract.lavabos} lavabo(s)` : 'Sociais / Suítes / WC'}
                </span>
              </div>

              <div className="bg-brand-bg/40 border border-brand-primary/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-brand-ink/50 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Vagas Garagem</span>
                  <Car size={18} className="text-brand-primary" />
                </div>
                <p className="text-2xl font-bold text-brand-ink">
                  {caract?.vagas_garagem !== undefined && caract?.vagas_garagem !== '' ? caract.vagas_garagem : 'N/I'}
                </p>
                <span className="text-[11px] text-brand-ink/50 mt-1 truncate" title={caract?.tipo_vaga_garagem}>
                  {caract?.tipo_vaga_garagem || 'Vagas identificadas'}
                </span>
              </div>

              <div className="bg-brand-bg/40 border border-brand-primary/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-brand-ink/50 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Área Privativa</span>
                  <Ruler size={18} className="text-brand-primary" />
                </div>
                <p className="text-xl font-bold text-brand-ink font-mono">
                  {areas?.area_privativa_m2 || areas?.area_construida_m2 || 'N/I'}
                  {areas?.area_privativa_m2 && !String(areas.area_privativa_m2).includes('m') ? ' m²' : ''}
                </p>
                <span className="text-[11px] text-brand-ink/50 mt-1">Área útil / construída</span>
              </div>

              <div className="bg-brand-bg/40 border border-brand-primary/10 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-brand-ink/50 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Conservação</span>
                  <ShieldCheck size={18} className="text-brand-primary" />
                </div>
                <p className="text-base font-bold text-brand-ink leading-tight">
                  {vistoria?.estado_conservacao || parsedData.kpis?.estado_conservacao_resumo || 'Regular'}
                </p>
                <span className="text-[11px] text-brand-ink/50 mt-1">
                  Padrão: {vistoria?.padrao_acabamento || parsedData.kpis?.padrao_construtivo_resumo || 'Normal'}
                </span>
              </div>
            </div>

            {/* Detalhamento de Ambientes e Divisão Interna */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-brand-bg/30 border border-brand-border/60 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Distribuição dos Ambientes e Planta
                </h4>
                <p className="text-sm text-brand-ink/85 leading-relaxed">
                  {caract?.divisao_interna_completa ||
                    'Descrição detalhada dos ambientes internos conforme leitura do laudo técnico.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  {caract?.salas && (
                    <div>
                      <span className="text-brand-ink/50 block">Salas / Estar:</span>
                      <span className="font-semibold text-brand-ink">{caract.salas}</span>
                    </div>
                  )}
                  {caract?.cozinha_copa && (
                    <div>
                      <span className="text-brand-ink/50 block">Cozinha / Copa:</span>
                      <span className="font-semibold text-brand-ink">{caract.cozinha_copa}</span>
                    </div>
                  )}
                  {caract?.area_servico_lavanderia && (
                    <div>
                      <span className="text-brand-ink/50 block">Área de Serviço:</span>
                      <span className="font-semibold text-brand-ink">{caract.area_servico_lavanderia}</span>
                    </div>
                  )}
                  {caract?.varanda_sacada_gourmet && (
                    <div>
                      <span className="text-brand-ink/50 block">Varanda / Sacada / Lazer:</span>
                      <span className="font-semibold text-brand-ink">{caract.varanda_sacada_gourmet}</span>
                    </div>
                  )}
                  {caract?.outros_comodos && (
                    <div className="sm:col-span-2">
                      <span className="text-brand-ink/50 block">Outras Dependências / Quintal / Edícula:</span>
                      <span className="font-semibold text-brand-ink">{caract.outros_comodos}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quadro Completo de Metragens e Terreno */}
              <div className="bg-brand-bg/30 border border-brand-border/60 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Quadro Técnico de Áreas, Metragens e Terreno
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-brand-paper rounded-xl border border-brand-border/40">
                    <span className="text-brand-ink/50 block text-[10px] uppercase">Área Privativa</span>
                    <span className="font-bold text-sm font-mono text-brand-ink">
                      {areas?.area_privativa_m2 || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-paper rounded-xl border border-brand-border/40">
                    <span className="text-brand-ink/50 block text-[10px] uppercase">Área Construída</span>
                    <span className="font-bold text-sm font-mono text-brand-ink">
                      {areas?.area_construida_m2 || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-paper rounded-xl border border-brand-border/40">
                    <span className="text-brand-ink/50 block text-[10px] uppercase">Área do Terreno</span>
                    <span className="font-bold text-sm font-mono text-brand-ink">
                      {areas?.area_terreno_m2 || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-paper rounded-xl border border-brand-border/40">
                    <span className="text-brand-ink/50 block text-[10px] uppercase">Área Comum</span>
                    <span className="font-bold text-sm font-mono text-brand-ink">
                      {areas?.area_comum_m2 || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-paper rounded-xl border border-brand-border/40">
                    <span className="text-brand-ink/50 block text-[10px] uppercase">Área Total</span>
                    <span className="font-bold text-sm font-mono text-brand-ink">
                      {areas?.area_total_m2 || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-paper rounded-xl border border-brand-border/40">
                    <span className="text-brand-ink/50 block text-[10px] uppercase">Fração Ideal</span>
                    <span className="font-bold text-sm font-mono text-brand-ink">
                      {areas?.fracao_ideal || '-'}
                    </span>
                  </div>
                </div>

                {(areas?.dimensoes_terreno || areas?.topografia || areas?.divergencia_area_averbada) && (
                  <div className="pt-2 space-y-1.5 text-xs border-t border-brand-border/40">
                    {areas?.dimensoes_terreno && (
                      <p>
                        <span className="text-brand-ink/50">Dimensões / Testada: </span>
                        <span className="font-semibold">{areas.dimensoes_terreno}</span>
                        {areas.topografia ? ` · Topografia: ${areas.topografia}` : ''}
                      </p>
                    )}
                    {areas?.divergencia_area_averbada && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 flex items-start gap-2 mt-2">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <span>
                          <strong>Situação de Averbação de Área:</strong> {areas.divergencia_area_averbada}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: RELAÇÃO E CRUZAMENTO INTELIGENTE (LAUDO TÉCNICO × SISTEMA / EDITAL / MATRÍCULA) */}
          <div className="bg-brand-paper border border-brand-primary/25 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-primary/10 pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-brand-primary flex items-center gap-2.5">
                  <Scale size={22} className="text-brand-primary" />
                  Relação e Cruzamento: Laudo Técnico × Edital × Matrícula × Viabilidade
                </h3>
                <p className="text-xs text-brand-ink/60 mt-1">
                  Confronto automático entre os parâmetros técnicos extraídos do Laudo de Avaliação e os dados cadastrados nas demais abas do imóvel.
                </p>
              </div>
              {onSyncToSystem && (
                <button
                  type="button"
                  onClick={handleSyncClick}
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                >
                  <ArrowUpRight size={14} />
                  Sincronizar parâmetros com o estudo
                </button>
              )}
            </div>

            {/* Tabela Comparativa Direta */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-[11px] uppercase tracking-wider text-brand-ink/50">
                    <th className="py-3 px-4">Parâmetro Chave</th>
                    <th className="py-3 px-4 text-brand-primary">Apurado no Laudo Técnico</th>
                    <th className="py-3 px-4">Sistema / Edital / Matrícula</th>
                    <th className="py-3 px-4">Análise de Relação / Impacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  <tr>
                    <td className="py-3.5 px-4 font-bold">Valor de Avaliação</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                      {parsedData.kpis?.valor_avaliacao_mercado || valores?.valor_mercado || 'N/I'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {effectiveSystemValuation > 0
                        ? `R$ ${effectiveSystemValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'Não preenchido no sistema'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-brand-ink/75">
                      {laudoValuationNum > 0 && effectiveSystemValuation > 0
                        ? Math.abs(laudoValuationNum - effectiveSystemValuation) < 100
                          ? 'Valores convergentes entre Laudo e Edital/Sistema'
                          : `Diferença de R$ ${Math.abs(laudoValuationNum - effectiveSystemValuation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} entre o Laudo e o valor atual`
                        : 'Clique em "Aplicar Dados" para adotar o valor do laudo na viabilidade'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-bold">Lance Mínimo vs. Laudo</td>
                    <td className="py-3.5 px-4 font-mono">
                      Liquidação: {parsedData.kpis?.valor_liquidacao_forcada || valores?.valor_liquidacao_forcada || 'N/I'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                      {effectiveBid > 0
                        ? `R$ ${effectiveBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'Lance não definido'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-brand-ink/75">
                      {discountVsLaudo !== null
                        ? `O lance representa ${discountVsLaudo.toFixed(1)}% de deságio sobre a avaliação técnica do laudo`
                        : 'Defina o lance mínimo para calcular o deságio frente ao laudo'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-bold">Metragens (Privativa / Construída / Terreno)</td>
                    <td className="py-3.5 px-4 font-mono">
                      Priv: {areas?.area_privativa_m2 || '-'} | Const: {areas?.area_construida_m2 || '-'} | Terr: {areas?.area_terreno_m2 || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {smartAnalysis && (smartAnalysis.area_privativa || smartAnalysis.area_construida || smartAnalysis.area_terreno)
                        ? `Priv: ${smartAnalysis.area_privativa || 0}m² | Const: ${smartAnalysis.area_construida || 0}m² | Terr: ${smartAnalysis.area_terreno || 0}m²`
                        : 'Aguardando sincronização'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-brand-ink/75">
                      {areas?.divergencia_area_averbada || 'Verifique se toda a área construída medida no laudo consta averbada na matrícula'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-bold">Tipologia, Quartos, Banheiros e Vagas</td>
                    <td className="py-3.5 px-4">
                      {caract?.tipo_imovel || '-'} · {caract?.quartos ?? '-'} qts ({caract?.suites ?? 0} suítes) · {caract?.banheiros ?? '-'} banh · {caract?.vagas_garagem ?? '-'} vaga(s)
                    </td>
                    <td className="py-3.5 px-4">
                      {smartAnalysis?.tipo_imovel && smartAnalysis.tipo_imovel !== 'Selecione'
                        ? `${smartAnalysis.tipo_imovel} (${smartAnalysis.observacoes_imovel ? 'Com descrição na Smart' : 'Sem detalhes de cômodos'})`
                        : 'Não detalhado na Smart'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-brand-ink/75">
                      O laudo técnico detalha a planta física real para precificação de revenda e locação
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-bold">Situação Ocupacional e Vistoria</td>
                    <td className="py-3.5 px-4">
                      {vistoria?.ocupacao_constatada || 'Não informada'} ({vistoria?.tipo_vistoria || 'Vistoria padrão'})
                    </td>
                    <td className="py-3.5 px-4">
                      {smartAnalysis?.situacao_ocupacional || smartAnalysis?.status_ocupacao || 'Não verificado'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-brand-ink/75">
                      {vistoria?.acesso_interno_permitido
                        ? `Acesso interno na vistoria: ${vistoria.acesso_interno_permitido}`
                        : 'Importante para estimar estado interno e reforma'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Parecer de Relação e Divergências da IA */}
            {(relacao?.comparativo_laudo_vs_edital_matricula || relacao?.analise_preco_vil_e_margem || relacao?.parecer_conclusivo_investidor) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {relacao?.comparativo_laudo_vs_edital_matricula && (
                  <div className="bg-brand-bg/40 border border-brand-border/60 rounded-2xl p-5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center gap-2">
                      <Layers size={15} />
                      Cruzamento Técnico (Laudo × Matrícula × Edital)
                    </h4>
                    <p className="text-xs sm:text-sm text-brand-ink/80 leading-relaxed">
                      {relacao.comparativo_laudo_vs_edital_matricula}
                    </p>
                  </div>
                )}
                {(relacao?.analise_preco_vil_e_margem || relacao?.parecer_conclusivo_investidor) && (
                  <div className="bg-brand-bg/40 border border-brand-border/60 rounded-2xl p-5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center gap-2">
                      <ClipboardCheck size={15} />
                      Parecer de Avaliação, Preço Vil e Margem de Segurança
                    </h4>
                    <p className="text-xs sm:text-sm text-brand-ink/80 leading-relaxed">
                      {relacao.analise_preco_vil_e_margem}
                      {relacao.analise_preco_vil_e_margem && relacao.parecer_conclusivo_investidor ? ' ' : ''}
                      {relacao.parecer_conclusivo_investidor}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pontos Fortes vs Pontos de Atenção Técnicos */}
            {((relacao?.pontos_fortes_valorizacao && relacao.pontos_fortes_valorizacao.length > 0) ||
              (relacao?.pontos_atencao_riscos_tecnicos && relacao.pontos_atencao_riscos_tecnicos.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {relacao?.pontos_fortes_valorizacao && relacao.pontos_fortes_valorizacao.length > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      Pontos Fortes de Valorização e Liquidez (Laudo)
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-brand-ink/85">
                      {relacao.pontos_fortes_valorizacao.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {relacao?.pontos_atencao_riscos_tecnicos && relacao.pontos_atencao_riscos_tecnicos.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                      <AlertTriangle size={15} />
                      Pontos de Atenção Técnicos, Depreciação ou Reforma
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-brand-ink/85">
                      {relacao.pontos_atencao_riscos_tecnicos.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SEÇÃO 3: VISTORIA, CONSERVAÇÃO, INFRAESTRUTURA E METODOLOGIA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vistoria, Acabamentos e Patologias */}
            <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-serif font-bold text-brand-primary flex items-center gap-2 border-b border-brand-primary/10 pb-3">
                <Wrench size={18} className="text-brand-primary" />
                Vistoria Técnica, Conservação e Reforma
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Tipo de Vistoria:</span>
                  <span className="font-bold text-brand-ink">{vistoria?.tipo_vistoria || 'Não especificado'}</span>
                </div>
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Idade Aparente / Vida Útil:</span>
                  <span className="font-bold text-brand-ink">
                    {vistoria?.idade_aparente_anos || 'N/I'}
                    {vistoria?.vida_util_estimada ? ` (Vida útil: ${vistoria.vida_util_estimada})` : ''}
                  </span>
                </div>
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Padrão Construtivo:</span>
                  <span className="font-bold text-brand-ink">{vistoria?.padrao_acabamento || 'Normal'}</span>
                </div>
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Custo Estimado de Reforma:</span>
                  <span className="font-bold text-brand-primary font-mono">
                    {valores?.custo_estimado_reforma_texto || 'Conforme vistoria'}
                  </span>
                </div>
              </div>

              {vistoria?.materiais_acabamento && (
                <div className="text-xs space-y-1">
                  <span className="text-brand-ink/50 font-bold uppercase tracking-wider block">
                    Materiais e Acabamentos (Piso, Revestimento, Esquadrias, Cobertura):
                  </span>
                  <p className="text-brand-ink/80 leading-relaxed">{vistoria.materiais_acabamento}</p>
                </div>
              )}

              {vistoria?.patologias_e_avarias && vistoria.patologias_e_avarias.length > 0 && (
                <div className="text-xs space-y-1.5 pt-2 border-t border-brand-border/40">
                  <span className="text-amber-500 font-bold uppercase tracking-wider block">
                    Patologias, Vícios Construtivos ou Reparos Apontados:
                  </span>
                  <ul className="space-y-1 text-brand-ink/80">
                    {vistoria.patologias_e_avarias.map((p, idx) => (
                      <li key={idx}>• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Condomínio, Edifício e Infraestrutura da Região */}
            <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-serif font-bold text-brand-primary flex items-center gap-2 border-b border-brand-primary/10 pb-3">
                <Building2 size={18} className="text-brand-primary" />
                Condomínio, Lazer e Infraestrutura Urbana
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Edifício / Condomínio:</span>
                  <span className="font-bold text-brand-ink">{condominio?.nome_condominio_edificio || 'Não aplicável / Casa'}</span>
                </div>
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Andares / Elevadores:</span>
                  <span className="font-bold text-brand-ink">
                    {condominio?.numero_andares_pavimentos || '-'} · Elev.: {condominio?.numero_elevadores || '-'}
                  </span>
                </div>
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Portaria e Segurança:</span>
                  <span className="font-bold text-brand-ink">{condominio?.portaria_seguranca || 'Padrão'}</span>
                </div>
                <div className="p-3 bg-brand-bg/40 rounded-xl">
                  <span className="text-brand-ink/50 block">Liquidez e Vocação Regional:</span>
                  <span className="font-bold text-brand-ink">{condominio?.polo_valorizacao_liquidez || caract?.uso_vocacao || 'Residencial'}</span>
                </div>
              </div>

              {condominio?.itens_lazer && condominio.itens_lazer.length > 0 && (
                <div className="text-xs space-y-1.5">
                  <span className="text-brand-ink/50 font-bold uppercase tracking-wider block">
                    Itens de Lazer e Comodidades do Condomínio:
                  </span>
                  <p className="text-brand-ink/85 font-medium">
                    {condominio.itens_lazer.join(' · ')}
                  </p>
                </div>
              )}

              {condominio?.infraestrutura_urbana && (
                <div className="text-xs space-y-1 pt-2 border-t border-brand-border/40">
                  <span className="text-brand-ink/50 font-bold uppercase tracking-wider block">
                    Infraestrutura Urbana e Serviços Públicos no Entorno:
                  </span>
                  <p className="text-brand-ink/80 leading-relaxed">
                    {condominio.infraestrutura_urbana}
                    {condominio.equipamentos_comunitarios_entorno ? ` · ${condominio.equipamentos_comunitarios_entorno}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 4: METODOLOGIA TÉCNICA E AMOSTRAS DE MERCADO DO LAUDO */}
          {metodo && (
            <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-primary/10 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-brand-primary flex items-center gap-2">
                    <Compass size={19} className="text-brand-primary" />
                    Metodologia Pericial (NBR 14.653) e Amostras Comparativas do Laudo
                  </h3>
                  <p className="text-xs text-brand-ink/60 mt-0.5">
                    Dados de fundamentação estatística, perito avaliador e imóveis paradigma utilizados na formação do valor.
                  </p>
                </div>
                {metodo.norma_abnt && (
                  <span className="text-xs font-mono text-brand-ink/60">
                    {metodo.norma_abnt}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-border/40">
                  <span className="text-brand-ink/50 block uppercase text-[10px] font-bold">Método Avaliatório</span>
                  <span className="font-bold text-brand-ink mt-1 block">{metodo.metodo_utilizado || 'Comparativo Direto de Mercado'}</span>
                </div>
                <div className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-border/40">
                  <span className="text-brand-ink/50 block uppercase text-[10px] font-bold">Fundamentação / Precisão</span>
                  <span className="font-bold text-brand-ink mt-1 block">
                    Fund.: {metodo.grau_fundamentacao || 'N/I'} · Prec.: {metodo.grau_precisao || 'N/I'}
                  </span>
                </div>
                <div className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-border/40">
                  <span className="text-brand-ink/50 block uppercase text-[10px] font-bold">Perito / Engenheiro Responsável</span>
                  <span className="font-bold text-brand-ink mt-1 block">
                    {metodo.responsavel_tecnico || 'Não informado'}
                    {metodo.registro_profissional_crea_cau ? ` (${metodo.registro_profissional_crea_cau})` : ''}
                  </span>
                </div>
                <div className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-border/40">
                  <span className="text-brand-ink/50 block uppercase text-[10px] font-bold">Órgão / Instituição Emissora</span>
                  <span className="font-bold text-brand-ink mt-1 block">
                    {metodo.orgao_destinatario || 'Juízo / Instituição Financeira'}
                  </span>
                </div>
              </div>

              {metodo.amostras_comparativas && metodo.amostras_comparativas.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                    Amostras de Mercado Citadas no Laudo ({metodo.amostras_comparativas.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-brand-border text-brand-ink/50 uppercase text-[10px]">
                          <th className="py-2.5 px-3">Amostra</th>
                          <th className="py-2.5 px-3">Endereço / Referência</th>
                          <th className="py-2.5 px-3">Área (m²)</th>
                          <th className="py-2.5 px-3">Valor Oferta / Homog.</th>
                          <th className="py-2.5 px-3">Valor R$/m²</th>
                          <th className="py-2.5 px-3">Características / Fonte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/30">
                        {metodo.amostras_comparativas.map((amostra, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-bold text-brand-primary">
                              {amostra.identificacao || `#${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3">{amostra.endereco_referencia || '-'}</td>
                            <td className="py-2.5 px-3 font-mono">{amostra.area_m2 || '-'}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold">{amostra.valor_total || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-500">{amostra.valor_m2 || '-'}</td>
                            <td className="py-2.5 px-3 text-brand-ink/70">
                              {[amostra.quartos_vagas, amostra.fonte_imobiliaria].filter(Boolean).join(' · ') || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SEÇÃO 5: RELATÓRIO DESCRITIVO COMPLETO EM MARKDOWN */}
      {cleanMarkdown && (
        <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
            <h3 className="text-lg font-serif font-bold text-brand-primary flex items-center gap-2">
              <FileText size={18} className="text-brand-primary" />
              Parecer Técnico Completo do Laudo de Avaliação
            </h3>
          </div>
          <div className="markdown-body font-sans text-brand-ink/90 leading-relaxed text-sm antialiased space-y-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMarkdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
export default LaudoReport;
