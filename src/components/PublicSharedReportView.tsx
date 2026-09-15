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
  Share2,
  FileCheck2,
  Bookmark,
  Layers
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
    window.print();
  };

  const handleDownloadDoc = () => {
    downloadModularSections(buildPayload(), 'doc');
  };

  const dateFormatted = data?.created_at 
    ? new Date(data.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="text-center space-y-3 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm max-w-xs w-full">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700 tracking-tight">Carregando dossiê...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl max-w-md w-full text-center space-y-4 bg-white border border-slate-200 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mx-auto">
            <FileText size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Relatório não encontrado</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error || "Não foi possível carregar as informações deste link."}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Voltar ao início</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 print:bg-white print:p-0">
      {/* Top Floating / Sticky Header (Hidden on Print) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 print:hidden transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs">
              TJ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                  TJ INVEST
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                  Dossiê
                </span>
              </div>
            </div>
          </div>

          {/* Clean Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
              title="Copiar link permanente"
            >
              {urlCopied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
              <span>{urlCopied ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyFormatted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:border-slate-300 cursor-pointer hidden sm:inline-flex"
              title="Copiar texto formatado"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDoc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:border-slate-300 cursor-pointer hidden sm:inline-flex"
              title="Baixar em formato Word (.doc)"
            >
              <Download size={13} />
              <span>Word</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer hover:shadow-sm"
              title="Imprimir ou salvar em PDF"
            >
              <Printer size={13} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 print:max-w-none print:px-0 print:py-0 print:space-y-4">
        {/* Document Header Box */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm print:border-none print:shadow-none print:p-0 print:mb-6">
          {/* Top metadata tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200/60">
                <FileCheck2 size={12} />
                Auditoria de Leilão
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-xs">
                <Calendar size={13} className="text-slate-400" /> {dateFormatted}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                ID: {data.slug}
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {data.title}
          </h1>

          {/* Property Identification */}
          {(data.property_title || data.property_address) && (
            <div className="pt-1 space-y-1.5">
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
          )}
        </div>

        {/* Section Quick Jump Navigator (if > 1 section) */}
        {data.sections && data.sections.length > 1 && (
          <div className="p-1.5 bg-white border border-slate-200/80 rounded-xl flex items-center gap-1 overflow-x-auto shadow-2xs no-scrollbar print:hidden">
            <div className="flex items-center gap-1 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              <Layers size={13} />
              <span>Sumário:</span>
            </div>
            {data.sections.map((sec, idx) => (
              <a
                key={sec.id || idx}
                href={`#${sec.id || `section-${idx}`}`}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                <span className="font-semibold text-slate-400 mr-1.5">{idx + 1}.</span>
                {sec.title}
              </a>
            ))}
          </div>
        )}

        {/* Document Sections */}
        <div className="space-y-5 print:space-y-6">
          {data.sections.map((sec, idx) => (
            <section
              id={sec.id || `section-${idx}`}
              key={sec.id || idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm scroll-mt-20 print:border-none print:shadow-none print:p-0 print:break-inside-avoid"
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {sec.title}
                </h2>
              </div>

              {/* Section Body */}
              <div className="text-sm sm:text-[15px] leading-relaxed text-slate-700">
                {sec.text ? (
                  <div className="space-y-3.5">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-5 mb-2 pb-1.5 border-b border-slate-100 tracking-tight" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-4 mb-2 tracking-tight" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mt-3 mb-1.5 text-slate-800" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="leading-relaxed mb-3 text-slate-700" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="space-y-1.5 my-2.5 pl-5 list-disc text-slate-700 marker:text-slate-400" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="space-y-1.5 my-2.5 pl-5 list-decimal text-slate-700 marker:text-slate-400 font-medium" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed text-slate-700 font-normal" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold text-slate-900" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="p-3.5 my-3 rounded-xl bg-slate-50 border-l-4 border-slate-300 text-xs sm:text-sm text-slate-700 leading-relaxed" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-2xs">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="px-3.5 py-2.5 font-bold uppercase text-[11px] tracking-wider text-slate-700" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-700" {...props} />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr className="my-5 border-slate-200" {...props} />
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
            </section>
          ))}
        </div>

        {/* Professional Document Footer */}
        <footer className="pt-6 pb-12 text-center space-y-1.5 border-t border-slate-200/80 text-xs text-slate-500 print:pt-4 print:pb-0">
          <p className="font-semibold text-slate-700">
            TJ INVEST • Inteligência em Leilões Imobiliários
          </p>
          <p className="text-[11px] text-slate-400 max-w-xl mx-auto leading-relaxed">
            Dossiê gerado com base em dados processuais, editalícios e registrais públicos.
          </p>
        </footer>
      </main>
    </div>
  );
}
