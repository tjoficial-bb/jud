import React, { useEffect, useState } from 'react';
import { 
  Printer, 
  Copy, 
  Download, 
  Share2, 
  Check, 
  Layers, 
  Building2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Clock, 
  ArrowLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  ExportSectionItem, 
  ModularExportPayload, 
  convertTextToFormattedHtml, 
  copyModularSectionsToClipboard, 
  downloadModularSections, 
  printModularSections,
  parseMarkdownToSections
} from '../utils/modularReportExporter';

interface SharedData {
  slug: string;
  title: string;
  property_title?: string;
  property_address?: string;
  property_city?: string;
  sections: ExportSectionItem[];
  created_at?: string;
  view_count?: number;
}

export function PublicSharedReportView({ slug }: { slug: string }) {
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    async function fetchShare() {
      setLoading(true);
      setError(null);
      try {
        // Strategy 1: Fetch from custom_public_shares
        const res = await fetch(`/api/custom-share/${slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.share) {
            setData(json.share);
            setLoading(false);
            return;
          }
        }

        // Strategy 2: Fallback to public property share token
        const propRes = await fetch(`/api/public/property/${slug}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          if (propData && propData.property) {
            const rawExec = propData.analysis?.exec_summary || "Análise do imóvel disponível para consulta.";
            const parsed = parseMarkdownToSections(rawExec);
            
            setData({
              slug,
              title: `Dossiê Estratégico de Leilão - ${propData.property.title || 'Oportunidade Imobiliária'}`,
              property_title: propData.property.title,
              property_address: propData.property.address,
              property_city: propData.property.city ? `${propData.property.city}${propData.property.state ? ' - ' + propData.property.state : ''}` : '',
              sections: parsed.length > 0 ? parsed : [
                {
                  id: 'resumo-geral',
                  title: 'Resumo Estratégico & Análise de Viabilidade',
                  text: rawExec,
                  selected: true
                }
              ],
              created_at: propData.property.created_at || new Date().toISOString()
            });
            setLoading(false);
            return;
          }
        }

        throw new Error("Relatório não encontrado ou link expirado.");
      } catch (err: any) {
        console.error("Erro ao carregar compartilhamento:", err);
        setError(err.message || "Erro ao carregar relatório.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchShare();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-brand-ink">Carregando Análise Estratégica...</h2>
          <p className="text-xs text-brand-ink/50">TJ INVEST - Inteligência em Leilões Imobiliários</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="bg-brand-paper border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl w-fit mx-auto">
            <FileText size={32} />
          </div>
          <h2 className="text-xl font-bold text-brand-ink">Relatório Não Encontrado</h2>
          <p className="text-sm text-brand-ink/60">{error || "O link acessado não é válido ou foi removido."}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all"
          >
            <ArrowLeft size={16} />
            <span>Ir para a Página Principal</span>
          </a>
        </div>
      </div>
    );
  }

  const buildPayload = (): ModularExportPayload => ({
    reportTitle: data.title,
    propertyTitle: data.property_title,
    propertyAddress: data.property_address,
    propertyCity: data.property_city,
    sections: data.sections || [],
    generatedAt: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
  });

  const handleCopyFormatted = async () => {
    try {
      const ok = await copyModularSectionsToClipboard(buildPayload());
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (_) {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2500);
    } catch (_) {}
  };

  const handlePrint = () => {
    printModularSections(buildPayload());
  };

  const handleDownloadDoc = () => {
    downloadModularSections(buildPayload(), 'doc');
  };

  const dateFormatted = data.created_at 
    ? new Date(data.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-brand-paper/90 backdrop-blur-md border-b border-brand-border/60 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-serif font-black text-brand-primary text-sm shadow-xs">
            TJ
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm text-brand-ink flex items-center gap-1.5 leading-none">
              <span>TJ INVEST</span>
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded font-sans font-bold">
                LEILÕES
              </span>
            </h1>
            <p className="text-[11px] text-brand-ink/50 font-medium">
              Relatório de Viabilidade & Inteligência
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border hover:border-brand-primary/30 text-brand-ink rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Copiar link desta página"
          >
            {urlCopied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{urlCopied ? 'Link Copiado!' : 'Compartilhar Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyFormatted}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border hover:border-brand-primary/30 text-brand-primary rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Copiar texto formatado"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span className="hidden md:inline">{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border hover:border-brand-primary/30 text-brand-ink rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Baixar em formato Word (.doc)"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Word</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-black hover:bg-brand-primary/90 rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-primary/20"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer size={14} />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Report Overview Banner */}
        <div className="bg-gradient-to-br from-brand-paper via-brand-paper to-brand-bg border border-brand-primary/20 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/40 pb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full text-xs font-bold tracking-wide uppercase">
              <ShieldCheck size={14} /> Relatório Analítico Oficial
            </span>
            <div className="flex items-center gap-3 text-xs text-brand-ink/50 font-medium">
              <span className="flex items-center gap-1">
                <Calendar size={13} /> {dateFormatted}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers size={13} /> {data.sections.length} módulo(s)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-brand-ink tracking-tight">
              {data.title}
            </h2>
            {data.property_title && (
              <p className="text-base font-semibold text-brand-primary flex items-center gap-2">
                <Building2 size={18} className="shrink-0" />
                <span>{data.property_title}</span>
              </p>
            )}
            {data.property_address && (
              <p className="text-xs sm:text-sm text-brand-ink/70 flex items-center gap-2">
                <MapPin size={16} className="text-brand-primary/70 shrink-0" />
                <span>{data.property_address}{data.property_city ? ` - ${data.property_city}` : ''}</span>
              </p>
            )}
          </div>
        </div>

        {/* Modular Sections Cards */}
        <div className="space-y-5">
          {data.sections.map((sec, idx) => {
            const htmlContent = sec.html ? sec.html : convertTextToFormattedHtml(sec.text);

            return (
              <section
                key={sec.id || idx}
                className="bg-brand-paper border border-brand-border/80 hover:border-brand-primary/30 rounded-2xl p-6 shadow-xs transition-all space-y-4"
              >
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <h3 className="text-lg font-serif font-bold text-brand-ink flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-mono font-bold">
                      {idx + 1}
                    </span>
                    <span>{sec.title}</span>
                  </h3>
                </div>

                <div 
                  className="prose prose-sm max-w-none text-brand-ink/90 leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-12 text-center text-xs text-brand-ink/40 space-y-2 border-t border-brand-border/40">
          <p className="font-semibold text-brand-ink/60">
            TJ INVEST - Inteligência & Análise Jurídico-Financeira de Leilões Imobiliários
          </p>
          <p>
            As análises e estimativas contidas neste documento baseiam-se nos documentos e autos disponibilizados e não dispensam a diligência jurídica e vistoria presencial.
          </p>
        </footer>
      </main>
    </div>
  );
}
