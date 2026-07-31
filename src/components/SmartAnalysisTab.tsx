import React from 'react';
import { 
  Shield, Cpu, Loader2, Save, FileText, CheckSquare, 
  HelpCircle, AlertTriangle, AlertCircle, RefreshCw, Sparkles,
  TrendingUp, Scale, Gavel, User, Home, DollarSign, Calendar,
  Download, Edit3, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { DocumentManager } from './DocumentManager';
import { exportElementToPDF } from '../utils/pdfExporter';

export interface SmartAnalysisData {
  risco_geral: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  recomendacao: 'Selecione' | 'Recomendo arrematar' | 'Recomendo com ressalvas' | 'Não recomendo arrematar';
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
  
  status_consolidacao: 'Não verificado' | 'Regular' | 'Irregular' | 'Pendente';
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
}

export function renderTextWithLeafBadges(text: string | undefined | null) {
  if (!text) return null;
  
  // Regex matches leaf/page patterns like:
  // fls. 123-125, fl. 45, folhas 50 e 60, pág. 12, págs. 12-15, Av. 04, R. 02, etc.
  const regex = /(fls?\.\s*\d+(?:\s*[-–a]\s*\d+)?(?:\s*e\s*\d+)?|folhas?\s*\d+(?:\s*[-–a]\s*\d+)?(?:\s*e\s*\d+)?|págs?\.\s*\d+(?:\s*[-–a]\s*\d+)?|Av\.\s*\d+|R\.\s*\d+(?:\/\d+)?)/gi;

  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return (
    <span>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <span 
              key={index} 
              className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold mx-0.5 shadow-xs align-baseline"
              title="Localização do Documento no Processo / Matrícula"
            >
              <FileText size={11} className="text-amber-700 dark:text-amber-400 shrink-0" />
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
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
  liminar_bloqueando: false,
  acao_anulatoria: false,
  embargos_pendentes: false,
  recurso_pendente: false,
  prazo_estimado_desocupacao: '',
  observacoes_desocupacao: '',
  folhas_ocupacao: '',
  risco_geral_nulidade: 'Não avaliado',
  citacao_regular: false,
  intimacao_penhora: false,
  intimacao_leilao_executado: false,
  intimacao_credor_fiduciario: false,
  coproprietario_intimado: false,
  publicacao_edital_ok: false,
  preco_vil: false,
  vicio_citacao: false,
  vicio_avaliacao: false,
  vicio_publicacao: false,
  vicio_procedimental: false,
  observacoes_nulidade: '',
  folhas_citacao: '',
  folhas_intimacao_leilao: '',
  status_consolidacao: 'Não verificado',
  intimacao_purga_mora: false,
  intimacao_leiloes: false,
  averbacao_consolidacao: false,
  observacoes_consolidacao: '',
  folhas_consolidacao: '',
  matricula_atualizada: false,
  tem_onus: false,
  tem_penhora: false,
  tem_hipoteca: false,
  alienacao_fiduciaria: false,
  indisponibilidade: false,
  acao_reipersecutoria: false,
  observacoes_matricula: '',
  folhas_penhora_matricula: '',
  status_ocupacao: 'Ocupado pelo ex-mutuário',
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
  const [localData, setLocalData] = React.useState<SmartAnalysisData>(data || getEmptySmartAnalysis());
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditingParecer, setIsEditingParecer] = React.useState(false);
  const [extractingSection, setExtractingSection] = React.useState<string | null>(null);

  const handleExtractSection = async (sectionKey: string) => {
    if (!onExtractSection) return;
    setExtractingSection(sectionKey);
    try {
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
      setLocalData(data);
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

  // Calculate checklists counters
  const countParecer = () => {
    let count = 0;
    if (localData.risco_geral !== 'Não avaliado') count++;
    if (localData.recomendacao !== 'Selecione') count++;
    if (localData.justificativa.trim().length > 5) count++;
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

  const countDesocupacao = () => {
    let count = 0;
    if (localData.nivel_risco_desocupacao !== 'Não avaliado') count++;
    if (localData.prazo_estimado_desocupacao && localData.prazo_estimado_desocupacao.trim() !== '') count++;
    return { current: count, total: 2 };
  };

  const countRiscoDesocupacao = () => {
    let count = 0;
    if ((localData.risco_desocupacao || localData.nivel_risco_desocupacao) && (localData.risco_desocupacao !== 'Não avaliado' || localData.nivel_risco_desocupacao !== 'Não avaliado')) count++;
    if ((localData.estimativa_prazo_desocupacao || localData.prazo_estimado_desocupacao) && (localData.estimativa_prazo_desocupacao || localData.prazo_estimado_desocupacao).trim() !== '') count++;
    return { current: count, total: 2 };
  };

  const countNulidade = () => {
    let count = 0;
    if (localData.risco_geral_nulidade !== 'Não avaliado') count++;
    const items = [
      localData.citacao_regular, localData.intimacao_penhora, localData.intimacao_leilao_executado,
      localData.intimacao_credor_fiduciario, localData.coproprietario_intimado, localData.publicacao_edital_ok,
      localData.preco_vil
    ];
    count += items.filter(Boolean).length;
    return { current: count, total: 1 + items.length };
  };

  const countRiscoNulidade = () => {
    let count = 0;
    if ((localData.risco_nulidade || localData.risco_geral_nulidade) && (localData.risco_nulidade !== 'Não avaliado' || localData.risco_geral_nulidade !== 'Não avaliado')) count++;
    if (localData.preco_vil_caracterizado !== undefined) count++;
    if (localData.intimacao_executado) count++;
    if (localData.intimacao_conjuge) count++;
    return { current: count, total: 4 };
  };

  const countConsolidacao = () => {
    let count = 0;
    if (localData.status_consolidacao && localData.status_consolidacao !== 'Não verificado' && (localData.status_consolidacao as string) !== 'Selecione') count++;
    return { current: count, total: 1 };
  };

  const countMatricula = () => {
    let count = 0;
    const items = [
      localData.matricula_atualizada, localData.tem_onus, localData.tem_penhora,
      localData.tem_hipoteca, localData.alienacao_fiduciaria, localData.indisponibilidade,
      localData.acao_reipersecutoria
    ];
    count = items.filter(Boolean).length;
    if (localData.status_matricula && localData.status_matricula !== 'Selecione') count++;
    return { current: count, total: items.length + 1 };
  };

  const countOcupacao = () => {
    let count = 0;
    if (localData.status_ocupacao) count++;
    if (localData.relacao_ex_mutuario) count++;
    if (localData.nome_ocupante && localData.nome_ocupante.trim() !== '') count++;
    if (localData.cpf_ocupante && localData.cpf_ocupante.trim() !== '') count++;
    if (localData.telefone_ocupante && localData.telefone_ocupante.trim() !== '') count++;
    if (localData.tempo_ocupacao && localData.tempo_ocupacao.trim() !== '') count++;
    if (localData.risco_usucapiao && localData.risco_usucapiao !== 'Não avaliado') count++;
    return { current: count, total: 7 };
  };

  const countOcupacional = () => {
    let count = 0;
    if (localData.situacao_ocupacional && localData.situacao_ocupacional !== 'Selecione') count++;
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

  const getRiskColor = (risk: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto') => {
    switch(risk) {
      case 'Baixo': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Médio': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Alto': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-brand-ink/40 bg-brand-bg border-brand-border';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500" id="smart-analysis-tab-container">
      {/* Top action header card */}
      <div className="bg-brand-paper p-8 rounded-3xl border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" id="smart-analysis-header">
        <div>
          <h4 className="text-xl font-serif font-medium text-brand-primary flex items-center gap-2">
            <Cpu className="text-brand-primary" size={24} />
            Análise Smart de Riscos
          </h4>
          <p className="text-xs text-brand-ink/50 mt-1">
            Preenchimento automático inteligente com IA de todos os pontos de risco da arrematação ou ajuste manual minucioso.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onTriggerAI}
            disabled={isAnalyzing || !hasDocuments}
            className="flex items-center gap-2 bg-[#5A5A40] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#4A4A30] transition-all shadow-md disabled:opacity-50"
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
            className="flex items-center gap-2 bg-brand-primary text-black px-6 py-3 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/10"
            id="btn-save-smart-analysis"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Análise Smart
          </button>

          <button
            onClick={() => exportElementToPDF('smart-analysis-tab-container', 'Analise_Smart_Leilao_TJ_INVEST.pdf', 'Análise Smart - Parecer do Investidor')}
            className="flex items-center gap-2 bg-brand-bg hover:bg-black/5 dark:hover:bg-white/10 text-brand-ink px-5 py-3 rounded-xl text-xs font-bold transition-all border border-brand-border no-print shadow-xs"
            id="btn-export-smart-pdf"
          >
            <Download size={16} className="text-brand-primary" />
            Exportar PDF
          </button>
        </div>
      </div>

      {!hasDocuments && (
        <div className="p-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 text-xs font-medium">
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

      {/* Top Banner: Parecer do Investidor */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden" id="smart-analysis-parecer-banner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-2xl">
              <Shield size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50">CHECKLIST CONSOLIDADO DE VIABILIDADE</span>
              <h4 className="font-serif font-medium text-xl text-brand-primary flex items-center gap-2">
                PARECER DO INVESTIDOR
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getRiskColor(localData.risco_geral)}`}>
              Risco: {localData.risco_geral}
            </span>
            <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${
              localData.recomendacao.includes('Prosseguir') || localData.recomendacao.includes('Recomendo')
                ? 'bg-emerald-500 text-white' 
                : localData.recomendacao.includes('Não') 
                  ? 'bg-red-500 text-white' 
                  : 'bg-amber-500 text-white'
            }`}>
              {localData.recomendacao !== 'Selecione' ? localData.recomendacao : 'Pendente de Avaliação'}
            </span>
            <button
              onClick={() => setIsEditingParecer(!isEditingParecer)}
              className="p-2 px-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border rounded-xl text-xs font-bold text-brand-ink flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 size={14} className="text-brand-primary" />
              {isEditingParecer ? 'Fechar Edição' : 'Editar Parecer'}
            </button>
          </div>
        </div>

        {/* Text summary or inline edit */}
        {isEditingParecer ? (
          <div className="space-y-4 pt-2 animate-in fade-in duration-300 bg-brand-bg/20 p-5 rounded-2xl border border-brand-border">
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

      {/* Main Section Header: Análise do Investidor */}
      <div className="space-y-6" id="smart-analysis-investor-section">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <h3 className="text-xl font-bold font-serif text-brand-primary flex items-center gap-2">
            <TrendingUp size={22} className="text-brand-primary" />
            Análise do Investidor
          </h3>
          <span className="text-xs text-brand-ink/50 font-medium">Sequência recomendada de checagem</span>
        </div>

        {/* 2-Column Grid as per reference screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            
            {/* 1. Situação Ocupacional */}
            <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${localData.situacao_ocupacional === 'Desocupado' ? 'bg-emerald-500' : localData.situacao_ocupacional === 'Ocupado pelo Ex-Mutuário' || localData.situacao_ocupacional === 'Ocupado por Inquilino/Terceiro' ? 'bg-amber-500' : 'bg-gray-400'}`} title={localData.situacao_ocupacional}></span>
                  <User size={18} className="text-brand-primary/70" />
                  Situação Ocupacional
                </h5>
                <div className="flex items-center gap-2">
                  {renderSectionAIButton('ocupacional')}
                  {renderProgressBadge(countOcupacional().current, countOcupacional().total)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Situação Atual</label>
                  <select 
                    value={localData.situacao_ocupacional} 
                    onChange={e => handleChange('situacao_ocupacional', e.target.value)}
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="Desocupado">Desocupado</option>
                    <option value="Ocupado pelo Ex-Mutuário">Ocupado pelo Ex-Mutuário</option>
                    <option value="Ocupado por Inquilino/Terceiro">Ocupado por Inquilino/Terceiro</option>
                    <option value="Desconhecido">Desconhecido</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco de Usucapião</label>
                  <select 
                    value={localData.risco_usucapiao} 
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
                    value={localData.nome_ocupante}
                    onChange={e => handleChange('nome_ocupante', e.target.value)}
                    placeholder="Nome completo..."
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">CPF / CNPJ Ocupante</label>
                  <input
                    type="text"
                    value={localData.cpf_ocupante}
                    onChange={e => handleChange('cpf_ocupante', e.target.value)}
                    placeholder="000.000.000-00"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Detalhes e Histórico de Ocupação</label>
                <textarea
                  value={localData.observacoes_ocupacao}
                  onChange={e => handleChange('observacoes_ocupacao', e.target.value)}
                  placeholder="Informações detalhadas sobre constatação de ocupação, visitas presenciais (cite fls. se relevante)..."
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
                  placeholder="Ex: fls. 180-185"
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                />
              </div>
            </div>

            {/* 2. Consolidação de Propriedade */}
            <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${localData.status_consolidacao.includes('Consolidada') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  <CheckSquare size={18} className="text-brand-primary/70" />
                  Consolidação de Propriedade
                </h5>
                <div className="flex items-center gap-2">
                  {renderSectionAIButton('consolidacao')}
                  {renderProgressBadge(countConsolidacao().current, countConsolidacao().total)}
                </div>
              </div>

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
                    <option value="Pendente de averbação">Pendente de averbação</option>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações do Registro de Consolidação</label>
                <textarea
                  value={localData.observacoes_consolidacao || ''}
                  onChange={e => handleChange('observacoes_consolidacao', e.target.value)}
                  placeholder="Averbações de leilões negativos passados, quitação de ITBI..."
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
            </div>

            {/* 3. Risco de Desocupação */}
            <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${localData.risco_desocupacao === 'Baixo' ? 'bg-emerald-500' : localData.risco_desocupacao === 'Alto' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                  <AlertTriangle size={18} className="text-brand-primary/70" />
                  Risco de Desocupação
                </h5>
                <div className="flex items-center gap-2">
                  {renderSectionAIButton('desocupacao')}
                  {renderProgressBadge(countRiscoDesocupacao().current, countRiscoDesocupacao().total)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Nível de Risco</label>
                  <select 
                    value={localData.risco_desocupacao} 
                    onChange={e => handleChange('risco_desocupacao', e.target.value)}
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
                    value={localData.estimativa_prazo_desocupacao || ''}
                    onChange={e => handleChange('estimativa_prazo_desocupacao', e.target.value)}
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
            </div>

            {/* 4. Análise do Edital */}
            <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
                  <span className="w-3 h-3 rounded-full shrink-0 bg-emerald-500"></span>
                  <FileText size={18} className="text-brand-primary/70" />
                  Análise do Edital
                </h5>
                <div className="flex items-center gap-2">
                  {renderSectionAIButton('edital')}
                  {renderProgressBadge(countEdital().current, countEdital().total)}
                </div>
              </div>

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
                  placeholder="Detalhamento das datas de praça, formas de parcelamento, eventuais encargos extras (cite fls. se relevante)..."
                  rows={2}
                  className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Folhas do Edital (ex: fls. 210 e 211)</label>
                  <input
                    type="text"
                    value={localData.folhas_edital || ''}
                    onChange={e => handleChange('folhas_edital', e.target.value)}
                    placeholder="Ex: fls. 210-215"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Folhas da Avaliação (ex: fls. 150)</label>
                  <input
                    type="text"
                    value={localData.folhas_avaliacao || ''}
                    onChange={e => handleChange('folhas_avaliacao', e.target.value)}
                    placeholder="Ex: fls. 150-165"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* 1. Análise da Matrícula */}
            <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${localData.status_matricula === 'Regular sem gravames' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <FileText size={18} className="text-brand-primary/70" />
                  Análise da Matrícula
                </h5>
                <div className="flex items-center gap-2">
                  {renderSectionAIButton('matricula')}
                  {renderProgressBadge(countMatricula().current, countMatricula().total)}
                </div>
              </div>

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
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-medium pt-1">
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
                    checked={localData.indisponibilidade_bens} 
                    onChange={e => handleChange('indisponibilidade_bens', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Indisponibilidade</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.usufruto_hipoteca} 
                    onChange={e => handleChange('usufruto_hipoteca', e.target.checked)}
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Usufruto/Hipoteca</span>
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
            </div>

            {/* 2. Risco de Nulidade do Leilão */}
            <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${localData.risco_nulidade === 'Baixo' ? 'bg-emerald-500' : localData.risco_nulidade === 'Alto' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                  <Scale size={18} className="text-brand-primary/70" />
                  Risco de Nulidade do Leilão
                </h5>
                <div className="flex items-center gap-2">
                  {renderSectionAIButton('nulidade')}
                  {renderProgressBadge(countRiscoNulidade().current, countRiscoNulidade().total)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco Geral de Nulidade</label>
                  <select 
                    value={localData.risco_nulidade} 
                    onChange={e => handleChange('risco_nulidade', e.target.value)}
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

              <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                <label className="flex items-center gap-2 cursor-pointer bg-brand-bg/40 p-2.5 rounded-xl border border-brand-border/40">
                  <input 
                    type="checkbox" 
                    checked={localData.intimacao_executado} 
                    onChange={e => handleChange('intimacao_executado', e.target.checked)}
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
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Folhas da Citação (ex: fls. 50 e 60)</label>
                  <input
                    type="text"
                    value={localData.folhas_citacao || ''}
                    onChange={e => handleChange('folhas_citacao', e.target.value)}
                    placeholder="Ex: fls. 50 e 60"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Folhas Intimação Leilão (ex: fls. 120-125)</label>
                  <input
                    type="text"
                    value={localData.folhas_intimacao_leilao || ''}
                    onChange={e => handleChange('folhas_intimacao_leilao', e.target.value)}
                    placeholder="Ex: fls. 120-125"
                    className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Débitos do Imóvel */}
            <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${(localData.iptu_atraso + localData.condominio_atraso + localData.outros_debitos) > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                  <DollarSign size={18} className="text-brand-primary/70" />
                  Débitos do Imóvel
                </h5>
                <div className="flex items-center gap-2">
                  {renderSectionAIButton('debitos')}
                  {renderProgressBadge(countDebitos().current, countDebitos().total)}
                </div>
              </div>

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
            </div>

          </div>

        </div>
      </div>

      {/* Bento Grid layout for complementary info */}
      <div className="grid grid-cols-1 gap-8" id="smart-analysis-bento-grid">
        
        {/* CARD: Informações do Imóvel */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <Home size={18} className="text-brand-primary/70" />
              Informações do Imóvel (Extraídas do Edital/Matrícula)
            </h5>
            <div className="flex items-center gap-2">
              {renderSectionAIButton('imovel')}
              {renderProgressBadge(countImovel().current, countImovel().total)}
            </div>
          </div>

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

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Cartório de Registro de Imóveis (CRI)</label>
              <input
                type="text"
                value={localData.cartorio_registro || ''}
                onChange={e => handleChange('cartorio_registro', e.target.value)}
                placeholder="Ex: Oficial de Registro de Imóveis da Comarca..."
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
        </div>

        {/* CARD: Dados dos Ex-Mutuários / Proprietários */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <User size={18} className="text-brand-primary/70" />
              Dados do Ex-Mutuário / Proprietário Anterior (Devedores/Executados)
            </h5>
            <div className="flex items-center gap-2">
              {renderSectionAIButton('ex_mutuario')}
              {renderProgressBadge(countExMutuario().current, countExMutuario().total)}
            </div>
          </div>

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
        </div>

      </div>

      {/* Comentários e Pontos de Observação Crítica de Acordo com Análises */}
      <div className="bg-brand-paper p-8 rounded-3xl border border-brand-border space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-black/5 pb-4">
          <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
            <CheckSquare size={20} />
          </div>
          <div>
            <h5 className="font-serif font-medium text-lg text-brand-primary">
              Comentários e Observações Críticas (Matrícula, Edital e Processo)
            </h5>
            <p className="text-xs text-brand-ink/40">
              Pontos de atenção estratégicos automatizados com base nas análises documentais realizadas
            </p>
          </div>
        </div>

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
                {localData.status_ocupacao !== 'Desocupado'
                  ? "Comentário: O imóvel encontra-se ocupado. Recomenda-se traçar um plano de abordagem amigável junto ao ocupante imediatamente após a emissão da guia de arrematação, aliando auxílio-mudança voluntário. Em caso de recusa, ativa-se o pedido de imissão forçada nos próprios autos."
                  : "Comentário: Imóvel desocupado! Excelente cenário de liquidez, permitindo a imissão imediata na posse após o registro da carta de arrematação, reduzindo custos de carregamento e acelerando a reforma e revenda."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Action Panel */}
      <div className="flex justify-end pt-4" id="smart-analysis-footer">
        <button
          onClick={handleLocalSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-brand-primary text-black px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
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
