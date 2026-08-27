import React, { useState } from 'react';
import { 
  Shield, Cpu, Loader2, Save, FileText, CheckSquare, 
  HelpCircle, AlertTriangle, AlertCircle, RefreshCw, Sparkles,
  TrendingUp, Scale, Gavel, User, Home, DollarSign, Calendar,
  Download, Edit3, Info, ChevronDown, ChevronUp, ChevronsUpDown,
  Maximize2, Minimize2, CheckCircle2, Copy, Plus, Trash2,
  GitCompare, FileCheck2, MessageSquare, Check, Sparkle
} from 'lucide-react';
import { DocumentManager } from './DocumentManager';
import { exportElementToPDF } from '../utils/pdfExporter';

export interface SmartAnalysisData {
  risco_geral: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  recomendacao: 'Selecione' | 'Prosseguir' | 'Prosseguir com ressalvas' | 'Não prosseguir' | 'Recomendo arrematar' | 'Recomendo com ressalvas' | 'Não recomendo arrematar';
  justificativa: string;
  justificativa_pessoal?: string;
  
  tipo_leilao: 'Selecione' | 'Judicial' | 'Extrajudicial';
  responsabilidade_iptu: 'Selecione' | 'Vendedor (Banco)' | 'Comprador' | 'Sub-rogado no preço';
  responsabilidade_condominio: 'Selecione' | 'Vendedor (Banco)' | 'Comprador' | 'Sub-rogado no preço';
  observacoes_edital: string;
  folhas_edital?: string;
  folhas_avaliacao?: string;
  
  iptu_atraso: number;
  condominio_atraso: number;
  outros_debitos: number;
  observacoes_debitos: string;
  folhas_debitos?: string;
  
  nivel_risco_desocupacao: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  risco_desocupacao?: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  liminar_bloqueando: boolean;
  acao_anulatoria: boolean;
  embargos_pendentes: boolean;
  recurso_pendente: boolean;
  prazo_estimado_desocupacao: string;
  estimativa_prazo_desocupacao?: string;
  custo_estimado_desocupacao?: number;
  observacoes_desocupacao: string;
  folhas_ocupacao?: string;
  
  risco_geral_nulidade: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  risco_nulidade?: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  citacao_regular?: boolean;
  intimacao_penhora?: boolean;
  intimacao_leilao_executado?: boolean;
  intimacao_credor_fiduciario?: boolean;
  coproprietario_intimado?: boolean;
  publicacao_edital_ok?: boolean;
  preco_vil?: boolean;
  preco_vil_caracterizado?: boolean;
  intimacao_executado?: boolean;
  intimacao_conjuge?: boolean;
  vicio_citacao: boolean;
  vicio_avaliacao: boolean;
  vicio_publicacao: boolean;
  vicio_procedimental: boolean;
  observacoes_nulidade: string;
  folhas_citacao?: string;
  folhas_intimacao_leilao?: string;
  
  status_consolidacao: 'Não verificado' | 'Regular' | 'Irregular' | 'Pendente' | 'Consolidada em cartório' | 'Pendente de averbação' | 'Em leilão judicial (Execução)' | 'Não aplicável' | 'Selecione';
  data_consolidacao?: string;
  intimacao_purga_mora: boolean;
  intimacao_leiloes: boolean;
  averbacao_consolidacao: boolean;
  observacoes_consolidacao: string;
  folhas_consolidacao?: string;
  
  matricula_atualizada: boolean;
  status_matricula?: string;
  indisponibilidade_bens?: boolean;
  usufruto_hipoteca?: boolean;
  tem_onus: boolean;
  tem_penhora: boolean;
  tem_hipoteca: boolean;
  alienacao_fiduciaria: boolean;
  indisponibilidade: boolean;
  acao_reipersecutoria: boolean;
  observacoes_matricula: string;
  folhas_penhora_matricula?: string;
  
  status_ocupacao: 'Ocupado pelo ex-mutuário' | 'Ocupado por terceiro' | 'Invasão' | 'Desocupado';
  situacao_ocupacional?: string;
  relacao_ex_mutuario: 'O próprio' | 'Parente' | 'Inquilino' | 'Desconhecido';
  nome_ocupante: string;
  cpf_ocupante: string;
  telefone_ocupante: string;
  tempo_ocupacao: string;
  risco_usucapiao: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  observacoes_ocupacao: string;

  // Informações do Imóvel
  tipo_imovel: 'Selecione' | 'Casa' | 'Apartamento' | 'Terreno' | 'Comercial' | 'Outros';
  numero_matricula: string;
  cadastro_imobiliario?: string;
  cartorio_registro: string;
  area_terreno: number;
  area_privativa: number;
  area_util: number;
  area_construida: number;
  observacoes_imovel: string;

  // Dados dos Ex-Mutuários
  nome_ex_mutuario: string;
  cpf_ex_mutuario: string;
  estado_civil_ex_mutuario: string;
  profissao_ex_mutuario: string;
  conjuge_ex_mutuario: string;
  endereco_ex_mutuario: string;
  observacoes_ex_mutuario: string;

  // Comentários Importantes & Divergências de Fontes
  comentarios_importantes?: string;
}

export function renderTextWithLeafBadges(text: any) {
  if (!text) return null;
  const strText = typeof text === 'string'
    ? text
    : (Array.isArray(text) ? text.join('\n\n') : (typeof text === 'object' ? JSON.stringify(text) : String(text)));

  if (!strText || strText.trim() === '') return null;

  const rawLines = strText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const highlightTokens = (rawStr: string, keyPrefix: string) => {
    const tokenRegex = /(fls?\.\s*\d+(?:\s*[-–a]\s*\d+)?(?:\s*e\s*\d+)?|folhas?\s*\d+(?:\s*[-–a]\s*\d+)?(?:\s*e\s*\d+)?|págs?\.\s*\d+(?:\s*[-–a]\s*\d+)?|Av\.\s*\d+(?:\/\d+)?|R\.\s*\d+(?:\/\d+)?|Evento\s*\d+(?:\s*[-–a]\s*\d+)?|Eventos\s*\d+(?:\s*[-–a]\s*\d+)?|1º\s*CRI(?:\/RTD)?|2º\s*CRI(?:\/RTD)?|3º\s*CRI(?:\/RTD)?|\bCRI\b|art\.\s*\d+[\w\s\.\/]*(?:Lei\s*[\d\.]+)?)/gi;
    
    const parts = rawStr.split(tokenRegex);
    if (parts.length === 1) return rawStr;

    return (
      <span key={keyPrefix}>
        {parts.map((part, idx) => {
          if (tokenRegex.test(part)) {
            const isEvent = /evento/i.test(part);
            const isLaw = /art\./i.test(part);
            const isCri = /cri/i.test(part);
            return (
              <span 
                key={`${keyPrefix}-${idx}`} 
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold mx-0.5 shadow-xs align-baseline ${
                  isEvent 
                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700/80'
                    : isLaw
                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700/80'
                      : isCri
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/80'
                        : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80'
                }`}
                title={isEvent ? "Evento Processual" : isLaw ? "Dispositivo Legal" : "Localização do Documento no Processo / Matrícula"}
              >
                <FileText size={11} className="shrink-0 opacity-80" />
                {part}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  const renderFormattedInline = (lineStr: string, lineKey: string) => {
    const boldParts = lineStr.split(/(\*\*[^*]+\*\*)/g);
    if (boldParts.length === 1) {
      return highlightTokens(lineStr, `${lineKey}-0`);
    }

    return (
      <span key={lineKey}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            const boldInner = bPart.slice(2, -2);
            return (
              <strong key={`${lineKey}-b-${bIdx}`} className="font-bold text-brand-ink">
                {highlightTokens(boldInner, `${lineKey}-b-${bIdx}-inner`)}
              </strong>
            );
          }
          return highlightTokens(bPart, `${lineKey}-txt-${bIdx}`);
        })}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {rawLines.map((line, lIdx) => {
        const numMatch = line.match(/^(\d+[\.\)]|\•|\-)\s+(.*)$/);
        if (numMatch) {
          const marker = numMatch[1];
          const rest = numMatch[2];
          return (
            <div key={lIdx} className="flex items-start gap-2.5 leading-relaxed text-brand-ink/90 font-sans">
              <span className="shrink-0 font-bold text-brand-ink text-xs select-none pt-0.5">
                {marker}
              </span>
              <div className="flex-1 text-xs leading-relaxed">
                {renderFormattedInline(rest, `line-${lIdx}`)}
              </div>
            </div>
          );
        }

        return (
          <div key={lIdx} className="text-xs leading-relaxed text-brand-ink/90 font-sans">
            {renderFormattedInline(line, `line-${lIdx}`)}
          </div>
        );
      })}
    </div>
  );
}

export function normalizeSmartAnalysis(raw: any): SmartAnalysisData {
  const empty = getEmptySmartAnalysis();
  if (!raw || typeof raw !== 'object') return empty;

  const normalized: any = { ...empty, ...raw };

  const stringFields = [
    'justificativa', 'justificativa_pessoal', 'observacoes_edital', 'folhas_edital', 'folhas_avaliacao',
    'observacoes_debitos', 'folhas_debitos', 'observacoes_desocupacao', 'prazo_estimado_desocupacao',
    'estimativa_prazo_desocupacao', 'folhas_ocupacao', 'observacoes_matricula', 'folhas_penhora_matricula',
    'data_consolidacao', 'observacoes_consolidacao', 'folhas_consolidacao', 'observacoes_nulidade',
    'folhas_citacao', 'folhas_intimacao_leilao', 'nome_ocupante', 'cpf_ocupante', 'telefone_ocupante',
    'tempo_ocupacao', 'relacao_ex_mutuario', 'observacoes_ocupacao', 'numero_matricula',
    'cadastro_imobiliario', 'cartorio_registro', 'observacoes_imovel', 'nome_ex_mutuario',
    'cpf_ex_mutuario', 'estado_civil_ex_mutuario', 'profissao_ex_mutuario', 'conjuge_ex_mutuario',
    'endereco_ex_mutuario', 'observacoes_ex_mutuario', 'comentarios_importantes'
  ];

  for (const field of stringFields) {
    const val = normalized[field];
    if (val !== undefined && val !== null) {
      if (typeof val !== 'string') {
        if (Array.isArray(val)) {
          normalized[field] = val.map((v: any) => typeof v === 'string' ? v : JSON.stringify(v)).join('\n');
        } else if (typeof val === 'object') {
          normalized[field] = JSON.stringify(val, null, 2);
        } else {
          normalized[field] = String(val);
        }
      }
    } else {
      normalized[field] = '';
    }
  }

  return normalized;
}

export const getEmptySmartAnalysis = (): SmartAnalysisData => ({
  risco_geral: 'Não avaliado',
  recomendacao: 'Selecione',
  justificativa: '',
  justificativa_pessoal: '',
  tipo_leilao: 'Selecione',
  responsabilidade_iptu: 'Selecione',
  responsabilidade_condominio: 'Selecione',
  observacoes_edital: '',
  folhas_edital: '',
  folhas_avaliacao: '',
  iptu_atraso: 0,
  condominio_atraso: 0,
  outros_debitos: 0,
  observacoes_debitos: '',
  folhas_debitos: '',
  nivel_risco_desocupacao: 'Não avaliado',
  risco_desocupacao: 'Não avaliado',
  liminar_bloqueando: false,
  acao_anulatoria: false,
  embargos_pendentes: false,
  recurso_pendente: false,
  prazo_estimado_desocupacao: '',
  estimativa_prazo_desocupacao: '',
  custo_estimado_desocupacao: 0,
  observacoes_desocupacao: '',
  folhas_ocupacao: '',
  risco_geral_nulidade: 'Não avaliado',
  risco_nulidade: 'Não avaliado',
  citacao_regular: false,
  intimacao_penhora: false,
  intimacao_leilao_executado: false,
  intimacao_credor_fiduciario: false,
  coproprietario_intimado: false,
  publicacao_edital_ok: false,
  preco_vil: false,
  preco_vil_caracterizado: false,
  intimacao_executado: false,
  intimacao_conjuge: false,
  vicio_citacao: false,
  vicio_avaliacao: false,
  vicio_publicacao: false,
  vicio_procedimental: false,
  observacoes_nulidade: '',
  folhas_citacao: '',
  folhas_intimacao_leilao: '',
  status_consolidacao: 'Selecione',
  data_consolidacao: '',
  intimacao_purga_mora: false,
  intimacao_leiloes: false,
  averbacao_consolidacao: false,
  observacoes_consolidacao: '',
  folhas_consolidacao: '',
  matricula_atualizada: false,
  status_matricula: 'Selecione',
  indisponibilidade_bens: false,
  usufruto_hipoteca: false,
  tem_onus: false,
  tem_penhora: false,
  tem_hipoteca: false,
  alienacao_fiduciaria: false,
  indisponibilidade: false,
  acao_reipersecutoria: false,
  observacoes_matricula: '',
  folhas_penhora_matricula: '',
  status_ocupacao: 'Ocupado pelo ex-mutuário',
  situacao_ocupacional: 'Selecione',
  relacao_ex_mutuario: 'O próprio',
  nome_ocupante: '',
  cpf_ocupante: '',
  telefone_ocupante: '',
  tempo_ocupacao: '',
  risco_usucapiao: 'Não avaliado',
  observacoes_ocupacao: '',

  // Informações do Imóvel
  tipo_imovel: 'Selecione',
  numero_matricula: '',
  cadastro_imobiliario: '',
  cartorio_registro: '',
  area_terreno: 0,
  area_privativa: 0,
  area_util: 0,
  area_construida: 0,
  observacoes_imovel: '',

  // Dados dos Ex-Mutuários
  nome_ex_mutuario: '',
  cpf_ex_mutuario: '',
  estado_civil_ex_mutuario: '',
  profissao_ex_mutuario: '',
  conjuge_ex_mutuario: '',
  endereco_ex_mutuario: '',
  observacoes_ex_mutuario: '',

  // Comentários Importantes & Divergências de Fontes
  comentarios_importantes: '',
});

interface SmartAnalysisTabProps {
  data: SmartAnalysisData | null;
  onSave: (updatedData: SmartAnalysisData) => Promise<void>;
  onTriggerAI: () => Promise<void>;
  onExtractSection?: (sectionKey: string) => Promise<void>;
  isAnalyzing: boolean;
  hasDocuments: boolean;
  docs: any[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  onDelete: (id: string) => void;
  onTranscribe?: (id: string) => void;
  uploading: boolean;
}

// Collapsible Section Wrapper Card
interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  statusDotColor?: string;
  badge?: React.ReactNode;
  summaryPreview?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  aiAction?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}

function CollapsibleCard({
  title,
  icon,
  statusDotColor,
  badge,
  summaryPreview,
  isOpen,
  onToggle,
  aiAction,
  children,
  id
}: CollapsibleCardProps) {
  return (
    <div 
      id={id}
      className={`bg-brand-paper rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        isOpen ? 'border-brand-primary/30 ring-1 ring-brand-primary/10' : 'border-brand-border'
      }`}
    >
      <div 
        onClick={onToggle}
        className="p-5 sm:p-6 flex items-center justify-between gap-3 cursor-pointer select-none bg-brand-bg/10 hover:bg-brand-primary/5 transition-colors border-b border-black/5"
      >
        <div className="flex items-center gap-3 min-w-0">
          {statusDotColor && (
            <span className={`w-3 h-3 rounded-full shrink-0 ${statusDotColor}`} />
          )}
          <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h5 className="font-serif font-semibold text-base sm:text-lg text-brand-primary truncate">
              {title}
            </h5>
            {!isOpen && summaryPreview && (
              <div className="text-[11px] text-brand-ink/60 truncate mt-0.5 font-sans">
                {summaryPreview}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {aiAction}
          {badge}
          <button
            type="button"
            onClick={onToggle}
            className="p-2 text-brand-ink/50 hover:text-brand-primary rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            title={isOpen ? "Minimizar quadro" : "Expandir quadro"}
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SmartAnalysisTab({
  data,
  onSave,
  onTriggerAI,
  onExtractSection,
  isAnalyzing,
  hasDocuments,
  docs,
  onUpload,
  onDelete,
  onTranscribe,
  uploading
}: SmartAnalysisTabProps) {
  const [localData, setLocalData] = React.useState<SmartAnalysisData>(normalizeSmartAnalysis(data));
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditingParecer, setIsEditingParecer] = React.useState(false);
  const [extractingSection, setExtractingSection] = React.useState<string | null>(null);

  // Collapsible state for each card
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    parecer: true,
    ocupacional: true,
    consolidacao: true,
    desocupacao: true,
    edital: true,
    matricula: true,
    nulidade: true,
    debitos: true,
    imovel: true,
    ex_mutuario: true,
    comentarios: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandAll = () => {
    const allOpen = Object.keys(openSections).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setOpenSections(allOpen);
  };

  const handleCollapseAll = () => {
    const allClosed = Object.keys(openSections).reduce((acc, k) => ({ ...acc, [k]: false }), {});
    setOpenSections(allClosed);
  };

  const areAllExpanded = Object.values(openSections).every(Boolean);

  const handleExtractSection = async (sectionKey: string) => {
    if (!onExtractSection) return;
    setExtractingSection(sectionKey);
    try {
      if (onSave) {
        await onSave(localData);
      }
      await onExtractSection(sectionKey);
    } finally {
      setExtractingSection(null);
    }
  };

  const renderSectionAIButton = (sectionKey: string) => {
    if (!onExtractSection) return null;
    const isBusy = extractingSection === sectionKey || isAnalyzing;
    return (
      <button
        type="button"
        disabled={isBusy}
        onClick={() => handleExtractSection(sectionKey)}
        className="p-1.5 px-3 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        title="Puxar e preencher dados deste quadro com IA a partir dos documentos anexados"
      >
        {extractingSection === sectionKey ? (
          <Loader2 size={13} className="animate-spin text-brand-primary" />
        ) : (
          <Sparkles size={13} className="text-brand-primary" />
        )}
        <span className="hidden sm:inline">Puxar Dados com IA</span>
        <span className="sm:hidden">Puxar IA</span>
      </button>
    );
  };

  React.useEffect(() => {
    if (data) {
      setLocalData(normalizeSmartAnalysis(data));
    }
  }, [data]);

  const handleChange = (key: keyof SmartAnalysisData, value: any) => {
    setLocalData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLocalSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localData);
    } finally {
      setIsSaving(false);
    }
  };

  // Counters
  const countParecer = () => {
    let count = 0;
    if (localData.risco_geral !== 'Não avaliado') count++;
    if (localData.recomendacao !== 'Selecione') count++;
    if (localData.justificativa?.trim().length > 5) count++;
    return { current: count, total: 3 };
  };

  const countEdital = () => {
    let count = 0;
    if (localData.tipo_leilao !== 'Selecione') count++;
    if (localData.responsabilidade_iptu !== 'Selecione') count++;
    if (localData.responsabilidade_condominio !== 'Selecione') count++;
    return { current: count, total: 3 };
  };

  const countDebitos = () => {
    let count = 0;
    if (localData.iptu_atraso > 0) count++;
    if (localData.condominio_atraso > 0) count++;
    if (localData.outros_debitos > 0) count++;
    return { current: count, total: 3 };
  };

  const countRiscoDesocupacao = () => {
    let count = 0;
    const r = localData.risco_desocupacao || localData.nivel_risco_desocupacao;
    if (r && r !== 'Não avaliado') count++;
    const p = localData.estimativa_prazo_desocupacao || localData.prazo_estimado_desocupacao;
    if (p && p.trim() !== '') count++;
    if ((localData.custo_estimado_desocupacao || 0) > 0) count++;
    return { current: count, total: 3 };
  };

  const countRiscoNulidade = () => {
    let count = 0;
    const r = localData.risco_nulidade || localData.risco_geral_nulidade;
    if (r && r !== 'Não avaliado') count++;
    if (localData.preco_vil_caracterizado !== undefined) count++;
    if (localData.intimacao_executado) count++;
    if (localData.intimacao_conjuge) count++;
    return { current: count, total: 4 };
  };

  const countConsolidacao = () => {
    let count = 0;
    if (localData.status_consolidacao && localData.status_consolidacao !== 'Não verificado' && (localData.status_consolidacao as string) !== 'Selecione') count++;
    if (localData.data_consolidacao && localData.data_consolidacao.trim() !== '') count++;
    return { current: count, total: 2 };
  };

  const countMatricula = () => {
    let count = 0;
    const items = [
      localData.matricula_atualizada, localData.tem_penhora,
      localData.tem_hipoteca, localData.alienacao_fiduciaria, localData.indisponibilidade_bens || localData.indisponibilidade,
      localData.usufruto_hipoteca, localData.acao_reipersecutoria
    ];
    count = items.filter(Boolean).length;
    if (localData.status_matricula && localData.status_matricula !== 'Selecione') count++;
    return { current: count, total: items.length + 1 };
  };

  const countOcupacional = () => {
    let count = 0;
    const sit = localData.situacao_ocupacional || localData.status_ocupacao;
    if (sit && sit !== 'Selecione') count++;
    if (localData.risco_usucapiao && localData.risco_usucapiao !== 'Não avaliado') count++;
    if (localData.nome_ocupante && localData.nome_ocupante.trim() !== '') count++;
    if (localData.cpf_ocupante && localData.cpf_ocupante.trim() !== '') count++;
    return { current: count, total: 4 };
  };

  const countImovel = () => {
    let count = 0;
    if (localData.tipo_imovel !== 'Selecione') count++;
    if (localData.numero_matricula && localData.numero_matricula.trim() !== '') count++;
    if (localData.cartorio_registro && localData.cartorio_registro.trim() !== '') count++;
    if (localData.area_terreno > 0) count++;
    if (localData.area_privativa > 0) count++;
    if (localData.area_util > 0) count++;
    return { current: count, total: 6 };
  };

  const countExMutuario = () => {
    let count = 0;
    if (localData.nome_ex_mutuario && localData.nome_ex_mutuario.trim() !== '') count++;
    if (localData.cpf_ex_mutuario && localData.cpf_ex_mutuario.trim() !== '') count++;
    if (localData.estado_civil_ex_mutuario && localData.estado_civil_ex_mutuario.trim() !== '') count++;
    if (localData.profissao_ex_mutuario && localData.profissao_ex_mutuario.trim() !== '') count++;
    if (localData.endereco_ex_mutuario && localData.endereco_ex_mutuario.trim() !== '') count++;
    return { current: count, total: 5 };
  };

  const countComentarios = () => {
    let count = 0;
    const txt = typeof localData.comentarios_importantes === 'string' 
      ? localData.comentarios_importantes 
      : (localData.comentarios_importantes ? String(localData.comentarios_importantes) : '');
    if (txt.trim().length > 10) count++;
    return { current: count, total: 1 };
  };

  const handleInsertTemplate = (title: string, bodyText: string) => {
    setLocalData(prev => {
      const rawCurrent = prev.comentarios_importantes;
      const current = typeof rawCurrent === 'string' 
        ? rawCurrent.trim() 
        : (rawCurrent ? String(rawCurrent).trim() : '');
      const existingMatches = current.match(/(?:^|\n)\s*(\d+)[\.\)]\s+/g) || [];
      const nextNum = existingMatches.length + 1;
      const newEntry = `${nextNum}. **${title}:** ${bodyText}`;
      const updated = current ? `${current}\n\n${newEntry}` : newEntry;
      return { ...prev, comentarios_importantes: updated };
    });
  };

  const renderProgressBadge = (current: number, total: number) => {
    const isCompleted = current === total && total > 0;
    return (
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
        isCompleted 
          ? 'bg-emerald-100 text-emerald-800' 
          : current > 0 
            ? 'bg-amber-100 text-amber-800' 
            : 'bg-brand-bg text-brand-ink/40'
      }`}>
        {current}/{total}
      </span>
    );
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'Baixo': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Médio': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Alto': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-brand-ink/40 bg-brand-bg border-brand-border';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="smart-analysis-tab-container">
      
      {/* Top action header card */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-3xl border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" id="smart-analysis-header">
        <div>
          <h4 className="text-xl font-serif font-medium text-brand-primary flex items-center gap-2">
            <Cpu className="text-brand-primary" size={24} />
            Análise Smart de Riscos
          </h4>
          <p className="text-xs text-brand-ink/50 mt-1">
            Preenchimento automático inteligente com IA de todos os pontos de risco da arrematação ou ajuste manual minucioso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onTriggerAI}
            disabled={isAnalyzing || !hasDocuments}
            className="flex items-center gap-2 bg-[#5A5A40] text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-[#4A4A30] transition-all shadow-md disabled:opacity-50 cursor-pointer"
            id="btn-trigger-smart-ai"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <Cpu size={16} />
                Gerar com Inteligência Artificial
              </>
            )}
          </button>
          
          <button
            onClick={handleLocalSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-brand-primary text-black px-5 py-3 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
            id="btn-save-smart-analysis"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Análise Smart
          </button>

          <button
            onClick={() => exportElementToPDF('smart-analysis-tab-container', 'Analise_Smart_Leilao_TJ_INVEST.pdf', 'Análise Smart - Parecer do Investidor')}
            className="flex items-center gap-2 bg-brand-bg hover:bg-black/5 text-brand-ink px-4 py-3 rounded-xl text-xs font-bold transition-all border border-brand-border no-print shadow-xs cursor-pointer"
            id="btn-export-smart-pdf"
          >
            <Download size={16} className="text-brand-primary" />
            Exportar PDF
          </button>

          {/* Master Expand/Collapse Toggle Button */}
          <button
            type="button"
            onClick={areAllExpanded ? handleCollapseAll : handleExpandAll}
            className="flex items-center gap-1.5 px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 text-brand-ink border border-brand-border rounded-xl text-xs font-bold transition-all cursor-pointer"
            title={areAllExpanded ? "Recolher todas as seções" : "Expandir todas as seções"}
          >
            {areAllExpanded ? (
              <>
                <Minimize2 size={14} className="text-brand-primary" />
                <span>Recolher Todos</span>
              </>
            ) : (
              <>
                <Maximize2 size={14} className="text-brand-primary" />
                <span>Expandir Todos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!hasDocuments && (
        <div className="p-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 text-xs font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>Faça upload dos documentos (Edital, Matrícula, Processo) para liberar o preenchimento automático por Inteligência Artificial.</span>
        </div>
      )}

      {/* Upload de Documentos Integrado */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-border shadow-sm space-y-6" id="smart-analysis-documents-upload">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-primary/10 pb-4">
          <div>
            <h5 className="text-md font-bold text-brand-primary flex items-center gap-2 uppercase tracking-wider">
              <FileText size={18} className="text-brand-primary" />
              Documentos do Leilão para Análise
            </h5>
            <p className="text-xs text-brand-ink/50 mt-1">
              Envie os arquivos do leilão diretamente nesta aba para habilitar e calibrar a inteligência de auto-preenchimento.
            </p>
          </div>
          {hasDocuments && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full shrink-0 self-start sm:self-center">
              Documentos Disponíveis para IA
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {['Edital', 'Matrícula', 'Processo Judicial', 'Outros'].map(category => (
            <div key={category} className="bg-brand-bg/10 p-5 rounded-2xl border border-brand-border/30">
              <DocumentManager 
                label={category} 
                docs={docs} 
                onUpload={onUpload} 
                onDelete={onDelete} 
                onTranscribe={onTranscribe}
                uploading={uploading} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Top Banner: Parecer do Investidor (Collapsible) */}
      <div className="bg-brand-paper rounded-[2rem] border border-brand-border shadow-sm overflow-hidden" id="smart-analysis-parecer-banner">
        <div 
          onClick={() => toggleSection('parecer')}
          className="p-6 sm:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-bg/10 hover:bg-brand-primary/5 transition-colors cursor-pointer border-b border-black/5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-2xl">
              <Shield size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50">CHECKLIST CONSOLIDADO DE VIABILIDADE</span>
              <h4 className="font-serif font-semibold text-xl text-brand-primary flex items-center gap-2">
                PARECER DO INVESTIDOR
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getRiskColor(localData.risco_geral)}`}>
              Risco: {localData.risco_geral}
            </span>
            <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${
              localData.recomendacao?.includes('Prosseguir') || localData.recomendacao?.includes('Recomendo')
                ? 'bg-emerald-500 text-white' 
                : localData.recomendacao?.includes('Não') 
                  ? 'bg-red-500 text-white' 
                  : 'bg-amber-500 text-white'
            }`}>
              {localData.recomendacao !== 'Selecione' ? localData.recomendacao : 'Pendente de Avaliação'}
            </span>
            {renderSectionAIButton('parecer')}
            <button
              type="button"
              onClick={() => setIsEditingParecer(!isEditingParecer)}
              className="p-2 px-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border rounded-xl text-xs font-bold text-brand-ink flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 size={14} className="text-brand-primary" />
              {isEditingParecer ? 'Fechar Edição' : 'Editar'}
            </button>
            <button
              type="button"
              onClick={() => toggleSection('parecer')}
              className="p-2 text-brand-ink/50 hover:text-brand-primary rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            >
              {openSections.parecer ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {openSections.parecer && (
          <div className="p-6 sm:p-7 space-y-5 animate-in fade-in duration-200">
            {isEditingParecer ? (
              <div className="space-y-4 pt-1 bg-brand-bg/20 p-5 rounded-2xl border border-brand-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco Geral do Negócio</label>
                    <select 
                      value={localData.risco_geral} 
                      onChange={e => handleChange('risco_geral', e.target.value)}
                      className={`p-3 border rounded-xl outline-none text-xs font-medium transition-colors ${getRiskColor(localData.risco_geral)}`}
                    >
                      <option value="Não avaliado">Não avaliado</option>
                      <option value="Baixo">Baixo</option>
                      <option value="Médio">Médio</option>
                      <option value="Alto">Alto</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Recomendação de Arrematação</label>
                    <select 
                      value={localData.recomendacao} 
                      onChange={e => handleChange('recomendacao', e.target.value)}
                      className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary text-brand-ink/80"
                    >
                      <option value="Selecione">Selecione</option>
                      <option value="Prosseguir">Prosseguir (Sem ressalvas)</option>
                      <option value="Prosseguir com ressalvas">Prosseguir com ressalvas</option>
                      <option value="Não prosseguir">Não prosseguir (Alto Risco)</option>
                      <option value="Recomendo arrematar">Recomendo arrematar</option>
                      <option value="Recomendo com ressalvas">Recomendo com ressalvas</option>
                      <option value="Não recomendo arrematar">Não recomendo arrematar</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Justificativa Comercial/Técnica</label>
                  <textarea
                    value={localData.justificativa}
                    onChange={e => handleChange('justificativa', e.target.value)}
                    placeholder="Explique os principais motivos e embasamentos para a sua recomendação final..."
                    rows={3}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none focus:border-brand-primary text-brand-ink/80"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Justificativa Pessoal / Comentários do Arrematante</label>
                  <textarea
                    value={localData.justificativa_pessoal || ''}
                    onChange={e => handleChange('justificativa_pessoal', e.target.value)}
                    placeholder="Sua análise pessoal e comentários sobre a decisão de arrematação..."
                    rows={2}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none focus:border-brand-primary text-brand-ink/80"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-brand-ink/80 leading-relaxed font-sans bg-brand-bg/30 p-4 rounded-xl border border-brand-border/40 whitespace-pre-wrap">
                  {localData.justificativa || "Análise preliminar indica viabilidade jurídica e financeira dependendo da conferência dos ônus de edital e certidões negativas."}
                </p>
                {localData.justificativa_pessoal && (
                  <p className="text-xs text-brand-ink/60 italic leading-relaxed font-sans pl-3 border-l-2 border-brand-primary/40">
                    Observação do Arrematante: "{localData.justificativa_pessoal}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Section Header: Análise do Investidor */}
      <div className="space-y-6" id="smart-analysis-investor-section">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <h3 className="text-xl font-bold font-serif text-brand-primary flex items-center gap-2">
            <TrendingUp size={22} className="text-brand-primary" />
            Análise do Investidor
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-ink/50 font-medium">Ordem sequencial dos anexos</span>
          </div>
        </div>

        {/* 2-Column Grid following exact order from user's screenshots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN:                                             */}
          {/* 1. Situação Ocupacional                                  */}
          {/* 2. Consolidação de Propriedade                          */}
          {/* 3. Risco de Desocupação                                  */}
          {/* 4. Análise do Edital                                     */}
          {/* ======================================================== */}
          <div className="space-y-6">
            
            {/* 1. Situação Ocupacional */}
            <CollapsibleCard
              id="card-situacao-ocupacional"
              title="Situação Ocupacional"
              icon={<User size={18} />}
              statusDotColor={
                (localData.situacao_ocupacional || localData.status_ocupacao) === 'Desocupado' 
                  ? 'bg-emerald-500' 
                  : (localData.situacao_ocupacional || localData.status_ocupacao)?.includes('Ocupado') 
                    ? 'bg-amber-500' 
                    : 'bg-gray-400'
              }
              summaryPreview={
                <span>
                  Status: <strong>{localData.situacao_ocupacional || localData.status_ocupacao || 'Não informado'}</strong> | Risco Usucapião: <strong>{localData.risco_usucapiao || 'Não avaliado'}</strong>
                </span>
              }
              isOpen={openSections.ocupacional}
              onToggle={() => toggleSection('ocupacional')}
              aiAction={renderSectionAIButton('ocupacional')}
              badge={renderProgressBadge(countOcupacional().current, countOcupacional().total)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Situação Atual</label>
                  <select 
                    value={localData.situacao_ocupacional || localData.status_ocupacao || 'Selecione'} 
                    onChange={e => {
                      handleChange('situacao_ocupacional', e.target.value);
                      handleChange('status_ocupacao', e.target.value as any);
                    }}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="Desocupado">Desocupado</option>
                    <option value="Ocupado pelo Ex-Mutuário">Ocupado pelo Ex-Mutuário</option>
                    <option value="Ocupado por Inquilino/Terceiro">Ocupado por Inquilino/Terceiro</option>
                    <option value="Invasão">Invasão</option>
                    <option value="Desconhecido">Desconhecido</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco de Usucapião</label>
                  <select 
                    value={localData.risco_usucapiao || 'Não avaliado'} 
                    onChange={e => handleChange('risco_usucapiao', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Não avaliado">Não avaliado</option>
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Nome do Ocupante</label>
                  <input
                    type="text"
                    value={localData.nome_ocupante || ''}
                    onChange={e => handleChange('nome_ocupante', e.target.value)}
                    placeholder="Nome completo..."
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">CPF / CNPJ Ocupante</label>
                  <input
                    type="text"
                    value={localData.cpf_ocupante || ''}
                    onChange={e => handleChange('cpf_ocupante', e.target.value)}
                    placeholder="000.000.000-00"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Telefone / Contato</label>
                  <input
                    type="text"
                    value={localData.telefone_ocupante || ''}
                    onChange={e => handleChange('telefone_ocupante', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Tempo de Ocupação</label>
                  <input
                    type="text"
                    value={localData.tempo_ocupacao || ''}
                    onChange={e => handleChange('tempo_ocupacao', e.target.value)}
                    placeholder="Ex: 2 anos"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Detalhes e Histórico de Ocupação</label>
                <textarea
                  value={localData.observacoes_ocupacao || ''}
                  onChange={e => handleChange('observacoes_ocupacao', e.target.value)}
                  placeholder="Informações detalhadas sobre constatação de ocupação, visitas presenciais..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Localização / Folhas nos Autos (ex: fls. 180 e 200)</span>
                  {localData.folhas_ocupacao && (
                    <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      {localData.folhas_ocupacao}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={localData.folhas_ocupacao || ''}
                  onChange={e => handleChange('folhas_ocupacao', e.target.value)}
                  placeholder="Ex: fls. 180-185 (Auto de Constatação)"
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                />
              </div>
            </CollapsibleCard>

            {/* 2. Consolidação de Propriedade */}
            <CollapsibleCard
              id="card-consolidacao-propriedade"
              title="Consolidação de Propriedade"
              icon={<CheckSquare size={18} />}
              statusDotColor={
                localData.status_consolidacao?.includes('Consolidada') || localData.status_consolidacao === 'Regular'
                  ? 'bg-emerald-500' 
                  : 'bg-amber-500'
              }
              summaryPreview={
                <span>
                  Status: <strong>{localData.status_consolidacao || 'Não verificado'}</strong> | Data: <strong>{localData.data_consolidacao || 'N/D'}</strong>
                </span>
              }
              isOpen={openSections.consolidacao}
              onToggle={() => toggleSection('consolidacao')}
              aiAction={renderSectionAIButton('consolidacao')}
              badge={renderProgressBadge(countConsolidacao().current, countConsolidacao().total)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Status da Consolidação</label>
                  <select 
                    value={localData.status_consolidacao} 
                    onChange={e => handleChange('status_consolidacao', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="Consolidada em cartório">Consolidada em cartório</option>
                    <option value="Regular">Regular</option>
                    <option value="Pendente de averbação">Pendente de averbação</option>
                    <option value="Irregular">Irregular</option>
                    <option value="Em leilão judicial (Execução)">Em leilão judicial (Execução)</option>
                    <option value="Não aplicável">Não aplicável</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Data da Consolidação</label>
                  <input
                    type="date"
                    value={localData.data_consolidacao || ''}
                    onChange={e => handleChange('data_consolidacao', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.intimacao_purga_mora} 
                    onChange={e => handleChange('intimacao_purga_mora', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Intimação Purga Mora</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.intimacao_leiloes} 
                    onChange={e => handleChange('intimacao_leiloes', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Intimação Leilões</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.averbacao_consolidacao} 
                    onChange={e => handleChange('averbacao_consolidacao', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Averbação na Matrícula</span>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações do Registro de Consolidação</label>
                <textarea
                  value={localData.observacoes_consolidacao || ''}
                  onChange={e => handleChange('observacoes_consolidacao', e.target.value)}
                  placeholder="Averbações de leilões negativos passados, quitação de ITBI, Lei 9.514/97..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Localização / Averbação no CRI (ex: Av. 06 / fls. 310)</span>
                  {localData.folhas_consolidacao && (
                    <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      {localData.folhas_consolidacao}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={localData.folhas_consolidacao || ''}
                  onChange={e => handleChange('folhas_consolidacao', e.target.value)}
                  placeholder="Ex: Av. 06 da Matrícula (fls. 310 dos autos)"
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                />
              </div>
            </CollapsibleCard>

            {/* 3. Risco de Desocupação */}
            <CollapsibleCard
              id="card-risco-desocupacao"
              title="Risco de Desocupação"
              icon={<AlertTriangle size={18} />}
              statusDotColor={
                (localData.risco_desocupacao || localData.nivel_risco_desocupacao) === 'Baixo' 
                  ? 'bg-emerald-500' 
                  : (localData.risco_desocupacao || localData.nivel_risco_desocupacao) === 'Alto' 
                    ? 'bg-red-500' 
                    : 'bg-amber-500'
              }
              summaryPreview={
                <span>
                  Risco: <strong>{localData.risco_desocupacao || localData.nivel_risco_desocupacao || 'Não avaliado'}</strong> | Prazo: <strong>{localData.estimativa_prazo_desocupacao || localData.prazo_estimado_desocupacao || 'N/D'}</strong>
                </span>
              }
              isOpen={openSections.desocupacao}
              onToggle={() => toggleSection('desocupacao')}
              aiAction={renderSectionAIButton('desocupacao')}
              badge={renderProgressBadge(countRiscoDesocupacao().current, countRiscoDesocupacao().total)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Nível de Risco</label>
                  <select 
                    value={localData.risco_desocupacao || localData.nivel_risco_desocupacao || 'Não avaliado'} 
                    onChange={e => {
                      handleChange('risco_desocupacao', e.target.value);
                      handleChange('nivel_risco_desocupacao', e.target.value as any);
                    }}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Não avaliado">Não avaliado</option>
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Estimativa de Prazo</label>
                  <input
                    type="text"
                    value={localData.estimativa_prazo_desocupacao || localData.prazo_estimado_desocupacao || ''}
                    onChange={e => {
                      handleChange('estimativa_prazo_desocupacao', e.target.value);
                      handleChange('prazo_estimado_desocupacao', e.target.value);
                    }}
                    placeholder="Ex: 3 a 6 meses"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    value={localData.custo_estimado_desocupacao || ''}
                    onChange={e => handleChange('custo_estimado_desocupacao', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 5000"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.liminar_bloqueando} 
                    onChange={e => handleChange('liminar_bloqueando', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Liminar Bloqueando</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.acao_anulatoria} 
                    onChange={e => handleChange('acao_anulatoria', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Ação Anulatória</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.embargos_pendentes} 
                    onChange={e => handleChange('embargos_pendentes', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Embargos Pendentes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.recurso_pendente} 
                    onChange={e => handleChange('recurso_pendente', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Recurso Pendente</span>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Estratégia Recomendada de Desocupação</label>
                <textarea
                  value={localData.observacoes_desocupacao || ''}
                  onChange={e => handleChange('observacoes_desocupacao', e.target.value)}
                  placeholder="Acordo extrajudicial com auxílio mudança vs. Mandado de imissão de posse judicial..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Localização / Folhas nos Autos (ex: fls. 180 e 200)</span>
                  {localData.folhas_ocupacao && (
                    <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      {localData.folhas_ocupacao}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={localData.folhas_ocupacao || ''}
                  onChange={e => handleChange('folhas_ocupacao', e.target.value)}
                  placeholder="Ex: fls. 180 e 200"
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                />
              </div>
            </CollapsibleCard>

            {/* 4. Análise do Edital */}
            <CollapsibleCard
              id="card-analise-edital"
              title="Análise do Edital"
              icon={<FileText size={18} />}
              statusDotColor="bg-emerald-500"
              summaryPreview={
                <span>
                  Tipo: <strong>{localData.tipo_leilao || 'Não informado'}</strong> | IPTU: <strong>{localData.responsabilidade_iptu || 'N/D'}</strong> | Condomínio: <strong>{localData.responsabilidade_condominio || 'N/D'}</strong>
                </span>
              }
              isOpen={openSections.edital}
              onToggle={() => toggleSection('edital')}
              aiAction={renderSectionAIButton('edital')}
              badge={renderProgressBadge(countEdital().current, countEdital().total)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Tipo de Leilão</label>
                  <select 
                    value={localData.tipo_leilao} 
                    onChange={e => handleChange('tipo_leilao', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="Judicial">Judicial</option>
                    <option value="Extrajudicial">Extrajudicial</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Resp. IPTU</label>
                  <select 
                    value={localData.responsabilidade_iptu} 
                    onChange={e => handleChange('responsabilidade_iptu', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="Vendedor (Banco)">Vendedor (Banco)</option>
                    <option value="Comprador">Comprador</option>
                    <option value="Sub-rogado no preço">Sub-rogado no preço</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Resp. Condomínio</label>
                  <select 
                    value={localData.responsabilidade_condominio} 
                    onChange={e => handleChange('responsabilidade_condominio', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="Vendedor (Banco)">Vendedor (Banco)</option>
                    <option value="Comprador">Comprador</option>
                    <option value="Sub-rogado no preço">Sub-rogado no preço</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações do Edital</label>
                <textarea
                  value={localData.observacoes_edital}
                  onChange={e => handleChange('observacoes_edital', e.target.value)}
                  placeholder="Detalhamento das datas de praça, formas de parcelamento, eventuais encargos extras..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                    <span>Folhas do Edital (ex: fls. 210 e 211)</span>
                    {localData.folhas_edital && (
                      <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                        {localData.folhas_edital}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={localData.folhas_edital || ''}
                    onChange={e => handleChange('folhas_edital', e.target.value)}
                    placeholder="Ex: fls. 210-215"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                    <span>Folhas da Avaliação (ex: fls. 150)</span>
                    {localData.folhas_avaliacao && (
                      <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                        {localData.folhas_avaliacao}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={localData.folhas_avaliacao || ''}
                    onChange={e => handleChange('folhas_avaliacao', e.target.value)}
                    placeholder="Ex: fls. 150-165"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
              </div>
            </CollapsibleCard>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN:                                            */}
          {/* 1. Análise da Matrícula                                  */}
          {/* 2. Risco de Nulidade do Leilão                          */}
          {/* 3. Débitos do Imóvel                                     */}
          {/* ======================================================== */}
          <div className="space-y-6">

            {/* 1. Análise da Matrícula */}
            <CollapsibleCard
              id="card-analise-matricula"
              title="Análise da Matrícula"
              icon={<FileText size={18} />}
              statusDotColor={
                localData.status_matricula === 'Regular sem gravames' 
                  ? 'bg-emerald-500' 
                  : 'bg-red-500'
              }
              summaryPreview={
                <span>
                  Status: <strong>{localData.status_matricula || 'Não informado'}</strong> | Matrícula: <strong>{localData.numero_matricula || 'N/D'}</strong>
                </span>
              }
              isOpen={openSections.matricula}
              onToggle={() => toggleSection('matricula')}
              aiAction={renderSectionAIButton('matricula')}
              badge={renderProgressBadge(countMatricula().current, countMatricula().total)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Status Registral</label>
                  <select 
                    value={localData.status_matricula} 
                    onChange={e => handleChange('status_matricula', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="Regular sem gravames">Regular sem gravames</option>
                    <option value="Possui penhoras averbadas">Possui penhoras averbadas</option>
                    <option value="Possui hipoteca/alienação">Possui hipoteca/alienação</option>
                    <option value="Possui indisponibilidade">Possui indisponibilidade</option>
                    <option value="Restrições graves">Restrições graves</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Nº da Matrícula</label>
                  <input
                    type="text"
                    value={localData.numero_matricula || ''}
                    onChange={e => handleChange('numero_matricula', e.target.value)}
                    placeholder="Ex: 140.105"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                    <span>Inscrição / Cadastro IPTU</span>
                    {localData.cadastro_imobiliario && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(localData.cadastro_imobiliario || '')}
                        className="text-brand-primary hover:underline text-[9px] lowercase"
                        title="Copiar código IPTU"
                      >
                        copiar
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={localData.cadastro_imobiliario || ''}
                    onChange={e => handleChange('cadastro_imobiliario', e.target.value)}
                    placeholder="Ex: 01.02.034.0056-7 ou SQL"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.tem_penhora} 
                    onChange={e => handleChange('tem_penhora', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Penhoras</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.indisponibilidade_bens || localData.indisponibilidade} 
                    onChange={e => {
                      handleChange('indisponibilidade_bens', e.target.checked);
                      handleChange('indisponibilidade', e.target.checked);
                    }}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Indisponibilidade</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.usufruto_hipoteca || localData.tem_hipoteca} 
                    onChange={e => {
                      handleChange('usufruto_hipoteca', e.target.checked);
                      handleChange('tem_hipoteca', e.target.checked);
                    }}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Usufruto/Hipoteca</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.alienacao_fiduciaria} 
                    onChange={e => handleChange('alienacao_fiduciaria', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Alienação Fiduciária</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.matricula_atualizada} 
                    onChange={e => handleChange('matricula_atualizada', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Matrícula Atualizada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.acao_reipersecutoria} 
                    onChange={e => handleChange('acao_reipersecutoria', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Ação Reipersecutória</span>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações e Histórico de Gravames</label>
                <textarea
                  value={localData.observacoes_matricula}
                  onChange={e => handleChange('observacoes_matricula', e.target.value)}
                  placeholder="Detalhamento das R. e Av. da matrícula, credores fiduciários e penhoras anteriores..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Localização / Averbações dos Ônus (ex: Av. 04 / fls. 88)</span>
                  {localData.folhas_penhora_matricula && (
                    <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      {localData.folhas_penhora_matricula}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={localData.folhas_penhora_matricula || ''}
                  onChange={e => handleChange('folhas_penhora_matricula', e.target.value)}
                  placeholder="Ex: R. 03 (Penhora) / Av. 04 (Indisponibilidade) fls. 88"
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                />
              </div>
            </CollapsibleCard>

            {/* 2. Risco de Nulidade do Leilão */}
            <CollapsibleCard
              id="card-risco-nulidade"
              title="Risco de Nulidade do Leilão"
              icon={<Scale size={18} />}
              statusDotColor={
                (localData.risco_nulidade || localData.risco_geral_nulidade) === 'Baixo' 
                  ? 'bg-emerald-500' 
                  : (localData.risco_nulidade || localData.risco_geral_nulidade) === 'Alto' 
                    ? 'bg-red-500' 
                    : 'bg-amber-500'
              }
              summaryPreview={
                <span>
                  Risco Nulidade: <strong>{localData.risco_nulidade || localData.risco_geral_nulidade || 'Não avaliado'}</strong> | Preço Vil: <strong>{localData.preco_vil_caracterizado ? 'Sim' : 'Não'}</strong>
                </span>
              }
              isOpen={openSections.nulidade}
              onToggle={() => toggleSection('nulidade')}
              aiAction={renderSectionAIButton('nulidade')}
              badge={renderProgressBadge(countRiscoNulidade().current, countRiscoNulidade().total)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco Geral de Nulidade</label>
                  <select 
                    value={localData.risco_nulidade || localData.risco_geral_nulidade || 'Não avaliado'} 
                    onChange={e => {
                      handleChange('risco_nulidade', e.target.value);
                      handleChange('risco_geral_nulidade', e.target.value as any);
                    }}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Não avaliado">Não avaliado</option>
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Preço Vil Caracterizado?</label>
                  <select 
                    value={localData.preco_vil_caracterizado ? 'Sim' : 'Não'} 
                    onChange={e => handleChange('preco_vil_caracterizado', e.target.value === 'Sim')}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Não">Não (Lance ≥ 50% da Avaliação)</option>
                    <option value="Sim">Sim (Risco de Anulação por Preço Vil)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.intimacao_executado || localData.citacao_regular} 
                    onChange={e => {
                      handleChange('intimacao_executado', e.target.checked);
                      handleChange('citacao_regular', e.target.checked);
                    }}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Intimação Executado OK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.intimacao_conjuge} 
                    onChange={e => handleChange('intimacao_conjuge', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Intimação Cônjuge OK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.intimacao_credor_fiduciario} 
                    onChange={e => handleChange('intimacao_credor_fiduciario', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Credor Fiduciário OK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.publicacao_edital_ok} 
                    onChange={e => handleChange('publicacao_edital_ok', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Publicação Edital OK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.coproprietario_intimado} 
                    onChange={e => handleChange('coproprietario_intimado', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Coproprietário OK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.vicio_citacao} 
                    onChange={e => handleChange('vicio_citacao', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Vício de Citação</span>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Detalhamento dos Riscos de Processo</label>
                <textarea
                  value={localData.observacoes_nulidade}
                  onChange={e => handleChange('observacoes_nulidade', e.target.value)}
                  placeholder="Informações sobre editais publicados, citação por edital vs pessoal, recursos..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                    <span>Folhas da Citação (ex: fls. 50 e 60)</span>
                    {localData.folhas_citacao && (
                      <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                        {localData.folhas_citacao}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={localData.folhas_citacao || ''}
                    onChange={e => handleChange('folhas_citacao', e.target.value)}
                    placeholder="Ex: fls. 50 e 60"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                    <span>Folhas Intimação Leilão (ex: fls. 120-125)</span>
                    {localData.folhas_intimacao_leilao && (
                      <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                        {localData.folhas_intimacao_leilao}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={localData.folhas_intimacao_leilao || ''}
                    onChange={e => handleChange('folhas_intimacao_leilao', e.target.value)}
                    placeholder="Ex: fls. 120-125"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
              </div>
            </CollapsibleCard>

            {/* 3. Débitos do Imóvel */}
            <CollapsibleCard
              id="card-debitos-imovel"
              title="Débitos do Imóvel"
              icon={<DollarSign size={18} />}
              statusDotColor={
                (localData.iptu_atraso + localData.condominio_atraso + localData.outros_debitos) > 0 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
              }
              summaryPreview={
                <span>
                  Total Débitos: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((localData.iptu_atraso || 0) + (localData.condominio_atraso || 0) + (localData.outros_debitos || 0))}</strong> (IPTU: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(localData.iptu_atraso || 0)})
                </span>
              }
              isOpen={openSections.debitos}
              onToggle={() => toggleSection('debitos')}
              aiAction={renderSectionAIButton('debitos')}
              badge={renderProgressBadge(countDebitos().current, countDebitos().total)}
            >
              {localData.cadastro_imobiliario && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Inscrição / Cadastro IPTU para consulta na Prefeitura:</span>
                    <span className="font-mono font-bold text-brand-ink">{localData.cadastro_imobiliario}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(localData.cadastro_imobiliario || '')}
                    className="px-2 py-0.5 bg-amber-200/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-300 rounded-md text-[10px] font-bold transition-all shrink-0 flex items-center gap-1"
                  >
                    <Copy size={10} /> Copiar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">IPTU Atraso (R$)</label>
                  <input
                    type="number"
                    value={localData.iptu_atraso}
                    onChange={e => handleChange('iptu_atraso', parseFloat(e.target.value) || 0)}
                    className="p-2.5 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Condomínio (R$)</label>
                  <input
                    type="number"
                    value={localData.condominio_atraso}
                    onChange={e => handleChange('condominio_atraso', parseFloat(e.target.value) || 0)}
                    className="p-2.5 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Outros (R$)</label>
                  <input
                    type="number"
                    value={localData.outros_debitos}
                    onChange={e => handleChange('outros_debitos', parseFloat(e.target.value) || 0)}
                    className="p-2.5 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações e Origem dos Débitos</label>
                <textarea
                  value={localData.observacoes_debitos}
                  onChange={e => handleChange('observacoes_debitos', e.target.value)}
                  placeholder="Certidões negativas tributárias consultadas, pendências de concessionárias..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Localização / Folhas das Certidões de Débitos (ex: fls. 95 e 98)</span>
                  {localData.folhas_debitos && (
                    <span className="text-amber-700 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      {localData.folhas_debitos}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={localData.folhas_debitos || ''}
                  onChange={e => handleChange('folhas_debitos', e.target.value)}
                  placeholder="Ex: fls. 95 e 98 dos autos"
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                />
              </div>
            </CollapsibleCard>

          </div>

        </div>
      </div>

      {/* Bento Grid layout for complementary info (Collapsible) */}
      <div className="space-y-6" id="smart-analysis-bento-grid">
        
        {/* CARD: Informações do Imóvel (Collapsible) */}
        <CollapsibleCard
          id="card-informacoes-imovel"
          title="Informações do Imóvel (Extraídas do Edital/Matrícula)"
          icon={<Home size={18} />}
          summaryPreview={
            <span>
              Tipo: <strong>{localData.tipo_imovel || 'Não informado'}</strong> | Matrícula: <strong>{localData.numero_matricula || 'N/D'}</strong> | Área Terreno: <strong>{localData.area_terreno ? `${localData.area_terreno} m²` : 'N/D'}</strong> | Cartório: <strong>{localData.cartorio_registro || 'N/D'}</strong>
            </span>
          }
          isOpen={openSections.imovel}
          onToggle={() => toggleSection('imovel')}
          aiAction={renderSectionAIButton('imovel')}
          badge={renderProgressBadge(countImovel().current, countImovel().total)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Tipo de Imóvel</label>
              <select 
                value={localData.tipo_imovel} 
                onChange={e => handleChange('tipo_imovel', e.target.value)}
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              >
                <option value="Selecione">Selecione</option>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Matrícula</label>
              <input
                type="text"
                value={localData.numero_matricula || ''}
                onChange={e => handleChange('numero_matricula', e.target.value)}
                placeholder="Ex: 140105"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider flex items-center justify-between">
                <span>Inscrição / Cadastro IPTU</span>
                {localData.cadastro_imobiliario && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(localData.cadastro_imobiliario || '')}
                    className="text-brand-primary hover:underline text-[9px] lowercase"
                    title="Copiar Inscrição/Cadastro para consulta de IPTU na Prefeitura"
                  >
                    copiar
                  </button>
                )}
              </label>
              <input
                type="text"
                value={localData.cadastro_imobiliario || ''}
                onChange={e => handleChange('cadastro_imobiliario', e.target.value)}
                placeholder="Ex: 01.02.034.0056-7 ou SQL"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Cartório de Registro (CRI)</label>
              <input
                type="text"
                value={localData.cartorio_registro || ''}
                onChange={e => handleChange('cartorio_registro', e.target.value)}
                placeholder="Ex: Oficial de Registro de Imóveis..."
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Área do Terreno (m²)</label>
              <input
                type="number"
                value={localData.area_terreno || ''}
                onChange={e => handleChange('area_terreno', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 250"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Área Privativa (m²)</label>
              <input
                type="number"
                value={localData.area_privativa || ''}
                onChange={e => handleChange('area_privativa', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 69"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Área Útil (m²)</label>
              <input
                type="number"
                value={localData.area_util || ''}
                onChange={e => handleChange('area_util', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 69"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Área Construída (m²)</label>
              <input
                type="number"
                value={localData.area_construida || ''}
                onChange={e => handleChange('area_construida', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 110"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Descrição / Observações do Imóvel</label>
            <textarea
              value={localData.observacoes_imovel || ''}
              onChange={e => handleChange('observacoes_imovel', e.target.value)}
              placeholder="Descreva as características físicas do imóvel, divisões internas, vagas de garagem, etc. constantes da matrícula ou edital..."
              rows={2}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none focus:border-brand-primary"
            />
          </div>
        </CollapsibleCard>

        {/* CARD: Dados dos Ex-Mutuários / Proprietários (Collapsible) */}
        <CollapsibleCard
          id="card-dados-ex-mutuario"
          title="Dados do Ex-Mutuário / Proprietário Anterior (Devedores/Executados)"
          icon={<User size={18} />}
          summaryPreview={
            <span>
              Nome: <strong>{localData.nome_ex_mutuario || 'Não informado'}</strong> | CPF: <strong>{localData.cpf_ex_mutuario || 'N/D'}</strong> | Estado Civil: <strong>{localData.estado_civil_ex_mutuario || 'N/D'}</strong>
            </span>
          }
          isOpen={openSections.ex_mutuario}
          onToggle={() => toggleSection('ex_mutuario')}
          aiAction={renderSectionAIButton('ex_mutuario')}
          badge={renderProgressBadge(countExMutuario().current, countExMutuario().total)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Nome Completo do Ex-Mutuário</label>
              <input
                type="text"
                value={localData.nome_ex_mutuario || ''}
                onChange={e => handleChange('nome_ex_mutuario', e.target.value)}
                placeholder="Nome do mutuário ou executado principal..."
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">CPF / CNPJ</label>
              <input
                type="text"
                value={localData.cpf_ex_mutuario || ''}
                onChange={e => handleChange('cpf_ex_mutuario', e.target.value)}
                placeholder="000.000.000-00"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Estado Civil</label>
              <input
                type="text"
                value={localData.estado_civil_ex_mutuario || ''}
                onChange={e => handleChange('estado_civil_ex_mutuario', e.target.value)}
                placeholder="Casado, solteiro, divorciado..."
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Profissão</label>
              <input
                type="text"
                value={localData.profissao_ex_mutuario || ''}
                onChange={e => handleChange('profissao_ex_mutuario', e.target.value)}
                placeholder="Profissão descrita na matrícula..."
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Cônjuge / Coproprietário</label>
              <input
                type="text"
                value={localData.conjuge_ex_mutuario || ''}
                onChange={e => handleChange('conjuge_ex_mutuario', e.target.value)}
                placeholder="Nome e CPF do cônjuge ou outros coproprietários citados na matrícula..."
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Endereço Completo e Minucioso</label>
            <textarea
              value={localData.endereco_ex_mutuario || ''}
              onChange={e => handleChange('endereco_ex_mutuario', e.target.value)}
              placeholder="Endereço residencial e endereço comercial do ex-mutuário, incluindo referências..."
              rows={2}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none focus:border-brand-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Histórico / Observações dos Ex-Mutuários</label>
            <textarea
              value={localData.observacoes_ex_mutuario || ''}
              onChange={e => handleChange('observacoes_ex_mutuario', e.target.value)}
              placeholder="Informações sobre herdeiros, óbitos, divórcios que afetem a propriedade ou outras anotações relevantes da matrícula..."
              rows={2}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none focus:border-brand-primary"
            />
          </div>
        </CollapsibleCard>

        {/* CARD: Comentários Importantes, Divergências e Cruzamento de Fontes (Collapsible) */}
        <CollapsibleCard
          id="card-comentarios-criticos"
          title="Comentários Importantes & Cruzamento de Fontes (Divergências, Inconsistências e Alertas Estratégicos)"
          icon={<Sparkles size={18} className="text-amber-500" />}
          summaryPreview={
            (typeof localData.comentarios_importantes === 'string' && localData.comentarios_importantes.trim().length > 0) ? (
              <span className="truncate max-w-xl text-brand-ink font-medium">
                {localData.comentarios_importantes.replace(/\n+/g, ' ').slice(0, 100)}...
              </span>
            ) : (
              <span>
                Cruzamento de fontes: divergências de metragem (edital vs matrícula/IPTU), validação de notificações alegadas e alertas
              </span>
            )
          }
          isOpen={openSections.comentarios}
          onToggle={() => toggleSection('comentarios')}
          aiAction={renderSectionAIButton('comentarios_importantes')}
          badge={renderProgressBadge(countComentarios().current, countComentarios().total)}
        >
          {/* Banner de Orientação & Padrão Estruturado */}
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-900 dark:text-amber-300 rounded-xl shrink-0 mt-0.5">
                <FileCheck2 size={18} />
              </div>
              <div className="space-y-1">
                <h6 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Cruzamento Analítico & Padrão de Comentários Estruturados
                </h6>
                <p className="text-xs text-brand-ink/80 leading-relaxed">
                  Os comentários devem manter a <strong>organização numerada com títulos em destaque</strong>, confrontando os fatos entre <strong>Edital/Página do Leiloeiro</strong>, <strong>Matrícula (CRI)</strong>, <strong>IPTU/Prefeitura</strong> e <strong>Processo Judicial (Eventos e Folhas)</strong>.
                </p>
              </div>
            </div>

            {/* Guia de Estrutura Padrão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 text-brand-ink/75">
              <div className="p-2.5 bg-brand-bg/60 rounded-xl border border-amber-500/20 flex gap-2 items-start">
                <span className="text-amber-600 font-bold shrink-0">1 & 2:</span>
                <span>
                  <strong>Regularidade & Decisões:</strong> Validação de notificações (comprovantes e assinaturas no CRI/RTD) e decisões judiciais (despachos, liminares e situação do certame).
                </span>
              </div>
              <div className="p-2.5 bg-brand-bg/60 rounded-xl border border-amber-500/20 flex gap-2 items-start">
                <span className="text-amber-600 font-bold shrink-0">3 & 4:</span>
                <span>
                  <strong>Divergência & Desocupação:</strong> Confronto de áreas/metragens (Edital x Matrícula x Prefeitura) e aspecto social/saúde do ocupante com previsão de acordo ou imissão (Lei 9.514/97).
                </span>
              </div>
            </div>
          </div>

          {/* Modelos Rápidos / Atalhos de Inserção */}
          <div className="space-y-2 pt-1">
            <label className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={12} className="text-brand-primary" /> Inserir Tópico Estruturado (Numeração Automática):
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleInsertTemplate("Regularidade da Notificação", "Embora a petição inicial da Anulatória sustente falta de intimação prévia para purgação da mora, no Evento [X] / fls. [Y] a própria autora acostou o comprovante de notificação do 1º CRI/RTD devidamente assinado por ela em [DD/MM/AAAA].")}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-border hover:border-brand-primary/40 rounded-xl text-[11px] font-semibold text-brand-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>📬</span> 1. Regularidade da Notificação
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("Decisão Judicial", "Em despacho proferido em [DD/MM/AAAA] (Evento [X]), a Juíza determinou a regularização do pedido antes de apreciar a tutela de urgência, não havendo suspensão formal do leilão até o momento.")}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-border hover:border-brand-primary/40 rounded-xl text-[11px] font-semibold text-brand-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>⚖️</span> 2. Decisão Judicial
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("Divergência de Área", "Identificou-se que a descrição do edital do leilão aponta uma área construída de [X]m², enquanto o documento oficial da Prefeitura (em anexo) registra o total de [Y]m², o que configura uma inconsistência formal no anúncio do certame.")}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-border hover:border-brand-primary/40 rounded-xl text-[11px] font-semibold text-brand-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>📐</span> 3. Divergência de Área
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("Aspecto Social e Desocupação", "Pelo estado de vulnerabilidade do ocupante, sugere-se provisionar prazo de 6 a 12 meses e tentar acordo de desocupação amigável ou suporte para transição, minimizando impactos processuais em eventual pedido liminar de imissão de posse (art. 30 da Lei 9.514/97).")}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-border hover:border-brand-primary/40 rounded-xl text-[11px] font-semibold text-brand-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🤝</span> 4. Aspecto Social e Desocupação
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("Inconsistência de Avaliação", "O laudo pericial (fls. [X]) avaliou o imóvel em R$ [X], valor substancialmente abaixo do mercado atual da região, propiciando excelente margem de segurança ao investidor.")}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-border hover:border-brand-primary/40 rounded-xl text-[11px] font-semibold text-brand-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>💰</span> Inconsistência de Avaliação
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("Vagas de Garagem / Fração Ideal", "O imóvel possui vaga(s) de garagem com matrícula autônoma (Nº [X]) ou vinculada à fração ideal, descrita às fls. [X] e na certidão do CRI.")}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-border hover:border-brand-primary/40 rounded-xl text-[11px] font-semibold text-brand-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🚗</span> Vagas de Garagem
              </button>

              <button
                type="button"
                onClick={() => handleInsertTemplate("Benfeitorias Não Averbadas", "Constatada a existência de edificação/reforma substancial no terreno que ainda não foi formalmente averbada na matrícula imobiliária.")}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-border hover:border-brand-primary/40 rounded-xl text-[11px] font-semibold text-brand-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🛠️</span> Benfeitorias Não Averbadas
              </button>
            </div>
          </div>

          {/* Campo de Texto Principal */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} /> Comentários Importantes & Cruzamento de Dados (Estrutura Numerada):
              </label>
              <div className="flex items-center gap-2">
                {localData.comentarios_importantes && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(localData.comentarios_importantes || '');
                        if ((window as any).customToast) (window as any).customToast("Comentários copiados para a área de transferência!", "success");
                      }}
                      className="text-brand-primary hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={11} /> Copiar texto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('comentarios_importantes', '')}
                      className="text-red-500 hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} /> Limpar
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              value={localData.comentarios_importantes || ''}
              onChange={e => handleChange('comentarios_importantes', e.target.value)}
              placeholder={`1. **Regularidade da Notificação:** Embora a petição inicial da Anulatória sustente falta de intimação prévia para purgação da mora, no Evento 8 a própria autora acostou o comprovante de notificação do 1º CRI/RTD devidamente assinado por ela em 13/05/2026.

2. **Decisão Judicial:** Em despacho proferido em 26/08/2026 (Evento 5), a Juíza determinou a regularização do pedido de justiça gratuita antes de apreciar a tutela de urgência, não havendo suspensão formal do leilão até o momento.

3. **Divergência de Área:** Identificou-se que a descrição do edital do leilão aponta uma área construída de 111m², enquanto o documento oficial da Prefeitura (em anexo) registra o total de 174m², o que configura uma inconsistência formal no anúncio do certame.

4. **Aspecto Social e Desocupação:** Pelo estado de saúde vulnerável da ocupante, sugere-se provisionar prazo de 6 a 12 meses e tentar acordo de desocupação amigável ou suporte para transição, minimizando impactos processuais em eventual pedido liminar de imissão de posse (art. 30 da Lei 9.514/97).`}
              rows={8}
              className="p-4 border border-brand-border bg-brand-bg rounded-2xl outline-none text-xs font-medium resize-y focus:border-brand-primary leading-relaxed shadow-inner"
            />

            {/* Painel de Visualização Formatada com Destaques e Badges */}
            {typeof localData.comentarios_importantes === 'string' && localData.comentarios_importantes.trim().length > 0 && (
              <div className="p-4 bg-brand-bg/50 border border-brand-border/70 rounded-2xl space-y-2.5">
                <div className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={12} className="text-emerald-500" /> Pré-Visualização Formatada (Tópicos Numerados & Destaques de Eventos/Folhas):
                </div>
                <div className="p-3 bg-brand-surface rounded-xl border border-brand-border/40 text-xs text-brand-ink leading-relaxed font-sans">
                  {renderTextWithLeafBadges(localData.comentarios_importantes)}
                </div>
              </div>
            )}
          </div>

          {/* Grid com os 4 Pareceres Automatizados de Segurança Complementares */}
          <div className="space-y-2 pt-4 border-t border-brand-border/40">
            <h6 className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">
              Pareceres Automatizados de Segurança Registral, Tributária e Estabilidade:
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Comentário 1 */}
              <div className="p-5 bg-brand-bg/25 border border-brand-border/40 rounded-2xl flex gap-4 items-start hover:border-brand-primary/25 transition-all">
                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-brand-primary/15 text-brand-primary text-xs font-bold font-mono">
                  01
                </span>
                <div className="space-y-1">
                  <h6 className="text-xs font-bold text-brand-ink uppercase tracking-wide font-sans">Observações da Matrícula (Gravames)</h6>
                  <p className="text-xs text-brand-ink/75 leading-relaxed font-sans">
                    {localData.tem_penhora || localData.tem_hipoteca || localData.alienacao_fiduciaria || localData.tem_onus
                      ? "Comentário: Existem ônus, penhoras ou gravames averbados na matrícula. Embora a arrematação judicial cancele as penhoras anteriores, é fundamental peticionar nos autos requerendo expressamente a expedição de ofícios para baixa de todos os gravames fiduciários e penhoras junto ao Cartório de Registro de Imóveis."
                      : "Comentário: A matrícula analisada não apresenta ônus ou penhoras registradas até o momento, indicando uma situação registral altamente favorável e menor burocracia para registro pós-arrematação."}
                  </p>
                </div>
              </div>

              {/* Comentário 2 */}
              <div className="p-5 bg-brand-bg/25 border border-brand-border/40 rounded-2xl flex gap-4 items-start hover:border-brand-primary/25 transition-all">
                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-brand-primary/15 text-brand-primary text-xs font-bold font-mono">
                  02
                </span>
                <div className="space-y-1">
                  <h6 className="text-xs font-bold text-brand-ink uppercase tracking-wide font-sans">Observações do Edital (Responsabilidades)</h6>
                  <p className="text-xs text-brand-ink/75 leading-relaxed font-sans">
                    {localData.responsabilidade_iptu === 'Comprador' || localData.responsabilidade_condominio === 'Comprador'
                      ? "Comentário: Atenção! O Edital atribui explicitamente ao arrematante a responsabilidade pelo pagamento de débitos anteriores de condomínio ou IPTU. Esses passivos devem ser rigorosamente provisionados e deduzidos do seu lance máximo para manter a margem de lucro intacta."
                      : "Comentário: O edital prevê a sub-rogação de débitos fiscais (IPTU) sobre o preço da arrematação (conforme Art. 130, parágrafo único do CTN). O arrematante receberá o imóvel livre dessas pendências tributárias anteriores."}
                  </p>
                </div>
              </div>

              {/* Comentário 3 */}
              <div className="p-5 bg-brand-bg/25 border border-brand-border/40 rounded-2xl flex gap-4 items-start hover:border-brand-primary/25 transition-all">
                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-brand-primary/15 text-brand-primary text-xs font-bold font-mono">
                  03
                </span>
                <div className="space-y-1">
                  <h6 className="text-xs font-bold text-brand-ink uppercase tracking-wide font-sans">Observações do Processo (Estabilidade)</h6>
                  <p className="text-xs text-brand-ink/75 leading-relaxed font-sans">
                    {localData.embargos_pendentes || localData.acao_anulatoria || localData.recurso_pendente || localData.liminar_bloqueando
                      ? "Comentário: Alerta Processual! Há ações anulatórias, embargos ou recursos pendentes de julgamento. Isso requer acompanhamento de perto pelo nosso corpo jurídico para garantir que eventuais alegações de vício de citação ou nulidade sejam superadas rapidamente."
                      : "Comentário: Segurança Jurídica Alta! O processo transcorreu de forma regular, sem incidentes graves de nulidade ou embargos à execução pendentes de julgamento, mitigando drasticamente o risco de desfazimento da arrematação."}
                  </p>
                </div>
              </div>

              {/* Comentário 4 */}
              <div className="p-5 bg-brand-bg/25 border border-brand-border/40 rounded-2xl flex gap-4 items-start hover:border-brand-primary/25 transition-all">
                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-brand-primary/15 text-brand-primary text-xs font-bold font-mono">
                  04
                </span>
                <div className="space-y-1">
                  <h6 className="text-xs font-bold text-brand-ink uppercase tracking-wide font-sans">Plano de Posse e Imissão</h6>
                  <p className="text-xs text-brand-ink/75 leading-relaxed font-sans">
                    {(localData.situacao_ocupacional || localData.status_ocupacao) !== 'Desocupado'
                      ? "Comentário: O imóvel encontra-se ocupado. Recomenda-se traçar um plano de abordagem amigável junto ao ocupante imediatamente após a emissão da guia de arrematação, aliando auxílio-mudança voluntário. Em caso de recusa, ativa-se o pedido de imissão forçada nos próprios autos."
                      : "Comentário: Imóvel desocupado! Excelente cenário de liquidez, permitindo a imissão imediata na posse após o registro da carta de arrematação, reduzindo custos de carregamento e acelerando a reforma e revenda."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>

      </div>

      {/* Bottom Save Action Panel */}
      <div className="flex justify-end pt-4" id="smart-analysis-footer">
        <button
          onClick={handleLocalSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-brand-primary text-black px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} />
              Sincronizar e Salvar Todos os Dados
            </>
          )}
        </button>
      </div>
    </div>
  );
}
