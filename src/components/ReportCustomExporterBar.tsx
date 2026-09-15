import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Copy, 
  Printer, 
  Download, 
  Check, 
  SlidersHorizontal, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Link as LinkIcon,
  Share2
} from 'lucide-react';
import { 
  ExportSectionItem, 
  ModularExportPayload, 
  copyModularSectionsToClipboard, 
  downloadModularSections, 
  printModularSections 
} from '../utils/modularReportExporter';
import { ShareCustomLinkModal } from './ShareCustomLinkModal';

interface ReportCustomExporterBarProps {
  reportTitle: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  sections: ExportSectionItem[];
  selectedSectionIds?: string[];
  onToggleSection?: (id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onSelectOnly?: (id: string) => void;
  customDomain?: string;
  analysisId?: string | null;
  propertyId?: string | null;
  reportType?: string;
}

export function ReportCustomExporterBar({
  reportTitle,
  propertyTitle,
  propertyAddress,
  propertyCity,
  sections,
  selectedSectionIds: controlledSelectedIds,
  onToggleSection: controlledOnToggle,
  onSelectAll: controlledOnSelectAll,
  onDeselectAll: controlledOnDeselectAll,
  onSelectOnly: controlledOnSelectOnly,
  customDomain,
  analysisId,
  propertyId,
  reportType,
}: ReportCustomExporterBarProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(() => sections.map(s => s.id));
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync internal state when sections change
  React.useEffect(() => {
    if (controlledSelectedIds === undefined) {
      setInternalSelectedIds(sections.map(s => s.id));
    }
  }, [sections]);

  const selectedSectionIds = controlledSelectedIds !== undefined ? controlledSelectedIds : internalSelectedIds;

  const handleToggle = (id: string) => {
    if (controlledOnToggle) {
      controlledOnToggle(id);
    } else {
      setInternalSelectedIds(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAll = () => {
    if (controlledOnSelectAll) {
      controlledOnSelectAll();
    } else {
      setInternalSelectedIds(sections.map(s => s.id));
    }
  };

  const handleDeselectAll = () => {
    if (controlledOnDeselectAll) {
      controlledOnDeselectAll();
    } else {
      setInternalSelectedIds([]);
    }
  };

  const handleSelectOnly = (id: string) => {
    if (controlledOnSelectOnly) {
      controlledOnSelectOnly(id);
    } else {
      setInternalSelectedIds([id]);
    }
  };

  const activeSections = sections.map(s => ({
    ...s,
    selected: selectedSectionIds.includes(s.id),
  }));

  const numSelected = selectedSectionIds.length;
  const totalSections = sections.length;

  const buildPayload = (): ModularExportPayload => ({
    reportTitle,
    propertyTitle,
    propertyAddress,
    propertyCity,
    sections: activeSections,
  });

  const handleCopy = async () => {
    if (numSelected === 0) {
      if ((window as any).customToast) {
        (window as any).customToast("Selecione pelo menos uma seção para copiar.", "warning");
      }
      return;
    }
    try {
      const ok = await copyModularSectionsToClipboard(buildPayload());
      if (ok) {
        setCopied(true);
        if ((window as any).customToast) {
          (window as any).customToast(`✅ ${numSelected} seção(ões) copiada(s) com formatação completa!`, "success");
        }
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err: any) {
      if ((window as any).customToast) {
        (window as any).customToast(err.message || "Erro ao copiar conteúdo.", "error");
      }
    }
  };

  const handlePrint = () => {
    if (numSelected === 0) {
      if ((window as any).customToast) {
        (window as any).customToast("Selecione pelo menos uma seção para imprimir.", "warning");
      }
      return;
    }
    try {
      printModularSections(buildPayload());
    } catch (err: any) {
      if ((window as any).customToast) {
        (window as any).customToast(err.message || "Erro ao gerar impressão.", "error");
      }
    }
  };

  const handleDownload = (format: 'doc' | 'md' | 'txt') => {
    if (numSelected === 0) {
      if ((window as any).customToast) {
        (window as any).customToast("Selecione pelo menos uma seção para download.", "warning");
      }
      return;
    }
    setDownloading(true);
    try {
      downloadModularSections(buildPayload(), format);
      if ((window as any).customToast) {
        (window as any).customToast(`Download do relatório em .${format.toUpperCase()} iniciado com formatação executiva!`, "success");
      }
    } catch (err: any) {
      if ((window as any).customToast) {
        (window as any).customToast(err.message || "Erro ao baixar arquivo.", "error");
      }
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-brand-bg/95 via-brand-paper to-brand-bg/95 border border-brand-primary/20 rounded-2xl p-4 shadow-sm no-print mb-6 transition-all">
        {/* Top action row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                <SlidersHorizontal size={16} />
              </span>
              <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                Personalizar Relatório:
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 bg-brand-primary/10 hover:bg-brand-primary/15 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{numSelected} de {totalSections} seções</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Custom Link Share Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              disabled={numSelected === 0}
              className="flex items-center gap-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/30 text-brand-primary px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-xs active:scale-95 cursor-pointer"
              title="Gerar um link público personalizável com o seu domínio para compartilhar este relatório"
            >
              <LinkIcon size={14} />
              <span>Gerar Link Público</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={numSelected === 0}
              className="flex items-center gap-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-xs active:scale-95 cursor-pointer"
              title="Copiar apenas os módulos selecionados com formatação limpa para colar no WhatsApp, Word ou E-mail"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? 'Copiado Formatado!' : 'Copiar Selecionados'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={numSelected === 0}
              className="flex items-center gap-1.5 bg-brand-primary text-black hover:bg-brand-primary/90 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-sm shadow-brand-primary/10 active:scale-95 cursor-pointer"
              title="Imprimir ou gerar PDF apenas com as seções selecionadas"
            >
              <Printer size={14} />
              <span>Imprimir / PDF</span>
            </button>

            <div className="flex items-center gap-1 bg-brand-paper border border-brand-border rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => handleDownload('doc')}
                disabled={numSelected === 0 || downloading}
                className="px-2.5 py-1.5 text-[11px] font-bold text-brand-ink/80 hover:text-brand-primary hover:bg-brand-bg rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Baixar em formato Word (.doc) com formatação tipográfica e tabelas"
              >
                <Download size={12} /> Word
              </button>
              <button
                type="button"
                onClick={() => handleDownload('md')}
                disabled={numSelected === 0 || downloading}
                className="px-2.5 py-1.5 text-[11px] font-bold text-brand-ink/80 hover:text-brand-primary hover:bg-brand-bg rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Baixar em formato Markdown (.md)"
              >
                <FileText size={12} /> MD
              </button>
            </div>
          </div>
        </div>

        {/* Expanded checklist tray */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-brand-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-xs text-brand-ink/60 font-semibold">
              <span>Marque exatamente as partes que deseja incluir:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-brand-primary hover:underline font-bold cursor-pointer"
                >
                  Marcar Todos
                </button>
                <span className="text-brand-ink/30">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-brand-ink/50 hover:text-brand-ink hover:underline cursor-pointer"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {sections.map((sec) => {
                const isChecked = selectedSectionIds.includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    onClick={() => handleToggle(sec.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-ink font-bold shadow-xs'
                        : 'bg-brand-bg/40 border-brand-border/60 text-brand-ink/60 hover:border-brand-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {isChecked ? (
                        <CheckSquare size={16} className="text-brand-primary shrink-0" />
                      ) : (
                        <Square size={16} className="text-brand-ink/40 shrink-0" />
                      )}
                      <span className="text-xs truncate">{sec.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOnly(sec.id);
                      }}
                      className="text-[10px] uppercase font-bold text-brand-primary/70 hover:text-brand-primary hover:underline shrink-0 px-1.5 py-0.5 bg-brand-bg rounded cursor-pointer"
                      title={`Exportar apenas "${sec.title}"`}
                    >
                      Apenas esta
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Share Modal */}
      <ShareCustomLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        payload={buildPayload()}
        customDomain={customDomain}
        analysisId={analysisId}
        propertyId={propertyId}
      />
    </>
  );
}
