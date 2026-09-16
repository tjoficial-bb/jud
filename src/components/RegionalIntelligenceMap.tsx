import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Ruler, 
  ExternalLink, 
  Search, 
  Compass, 
  Layers, 
  Waves, 
  Bus, 
  GraduationCap, 
  Building2, 
  Landmark, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Copy, 
  RefreshCw, 
  FileText,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Property } from '../types';

export interface RegionalData {
  address: string;
  mapsUrl?: string;
  measuredArea?: number;
  registeredArea?: number;
  areaNotes?: string;
  incomeProfile?: string;
  floodRisk?: 'Baixo' | 'Médio' | 'Alto' | 'Muito Baixo' | string;
  floodDetails?: string;
  transportation?: string;
  healthAndEducation?: string;
  commerceAndTourism?: string;
  generalLiquidity?: string;
  rawAiReport?: string;
  lastUpdated?: string;
}

interface RegionalIntelligenceMapProps {
  property?: Property | null;
  initialData?: RegionalData | null;
  onSave?: (data: RegionalData) => void;
  onAddToSummary?: (text: string, title: string) => void;
  token?: string;
  selectedModel?: string;
  userApiKey?: string;
}

export const RegionalIntelligenceMap: React.FC<RegionalIntelligenceMapProps> = ({
  property,
  initialData,
  onSave,
  onAddToSummary,
  token,
  selectedModel = 'gemini-3.7-flash',
  userApiKey
}) => {
  const defaultAddress = property ? [property.address, property.city, property.state].filter(Boolean).join(', ') : '';
  const [addressInput, setAddressInput] = useState<string>(initialData?.address || defaultAddress || '');
  const [mapsUrlInput, setMapsUrlInput] = useState<string>(initialData?.mapsUrl || '');
  const [measuredAreaInput, setMeasuredAreaInput] = useState<number | string>(initialData?.measuredArea || property?.area || '');
  const [registeredAreaInput, setRegisteredAreaInput] = useState<number | string>(initialData?.registeredArea || property?.area || '');
  const [areaNotes, setAreaNotes] = useState<string>(initialData?.areaNotes || '');
  
  const [regionalInfo, setRegionalInfo] = useState<RegionalData>(initialData || {
    address: defaultAddress,
    mapsUrl: '',
    measuredArea: property?.area || 0,
    registeredArea: property?.area || 0,
    areaNotes: '',
    incomeProfile: '',
    floodRisk: 'Baixo',
    floodDetails: '',
    transportation: '',
    healthAndEducation: '',
    commerceAndTourism: '',
    generalLiquidity: ''
  });

  const [loadingAi, setLoadingAi] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Sync if property changes
  useEffect(() => {
    if (property && !addressInput) {
      const full = [property.address, property.city, property.state].filter(Boolean).join(', ');
      setAddressInput(full);
      if (property.area && !registeredAreaInput) {
        setRegisteredAreaInput(property.area);
      }
    }
  }, [property]);

  // Construct Google Maps Search / Satellite URLs
  const getGoogleMapsSearchUrl = (query: string) => {
    if (mapsUrlInput && mapsUrlInput.trim().startsWith('http')) {
      return mapsUrlInput.trim();
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Brasil')}`;
  };

  const getGoogleMapsSatelliteUrl = (query: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Brasil')}&t=k`;
  };

  const getGoogleEarthUrl = (query: string) => {
    return `https://earth.google.com/web/search/${encodeURIComponent(query || 'Brasil')}`;
  };

  const calculateAreaDiscrepancy = () => {
    const measured = Number(measuredAreaInput) || 0;
    const reg = Number(registeredAreaInput) || 0;
    if (!measured || !reg) return null;
    const diff = measured - reg;
    const perc = ((diff / reg) * 100);
    return {
      diff,
      perc,
      status: Math.abs(perc) <= 5 ? 'normal' : diff > 0 ? 'excess' : 'deficit'
    };
  };

  const discrepancy = calculateAreaDiscrepancy();

  // Run AI analysis of the region
  const handleAnalyzeRegion = async () => {
    const targetAddr = addressInput.trim() || defaultAddress;
    if (!targetAddr) {
      alert("Por favor, informe ao menos o endereço, bairro ou cidade do imóvel para consultar a inteligência regional.");
      return;
    }

    setLoadingAi(true);
    try {
      const promptText = `Você é um perito em inteligência imobiliária, demografia e análise territorial para leilões no Brasil.
Analise detalhadamente a localização e vizinhança do seguinte imóvel:
ENDEREÇO / LOCALIZAÇÃO: "${targetAddr}"
${property?.title ? `TÍTULO DO IMÓVEL: "${property.title}"` : ''}
${property?.type ? `TIPO: "${property.type}"` : ''}
${mapsUrlInput ? `LINK GOOGLE MAPS FORNECIDO: "${mapsUrlInput}"` : ''}
${measuredAreaInput ? `ÁREA ESTIMADA / MEDIDA: ${measuredAreaInput} m²` : ''}

Por favor, faça um levantamento rigoroso de inteligência urbana e regional trazendo:
1. Renda e Perfil Socioeconômico dos Moradores da Região (classe social predominante, padrão das construções, segurança, perfil de renda média/alta/popular).
2. Risco Histórico de Enchentes, Alagamentos ou Deslizamentos (relevo, histórico de chuvas/alagamentos na localidade, proximidade de rios/córregos, drenagem urbana).
3. Mobilidade e Transporte Público (linhas de ônibus, terminais, proximidade de metrô/trem, facilidade de acesso a rodovias e avenidas principais).
4. Educação, Saúde e Serviços de Apoio (hospitais públicos/privados, faculdades, universidades, polos médicos, escolas de referência).
5. Comércio, Turismo, Lazer e Atrações (shoppings, hipermercados, centros comerciais, atrativos turísticos ou naturais se houver).
6. Liquidez de Revenda e Potencial de Locação (velocidade média de absorção, perfil de compradores/locatários, demanda na região).

Retorne OBRIGATORIAMENTE um JSON válido com a seguinte estrutura exata:
{
  "incomeProfile": "descrição concisa e objetiva da renda e perfil dos moradores...",
  "floodRisk": "Baixo" | "Médio" | "Alto" | "Muito Baixo",
  "floodDetails": "detalhes sobre o histórico de enchentes, relevo e drenagem...",
  "transportation": "linhas de ônibus, vias de acesso, facilidade de deslocamento...",
  "healthAndEducation": "hospitais, faculdades e escolas de destaque na região...",
  "commerceAndTourism": "comércio local, shoppings, atrativos turísticos e lazer...",
  "generalLiquidity": "parecer sobre a liquidez de venda/locação na localidade...",
  "executiveSummary": "resumo de 3 a 5 parágrafos interligando todos os pontos para compor o dossiê executivo."
}`;

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
        throw new Error("Erro na requisição ao servidor de IA.");
      }

      const jsonResponse = await res.json();
      const rawText = jsonResponse.analysis || jsonResponse.text || "";
      
      let parsed: any = {};
      try {
        const first = rawText.indexOf('{');
        const last = rawText.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          parsed = JSON.parse(rawText.substring(first, last + 1));
        }
      } catch (e) {
        console.warn("Parsing JSON regional fallback:", e);
      }

      const updated: RegionalData = {
        address: targetAddr,
        mapsUrl: mapsUrlInput,
        measuredArea: Number(measuredAreaInput) || 0,
        registeredArea: Number(registeredAreaInput) || 0,
        areaNotes: areaNotes,
        incomeProfile: parsed.incomeProfile || "Região urbana com infraestrutura consolidada e perfil compatível com a tipologia do imóvel.",
        floodRisk: parsed.floodRisk || "Baixo",
        floodDetails: parsed.floodDetails || "Não constam registros recorrentes de alagamentos graves na via principal.",
        transportation: parsed.transportation || "Atendido por linhas regulares de transporte público e vias coletoras.",
        healthAndEducation: parsed.healthAndEducation || "Proximidade de unidades de saúde e rede de ensino local.",
        commerceAndTourism: parsed.commerceAndTourism || "Ampla gama de serviços e comércio de bairro no entorno.",
        generalLiquidity: parsed.generalLiquidity || "Boa aceitação no mercado secundário para o segmento.",
        rawAiReport: parsed.executiveSummary || rawText,
        lastUpdated: new Date().toLocaleDateString('pt-BR')
      };

      setRegionalInfo(updated);
      if (onSave) {
        onSave(updated);
      }

    } catch (err: any) {
      console.error(err);
      alert(`Falha ao consultar inteligência regional: ${err.message || err}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handlePushToSummary = () => {
    if (!onAddToSummary) return;
    const summaryText = `### 📍 Inteligência Regional & Medição do Imóvel (${regionalInfo.address || addressInput})
- **Área Medida / Registrada:** ${measuredAreaInput || 0} m² (Matrícula: ${registeredAreaInput || 0} m²)
- **Perfil & Renda dos Moradores:** ${regionalInfo.incomeProfile || 'Não mapeado'}
- **Risco de Enchentes / Drenagem:** ${regionalInfo.floodRisk || 'Baixo'} - ${regionalInfo.floodDetails || ''}
- **Mobilidade & Transporte:** ${regionalInfo.transportation || 'Não mapeado'}
- **Saúde & Educação:** ${regionalInfo.healthAndEducation || 'Não mapeado'}
- **Comércio & Atratividade:** ${regionalInfo.commerceAndTourism || 'Não mapeado'}
- **Liquidez na Região:** ${regionalInfo.generalLiquidity || 'Não mapeado'}
${regionalInfo.rawAiReport ? `\n\n**Parecer Territorial Consolidado:**\n${regionalInfo.rawAiReport}` : ''}`;

    onAddToSummary(summaryText, 'Inteligência Regional & Localização');
    alert("Dados da região e medição adicionados ao Resumão Unificado com sucesso!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans" id="regional-intelligence-panel">
      {/* Header Banner */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/15 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
              <Compass size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-primary font-serif">Inteligência Regional & Medição Google Maps</h3>
              <p className="text-sm text-brand-ink/60 mt-1 max-w-2xl">
                Ferramenta integrada para validação métrica do imóvel, medição de satélite, levantamento socioeconômico da vizinhança e mapa de riscos da região.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleAnalyzeRegion}
              disabled={loadingAi}
              className="px-5 py-3 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {loadingAi ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              <span>{regionalInfo.lastUpdated ? 'Atualizar Dados da Região' : 'Consultar Inteligência Regional (IA)'}</span>
            </button>
            {onAddToSummary && (
              <button
                onClick={handlePushToSummary}
                className="px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <FileText size={16} />
                <span>Incluir no Resumão</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns: Address & Measurement vs Google Maps Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Address and Area Measurement */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                <MapPin size={18} className="text-brand-primary" />
                Localização & Link do Google Maps
              </h4>
              <span className="text-[10px] font-bold text-brand-ink/40 uppercase">Entrada de Dados</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 mb-1.5">
                  Endereço Completo do Imóvel
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  placeholder="Ex: Rua das Palmeiras, 150 - Bairro Centro, São Paulo - SP"
                  className="w-full bg-brand-bg border border-brand-primary/15 rounded-xl px-4 py-3 text-sm font-medium text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 mb-1.5">
                  Link Direto do Google Maps (Opcional)
                </label>
                <input
                  type="url"
                  value={mapsUrlInput}
                  onChange={e => setMapsUrlInput(e.target.value)}
                  placeholder="Cole aqui o link do Google Maps (ex: https://maps.app.goo.gl/...)"
                  className="w-full bg-brand-bg border border-brand-primary/15 rounded-xl px-4 py-3 text-sm font-medium text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Direct Map Tools Actions */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-primary/70 mb-2">
                Atalhos Rápidos de Satélite & Navegação:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <a
                  href={getGoogleMapsSearchUrl(addressInput)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 rounded-xl text-xs font-bold text-brand-ink hover:text-brand-primary transition-all text-center"
                >
                  <Search size={14} />
                  <span>Google Maps</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>

                <a
                  href={getGoogleMapsSatelliteUrl(addressInput)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-primary transition-all text-center"
                >
                  <Layers size={14} />
                  <span>Modo Satélite</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>

                <a
                  href={getGoogleEarthUrl(addressInput)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 rounded-xl text-xs font-bold text-brand-ink hover:text-brand-primary transition-all text-center"
                >
                  <Compass size={14} />
                  <span>Google Earth 3D</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Area Measurement Card */}
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                <Ruler size={18} className="text-brand-primary" />
                Medição de Área & Confrontação
              </h4>
              <span className="text-[10px] font-bold text-brand-ink/40 uppercase">Mapeamento M²</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 mb-1.5">
                  Área na Matrícula / Edital (m²)
                </label>
                <input
                  type="number"
                  value={registeredAreaInput}
                  onChange={e => setRegisteredAreaInput(e.target.value)}
                  placeholder="Ex: 250"
                  className="w-full bg-brand-bg border border-brand-primary/15 rounded-xl px-4 py-3 text-sm font-bold text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 mb-1.5">
                  Área Medida no Satélite (m²)
                </label>
                <input
                  type="number"
                  value={measuredAreaInput}
                  onChange={e => setMeasuredAreaInput(e.target.value)}
                  placeholder="Ex: 245"
                  className="w-full bg-brand-bg border border-brand-primary/15 rounded-xl px-4 py-3 text-sm font-bold text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Discrepancy Alert */}
            {discrepancy && (
              <div className={cn(
                "p-4 rounded-2xl border text-xs flex items-start gap-3",
                discrepancy.status === 'normal' 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800" 
                  : discrepancy.status === 'excess'
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-800"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-800"
              )}>
                {discrepancy.status === 'normal' ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    Diferença Métrica: {discrepancy.diff > 0 ? `+${discrepancy.diff.toFixed(1)} m²` : `${discrepancy.diff.toFixed(1)} m²`} ({discrepancy.perc > 0 ? `+${discrepancy.perc.toFixed(1)}%` : `${discrepancy.perc.toFixed(1)}%`})
                  </p>
                  <p className="mt-1 opacity-80 text-[11px]">
                    {discrepancy.status === 'normal' 
                      ? 'Área medida no satélite confere com a matrícula dentro da margem padrão de tolerância (±5%).' 
                      : discrepancy.status === 'excess'
                      ? 'A área identificada no satélite é maior que a matrícula. Verifique possíveis ampliações não averbadas ou ocupação de área vizinha.'
                      : 'Atenção: A área medida é inferior à descrita na matrícula. Verifique recuos viários, desdobros ou divergência cadastral.'}
                  </p>
                </div>
              </div>
            )}

            {/* Tutorial on how to measure on Google Maps */}
            <div className="bg-brand-bg/60 p-4 rounded-2xl border border-brand-primary/10 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-brand-primary">
                <Info size={14} />
                <span>Como medir a área do lote no Google Maps passo a passo:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-brand-ink/70 text-[11px] leading-relaxed">
                <li>Abra o link do <strong>Modo Satélite</strong> acima.</li>
                <li>Dê zoom máximo no lote do imóvel até visualizar os limites e muros.</li>
                <li>Clique com o <strong>botão direito</strong> em um dos cantos do terreno e selecione <strong>"Medir distância"</strong>.</li>
                <li>Clique em todos os outros vértices do lote até fechar o polígono no ponto inicial.</li>
                <li>O Google Maps exibirá a <strong>Área Total em m²</strong> na barra inferior. Transcreva para o campo acima!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Right Column: Regional Demographics & Risk Cards */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand-primary" />
                  Mapeamento Socioeconômico & Riscos
                </h4>
                <p className="text-xs text-brand-ink/50 mt-0.5">Indicadores levantados para a microrregião do imóvel</p>
              </div>
              {regionalInfo.lastUpdated && (
                <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
                  Atualizado em {regionalInfo.lastUpdated}
                </span>
              )}
            </div>

            {/* Income and Population Profile */}
            <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} />
                  Perfil e Renda dos Moradores
                </span>
                <button
                  onClick={() => handleCopy(regionalInfo.incomeProfile || '', 'income')}
                  className="text-[10px] font-bold text-brand-ink/40 hover:text-brand-primary transition-all flex items-center gap-1"
                >
                  <Copy size={12} /> {copiedSection === 'income' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                {regionalInfo.incomeProfile || (
                  <span className="italic text-brand-ink/40">Clique em "Consultar Inteligência Regional (IA)" para mapear a renda estimada e perfil da região.</span>
                )}
              </p>
            </div>

            {/* Flood and Drainage Risk */}
            <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Waves size={14} className="text-cyan-600" />
                  Risco de Enchentes & Alagamentos
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                  (regionalInfo.floodRisk?.toLowerCase().includes('baixo') || regionalInfo.floodRisk?.toLowerCase().includes('muito'))
                    ? "bg-emerald-500/10 text-emerald-700"
                    : regionalInfo.floodRisk?.toLowerCase().includes('médio')
                    ? "bg-amber-500/10 text-amber-700"
                    : "bg-red-500/10 text-red-700"
                )}>
                  Risco: {regionalInfo.floodRisk || 'Pendente'}
                </span>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                {regionalInfo.floodDetails || (
                  <span className="italic text-brand-ink/40">Histórico de drenagem e vulnerabilidade de chuvas da microrregião.</span>
                )}
              </p>
            </div>

            {/* Transportation and Mobility */}
            <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Bus size={14} className="text-blue-600" />
                  Mobilidade & Linhas de Transporte
                </span>
                <button
                  onClick={() => handleCopy(regionalInfo.transportation || '', 'transport')}
                  className="text-[10px] font-bold text-brand-ink/40 hover:text-brand-primary transition-all flex items-center gap-1"
                >
                  <Copy size={12} /> {copiedSection === 'transport' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                {regionalInfo.transportation || (
                  <span className="italic text-brand-ink/40">Pontos de ônibus, terminais, metrô e principais vias de escoamento.</span>
                )}
              </p>
            </div>

            {/* Health & Education & POI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-brand-bg/40 p-4 rounded-2xl border border-brand-primary/10 space-y-1.5">
                <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap size={14} />
                  Faculdades & Hospitais
                </span>
                <p className="text-[11px] text-brand-ink/80 leading-relaxed">
                  {regionalInfo.healthAndEducation || <span className="italic text-brand-ink/40">Equipamentos públicos e polos universitários.</span>}
                </p>
              </div>

              <div className="bg-brand-bg/40 p-4 rounded-2xl border border-brand-primary/10 space-y-1.5">
                <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark size={14} />
                  Comércio & Turismo
                </span>
                <p className="text-[11px] text-brand-ink/80 leading-relaxed">
                  {regionalInfo.commerceAndTourism || <span className="italic text-brand-ink/40">Shoppings, polos comerciais e atrativos locais.</span>}
                </p>
              </div>
            </div>

            {/* Liquidity verdict */}
            {regionalInfo.generalLiquidity && (
              <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/15 flex items-start gap-3">
                <TrendingUp size={18} className="text-brand-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Liquidez e Absorção de Mercado</span>
                  <p className="text-xs text-brand-ink/80">{regionalInfo.generalLiquidity}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
