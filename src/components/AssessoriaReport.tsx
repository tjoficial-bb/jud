import React from 'react';
import { 
  Shield, Cpu, Loader2, Save, FileText, CheckSquare, 
  HelpCircle, AlertTriangle, AlertCircle, RefreshCw, Sparkles,
  TrendingUp, Scale, Gavel, User, Home, DollarSign, Calendar, Plus, Trash2, Download
} from 'lucide-react';
import { DocumentManager } from './DocumentManager';
import { AnalysisPremisesCard } from './AnalysisPremisesCard';
import { exportElementToPDF } from '../utils/pdfExporter';
import { renderTextWithLeafBadges } from './SmartAnalysisTab';

export interface AssessoriaAnalysisData {
  // Montante de débitos
  responsabilidade_debitos: 'Arrematante' | 'Comitente vendedor/sub-rogação de preço' | '';
  direito_eviccao: 'Sim' | 'Não' | '';
  ressalvas_eviccao: string;
  divida_condominio: 'Sim' | 'Não' | '';
  divida_iptu: 'Sim' | 'Não' | '';
  comentarios_debitos: string;

  // Análise da matrícula
  itens_matricula: Array<{ item: string; descricao: string }>;
  comentarios_matricula: string;
  data_matricula: string;

  // Análise do edital
  tamanho_cidade: '20 a 50 mil hab.' | '50 a 300 mil hab.' | '+300 mil hab.' | '';
  entorno_imovel: 'Estagnado' | 'Em crescimento' | 'Consolidado' | '';
  bairro: 'Razoável' | 'Bom' | 'Desejado' | '';
  e_casa: 'Sim' | 'Não' | '';
  e_condominio: 'Sim' | 'Não' | '';
  lance_maximo_sugerido: string;

  // Análise da viabilidade jurídica
  ocupacao: 'Ocupado' | 'Desocupado' | '';
  intimacao_registro: 'Sim' | 'Não' | '';
  forma_intimacao: 'Pessoal' | 'Por edital' | 'Condomínio' | 'Não se sabe' | '';
  notificacao_datas: 'Sim' | 'Não' | 'Não se sabe' | '';
  observacoes_purga_mora: string;
  leiloes_negativos_averbados: 'Sim' | 'Não' | '';
  observacoes_leiloes_negativos: string;
  comentarios_viabilidade: string;

  // Ações judiciais relevantes
  acoes_judiciais: string[];
  risco_juridico: 'Nulo' | 'Baixo' | 'Médio' | 'Alto' | '';
  comentarios_adicionais: string;

  // CONCLUSÃO
  comentarios_recomendacoes_finais: string;
}

export const getEmptyAssessoriaAnalysis = (): AssessoriaAnalysisData => ({
  responsabilidade_debitos: '',
  direito_eviccao: '',
  ressalvas_eviccao: '',
  divida_condominio: '',
  divida_iptu: '',
  comentarios_debitos: '',
  itens_matricula: [
    { item: 'R.01', descricao: 'Consolidação da propriedade fiduciária em favor do Credor' }
  ],
  comentarios_matricula: '',
  data_matricula: '',
  tamanho_cidade: '',
  entorno_imovel: '',
  bairro: '',
  e_casa: '',
  e_condominio: '',
  lance_maximo_sugerido: '',
  ocupacao: '',
  intimacao_registro: '',
  forma_intimacao: '',
  notificacao_datas: '',
  observacoes_purga_mora: '',
  leiloes_negativos_averbados: '',
  observacoes_leiloes_negativos: '',
  comentarios_viabilidade: '',
  acoes_judiciais: [],
  risco_juridico: '',
  comentarios_adicionais: '',
  comentarios_recomendacoes_finais: ''
});

interface AssessoriaReportProps {
  data: AssessoriaAnalysisData | null;
  onSave: (updatedData: AssessoriaAnalysisData) => Promise<void>;
  isAnalyzing: boolean;
  onTriggerAI: () => Promise<void>;
  onExtractSection?: (sectionKey: string) => Promise<void>;
  isPublicView?: boolean;
  docs?: any[];
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  onDelete?: (id: string) => void;
  onTranscribe?: (id: string) => void;
  uploading?: boolean;
  customSaleValue?: number | '';
  customBidValue?: number | '';
  customAnalysisNotes?: string;
  onUpdatePremises?: (fields: {
    customSaleValue?: number | '';
    customBidValue?: number | '';
    customAnalysisNotes?: string;
  }) => void;
  selectedProperty?: any;
}

export default function AssessoriaReport({
  data,
  onSave,
  isAnalyzing,
  onTriggerAI,
  onExtractSection,
  isPublicView = false,
  docs = [],
  onUpload,
  onDelete,
  onTranscribe,
  uploading = false,
  customSaleValue,
  customBidValue,
  customAnalysisNotes,
  onUpdatePremises,
  selectedProperty
}: AssessoriaReportProps) {
  const [localData, setLocalData] = React.useState<AssessoriaAnalysisData>(data || getEmptyAssessoriaAnalysis());
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [extractingSection, setExtractingSection] = React.useState<string | null>(null);

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
      setLocalData(data);
    }
  }, [data]);

  const handleChange = (key: keyof AssessoriaAnalysisData, value: any) => {
    setLocalData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleItemMatriculaChange = (index: number, key: 'item' | 'descricao', value: string) => {
    const updatedItens = [...localData.itens_matricula];
    updatedItens[index] = { ...updatedItens[index], [key]: value };
    handleChange('itens_matricula', updatedItens);
  };

  const handleAddItemMatricula = () => {
    const updatedItens = [...localData.itens_matricula, { item: '', descricao: '' }];
    handleChange('itens_matricula', updatedItens);
  };

  const handleRemoveItemMatricula = (index: number) => {
    const updatedItens = localData.itens_matricula.filter((_, i) => i !== index);
    handleChange('itens_matricula', updatedItens);
  };

  const handleToggleAcaoJudicial = (acao: string) => {
    const currentAcoes = localData.acoes_judiciais || [];
    const updatedAcoes = currentAcoes.includes(acao)
      ? currentAcoes.filter(a => a !== acao)
      : [...currentAcoes, acao];
    handleChange('acoes_judiciais', updatedAcoes);
  };

  const handleAddCustomAcao = () => {
    const acao = prompt('Digite o nome da outra ação judicial relevante:');
    if (acao && acao.trim()) {
      const currentAcoes = localData.acoes_judiciais || [];
      if (!currentAcoes.includes(acao.trim())) {
        handleChange('acoes_judiciais', [...currentAcoes, acao.trim()]);
      }
    }
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await onSave(localData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar os dados da assessoria.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLightMode = document.body.classList.contains('light-mode') || !document.body.classList.contains('dark');

  // Static list of checkboxes shown in Screenshot 5
  const defaultAcoes = [
    'Cobrança de débitos tributários',
    'Cobrança de dívidas condominiais',
    'Ação anulatória',
    'Execução fiscal'
  ];

  return (
    <div className="space-y-8 animate-fade-in text-brand-ink" id="assessoria-tab-container">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-primary/10 pb-6 no-print">
        <div>
          <h2 className="text-2xl font-serif font-bold text-brand-primary flex items-center gap-2">
            <Scale className="text-brand-primary" size={24} />
            Análise de Assessoria Jurídica
          </h2>
          <p className="text-xs text-brand-ink/40 mt-1">
            Parecer estratégico e checklist detalhado para guiar a operação de arrematação com segurança técnica.
          </p>
        </div>
        
        {!isPublicView && (
          <div className="flex items-center gap-3">
            <button
              onClick={onTriggerAI}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary rounded-xl font-medium text-xs hover:bg-brand-primary/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Cpu size={14} />
              )}
              {isAnalyzing ? 'Extraindo...' : 'Auto-preencher via IA'}
            </button>

            <button
              onClick={() => exportElementToPDF("assessoria-tab-container", "Relatorio_Assessoria_Juridica.pdf", "Análise de Assessoria Jurídica - TJ INVEST")}
              className="px-4 py-2 bg-brand-bg hover:bg-black/5 dark:hover:bg-white/10 border border-brand-border text-brand-ink rounded-xl font-bold text-xs transition flex items-center gap-2"
              title="Exportar esta análise em PDF formatado"
            >
              <Download size={14} className="text-brand-primary" />
              Exportar PDF
            </button>

            {isEditing ? (
              <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className="px-4 py-2 bg-brand-primary text-black rounded-xl font-bold text-xs hover:bg-brand-primary/90 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Salvar Alterações
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-brand-secondary/80 border border-brand-border text-brand-ink rounded-xl font-medium text-xs hover:bg-brand-secondary transition"
              >
                Editar Manualmente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Premissas e Dados Complementares para a Análise de Assessoria */}
      {!isPublicView && onUpdatePremises && (
        <AnalysisPremisesCard
          customSaleValue={customSaleValue}
          customBidValue={customBidValue}
          customAnalysisNotes={customAnalysisNotes}
          onUpdate={onUpdatePremises}
          selectedProperty={selectedProperty}
          compact={false}
        />
      )}

      {/* Upload de Documentos Integrado */}
      {!isPublicView && onUpload && onDelete && (
        <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-border shadow-sm space-y-6 animate-in fade-in duration-300" id="assessoria-analysis-documents-upload">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-primary/10 pb-4">
            <div>
              <h5 className="text-md font-bold text-brand-primary flex items-center gap-2 uppercase tracking-wider">
                <FileText size={18} className="text-brand-primary" />
                Documentos do Leilão para Assessoria
              </h5>
              <p className="text-xs text-brand-ink/50 mt-1">
                Envie os arquivos do leilão diretamente nesta aba para preencher a análise jurídica e de assessoria via Inteligência Artificial.
              </p>
            </div>
            {docs && docs.length > 0 && (
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
      )}

      {/* Main Content Sections */}
      <div className="space-y-8">
        
        {/* SECTION 1: Montante de débitos */}
        <div id="sec-montante-debitos" className="border border-brand-primary/10 rounded-2xl overflow-hidden bg-brand-paper shadow-sm">
          <div className="bg-orange-50/70 dark:bg-orange-950/20 px-6 py-4 border-b border-brand-primary/10 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-orange-600 dark:text-orange-400 font-serif tracking-wide uppercase">
              Montante de débitos
            </h3>
            {renderSectionAIButton('debitos')}
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Responsabilidade sobre débitos */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Responsabilidade sobre débitos
                </label>
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="responsabilidade_debitos"
                        value="Arrematante"
                        checked={localData.responsabilidade_debitos === 'Arrematante'}
                        onChange={(e) => handleChange('responsabilidade_debitos', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Arrematante
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="responsabilidade_debitos"
                        value="Comitente vendedor/sub-rogação de preço"
                        checked={localData.responsabilidade_debitos === 'Comitente vendedor/sub-rogação de preço'}
                        onChange={(e) => handleChange('responsabilidade_debitos', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Comitente vendedor/sub-rogação de preço
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.responsabilidade_debitos || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>

              {/* Há previsão de direito de evicção? */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Há previsão de direito de evicção?
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="direito_eviccao"
                        value="Sim"
                        checked={localData.direito_eviccao === 'Sim'}
                        onChange={(e) => handleChange('direito_eviccao', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="direito_eviccao"
                        value="Não"
                        checked={localData.direito_eviccao === 'Não'}
                        onChange={(e) => handleChange('direito_eviccao', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Não
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.direito_eviccao || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Ressalvas / exceções regulamentares de evicção */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Ressalvas / exceções regulamentares de evicção
              </label>
              {isEditing ? (
                <textarea
                  value={localData.ressalvas_eviccao || ''}
                  onChange={(e) => handleChange('ressalvas_eviccao', e.target.value)}
                  placeholder="Ressalvas / exceções regulamentares de evicção descritas no edital..."
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[80px]"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
                  {localData.ressalvas_eviccao ? renderTextWithLeafBadges(localData.ressalvas_eviccao) : <span className="text-brand-ink/30 italic">Nenhuma ressalva de evicção descrita.</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-primary/5">
              {/* Dívida de Condomínio */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Dívida de Condomínio
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="divida_condominio"
                        value="Sim"
                        checked={localData.divida_condominio === 'Sim'}
                        onChange={(e) => handleChange('divida_condominio', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="divida_condominio"
                        value="Não"
                        checked={localData.divida_condominio === 'Não'}
                        onChange={(e) => handleChange('divida_condominio', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Não
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1 flex items-center gap-2">
                    {localData.divida_condominio === 'Sim' ? (
                      <span className="text-red-500 font-bold">● Sim</span>
                    ) : localData.divida_condominio === 'Não' ? (
                      <span className="text-green-500 font-bold">● Não</span>
                    ) : (
                      <span className="text-brand-ink/30 italic">Não informado</span>
                    )}
                  </div>
                )}
              </div>

              {/* Dívida de IPTU */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Dívida de IPTU
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="divida_iptu"
                        value="Sim"
                        checked={localData.divida_iptu === 'Sim'}
                        onChange={(e) => handleChange('divida_iptu', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="divida_iptu"
                        value="Não"
                        checked={localData.divida_iptu === 'Não'}
                        onChange={(e) => handleChange('divida_iptu', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Não
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1 flex items-center gap-2">
                    {localData.divida_iptu === 'Sim' ? (
                      <span className="text-red-500 font-bold">● Sim</span>
                    ) : localData.divida_iptu === 'Não' ? (
                      <span className="text-green-500 font-bold">● Não</span>
                    ) : (
                      <span className="text-brand-ink/30 italic">Não informado</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comentários gerais sobre montante */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Comentários gerais sobre montante
              </label>
              {isEditing ? (
                <textarea
                  value={localData.comentarios_debitos || ''}
                  onChange={(e) => handleChange('comentarios_debitos', e.target.value)}
                  placeholder="Adicione observações importantes sobre os valores devidos..."
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[100px]"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
                  {localData.comentarios_debitos ? renderTextWithLeafBadges(localData.comentarios_debitos) : <span className="text-brand-ink/30 italic">Adicione um comentário...</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: Análise da matrícula */}
        <div id="sec-analise-matricula" className="border border-brand-primary/10 rounded-2xl overflow-hidden bg-brand-paper shadow-sm">
          <div className="bg-orange-50/70 dark:bg-orange-950/20 px-6 py-4 border-b border-brand-primary/10 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-orange-600 dark:text-orange-400 font-serif tracking-wide uppercase">
              Análise da matrícula
            </h3>
            {renderSectionAIButton('matricula')}
          </div>
          <div className="p-6 space-y-6">
            
            {/* Itens da Matrícula */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Averbações, ônus e registros analisados
              </label>
              
              <div className="space-y-3">
                {(localData.itens_matricula || []).map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-24">
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => handleItemMatriculaChange(idx, 'item', e.target.value)}
                          placeholder="Ex: R.05"
                          className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-center font-bold"
                        />
                      ) : (
                        <div className="bg-brand-bg/50 border border-brand-primary/10 rounded-xl px-3 py-2 text-xs font-bold text-center">
                          {item.item || '-'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.descricao}
                          onChange={(e) => handleItemMatriculaChange(idx, 'descricao', e.target.value)}
                          placeholder="Descrição do registro na matrícula..."
                          className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <div className="bg-brand-bg/20 border border-brand-primary/5 rounded-xl px-4 py-2 text-xs whitespace-pre-wrap">
                          {item.descricao || '-'}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveItemMatricula(idx)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition"
                        title="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <button
                    onClick={handleAddItemMatricula}
                    className="mt-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold rounded-xl hover:bg-brand-primary/20 transition flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Novo item
                  </button>
                )}
              </div>
            </div>

            {/* Comentários Matrícula */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Comentários sobre ônus e matrícula
              </label>
              {isEditing ? (
                <textarea
                  value={localData.comentarios_matricula || ''}
                  onChange={(e) => handleChange('comentarios_matricula', e.target.value)}
                  placeholder="Adicione observações importantes sobre os atos descritos na matrícula..."
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[100px]"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
                  {localData.comentarios_matricula ? renderTextWithLeafBadges(localData.comentarios_matricula) : <span className="text-brand-ink/30 italic">Adicione um comentário...</span>}
                </div>
              )}
            </div>

            {/* Data da matrícula */}
            <div className="max-w-xs space-y-2 pt-2">
              <label className="block text-xs font-semibold text-brand-ink/60 flex items-center gap-1">
                <Calendar size={14} />
                Data da matrícula
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={localData.data_matricula || ''}
                  onChange={(e) => handleChange('data_matricula', e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-brand-ink"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl px-3 py-2 font-semibold">
                  {localData.data_matricula ? (
                    new Date(localData.data_matricula + 'T00:00:00').toLocaleDateString('pt-BR')
                  ) : (
                    <span className="text-brand-ink/30 italic">Não informada</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Análise do edital */}
        <div id="sec-analise-edital" className="border border-brand-primary/10 rounded-2xl overflow-hidden bg-brand-paper shadow-sm">
          <div className="bg-orange-50/70 dark:bg-orange-950/20 px-6 py-4 border-b border-brand-primary/10 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-orange-600 dark:text-orange-400 font-serif tracking-wide uppercase">
              Análise do edital
            </h3>
            {renderSectionAIButton('edital')}
          </div>
          <div className="p-6 space-y-6">
            
            {/* Localização */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest border-b border-brand-primary/10 pb-2">
                Localização
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Tamanho da cidade */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-ink/60">
                    Tamanho da cidade
                  </label>
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-1">
                      {['20 a 50 mil hab.', '50 a 300 mil hab.', '+300 mil hab.'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                          <input
                            type="radio"
                            name="tamanho_cidade"
                            value={opt}
                            checked={localData.tamanho_cidade === opt}
                            onChange={(e) => handleChange('tamanho_cidade', e.target.value)}
                            className="accent-brand-primary h-4 w-4"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold mt-1 py-1">
                      {localData.tamanho_cidade || <span className="text-brand-ink/30 italic">Não informado</span>}
                    </div>
                  )}
                </div>

                {/* Entorno do imóvel */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-ink/60">
                    Entorno do imóvel
                  </label>
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-1">
                      {['Estagnado', 'Em crescimento', 'Consolidado'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                          <input
                            type="radio"
                            name="entorno_imovel"
                            value={opt}
                            checked={localData.entorno_imovel === opt}
                            onChange={(e) => handleChange('entorno_imovel', e.target.value)}
                            className="accent-brand-primary h-4 w-4"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold mt-1 py-1">
                      {localData.entorno_imovel || <span className="text-brand-ink/30 italic">Não informado</span>}
                    </div>
                  )}
                </div>

                {/* Bairro */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-ink/60">
                    Bairro
                  </label>
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-1">
                      {['Razoável', 'Bom', 'Desejado'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                          <input
                            type="radio"
                            name="bairro"
                            value={opt}
                            checked={localData.bairro === opt}
                            onChange={(e) => handleChange('bairro', e.target.value)}
                            className="accent-brand-primary h-4 w-4"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold mt-1 py-1">
                      {localData.bairro || <span className="text-brand-ink/30 italic">Não informado</span>}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Tipologia & Condomínio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-primary/5">
              
              {/* Se casa */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest border-b border-brand-primary/10 pb-2 mb-2">
                  Se casa
                </h4>
                <label className="block text-xs font-semibold text-brand-ink/60">
                  É Casa?
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="e_casa"
                        value="Sim"
                        checked={localData.e_casa === 'Sim'}
                        onChange={(e) => handleChange('e_casa', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="e_casa"
                        value="Não"
                        checked={localData.e_casa === 'Não'}
                        onChange={(e) => handleChange('e_casa', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Não
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.e_casa || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>

              {/* Se condomínio */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest border-b border-brand-primary/10 pb-2 mb-2">
                  Se condomínio (de casas ou aptos)
                </h4>
                <label className="block text-xs font-semibold text-brand-ink/60">
                  É Condomínio?
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="e_condominio"
                        value="Sim"
                        checked={localData.e_condominio === 'Sim'}
                        onChange={(e) => handleChange('e_condominio', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="e_condominio"
                        value="Não"
                        checked={localData.e_condominio === 'Não'}
                        onChange={(e) => handleChange('e_condominio', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Não
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.e_condominio || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>

            </div>

            {/* Lance máximo sugerido */}
            <div className="space-y-2 pt-4 border-t border-brand-primary/5">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest border-b border-brand-primary/10 pb-2 mb-2">
                Lance máximo sugerido
              </h4>
              {isEditing ? (
                <div className="max-w-md flex items-center bg-brand-bg/50 border border-brand-primary/20 rounded-xl px-3 py-1">
                  <span className="text-brand-ink/40 text-xs font-bold mr-2">R$</span>
                  <input
                    type="text"
                    value={localData.lance_maximo_sugerido || ''}
                    onChange={(e) => handleChange('lance_maximo_sugerido', e.target.value)}
                    placeholder="Ex: 266.000,00"
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-semibold text-brand-ink py-2"
                  />
                </div>
              ) : (
                <div className="text-lg font-serif font-bold text-brand-primary py-1">
                  {localData.lance_maximo_sugerido ? (
                    localData.lance_maximo_sugerido.startsWith('R$') ? localData.lance_maximo_sugerido : `R$ ${localData.lance_maximo_sugerido}`
                  ) : (
                    <span className="text-brand-ink/30 font-sans font-normal text-xs italic">Não calculado</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: Análise da viabilidade jurídica */}
        <div id="sec-viabilidade-juridica" className="border border-brand-primary/10 rounded-2xl overflow-hidden bg-brand-paper shadow-sm">
          <div className="bg-orange-50/70 dark:bg-orange-950/20 px-6 py-4 border-b border-brand-primary/10 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-orange-600 dark:text-orange-400 font-serif tracking-wide uppercase">
              Análise da viabilidade jurídica
            </h3>
            {renderSectionAIButton('viabilidade')}
          </div>
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Estado de Ocupação */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Quanto ao estado de ocupação, o imóvel encontra-se:
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="ocupacao"
                        value="Ocupado"
                        checked={localData.ocupacao === 'Ocupado'}
                        onChange={(e) => handleChange('ocupacao', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Ocupado
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="ocupacao"
                        value="Desocupado"
                        checked={localData.ocupacao === 'Desocupado'}
                        onChange={(e) => handleChange('ocupacao', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Desocupado
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.ocupacao || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>

              {/* Consta gravada na matrícula a intimação para a purga da mora? */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Consta gravada na matrícula a intimação para a purga da mora?
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="intimacao_registro"
                        value="Sim"
                        checked={localData.intimacao_registro === 'Sim'}
                        onChange={(e) => handleChange('intimacao_registro', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="intimacao_registro"
                        value="Não"
                        checked={localData.intimacao_registro === 'Não'}
                        onChange={(e) => handleChange('intimacao_registro', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Não
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.intimacao_registro || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-primary/5">
              {/* Como foi feita a intimação para purga da mora? */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Como foi feita a intimação para purga da mora?
                </label>
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {['Pessoal', 'Por edital', 'Condomínio', 'Não se sabe'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                        <input
                          type="radio"
                          name="forma_intimacao"
                          value={opt}
                          checked={localData.forma_intimacao === opt}
                          onChange={(e) => handleChange('forma_intimacao', e.target.value)}
                          className="accent-brand-primary h-4 w-4"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.forma_intimacao || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>

              {/* Houve notificação das datas dos leilões? */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Houve notificação das datas dos leilões?
                </label>
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1">
                    {['Sim', 'Não', 'Não se sabe'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                        <input
                          type="radio"
                          name="notificacao_datas"
                          value={opt}
                          checked={localData.notificacao_datas === opt}
                          onChange={(e) => handleChange('notificacao_datas', e.target.value)}
                          className="accent-brand-primary h-4 w-4"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.notificacao_datas || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Observações sobre purga da mora */}
            <div className="space-y-2 pt-2 border-t border-brand-primary/5">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Observações sobre purga da mora
              </label>
              {isEditing ? (
                <textarea
                  value={localData.observacoes_purga_mora || ''}
                  onChange={(e) => handleChange('observacoes_purga_mora', e.target.value)}
                  placeholder="Relatório de regularidade sobre a consolidação e intimações..."
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[80px]"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
                  {localData.observacoes_purga_mora ? renderTextWithLeafBadges(localData.observacoes_purga_mora) : <span className="text-brand-ink/30 italic">Nenhuma observação informada.</span>}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-brand-primary/5 space-y-4">
              {/* Leilões negativos averbados na matrícula? */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Leilões negativos averbados na matrícula?
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="leiloes_negativos_averbados"
                        value="Sim"
                        checked={localData.leiloes_negativos_averbados === 'Sim'}
                        onChange={(e) => handleChange('leiloes_negativos_averbados', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="leiloes_negativos_averbados"
                        value="Não"
                        checked={localData.leiloes_negativos_averbados === 'Não'}
                        onChange={(e) => handleChange('leiloes_negativos_averbados', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      Não
                    </label>
                  </div>
                ) : (
                  <div className="text-sm font-semibold mt-1 py-1">
                    {localData.leiloes_negativos_averbados || <span className="text-brand-ink/30 italic">Não informado</span>}
                  </div>
                )}
              </div>

              {/* Observações sobre leilões negativos */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-ink/60">
                  Observações sobre leilões negativos
                </label>
                {isEditing ? (
                  <textarea
                    value={localData.observacoes_leiloes_negativos || ''}
                    onChange={(e) => handleChange('observacoes_leiloes_negativos', e.target.value)}
                    placeholder="Adicione observações sobre a ocorrência de 1º e 2º leilões negativos se aplicável..."
                    className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[80px]"
                  />
                ) : (
                  <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
                    {localData.observacoes_leiloes_negativos ? renderTextWithLeafBadges(localData.observacoes_leiloes_negativos) : <span className="text-brand-ink/30 italic">Nenhuma observação informada.</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Comentários gerais viabilidade */}
            <div className="space-y-2 pt-4 border-t border-brand-primary/5">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Comentários gerais sobre viabilidade jurídica
              </label>
              {isEditing ? (
                <textarea
                  value={localData.comentarios_viabilidade || ''}
                  onChange={(e) => handleChange('comentarios_viabilidade', e.target.value)}
                  placeholder="Seu parecer e comentários adicionais sobre a viabilidade..."
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[100px]"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
                  {localData.comentarios_viabilidade ? renderTextWithLeafBadges(localData.comentarios_viabilidade) : <span className="text-brand-ink/30 italic">Adicione um comentário...</span>}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 5: Ações judiciais relevantes */}
        <div id="sec-acoes-judiciais" className="border border-brand-primary/10 rounded-2xl overflow-hidden bg-brand-paper shadow-sm">
          <div className="bg-orange-50/70 dark:bg-orange-950/20 px-6 py-4 border-b border-brand-primary/10 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-orange-600 dark:text-orange-400 font-serif tracking-wide uppercase">
              Ações judiciais relevantes
            </h3>
            {renderSectionAIButton('acoes')}
          </div>
          <div className="p-6 space-y-6">
            
            {/* Checkboxes das Ações */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Selecione as ações judiciais identificadas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {defaultAcoes.map((acao) => {
                  const isChecked = (localData.acoes_judiciais || []).includes(acao);
                  return (
                    <div key={acao} className="flex items-center">
                      {isEditing ? (
                        <label className="flex items-center gap-3 text-xs text-brand-ink cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAcaoJudicial(acao)}
                            className="accent-brand-primary rounded h-4 w-4"
                          />
                          {acao}
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 text-xs py-1">
                          <span className={isChecked ? "text-brand-primary font-bold" : "text-brand-ink/20 line-through"}>
                            {isChecked ? "☑" : "☐"}
                          </span>
                          <span className={isChecked ? "font-semibold" : "text-brand-ink/30"}>
                            {acao}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Additional / Custom actions in current list */}
                {(localData.acoes_judiciais || [])
                  .filter(acao => !defaultAcoes.includes(acao))
                  .map((acao) => (
                    <div key={acao} className="flex items-center justify-between gap-2 bg-brand-bg/30 px-3 py-1 rounded-xl">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-brand-primary font-bold">☑</span>
                        <span className="font-semibold">{acao}</span>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleToggleAcaoJudicial(acao)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
              </div>

              {isEditing && (
                <button
                  onClick={handleAddCustomAcao}
                  className="mt-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold rounded-xl hover:bg-brand-primary/20 transition flex items-center gap-2"
                >
                  <Plus size={14} />
                  Outra ação
                </button>
              )}
            </div>

            {/* Riscos jurídicos */}
            <div className="space-y-3 pt-4 border-t border-brand-primary/5">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest border-b border-brand-primary/10 pb-2 mb-2">
                Riscos jurídicos
              </h4>
              {isEditing ? (
                <div className="flex items-center gap-6 mt-1">
                  {['Nulo', 'Baixo', 'Médio', 'Alto'].map((r) => (
                    <label key={r} className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                      <input
                        type="radio"
                        name="risco_juridico"
                        value={r}
                        checked={localData.risco_juridico === r}
                        onChange={(e) => handleChange('risco_juridico', e.target.value)}
                        className="accent-brand-primary h-4 w-4"
                      />
                      {r}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-bold mt-1 py-1 flex items-center gap-2">
                  {localData.risco_juridico === 'Nulo' ? (
                    <span className="text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-xs">Nulo</span>
                  ) : localData.risco_juridico === 'Baixo' ? (
                    <span className="text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full text-xs">Baixo</span>
                  ) : localData.risco_juridico === 'Médio' ? (
                    <span className="text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-xs">Médio</span>
                  ) : localData.risco_juridico === 'Alto' ? (
                    <span className="text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-xs">Alto</span>
                  ) : (
                    <span className="text-brand-ink/30 font-normal italic text-xs">Não avaliado</span>
                  )}
                </div>
              )}
            </div>

            {/* Comentários adicionais */}
            <div className="space-y-2 pt-2 border-t border-brand-primary/5">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Comentários adicionais
              </label>
              {isEditing ? (
                <textarea
                  value={localData.comentarios_adicionais || ''}
                  onChange={(e) => handleChange('comentarios_adicionais', e.target.value)}
                  placeholder="Insira detalhes sobre as discussões judiciais identificadas e seus andamentos..."
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[100px]"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
                  {localData.comentarios_adicionais ? renderTextWithLeafBadges(localData.comentarios_adicionais) : <span className="text-brand-ink/30 italic">Adicione um comentário...</span>}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 6: CONCLUSÃO */}
        <div id="sec-conclusao" className="border border-brand-primary/10 rounded-2xl overflow-hidden bg-brand-paper shadow-sm">
          <div className="bg-orange-50/70 dark:bg-orange-950/20 px-6 py-4 border-b border-brand-primary/10 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-orange-600 dark:text-orange-400 font-serif tracking-wide uppercase">
              CONCLUSÃO
            </h3>
            {renderSectionAIButton('conclusao')}
          </div>
          <div className="p-6 space-y-4">
            
            {/* Comentários e recomendações finais */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-brand-ink/60">
                Comentários e recomendações finais da assessoria
              </label>
              {isEditing ? (
                <textarea
                  value={localData.comentarios_recomendacoes_finais || ''}
                  onChange={(e) => handleChange('comentarios_recomendacoes_finais', e.target.value)}
                  placeholder="Consolide seu parecer de assessoria e descreva as recomendações para lances e mitigação de riscos..."
                  className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary min-h-[120px]"
                />
              ) : (
                <div className="text-xs bg-brand-bg/30 border border-brand-primary/5 rounded-xl p-3 min-h-[80px] whitespace-pre-wrap">
                  {localData.comentarios_recomendacoes_finais ? renderTextWithLeafBadges(localData.comentarios_recomendacoes_finais) : <span className="text-brand-ink/30 italic">Adicione recomendações finais...</span>}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
