import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  TrendingUp, 
  Home, 
  ShieldCheck, 
  AlertCircle, 
  Lightbulb, 
  Send, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  Award,
  DollarSign,
  Gavel,
  FileText,
  Compass,
  LogOut,
  LogIn,
  Zap,
  Clock,
  ArrowRight,
  PieChart,
  CheckCircle2
} from 'lucide-react';

export interface AssessorPitchAndTipsCardProps {
  contextType: 'matricula' | 'edital' | 'processo' | 'smart' | 'assessoria' | 'master' | 'dossier';
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  valuation?: number;
  minBid?: number;
  expectedSaleValue?: number;
  estimatedProfit?: number;
  roi?: number;
  tir?: number;
  customSummary?: string;
  customTips?: string[];
  rawAnalysisData?: any;
}

export const AssessorPitchAndTipsCard: React.FC<AssessorPitchAndTipsCardProps> = ({
  contextType,
  propertyTitle = 'Imóvel em Oportunidade de Leilão',
  propertyAddress = '',
  propertyCity = '',
  propertyState = '',
  valuation = 0,
  minBid = 0,
  expectedSaleValue = 0,
  estimatedProfit = 0,
  roi = 0,
  tir = 0,
  customSummary,
  customTips,
  rawAnalysisData
}) => {
  const [activeTab, setActiveTab] = useState<'investidor' | 'moradia' | 'entrada' | 'saida' | 'incentivos' | 'dicas' | 'objecoes'>('investidor');
  const [copiedInvestor, setCopiedInvestor] = useState(false);
  const [copiedBuyer, setCopiedBuyer] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Formatter helpers
  const formatMoney = (val: number) => {
    if (!val || isNaN(val) || val <= 0) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const calcDiscount = () => {
    if (valuation > 0 && minBid > 0 && valuation > minBid) {
      return Math.round(((valuation - minBid) / valuation) * 100);
    }
    return 50; // default estimated 2nd auction discount
  };

  const discountPercent = calcDiscount();
  const economyValue = valuation > minBid && minBid > 0 ? valuation - minBid : (valuation > 0 ? valuation * 0.5 : 0);

  // Derive contextual summary based on contextType and data
  const getContextualSummary = (): string => {
    if (customSummary && customSummary.trim().length > 0) return customSummary;

    switch (contextType) {
      case 'matricula':
        return `A auditoria registral confirma a higidez da cadeia de domínio da matrícula. Todos os gravames anteriores (penhoras, hipotecas e alienações fiduciárias) serão cancelados judicialmente com a expedição da Carta de Arrematação, assegurando aquisição originária 100% desembaraçada. Estratégia recomendada: arrematação com até ${discountPercent}% de desconto e saída por revenda express em 90 a 180 dias.`;
      case 'edital':
        return `O edital apresenta condições comerciais altamente favoráveis, com desconto de até ${discountPercent}% na 2ª praça. Há previsão expressa de sub-rogação de débitos fiscais (IPTU) no preço arrematado (Art. 130 CTN) e possibilidade de parcelamento judicial (Art. 895 CPC com 25% de entrada + até 30x corrigidas), alavancando a TIR da operação para patamares superiores a 35% a.a.`;
      case 'processo':
        return `O processo judicial foi instruído com citação e intimações regulares de todas as partes e coproprietários. O risco de nulidade é estritamente controlado e a arrematação confere ao comprador o direito imediato ao Mandado de Imissão na Posse expedido diretamente pelo Magistrado, garantindo segurança jurídica plena do capital investido.`;
      case 'smart':
        return `A Análise Smart de Riscos consolidada classifica esta oportunidade com excelente índice de viabilidade. Os custos operacionais (desocupação, ITBI, registro e comissão) estão integralmente mapeados e precificados na simulação, assegurando ampla margem de segurança e assimetria positiva de retorno financeiro.`;
      case 'assessoria':
        return `Parecer de assessoria jurídica e financeira favorável: o imóvel possui documentação apta para arrematação com proteção patrimonial de primeiro nível. A estratégia combinada prevê entrada com teto de lance disciplinado, acompanhamento processual completo pela TJ INVEST e plano de liquidação com retorno projetado acima de 25%.`;
      case 'dossier':
      case 'master':
      default:
        return `Oportunidade de leilão selecionada e auditada com excelente viabilidade técnico-jurídica. Avaliado em ${formatMoney(valuation)} com lance inicial em ${formatMoney(minBid)}, proporcionando uma margem bruta atrativa tanto para investidores focados em revenda express/renda quanto para famílias que buscam moradia de alto padrão pagando metade do valor.`;
    }
  };

  // Derive contextual tips for the advisor
  const getContextualTips = (): string[] => {
    if (customTips && customTips.length > 0) return customTips;

    switch (contextType) {
      case 'matricula':
        return [
          "Dica Registral: Enfatize para o cliente que a arrematação judicial é modalidade de 'aquisição originária', ou seja, o imóvel nasce limpo no nome dele.",
          "Dica de Cartório: Já providencie antecipadamente a minuta do requerimento de cancelamento de penhoras para apresentar junto à Carta de Arrematação no RGI.",
          "Dica Tributária: Solicite a certidão de dados cadastrais (IPTU/SQL) junto à prefeitura local para conferir a metragem real versus a matrícula."
        ];
      case 'edital':
        return [
          "Gatilho de Alavancagem: Para investidores, destaque o parcelamento judicial (Art. 895 CPC: 25% entrada + 30x sem juros remuneratórios, apenas correção monetária) para disparar a TIR.",
          "Transparência da Comissão: Deixe claro desde o início que a comissão do leiloeiro (5%) é taxa padrão de lei e já está contemplada no planejamento financeiro.",
          "Habilitação Prévia: Garanta que o cliente realize o cadastro na plataforma do leiloeiro com no mínimo 48h de antecedência para evitar bloqueios no dia do pregão."
        ];
      case 'processo':
        return [
          "Quebra de Medo: Mostre que o processo já ultrapassou a fase probatória e a fase de recursos preclusos, tornando a arrematação um ato jurídico perfeito e acabado.",
          "Estratégia de Desocupação: Informe que 80% das desocupações são resolvidas com acordo amigável rápido de auxílio-mudança, mas que há o suporte do Mandado de Imissão na Posse pelo juiz como garantia.",
          "Tranquilidade Total: Venda a tranquilidade de que a assessoria da TJ INVEST conduzirá todas as petições no processo sem que o cliente precise comparecer ao fórum."
        ];
      case 'smart':
      case 'assessoria':
      case 'dossier':
      case 'master':
      default:
        return [
          "Pitch Direto: 'Você compra um imóvel com 40% a 50% de desconto e nós cuidamos de toda a parte jurídica, documentação e entrega da chave na sua mão.'",
          "Foco em Delegar: Clientes de alta renda (médicos, empresários, executivos) valorizam o tempo e a segurança jurídica mais do que tentar aprender leilão por conta própria.",
          "Margem de Segurança: Apresente o preço de arrematação comparado aos imóveis vizinhos vendidos na mesma rua/bairro para gerar prova visual de oportunidade."
        ];
    }
  };

  // Scripts de Captação para WhatsApp
  const generateInvestorPitch = (): string => {
    const loc = propertyCity ? `${propertyCity}${propertyState ? '/' + propertyState : ''}` : 'excelente localização';
    const valStr = valuation > 0 ? formatMoney(valuation) : 'Valor de Mercado Elevado';
    const bidStr = minBid > 0 ? formatMoney(minBid) : 'Com até 50% de desconto';
    const lucStr = estimatedProfit > 0 ? formatMoney(estimatedProfit) : (valuation > minBid && minBid > 0 ? formatMoney(valuation - minBid) : 'Alta Rentabilidade');
    const roiStr = roi > 0 ? `${roi.toFixed(1)}%` : '30% a 60%';

    return `*🎯 OPORTUNIDADE EXCLUSIVA DE INVESTIMENTO EM LEILÃO*\n\n` +
      `Olá! Encontrei uma excelente oportunidade de arrematação com alto potencial de lucro e segurança jurídica auditada:\n\n` +
      `📍 *Imóvel:* ${propertyTitle}\n` +
      `📍 *Localização:* ${loc} ${propertyAddress ? `(${propertyAddress})` : ''}\n` +
      `📊 *Valor de Avaliação:* ${valStr}\n` +
      `💰 *Lance Mínimo Sugerido:* ${bidStr} (~${discountPercent}% de desconto)\n` +
      `🚀 *Margem Bruta Estimada:* ${lucStr}\n` +
      `📈 *Projeção de ROI:* ${roiStr}\n\n` +
      `*🛡️ SEGURANÇA JURÍDICA E OPERACIONAL:*\n` +
      `Já realizamos a auditoria completa de edital, matrícula e processo. O imóvel conta com viabilidade jurídica aprovada e possibilidade de pagamento parcelado (Art. 895 CPC).\n\n` +
      `Nossa assessoria cuida de absolutamente tudo: da habilitação no leilão, defesa jurídica, transferência cartorária até a entrega das chaves desocupadas.\n\n` +
      `Podemos conversar 5 minutos hoje para eu te apresentar o dossiê completo desta oportunidade?`;
  };

  const generateHomeBuyerPitch = (): string => {
    const loc = propertyCity ? `${propertyCity}${propertyState ? '/' + propertyState : ''}` : 'ótima localização';
    const valStr = valuation > 0 ? formatMoney(valuation) : 'Preço de mercado';
    const bidStr = minBid > 0 ? formatMoney(minBid) : 'Metade do valor de mercado';
    const econStr = economyValue > 0 ? formatMoney(economyValue) : 'Mais de 40% de economia';

    return `*🏡 CONQUISTE SUA CASA PRÓPRIA COM ATÉ 50% DE ECONOMIA*\n\n` +
      `Olá! Sabia que é possível comprar seu próximo imóvel com segurança absoluta e pagando praticamente a METADE do preço de mercado através de leilão imobiliário?\n\n` +
      `Mapeei esta excelente oportunidade:\n` +
      `📍 *Imóvel:* ${propertyTitle}\n` +
      `📍 *Região:* ${loc}\n` +
      `🏷️ *Valor Normal de Mercado:* ${valStr}\n` +
      `✨ *Preço de Oportunidade:* ${bidStr}\n` +
      `💰 *Economia para sua Família:* Cerca de ${econStr}\n\n` +
      `*🤝 POR QUE É SEGURO CONOSCO?*\n` +
      `Você não precisa se preocupar com nada. Nossa assessoria especializada faz a análise jurídica de 100% dos documentos, resolve todas as certidões e garante a escritura direta no seu nome.\n\n` +
      `Quer receber as fotos e o relatório detalhado deste imóvel sem compromisso?`;
  };

  const handleCopy = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if ((window as any).customToast) {
        (window as any).customToast("Copiado com sucesso para a área de transferência!", "success");
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const summaryText = getContextualSummary();
  const tipsList = getContextualTips();

  return (
    <div id={`assessor-panel-${contextType}`} className="mt-6 bg-gradient-to-br from-amber-500/[0.04] via-brand-paper to-brand-primary/[0.03] border-2 border-amber-500/20 rounded-3xl p-5 sm:p-6 shadow-md shadow-amber-500/5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
            <Award size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-sans border border-amber-500/30">
                Painel do Assessor & Investidor
              </span>
              <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider hidden sm:inline">
                • Estratégia de Entrada, Saída & Captação
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-brand-ink tracking-tight flex items-center gap-2 mt-0.5">
              Inteligência Estratégica & Dicas de Fechamento
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl border border-brand-border bg-brand-paper hover:bg-brand-bg text-xs font-bold text-brand-ink/70 flex items-center gap-1.5 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={15} />
                <span>Recolher</span>
              </>
            ) : (
              <>
                <ChevronDown size={15} />
                <span>Expandir Painel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4 space-y-5">
          {/* Resumo Executivo Box */}
          <div className="bg-brand-paper/90 backdrop-blur-sm border border-brand-border/80 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
                <FileText size={16} />
                <span>Síntese Estratégica da Análise ({contextType.toUpperCase()})</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(summaryText, setCopiedSummary)}
                className="text-[11px] font-bold text-brand-primary/80 hover:text-brand-primary flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-brand-primary/10"
              >
                {copiedSummary ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedSummary ? 'Copiado!' : 'Copiar Resumo'}</span>
              </button>
            </div>
            <p className="text-sm sm:text-[14px] text-brand-ink/80 leading-relaxed font-sans font-medium">
              {summaryText}
            </p>
          </div>

          {/* Quick Metrics Cards */}
          {(valuation > 0 || minBid > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-brand-paper border border-brand-border rounded-xl p-3 flex flex-col">
                <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Avaliação Mercado</span>
                <span className="text-xs sm:text-sm font-black text-brand-ink mt-0.5">{formatMoney(valuation)}</span>
              </div>
              <div className="bg-brand-paper border border-brand-border rounded-xl p-3 flex flex-col">
                <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Lance Oportunidade</span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(minBid)}</span>
              </div>
              <div className="bg-brand-paper border border-brand-border rounded-xl p-3 flex flex-col">
                <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Desconto Comercial</span>
                <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">{discountPercent}% OFF</span>
              </div>
              <div className="bg-brand-paper border border-brand-border rounded-xl p-3 flex flex-col">
                <span className="text-[10px] font-bold text-brand-ink/50 uppercase tracking-wider">Spread / Economia</span>
                <span className="text-xs sm:text-sm font-black text-brand-primary mt-0.5">{formatMoney(economyValue)}</span>
              </div>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-brand-bg/60 rounded-2xl border border-brand-border/60">
            <button
              type="button"
              onClick={() => setActiveTab('entrada')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'entrada'
                  ? 'bg-brand-paper text-emerald-600 dark:text-emerald-400 shadow-sm border border-brand-border'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-paper/50'
              }`}
            >
              <LogIn size={15} />
              <span>Estratégia de Entrada</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saida')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'saida'
                  ? 'bg-brand-paper text-blue-600 dark:text-blue-400 shadow-sm border border-brand-border'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-paper/50'
              }`}
            >
              <LogOut size={15} />
              <span>Estratégia de Saída & Lucro</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incentivos')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'incentivos'
                  ? 'bg-brand-paper text-purple-600 dark:text-purple-400 shadow-sm border border-brand-border'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-paper/50'
              }`}
            >
              <Zap size={15} />
              <span>Incentivos ao Investidor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('investidor')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'investidor'
                  ? 'bg-brand-paper text-brand-primary shadow-sm border border-brand-border'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-paper/50'
              }`}
            >
              <TrendingUp size={15} />
              <span>Pitch Investidores</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('moradia')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'moradia'
                  ? 'bg-brand-paper text-emerald-600 dark:text-emerald-400 shadow-sm border border-brand-border'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-paper/50'
              }`}
            >
              <Home size={15} />
              <span>Pitch Moradia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dicas')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'dicas'
                  ? 'bg-brand-paper text-amber-600 dark:text-amber-400 shadow-sm border border-brand-border'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-paper/50'
              }`}
            >
              <Lightbulb size={15} />
              <span>Dicas de Ouro</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('objecoes')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'objecoes'
                  ? 'bg-brand-paper text-indigo-600 dark:text-indigo-400 shadow-sm border border-brand-border'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-paper/50'
              }`}
            >
              <HelpCircle size={15} />
              <span>Quebra de Objeções</span>
            </button>
          </div>

          {/* Tab 1: Estratégia de Entrada */}
          {activeTab === 'entrada' && (
            <div className="bg-brand-paper border border-brand-border rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                <div>
                  <h5 className="text-sm font-extrabold text-brand-ink flex items-center gap-2">
                    <LogIn size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Como Entrar com Alta Margem de Segurança & Alavancagem
                  </h5>
                  <p className="text-xs text-brand-ink/50 mt-0.5">
                    Diretrizes de lance, timing de praça e estruturação financeira.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> 1. Lance Teto e Disciplina Financeira
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    Defina o teto máximo de arrematação antes de abrir o pregão (ex: valor que garanta no mínimo 25% de margem líquida após todos os custos de ITBI, registro, assessoria e eventual acordo de desocupação). <strong>Nunca aumente lances por impulso emocional na disputa.</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Gavel size={14} /> 2. Tática de 1ª Praça vs 2ª Praça
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    Em imóveis de altíssima liquidez (bairros nobres e condomínios disputados), estude arrematar na 1ª praça pelo valor de avaliação se a valorização da região superar o mercado. Isso desvia da disputa predatória da 2ª praça onde múltiplos concorrentes frequentemente inflam os lances além do racional.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <DollarSign size={14} /> 3. Alavancagem com Parcelamento (Art. 895 CPC)
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    Utilize a proposta de parcelamento judicial: <strong>25% de entrada + saldo em até 30 parcelas</strong> mensais corrigidas pelo índice oficial da justiça (sem juros remuneratórios bancários). Isso multiplica a TIR anualizada mantendo a liquidez do investidor intacta.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Clock size={14} /> 4. Habilitação & Checklist Pré-Pregão
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    Habilite a conta e envie documentos ao leiloeiro oficial com antecedência mínima de 48h. Verifique certidões negativas do arrematante e garanta disponibilidade de saldo para o depósito imediato da caução e comissão de 5%.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Estratégia de Saída */}
          {activeTab === 'saida' && (
            <div className="bg-brand-paper border border-brand-border rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                <div>
                  <h5 className="text-sm font-extrabold text-brand-ink flex items-center gap-2">
                    <LogOut size={16} className="text-blue-600 dark:text-blue-400" />
                    4 Rotas Claras de Realização de Lucro & Monetização
                  </h5>
                  <p className="text-xs text-brand-ink/50 mt-0.5">
                    Como extrair a maior rentabilidade de acordo com o perfil do investidor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-blue-500/[0.04] border border-blue-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    🚀 Rota 1: Revenda Express (10% a 15% abaixo do mercado)
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    <strong>Giro Ultrarrápido (3 a 6 meses):</strong> Ao precificar o imóvel com leve desconto frente aos vizinhos, atrai-se compradores imediatos. Minimiza custos de condomínio/IPTU de holding e produz a maior TIR (Taxa Interna de Retorno) anualizada.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/[0.04] border border-blue-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    🛠️ Rota 2: Fix & Flip (Reforma Inteligente de Valorização)
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    <strong>Spread Máximo:</strong> Aplicação de reforma estética de baixo custo (pintura off-white moderna, iluminação em LED, polimento de pisos e troca de louças). Eleva a percepção de valor e permite venda pelo teto da avaliação imobiliária.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/[0.04] border border-blue-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    🏢 Rota 3: Renda Passiva de Locação (Yield 0,8% a 1,2% a.m.)
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    <strong>Fluxo Recorrente:</strong> Como o custo de aquisição foi de 50% a 60% do valor de mercado, o yield de aluguel calculado sobre o capital desembolsado é quase o dobro de um imóvel comum, proporcionando fluxo de caixa estável e valorização do m².
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/[0.04] border border-blue-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    🤝 Rota 4: Cessão de Direitos de Arrematação / Acordo
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    <strong>Monetização Prévia:</strong> Possibilidade de cessão dos direitos da arrematação para terceiros com ágio imediato ou negociação amigável homologada de recompra com o próprio ocupante mediante quitação assistida.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Incentivos ao Investidor */}
          {activeTab === 'incentivos' && (
            <div className="bg-brand-paper border border-brand-border rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                <div>
                  <h5 className="text-sm font-extrabold text-brand-ink flex items-center gap-2">
                    <Zap size={16} className="text-purple-600 dark:text-purple-400" />
                    Por Que Investir Nesta Operação? (Vantagens Competitivas)
                  </h5>
                  <p className="text-xs text-brand-ink/50 mt-0.5">
                    Argumentos sólidos e dados de mercado para embasar a tomada de decisão.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    🏛️ Aquisição Originária sem Ônus Preexistentes
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    A arrematação judicial limpa a matrícula do imóvel. Todas as hipotecas, penhoras e execuções anteriores do antigo proprietário são canceladas por ordem do juiz, garantindo titularidade limpa no RGI.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    🛡️ Proteção Inflacionária em Ativo Real Físico
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    Diferente de investimentos voláteis de papel, o imóvel é um ativo tangível e perpétuo, com proteção intrínseca contra a desvalorização cambial e histórico consistente de valorização do metro quadrado.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    📈 Assimetria Brutal de Retorno vs Renda Fixa
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    Enquanto CDBs e Tesouro Direto rendem 10% a 12% ao ano (bruto), uma operação de leilão estruturada entrega 25% a 50% de ganho líquido em ciclos de 6 a 12 meses, multiplicando patrimônio com lastro real.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    💼 Comodidade e Assessoria Completa TJ INVEST
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans">
                    O investidor não precisa aprender leis, comparecer a audiências ou negociar com ocupantes. A TJ INVEST conduz 100% da auditoria, arrematação, imissão na posse e registro até a entrega das chaves.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Pitch Investidores */}
          {activeTab === 'investidor' && (
            <div className="bg-brand-paper border border-brand-border rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-border/50">
                <div>
                  <h5 className="text-sm font-extrabold text-brand-ink flex items-center gap-2">
                    <TrendingUp size={16} className="text-brand-primary" />
                    Script de WhatsApp Pronto para Investidores
                  </h5>
                  <p className="text-xs text-brand-ink/50 mt-0.5">
                    Focado em números, margem de lucro, ROI, segurança jurídica e comodidade de delegar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(generateInvestorPitch(), setCopiedInvestor)}
                  className="px-3.5 py-2 rounded-xl bg-brand-primary text-black hover:bg-brand-primary/90 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 shrink-0"
                >
                  {copiedInvestor ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedInvestor ? 'Copiado para o WhatsApp!' : 'Copiar Script Investidor'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-brand-bg/70 rounded-xl border border-brand-border/80 font-mono text-xs text-brand-ink/90 whitespace-pre-wrap leading-relaxed select-all">
                {generateInvestorPitch()}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-brand-ink/60 pt-1">
                <Lightbulb size={13} className="text-amber-500 shrink-0" />
                <span>💡 Dica de abordagem: Envie este texto acompanhado do link compartilhado do dossiê para aumentar a taxa de conversão do investidor.</span>
              </div>
            </div>
          )}

          {/* Tab 5: Pitch Moradia */}
          {activeTab === 'moradia' && (
            <div className="bg-brand-paper border border-brand-border rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-border/50">
                <div>
                  <h5 className="text-sm font-extrabold text-brand-ink flex items-center gap-2">
                    <Home size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Script de WhatsApp para Comprador Final (Casa Própria)
                  </h5>
                  <p className="text-xs text-brand-ink/50 mt-0.5">
                    Focado em economia real, segurança da família, assessoria completa e facilidade.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(generateHomeBuyerPitch(), setCopiedBuyer)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 shrink-0"
                >
                  {copiedBuyer ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedBuyer ? 'Copiado para o WhatsApp!' : 'Copiar Script Moradia'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-brand-bg/70 rounded-xl border border-brand-border/80 font-mono text-xs text-brand-ink/90 whitespace-pre-wrap leading-relaxed select-all">
                {generateHomeBuyerPitch()}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-brand-ink/60 pt-1">
                <Lightbulb size={13} className="text-emerald-500 shrink-0" />
                <span>🏡 Dica de abordagem: Mostre ao cliente que o dinheiro economizado no leilão pode pagar toda a reforma e decoração de alto padrão do imóvel.</span>
              </div>
            </div>
          )}

          {/* Tab 6: Dicas de Ouro do Assessor */}
          {activeTab === 'dicas' && (
            <div className="bg-brand-paper border border-brand-border rounded-2xl p-4 sm:p-5 space-y-3">
              <h5 className="text-sm font-extrabold text-brand-ink flex items-center gap-2 pb-2 border-b border-brand-border/50">
                <Lightbulb size={16} className="text-amber-500" />
                Dicas Estratégicas de Fechamento para o Assessor
              </h5>

              <div className="space-y-2.5">
                {tipsList.map((tip, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex items-start gap-3 text-xs sm:text-[13px] text-brand-ink/90 font-medium leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 7: Quebra de Objeções */}
          {activeTab === 'objecoes' && (
            <div className="bg-brand-paper border border-brand-border rounded-2xl p-4 sm:p-5 space-y-3">
              <h5 className="text-sm font-extrabold text-brand-ink flex items-center gap-2 pb-2 border-b border-brand-border/50">
                <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
                Como Quebrar as 3 Principais Objeções dos Clientes
              </h5>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-brand-bg/60 border border-brand-border space-y-1.5">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    ❓ Objeção 1: "E se o imóvel estiver ocupado e for difícil desocupar?"
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans pl-4 border-l-2 border-brand-primary">
                    <strong>Argumento de Fechamento:</strong> "A desocupação é um procedimento 100% judicial e rotineiro. O juiz que deferiu a venda expede o Mandado de Imissão na Posse com apoio de oficial de justiça. Além disso, nossa equipe cuida de toda a negociação amigável inicial, que resolve mais de 80% dos casos em poucas semanas sem atrito para você."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-brand-bg/60 border border-brand-border space-y-1.5">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    ❓ Objeção 2: "E se o imóvel tiver dívidas astronômicas de IPTU ou condomínio?"
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans pl-4 border-l-2 border-brand-primary">
                    <strong>Argumento de Fechamento:</strong> "Nossa auditoria prévia já mapeou o edital: as dívidas fiscais de IPTU sub-rogam no preço pago da arrematação conforme o Art. 130 do Código Tributário Nacional. O saldo da arrematação quita o débito e você recebe o imóvel limpo de ônus fiscais."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-brand-bg/60 border border-brand-border space-y-1.5">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    ❓ Objeção 3: "Tenho medo de perder dinheiro ou o leilão ser anulado."
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-sans pl-4 border-l-2 border-brand-primary">
                    <strong>Argumento de Fechamento:</strong> "É exatamente por isso que você contrata a nossa assessoria. Nós filtramos apenas leilões com intimações perfeitas, sem nulidades e com ampla margem de lucro. Arrematação judicial é chancelada por um Juiz de Direito com garantia registral em Cartório de Imóveis."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
