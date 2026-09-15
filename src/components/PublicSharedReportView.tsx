import React, { useEffect, useState } from 'react';
import { 
  Printer, 
  Copy, 
  Download, 
  Check, 
  Building2, 
  MapPin, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
        // Strategy 1: Fetch from custom_public_shares (permanently stored in SQLite)
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
              title: `Dossiê de Leilão - ${propData.property.title || 'Oportunidade Imobiliária'}`,
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

        throw new Error("Relatório não encontrado. Verifique se o link está correto.");
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

  const buildPayload = (): ModularExportPayload => ({
    reportTitle: data?.title || 'Relatório de Leilão',
    propertyTitle: data?.property_title,
    propertyAddress: data?.property_address,
    propertyCity: data?.property_city,
    sections: data?.sections || [],
    generatedAt: data?.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined,
  });

  const handleCopyFormatted = async () => {
    try {
      const ok = await copyModularSectionsToClipboard(buildPayload());
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (_) {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (_) {}
  };

  const handlePrint = () => {
    printModularSections(buildPayload());
  };

  const handleDownloadDoc = () => {
    downloadModularSections(buildPayload(), 'doc');
  };

  const dateFormatted = data?.created_at 
    ? new Date(data.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3 p-6 bg-white border border-slate-200 rounded-xl shadow-sm max-w-xs w-full">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl max-w-md w-full text-center space-y-4 bg-white border border-slate-200 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mx-auto">
            <FileText size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Relatório não encontrado</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error || "Não foi possível carregar as informações deste link."}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Voltar ao início</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              TJ INVEST
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Relatório de Imóvel
            </span>
          </div>

          {/* Clean Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar link permanente"
            >
              {urlCopied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
              <span>{urlCopied ? 'Link Copiado' : 'Copiar Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyFormatted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer hidden sm:inline-flex"
              title="Copiar texto"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDoc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer hidden sm:inline-flex"
              title="Baixar em Word"
            >
              <Download size={13} />
              <span>Word</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Imprimir ou salvar em PDF"
            >
              <Printer size={13} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Document Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-2 border-b border-slate-100">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {dateFormatted}
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[11px]">
              ID: {data.slug}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {data.title}
          </h1>

          {data.property_title && (
            <div className="flex items-start gap-2 text-sm sm:text-base font-semibold text-slate-800">
              <Building2 size={18} className="text-slate-500 shrink-0 mt-0.5" />
              <span>{data.property_title}</span>
            </div>
          )}

          {data.property_address && (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
              <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <span>{data.property_address}{data.property_city ? ` • ${data.property_city}` : ''}</span>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {data.sections.map((sec, idx) => (
            <div
              key={sec.id || idx}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-4 shadow-xs"
            >
              <h2 className="text-base sm:text-lg font-bold text-slate-900 pb-2.5 border-b border-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold">
                  {idx + 1}
                </span>
                <span>{sec.title}</span>
              </h2>

              <div className="text-sm leading-relaxed text-slate-700">
                {sec.text ? (
                  <div className="space-y-3">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h3 className="text-base font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h4 className="text-sm font-bold text-slate-900 mt-3 mb-1.5" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h5 className="text-xs font-bold text-slate-900 mt-2 mb-1" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="leading-relaxed mb-2.5 text-slate-700" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="space-y-1 my-2 pl-5 list-disc text-slate-700 marker:text-slate-400" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="space-y-1 my-2 pl-5 list-decimal text-slate-700 marker:text-slate-400" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-slate-900" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="p-3 my-2.5 rounded-lg bg-slate-50 border-l-4 border-slate-400 text-xs sm:text-sm text-slate-700" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-50 text-slate-800 font-semibold" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="p-2.5 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-600" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="p-2.5 border-b border-slate-100 text-slate-700" {...props} />
                        ),
                      }}
                    >
                      {sec.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none text-slate-700 leading-relaxed overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: sec.html || convertTextToFormattedHtml(sec.text) }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Simple Document Footer */}
        <footer className="pt-4 pb-8 text-center text-xs text-slate-400 border-t border-slate-200">
          <p>TJ INVEST • Relatório de Oportunidade Imobiliária</p>
        </footer>
      </main>
    </div>
  );
}
