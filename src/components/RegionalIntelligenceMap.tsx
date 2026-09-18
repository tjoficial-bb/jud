import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  ExternalLink,
  Sparkles,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  ShoppingBag,
  Bus,
  Waves,
  DollarSign,
  ShieldCheck,
  GraduationCap,
  MessageSquare,
  Bot,
  User,
  Send,
  Navigation,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Property } from '../types';
import { GeneratedLinksHub } from './GeneratedLinksHub';

export interface NamedPoiItem {
  name: string;
  category?: string;
  distance?: string;
  note?: string;
  mapsQuery?: string;
}

export interface RegionalChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface RegionalData {
  address: string;
  mapsUrl?: string;
  registeredArea?: number;
  incomeProfile?: string;
  floodRisk?: 'Baixo' | 'Médio' | 'Alto' | 'Muito Baixo' | string;
  floodDetails?: string;
  transportation?: string;
  healthAndEducation?: string;
  commerceAndTourism?: string;
  generalLiquidity?: string;
  namedHospitals?: NamedPoiItem[];
  namedShoppings?: NamedPoiItem[];
  namedSchools?: NamedPoiItem[];
  namedTransport?: NamedPoiItem[];
  namedSecurity?: NamedPoiItem[];
  namedRiskPoints?: NamedPoiItem[];
  rawAiReport?: string;
  lastUpdated?: string;
}

interface RegionalIntelligenceMapProps {
  property?: Property | null;
  initialData?: RegionalData | null;
  matriculaAnalysis?: string | null;
  editalAnalysis?: string | null;
  processoAnalysis?: string | null;
  customDomain?: string;
  shareToken?: string;
  onSave?: (data: RegionalData) => void;
  onAddToSummary?: (text: string, title: string) => void;
  token?: string;
  selectedModel?: string;
  userApiKey?: string;
}

export const RegionalIntelligenceMap: React.FC<RegionalIntelligenceMapProps> = ({
  property,
  initialData,
  matriculaAnalysis = '',
  editalAnalysis = '',
  processoAnalysis = '',
  customDomain,
  shareToken,
  onSave,
  onAddToSummary,
  token,
  selectedModel = 'gemini-3.7-flash',
  userApiKey
}) => {
  // Main Navigation / View tabs
  const [activeMainTab, setActiveMainTab] = useState<'links' | 'map_view' | 'socioeconomic'>('links');
  
  // Address & Map input states
  const [addressInput, setAddressInput] = useState('');
  const [mapsUrlInput, setMapsUrlInput] = useState('');

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<RegionalChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Olá! Sou o Assistente Territorial TJInvest. Posso analisar a localização do imóvel, o perfil socioeconômico do bairro, riscos de enchentes, infraestrutura urbana e liquidez da região.',
      timestamp: 'Agora'
    }
  ]);
  const [sendingChat, setSendingChat] = useState(false);

  // Regional data state
  const [regionalInfo, setRegionalInfo] = useState<RegionalData>({
    address: '',
    incomeProfile: '',
    floodRisk: 'Baixo',
    floodDetails: '',
    transportation: '',
    healthAndEducation: '',
    commerceAndTourism: '',
    generalLiquidity: '',
    namedHospitals: [],
    namedShoppings: [],
    namedSchools: [],
    namedTransport: [],
    namedSecurity: []
  });

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to extract address from property / analysis
  const resolveEffectiveAddress = useCallback(() => {
    let addr = property ? [property.address, property.city, property.state].filter(Boolean).join(', ') : '';
    const text = matriculaAnalysis || '';

    if (text) {
      try {
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          const parsed = JSON.parse(text.substring(first, last + 1));
          if (parsed.caracteristicas_fisicas?.endereco) {
            addr = parsed.caracteristicas_fisicas.endereco;
          }
        }
      } catch (e) {
        // Ignore fallback
      }
    }
    return addr || 'São Paulo, SP';
  }, [property, matriculaAnalysis]);

  // Sync Initial Data on Mount or Property Change
  useEffect(() => {
    const defaultAddr = resolveEffectiveAddress();
    setAddressInput(initialData?.address || defaultAddr);
    setMapsUrlInput(initialData?.mapsUrl || '');

    if (initialData) {
      setRegionalInfo(initialData);
    }
  }, [property, initialData, resolveEffectiveAddress]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Save changes
  const handleSaveRegionalInfo = (updatedInfo: RegionalData) => {
    setRegionalInfo(updatedInfo);
    if (onSave) {
      onSave(updatedInfo);
    }
  };

  // Run AI Analysis for Regional Intelligence
  const handleRunRegionalAiAnalysis = async () => {
    const effectiveAddress = addressInput || resolveEffectiveAddress();
    if (!effectiveAddress) {
      triggerToast("⚠️ Informe um endereço ou cidade para a consulta.");
      return;
    }

    setIsAnalyzing(true);
    triggerToast("🔍 Consultando inteligência regional e vizinhança...");

    try {
      const prompt = `Você é o maior especialista em Perícias Imobiliárias, Urbanismo e Inteligência Territorial de Investimentos em Leilões no Brasil.
Analise a localização e o entorno do imóvel:
Endereço/Região: "${effectiveAddress}".

Contexto da análise jurídica/registral:
${matriculaAnalysis ? matriculaAnalysis.substring(0, 1500) : ''}
${editalAnalysis ? editalAnalysis.substring(0, 1000) : ''}

Retorne ESTRITAMENTE um JSON no seguinte formato (sem formatação extra):
{
  "incomeProfile": "Perfil de renda média/alta, padrão construtivo predominante da vizinhança e perfil dos moradores",
  "floodRisk": "Baixo",
  "floodDetails": "Histórico de alagamentos, relevo do entorno, proximidade com córregos ou histórico de drenagem da prefeitura",
  "transportation": "Acesso viário principal, linhas de ônibus, proximidade de estações de metrô/trem ou rodovias",
  "healthAndEducation": "Principais hospitais, UPAs, escolas públicas/particulares e faculdades próximas",
  "commerceAndTourism": "Supermercados, shoppings, padarias, polos comerciais e atrativos",
  "generalLiquidity": "Classificação da liquidez de venda/locação na região (Alta, Média ou Baixa) com justificativa de mercado",
  "namedHospitals": [
    { "name": "Nome do Hospital/UPA", "distance": "800m", "note": "Referência SUS/Particular", "mapsQuery": "Hospital perto de ${effectiveAddress}" }
  ],
  "namedShoppings": [
    { "name": "Nome do Shopping ou Centro Comercial", "distance": "1.5km", "note": "Comércio e lazer", "mapsQuery": "Shopping perto de ${effectiveAddress}" }
  ],
  "namedSchools": [
    { "name": "Nome da Escola/Faculdade", "distance": "600m", "note": "Infraestrutura educacional", "mapsQuery": "Escola perto de ${effectiveAddress}" }
  ],
  "namedTransport": [
    { "name": "Estação ou Corredor de Ônibus", "distance": "400m", "note": "Mobilidade urbana", "mapsQuery": "Transporte perto de ${effectiveAddress}" }
  ],
  "namedSecurity": [
    { "name": "Batalhão PM / Delegacia", "distance": "1.2km", "note": "Segurança pública", "mapsQuery": "Delegacia perto de ${effectiveAddress}" }
  ]
}`;

      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          apiKey: userApiKey,
          systemInstruction: 'Você é um perito em inteligência imobiliária urbana brasileira. Responda com precisão técnica em JSON válido.'
        })
      });

      if (!res.ok) throw new Error(`Falha no servidor (${res.status})`);
      const responseData = await res.json();
      const rawText = responseData.response || responseData.text || '';

      // Parse JSON
      const first = rawText.indexOf('{');
      const last = rawText.lastIndexOf('}');
      if (first !== -1 && last !== -1) {
        const parsed = JSON.parse(rawText.substring(first, last + 1));
        const updated: RegionalData = {
          ...regionalInfo,
          address: effectiveAddress,
          incomeProfile: parsed.incomeProfile || regionalInfo.incomeProfile,
          floodRisk: parsed.floodRisk || regionalInfo.floodRisk,
          floodDetails: parsed.floodDetails || regionalInfo.floodDetails,
          transportation: parsed.transportation || regionalInfo.transportation,
          healthAndEducation: parsed.healthAndEducation || regionalInfo.healthAndEducation,
          commerceAndTourism: parsed.commerceAndTourism || regionalInfo.commerceAndTourism,
          generalLiquidity: parsed.generalLiquidity || regionalInfo.generalLiquidity,
          namedHospitals: parsed.namedHospitals || [],
          namedShoppings: parsed.namedShoppings || [],
          namedSchools: parsed.namedSchools || [],
          namedTransport: parsed.namedTransport || [],
          namedSecurity: parsed.namedSecurity || [],
          rawAiReport: rawText,
          lastUpdated: new Date().toLocaleDateString('pt-BR')
        };
        handleSaveRegionalInfo(updated);
        setActiveMainTab('socioeconomic');
        triggerToast("✅ Inteligência regional mapeada com sucesso!");
      } else {
        triggerToast("⚠️ A IA gerou a resposta em texto livre.");
      }
    } catch (err: any) {
      console.error("[RegionalIntelligenceMap] Erro ao consultar IA:", err);
      triggerToast(`Erro ao consultar IA: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send Regional Chat Message
  const handleSendRegionalChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || sendingChat) return;

    const userMsg: RegionalChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setSendingChat(true);

    try {
      const effectiveAddress = addressInput || resolveEffectiveAddress();
      const prompt = `Você é o Perito Territorial e Consultor de Leilões Imobiliários.
Localização do Imóvel: "${effectiveAddress}".

Dados levantados da Região:
- Renda e Perfil: ${regionalInfo.incomeProfile || 'Não especificado'}
- Risco de Alagamentos: ${regionalInfo.floodRisk || 'Baixo'} (${regionalInfo.floodDetails || ''})
- Transporte: ${regionalInfo.transportation || 'Não especificado'}
- Infraestrutura: ${regionalInfo.healthAndEducation || 'Não especificado'}

Pergunta do Usuário:
"${textToSend}"

Responda de forma direta, técnica, fundamentada e prática para tomada de decisão de arrematação.`;

      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          apiKey: userApiKey
        })
      });

      if (!res.ok) throw new Error(`Erro na resposta (${res.status})`);
      const resData = await res.json();
      const aiReply = resData.response || resData.text || 'Não consegui processar a resposta.';

      const botMsg: RegionalChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      console.error("[RegionalChat] Erro:", e);
      const errMsg: RegionalChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: `Falha ao processar sua pergunta: ${e.message}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  const effectiveAddress = addressInput || resolveEffectiveAddress();
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(effectiveAddress)}&t=k&z=19&ie=UTF8&iwloc=&output=embed`;
  const mapsStandardEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(effectiveAddress)}&t=m&z=17&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-black text-white text-xs font-bold shadow-2xl border border-brand-primary/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles size={16} className="text-brand-primary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-primary/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveMainTab('links')}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm",
              activeMainTab === 'links'
                ? "bg-brand-primary text-black"
                : "bg-brand-paper hover:bg-brand-primary/10 text-brand-ink/70 border border-brand-primary/10"
            )}
          >
            <LinkIcon size={16} />
            <span>Central de Links & Acessos</span>
          </button>

          <button
            onClick={() => setActiveMainTab('map_view')}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm",
              activeMainTab === 'map_view'
                ? "bg-brand-primary text-black"
                : "bg-brand-paper hover:bg-brand-primary/10 text-brand-ink/70 border border-brand-primary/10"
            )}
          >
            <Layers size={16} />
            <span>Satélite & Mapa Ao Vivo</span>
          </button>

          <button
            onClick={() => setActiveMainTab('socioeconomic')}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm",
              activeMainTab === 'socioeconomic'
                ? "bg-brand-primary text-black"
                : "bg-brand-paper hover:bg-brand-primary/10 text-brand-ink/70 border border-brand-primary/10"
            )}
          >
            <ShieldCheck size={16} />
            <span>Vizinhança & Riscos da Região</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunRegionalAiAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isAnalyzing ? 'Mapeando Região...' : 'Consultar Região (IA)'}</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: CENTRAL DE LINKS ORGANIZADOS */}
      {/* ========================================== */}
      {activeMainTab === 'links' && (
        <GeneratedLinksHub
          property={property}
          customDomain={customDomain}
          shareToken={shareToken}
          matriculaAnalysis={matriculaAnalysis || ''}
          editalAnalysis={editalAnalysis || ''}
          processoAnalysis={processoAnalysis || ''}
          address={addressInput}
          mapsUrl={mapsUrlInput}
        />
      )}

      {/* ========================================== */}
      {/* TAB 2: SATÉLITE & MAPA AO VIVO */}
      {/* ========================================== */}
      {activeMainTab === 'map_view' && (
        <div className="space-y-6">
          <div className="bg-brand-paper p-6 rounded-3xl border border-brand-primary/20 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-brand-ink flex items-center gap-2">
                  <MapPin size={18} className="text-brand-primary" />
                  Visualização de Satélite & Localização
                </h3>
                <p className="text-xs text-brand-ink/60 mt-0.5">
                  Endereço: <strong>{effectiveAddress}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(effectiveAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-primary text-black text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-brand-primary/90 transition-all shadow-sm"
                >
                  <ExternalLink size={13} />
                  Abrir no Google Maps
                </a>
              </div>
            </div>

            {/* Live Google Maps Satellite & Standard Embed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-brand-ink/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-brand-primary" />
                  Satélite Alta Resolução (HD)
                </span>
                <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-brand-primary/20 shadow-inner bg-neutral-900">
                  <iframe
                    title="Google Maps Satellite"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={mapsEmbedUrl}
                    className="w-full h-full border-0 filter contrast-[1.05]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-brand-ink/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation size={13} className="text-blue-500" />
                  Malha Viária e Bairro
                </span>
                <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-brand-primary/20 shadow-inner bg-neutral-900">
                  <iframe
                    title="Google Maps Standard"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={mapsStandardEmbedUrl}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: SOCIOECONOMIC & RISK MAPPING */}
      {/* ========================================== */}
      {activeMainTab === 'socioeconomic' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Demographics & Risks */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck size={18} className="text-brand-primary" />
                      Mapeamento Socioeconômico & Riscos
                    </h4>
                    <p className="text-xs text-brand-ink/50 mt-0.5">Indicadores do entorno para decisão de investimento</p>
                  </div>
                  {regionalInfo.lastUpdated && (
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
                      {regionalInfo.lastUpdated}
                    </span>
                  )}
                </div>

                {/* Income */}
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={14} />
                    Perfil e Renda dos Moradores
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                    {regionalInfo.incomeProfile || (
                      <span className="italic text-brand-ink/40">Clique em "Consultar Região (IA)" para mapear a renda estimada e perfil da região.</span>
                    )}
                  </p>
                </div>

                {/* Flood Risk */}
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Waves size={14} className="text-cyan-600" />
                      Risco de Enchentes & Alagamentos
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                      (regionalInfo.floodRisk?.toLowerCase().includes('baixo') || regionalInfo.floodRisk?.toLowerCase().includes('muito'))
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    )}>
                      Risco: {regionalInfo.floodRisk || 'Baixo'}
                    </span>
                  </div>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                    {regionalInfo.floodDetails || (
                      <span className="italic text-brand-ink/40">Histórico de drenagem e vulnerabilidade de chuvas da microrregião.</span>
                    )}
                  </p>
                </div>

                {/* Liquidity */}
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={14} />
                    Liquidez de Venda e Locação
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                    {regionalInfo.generalLiquidity || (
                      <span className="italic text-brand-ink/40">Demanda imobiliária e facilidade de desinvestimento no bairro.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Infrastructure & POIs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
                <div className="border-b border-brand-primary/10 pb-4">
                  <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag size={18} className="text-brand-primary" />
                    Pontos de Interesse & Infraestrutura
                  </h4>
                  <p className="text-xs text-brand-ink/50 mt-0.5">Acessos, transportes, hospitais e polos comerciais mapeados</p>
                </div>

                {/* Transportation */}
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Bus size={14} className="text-blue-500" />
                    Transporte & Mobilidade Urbana
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                    {regionalInfo.transportation || (
                      <span className="italic text-brand-ink/40">Acessibilidade, avenidas principais e transporte público.</span>
                    )}
                  </p>
                </div>

                {/* Health & Education */}
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-emerald-600" />
                    Saúde & Educação
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                    {regionalInfo.healthAndEducation || (
                      <span className="italic text-brand-ink/40">Hospitais, unidades básicas de saúde, colégios e faculdades.</span>
                    )}
                  </p>
                </div>

                {/* Commercial & Shopping */}
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-amber-500" />
                    Comércio & Serviços
                  </span>
                  <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                    {regionalInfo.commerceAndTourism || (
                      <span className="italic text-brand-ink/40">Supermercados, shoppings, padarias e conveniências próximas.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Feed for Regional Intelligence */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/15 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <span>Chat Especialista Territorial & Bairro</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full uppercase tracking-wider">
                  Ao Vivo
                </span>
              </h4>
              <p className="text-xs text-brand-ink/60">
                Tire dúvidas sobre a vizinhança, perfil de moradores, segurança e liquidez do imóvel.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-2 rounded-lg hover:bg-brand-primary/10 text-brand-ink/60 transition-colors cursor-pointer"
          >
            {isChatOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isChatOpen && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendRegionalChat(`Liste hospitais e UPAs de referência próximos de "${addressInput || 'São Paulo'}" com distâncias estimadas.`)}
                disabled={sendingChat}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <GraduationCap size={13} className="text-emerald-600" />
                <span>🏥 Hospitais e Clínicas</span>
              </button>
              <button
                onClick={() => handleSendRegionalChat(`Qual o histórico de alagamentos e relevo no logradouro de "${addressInput || 'São Paulo'}"?`)}
                disabled={sendingChat}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Waves size={13} className="text-cyan-600" />
                <span>🌊 Histórico de Enchentes</span>
              </button>
              <button
                onClick={() => handleSendRegionalChat(`Como é a liquidez de revenda e o perfil dos compradores nesta região de "${addressInput || 'São Paulo'}"?`)}
                disabled={sendingChat}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <DollarSign size={13} className="text-amber-600" />
                <span>💰 Liquidez Imobiliária</span>
              </button>
            </div>

            <div className="bg-brand-bg/60 rounded-2xl border border-brand-primary/15 p-4 sm:p-6 max-h-[380px] min-h-[200px] overflow-y-auto space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-brand-primary text-black flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-4 text-xs space-y-2 leading-relaxed shadow-sm",
                    msg.sender === 'user'
                      ? "bg-brand-primary text-black rounded-tr-none font-medium"
                      : "bg-brand-paper text-brand-ink border border-brand-primary/15 rounded-tl-none"
                  )}>
                    <div className="flex items-center justify-between gap-4 border-b border-current/10 pb-1.5">
                      <span className="font-bold text-[11px] uppercase tracking-wider">
                        {msg.sender === 'user' ? 'Você (Investidor)' : 'IA Especialista Territorial'}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.text}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-brand-paper border border-brand-primary/20 text-brand-ink flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {sendingChat && (
                <div className="flex gap-3 justify-start items-center text-xs text-brand-ink/60 italic p-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0">
                    <Loader2 size={16} className="animate-spin text-brand-primary" />
                  </div>
                  <span>Consultando bases territoriais...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendRegionalChat();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pergunte sobre a vizinhança, comércio, enchentes..."
                disabled={sendingChat}
                className="flex-1 bg-brand-bg border border-brand-primary/20 rounded-xl px-4 py-3 text-xs text-brand-ink placeholder:text-brand-ink/40 focus:outline-none focus:border-brand-primary transition-all"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="px-5 py-3 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider shrink-0"
              >
                {sendingChat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};
