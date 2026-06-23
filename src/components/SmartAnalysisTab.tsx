import React from 'react';
import { 
  Shield, Cpu, Loader2, Save, FileText, CheckSquare, 
  HelpCircle, AlertTriangle, AlertCircle, RefreshCw,
  TrendingUp, Scale, Gavel, User, Home, DollarSign, Calendar
} from 'lucide-react';

export interface SmartAnalysisData {
  risco_geral: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  recomendacao: 'Selecione' | 'Recomendo arrematar' | 'Recomendo com ressalvas' | 'Não recomendo arrematar';
  justificativa: string;
  
  tipo_leilao: 'Selecione' | 'Judicial' | 'Extrajudicial';
  responsabilidade_iptu: 'Selecione' | 'Vendedor (Banco)' | 'Comprador' | 'Sub-rogado no preço';
  responsabilidade_condominio: 'Selecione' | 'Vendedor (Banco)' | 'Comprador' | 'Sub-rogado no preço';
  observacoes_edital: string;
  
  iptu_atraso: number;
  condominio_atraso: number;
  outros_debitos: number;
  observacoes_debitos: string;
  
  nivel_risco_desocupacao: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  liminar_bloqueando: boolean;
  acao_anulatoria: boolean;
  embargos_pendentes: boolean;
  recurso_pendente: boolean;
  prazo_estimado_desocupacao: string;
  observacoes_desocupacao: string;
  
  risco_geral_nulidade: 'Não avaliado' | 'Baixo' | 'Médio' | 'Alto';
  vicio_citacao: boolean;
  vicio_avaliacao: boolean;
  vicio_publicacao: boolean;
  vicio_procedimental: boolean;
  observacoes_nulidade: string;
  
  status_consolidacao: 'Não verificado' | 'Regular' | 'Irregular' | 'Pendente';
  intimacao_purga_mora: boolean;
  intimacao_leiloes: boolean;
  averbacao_consolidacao: boolean;
  observacoes_consolidacao: string;
  
  matricula_atualizada: boolean;
  tem_onus: boolean;
  tem_penhora: boolean;
  tem_hipoteca: boolean;
  alienacao_fiduciaria: boolean;
  indisponibilidade: boolean;
  acao_reipersecutoria: boolean;
  observacoes_matricula: string;
  
  status_ocupacao: 'Ocupado pelo ex-mutuário' | 'Ocupado por terceiro' | 'Invasão' | 'Desocupado';
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

export const getEmptySmartAnalysis = (): SmartAnalysisData => ({
  risco_geral: 'Não avaliado',
  recomendacao: 'Selecione',
  justificativa: '',
  tipo_leilao: 'Selecione',
  responsabilidade_iptu: 'Selecione',
  responsabilidade_condominio: 'Selecione',
  observacoes_edital: '',
  iptu_atraso: 0,
  condominio_atraso: 0,
  outros_debitos: 0,
  observacoes_debitos: '',
  nivel_risco_desocupacao: 'Não avaliado',
  liminar_bloqueando: false,
  acao_anulatoria: false,
  embargos_pendentes: false,
  recurso_pendente: false,
  prazo_estimado_desocupacao: '',
  observacoes_desocupacao: '',
  risco_geral_nulidade: 'Não avaliado',
  vicio_citacao: false,
  vicio_avaliacao: false,
  vicio_publicacao: false,
  vicio_procedimental: false,
  observacoes_nulidade: '',
  status_consolidacao: 'Não verificado',
  intimacao_purga_mora: false,
  intimacao_leiloes: false,
  averbacao_consolidacao: false,
  observacoes_consolidacao: '',
  matricula_atualizada: false,
  tem_onus: false,
  tem_penhora: false,
  tem_hipoteca: false,
  alienacao_fiduciaria: false,
  indisponibilidade: false,
  acao_reipersecutoria: false,
  observacoes_matricula: '',
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
  isAnalyzing: boolean;
  hasDocuments: boolean;
}

export default function SmartAnalysisTab({
  data,
  onSave,
  onTriggerAI,
  isAnalyzing,
  hasDocuments
}: SmartAnalysisTabProps) {
  const [localData, setLocalData] = React.useState<SmartAnalysisData>(data || getEmptySmartAnalysis());
  const [isSaving, setIsSaving] = React.useState(false);

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
    if (localData.prazo_estimado_desocupacao.trim() !== '') count++;
    return { current: count, total: 2 };
  };

  const countNulidade = () => {
    let count = 0;
    if (localData.risco_geral_nulidade !== 'Não avaliado') count++;
    return { current: count, total: 1 };
  };

  const countConsolidacao = () => {
    let count = 0;
    if (localData.status_consolidacao !== 'Não verificado') count++;
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
    return { current: count, total: items.length };
  };

  const countOcupacao = () => {
    let count = 0;
    if (localData.status_ocupacao) count++;
    if (localData.relacao_ex_mutuario) count++;
    if (localData.nome_ocupante.trim() !== '') count++;
    if (localData.cpf_ocupante.trim() !== '') count++;
    if (localData.telefone_ocupante.trim() !== '') count++;
    if (localData.tempo_ocupacao.trim() !== '') count++;
    if (localData.risco_usucapiao !== 'Não avaliado') count++;
    return { current: count, total: 7 };
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
        </div>
      </div>

      {!hasDocuments && (
        <div className="p-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 text-xs font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>Faça upload dos documentos (Edital, Matrícula, Processo) para liberar o preenchimento automático por Inteligência Artificial.</span>
        </div>
      )}

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="smart-analysis-bento-grid">
        
        {/* CARD: Informações do Imóvel */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all lg:col-span-2">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <Home size={18} className="text-brand-primary/70" />
              Informações do Imóvel (Extraídas do Edital/Matrícula)
            </h5>
            {renderProgressBadge(countImovel().current, countImovel().total)}
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
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all lg:col-span-2">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <User size={18} className="text-brand-primary/70" />
              Dados do Ex-Mutuário / Proprietário Anterior (Devedores/Executados)
            </h5>
            {renderProgressBadge(countExMutuario().current, countExMutuario().total)}
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
        
        {/* CARD 1: Parecer Final do Investidor */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <Shield size={18} className="text-brand-primary/70" />
              Parecer Final do Investidor
            </h5>
            {renderProgressBadge(countParecer().current, countParecer().total)}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco Geral Avaliado</label>
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
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Recomendação</label>
              <select 
                value={localData.recomendacao} 
                onChange={e => handleChange('recomendacao', e.target.value)}
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              >
                <option value="Selecione">Selecione</option>
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
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>

        {/* CARD 2: Análise do Edital */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <FileText size={18} className="text-brand-primary/70" />
              Análise do Edital
            </h5>
            {renderProgressBadge(countEdital().current, countEdital().total)}
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
              placeholder="Detalhamento das datas de praça, formas de parcelamento, eventuais encargos extras..."
              rows={3}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>

        {/* CARD 3: Débitos do Imóvel */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <DollarSign size={18} className="text-brand-primary/70" />
              Débitos do Imóvel
            </h5>
            {renderProgressBadge(countDebitos().current, countDebitos().total)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">IPTU em Atraso (R$)</label>
              <input
                type="number"
                value={localData.iptu_atraso}
                onChange={e => handleChange('iptu_atraso', parseFloat(e.target.value) || 0)}
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Condomínio em Atraso (R$)</label>
              <input
                type="number"
                value={localData.condominio_atraso}
                onChange={e => handleChange('condominio_atraso', parseFloat(e.target.value) || 0)}
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Outros Débitos (R$)</label>
              <input
                type="number"
                value={localData.outros_debitos}
                onChange={e => handleChange('outros_debitos', parseFloat(e.target.value) || 0)}
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações / Detalhes de Débito</label>
            <textarea
              value={localData.observacoes_debitos}
              onChange={e => handleChange('observacoes_debitos', e.target.value)}
              placeholder="Descreva as fontes de débito, certidões negativas consultadas e se os débitos se sub-rogam..."
              rows={3}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>

        {/* CARD 4: Risco de Desocupação */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <Home size={18} className="text-brand-primary/70" />
              Risco de Desocupação
            </h5>
            {renderProgressBadge(countDesocupacao().current, countDesocupacao().total)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Nível de Risco</label>
              <select 
                value={localData.nivel_risco_desocupacao} 
                onChange={e => handleChange('nivel_risco_desocupacao', e.target.value)}
                className={`p-3 border rounded-xl outline-none text-xs font-medium transition-colors ${getRiskColor(localData.nivel_risco_desocupacao)}`}
              >
                <option value="Não avaliado">Não avaliado</option>
                <option value="Baixo">Baixo</option>
                <option value="Médio">Médio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Prazo Estimado (meses)</label>
              <input
                type="text"
                value={localData.prazo_estimado_desocupacao}
                onChange={e => handleChange('prazo_estimado_desocupacao', e.target.value)}
                placeholder="Ex: 3 a 6 meses, mais de 12 meses..."
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider block">Checklist Jurídico de Posse</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'liminar_bloqueando', label: 'Liminar Bloqueando Posse' },
                { key: 'acao_anulatoria', label: 'Ação Anulatória Judicial' },
                { key: 'embargos_pendentes', label: 'Embargos Pendentes de Julgamento' },
                { key: 'recurso_pendente', label: 'Recursos ou Agravos Ativos' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3 bg-brand-bg hover:bg-black/5 rounded-xl border border-brand-border cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!(localData as any)[item.key]}
                    onChange={e => handleChange(item.key as any, e.target.checked)}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações de Desocupação</label>
            <textarea
              value={localData.observacoes_desocupacao}
              onChange={e => handleChange('observacoes_desocupacao', e.target.value)}
              placeholder="Estratégia para desocupação, perfil do ocupante atual, possíveis acordos amigáveis..."
              rows={3}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>

        {/* CARD 5: Risco de Nulidade do Leilão */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <Scale size={18} className="text-brand-primary/70" />
              Risco de Nulidade do Leilão
            </h5>
            {renderProgressBadge(countNulidade().current, countNulidade().total)}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco Geral de Nulidade</label>
            <select 
              value={localData.risco_geral_nulidade} 
              onChange={e => handleChange('risco_geral_nulidade', e.target.value)}
              className={`p-3 border rounded-xl outline-none text-xs font-medium transition-colors ${getRiskColor(localData.risco_geral_nulidade)}`}
            >
              <option value="Não avaliado">Não avaliado</option>
              <option value="Baixo">Baixo</option>
              <option value="Médio">Médio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider block">Vícios Processuais Encontrados</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'vicio_citacao', label: 'Falta ou Vício de Citação/Intimação' },
                { key: 'vicio_avaliacao', label: 'Vício ou Falta de Avaliação Justa' },
                { key: 'vicio_publicacao', label: 'Vício de Publicação dos Editais' },
                { key: 'vicio_procedimental', label: 'Outro Vício Procedimental Relevante' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3 bg-brand-bg hover:bg-black/5 rounded-xl border border-brand-border cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!(localData as any)[item.key]}
                    onChange={e => handleChange(item.key as any, e.target.checked)}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações de Nulidades</label>
            <textarea
              value={localData.observacoes_nulidade}
              onChange={e => handleChange('observacoes_nulidade', e.target.value)}
              placeholder="Analise a integridade dos atos processuais e o potencial de alegações de nulidade pelo executado..."
              rows={3}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>

        {/* CARD 6: Consolidação de Propriedade */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <Gavel size={18} className="text-brand-primary/70" />
              Consolidação de Propriedade (Extrajudicial)
            </h5>
            {renderProgressBadge(countConsolidacao().current, countConsolidacao().total)}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Status da Consolidação</label>
            <select 
              value={localData.status_consolidacao} 
              onChange={e => handleChange('status_consolidacao', e.target.value)}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
            >
              <option value="Não verificado">Não verificado</option>
              <option value="Regular">Regular</option>
              <option value="Irregular">Irregular</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider block">Requisitos da Lei 9.514/97</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'intimacao_purga_mora', label: 'Intimação Purga Mora' },
                { key: 'intimacao_leiloes', label: 'Intimação Leilões' },
                { key: 'averbacao_consolidacao', label: 'Averbação Consolidação' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 p-3 bg-brand-bg hover:bg-black/5 rounded-xl border border-brand-border cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!(localData as any)[item.key]}
                    onChange={e => handleChange(item.key as any, e.target.checked)}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações da Consolidação</label>
            <textarea
              value={localData.observacoes_consolidacao}
              onChange={e => handleChange('observacoes_consolidacao', e.target.value)}
              placeholder="Detalhamento das datas de intimação cartorária, purgação de mora e averbação na matrícula..."
              rows={3}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>

        {/* CARD 7: Análise da Matrícula */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all lg:col-span-2">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <FileText size={18} className="text-brand-primary/70" />
              Análise da Matrícula (CRI)
            </h5>
            {renderProgressBadge(countMatricula().current, countMatricula().total)}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider block">Gravações, Ônus e Averbações Ativas</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { key: 'matricula_atualizada', label: 'Matrícula Atualizada' },
                { key: 'tem_onus', label: 'Tem Ônus Ativo' },
                { key: 'tem_penhora', label: 'Tem Penhora' },
                { key: 'tem_hipoteca', label: 'Tem Hipoteca' },
                { key: 'alienacao_fiduciaria', label: 'Alienação Fiduciária' },
                { key: 'indisponibilidade', label: 'Indisponibilidade' },
                { key: 'acao_reipersecutoria', label: 'Ação Reipersecutória' }
              ].map(item => (
                <label key={item.key} className="flex flex-col items-center justify-center p-3 bg-brand-bg hover:bg-black/5 rounded-xl border border-brand-border cursor-pointer transition-colors text-center h-20">
                  <input
                    type="checkbox"
                    checked={!!(localData as any)[item.key]}
                    onChange={e => handleChange(item.key as any, e.target.checked)}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary mb-2"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-tight text-brand-ink/75 leading-tight">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações da Matrícula</label>
            <textarea
              value={localData.observacoes_matricula}
              onChange={e => handleChange('observacoes_matricula', e.target.value)}
              placeholder="Descreva as penhoras registradas, restrições judiciais, registros de alienações e se haverá cancelamento automático com a arrematação..."
              rows={3}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>

        {/* CARD 8: Situação Ocupacional */}
        <div className="bg-brand-paper p-6 rounded-3xl border border-brand-border space-y-5 shadow-sm hover:shadow-md transition-all lg:col-span-2">
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h5 className="font-serif font-medium text-lg flex items-center gap-2 text-brand-primary">
              <User size={18} className="text-brand-primary/70" />
              Situação Ocupacional / Investigação de Ocupante
            </h5>
            {renderProgressBadge(countOcupacao().current, countOcupacao().total)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Status de Ocupação</label>
              <select 
                value={localData.status_ocupacao} 
                onChange={e => handleChange('status_ocupacao', e.target.value)}
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              >
                <option value="Ocupado pelo ex-mutuário">Ocupado pelo ex-mutuário</option>
                <option value="Ocupado por terceiro">Ocupado por terceiro</option>
                <option value="Invasão">Invasão</option>
                <option value="Desocupado">Desocupado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Relação com Ex-Mutuário</label>
              <select 
                value={localData.relacao_ex_mutuario} 
                onChange={e => handleChange('relacao_ex_mutuario', e.target.value)}
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              >
                <option value="O próprio">O próprio</option>
                <option value="Parente">Parente</option>
                <option value="Inquilino">Inquilino</option>
                <option value="Desconhecido">Desconhecido</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Risco de Usucapião</label>
              <select 
                value={localData.risco_usucapiao} 
                onChange={e => handleChange('risco_usucapiao', e.target.value)}
                className={`p-3 border rounded-xl outline-none text-xs font-medium transition-colors ${getRiskColor(localData.risco_usucapiao)}`}
              >
                <option value="Não avaliado">Não avaliado</option>
                <option value="Baixo">Baixo</option>
                <option value="Médio">Médio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Tempo Estimado de Ocupação</label>
              <input
                type="text"
                value={localData.tempo_ocupacao}
                onChange={e => handleChange('tempo_ocupacao', e.target.value)}
                placeholder="Ex: 2 anos, recente..."
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
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
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">CPF do Ocupante</label>
              <input
                type="text"
                value={localData.cpf_ocupante}
                onChange={e => handleChange('cpf_ocupante', e.target.value)}
                placeholder="000.000.000-00"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Telefone do Ocupante</label>
              <input
                type="text"
                value={localData.telefone_ocupante}
                onChange={e => handleChange('telefone_ocupante', e.target.value)}
                placeholder="(00) 00000-0000"
                className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Observações Ocupacionais</label>
            <textarea
              value={localData.observacoes_ocupacao}
              onChange={e => handleChange('observacoes_ocupacao', e.target.value)}
              placeholder="Descreva detalhes coletados sobre o ocupante, tentativas de contato prévio e se há resistência ativa..."
              rows={3}
              className="p-3 border border-brand-border bg-brand-bg rounded-xl outline-none text-xs font-medium resize-none"
            />
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
