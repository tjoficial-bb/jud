import React, { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Shuffle, 
  Share2, 
  X, 
  Globe, 
  Sparkles,
  Layers,
  MessageCircle
} from 'lucide-react';
import { ModularExportPayload } from '../utils/modularReportExporter';

interface ShareCustomLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: ModularExportPayload;
  customDomain?: string;
  analysisId?: string | null;
  propertyId?: string | null;
}

export function ShareCustomLinkModal({
  isOpen,
  onClose,
  payload,
  customDomain,
  analysisId,
  propertyId,
}: ShareCustomLinkModalProps) {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate an initial suggested slug from property or title
  const generateRandomSlug = () => {
    const prefix = (payload.propertyTitle || payload.reportTitle || 'relatorio')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 18);
    const rand = Math.random().toString(36).substring(2, 7);
    const newSlug = prefix ? `${prefix}-${rand}` : `relatorio-${rand}`;
    setSlug(newSlug);
    setCreatedUrl(null);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      generateRandomSlug();
      setCreatedUrl(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolve base domain
  const rawDomain = customDomain?.trim();
  let baseDomain = window.location.origin;
  if (rawDomain) {
    const clean = rawDomain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');
    baseDomain = `https://${clean}`;
  }

  const previewUrl = `${baseDomain}/share/${slug || 'meu-link'}`;
  const selectedSections = payload.sections.filter(s => s.selected !== false);

  const handleCreateShare = async () => {
    if (!slug.trim()) {
      setError("Por favor, informe um identificador ou clique em 'Gerar Aleatório'.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/custom-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim(),
          title: payload.reportTitle,
          property_title: payload.propertyTitle,
          property_address: payload.propertyAddress,
          property_city: payload.propertyCity,
          sections: selectedSections,
          analysis_id: analysisId || null,
          property_id: propertyId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Falha ao gerar link compartilhado.");
      }

      const finalUrl = `${baseDomain}/share/${data.slug}`;
      setCreatedUrl(finalUrl);

      // Copy automatically
      try {
        await navigator.clipboard.writeText(finalUrl);
        setCopied(true);
        if ((window as any).customToast) {
          (window as any).customToast("Link criado e copiado para a área de transferência!", "success");
        }
      } catch (_) {}
    } catch (err: any) {
      console.error("Erro ao criar link:", err);
      setError(err.message || "Erro de conexão ao gerar link.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyExisting = async () => {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if ((window as any).customToast) {
        (window as any).customToast("Link copiado!", "success");
      }
    } catch (_) {}
  };

  const shareWhatsApp = () => {
    if (!createdUrl) return;
    const msg = `Olá! Segue a análise de leilão (${payload.propertyTitle || payload.reportTitle}):\n\n${createdUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[300] p-4 animate-in fade-in duration-200">
      <div className="bg-brand-paper border border-brand-primary/20 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-brand-ink/50 hover:text-brand-ink hover:bg-brand-bg rounded-xl transition-all"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-brand-border/40 pb-4">
          <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
            <LinkIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-brand-primary">
              Gerar Link Personalizado
            </h3>
            <p className="text-xs text-brand-ink/60 font-medium">
              Crie um link web exclusivo para compartilhar esta análise e seus módulos
            </p>
          </div>
        </div>

        {/* Included Modules Info */}
        <div className="p-3.5 bg-brand-bg/60 border border-brand-border/60 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-brand-ink/80">
            <Layers size={16} className="text-brand-primary" />
            <span className="font-semibold">Módulos que farão parte deste link:</span>
          </div>
          <span className="bg-brand-primary/10 text-brand-primary font-bold px-2.5 py-1 rounded-lg">
            {selectedSections.length} selecionado(s)
          </span>
        </div>

        {/* Slug Customization Form */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-brand-ink/80 uppercase tracking-wider block">
            Nome / Slug do Link:
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative flex items-center">
              <span className="absolute left-3 text-xs text-brand-ink/40 font-mono hidden sm:inline select-none">
                /share/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'));
                  setCreatedUrl(null);
                  setError(null);
                }}
                placeholder="ex: cadeiaregistro ou lote-12-sp"
                className="w-full bg-brand-bg border border-brand-border/80 rounded-xl py-3 pl-3 sm:pl-18 pr-4 text-sm text-brand-ink font-mono focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={generateRandomSlug}
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border/80 hover:border-brand-primary/30 text-brand-ink rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              title="Gerar código aleatório"
            >
              <Shuffle size={14} className="text-brand-primary" />
              <span>Aleatório</span>
            </button>
          </div>

          {/* Real-time Preview */}
          <div className="text-[11px] text-brand-ink/60 flex items-center gap-1.5 break-all">
            <Globe size={13} className="text-brand-primary shrink-0" />
            <span className="text-brand-ink/40">Endereço final:</span>
            <span className="font-mono font-semibold text-brand-primary">{previewUrl}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Action / Result */}
        {!createdUrl ? (
          <button
            type="button"
            onClick={handleCreateShare}
            disabled={loading || selectedSections.length === 0}
            className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold text-sm rounded-2xl transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span className="animate-pulse">Criando link...</span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Gerar & Copiar Link Público</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4 pt-2 border-t border-brand-border/40 animate-in fade-in duration-300">
            <div className="p-4 bg-brand-bg border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
                <span>✅ Link Público Ativo e Pronto!</span>
                <span>Visualização Externa</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 bg-brand-paper rounded-xl border border-brand-border">
                <span className="font-mono text-xs text-brand-ink truncate flex-1 select-all">
                  {createdUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyExisting}
                  className="p-2 bg-brand-primary text-black rounded-lg hover:bg-brand-primary/90 transition-all shrink-0"
                  title="Copiar Link"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle size={16} />
                <span>Enviar pelo WhatsApp</span>
              </button>

              <a
                href={createdUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span>Abrir Link</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
