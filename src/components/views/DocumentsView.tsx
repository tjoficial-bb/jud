import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Files, Search, Trash2, Calendar, HardDrive, CheckCircle2, 
  ExternalLink, FileText, Upload, Filter, AlertCircle, Loader2, Plus,
  Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Property } from '../../types';
import { uploadDocuments } from '../../services/documentService';

interface Document {
  id: string;
  filename: string;
  doc_type: string;
  property_id: string | null;
  created_at: string;
  property_title: string | null;
  ia_summary?: string;
}

interface DocumentsViewProps {
  token: string;
  properties: Property[];
  onSelectProperty: (id: string) => void;
}

export function DocumentsView({ token, properties, onSelectProperty }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  // Form states for quick upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState('Edital');
  const [uploadPropertyId, setUploadPropertyId] = useState('');

  // Sate for custom document deletion confirmation modal
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // States for bulk deletion / clear repository
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});

  const toggleSummary = (docId: string) => {
    setExpandedSummaries(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/all-documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Não foi possível carregar o repositório de documentos.');
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const confirmDelete = async () => {
    if (!documentToDelete || isDeleting) return;
    const { id } = documentToDelete;
    try {
      setIsDeleting(true);
      setError(null);
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir documento.');
      
      setDocumentToDelete(null);
      setSuccessMsg('Documento excluído com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Falha ao deletar o documento.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearAll = async () => {
    if (isClearingAll) return;
    try {
      setIsClearingAll(true);
      setError(null);
      const res = await fetch('/api/documents-clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao limpar repositório.');
      
      setShowClearAllModal(false);
      setSuccessMsg('Repositório limpo com sucesso! Todos os arquivos foram apagados.');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Falha ao limpar documentos.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleQuickUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      setError('Por favor, selecione pelo menos um arquivo.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgressText('Preparando arquivos...');

      const propertyId = uploadPropertyId || '';
      
      await uploadDocuments(uploadFiles, uploadType, propertyId, token, (status) => {
        setUploadProgressText(status);
      });

      setSuccessMsg('Documentos cadastrados e indexados com sucesso!');
      setUploadFiles([]);
      setShowUploadModal(false);
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
      setUploadProgressText(null);
    }
  };

  // Filter logic
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(search.toLowerCase()) || 
      (doc.property_title && doc.property_title.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      doc.doc_type?.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === 'matricula' && doc.doc_type?.toLowerCase() === 'matrícula');
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Todos os Arquivos' },
    { id: 'edital', label: 'Editais' },
    { id: 'matricula', label: 'Matrículas' },
    { id: 'processo judicial', label: 'Petições/Processos' },
    { id: 'outros', label: 'Outros' },
  ];

  return (
    <div className="space-y-12 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-primary flex items-center gap-4">
            Gestão Eletrônica de Documentos (GED)
          </h2>
          <p className="text-brand-ink/40 font-medium text-lg leading-relaxed max-w-2xl mt-2">
            Central de inteligência documental. Todos os editais, matrículas e petições processuais integrados e indexados para respostas de IA imediatas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {documents.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-500 font-bold border border-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Apagar todos os arquivos do repositório"
            >
              <Trash2 size={18} />
              <span>Limpar Repositório</span>
            </button>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-brand-primary text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
          >
            <Plus size={20} />
            <span>Vincular Documento</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-3 text-sm font-medium"
        >
          <CheckCircle2 size={18} className="text-emerald-400" />
          {successMsg}
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 text-sm font-medium"
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}

      {/* Stats of active document storage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6 bg-brand-paper border-brand-primary/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/30 mb-1">Total de Peças</p>
          <p className="text-4xl font-serif font-bold text-brand-primary">{documents.length}</p>
        </div>
        <div className="premium-card p-6 bg-brand-paper border-brand-primary/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/30 mb-1">Editais de Leilão</p>
          <p className="text-3xl font-serif font-bold text-brand-primary">
            {documents.filter(d => d.doc_type?.toLowerCase() === 'edital').length}
          </p>
        </div>
        <div className="premium-card p-6 bg-brand-paper border-brand-primary/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/30 mb-1">Matrículas de Imóveis</p>
          <p className="text-3xl font-serif font-bold text-brand-primary">
            {documents.filter(d => d.doc_type?.toLowerCase() === 'matrícula').length}
          </p>
        </div>
        <div className="premium-card p-6 bg-brand-paper border-brand-primary/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/30 mb-1">Processos Relacionados</p>
          <p className="text-3xl font-serif font-bold text-brand-primary">
            {documents.filter(d => d.doc_type?.toLowerCase() === 'processo judicial').length}
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 bg-brand-paper/50 p-6 rounded-[28px] border border-brand-primary/5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                selectedCategory === cat.id 
                  ? "bg-brand-primary text-black" 
                  : "bg-brand-bg hover:bg-brand-bg/80 text-brand-ink/60 hover:text-brand-primary"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
          <input
            type="text"
            placeholder="Buscar por termo ou imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full lg:w-80 pl-11 pr-5 py-3 rounded-xl bg-brand-bg text-brand-ink/80 placeholder-brand-ink/30 text-xs border border-brand-primary/5 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Documents Grid / Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 size={36} className="animate-spin text-brand-primary" />
          <p className="text-sm text-brand-ink/40 font-bold uppercase tracking-widest">Carregando Repositório...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-brand-paper rounded-[40px] border border-dashed border-brand-primary/10">
          <Files size={64} className="text-brand-ink/20 mb-6" />
          <h3 className="text-xl font-serif text-brand-primary mb-2">Sem Documentos Disponíveis</h3>
          <p className="text-sm text-brand-ink/40 font-medium max-w-sm">
            Nenhuma peça documental corresponde ao filtro selecionado. Use o botão "Vincular Documento" para registrar um novo arquivo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocuments.map(doc => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="premium-card p-6 bg-brand-paper border-brand-primary/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                      doc.doc_type?.toLowerCase() === 'edital' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      doc.doc_type?.toLowerCase() === 'matrícula' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                    )}>
                      {doc.doc_type || 'Outros'}
                    </span>
                    <div className="flex items-center gap-2 relative z-10">
                      <button
                        type="button"
                        disabled={transcribingId === doc.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setTranscribingId(doc.id);
                          try {
                            const res = await fetch(`/api/documents/${doc.id}/transcribe`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (!res.ok) {
                              const errData = await res.json().catch(() => ({}));
                              throw new Error(errData.error || "Erro na transcrição");
                            }
                            setSuccessMsg("Documento transcrevido em Markdown com sucesso!");
                            setTimeout(() => setSuccessMsg(null), 3500);
                            fetchDocuments();
                          } catch (err: any) {
                            setError(err.message || "Erro ao transcrever documento");
                          } finally {
                            setTranscribingId(null);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        title="Transcrever texto completo com OCR IA (visão)"
                      >
                        {transcribingId === doc.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        <span>OCR IA</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocumentToDelete({ id: doc.id, name: doc.filename });
                        }}
                        className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-100 hover:text-red-500 rounded-lg transition-all cursor-pointer relative z-10"
                        title="Excluir Documento"
                      >
                        <Trash2 size={14} className="text-red-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-base font-bold tracking-tight line-clamp-2 mb-2 select-all h-12">
                    {doc.filename}
                  </h4>
                  {doc.property_title ? (
                    <div className="flex items-center gap-2 text-xs text-brand-primary/80 font-medium mb-4 cursor-pointer hover:underline" onClick={() => doc.property_id && onSelectProperty(doc.property_id)}>
                      <HardDrive size={12} />
                      <span className="truncate max-w-[200px]">{doc.property_title}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-brand-ink/30 italic mb-4">
                      <AlertCircle size={12} />
                      <span>Documento não vinculado</span>
                    </div>
                  )}

                  {doc.ia_summary && (
                    <div className="mt-3 pt-3 border-t border-brand-primary/5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSummary(doc.id);
                        }}
                        className="flex items-center justify-between w-full text-xs text-brand-primary font-bold hover:opacity-80 transition-all uppercase tracking-wider text-left py-1"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-brand-primary animate-pulse" />
                          <span>Resumo da IA</span>
                        </span>
                        {expandedSummaries[doc.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <AnimatePresence initial={false}>
                        {expandedSummaries[doc.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <p className="text-xs text-brand-ink/75 leading-relaxed bg-brand-bg/50 border border-brand-primary/10 rounded-xl p-3.5 italic font-medium whitespace-pre-wrap">
                              {doc.ia_summary}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-brand-primary/5 flex items-center justify-between text-[11px] text-brand-ink/40 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {doc.property_id && (
                    <button
                      onClick={() => onSelectProperty(doc.property_id!)}
                      className="flex items-center gap-1.5 text-brand-primary hover:underline font-bold"
                    >
                      <span>Acessar Análise</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Upload Modal / Slide-over */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-brand-paper border border-brand-primary/20 rounded-[35px] p-8 shadow-2xl overflow-hidden relative"
          >
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4 mb-6">
              <h3 className="text-2xl font-serif text-brand-primary flex items-center gap-2">
                <FileText size={24} />
                Vincular Nova Peça
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-brand-ink/40 hover:text-brand-ink select-none uppercase font-bold text-xs hover:bg-brand-bg px-3 py-1.5 rounded-lg"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={handleQuickUploadSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink/50 mb-2">Imóvel de Destino (Opcional)</label>
                <select
                  value={uploadPropertyId}
                  onChange={(e) => setUploadPropertyId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl px-4 py-3 text-sm text-brand-ink focus:border-brand-primary focus:outline-none"
                >
                  <option value="">Sem vínculo (somente salvar repositório) ...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.city} - {p.state})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink/50 mb-2">Tipo de Peça</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl px-4 py-3 text-sm text-brand-ink focus:border-brand-primary focus:outline-none"
                    required
                  >
                    <option value="Edital">Edital de Leilão</option>
                    <option value="Matrícula">Matrícula</option>
                    <option value="Processo Judicial">Processo Judicial</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink/50 mb-2">Selecione o(s) Arquivo(s)</label>
                  <label className="w-full flex items-center justify-center bg-brand-bg border border-brand-primary/10 rounded-xl px-4 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider cursor-pointer hover:bg-brand-primary/5 transition-all">
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => e.target.files && setUploadFiles(Array.from(e.target.files))}
                      required
                    />
                    <Upload size={14} className="mr-2" />
                    <span>{uploadFiles.length > 0 ? `${uploadFiles.length} Selecionado(s)` : 'Subir PDF/Imagens'}</span>
                  </label>
                </div>
              </div>

              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {uploadFiles.map((file, i) => (
                    <div key={i} className="p-3 bg-brand-bg border border-brand-primary/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3 truncate max-w-[75%]">
                        <FileText size={16} className="text-brand-primary shrink-0" />
                        <span className="text-xs font-bold truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-brand-ink/40 font-bold whitespace-nowrap uppercase">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-4 rounded-xl bg-brand-primary hover:bg-brand-primary hover:scale-[1.01] text-black font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{uploadProgressText || "Processando e Indexando..."}</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Processar Documento por IA</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* State-controlled Document Deletion Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-brand-paper border border-red-500/20 rounded-[30px] p-8 shadow-2xl relative"
          >
            <div className="flex items-center gap-4 text-red-500 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-brand-primary">Excluir Documento?</h3>
                <p className="text-xs text-brand-ink/40 font-bold uppercase tracking-wider">Ação irreversível</p>
              </div>
            </div>

            <p className="text-sm text-brand-ink/70 leading-relaxed mb-6">
              Tem certeza absoluta de que deseja excluir permanentemente o documento <strong className="text-brand-ink font-semibold">"{documentToDelete.name}"</strong>? Esta peça será removida do repositório da IA e não poderá ser recuperada.
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => !isDeleting && setDocumentToDelete(null)}
                disabled={isDeleting}
                className={cn(
                  "flex-1 py-3.5 rounded-xl bg-brand-bg hover:bg-brand-bg/80 text-brand-ink/70 hover:text-brand-ink text-xs font-bold uppercase tracking-wider transition-all",
                  isDeleting && "opacity-50 cursor-not-allowed"
                )}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className={cn(
                  "flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2",
                  isDeleting && "opacity-50 cursor-not-allowed bg-red-600"
                )}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* State-controlled Bulk Clear Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-brand-paper border border-red-500/20 rounded-[30px] p-8 shadow-2xl relative"
          >
            <div className="flex items-center gap-4 text-red-500 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-brand-primary">Limpar Todo o Repositório?</h3>
                <p className="text-xs text-brand-ink/40 font-bold uppercase tracking-wider">Ação irreversível</p>
              </div>
            </div>

            <p className="text-sm text-brand-ink/70 leading-relaxed mb-6">
              Tem certeza absoluta de que deseja <strong className="text-red-500 font-semibold">excluir permanentemente todos os {documents.length} documentos</strong> do repositório? Esta ação removerá todas as peças de suporte de IA e não poderá ser desfeita.
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => !isClearingAll && setShowClearAllModal(false)}
                disabled={isClearingAll}
                className={cn(
                  "flex-1 py-3.5 rounded-xl bg-brand-bg hover:bg-brand-bg/80 text-brand-ink/70 hover:text-brand-ink text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                  isClearingAll && "opacity-50 cursor-not-allowed"
                )}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                disabled={isClearingAll}
                className={cn(
                  "flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2 cursor-pointer",
                  isClearingAll && "opacity-50 cursor-not-allowed bg-red-600"
                )}
              >
                {isClearingAll ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Limpando...</span>
                  </>
                ) : (
                  <span>Apagar Tudo</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
