import React, { useEffect, useState, useMemo } from 'react';
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
  ExternalLink,
  Sun,
  Moon,
  TrendingUp,
  Gavel,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  ChevronRight,
  Info,
  BadgeCheck,
  Compass,
  Zap,
  PhoneCall
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
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [activeSectionId, setActiveSectionId] = useState<string>('');

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

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isLight = themeMode === 'light';

  const buildPayload = (): ModularExportPayload => ({
    reportTitle: data?.title || 'Dossiê TJ INVEST',
    propertyTitle: data?.property_title,
    propertyAddress: data?.property_address,
    propertyCity: data?.property_city,
    sections: data?.sections || [],
    generatedAt: data?.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
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

  const handleWhatsAppShare = () => {
    const text = `*${data?.title || 'Dossiê de Leilão'}*\n\n` +
      `Confira a análise técnica e viabilidade jurídica completa desta oportunidade:\n` +
      `${window.location.href}\n\n` +
      `TJ INVEST - Inteligência em Leilões Imobiliários`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0b0f17] text-slate-100'
      }`}>
        <div className="text-center space-y-4 max-w-sm w-full p-8 rounded-3xl border border-emerald-500/20 shadow-2xl bg-white/5 backdrop-blur-xl">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-emerald-500 text-xs">
              TJ
            </div>
          </div>
          <h2 className="text-lg font-bold tracking-tight">Carregando Dossiê Estratégico...</h2>
          <p className="text-xs text-slate-400">TJ INVEST • Inteligência Jurídica & Financeira em Leilões</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0b0f17] text-slate-100'
      }`}>
        <div className={`p-8 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl border ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131b29] border-slate-800'
        }`}>
          <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl w-fit mx-auto">
            <FileText size={36} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Relatório Indisponível</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {error || "O link acessado não foi encontrado ou os dados expiraram."}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <ArrowLeft size={16} />
            <span>Acessar Plataforma Principal</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#080d14] text-slate-100'
    }`}>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-colors ${
        isLight 
          ? 'bg-white/95 border-slate-200 shadow-sm' 
          : 'bg-[#0e1623]/95 border-slate-800 shadow-lg shadow-black/40'
      }`}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-emerald-500/20 tracking-wider">
            TJ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5 leading-none">
                <span>TJ INVEST</span>
              </h1>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                DOSSIÊ OFICIAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 hidden sm:block">
              Inteligência Jurídico-Financeira em Leilões Imobiliários
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isLight 
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isLight ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
          >
            {isLight ? <Moon size={15} className="text-slate-700" /> : <Sun size={15} className="text-amber-400" />}
            <span className="hidden lg:inline">{isLight ? 'Modo Escuro' : 'Modo Claro'}</span>
          </button>

          {/* WhatsApp Direct */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
            title="Compartilhar no WhatsApp"
          >
            <MessageCircle size={15} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title="Copiar link desta página"
          >
            {urlCopied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span className="hidden md:inline">{urlCopied ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopyFormatted}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title="Copiar texto formatado"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span className="hidden lg:inline">{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          {/* Download Word */}
          <button
            type="button"
            onClick={handleDownloadDoc}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title="Baixar em formato Word (.doc)"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Word</span>
          </button>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer size={15} />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Executive Hero Banner */}
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all shadow-xl ${
          isLight
            ? 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border-slate-200 shadow-slate-200/50'
            : 'bg-gradient-to-br from-[#111927] via-[#0e1623] to-[#0a121d] border-slate-800 shadow-black/60'
        }`}>
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative space-y-5">
            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 transition-colors ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-extrabold tracking-wide uppercase">
                  <ShieldCheck size={14} className="text-emerald-500" /> Auditoria TJ INVEST
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wide">
                  <Gavel size={13} className="text-amber-500" /> Leilão Imobiliário
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> {dateFormatted}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers size={13} /> {data.sections?.length || 1} seção(ões)
                </span>
                {data.slug && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px] bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      ID: {data.slug}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Title & Property Info */}
            <div className="space-y-3">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {data.title}
              </h2>

              {data.property_title && (
                <div className="flex items-start gap-2.5 text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  <Building2 size={22} className="shrink-0 mt-0.5" />
                  <span>{data.property_title}</span>
                </div>
              )}

              {data.property_address && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <MapPin size={17} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{data.property_address}{data.property_city ? ` • ${data.property_city}` : ''}</span>
                </div>
              )}
            </div>

            {/* Quick Strategic Highlights Box */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 ${
              isLight ? 'text-slate-800' : 'text-slate-200'
            }`}>
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-[#151f2e] border-slate-800'
              }`}>
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Viabilidade</div>
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Auditoria Completa</div>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-[#151f2e] border-slate-800'
              }`}>
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <Compass size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estratégia</div>
                  <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">Entrada & Saída Mapeadas</div>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-[#151f2e] border-slate-800'
              }`}>
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Segurança</div>
                  <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">Aquisição Originária</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Jump Navigation Bar (when multiple sections) */}
        {data.sections && data.sections.length > 1 && (
          <div className={`p-2 rounded-2xl border flex items-center gap-1.5 overflow-x-auto shadow-sm no-scrollbar sticky top-[68px] z-30 backdrop-blur-md ${
            isLight ? 'bg-white/90 border-slate-200' : 'bg-[#0f1724]/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 shrink-0 hidden sm:inline">
              Navegar:
            </span>
            {data.sections.map((sec, idx) => (
              <a
                key={sec.id || idx}
                href={`#${sec.id || `section-${idx}`}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isLight
                    ? 'hover:bg-slate-100 text-slate-700 hover:text-emerald-700'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-emerald-400'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">
                  {idx + 1}
                </span>
                <span>{sec.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Section Cards List */}
        <div className="space-y-6">
          {data.sections.map((sec, idx) => {
            const isFirst = idx === 0;

            return (
              <section
                id={sec.id || `section-${idx}`}
                key={sec.id || idx}
                className={`rounded-3xl border p-6 sm:p-8 lg:p-9 transition-all space-y-5 shadow-lg scroll-mt-28 ${
                  isLight
                    ? 'bg-white border-slate-200/90 shadow-slate-200/60 hover:border-emerald-500/40'
                    : 'bg-[#0e1623] border-slate-800 shadow-black/40 hover:border-emerald-500/30'
                }`}
              >
                {/* Section Header */}
                <div className={`flex items-center justify-between border-b pb-4 ${
                  isLight ? 'border-slate-100' : 'border-slate-800/80'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-black text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-slate-100'
                    }`}>
                      {sec.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                    TJ INVEST AUDIT
                  </span>
                </div>

                {/* Content Renderer */}
                <div className="text-sm sm:text-[15px] leading-relaxed">
                  {sec.text ? (
                    <div className={`markdown-content space-y-4 ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h1: ({ node, ...props }) => (
                            <h4 className={`text-base sm:text-lg font-bold mt-4 mb-2 pb-1 border-b ${
                              isLight ? 'text-slate-900 border-slate-200' : 'text-white border-slate-800'
                            }`} {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h5 className={`text-sm sm:text-base font-bold mt-3 mb-1.5 ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`} {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h6 className={`text-xs sm:text-sm font-bold mt-2 mb-1 ${
                              isLight ? 'text-emerald-700' : 'text-emerald-400'
                            }`} {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="leading-relaxed mb-3" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="space-y-1.5 my-2.5 pl-4 list-disc marker:text-emerald-500" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="space-y-1.5 my-2.5 pl-4 list-decimal marker:text-amber-500" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-relaxed" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`} {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className={`p-3.5 my-3 rounded-2xl border-l-4 border-emerald-500 text-xs sm:text-sm ${
                              isLight ? 'bg-emerald-50/60 text-emerald-950 border-emerald-500' : 'bg-emerald-950/20 text-emerald-200 border-emerald-500'
                            }`} {...props} />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                              <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className={isLight ? 'bg-slate-100 text-slate-900 font-bold' : 'bg-slate-800/80 text-white font-bold'} {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-extrabold uppercase text-[11px] tracking-wider" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="p-3 border-b border-slate-100 dark:border-slate-800/60" {...props} />
                          ),
                        }}
                      >
                        {sec.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div 
                      className={`prose prose-sm max-w-none leading-relaxed overflow-x-auto ${
                        isLight ? 'text-slate-800' : 'prose-invert text-slate-200'
                      }`}
                      dangerouslySetInnerHTML={{ __html: sec.html || convertTextToFormattedHtml(sec.text) }}
                    />
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Direct WhatsApp Call-to-Action Card */}
        <div className={`rounded-3xl p-6 sm:p-8 border transition-all text-center space-y-4 shadow-xl ${
          isLight
            ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white border-emerald-600'
            : 'bg-gradient-to-r from-[#0d3b2f] via-[#092d24] to-[#06201a] text-white border-emerald-800/60'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-emerald-300">
            <PhoneCall size={24} />
          </div>
          <div className="max-w-xl mx-auto space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Fale com um Assessor Especialista TJ INVEST
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              Precisa de assistência para arrematação, estruturação jurídica ou representação no pregão? Converse diretamente com nossa equipe.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href="https://api.whatsapp.com/send?phone=5511999999999&text=Olá!%20Gostaria%20de%20tirar%20dúvidas%20sobre%20o%20leilão%20deste%20imóvel."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl text-xs font-black transition-all shadow-lg shadow-black/20 transform active:scale-95"
            >
              <MessageCircle size={16} className="text-emerald-700" />
              <span>Chamar no WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-950/40 hover:bg-emerald-950/60 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all"
            >
              <Printer size={16} />
              <span>Salvar Dossiê em PDF</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className={`pt-6 pb-12 text-center text-xs space-y-2 border-t transition-colors ${
          isLight ? 'text-slate-500 border-slate-200' : 'text-slate-500 border-slate-800'
        }`}>
          <div className="flex items-center justify-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <span>TJ INVEST</span>
            <span>•</span>
            <span>Inteligência & Auditoria em Leilões Judiciais e Extrajudiciais</span>
          </div>
          <p className="max-w-2xl mx-auto text-[11px] leading-relaxed text-slate-400">
            As análises contidas neste relatório são geradas a partir da documentação pública e autos do processo. Não dispensam a assessoria jurídica especializada e a devida verificação registral.
          </p>
        </footer>
      </main>
    </div>
  );
}
