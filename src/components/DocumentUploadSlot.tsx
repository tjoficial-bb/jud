import React from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export function DocumentUploadSlot({ label, onUpload, uploading, hasFile, helperText, multiple, accept, count }: { 
  label: string, 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  uploading: boolean, 
  hasFile: boolean, 
  helperText?: string,
  multiple?: boolean,
  accept?: string,
  count?: number
}) {
  console.log(`DocumentUploadSlot: ${label}`);
  const uniqueId = React.useId();
  const id = `upload-${label.toLowerCase().replace(/\s+/g, '-')}-${uniqueId.replace(/:/g, '')}`;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30">{label} {count !== undefined && count > 0 && <span className="ml-1">({count})</span>}</label>
        {hasFile && <Check size={14} className="text-emerald-500" />}
      </div>
      <div className="relative">
        <input 
          type="file" 
          id={id}
          className="hidden" 
          onChange={onUpload}
          disabled={uploading}
          multiple={multiple}
          accept={accept || "application/pdf,image/*"}
        />
        <label 
          htmlFor={id}
          className={cn(
            "w-full border-2 border-dashed rounded-2xl py-5 px-6 flex items-center gap-4 cursor-pointer transition-all",
            hasFile ? "bg-emerald-50/50 border-emerald-100" : "bg-brand-bg/50 border-brand-primary/10 hover:border-brand-primary/30 hover:bg-brand-bg"
          )}
        >
          {uploading ? <Loader2 className="animate-spin text-brand-primary" size={18} /> : <Plus className="text-brand-ink/20" size={18} />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">
            {hasFile ? (multiple ? "Adicionar Arquivos" : "Substituir Arquivo") : "Subir Arquivo"}
          </span>
        </label>
      </div>
      {helperText && <p className="text-[9px] text-brand-ink/30 italic px-1">{helperText}</p>}
    </div>
  );
}
