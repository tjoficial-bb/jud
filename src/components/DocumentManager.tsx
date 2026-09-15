import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface DocItem {
  id: string;
  filename: string;
  doc_type: string;
  created_at: string;
}

interface DocumentManagerProps {
  label: string;
  docs: DocItem[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  onDelete: (id: string) => void;
  onTranscribe?: (id: string) => void;
  uploading: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  label, docs, onUpload, onDelete, onTranscribe, uploading 
}) => {
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const normalize = (str: string) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const normalizedLabel = normalize(label);

  const categoryDocs = docs.filter(d => {
    let cat = d.doc_type || '';
    if (cat.includes(':')) {
      const parts = cat.split(':');
      cat = parts.slice(1).join(':');
    }
    const normCat = normalize(cat);
    const normFn = normalize(d.filename || '');
    if (normCat === normalizedLabel) return true;
    if (normalizedLabel.includes('matricula')) {
      return (
        normCat.includes('matricula') || 
        normCat.includes('certidao') || 
        normCat.includes('registro') || 
        normCat.includes('onus') || 
        normCat.includes('vintenaria') || 
        normCat.includes('inteiro') || 
        normCat.includes('rgi') || 
        normCat.includes('cri') || 
        normCat.includes('transcricao') ||
        normFn.includes('matricula') || 
        normFn.includes('certidao') || 
        normFn.includes('registro') || 
        normFn.includes('onus') || 
        normFn.includes('vintenaria') || 
        normFn.includes('inteiro') || 
        normFn.includes('rgi') || 
        normFn.includes('cri') || 
        normFn.includes('transcricao')
      );
    }
    if (normalizedLabel.includes('edital')) {
      return normCat.includes('edital') || normFn.includes('edital') || normCat.includes('publicacao') || normFn.includes('publicacao');
    }
    if (normalizedLabel.includes('processo')) {
      return (
        normCat.includes('processo') || 
        normCat.includes('judicial') || 
        normCat.includes('autos') || 
        normCat.includes('execuc') || 
        normFn.includes('processo') || 
        normFn.includes('autos') || 
        normFn.includes('execuc') || 
        normFn.includes('judicial')
      );
    }
    if (normalizedLabel.includes('outro')) return normCat.includes('outro') || !normCat;
    return false;
  });

  const uniqueId = React.useId();
  const safeLabelId = normalize(label).replace(/[^a-z0-9]/g, '-');
  const idInput = `upload-${safeLabelId}-${uniqueId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading || !e.dataTransfer.files?.length) return;
    const syntheticEvent = {
      target: {
        files: e.dataTransfer.files
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onUpload(syntheticEvent, label);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-brand-primary/10 pb-2">
        <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/50">{label}</label>
        {categoryDocs.length > 0 && <span className="text-[10px] font-bold text-emerald-500">{categoryDocs.length} Arquivo(s)</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryDocs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-4 bg-brand-bg rounded-xl border border-brand-primary/5 transition-all min-h-[56px]">
            {docToDelete === doc.id ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-red-500">Excluir arquivo permanentemente?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDocToDelete(null);
                    }}
                    className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/10 rounded-md text-[10px] font-bold uppercase tracking-wider text-brand-ink hover:bg-brand-primary/20 transition-all cursor-pointer"
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(doc.id);
                      setDocToDelete(null);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-[10px] font-bold uppercase tracking-wider text-white transition-all cursor-pointer"
                  >
                    Sim
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 truncate max-w-[65%]">
                  <FileText size={16} className="text-brand-primary shrink-0" />
                  <span className="text-xs font-medium truncate" title={doc.filename}>{doc.filename}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onTranscribe && (
                    <button
                      type="button"
                      title="Transcrever texto completo com OCR IA (visão)"
                      disabled={transcribingId === doc.id || uploading}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTranscribingId(doc.id);
                        try {
                          await onTranscribe(doc.id);
                        } finally {
                          setTranscribingId(null);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {transcribingId === doc.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      <span>OCR IA</span>
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      setDocToDelete(doc.id); 
                    }} 
                    className="p-2 hover:bg-red-500/10 rounded-md text-red-500 transition-colors z-10 relative cursor-pointer"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        <input 
          type="file" 
          id={idInput} 
          className="hidden" 
          multiple 
          accept=".pdf,application/pdf,image/*,.doc,.docx,.txt"
          onChange={(e) => onUpload(e, label)} 
          disabled={uploading} 
        />
        <label 
          htmlFor={idInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border border-dashed cursor-pointer transition-all min-h-[70px]",
            isDragging ? "border-brand-primary bg-brand-primary/15 scale-[1.01]" : "border-brand-primary/25 hover:bg-brand-primary/5 hover:border-brand-primary/40",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2">
            {uploading ? <Loader2 size={16} className="animate-spin text-brand-primary" /> : <Upload size={16} className="text-brand-primary" />}
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
              {isDragging ? `Soltar arquivo aqui` : `Subir ${label}`}
            </span>
          </div>
          <span className="text-[10px] text-brand-ink/40 font-medium">Clique ou arraste e solte o arquivo aqui</span>
        </label>
      </div>
    </div>
  );
};

