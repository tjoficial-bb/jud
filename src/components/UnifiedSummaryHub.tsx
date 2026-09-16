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
  Maximize2,
  Save,
  PenTool,
  Sliders,
  AlignLeft,
  Columns
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
  
  // Custom user writing field state
  const [customUserInput, setCustomUserInput] = useState('');
  const [customCategory, setCustomCategory] = useState('Parecer do Investidor');
  const [userWritingSavedNotice, setUserWritingSavedNotice] = useState(false);

  // Main summary text state
  const [unifiedReportText, setUnifiedReportText] = useState<string>(state.unifiedSummaryText || '');
  const [viewMode, setViewMode] = useState<'preview' | 'editor' | 'split'>('editor');
  const [synthesizing, setSynthesizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync external state changes
  useEffect(() => {
    if (state.unifiedSummaryText && state.unifiedSummaryText !== unifiedReportText) {
      setUnifiedReportText(state.unifiedSummaryText);
    }
  }, [state.unifiedSummaryText]);

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
      const parecerProcesso = extractSection(state.processAnalysis, ['parecer', 'conclusão', 'estratégia', 'desocupação', 'prós e contras']);

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

    // 5. Inteligência Regional & Medição
    if (regionalData && regionalData.address) {
      built.push({
        id: 'regional-kpis',
        sourceTab: 'regional',
        sourceTitle: 'Inteligência Regional & Mapas',
        category: 'Território & Demografia',
        title: `Vizinhança, Renda & Riscos (${regionalData.address})`,
        content: `**Renda & Perfil dos Moradores:** ${regionalData.incomeProfile || 'Mapeado'}\n**Risco de Enchentes:** ${regionalData.floodRisk || 'Baixo'}\n**Transporte e Mobilidade:** ${regionalData.transportation || 'Mapeado'}\n**Faculdades e Hospitais:** ${regionalData.healthAndEducation || 'Mapeado'}\n**Área Medida Automática:** ${regionalData.measuredArea || 0} m² (Matrícula: ${regionalData.registeredArea || 0} m²)`,
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

  // Direct append of custom written text into the main summary
  const handleAppendCustomTextToSummary = () => {
    if (!customUserInput.trim()) return;
    
    const formattedBlock = `\n\n## ✍️ ${customCategory.toUpperCase()}\n${customUserInput.trim()}\n`;
    const newFullText = (unifiedReportText ? unifiedReportText : '') + formattedBlock;
    
    setUnifiedReportText(newFullText);
    updateState({ unifiedSummaryText: newFullText });

    // Also add to snippets list as an active module
    const newSnippet: ModularSnippet = {
      id: `custom-${Date.now()}`,
      sourceTab: 'custom',
      sourceTitle: 'Anotações & Informações do Usuário',
      category: customCategory,
      title: customCategory,
      content: customUserInput.trim(),
      selected: true,
      highlightType: 'positive'
    };
    setSnippets(prev => [...prev, newSnippet]);

    setCustomUserInput('');
    setUserWritingSavedNotice(true);
    setTimeout(() => setUserWritingSavedNotice(false), 2500);
  };

  const handleInsertTemplate = (templateName: string) => {
    let textToInsert = '';
    if (templateName === 'parecer') {
      textToInsert = `**Parecer do Investidor:**\n- Viabilidade da Operação: Alta / Recomendada\n- Lance Máximo Sugerido: R$ \n- Expectativa de Desocupação: 60 a 90 dias via acordo amigável\n- Margem de Segurança: `;
    } else if (templateName === 'estrategia') {
      textToInsert = `**Estratégia de Entrada e Saída:**\n1. Participar no 2º Leilão com lance teto de R$ \n2. Notificar ocupante em até 48h após expedição da carta de arrematação\n3. Realizar reforma estética rápida (pintura e reparos)\n4. Colocar para revenda abaixo da média de mercado para giro rápido`;
    } else if (templateName === 'riscos') {
      textToInsert = `**Pontos de Atenção & Mitigação de Riscos:**\n- Débitos Condominiais: Sub-rogam no preço conforme edital / Negociar diretamente com o síndico\n- Ocupação: Ocupado pelo próprio executado\n- Estado de Conservação: Bom estado apurado via satélite/visita externa`;
    }
    setCustomUserInput(prev => (prev ? prev + '\n\n' : '') + textToInsert);
  };

  // AI Master Synthesis: "Ligar os Pontos"
  const handleSynthesizeWithAi = async () => {
    const selectedSnippets = snippets.filter(s => s.selected);
    if (selectedSnippets.length === 0 && !customUserInput.trim()) {
      alert("Selecione ao menos um bloco de informação ou digite suas observações para que a IA possa ligar os pontos.");
      return;
    }

    setSynthesizing(true);
    try {
      const promptText = `Você é o principal estrategista de investimentos imobiliários e perito jurídico em arrematações de leilão no Brasil.
Sua missão é LIGAR TODOS OS PONTOS deste imóvel em leilão, cruzando os dados das diversas etapas (Edital, Matrícula, Processo Judicial, Financeiro, Inteligência Territorial e as Informações Escritas pelo Investidor) em um ÚNICO RESUMÃO EXECUTIVO CENTRALIZADO.

DADOS BRUTOS SELECIONADOS PELO INVESTIDOR:
${selectedSnippets.map(s => `[FONTE: ${s.sourceTitle} | SEÇÃO: ${s.title}]\n${s.content}`).join('\n\n---\n\n')}

${customUserInput.trim() ? `[INFORMAÇÕES & ANOTAÇÕES ESCRITAS DIRETAMENTE PELO INVESTIDOR]:\n${customUserInput.trim()}` : ''}

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

  const handleManualSave = () => {
    updateState({ unifiedSummaryText: unifiedReportText });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
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
              <h3 className="text-2xl font-bold text-brand-primary font-serif">Resumão Unificado & Central de Escrita</h3>
              <p className="text-sm text-brand-ink/60 mt-1 max-w-3xl">
                Reúna, escreva suas próprias conclusões e conecte as etapas (Edital, Matrícula, Processo, Financeiro e Região) em um parecer executivo centralizado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSynthesizeWithAi}
              disabled={synthesizing || (snippets.filter(s => s.selected).length === 0 && !customUserInput.trim())}
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
              <span>Compilar Blocos Selecionados</span>
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED USER WRITING FIELD (Campo de Escrita de Informações do Usuário) */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/20 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-primary/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <PenTool size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                Campo de Escrita & Informações do Investidor
              </h4>
              <p className="text-xs text-brand-ink/50">
                Escreva suas anotações, condições de lance ou parecer próprio para incluir diretamente no Resumão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userWritingSavedNotice && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                <Check size={14} /> Inserido no Resumão!
              </span>
            )}
            <button
              onClick={handleAppendCustomTextToSummary}
              disabled={!customUserInput.trim()}
              className="px-4 py-2 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider disabled:opacity-40"
            >
              <Plus size={14} />
              <span>Inserir no Resumão</span>
            </button>
          </div>
        </div>

        {/* Categories & Preset Quick Templates */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50">Tipo:</span>
            <select
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              className="bg-brand-bg border border-brand-primary/20 rounded-xl px-3 py-1.5 text-xs font-bold text-brand-primary focus:outline-none"
            >
              <option value="Parecer do Investidor">Parecer do Investidor</option>
              <option value="Estratégia de Lance">Estratégia de Lance</option>
              <option value="Condições de Entrada e Saída">Condições de Entrada e Saída</option>
              <option value="Alerta de Risco">Alerta de Risco</option>
              <option value="Observações da Vistoria">Observações da Vistoria</option>
              <option value="Proposta para o Cliente">Proposta para o Cliente</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Modelos Rápidos:</span>
            <button
              onClick={() => handleInsertTemplate('parecer')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 text-brand-ink hover:text-brand-primary transition-all"
            >
              + Modelo Parecer
            </button>
            <button
              onClick={() => handleInsertTemplate('estrategia')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 text-brand-ink hover:text-brand-primary transition-all"
            >
              + Modelo Estratégia
            </button>
            <button
              onClick={() => handleInsertTemplate('riscos')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 text-brand-ink hover:text-brand-primary transition-all"
            >
              + Modelo Riscos
            </button>
          </div>
        </div>

        {/* Text Input Area */}
        <textarea
          value={customUserInput}
          onChange={e => setCustomUserInput(e.target.value)}
          rows={4}
          placeholder="Digite aqui livremente suas anotações, conclusões, valores combinados com o cliente, estratégias de desocupação ou qualquer informação estratégica para compor o Resumão Unificado..."
          className="w-full bg-brand-bg border border-brand-primary/20 rounded-2xl p-4 text-sm font-medium text-brand-ink leading-relaxed focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y placeholder:text-brand-ink/30"
        />
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
              Marque os blocos que deseja incluir no Resumão ou desmarque os que deseja omitir:
            </p>

            {/* List of Snippets */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {snippets.length === 0 && (
                <div className="p-8 text-center bg-brand-bg/50 rounded-2xl border border-dashed border-brand-primary/20 space-y-2">
                  <p className="text-xs text-brand-ink/60 font-medium">Nenhum bloco extraído ainda.</p>
                  <p className="text-[11px] text-brand-ink/40">Gere as análises nas abas Edital, Matrícula, Processo ou Região para alimentar este painel automaticamente.</p>
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
          </div>
        </div>

        {/* Right Column: Unified Synthesis Canvas (Live Editor + Formatted Preview) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-primary/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-primary" />
                  Resumão Executivo Consolidado
                </h4>
                <p className="text-xs text-brand-ink/50 mt-0.5">Edite diretamente ou visualize a formatação final do documento</p>
              </div>

              {/* View Mode & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-brand-bg p-1 rounded-xl border border-brand-primary/15 flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('editor')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                      viewMode === 'editor' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/70 hover:text-brand-primary"
                    )}
                  >
                    <Edit3 size={13} />
                    <span>Editor</span>
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                      viewMode === 'preview' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/70 hover:text-brand-primary"
                    )}
                  >
                    <AlignLeft size={13} />
                    <span>Formatado</span>
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={cn(
                      "hidden sm:flex px-2.5 py-1 rounded-lg text-xs font-bold items-center gap-1 transition-all cursor-pointer",
                      viewMode === 'split' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/70 hover:text-brand-primary"
                    )}
                  >
                    <Columns size={13} />
                    <span>Dividido</span>
                  </button>
                </div>

                <button
                  onClick={handleManualSave}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {savedNotice ? <Check size={13} className="text-emerald-600" /> : <Save size={13} />}
                  <span>{savedNotice ? 'Salvo!' : 'Salvar'}</span>
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

            {/* Document Body View Controller */}
            {viewMode === 'editor' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-brand-ink/50">
                  <span>Edição Direta do Texto do Resumão</span>
                  <span>{unifiedReportText.length} caracteres</span>
                </div>
                <textarea
                  value={unifiedReportText}
                  onChange={e => {
                    setUnifiedReportText(e.target.value);
                    updateState({ unifiedSummaryText: e.target.value });
                  }}
                  rows={22}
                  className="w-full bg-brand-bg border border-brand-primary/20 rounded-2xl p-5 text-sm font-mono text-brand-ink leading-relaxed focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y"
                  placeholder="O texto unificado aparecerá aqui para você editar livremente..."
                />
              </div>
            )}

            {viewMode === 'preview' && (
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
                        Escreva suas informações no campo acima ou selecione blocos e clique em <strong>"Sintetizar com IA"</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'split' && (
              <div className="grid grid-cols-2 gap-4 min-h-[480px]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 block mb-1">
                    Editor Markdown
                  </span>
                  <textarea
                    value={unifiedReportText}
                    onChange={e => {
                      setUnifiedReportText(e.target.value);
                      updateState({ unifiedSummaryText: e.target.value });
                    }}
                    rows={22}
                    className="w-full h-full min-h-[440px] bg-brand-bg border border-brand-primary/20 rounded-2xl p-4 text-xs font-mono text-brand-ink leading-relaxed focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 block mb-1">
                    Prévia em Tempo Real
                  </span>
                  <div className="h-full min-h-[440px] max-h-[500px] overflow-y-auto bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 markdown-body text-xs leading-relaxed text-brand-ink/90">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {unifiedReportText || "*Nenhum conteúdo para exibir*"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
