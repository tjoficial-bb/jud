import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
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
  uploading: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  label, docs, onUpload, onDelete, uploading 
}) => {
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const categoryDocs = docs.filter(d => d.doc_type === label);
  const idInput = `upload-${label.toLowerCase().replace(/\s+/g, '-')}`;

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
                <div className="flex items-center gap-3 truncate max-w-[80%]">
                  <FileText size={16} className="text-brand-primary shrink-0" />
                  <span className="text-xs font-medium truncate" title={doc.filename}>{doc.filename}</span>
                </div>
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
              </>
            )}
          </div>
        ))}
        
        <label 
          htmlFor={idInput}
          className={cn(
            "flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-brand-primary/20 cursor-pointer transition-all hover:bg-brand-primary/5",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input type="file" id={idInput} className="hidden" multiple onChange={(e) => onUpload(e, label)} disabled={uploading} />
          {uploading ? <Loader2 size={16} className="animate-spin text-brand-primary" /> : <Upload size={16} className="text-brand-primary" />}
          <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Subir {label}</span>
        </label>
      </div>
    </div>
  );
};
