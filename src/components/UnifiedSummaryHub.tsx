import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  FileText, 
  BookOpen, 
  Scale, 
  TrendingUp, 
  Compass, 
  CheckSquare, 
  Square, 
  Copy, 
  Download, 
  Printer, 
  Edit3, 
  Check, 
  RefreshCw, 
  Loader2, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { Property } from '../types';

export interface ModularSnippet {
  id: string;
  sourceTab: 'edital' | 'matricula' | 'processo' | 'simulacao' | 'smart' | 'regional' | 'custom';
  sourceTitle: string;
  category: string;
  title: string;
  content: string;
  selected: boolean;
  highlightType?: 'positive' | 'warning' | 'neutral';
}

interface UnifiedSummaryHubProps {
  property?: Property | null;
  state: any;
  updateState: (updates: any) => void;
  token?: string;
  selectedModel?: string;
  userApiKey?: string;
  metrics?: any;
  tir?: number;
  roi?: number;
  regionalData?: any;
}

export const UnifiedSummaryHub: React.FC<UnifiedSummaryHubProps> = ({
  property,
  state,
  updateState,
  token,
  selectedModel = 'gemini-3.7-flash',
  userApiKey,
  metrics,
  tir = 0,
  roi = 0,
  regionalData
}) => {
  const [snippets, setSnippets] = useState<ModularSnippet[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [customNoteCategory, setCustomNoteCategory] = useState('Observação');
  const [unifiedReportText, setUnifiedReportText] = useState<string>(state.unifiedSummaryText || '');
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to extract clean text from markdown sections
  const extractSection = (markdown: string | null | undefined, keywords: string[]): string => {
    if (!markdown || typeof markdown !== 'string') return '';
    const lines = markdown.split('\n');
    let capturing = false;
    let captured: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = line.startsWith('#');
      
      if (isHeader) {
        const lower = line.toLowerCase();
        const matches = keywords.some(k => lower.includes(k.toLowerCase()));
        if (matches) {
          capturing = true;
          captured.push(line);
          continue;
        } else if (capturing && (line.startsWith('# ') || line.startsWith('## '))) {
          // Stop at next major header
          break;
        }
      }
      
      if (capturing) {
        captured.push(line);
      }
    }

    return captured.join('\n').trim();
  };

  // Build snippet pool automatically from the active analyses
  useEffect(() => {
    const built: ModularSnippet[] = [];

    // 1. Edital Snippets
    if (state.editalAnalysis) {
      const datasRegras = extractSection(state.editalAnalysis, ['datas', 'prazos', 'cronograma', '1º leilão', 'lance']);
      const dividasRegras = extractSection(state.editalAnalysis, ['débitos', 'ônus', 'dívidas', 'iptu', 'condomínio', 'sub-rogação', 'despesas']);
      const condicoes = extractSection(state.editalAnalysis, ['parcelamento', 'pagamento', 'comissão', 'leiloeiro']);

      if (datasRegras) {
        built.push({
          id: 'edital-datas',
          sourceTab: 'edital',
          sourceTitle: 'Edital de Leilão',
          category: 'Regras e Prazos',
          title: 'Datas de Praça & Lances Mínimos',
          content: datasRegras.substring(0, 800),
          selected: true,
          highlightType: 'neutral'
        });
      }

      if (dividasRegras) {
        built.push({
          id: 'edital-dividas',
          sourceTab: 'edital',
          sourceTitle: 'Edital de Leilão',
          category: 'Passivos & Sub-rogação',
          title: 'Regras de Débitos (IPTU / Condomínio)',
          content: dividasRegras.substring(0, 800),
          selected: true,
          highlightType: dividasRegras.toLowerCase().includes('responsabilidade do arrematante') ? 'warning' : 'positive'
        });
      }

      if (condicoes) {
        built.push({
          id: 'edital-condicoes',
          sourceTab: 'edital',
          sourceTitle: 'Edital de Leilão',
          category: 'Condições Financeiras',
          title: 'Parcelamento & Comissão do Leiloeiro',
          content: condicoes.substring(0, 800),
          selected: true,
          highlightType: 'neutral'
        });
      }
    }

    // 2. Matrícula Snippets
    if (state.matriculaAnalysis) {
      const cadeiaRegistral = extractSection(state.matriculaAnalysis, ['cadeia', 'proprietários', 'histórico de aquisições', 'registro']);
      const gravames = extractSection(state.matriculaAnalysis, ['penhora', 'hipoteca', 'indisponibilidade', 'gravame', 'ônus']);
      const descricaoImovel = extractSection(state.matriculaAnalysis, ['descrição', 'imóvel', 'confrontações', 'área']);

      if (cadeiaRegistral) {
        built.push({
          id: 'matr-cadeia',
          sourceTab: 'matricula',
          sourceTitle: 'Matrícula Imobiliária',
          category: 'Cadeia de Domínio',
          title: 'Cadeia Registral & Titularidade',
          content: cadeiaRegistral.substring(0, 800),
          selected: true,
          highlightType: 'neutral'
        });
      }

      if (gravames) {
        built.push({
          id: 'matr-gravames',
          sourceTab: 'matricula',
          sourceTitle: 'Matrícula Imobiliária',
          category: 'Ônus & Averbações',
          title: 'Penhoras e Indisponibilidades',
          content: gravames.substring(0, 800),
          selected: true,
          highlightType: gravames.toLowerCase().includes('execução') ? 'warning' : 'positive'
        });
      }

      if (descricaoImovel) {
        built.push({
          id: 'matr-descricao',
          sourceTab: 'matricula',
          sourceTitle: 'Matrícula Imobiliária',
          category: 'Dados Cadastrais',
          title: 'Descrição & Confrontações do Lote',
          content: descricaoImovel.substring(0, 800),
          selected: true,
          highlightType: 'neutral'
        });
      }
    }

    // 3. Processo Judicial Snippets
    if (state.processAnalysis) {
      const riscosProcessuais = extractSection(state.processAnalysis, ['risco', 'nulidade', 'recursos', 'intimação', 'citação']);
      const auditoria = extractSection(state.processAnalysis, ['auditoria', 'página a página', 'peças']);
      const parecerProcesso = extractSection(state.processAnalysis, ['parecer', 'conclusão', 'estratégia', 'desocupação']);

      if (riscosProcessuais) {
        built.push({
          id: 'proc-riscos',
          sourceTab: 'processo',
          sourceTitle: 'Processo Judicial',
          category: 'Segurança Jurídica',
          title: 'Riscos de Nulidade & Recursos',
          content: riscosProcessuais.substring(0, 800),
          selected: true,
          highlightType: 'warning'
        });
      }

      if (auditoria) {
        built.push({
          id: 'proc-auditoria',
          sourceTab: 'processo',
          sourceTitle: 'Processo Judicial',
          category: 'Histórico dos Autos',
          title: 'Auditoria das Peças Chave do Processo',
          content: auditoria.substring(0, 800),
          selected: true,
          highlightType: 'neutral'
        });
      }

      if (parecerProcesso) {
        built.push({
          id: 'proc-parecer',
          sourceTab: 'processo',
          sourceTitle: 'Processo Judicial',
          category: 'Parecer Processual',
          title: 'Estratégia de Desocupação & Posse',
          content: parecerProcesso.substring(0, 800),
          selected: true,
          highlightType: 'positive'
        });
      }
    }

    // 4. Simulação Financeira
    if (metrics) {
      const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
      built.push({
        id: 'simul-kpis',
        sourceTab: 'simulacao',
        sourceTitle: 'Simulação Financeira',
        category: 'Retorno & Lucro',
        title: 'KPIs Financeiros & Custo Total',
        content: `**Valor de Mercado Estimado:** ${formatCurrency(metrics.saleValue)}\n**Lance Mínimo / Pretendido:** ${formatCurrency(metrics.bid)}\n**Custos e Despesas Adicionais:** ${formatCurrency(metrics.totalExpenses || metrics.totalUpfrontExpenses)}\n**Lucro Líquido Projetado:** ${formatCurrency(metrics.netProfit)}\n**Retorno sobre Investimento (ROI):** ${(roi || 0).toFixed(1)}%\n**Taxa Interna de Retorno (TIR a.a.):** ${(tir || 0).toFixed(1)}%`,
        selected: true,
        highlightType: (roi > 25) ? 'positive' : 'neutral'
      });
    }

    // 5. Inteligência Regional
    if (regionalData && regionalData.address) {
      built.push({
        id: 'regional-kpis',
        sourceTab: 'regional',
        sourceTitle: 'Inteligência Regional',
        category: 'Território & Demografia',
        title: `Vizinhança, Renda & Riscos (${regionalData.address})`,
        content: `**Renda & Perfil dos Moradores:** ${regionalData.incomeProfile || 'Pendente'}\n**Risco de Enchentes:** ${regionalData.floodRisk || 'Baixo'}\n**Transporte e Mobilidade:** ${regionalData.transportation || 'Pendente'}\n**Faculdades e Hospitais:** ${regionalData.healthAndEducation || 'Pendente'}\n**Área Medida:** ${regionalData.measuredArea || 0} m² (Matrícula: ${regionalData.registeredArea || 0} m²)`,
        selected: true,
        highlightType: 'neutral'
      });
    }

    setSnippets(built);

    // Initial compile if text is empty
    if (!state.unifiedSummaryText && built.length > 0) {
      const initialCompilation = generateCompilationText(built);
      setUnifiedReportText(initialCompilation);
      updateState({ unifiedSummaryText: initialCompilation });
    }
  }, [state.editalAnalysis, state.matriculaAnalysis, state.processAnalysis, metrics, regionalData]);

  const toggleSnippet = (id: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const generateCompilationText = (snippetList: ModularSnippet[]) => {
    const selectedList = snippetList.filter(s => s.selected);
    if (selectedList.length === 0) return "Nenhum bloco selecionado para compor o Resumão.";

    let compiled = `# 📑 Resumão Unificado do Leilão\n`;
    if (property?.title) {
      compiled += `**Imóvel:** ${property.title} | **Localização:** ${property.city || ''} - ${property.state || ''}\n\n---\n\n`;
    }

    const grouped: Record<string, ModularSnippet[]> = {};
    selectedList.forEach(item => {
      if (!grouped[item.sourceTitle]) grouped[item.sourceTitle] = [];
      grouped[item.sourceTitle].push(item);
    });

    Object.entries(grouped).forEach(([sourceTitle, items]) => {
      compiled += `## 🔹 ${sourceTitle.toUpperCase()}\n\n`;
      items.forEach(item => {
        compiled += `### ${item.title} (${item.category})\n${item.content}\n\n`;
      });
      compiled += `---\n\n`;
    });

    return compiled;
  };

  const handleApplySelectedToEditor = () => {
    const compiled = generateCompilationText(snippets);
    setUnifiedReportText(compiled);
    updateState({ unifiedSummaryText: compiled });
  };

  const handleAddCustomNote = () => {
    if (!customNote.trim()) return;
    const newSnippet: ModularSnippet = {
      id: `custom-${Date.now()}`,
      sourceTab: 'custom',
      sourceTitle: 'Anotações Estratégicas do Investidor',
      category: customNoteCategory,
      title: customNoteCategory,
      content: customNote.trim(),
      selected: true,
      highlightType: 'positive'
    };
    setSnippets(prev => [...prev, newSnippet]);
    setCustomNote('');
  };

  // AI Master Synthesis: "Ligar os Pontos"
  const handleSynthesizeWithAi = async () => {
    const selectedSnippets = snippets.filter(s => s.selected);
    if (selectedSnippets.length === 0) {
      alert("Selecione ao menos um bloco de informação para que a IA possa ligar os pontos.");
      return;
    }

    setSynthesizing(true);
    try {
      const promptText = `Você é o principal estrategista de investimentos imobiliários e perito jurídico em arrematações de leilão.
Sua missão é LIGAR TODOS OS PONTOS deste imóvel em leilão, cruzando os dados das diversas etapas (Edital, Matrícula, Processo Judicial, Financeiro e Inteligência Territorial) em um ÚNICO RESUMÃO EXECUTIVO CENTRALIZADO.

DADOS BRUTOS SELECIONADOS PELO INVESTIDOR:
${selectedSnippets.map(s => `[FONTE: ${s.sourceTitle} | SEÇÃO: ${s.title}]\n${s.content}`).join('\n\n---\n\n')}

DIRETRIZES PARA O RESUMÃO UNIFICADO ("LIGANDO OS PONTOS"):
1. Veredito Executivo Direto: Vale a pena arrematar? Qual o teto seguro de lance e retorno esperado?
2. Conexão Jurídica (Edital x Matrícula x Processo): Quem são os devedores/proprietários? Há risco de nulidade na citação? As penhoras da matrícula são canceladas pela arrematação ou há credores com preferência?
3. Conexão Operacional & Territorial: Desocupação (fácil, média ou difícil), tempo estimado de imissão de posse, padrão da vizinhança e riscos de alagamento/infraestrutura.
4. Engenharia Financeira: Lucro projetado, custos ocultos (ITBI, dívidas, reformas) e ROI real.
5. Plano de Ação Passo a Passo para o Arrematante (Checklist prático antes, durante e pós-leilão).

Formate em Markdown executivo de altíssimo padrão, elegante, direto e com tabelas ou destaques quando oportuno.`;

      const res = await fetch('/api/analyze-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel,
          apiKey: userApiKey
        })
      });

      if (!res.ok) {
        throw new Error("Erro na resposta do servidor.");
      }

      const data = await res.json();
      const synthesizedMarkdown = data.analysis || data.text || "";
      setUnifiedReportText(synthesizedMarkdown);
      updateState({ unifiedSummaryText: synthesizedMarkdown });

    } catch (err: any) {
      console.error(err);
      alert(`Falha ao sintetizar resumo unificado: ${err.message || err}`);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(unifiedReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans" id="unified-summary-hub">
      {/* Header Banner */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/15 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-primary font-serif">Resumão Unificado & Conexão dos Pontos</h3>
              <p className="text-sm text-brand-ink/60 mt-1 max-w-3xl">
                Reúna, selecione e conecte as conclusões de cada etapa (Edital, Matrícula, Processo, Financeiro e Região) para compor um parecer executivo centralizado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSynthesizeWithAi}
              disabled={synthesizing || snippets.filter(s => s.selected).length === 0}
              className="px-5 py-3 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {synthesizing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              <span>{synthesizing ? 'Ligando os Pontos...' : 'Sintetizar com IA (Ligar os Pontos)'}</span>
            </button>
            <button
              onClick={handleApplySelectedToEditor}
              className="px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <RefreshCw size={14} />
              <span>Compilar Selecionados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Modular Snippets Extracted */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-brand-paper p-6 sm:p-7 rounded-[2rem] border border-brand-primary/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-brand-primary" />
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                  Blocos Extraídos das Abas
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
                {snippets.filter(s => s.selected).length} de {snippets.length} ativos
              </span>
            </div>

            <p className="text-xs text-brand-ink/50 leading-relaxed">
              Marque os blocos que deseja incluir no Resumão ou adicione apontamentos personalizados:
            </p>

            {/* List of Snippets */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {snippets.length === 0 && (
                <div className="p-8 text-center bg-brand-bg/50 rounded-2xl border border-dashed border-brand-primary/20 space-y-2">
                  <p className="text-xs text-brand-ink/60 font-medium">Nenhum bloco extraído ainda.</p>
                  <p className="text-[11px] text-brand-ink/40">Gere as análises nas abas Edital, Matrícula ou Processo para alimentar este painel automaticamente.</p>
                </div>
              )}

              {snippets.map(snippet => (
                <div 
                  key={snippet.id}
                  onClick={() => toggleSnippet(snippet.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer space-y-2 select-none",
                    snippet.selected 
                      ? "bg-brand-bg/80 border-brand-primary/40 shadow-sm" 
                      : "bg-brand-bg/20 border-brand-border/40 opacity-60 hover:opacity-100"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-brand-primary shrink-0">
                        {snippet.selected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                        {snippet.sourceTitle}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                      snippet.highlightType === 'warning' ? "bg-amber-500/10 text-amber-700 border border-amber-500/20" :
                      snippet.highlightType === 'positive' ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" :
                      "bg-brand-primary/10 text-brand-primary"
                    )}>
                      {snippet.category}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-brand-ink/90">{snippet.title}</h5>
                  <p className="text-[11px] text-brand-ink/70 line-clamp-3 leading-relaxed font-mono">
                    {snippet.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Custom Snippet Inserter */}
            <div className="pt-4 border-t border-brand-primary/10 space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-primary flex items-center gap-1.5">
                <Plus size={12} />
                Adicionar Ponto Estratégico Personalizado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customNoteCategory}
                  onChange={e => setCustomNoteCategory(e.target.value)}
                  placeholder="Categoria (ex: Estratégia)"
                  className="w-1/3 bg-brand-bg border border-brand-primary/15 rounded-xl px-3 py-2 text-xs font-bold text-brand-ink focus:outline-none"
                />
                <input
                  type="text"
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder="Digite sua observação estratégica..."
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomNote()}
                  className="flex-1 bg-brand-bg border border-brand-primary/15 rounded-xl px-3 py-2 text-xs font-medium text-brand-ink focus:outline-none"
                />
                <button
                  onClick={handleAddCustomNote}
                  disabled={!customNote.trim()}
                  className="px-3 py-2 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Unified Synthesis Canvas */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-primary/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-primary" />
                  Parecer & Resumão Executivo Consolidado
                </h4>
                <p className="text-xs text-brand-ink/50 mt-0.5">Documento mestre pronto para tomada de decisão ou envio ao cliente</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingRaw(!isEditingRaw)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer",
                    isEditingRaw 
                      ? "bg-brand-primary text-black border-brand-primary" 
                      : "bg-brand-bg border-brand-primary/15 text-brand-ink hover:text-brand-primary"
                  )}
                >
                  <Edit3 size={13} />
                  <span>{isEditingRaw ? 'Ver Formatado' : 'Editar Texto'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 text-brand-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 text-brand-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer no-print"
                >
                  <Printer size={13} />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>

            {/* Document Body */}
            {isEditingRaw ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">
                  Editor Markdown Direto
                </label>
                <textarea
                  value={unifiedReportText}
                  onChange={e => {
                    setUnifiedReportText(e.target.value);
                    updateState({ unifiedSummaryText: e.target.value });
                  }}
                  rows={20}
                  className="w-full bg-brand-bg border border-brand-primary/15 rounded-2xl p-5 text-sm font-mono text-brand-ink leading-relaxed focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y"
                  placeholder="O resumo unificado consolidado aparecerá aqui..."
                />
              </div>
            ) : (
              <div className="bg-brand-bg/30 p-6 sm:p-8 rounded-2xl border border-brand-primary/10 min-h-[450px]">
                {unifiedReportText ? (
                  <div className="markdown-body font-sans text-brand-ink/90 leading-relaxed text-sm antialiased space-y-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {unifiedReportText}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <Layers size={40} className="mx-auto text-brand-primary/30" />
                    <div className="space-y-1">
                      <p className="font-bold text-brand-ink/70">Nenhum Resumo Sintetizado</p>
                      <p className="text-xs text-brand-ink/40 max-w-sm mx-auto">
                        Selecione os blocos desejados na coluna ao lado e clique no botão <strong>"Sintetizar com IA"</strong> ou <strong>"Compilar Selecionados"</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
