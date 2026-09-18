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
  DollarSign,
  Ruler
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsonrepair } from 'jsonrepair';
import { ReportCustomExporterBar } from './ReportCustomExporterBar';
import { ExportSectionItem } from '../utils/modularReportExporter';
import { AssessorPitchAndTipsCard } from './AssessorPitchAndTipsCard';

// Robust types for the structured matrícula data
export interface MatriculaAto {
  tipo: string;
  data?: string;
  valor?: string;
  descricao?: string;
  partes?: string;
  natureza?: string;
  impacto?: string;
}

export interface MatriculaParte {
  nome: string;
  documento?: string;
  tipo?: string;
  participacao?: string;
  estado_civil?: string;
  regime?: string;
  detalhes?: string;
}

export interface ProprietarioAntesConsolidacao {
  nome: string;
  documento?: string;
  tipo?: string;
  estado_civil?: string;
  conjuge?: string;
  documento_conjuge?: string;
  regime_bens?: string;
  profissao?: string;
  endereco?: string;
  ato_aquisicao?: string;
  ato_alienacao_fiduciaria?: string;
  ato_consolidacao?: string;
  credor_fiduciario?: string;
  data_consolidacao?: string;
  observacoes?: string;
}

export interface ConsolidacaoPropriedadeInfo {
  houve_consolidacao: boolean;
  data_consolidacao?: string;
  ato_consolidacao?: string;
  credor_fiduciario?: string;
  devedores_fiduciantes_originais?: string[];
  valor_divida_avaliacao?: string;
  resumo_consolidacao?: string;
}

export interface MatriculaOnus {
  tipo?: string;
  status?: string;
  subtipo?: string;
  prioridade?: string;
  valor?: string;
  credor?: string;
  devedor?: string;
  data_constituicao?: string;
}

export interface MatriculaReportData {
  kpis: {
    num_vendas: number;
    ultimo_venda_valor: string;
    num_onus_ativos: number;
    num_processos_judiciais: number;
  };
  proprietario_atual: string[];
  proprietarios_anteriores: Array<{ nome: string; documento?: string }>;
  proprietarios_antes_consolidacao?: ProprietarioAntesConsolidacao[];
  consolidacao_propriedade?: ConsolidacaoPropriedadeInfo;
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
  cadeia_registral?: MatriculaAto[];
  proprietarios_e_partes?: {
    atuais?: MatriculaParte[];
    anteriores?: MatriculaParte[];
    credores?: MatriculaParte[];
  };
  onus_gravames?: MatriculaOnus[];
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
  propertyId?: string | null;
  analysisId?: string | null;
  customDomain?: string;
}

interface MatriculaConsolidacaoCardProps {
  proprietariosAntesConsolidacao?: ProprietarioAntesConsolidacao[];
  consolidacao?: ConsolidacaoPropriedadeInfo;
  cadeiaRegistral?: MatriculaAto[];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

export const MatriculaConsolidacaoCard: React.FC<MatriculaConsolidacaoCardProps> = ({
  proprietariosAntesConsolidacao = [],
  consolidacao,
  cadeiaRegistral = [],
  onCopy,
  copiedId
}) => {
  const [showLegalTips, setShowLegalTips] = useState(false);

  const hasConsolidacao = proprietariosAntesConsolidacao.length > 0 || !!consolidacao?.houve_consolidacao;
  if (!hasConsolidacao) return null;

  const allDocs = proprietariosAntesConsolidacao
    .map(p => `${p.nome}${p.documento ? ` (${p.documento})` : ''}`)
    .join('; ');

  return (
    <div id="matricula-consolidacao-card" className="bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.03] to-transparent dark:from-amber-950/25 dark:via-amber-950/10 border-2 border-amber-500/35 rounded-3xl p-5 sm:p-6 shadow-md shadow-amber-500/5 relative overflow-hidden transition-all">
      {/* Decorative Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Award size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/25">
                Destaque Registral · Lei 9.514/97
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-brand-ink leading-tight mt-0.5">
              Últimos Proprietários Antes da Consolidação da Propriedade
            </h3>
            <p className="text-xs text-brand-ink/65 leading-snug">
              Devedores fiduciantes / mutuários originários executados antes da consolidação em nome do credor
            </p>
          </div>
        </div>

        {allDocs && (
          <button
            type="button"
            onClick={() => onCopy(allDocs, 'copiar_ex_proprietarios')}
            className="self-start sm:self-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5"
            title="Copiar nomes e documentos dos devedores fiduciantes"
          >
            {copiedId === 'copiar_ex_proprietarios' ? <Check size={13} /> : <Copy size={13} />}
            {copiedId === 'copiar_ex_proprietarios' ? 'Copiado!' : 'Copiar Ex-Proprietários'}
          </button>
        )}
      </div>

      {/* Consolidation Context Badges */}
      {(consolidacao?.ato_consolidacao || consolidacao?.data_consolidacao || consolidacao?.credor_fiduciario) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-xs">
          <div>
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">Ato de Consolidação</span>
            <span className="font-bold text-brand-ink">{consolidacao.ato_consolidacao || 'Averbado (AV)'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">Data da Consolidação</span>
            <span className="font-bold text-brand-ink">{consolidacao.data_consolidacao || 'Conforme Certidão'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">Credor que Consolidou</span>
            <span className="font-bold text-brand-ink truncate block" title={consolidacao.credor_fiduciario}>
              {consolidacao.credor_fiduciario || 'Instituição Financeira / Credor'}
            </span>
          </div>
        </div>
      )}

      {/* Owners Cards */}
      <div className="space-y-3">
        {proprietariosAntesConsolidacao.length > 0 ? (
          proprietariosAntesConsolidacao.map((prop, idx) => (
            <div 
              key={idx}
              className="bg-brand-paper dark:bg-neutral-900/60 rounded-2xl border border-amber-500/25 p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-brand-border/40">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    Devedor Fiduciante / Mutuário Originário {proprietariosAntesConsolidacao.length > 1 ? `#${idx + 1}` : ''}
                  </span>
                  <p className="text-base font-extrabold text-brand-ink leading-snug">
                    {prop.nome}
                  </p>
                </div>
                {prop.documento && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-brand-bg/80 text-brand-ink rounded-lg border border-brand-border">
                      {prop.documento.length > 14 ? 'CNPJ' : 'CPF'}: {prop.documento}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopy(prop.documento || '', `doc_prop_${idx}`)}
                      className="p-1.5 text-brand-ink/50 hover:text-amber-600 transition-all rounded-lg hover:bg-amber-500/10"
                      title="Copiar CPF/CNPJ"
                    >
                      {copiedId === `doc_prop_${idx}` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Grid of Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs font-sans">
                {prop.estado_civil && (
                  <div>
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Estado Civil:</span>
                    <span className="font-bold text-brand-ink">{prop.estado_civil}</span>
                  </div>
                )}
                {prop.conjuge && (
                  <div>
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Cônjuge:</span>
                    <span className="font-bold text-brand-ink">
                      {prop.conjuge} {prop.documento_conjuge ? `(Doc: ${prop.documento_conjuge})` : ''}
                    </span>
                  </div>
                )}
                {prop.regime_bens && (
                  <div>
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Regime de Bens:</span>
                    <span className="font-bold text-brand-ink">{prop.regime_bens}</span>
                  </div>
                )}
                {prop.profissao && (
                  <div>
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Profissão:</span>
                    <span className="font-bold text-brand-ink">{prop.profissao}</span>
                  </div>
                )}
                {prop.ato_aquisicao && (
                  <div>
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Registro de Aquisição Originária:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">{prop.ato_aquisicao}</span>
                  </div>
                )}
                {prop.ato_alienacao_fiduciaria && (
                  <div>
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Alienação Fiduciária:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">{prop.ato_alienacao_fiduciaria}</span>
                  </div>
                )}
                {prop.ato_consolidacao && (
                  <div>
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Consolidação da Propriedade:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{prop.ato_consolidacao}</span>
                  </div>
                )}
                {prop.credor_fiduciario && (
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-brand-ink/50 block font-semibold">Credor Fiduciário (Banco):</span>
                    <span className="font-bold text-brand-ink">{prop.credor_fiduciario}</span>
                  </div>
                )}
              </div>

              {prop.endereco && (
                <div className="pt-2 border-t border-brand-border/30 text-xs">
                  <span className="text-[10px] text-brand-ink/50 block font-semibold">Endereço Registrado:</span>
                  <span className="text-brand-ink/80">{prop.endereco}</span>
                </div>
              )}

              {prop.observacoes && (
                <div className="pt-2 border-t border-brand-border/30 text-xs">
                  <span className="text-[10px] text-brand-ink/50 block font-semibold">Observações Registrais:</span>
                  <span className="text-brand-ink/80 italic">{prop.observacoes}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-border text-xs text-brand-ink/70">
            A averbação de consolidação de propriedade foi indicada na matrícula. Consulte a cadeia registral para verificar o registro originário de compra e venda (R-) e alienação fiduciária.
          </div>
        )}
      </div>

      {/* Strategic Investor Checklist / Legal Tips */}
      <div className="mt-4 pt-3 border-t border-amber-500/20">
        <button
          type="button"
          onClick={() => setShowLegalTips(!showLegalTips)}
          className="w-full flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-900 transition-all py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Scale size={14} className="text-amber-600" />
            Por que é fundamental saber quem são os proprietários antes da consolidação?
          </span>
          <span className="text-[10px] underline">{showLegalTips ? 'Ocultar orientações' : 'Ver orientações jurídicas e posse'}</span>
        </button>

        {showLegalTips && (
          <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 text-xs text-brand-ink/80 space-y-2.5 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">1. Pesquisa Processual Prévia:</span>
              <span>Busque pelo CPF/CNPJ destes devedores fiduciantes no Tribunal de Justiça estadual e TRF para certificar se distribuíram <strong>Ação Anulatória de Consolidação / Leilão Extrajudicial</strong> ou pedido de tutela de urgência contra o banco.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">2. Ação de Imissão na Posse / Desocupação:</span>
              <span>Se o imóvel permanecer ocupado, a Notificação Extrajudicial de Desocupação e a <strong>Ação de Imissão na Posse (art. 30 da Lei 9.514/97)</strong> com pedido de liminar de desocupação em 60 dias serão ajuizadas em face destes ex-proprietários/ocupantes.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">3. Notificação da Purgação da Mora:</span>
              <span>A higidez da consolidação da propriedade perante a Lei 9.514/97 pressupõe a regular notificação prévia dos devedores pelo oficial do Cartório de Registro de Imóveis (art. 26).</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MatriculaReport: React.FC<MatriculaReportProps> = ({ 
  rawAnalysis, 
  propertyTitle = 'Imóvel em Oportunidade de Leilão',
  propertyAddress = '', 
  propertyCity = '', 
  propertyState = '',
  valuation = 0,
  bidValue = 0,
  expectedSaleValue = 0,
  estimatedProfit = 0,
  roi = 0,
  tir = 0,
  propertyId = null,
  analysisId = null,
  customDomain
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
  const [copiedAtoIdx, setCopiedAtoIdx] = useState<number | null>(null);

  // Cadeia Registral UI controls
  const [cadeiaFilter, setCadeiaFilter] = useState<'all' | 'R' | 'AV' | 'gravames' | 'vendas'>('all');
  const [cadeiaSearchQuery, setCadeiaSearchQuery] = useState('');
  const [cadeiaViewMode, setCadeiaViewMode] = useState<'cards' | 'table' | 'timeline'>('timeline');

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

    // Strategy 1: Search for XML-style tag: <analysis_data>...<analysis_data>
    const match = rawAnalysis.match(/<analysis_data>([\s\S]*?)<\/analysis_data>/i);
    if (match) {
      try {
        const cleanedJson = cleanJsonText(match[1]);
        try {
          data = JSON.parse(cleanedJson);
        } catch (_) {
          data = JSON.parse(jsonrepair(cleanedJson));
        }
        cleanMarkdown = rawAnalysis.replace(/<analysis_data>[\s\S]*?<\/analysis_data>/gi, '').trim();
      } catch (err) {
        console.error("Failed to parse structured JSON block in matrix analysis:", err);
      }
    }

    // Strategy 2: Search for ```json ... ``` markdown code block
    if (!data) {
      const codeBlockMatch = rawAnalysis.match(/```(?:json)?\s*([\s\S]*?"(?:kpis|cadeia_registral|identificacao_matricula)"[\s\S]*?)```/i);
      if (codeBlockMatch) {
        try {
          const cleanedJson = cleanJsonText(codeBlockMatch[1]);
          try {
            data = JSON.parse(cleanedJson);
          } catch (_) {
            data = JSON.parse(jsonrepair(cleanedJson));
          }
          cleanMarkdown = rawAnalysis.replace(codeBlockMatch[0], '').trim();
        } catch (err) {
          console.error("Failed to parse code block JSON in matrix analysis:", err);
        }
      }
    }

    // Strategy 3: Fall back to searching for raw JSON object if XML-style tags or code blocks are missing
    if (!data) {
      const jsonRegex = /(\{[\s\S]*"(?:kpis|cadeia_registral|cadeiaRegistral|atos_registrais|identificacao_matricula)"[\s\S]*\})/i;
      const jsonMatch = rawAnalysis.match(jsonRegex);
      if (jsonMatch) {
        try {
          const cleanedJson = cleanJsonText(jsonMatch[1]);
          try {
            data = JSON.parse(cleanedJson);
          } catch (_) {
            data = JSON.parse(jsonrepair(cleanedJson));
          }
          cleanMarkdown = rawAnalysis.replace(jsonMatch[1], '').trim();
        } catch (err) {
          console.error("Failed to parse fallback JSON block in matrix analysis:", err);
        }
      }
    }

    // Normalize any alternate JSON keys if provided by different AI models
    if (data) {
      const rawObj = data as any;
      if (!rawObj.cadeia_registral) {
        rawObj.cadeia_registral = rawObj.cadeiaRegistral || rawObj.atos_registrais || rawObj.atosRegistrais || rawObj.registros_averbacoes || rawObj.historico_registral || rawObj.atos || [];
      }
      if (Array.isArray(rawObj.cadeia_registral)) {
        rawObj.cadeia_registral = rawObj.cadeia_registral.map((item: any) => ({
          tipo: item.tipo || item.code || item.codigo || item.ato || item.id || item.tag || 'R/AV',
          data: item.data || item.date || item.data_registro || item.data_ato || 'Registrado',
          valor: item.valor || item.value || item.preco || item.valor_transacao || undefined,
          descricao: item.descricao || item.description || item.detalhes || item.texto || item.resumo || item.historico || item.ato || '',
          partes: item.partes || item.parties || item.envolvidos || item.qualificacao || undefined,
          natureza: item.natureza || item.natureza_juridica || item.tipo_ato || ((item.tipo || '').toUpperCase().startsWith('R') ? 'Registro Imobiliário' : 'Averbação'),
          impacto: item.impacto || item.impacto_leilao || item.impacto_arrematacao || 'Histórico da Matrícula'
        }));
      }
      if (!rawObj.identificacao_matricula && (rawObj.identificacaoMatricula || rawObj.identificacao)) {
        rawObj.identificacao_matricula = rawObj.identificacaoMatricula || rawObj.identificacao;
      }
      if (!rawObj.caracteristicas_fisicas && (rawObj.caracteristicasFisicas || rawObj.imovel)) {
        rawObj.caracteristicas_fisicas = rawObj.caracteristicasFisicas || rawObj.imovel;
      }
      if (!rawObj.onus_gravames && (rawObj.onusGravames || rawObj.gravames || rawObj.onus)) {
        rawObj.onus_gravames = rawObj.onusGravames || rawObj.gravames || rawObj.onus;
      }
      if (!rawObj.proprietarios_e_partes && (rawObj.proprietariosEPartes || rawObj.proprietarios)) {
        rawObj.proprietarios_e_partes = rawObj.proprietariosEPartes || rawObj.proprietarios;
      }
      if (!rawObj.proprietarios_antes_consolidacao) {
        rawObj.proprietarios_antes_consolidacao = rawObj.proprietariosAntesConsolidacao || rawObj.devedores_fiduciantes || rawObj.ultimos_proprietarios_antes_consolidacao || rawObj.proprietarios_fiduciantes || [];
      }
      if (Array.isArray(rawObj.proprietarios_antes_consolidacao)) {
        rawObj.proprietarios_antes_consolidacao = rawObj.proprietarios_antes_consolidacao.map((item: any) => ({
          nome: item.nome || item.name || item.proprietario || item.devedor || item.mutuario || 'Nome não especificado',
          documento: item.documento || item.cpf || item.cnpj || item.doc || undefined,
          tipo: item.tipo || ((item.documento || item.cpf || '').length > 14 ? 'PJ' : 'PF'),
          estado_civil: item.estado_civil || item.estadoCivil || undefined,
          conjuge: item.conjuge || item.esposa || item.marido || undefined,
          documento_conjuge: item.documento_conjuge || item.cpf_conjuge || undefined,
          regime_bens: item.regime_bens || item.regime || undefined,
          profissao: item.profissao || undefined,
          endereco: item.endereco || undefined,
          ato_aquisicao: item.ato_aquisicao || item.aquisicao || undefined,
          ato_alienacao_fiduciaria: item.ato_alienacao_fiduciaria || item.alienacao || undefined,
          ato_consolidacao: item.ato_consolidacao || item.consolidacao || undefined,
          credor_fiduciario: item.credor_fiduciario || item.banco || item.credor || undefined,
          data_consolidacao: item.data_consolidacao || undefined,
          observacoes: item.observacoes || item.detalhes || undefined
        }));
      }
      if (!rawObj.consolidacao_propriedade && (rawObj.consolidacaoPropriedade || rawObj.consolidacao)) {
        rawObj.consolidacao_propriedade = rawObj.consolidacaoPropriedade || rawObj.consolidacao;
      }
    }

    // If no JSON was found at all, create from heuristic extraction
    if (!data) {
      data = parseHeuristics(rawAnalysis, propertyAddress, propertyCity, propertyState, valuation, bidValue);
    } else {
      // If JSON was found, ensure essential arrays and fields are never empty if the text contains the data!
      const fallbackExtracted = parseHeuristics(rawAnalysis, propertyAddress, propertyCity, propertyState, valuation, bidValue);

      if (!data.cadeia_registral || data.cadeia_registral.length === 0) {
        data.cadeia_registral = fallbackExtracted.cadeia_registral;
      }
      if (!data.onus_gravames || data.onus_gravames.length === 0) {
        data.onus_gravames = fallbackExtracted.onus_gravames;
      }
      if (!data.proprietarios_e_partes || (!data.proprietarios_e_partes.atuais?.length && !data.proprietarios_e_partes.anteriores?.length)) {
        data.proprietarios_e_partes = fallbackExtracted.proprietarios_e_partes;
      }
      if (!data.proprietarios_antes_consolidacao || data.proprietarios_antes_consolidacao.length === 0) {
        if (fallbackExtracted.proprietarios_antes_consolidacao && fallbackExtracted.proprietarios_antes_consolidacao.length > 0) {
          data.proprietarios_antes_consolidacao = fallbackExtracted.proprietarios_antes_consolidacao;
        }
      }
      if (!data.consolidacao_propriedade && fallbackExtracted.consolidacao_propriedade) {
        data.consolidacao_propriedade = fallbackExtracted.consolidacao_propriedade;
      }
      if (!data.processos_judiciais || data.processos_judiciais.length === 0) {
        data.processos_judiciais = fallbackExtracted.processos_judiciais;
      }
      if (!data.identificacao_matricula?.cadastro_imobiliario && fallbackExtracted.identificacao_matricula?.cadastro_imobiliario) {
        if (!data.identificacao_matricula) data.identificacao_matricula = fallbackExtracted.identificacao_matricula;
        else data.identificacao_matricula.cadastro_imobiliario = fallbackExtracted.identificacao_matricula.cadastro_imobiliario;
      }
      if (!data.identificacao_matricula?.numero_matricula || data.identificacao_matricula.numero_matricula === 'Não informado') {
        if (fallbackExtracted.identificacao_matricula?.numero_matricula && fallbackExtracted.identificacao_matricula.numero_matricula !== 'Não informado') {
          if (data.identificacao_matricula) data.identificacao_matricula.numero_matricula = fallbackExtracted.identificacao_matricula.numero_matricula;
        }
      }

      // Re-calculate KPIs if they were 0 or missing
      if (!data.kpis) {
        data.kpis = fallbackExtracted.kpis;
      } else {
        if (!data.kpis.num_vendas && data.cadeia_registral && data.cadeia_registral.length > 0) {
          const vendas = data.cadeia_registral.filter(a => (a.natureza || a.descricao || '').toLowerCase().includes('venda') || (a.tipo || '').toUpperCase().startsWith('R'));
          data.kpis.num_vendas = vendas.length;
        }
        if (!data.kpis.num_onus_ativos && data.onus_gravames && data.onus_gravames.length > 0) {
          data.kpis.num_onus_ativos = data.onus_gravames.length;
        }
        if (!data.kpis.num_processos_judiciais && data.processos_judiciais && data.processos_judiciais.length > 0) {
          data.kpis.num_processos_judiciais = data.processos_judiciais.length;
        }
      }
    }

    return { data, cleanMarkdown };
  }, [rawAnalysis, propertyAddress, propertyCity, propertyState, valuation, bidValue]);

  const data = parsedData.data;

  // Build modular export sections
  const modularSections: ExportSectionItem[] = useMemo(() => {
    if (!data) return [];

    // 1. Resumo Geral
    const resumoText = [
      `📊 INDICADORES DA MATRÍCULA:`,
      `• Vendas registradas: ${data.kpis.num_vendas} ${data.kpis.ultimo_venda_valor ? `(Último valor registrado: ${data.kpis.ultimo_venda_valor})` : ''}`,
      `• Ônus/Gravames ativos: ${data.kpis.num_onus_ativos}`,
      `• Processos judiciais citados: ${data.kpis.num_processos_judiciais}`,
      ``,
      `👤 PROPRIETÁRIO ATUAL:`,
      data.proprietario_atual && data.proprietario_atual.length > 0 ? data.proprietario_atual.map(p => `• ${p}`).join('\n') : '• Não identificado explicitamente',
      ``,
      `🏙️ LOCALIZAÇÃO E CADASTRO:`,
      `• Tipo do imóvel: ${data.imovel_tipo || 'Não informado'}`,
      `• Localização: ${data.localizacao_resumo || 'Não informado'}`,
      `• Inscrição Municipal / IPTU: ${data.identificacao_matricula?.cadastro_imobiliario || data.caracteristicas_fisicas?.cadastro_imobiliario || data.identificacao_matricula?.inscricao_municipal || 'Não localizada'}`,
    ].join('\n');

    // 2. Cadeia Registral
    let cadeiaText = `📜 CADEIA REGISTRAL E HISTÓRICO DE ATOS (R- e AV-):\n\n`;
    if (data.cadeia_registral && data.cadeia_registral.length > 0) {
      cadeiaText += data.cadeia_registral.map((ato, idx) => {
        return [
          `[Ato ${idx + 1}] ${ato.tipo || 'Registro'}${ato.data ? ` (${ato.data})` : ''}`,
          ato.valor ? `  - Valor: ${ato.valor}` : null,
          ato.natureza ? `  - Natureza: ${ato.natureza}` : null,
          ato.partes ? `  - Partes: ${ato.partes}` : null,
          ato.descricao ? `  - Descrição: ${ato.descricao}` : null,
          ato.impacto ? `  - Impacto na Arrematação: ${ato.impacto}` : null,
        ].filter(Boolean).join('\n');
      }).join('\n\n');
    } else {
      cadeiaText += 'Nenhum ato sequencial de registro/averbação discriminado individualmente.';
    }

    // 3. Ônus e Gravames
    let onusText = `⚠️ ÔNUS, PENHORAS E GRAVAMES:\n\n`;
    if (data.onus_gravames && data.onus_gravames.length > 0) {
      onusText += data.onus_gravames.map((onus, idx) => {
        return [
          `[Ônus ${idx + 1}] ${onus.tipo || 'Gravame'} - Status: ${onus.status || 'Ativo'}`,
          onus.subtipo ? `  - Subtipo: ${onus.subtipo}` : null,
          onus.valor ? `  - Valor: ${onus.valor}` : null,
          onus.credor ? `  - Credor/Beneficiário: ${onus.credor}` : null,
          onus.devedor ? `  - Devedor: ${onus.devedor}` : null,
          onus.prioridade ? `  - Prioridade/Ordem: ${onus.prioridade}` : null,
          onus.data_constituicao ? `  - Data de Constituição: ${onus.data_constituicao}` : null,
        ].filter(Boolean).join('\n');
      }).join('\n\n');
    } else {
      onusText += 'Nenhum gravame ou penhora ativa apontada na análise.';
    }

    // 4. Proprietários e Partes
    let partesText = `👥 PROPRIETÁRIOS E PARTES ENVOLVIDAS:\n\n`;
    if (data.proprietarios_antes_consolidacao && data.proprietarios_antes_consolidacao.length > 0) {
      partesText += `⭐ ÚLTIMOS PROPRIETÁRIOS ANTES DA CONSOLIDAÇÃO (DEVEDORES FIDUCIANTES):\n`;
      partesText += data.proprietarios_antes_consolidacao.map(p => 
        `  - ${p.nome} ${p.documento ? `(Doc: ${p.documento})` : ''}${p.conjuge ? ` - Cônjuge: ${p.conjuge}` : ''}${p.regime_bens ? ` - Regime: ${p.regime_bens}` : ''}${p.ato_alienacao_fiduciaria ? ` - Alienação: ${p.ato_alienacao_fiduciaria}` : ''}${p.ato_consolidacao ? ` - Consolidação: ${p.ato_consolidacao}` : ''}`
      ).join('\n') + '\n\n';
    }

    partesText += `• Proprietários Atuais:\n`;
    if (data.proprietarios_e_partes?.atuais && data.proprietarios_e_partes.atuais.length > 0) {
      partesText += data.proprietarios_e_partes.atuais.map(p => `  - ${p.nome} ${p.documento ? `(Doc: ${p.documento})` : ''}${p.regime ? ` - Regime: ${p.regime}` : ''}${p.participacao ? ` - Fração: ${p.participacao}` : ''}`).join('\n');
    } else if (data.proprietario_atual && data.proprietario_atual.length > 0) {
      partesText += data.proprietario_atual.map(p => `  - ${p}`).join('\n');
    } else {
      partesText += `  - Sem registro claro de proprietários atuais.\n`;
    }

    if (data.proprietarios_e_partes?.anteriores && data.proprietarios_e_partes.anteriores.length > 0) {
      partesText += `\n• Proprietários Anteriores:\n`;
      partesText += data.proprietarios_e_partes.anteriores.map(p => `  - ${p.nome} ${p.documento ? `(Doc: ${p.documento})` : ''}`).join('\n');
    }

    if (data.proprietarios_e_partes?.credores && data.proprietarios_e_partes.credores.length > 0) {
      partesText += `\n• Credores e Terceiros Interessados:\n`;
      partesText += data.proprietarios_e_partes.credores.map(c => `  - ${c.nome} ${c.documento ? `(Doc: ${c.documento})` : ''}`).join('\n');
    }

    // 4.1. Seção Exclusiva: Últimos Proprietários Antes da Consolidação
    let consolidacaoText = `⭐ ÚLTIMOS PROPRIETÁRIOS ANTES DA CONSOLIDAÇÃO DA PROPRIEDADE (LEI 9.514/97):\n\n`;
    if (data.proprietarios_antes_consolidacao && data.proprietarios_antes_consolidacao.length > 0) {
      consolidacaoText += data.proprietarios_antes_consolidacao.map((p, idx) => {
        return [
          `[Ex-Proprietário ${idx + 1}] ${p.nome}`,
          p.documento ? `  - CPF/CNPJ: ${p.documento}` : null,
          p.estado_civil ? `  - Estado Civil: ${p.estado_civil}` : null,
          p.conjuge ? `  - Cônjuge: ${p.conjuge} ${p.documento_conjuge ? `(Doc: ${p.documento_conjuge})` : ''}` : null,
          p.regime_bens ? `  - Regime de Bens: ${p.regime_bens}` : null,
          p.profissao ? `  - Profissão: ${p.profissao}` : null,
          p.ato_aquisicao ? `  - Registro de Aquisição: ${p.ato_aquisicao}` : null,
          p.ato_alienacao_fiduciaria ? `  - Registro de Alienação Fiduciária: ${p.ato_alienacao_fiduciaria}` : null,
          p.ato_consolidacao ? `  - Averbação de Consolidação: ${p.ato_consolidacao}` : null,
          p.credor_fiduciario ? `  - Credor Fiduciário que Consolidou: ${p.credor_fiduciario}` : null,
          p.data_consolidacao ? `  - Data da Consolidação: ${p.data_consolidacao}` : null,
          p.endereco ? `  - Endereço Declarado: ${p.endereco}` : null,
          p.observacoes ? `  - Observações: ${p.observacoes}` : null,
        ].filter(Boolean).join('\n');
      }).join('\n\n');
    } else {
      consolidacaoText += `Informações sobre consolidação da propriedade disponíveis na cadeia registral.`;
    }

    // 5. Identificação e Cartório
    const idText = [
      `🏛️ DADOS CARTORÁRIOS E REGISTRAIS:`,
      `• Número da Matrícula: ${data.identificacao_matricula?.numero_matricula || 'Não informado'}`,
      `• Cartório de Registro de Imóveis (CRI/RGI): ${data.identificacao_matricula?.cartorio || 'Não informado'}`,
      `• Comarca / UF: ${data.identificacao_matricula?.comarca || ''} / ${data.identificacao_matricula?.uf || ''}`,
      `• Livro / Ficha: ${data.identificacao_matricula?.livro || 'Não informado'}`,
      `• Cadastro Imobiliário / Inscrição Municipal / IPTU: ${data.identificacao_matricula?.cadastro_imobiliario || data.caracteristicas_fisicas?.cadastro_imobiliario || data.identificacao_matricula?.inscricao_municipal || 'Não informado'}`,
    ].join('\n');

    // 6. Características Físicas
    const caracText = [
      `📐 CARACTERÍSTICAS FÍSICAS E METRAGEM:`,
      `• Tipo / Categoria: ${data.caracteristicas_fisicas?.tipo_imovel || data.imovel_tipo || 'Não informado'} (${data.caracteristicas_fisicas?.categoria || 'Não informado'})`,
      `• Endereço Registral: ${data.caracteristicas_fisicas?.endereco || data.localizacao_resumo || 'Não informado'}`,
      `• Área Total / Construída: ${data.caracteristicas_fisicas?.area_total || 'Não informada'}`,
      `• Fração Ideal: ${data.caracteristicas_fisicas?.fracao_ideal || 'Não informada'}`,
      `• Condomínio: ${data.condominio?.nome || 'Não informado'}`,
      `• Descrição Registral Completa: ${data.caracteristicas_fisicas?.descricao_completa || 'Não detalhada'}`,
    ].join('\n');

    // 7. Painel do Assessor & Dicas
    const painelText = [
      `🎯 PAINEL DO ASSESSOR - RESUMO & DICAS DA MATRÍCULA:`,
      `• Síntese Registral: A cadeia de domínio foi conferida. Todos os gravames e penhoras anteriores são baixados com a Carta de Arrematação.`,
      `• Dica de Captação (Investidor): Destaque a segurança jurídica da aquisição originária para atrair investidores que buscam patrimônio livre de riscos.`,
      `• Dica de Captação (Moradia): Enfatize para o comprador final a economia de comprar um imóvel regularizado por uma fração do valor de mercado.`,
    ].join('\n');

    return [
      { id: 'resumo', title: 'Resumo Geral & Indicadores', text: resumoText },
      { id: 'proprietarios_consolidacao', title: '⭐ Últimos Proprietários Antes da Consolidação (Devedores Fiduciantes)', text: consolidacaoText },
      { id: 'painel_assessor', title: 'Painel do Assessor (Resumo & Pitch Comercial)', text: painelText },
      { id: 'cadeia_registral', title: 'Cadeia Registral Completa (R- e AV-)', text: cadeiaText },
      { id: 'onus_gravames', title: 'Ônus, Penhoras e Gravames Ativos', text: onusText },
      { id: 'proprietarios', title: 'Proprietários e Partes Envolvidas', text: partesText },
      { id: 'identificacao', title: 'Identificação Registral & Cartório', text: idText },
      { id: 'caracteristicas', title: 'Características Físicas e Cadastro IPTU', text: caracText },
    ];
  }, [data, propertyAddress, propertyCity, propertyState]);

  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([
    'resumo', 'proprietarios_consolidacao', 'painel_assessor', 'cadeia_registral', 'onus_gravames', 'proprietarios', 'identificacao', 'caracteristicas'
  ]);

  const handleToggleSection = (id: string) => {
    setSelectedSectionIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedSectionIds(modularSections.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSectionIds([]);
  };

  const handleSelectOnly = (id: string) => {
    setSelectedSectionIds([id]);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedData(id);
    setTimeout(() => setCopiedData(null), 2000);
  };

  return (
    <div className="space-y-6 antialiased">
      {/* Universal Modular Export & Customization Bar */}
      <ReportCustomExporterBar
        reportTitle="Análise Detalhada de Matrícula Imobiliária"
        propertyTitle={propertyAddress || "Imóvel em Leilão"}
        propertyAddress={propertyAddress}
        propertyCity={`${propertyCity || ''}${propertyState ? ` - ${propertyState}` : ''}`}
        sections={modularSections}
        selectedSectionIds={selectedSectionIds}
        onToggleSection={handleToggleSection}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onSelectOnly={handleSelectOnly}
        customDomain={customDomain}
        analysisId={analysisId}
        propertyId={propertyId}
        reportType="matricula"
      />

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
              {/* Highlight: Últimos Proprietários Antes da Consolidação (Devedores Fiduciantes) */}
              {data.proprietarios_antes_consolidacao && data.proprietarios_antes_consolidacao.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border-2 border-amber-500/35">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-widest flex items-center gap-1">
                      <Award size={13} className="text-amber-600 dark:text-amber-400" />
                      Últimos Proprietários Antes da Consolidação (Devedores Fiduciantes)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200">
                      Lei 9.514/97
                    </span>
                  </div>
                  <div className="space-y-1">
                    {data.proprietarios_antes_consolidacao.map((p, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-x-2 text-xs font-bold text-brand-ink">
                        <span className="text-sm font-extrabold text-amber-900 dark:text-amber-200">{p.nome}</span>
                        {p.documento && (
                          <span className="font-mono text-[11px] px-1.5 py-0.5 bg-amber-200/50 dark:bg-amber-900/40 rounded border border-amber-500/20 text-brand-ink">
                            Doc: {p.documento}
                          </span>
                        )}
                        {p.conjuge && (
                          <span className="text-[11px] text-brand-ink/70 font-normal">
                            (Cônjuge: {p.conjuge})
                          </span>
                        )}
                        {p.ato_alienacao_fiduciaria && (
                          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-mono">
                            [{p.ato_alienacao_fiduciaria}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

          {/* 1.1. DESTAQUE ESPECIAL: ÚLTIMOS PROPRIETÁRIOS ANTES DA CONSOLIDAÇÃO (CARD DEDICADO) */}
          <MatriculaConsolidacaoCard
            proprietariosAntesConsolidacao={data.proprietarios_antes_consolidacao}
            consolidacao={data.consolidacao_propriedade}
            cadeiaRegistral={data.cadeia_registral}
            onCopy={handleCopyText}
            copiedId={copiedData}
          />

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
              title="Cadeia registral (sequência exaustiva de atos R- e AV-)" 
              icon={<Layers size={18} className="text-orange-500" />} 
              isOpen={accordionState.cadeia} 
              onToggle={() => toggleAccordion('cadeia')}
            >
              {data.cadeia_registral && data.cadeia_registral.length > 0 ? (
                (() => {
                  const atos = data.cadeia_registral;
                  const totalR = atos.filter(a => (a.tipo || '').toUpperCase().startsWith('R') || (a.natureza || '').toLowerCase().includes('registro') || (a.natureza || '').toLowerCase().includes('venda')).length;
                  const totalAV = atos.filter(a => (a.tipo || '').toUpperCase().startsWith('AV') || (a.natureza || '').toLowerCase().includes('averba')).length;
                  const totalGravames = atos.filter(a => {
                    const nat = (a.natureza || a.descricao || '').toLowerCase();
                    return nat.includes('penhora') || nat.includes('hipoteca') || nat.includes('indisponib') || nat.includes('aliena') || nat.includes('bloqueio') || nat.includes('gravame');
                  }).length;
                  const totalVendas = atos.filter(a => {
                    const nat = (a.natureza || a.descricao || '').toLowerCase();
                    return nat.includes('compra e venda') || nat.includes('venda') || nat.includes('arremata') || nat.includes('adjudica');
                  }).length;

                  // Filtered list based on search and selected filter tab
                  const filteredAtos = atos.filter((ato, idx) => {
                    const typeUpper = (ato.tipo || '').toUpperCase();
                    const natLower = (ato.natureza || '').toLowerCase();
                    const descLower = (ato.descricao || '').toLowerCase();
                    const partesLower = (ato.partes || '').toLowerCase();
                    const q = cadeiaSearchQuery.toLowerCase().trim();

                    // Tab filter
                    if (cadeiaFilter === 'R' && !typeUpper.startsWith('R')) return false;
                    if (cadeiaFilter === 'AV' && !typeUpper.startsWith('AV')) return false;
                    if (cadeiaFilter === 'gravames') {
                      const isGrav = natLower.includes('penhora') || natLower.includes('hipoteca') || natLower.includes('indisponib') || natLower.includes('aliena') || natLower.includes('gravame') || descLower.includes('penhora') || descLower.includes('aliena');
                      if (!isGrav) return false;
                    }
                    if (cadeiaFilter === 'vendas') {
                      const isVenda = natLower.includes('venda') || descLower.includes('venda') || natLower.includes('arremata') || descLower.includes('arremata');
                      if (!isVenda) return false;
                    }

                    // Query filter
                    if (q) {
                      const matchType = typeUpper.includes(q);
                      const matchDesc = descLower.includes(q);
                      const matchPartes = partesLower.includes(q);
                      const matchNat = natLower.includes(q);
                      const matchData = (ato.data || '').toLowerCase().includes(q);
                      const matchVal = (ato.valor || '').toLowerCase().includes(q);
                      if (!matchType && !matchDesc && !matchPartes && !matchNat && !matchData && !matchVal) {
                        return false;
                      }
                    }

                    return true;
                  });

                  const copyAtoText = (ato: MatriculaAto, idx: number) => {
                    const txt = `[${ato.tipo || 'Ato'}] Data: ${ato.data || 'N/I'} | Natureza: ${ato.natureza || 'Ato'} | Valor: ${ato.valor || 'N/C'}\nDescrição: ${ato.descricao || ''}\nPartes: ${ato.partes || 'Não qualificadas'}\nImpacto: ${ato.impacto || ''}`;
                    navigator.clipboard.writeText(txt);
                    setCopiedAtoIdx(idx);
                    setTimeout(() => setCopiedAtoIdx(null), 2000);
                  };

                  return (
                    <div className="space-y-4 font-sans">
                      {/* Cadeia Header Bar: Metrics & Controls */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-brand-bg/40 p-3.5 rounded-2xl border border-brand-border/40">
                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setCadeiaFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              cadeiaFilter === 'all'
                                ? 'bg-brand-primary text-black shadow-xs'
                                : 'bg-brand-bg/60 text-brand-ink/70 hover:text-brand-ink'
                            }`}
                          >
                            Todos ({atos.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCadeiaFilter('R')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              cadeiaFilter === 'R'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-brand-bg/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            Registros R- ({totalR})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCadeiaFilter('AV')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              cadeiaFilter === 'AV'
                                ? 'bg-amber-500 text-black shadow-xs'
                                : 'bg-brand-bg/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                            }`}
                          >
                            Averbações AV- ({totalAV})
                          </button>
                          {totalGravames > 0 && (
                            <button
                              type="button"
                              onClick={() => setCadeiaFilter('gravames')}
                              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                cadeiaFilter === 'gravames'
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'bg-brand-bg/60 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                              }`}
                            >
                              Gravames & Ônus ({totalGravames})
                            </button>
                          )}
                          {totalVendas > 0 && (
                            <button
                              type="button"
                              onClick={() => setCadeiaFilter('vendas')}
                              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                cadeiaFilter === 'vendas'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-brand-bg/60 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
                              }`}
                            >
                              Vendas ({totalVendas})
                            </button>
                          )}
                        </div>

                        {/* Search & View Mode Switcher */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cadeiaSearchQuery}
                            onChange={(e) => setCadeiaSearchQuery(e.target.value)}
                            placeholder="Buscar ato, parte, data ou CPF..."
                            className="bg-brand-bg border border-brand-border rounded-xl px-3 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-primary w-full md:w-56"
                          />

                          <div className="flex items-center bg-brand-bg border border-brand-border rounded-xl p-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setCadeiaViewMode('timeline')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                cadeiaViewMode === 'timeline' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-ink/50 hover:text-brand-ink'
                              }`}
                              title="Visualizar em Linha do Tempo"
                            >
                              Timeline
                            </button>
                            <button
                              type="button"
                              onClick={() => setCadeiaViewMode('cards')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                cadeiaViewMode === 'cards' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-ink/50 hover:text-brand-ink'
                              }`}
                              title="Visualizar em Cards"
                            >
                              Cards
                            </button>
                            <button
                              type="button"
                              onClick={() => setCadeiaViewMode('table')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                cadeiaViewMode === 'table' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-ink/50 hover:text-brand-ink'
                              }`}
                              title="Visualizar em Tabela Cronológica"
                            >
                              Tabela
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Display message if search yields no results */}
                      {filteredAtos.length === 0 && (
                        <div className="text-center py-6 text-xs text-brand-ink/50 bg-brand-bg/10 rounded-2xl border border-brand-border/30">
                          Nenhum ato registral corresponde ao filtro ou busca selecionada.
                        </div>
                      )}

                      {/* VIEW 1: TABLE MODE */}
                      {cadeiaViewMode === 'table' && filteredAtos.length > 0 && (
                        <div className="overflow-x-auto rounded-2xl border border-brand-border/50">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-brand-bg/60 border-b border-brand-border/50 text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">
                              <tr>
                                <th className="p-3">Ato / Código</th>
                                <th className="p-3">Data</th>
                                <th className="p-3">Natureza Jurídica</th>
                                <th className="p-3">Partes Envolvidas</th>
                                <th className="p-3">Valor</th>
                                <th className="p-3">Descrição Resumida</th>
                                <th className="p-3 text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/30">
                              {filteredAtos.map((ato, idx) => {
                                const isR = (ato.tipo || '').toUpperCase().startsWith('R');
                                const isGrav = (ato.natureza || '').toLowerCase().includes('penhora') || (ato.natureza || '').toLowerCase().includes('indisponib') || (ato.natureza || '').toLowerCase().includes('aliena');
                                return (
                                  <tr key={idx} className="hover:bg-brand-bg/30 transition-colors">
                                    <td className="p-3 whitespace-nowrap">
                                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                        isR ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                        isGrav ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      }`}>
                                        {ato.tipo}
                                      </span>
                                    </td>
                                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-brand-ink/70">
                                      {ato.data || 'Registrado'}
                                    </td>
                                    <td className="p-3 font-semibold text-brand-ink">
                                      {ato.natureza || (isR ? 'Registro' : 'Averbação')}
                                    </td>
                                    <td className="p-3 text-brand-ink/80 max-w-xs truncate" title={ato.partes}>
                                      {ato.partes || 'Não especificado'}
                                    </td>
                                    <td className="p-3 whitespace-nowrap font-mono font-bold text-emerald-500">
                                      {ato.valor || '—'}
                                    </td>
                                    <td className="p-3 text-brand-ink/75 max-w-sm truncate" title={ato.descricao}>
                                      {ato.descricao || '—'}
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => copyAtoText(ato, idx)}
                                        className="p-1.5 hover:bg-brand-primary/10 rounded-lg text-brand-ink/50 hover:text-brand-primary transition-all inline-flex items-center gap-1 text-[10px]"
                                        title="Copiar dados do ato"
                                      >
                                        {copiedAtoIdx === idx ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* VIEW 2: TIMELINE MODE */}
                      {cadeiaViewMode === 'timeline' && filteredAtos.length > 0 && (
                        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border/60">
                          {filteredAtos.map((ato, idx) => {
                            const isR = (ato.tipo || '').toUpperCase().startsWith('R');
                            const isGrav = (ato.natureza || '').toLowerCase().includes('penhora') || (ato.natureza || '').toLowerCase().includes('indisponib') || (ato.natureza || '').toLowerCase().includes('aliena');
                            
                            return (
                              <div key={idx} className="relative group">
                                {/* Bullet indicator on the timeline line */}
                                <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold shadow-xs ${
                                  isR ? 'bg-emerald-500 border-emerald-200 text-white' :
                                  isGrav ? 'bg-rose-500 border-rose-200 text-white' :
                                  'bg-amber-500 border-amber-200 text-black'
                                }`}>
                                  {isR ? 'R' : 'AV'}
                                </div>

                                <div className={`bg-brand-bg/20 hover:bg-brand-bg/35 transition-all rounded-2xl border p-4 space-y-2.5 ${
                                  isGrav ? 'border-rose-500/30 bg-rose-500/[0.02]' :
                                  isR ? 'border-emerald-500/30 bg-emerald-500/[0.02]' :
                                  'border-brand-border/50'
                                }`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-brand-border/30 pb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md tracking-wider border ${
                                        isR ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                        isGrav ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                      }`}>
                                        {ato.tipo}
                                      </span>
                                      <span className="text-xs font-bold text-brand-ink">{ato.natureza || (isR ? 'Registro Imobiliário' : 'Averbação')}</span>
                                      {ato.data && (
                                        <span className="text-[11px] text-brand-ink/50 font-mono bg-brand-bg/60 px-2 py-0.5 rounded-md border border-brand-border/40">
                                          📅 {ato.data}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {ato.valor && (
                                        <span className="text-sm font-bold text-emerald-500 font-mono tracking-tight bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                                          {ato.valor}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => copyAtoText(ato, idx)}
                                        className="p-1 text-brand-ink/40 hover:text-brand-primary transition-all"
                                        title="Copiar ato"
                                      >
                                        {copiedAtoIdx === idx ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="text-xs space-y-1.5">
                                    {ato.descricao && <p className="text-brand-ink leading-relaxed font-medium">{ato.descricao}</p>}
                                    {ato.partes && (
                                      <div className="p-2 bg-brand-bg/40 rounded-xl border border-brand-border/30 text-brand-ink/80 text-[11.5px]">
                                        <span className="font-bold text-brand-ink/60 uppercase text-[10px] tracking-wider block mb-0.5">Partes Envolvidas / Qualificação:</span>
                                        {ato.partes}
                                      </div>
                                    )}
                                    {ato.impacto && (
                                      <p className="text-[11px] text-brand-ink/60 flex items-center gap-1 pt-1">
                                        <span className="font-bold text-brand-primary">Impacto no Leilão:</span> {ato.impacto}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* VIEW 3: CARDS MODE */}
                      {cadeiaViewMode === 'cards' && filteredAtos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredAtos.map((ato, idx) => {
                            const isR = (ato.tipo || '').toUpperCase().startsWith('R');
                            const isGrav = (ato.natureza || '').toLowerCase().includes('penhora') || (ato.natureza || '').toLowerCase().includes('indisponib') || (ato.natureza || '').toLowerCase().includes('aliena');
                            
                            return (
                              <div key={idx} className={`bg-brand-bg/20 rounded-2xl border p-4 space-y-2.5 flex flex-col justify-between ${
                                isGrav ? 'border-rose-500/30' : isR ? 'border-emerald-500/30' : 'border-brand-border/50'
                              }`}>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                                        isR ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                      }`}>
                                        {ato.tipo}
                                      </span>
                                      {ato.data && <span className="text-[11px] text-brand-ink/50 font-mono">{ato.data}</span>}
                                    </div>
                                    {ato.valor && (
                                      <span className="text-xs font-bold text-emerald-500 font-mono">{ato.valor}</span>
                                    )}
                                  </div>
                                  <h5 className="font-bold text-brand-ink text-xs">{ato.natureza || ato.descricao}</h5>
                                  {ato.descricao && <p className="text-xs text-brand-ink/75 line-clamp-3">{ato.descricao}</p>}
                                </div>
                                {ato.partes && (
                                  <div className="pt-2 border-t border-brand-border/30 text-[11px] text-brand-ink/65 truncate" title={ato.partes}>
                                    <span className="font-semibold">Partes:</span> {ato.partes}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : <NoData />}
            </AccordionSection>

            {/* Sec: Proprietários e partes */}
            <AccordionSection 
              id="partes" 
              title="Proprietários, Partes e Devedores Fiduciantes" 
              icon={<Users size={18} className="text-orange-500" />} 
              isOpen={accordionState.partes} 
              onToggle={() => toggleAccordion('partes')}
            >
              {(data.proprietarios_e_partes || (data.proprietarios_antes_consolidacao && data.proprietarios_antes_consolidacao.length > 0)) ? (
                <div className="space-y-6 font-sans">
                  {/* ⭐ DESTAQUE: Últimos Proprietários Antes da Consolidação (Devedores Fiduciantes) */}
                  {data.proprietarios_antes_consolidacao && data.proprietarios_antes_consolidacao.length > 0 && (
                    <div className="space-y-2 bg-amber-500/[0.07] dark:bg-amber-950/20 border-2 border-amber-500/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-amber-600 dark:text-amber-400" />
                          <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                            Últimos Proprietários Antes da Consolidação (Devedores Fiduciantes)
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200">
                          Lei 9.514/97
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-ink/70">
                        Mutuários originários executados antes da consolidação do imóvel em favor do credor fiduciário.
                      </p>
                      <div className="space-y-2.5 pt-2">
                        {data.proprietarios_antes_consolidacao.map((p, i) => (
                          <div key={i} className="bg-brand-paper dark:bg-neutral-900/70 rounded-xl border border-amber-500/20 p-3.5 space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <p className="font-extrabold text-sm text-brand-ink">{p.nome}</p>
                              {p.documento && (
                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-200/50 dark:bg-amber-900/40 text-brand-ink rounded border border-amber-500/20 self-start sm:self-auto">
                                  {p.documento.length > 14 ? 'CNPJ' : 'CPF'}: {p.documento}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-ink/70">
                              {p.estado_civil && <span>Estado Civil: <strong>{p.estado_civil}</strong></span>}
                              {p.conjuge && <span>Cônjuge: <strong>{p.conjuge}</strong> {p.documento_conjuge ? `(${p.documento_conjuge})` : ''}</span>}
                              {p.regime_bens && <span>Regime: <strong>{p.regime_bens}</strong></span>}
                              {p.profissao && <span>Profissão: <strong>{p.profissao}</strong></span>}
                              {p.ato_alienacao_fiduciaria && <span className="text-amber-800 dark:text-amber-300 font-mono">Alienação: <strong>{p.ato_alienacao_fiduciaria}</strong></span>}
                              {p.ato_consolidacao && <span className="text-rose-600 dark:text-rose-400 font-mono">Consolidação: <strong>{p.ato_consolidacao}</strong></span>}
                            </div>
                            {p.credor_fiduciario && (
                              <p className="text-xs text-brand-ink/80 pt-1 border-t border-brand-border/30">
                                Credor Fiduciário: <strong>{p.credor_fiduciario}</strong>
                              </p>
                            )}
                            {p.observacoes && (
                              <p className="text-[11px] text-brand-ink/60 italic pt-1 border-t border-brand-border/20">
                                {p.observacoes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Atuais */}
                  {data.proprietarios_e_partes?.atuais && data.proprietarios_e_partes.atuais.length > 0 && (
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
              {/* Painel do Assessor - Resumo e Dicas de Captação */}
              <AssessorPitchAndTipsCard 
                contextType="matricula"
                propertyTitle={propertyTitle}
                propertyAddress={data.caracteristicas_fisicas?.endereco || propertyAddress}
                propertyCity={data.identificacao_matricula?.comarca || propertyCity}
                propertyState={data.identificacao_matricula?.uf || propertyState}
                valuation={valuation}
                minBid={bidValue}
                expectedSaleValue={expectedSaleValue}
                estimatedProfit={estimatedProfit}
                roi={roi}
                tir={tir}
                rawAnalysisData={data}
              />
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

    // 8. DEEP CADEIA REGISTRAL EXTRACTION (Tables + Lists + Headings + Paragraphs)
    const extractedAtos: MatriculaAto[] = [];

    // 8.1 Extract from Markdown Tables
    const tableRowRegex = /\|\s*(R[\.\-\s]?\d+(?:\/[\w\.\-]+)?|AV[\.\-\s]?\d+(?:\/[\w\.\-]+)?|Registro\s*\d+|Averbação\s*\d+|Ato\s*\d+)\s*\|([^|\n]+)\|([^|\n]+)\|?([^|\n]*)?\|?([^|\n]*)?\|?([^|\n]*)?/gi;
    let tMatch;
    while ((tMatch = tableRowRegex.exec(text)) !== null) {
      const col1 = tMatch[1]?.trim() || '';
      const col2 = tMatch[2]?.trim() || '';
      const col3 = tMatch[3]?.trim() || '';
      const col4 = tMatch[4]?.trim() || '';
      const col5 = tMatch[5]?.trim() || '';
      const col6 = tMatch[6]?.trim() || '';

      // Skip header divider rows
      if (col1.includes('---') || col2.includes('---') || col1.toLowerCase().includes('código') || col1.toLowerCase().includes('ato')) continue;

      // Extract date, value, parties, nature
      const allCols = [col2, col3, col4, col5, col6].filter(Boolean);
      const dateVal = allCols.find(c => /\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/.test(c)) || '';
      const curVal = allCols.find(c => /R\$\s*[\d\.\,]+/.test(c)) || '';
      const descCol = allCols.find(c => c !== dateVal && c !== curVal && c.length > 10) || col2;
      const partCol = allCols.find(c => c !== dateVal && c !== curVal && c !== descCol) || '';

      extractedAtos.push({
        tipo: col1.toUpperCase(),
        data: dateVal || 'Registrado',
        valor: curVal || undefined,
        descricao: descCol || col2 || 'Ato Registral',
        partes: partCol || undefined,
        natureza: col1.toUpperCase().startsWith('R') ? 'Registro Imobiliário' : 'Averbação',
        impacto: 'Histórico da Matrícula'
      });
    }

    // 8.2 Extract from Headings like "### R-1 / Compra e Venda" or "### AV-2: Penhora"
    const headingAtoRegex = /(?:^|\n)#{2,4}\s*(?:Ato\s*)?(R[\.\-\s]?\d+(?:\/[\w\.\-]+)?|AV[\.\-\s]?\d+(?:\/[\w\.\-]+)?|Registro\s*\d+|Averbação\s*\d+)\s*[:\-\—\–]?\s*([^\n\r]+)([\s\S]*?)(?=(?:^|\n)#{2,4}\s|\Z)/gi;
    let hMatch;
    while ((hMatch = headingAtoRegex.exec(text)) !== null) {
      const atoCode = hMatch[1].trim().toUpperCase();
      const atoTitle = hMatch[2].trim();
      const atoSectionBody = hMatch[3] ? hMatch[3].trim() : '';
      const fullText = `${atoTitle} ${atoSectionBody}`;

      if (extractedAtos.some(a => a.tipo === atoCode)) continue;

      const dateMatch = fullText.match(/\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/);
      const valMatch = fullText.match(/R\$\s*[\d\.\,]+/);
      const partyMatch = fullText.match(/(?:Partes|Transmitente|Adquirente|Comprador|Vendedor|Credor|Devedor)[\s:]+([^;\.\n]+)/i);

      let natureza = atoCode.startsWith('R') ? 'Registro Imobiliário' : 'Averbação';
      const bodyLower = fullText.toLowerCase();
      if (bodyLower.includes('compra e venda')) natureza = 'Compra e Venda';
      else if (bodyLower.includes('alienação fiduciária') || bodyLower.includes('alienacao fiduciaria')) natureza = 'Alienação Fiduciária';
      else if (bodyLower.includes('penhora')) natureza = 'Penhora Judicial';
      else if (bodyLower.includes('hipoteca')) natureza = 'Hipoteca';
      else if (bodyLower.includes('indisponibilidade')) natureza = 'Indisponibilidade de Bens';
      else if (bodyLower.includes('consolidação') || bodyLower.includes('consolidacao')) natureza = 'Consolidação de Propriedade';
      else if (bodyLower.includes('cancelamento')) natureza = 'Cancelamento de Gravame';

      extractedAtos.push({
        tipo: atoCode,
        data: dateMatch ? dateMatch[0] : 'Averbado',
        valor: valMatch ? valMatch[0] : undefined,
        descricao: atoTitle.replace(/\*\*/g, '') || atoSectionBody.slice(0, 150).replace(/\*\*/g, ''),
        partes: partyMatch ? partyMatch[1].trim() : undefined,
        natureza,
        impacto: 'Constante da Certidão'
      });
    }

    // 8.3 Extract from Bullet points or lines like "**R-1 (10/05/2010)**: Compra e Venda..."
    const lineAtoRegex = /(?:^|\n)\s*(?:[\*\-\•]\s*)?(?:\*\*)?(R[\.\-\s]?\d+(?:\/[\w\.\-]+)?|AV[\.\-\s]?\d+(?:\/[\w\.\-]+)?|Registro\s*\d+|Averbação\s*\d+)(?:\*\*)?\s*[:\-\(\—\–]\s*([^\n\r]+)/gi;
    let lMatch;
    while ((lMatch = lineAtoRegex.exec(text)) !== null) {
      const atoCode = lMatch[1].trim().toUpperCase();
      const atoBody = lMatch[2].trim();

      // Avoid duplicates
      if (extractedAtos.some(a => a.tipo === atoCode || a.descricao === atoBody)) continue;

      const dateMatch = atoBody.match(/\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/);
      const valMatch = atoBody.match(/R\$\s*[\d\.\,]+/);
      const partyMatch = atoBody.match(/(?:Partes|Transmitente|Adquirente|Comprador|Vendedor|Credor|Devedor)[\s:]+([^;\.\n]+)/i);

      let natureza = atoCode.startsWith('R') ? 'Registro Imobiliário' : 'Averbação';
      const bodyLower = atoBody.toLowerCase();
      if (bodyLower.includes('compra e venda')) natureza = 'Compra e Venda';
      else if (bodyLower.includes('alienação fiduciária') || bodyLower.includes('alienacao fiduciaria')) natureza = 'Alienação Fiduciária';
      else if (bodyLower.includes('penhora')) natureza = 'Penhora Judicial';
      else if (bodyLower.includes('hipoteca')) natureza = 'Hipoteca';
      else if (bodyLower.includes('indisponibilidade')) natureza = 'Indisponibilidade de Bens';
      else if (bodyLower.includes('consolidação') || bodyLower.includes('consolidacao')) natureza = 'Consolidação de Propriedade';
      else if (bodyLower.includes('cancelamento')) natureza = 'Cancelamento de Gravame';

      extractedAtos.push({
        tipo: atoCode,
        data: dateMatch ? dateMatch[0] : 'Averbado',
        valor: valMatch ? valMatch[0] : undefined,
        descricao: atoBody.replace(/\*\*/g, ''),
        partes: partyMatch ? partyMatch[1].trim() : undefined,
        natureza,
        impacto: 'Constante da Certidão'
      });
    }

    // 8.4 Deep paragraph scan for R.X/AV.X pattern in free-flowing text
    const paragraphAtoRegex = /(?:^|\n\n|\.\s+)(R\.?\s*\d+(?:\/[\d\.\-]+)?|AV\.?\s*\d+(?:\/[\d\.\-]+)?)\s*[:\-\–\—\.]?\s*([^\n\r]{20,400})/gi;
    let pMatch;
    while ((pMatch = paragraphAtoRegex.exec(text)) !== null) {
      const rawCode = pMatch[1].trim().toUpperCase().replace(/\s+/g, '');
      const atoCode = rawCode.startsWith('R') && !rawCode.startsWith('R-') && !rawCode.startsWith('R.') ? `R-${rawCode.slice(1)}` : rawCode;
      const atoBody = pMatch[2].trim();

      if (extractedAtos.some(a => a.tipo === atoCode || a.tipo === rawCode)) continue;

      const dateMatch = atoBody.match(/\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/) || atoBody.match(/(?:em|data|de)\s+(\d{1,2}\s+de\s+[a-zçãõ]+\s+de\s+\d{4})/i);
      const valMatch = atoBody.match(/R\$\s*[\d\.\,]+/);
      const partyMatch = atoBody.match(/(?:adquirente|comprador|vendedor|transmitente|credor|devedor|fiduciante|fiduciário)[\s:]+([^;\.\n]+)/i);

      let natureza = atoCode.startsWith('R') ? 'Registro Imobiliário' : 'Averbação';
      const bodyLower = atoBody.toLowerCase();
      if (bodyLower.includes('compra e venda')) natureza = 'Compra e Venda';
      else if (bodyLower.includes('alienação fiduciária') || bodyLower.includes('alienacao fiduciaria')) natureza = 'Alienação Fiduciária';
      else if (bodyLower.includes('penhora')) natureza = 'Penhora Judicial';
      else if (bodyLower.includes('hipoteca')) natureza = 'Hipoteca';
      else if (bodyLower.includes('indisponibilidade')) natureza = 'Indisponibilidade de Bens';
      else if (bodyLower.includes('consolidação') || bodyLower.includes('consolidacao')) natureza = 'Consolidação de Propriedade';
      else if (bodyLower.includes('cancelamento')) natureza = 'Cancelamento de Gravame';

      extractedAtos.push({
        tipo: atoCode,
        data: dateMatch ? (typeof dateMatch[0] === 'string' ? dateMatch[0] : 'Averbado') : 'Averbado',
        valor: valMatch ? valMatch[0] : undefined,
        descricao: atoBody.replace(/\*\*/g, '').slice(0, 200),
        partes: partyMatch ? partyMatch[1].trim() : undefined,
        natureza,
        impacto: 'Constante da Certidão'
      });
    }

    if (extractedAtos.length > 0) {
      result.cadeia_registral = extractedAtos;
      result.kpis.num_vendas = extractedAtos.filter(a => (a.natureza || '').toLowerCase().includes('venda') || a.tipo.startsWith('R')).length || 1;
    }

    // 9. DEEP ONUS E GRAVAMES EXTRACTION
    const extractedOnus: MatriculaOnus[] = [];
    const onusPatterns = [
      { name: 'Penhora', kw: /penhora[^\n\.\;]*/gi, tipo: 'PENHORA', subtipo: 'Judicial' },
      { name: 'Alienação Fiduciária', kw: /aliena[çc][ãa]o\s+fiduci[áa]ria[^\n\.\;]*/gi, tipo: 'ALIENACAO_FIDUCIARIA', subtipo: 'Garantia Bancária' },
      { name: 'Hipoteca', kw: /hipoteca[^\n\.\;]*/gi, tipo: 'HIPOTECA', subtipo: 'Direito Real' },
      { name: 'Indisponibilidade', kw: /indisponibilidade[^\n\.\;]*/gi, tipo: 'INDISPONIBILIDADE', subtipo: 'Bloqueio Judicial' },
      { name: 'Usufruto', kw: /usufruto[^\n\.\;]*/gi, tipo: 'USUFRUTO', subtipo: 'Direito Real de Habitação' }
    ];

    for (const op of onusPatterns) {
      let oMatch;
      while ((oMatch = op.kw.exec(text)) !== null) {
        const snippet = oMatch[0];
        if (extractedOnus.some(o => o.tipo === op.tipo && o.devedor === snippet)) continue;

        const valMatch = snippet.match(/R\$\s*[\d\.\,]+/);
        const credorMatch = snippet.match(/(?:a favor d[eoa]|em favor d[eoa]|credor[a]?:?|banco)\s*([A-Za-z0-9\s\.\,\/]{4,40})/i);
        const dataMatch = snippet.match(/\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/);

        extractedOnus.push({
          tipo: op.name,
          status: snippet.toLowerCase().includes('cancelad') || snippet.toLowerCase().includes('baixad') ? 'BAIXADO' : 'ATIVO',
          subtipo: op.subtipo,
          prioridade: op.tipo === 'INDISPONIBILIDADE' || op.tipo === 'USUFRUTO' ? 'ALTO' : 'MEDIO',
          valor: valMatch ? valMatch[0] : undefined,
          credor: credorMatch ? credorMatch[1].trim() : undefined,
          data_constituicao: dataMatch ? dataMatch[0] : undefined
        });
      }
    }

    if (extractedOnus.length > 0) {
      result.onus_gravames = extractedOnus;
      result.kpis.num_onus_ativos = extractedOnus.filter(o => o.status === 'ATIVO').length;
    }

    // 10. DEEP PROPRIETÁRIOS E PARTES EXTRACTION
    const proprietariosAtuais: MatriculaParte[] = [];
    const proprietariosAnteriores: MatriculaParte[] = [];
    const credoresList: MatriculaParte[] = [];

    // Current owners
    const currentOwnerRegex = /(?:Proprietário Atual|Proprietária Atual|Adquirente Atual|Proprietários Atuais|Atual Titular)[\s:]+([^\n\r]+)/gi;
    let coMatch;
    while ((coMatch = currentOwnerRegex.exec(text)) !== null) {
      const line = coMatch[1].trim();
      const docMatch = line.match(/(?:CPF|CNPJ)[\s:\.]*([0-9\.\-\/]+)/i);
      const nameOnly = line.split(/[,;\(]|\bCPF\b|\bCNPJ\b/)[0].trim();
      if (nameOnly.length > 3) {
        proprietariosAtuais.push({
          nome: nameOnly,
          documento: docMatch ? docMatch[1].trim() : undefined,
          tipo: line.toLowerCase().includes('cnpj') || line.toLowerCase().includes('s/a') || line.toLowerCase().includes('ltda') ? 'PJ' : 'PF',
          detalhes: line
        });
      }
    }

    // Creditors
    const creditorRegex = /(?:Credor Fiduciário|Credor Hipotecário|Credor Exequente|Exequente|Instituição Credora)[\s:]+([^\n\r]+)/gi;
    let crMatch;
    while ((crMatch = creditorRegex.exec(text)) !== null) {
      const line = crMatch[1].trim();
      const docMatch = line.match(/(?:CPF|CNPJ)[\s:\.]*([0-9\.\-\/]+)/i);
      const nameOnly = line.split(/[,;\(]|\bCPF\b|\bCNPJ\b/)[0].trim();
      if (nameOnly.length > 3) {
        credoresList.push({
          nome: nameOnly,
          documento: docMatch ? docMatch[1].trim() : undefined,
          tipo: 'PJ',
          detalhes: line
        });
      }
    }

    // 11. DEEP EXTRACTION: PROPRIETÁRIOS ANTES DA CONSOLIDAÇÃO DA PROPRIEDADE (DEVEDORES FIDUCIANTES)
    const proprietariosAntesConsolidacao: ProprietarioAntesConsolidacao[] = [];
    let houveConsolidacao = false;
    let dataConsolidacao: string | undefined;
    let atoConsolidacao: string | undefined;
    let credorFiduciarioConsolidacao: string | undefined;

    // Pattern A: Match explicit labels in markdown or text
    const antesConsolidacaoRegex = /(?:Últimos Proprietários Antes da Consolidação|Proprietário(?:s)? Antes da Consolidação|Devedor(?:es)? Fiduciante(?:s)?|Mutuário(?:s)? Originário(?:s)?|Titular(?:es)? Anterior(?:es)? à Consolidação|Ex-Proprietário(?:s)? Fiduciante(?:s)?)[\s:]+([^\n\r]+)/gi;
    let acMatch;
    while ((acMatch = antesConsolidacaoRegex.exec(text)) !== null) {
      const line = acMatch[1].trim();
      const docMatch = line.match(/(?:CPF|CNPJ)[\s:\.]*([0-9\.\-\/]+)/i);
      const conjugeMatch = line.match(/(?:cônjuge|conjuge|casado com|casada com|esposa|marido)[\s:]+([^,\.\;\(]+)/i);
      const regimeMatch = line.match(/(?:comunhão parcial|comunhão universal|separação total|separação obrigatória|participação final)/i);
      const nameOnly = line.split(/[,;\(]|\bCPF\b|\bCNPJ\b|\bcônjuge\b|\bcasado\b/i)[0].trim();
      if (nameOnly.length > 3 && !proprietariosAntesConsolidacao.some(p => p.nome.toLowerCase() === nameOnly.toLowerCase())) {
        proprietariosAntesConsolidacao.push({
          nome: nameOnly,
          documento: docMatch ? docMatch[1].trim() : undefined,
          conjuge: conjugeMatch ? conjugeMatch[1].trim() : undefined,
          regime_bens: regimeMatch ? regimeMatch[0] : undefined,
          tipo: line.toLowerCase().includes('cnpj') || line.toLowerCase().includes('s/a') || line.toLowerCase().includes('ltda') ? 'PJ' : 'PF',
          observacoes: line
        });
      }
    }

    // Pattern B: Scan cadeia_registral for consolidation acts and preceding Alienação Fiduciária / Compra e Venda
    if (extractedAtos.length > 0) {
      const consolidacaoAto = extractedAtos.find(a => 
        (a.natureza || '').toLowerCase().includes('consolidação') || 
        (a.natureza || '').toLowerCase().includes('consolidacao') ||
        (a.descricao || '').toLowerCase().includes('consolidação da propriedade') ||
        (a.descricao || '').toLowerCase().includes('consolidacao da propriedade')
      );
      if (consolidacaoAto) {
        houveConsolidacao = true;
        atoConsolidacao = consolidacaoAto.tipo;
        dataConsolidacao = consolidacaoAto.data;
        const credorMatch = (consolidacaoAto.descricao + ' ' + (consolidacaoAto.partes || '')).match(/(?:em favor d[eoa]|a favor d[eoa]|consolidada em nome d[eoa]|credor[a]?:?|banco)\s*([A-Za-z0-9\s\.\,\/]{4,50})/i);
        if (credorMatch) {
          credorFiduciarioConsolidacao = credorMatch[1].trim();
        }

        if (proprietariosAntesConsolidacao.length === 0) {
          const alienacaoAto = extractedAtos.find(a => 
            (a.natureza || '').toLowerCase().includes('alienação fiduciária') || 
            (a.natureza || '').toLowerCase().includes('alienacao fiduciaria') ||
            (a.descricao || '').toLowerCase().includes('devedor fiduciante') ||
            (a.descricao || '').toLowerCase().includes('fiduciante')
          );
          if (alienacaoAto) {
            const devMatch = (alienacaoAto.descricao + ' ' + (alienacaoAto.partes || '')).match(/(?:devedor(?:es)?(?:\s+fiduciante(?:s)?)?|fiduciante(?:s)?|adquirente(?:s)?)[\s:]+([^\n\r,\.;\(]{3,60})/i);
            const docMatch = (alienacaoAto.descricao + ' ' + (alienacaoAto.partes || '')).match(/(?:CPF|CNPJ)[\s:\.]*([0-9\.\-\/]+)/i);
            const nameFound = devMatch ? devMatch[1].trim() : (alienacaoAto.partes ? alienacaoAto.partes.split(/[,;\(]/)[0].trim() : '');
            if (nameFound && nameFound.length > 3) {
              proprietariosAntesConsolidacao.push({
                nome: nameFound,
                documento: docMatch ? docMatch[1].trim() : undefined,
                ato_alienacao_fiduciaria: alienacaoAto.tipo,
                ato_consolidacao: consolidacaoAto.tipo,
                credor_fiduciario: credorFiduciarioConsolidacao,
                data_consolidacao: dataConsolidacao,
                tipo: 'PF',
                observacoes: 'Identificado a partir do registro de Alienação Fiduciária anterior à consolidação.'
              });
            }
          }
        }
      }
    }

    if (proprietariosAntesConsolidacao.length > 0) {
      result.proprietarios_antes_consolidacao = proprietariosAntesConsolidacao;
    }
    if (houveConsolidacao || proprietariosAntesConsolidacao.length > 0) {
      result.consolidacao_propriedade = {
        houve_consolidacao: true,
        data_consolidacao: dataConsolidacao,
        ato_consolidacao: atoConsolidacao,
        credor_fiduciario: credorFiduciarioConsolidacao,
        devedores_fiduciantes_originais: proprietariosAntesConsolidacao.map(p => p.nome),
        resumo_consolidacao: `Propriedade consolidada em favor do credor fiduciário nos termos da Lei 9.514/97.`
      };
    }

    if (proprietariosAtuais.length > 0 || proprietariosAnteriores.length > 0 || credoresList.length > 0) {
      result.proprietarios_e_partes = {
        atuais: proprietariosAtuais,
        anteriores: proprietariosAnteriores,
        credores: credoresList
      };
      if (proprietariosAtuais.length > 0) {
        result.proprietario_atual = proprietariosAtuais.map(p => p.nome);
      }
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
