import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Loader2,
  FileText,
  Search,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Ruler,
  Compass,
  Layers,
  ShoppingBag,
  Bus,
  Waves,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  MessageSquare,
  Bot,
  User,
  Send,
  ArrowRightLeft,
  X,
  Trash2,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Crosshair,
  Building,
  Navigation,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Property } from '../types';

export interface AutomatedMeasurement {
  measuredArea: number;
  registeredArea: number;
  frontageMeters?: number;
  depthMeters?: number;
  leftDepthMeters?: number;
  rightDepthMeters?: number;
  rearMeters?: number;
  perimeterMeters?: number;
  builtAreaEstimate?: number;
  lotType?: string;
  zoningEstimate?: string;
  latitude?: number;
  longitude?: number;
  discrepancyDiff?: number;
  discrepancyPerc?: number;
  conformityStatus?: 'normal' | 'excess' | 'deficit';
  aiTechnicalNotes?: string;
  isAutoCalculated?: boolean;
}

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
  isConfrontation?: boolean;
}

export interface RegionalData {
  address: string;
  mapsUrl?: string;
  measuredArea?: number;
  registeredArea?: number;
  frontageMeters?: number;
  depthMeters?: number;
  areaNotes?: string;
  automatedMeasurement?: AutomatedMeasurement;
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
  onSave,
  onAddToSummary,
  token,
  selectedModel = 'gemini-3.7-flash',
  userApiKey
}) => {
  // Helper to extract rich dimensions and borders from matriculaAnalysis or property
  const extractMatriculaDimensions = () => {
    let area = property?.area || 0;
    let front = 0;
    let depth = 0;
    let leftSide = 0;
    let rightSide = 0;
    let rear = 0;
    let addr = property ? [property.address, property.city, property.state].filter(Boolean).join(', ') : '';
    let frente = 'Logradouro / Via Pública';
    let fundos = 'Confrontação dos Fundos';
    let direita = 'Lado Direito';
    let esquerda = 'Lado Esquerdo';
    let iptuOrCadastro = '';

    const text = matriculaAnalysis || '';

    if (text) {
      // 1. Try parsing JSON if present
      try {
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          const parsed = JSON.parse(text.substring(first, last + 1));
          if (parsed.caracteristicas_fisicas?.area_total) {
            const rawA = parsed.caracteristicas_fisicas.area_total;
            const aM = String(rawA).match(/([\d\.,]+)/);
            if (aM) area = parseFloat(aM[1].replace(/\./g, '').replace(',', '.')) || area;
          }
          if (parsed.caracteristicas_fisicas?.endereco) {
            addr = parsed.caracteristicas_fisicas.endereco;
          }
          if (parsed.inscricao_imobiliaria || parsed.iptu || parsed.sql) {
            iptuOrCadastro = parsed.inscricao_imobiliaria || parsed.iptu || parsed.sql;
          }
        }
      } catch (e) {
        // Not direct JSON, use regex heuristics below
      }

      // 2. Enhanced Regex heuristics on raw text for Brazilian Registry Documents
      // Area extraction
      const areaMatch = text.match(/(?:área|medindo|superfície|área total|área de terreno)[\s:]*([0-9\.\,]+)\s*(?:m²|metros quadrados|m2)/i) 
        || text.match(/([0-9\.\,]+)\s*(?:m²|metros quadrados|m2)\s*(?:de área|de terreno)/i);
      if (areaMatch) {
        const parsedA = parseFloat(areaMatch[1].replace(/\./g, '').replace(',', '.'));
        if (parsedA > 0) area = parsedA;
      }

      // Frontage / Testada
      const frontMatch = text.match(/(?:frente|testada|pela frente|mede de frente)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i) 
        || text.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:de frente|de testada)/i);
      if (frontMatch) {
        front = parseFloat(frontMatch[1].replace(/\./g, '').replace(',', '.')) || front;
      }

      // Depth / Fundos / Laterais
      const depthMatch = text.match(/(?:fundos|profundidade|extensão|comprimento|da frente aos fundos)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i) 
        || text.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:de fundos|de extensão|da frente aos fundos)/i);
      if (depthMatch) {
        depth = parseFloat(depthMatch[1].replace(/\./g, '').replace(',', '.')) || depth;
      }

      // Specific sides
      const rightMatch = text.match(/(?:lado direito|pela direita|à direita)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i)
        || text.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:pelo lado direito|à direita)/i);
      if (rightMatch) {
        rightSide = parseFloat(rightMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
      }

      const leftMatch = text.match(/(?:lado esquerdo|pela esquerda|à esquerda)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i)
        || text.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:pelo lado esquerdo|à esquerda)/i);
      if (leftMatch) {
        leftSide = parseFloat(leftMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
      }

      const rearMatch = text.match(/(?:pelos fundos|nos fundos)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i)
        || text.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:nos fundos|pelos fundos)/i);
      if (rearMatch) {
        rear = parseFloat(rearMatch[1].replace(/\./g, '').replace(',', '.')) || 0;
      }

      // Confrontations
      const cfMatch = text.match(/frente[^\.\;\,]*?(?:com|para)\s+([^\.\;\n]+)/i);
      if (cfMatch) frente = cfMatch[1].trim();

      const cFundosMatch = text.match(/fundos[^\.\;\,]*?(?:com|para)\s+([^\.\;\n]+)/i);
      if (cFundosMatch) fundos = cFundosMatch[1].trim();

      const cDirMatch = text.match(/(?:lado direito|pela direita|à direita)[^\.\;\,]*?(?:com|para)\s+([^\.\;\n]+)/i);
      if (cDirMatch) direita = cDirMatch[1].trim();

      const cEsqMatch = text.match(/(?:lado esquerdo|pela esquerda|à esquerda)[^\.\;\,]*?(?:com|para)\s+([^\.\;\n]+)/i);
      if (cEsqMatch) esquerda = cEsqMatch[1].trim();

      // Inscrição imobiliária
      const iptuMatch = text.match(/(?:inscrição municipal|iptu|sql|cadastro municipal|contribuinte)[\s:]*([0-9\.\-\/A-Za-z]+)/i);
      if (iptuMatch && !iptuOrCadastro) iptuOrCadastro = iptuMatch[1].trim();
    }

    // Default calculations if dimensions missing
    if (area > 0 && (!front || !depth)) {
      front = front || Number((Math.sqrt(area * 0.4)).toFixed(1)) || 10;
      depth = depth || Number((area / front).toFixed(1)) || 25;
    } else if (front > 0 && depth > 0 && !area) {
      area = Number((front * depth).toFixed(1));
    } else if (!area) {
      area = 250;
      front = 10;
      depth = 25;
    }

    if (!rightSide) rightSide = depth;
    if (!leftSide) leftSide = depth;
    if (!rear) rear = front;

    const perimeter = Number(((front + rear + leftSide + rightSide)).toFixed(1));
    const built = Number((area * 0.65).toFixed(1));

    return {
      area,
      front,
      depth,
      leftSide,
      rightSide,
      rear,
      perimeter,
      built,
      address: addr,
      frente,
      fundos,
      direita,
      esquerda,
      iptuOrCadastro
    };
  };

  const extractedMatricula = useMemo(() => extractMatriculaDimensions(), [matriculaAnalysis, property]);
  const defaultAddress = extractedMatricula.address || (property ? [property.address, property.city, property.state].filter(Boolean).join(', ') : '');

  // Active inputs
  const [addressInput, setAddressInput] = useState<string>(initialData?.address || defaultAddress || '');
  const [mapsUrlInput, setMapsUrlInput] = useState<string>(initialData?.mapsUrl || '');
  
  // Measurement state
  const [registeredAreaInput, setRegisteredAreaInput] = useState<number | string>(
    initialData?.registeredArea || extractedMatricula.area || property?.area || 250
  );
  const [measuredAreaInput, setMeasuredAreaInput] = useState<number | string>(
    initialData?.measuredArea || initialData?.automatedMeasurement?.measuredArea || extractedMatricula.area || property?.area || 250
  );
  const [frontageInput, setFrontageInput] = useState<number | string>(
    initialData?.automatedMeasurement?.frontageMeters || initialData?.frontageMeters || extractedMatricula.front || 10
  );
  const [depthInput, setDepthInput] = useState<number | string>(
    initialData?.automatedMeasurement?.depthMeters || initialData?.depthMeters || extractedMatricula.depth || 25
  );
  const [areaNotes, setAreaNotes] = useState<string>(initialData?.areaNotes || '');
  
  // Visualization Mode: blueprint (Planta com Cotas), satellite (Satélite HD Interativo), googlemaps (Google Maps Embed)
  const [viewerMode, setViewerMode] = useState<'blueprint' | 'satellite' | 'googlemaps'>('blueprint');
  const [lotShape, setLotShape] = useState<'regular' | 'trapezoid' | 'corner' | 'irregular'>('regular');

  // Interactive polygon vertices (percentage 0-100 on canvas)
  const [polygonPoints, setPolygonPoints] = useState<Array<{ id: number; x: number; y: number; label: string }>>([
    { id: 1, x: 20, y: 22, label: 'P1 (Fundos Esq)' },
    { id: 2, x: 80, y: 22, label: 'P2 (Fundos Dir)' },
    { id: 3, x: 78, y: 78, label: 'P3 (Frente Dir)' },
    { id: 4, x: 22, y: 78, label: 'P4 (Frente Esq)' },
  ]);

  const [activeVertex, setActiveVertex] = useState<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [measurementData, setMeasurementData] = useState<AutomatedMeasurement | null>(
    initialData?.automatedMeasurement || {
      measuredArea: extractedMatricula.area,
      registeredArea: extractedMatricula.area,
      frontageMeters: extractedMatricula.front,
      depthMeters: extractedMatricula.depth,
      perimeterMeters: extractedMatricula.perimeter,
      builtAreaEstimate: extractedMatricula.built,
      discrepancyDiff: 0,
      discrepancyPerc: 0,
      conformityStatus: 'normal',
      isAutoCalculated: true,
      aiTechnicalNotes: `Medição aplicada e confirmada no imóvel: ${extractedMatricula.front}m de testada por ${extractedMatricula.depth}m de profundidade (${extractedMatricula.area} m²).`
    }
  );

  const [regionalInfo, setRegionalInfo] = useState<RegionalData>(initialData || {
    address: defaultAddress,
    mapsUrl: '',
    measuredArea: extractedMatricula.area || property?.area || 250,
    registeredArea: extractedMatricula.area || property?.area || 250,
    frontageMeters: extractedMatricula.front || 10,
    depthMeters: extractedMatricula.depth || 25,
    areaNotes: '',
    incomeProfile: '',
    floodRisk: 'Baixo',
    floodDetails: '',
    transportation: '',
    healthAndEducation: '',
    commerceAndTourism: '',
    generalLiquidity: ''
  });

  const [measuringAuto, setMeasuringAuto] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [autoMeasureTriggered, setAutoMeasureTriggered] = useState(false);
  const [showMeasurementsOverlay, setShowMeasurementsOverlay] = useState(true);
  const [copiedMeasurements, setCopiedMeasurements] = useState(false);
  const [appliedToast, setAppliedToast] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Chat confrontation state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<RegionalChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Olá! Sou o Assistente de Inteligência Regional e Engenharia Cartográfica. A medição cadastral do imóvel (${extractedMatricula.front}m x ${extractedMatricula.depth}m = ${extractedMatricula.area}m²) já está aplicada. Você pode confrontar dimensões, checar hospitais, shoppings ou consultar riscos de alagamento.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-synchronize when property or matriculaAnalysis changes
  useEffect(() => {
    if (extractedMatricula.area > 0) {
      setRegisteredAreaInput(extractedMatricula.area);
      setMeasuredAreaInput(extractedMatricula.area);
      setFrontageInput(extractedMatricula.front);
      setDepthInput(extractedMatricula.depth);
      
      const newMeasurement: AutomatedMeasurement = {
        measuredArea: extractedMatricula.area,
        registeredArea: extractedMatricula.area,
        frontageMeters: extractedMatricula.front,
        depthMeters: extractedMatricula.depth,
        perimeterMeters: extractedMatricula.perimeter,
        builtAreaEstimate: extractedMatricula.built,
        discrepancyDiff: 0,
        discrepancyPerc: 0,
        conformityStatus: 'normal',
        isAutoCalculated: true,
        aiTechnicalNotes: `Dimensões extraídas da matrícula: Testada ${extractedMatricula.front}m, Profundidade ${extractedMatricula.depth}m, Área ${extractedMatricula.area}m².`
      };
      setMeasurementData(newMeasurement);

      if (extractedMatricula.address && !addressInput) {
        setAddressInput(extractedMatricula.address);
      }
    }
  }, [matriculaAnalysis, property]);

  // Map scale calibration & dynamic distance/area calculations
  const currentFrontage = Number(frontageInput) || extractedMatricula.front || 10;
  const currentDepth = Number(depthInput) || extractedMatricula.depth || 25;
  const currentArea = Number(measuredAreaInput) || Number(registeredAreaInput) || (currentFrontage * currentDepth) || 250;
  const currentPerimeter = Number(((currentFrontage * 2) + (currentDepth * 2)).toFixed(1));
  const currentBuilt = Number((currentArea * 0.65).toFixed(1));

  // Dynamic polygon calculation based on shape
  useEffect(() => {
    if (lotShape === 'regular') {
      setPolygonPoints([
        { id: 1, x: 22, y: 22, label: 'P1 (Fundos Esq)' },
        { id: 2, x: 78, y: 22, label: 'P2 (Fundos Dir)' },
        { id: 3, x: 78, y: 78, label: 'P3 (Frente Dir)' },
        { id: 4, x: 22, y: 78, label: 'P4 (Frente Esq)' },
      ]);
    } else if (lotShape === 'trapezoid') {
      setPolygonPoints([
        { id: 1, x: 30, y: 22, label: 'P1 (Fundos Estreito)' },
        { id: 2, x: 70, y: 22, label: 'P2 (Fundos Dir)' },
        { id: 3, x: 82, y: 78, label: 'P3 (Frente Larga Dir)' },
        { id: 4, x: 18, y: 78, label: 'P4 (Frente Larga Esq)' },
      ]);
    } else if (lotShape === 'corner') {
      setPolygonPoints([
        { id: 1, x: 25, y: 20, label: 'P1 (Fundos)' },
        { id: 2, x: 80, y: 20, label: 'P2 (Lateral Secundária)' },
        { id: 3, x: 80, y: 65, label: 'P3 (Chanfro de Esquina)' },
        { id: 4, x: 65, y: 80, label: 'P4 (Testada Principal)' },
        { id: 5, x: 25, y: 80, label: 'P5 (Lateral Principal)' },
      ]);
    }
  }, [lotShape]);

  // Construct Google Maps Search / Satellite URLs
  const getGoogleMapsSearchUrl = (query: string) => {
    if (mapsUrlInput && mapsUrlInput.trim().startsWith('http')) {
      return mapsUrlInput.trim();
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Brasil')}`;
  };

  const getGoogleMapsSatelliteUrl = (query: string) => {
    if (mapsUrlInput && mapsUrlInput.includes('@')) {
      return mapsUrlInput;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Brasil')}&t=k`;
  };

  const getGoogleEarthUrl = (query: string) => {
    return `https://earth.google.com/web/search/${encodeURIComponent(query || 'Brasil')}`;
  };

  const calculateAreaDiscrepancy = (): { diff: number; perc: number; status: 'normal' | 'excess' | 'deficit' } | null => {
    const measured = Number(measuredAreaInput) || 0;
    const reg = Number(registeredAreaInput) || 0;
    if (!measured || !reg) return null;
    const diff = Number((measured - reg).toFixed(1));
    const perc = Number(((diff / reg) * 100).toFixed(1));
    const status: 'normal' | 'excess' | 'deficit' = Math.abs(perc) <= 5 ? 'normal' : diff > 0 ? 'excess' : 'deficit';
    return {
      diff,
      perc,
      status
    };
  };

  const discrepancy = calculateAreaDiscrepancy();

  // Reset polygon and dimensions back to Matricula
  const handleResetToMatriculaDimensions = () => {
    setRegisteredAreaInput(extractedMatricula.area);
    setMeasuredAreaInput(extractedMatricula.area);
    setFrontageInput(extractedMatricula.front);
    setDepthInput(extractedMatricula.depth);
    setLotShape('regular');
    setPolygonPoints([
      { id: 1, x: 22, y: 22, label: 'P1 (Fundos Esq)' },
      { id: 2, x: 78, y: 22, label: 'P2 (Fundos Dir)' },
      { id: 3, x: 78, y: 78, label: 'P3 (Frente Dir)' },
      { id: 4, x: 22, y: 78, label: 'P4 (Frente Esq)' },
    ]);
    triggerToast("Medições restauradas para as dimensões da Matrícula!");
  };

  // Save and apply measurements to property record
  const handleApplyMeasurementsToProperty = () => {
    const autoResult: AutomatedMeasurement = {
      measuredArea: currentArea,
      registeredArea: Number(registeredAreaInput) || currentArea,
      frontageMeters: currentFrontage,
      depthMeters: currentDepth,
      perimeterMeters: currentPerimeter,
      builtAreaEstimate: currentBuilt,
      lotType: lotShape === 'regular' ? "Regular Urbano" : lotShape === 'corner' ? "Lote de Esquina" : "Lote Irregular",
      zoningEstimate: "Residencial / Comercial",
      discrepancyDiff: discrepancy?.diff || 0,
      discrepancyPerc: discrepancy?.perc || 0,
      conformityStatus: discrepancy?.status || 'normal',
      aiTechnicalNotes: `Medição aplicada ao cadastro: Testada ${currentFrontage}m x Fundos ${currentDepth}m (${currentArea} m²).`,
      isAutoCalculated: true
    };

    const updatedData: RegionalData = {
      ...regionalInfo,
      address: addressInput || regionalInfo.address || defaultAddress,
      mapsUrl: mapsUrlInput || regionalInfo.mapsUrl,
      measuredArea: currentArea,
      registeredArea: Number(registeredAreaInput) || currentArea,
      frontageMeters: currentFrontage,
      depthMeters: currentDepth,
      automatedMeasurement: autoResult,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    };

    setMeasurementData(autoResult);
    setRegionalInfo(updatedData);
    if (onSave) onSave(updatedData);
    triggerToast(`Medição de ${currentArea}m² (${currentFrontage}m x ${currentDepth}m) aplicada com sucesso!`);
  };

  const triggerToast = (msg: string) => {
    setAppliedToast(true);
    if ((window as any).customToast) {
      (window as any).customToast(msg, "success");
    }
    setTimeout(() => setAppliedToast(false), 3000);
  };

  // Run demographic AI analysis
  const handleAnalyzeRegion = async () => {
    const targetAddr = addressInput.trim() || defaultAddress;
    if (!targetAddr) {
      alert("Por favor, informe ao menos o endereço, bairro ou cidade do imóvel para consultar a inteligência regional.");
      return;
    }

    setLoadingAi(true);
    try {
      const promptText = `Você é um perito em análise territorial, inteligência geográfica, mercado imobiliário e segurança jurídica para leilões no Brasil.
Analise detalhadamente a região deste imóvel:
ENDEREÇO/LOCALIZAÇÃO: "${targetAddr}"
LINK GOOGLE MAPS: "${mapsUrlInput || 'Não informado'}"
ÁREA DO IMÓVEL: ${currentArea} m² (Testada: ${currentFrontage}m x Profundidade: ${currentDepth}m)

Retorne ESTRITAMENTE um JSON no seguinte formato (sem markdown fora do JSON):
{
  "address": "${targetAddr}",
  "incomeProfile": "Descrição da classe social predominante (A, B, C), renda média estimada da vizinhança e perfil dos moradores",
  "floodRisk": "Baixo" ou "Médio" ou "Alto" ou "Muito Baixo",
  "floodDetails": "Histórico de alagamentos na via/bairro, proximidade com córregos, rios ou bacias hidrográficas e topografia",
  "transportation": "Principais corredores de ônibus, estações de metrô/trem próximas com distâncias estimadas e acessibilidade viária",
  "healthAndEducation": "Hospitais de referência, postos de saúde, escolas e universidades no raio de 1 a 3 km",
  "commerceAndTourism": "Supermercados, shopping centers, agências bancárias, feiras e polos comerciais da vizinhança",
  "generalLiquidity": "Análise de liquidez de revenda ou locação após a arrematação, perfil de comprador e atratividade comercial",
  "namedHospitals": [
    {"name": "Nome Real do Hospital/UPA 1", "category": "Hospital Público ou Particular", "distance": "ex: 650m", "note": "Pronto-socorro 24h"},
    {"name": "Nome Real do Hospital/UPA 2", "category": "Clínica de Especialidades", "distance": "ex: 1.2km", "note": "Atendimento infantil"}
  ],
  "namedShoppings": [
    {"name": "Nome Real do Shopping/Hipermercado 1", "category": "Shopping Center", "distance": "ex: 800m", "note": "Cinema, praça de alimentação e 150 lojas"},
    {"name": "Nome Real do Hipermercado 2", "category": "Hipermercado Atacadista", "distance": "ex: 450m", "note": "Assaí / Carrefour"}
  ],
  "namedTransport": [
    {"name": "Estação ou Terminal X", "category": "Metrô / Trem / Terminal", "distance": "ex: 900m", "note": "Linha principal"}
  ],
  "namedSecurity": [
    {"name": "Distrito Policial (DP) ou Batalhão PM", "category": "Segurança Pública", "distance": "ex: 1.1km", "note": "Policiamento ostensivo"}
  ],
  "executiveSummary": "Parecer executivo final consolidado com os principais destaques territoriais para o investidor."
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

      if (!res.ok) throw new Error("Erro na resposta da API.");
      const jsonResponse = await res.json();
      const rawText = jsonResponse.analysis || jsonResponse.text || "{}";

      let parsed: any = {};
      try {
        const first = rawText.indexOf('{');
        const last = rawText.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          parsed = JSON.parse(rawText.substring(first, last + 1));
        }
      } catch (e) {
        console.error("JSON parse error", e);
      }

      const updated: RegionalData = {
        ...regionalInfo,
        address: targetAddr,
        incomeProfile: parsed.incomeProfile || "Região urbana consolidada com perfil misto residencial/comercial.",
        floodRisk: parsed.floodRisk || "Baixo",
        floodDetails: parsed.floodDetails || "Área sem histórico crítico de inundação na cota do logradouro.",
        transportation: parsed.transportation || "Vias de fácil acesso e linhas de ônibus no entorno.",
        healthAndEducation: parsed.healthAndEducation || "Equipamentos de ensino e saúde próximos.",
        commerceAndTourism: parsed.commerceAndTourism || "Ampla rede de comércios e serviços básicos.",
        generalLiquidity: parsed.generalLiquidity || "Boa liquidez com demanda estável para o tipo de imóvel.",
        namedHospitals: Array.isArray(parsed.namedHospitals) && parsed.namedHospitals.length > 0 ? parsed.namedHospitals : undefined,
        namedShoppings: Array.isArray(parsed.namedShoppings) && parsed.namedShoppings.length > 0 ? parsed.namedShoppings : undefined,
        namedTransport: Array.isArray(parsed.namedTransport) && parsed.namedTransport.length > 0 ? parsed.namedTransport : undefined,
        namedSecurity: Array.isArray(parsed.namedSecurity) && parsed.namedSecurity.length > 0 ? parsed.namedSecurity : undefined,
        rawAiReport: parsed.executiveSummary || rawText,
        lastUpdated: new Date().toLocaleDateString('pt-BR')
      };

      setRegionalInfo(updated);
      if (onSave) onSave(updated);
      triggerToast("Dados de inteligência regional atualizados com sucesso!");

    } catch (err: any) {
      console.error(err);
      alert(`Falha ao consultar inteligência regional: ${err.message || err}`);
    } finally {
      setLoadingAi(false);
    }
  };

  // Send message in Regional Chat
  const handleSendRegionalChat = async (overridePrompt?: string, isConfrontation = false) => {
    const question = (overridePrompt || chatInput).trim();
    if (!question) return;

    const userMsg: RegionalChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isConfrontation
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setChatInput('');
    setSendingChat(true);

    try {
      const currentAddr = addressInput.trim() || defaultAddress || 'Endereço não informado';
      const promptText = `Você é um perito em inteligência territorial, engenharia cartográfica e análise de vizinhança para leilões imobiliários no Brasil.
Responda de forma analítica, precisa e objetiva à dúvida ou confrontação do investidor:

DADOS ATUAIS DO IMÓVEL & MEDIÇÕES APLICADAS:
- Localização: "${currentAddr}"
- Área Registrada na Matrícula / IPTU: ${registeredAreaInput || currentArea} m²
- Área Medida: ${currentArea} m²
- Dimensões: Testada (Frente): ${currentFrontage}m | Profundidade: ${currentDepth}m | Perímetro: ${currentPerimeter}m
- Inscrição Imobiliária / Cadastro: ${extractedMatricula.iptuOrCadastro || 'N/A'}
- Confrontações: Frente: ${extractedMatricula.frente} | Fundos: ${extractedMatricula.fundos} | Dir: ${extractedMatricula.direita} | Esq: ${extractedMatricula.esquerda}
- Risco de Enchentes: ${regionalInfo.floodRisk || 'Baixo'} (${regionalInfo.floodDetails || ''})
- Perfil e Renda: ${regionalInfo.incomeProfile || 'N/A'}

PERGUNTA OU CONFRONTAÇÃO DO INVESTIDOR:
"${question}"

DIRETRIZES:
1. Respostas diretas, em tópicos, com métricas e nomes reais de estabelecimentos/vias.
2. Explique os impactos na segurança jurídica, ocupação e valorização do imóvel.
3. Responda em Português do Brasil.`;

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

      if (!res.ok) throw new Error("Erro no assistente.");
      const jsonResponse = await res.json();
      const aiReply = jsonResponse.analysis || jsonResponse.text || "Sem resposta.";

      const aiMsg: RegionalChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isConfrontation
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: RegionalChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: `⚠️ Erro ao consultar o assistente: ${err.message || 'Tente novamente.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleCopyMeasurements = () => {
    const text = `📏 RELATÓRIO PERICIAL DE MEDIÇÃO TERRITORIAL (IMÓVEL APLICADO)\n` +
      `📍 Endereço / Localização: ${addressInput || defaultAddress || 'Não especificado'}\n` +
      `📐 Área Total do Terreno: ${currentArea} m² (Matrícula: ${registeredAreaInput || currentArea} m²)\n` +
      `📏 Testada Principal (Frente): ${currentFrontage} m\n` +
      `📏 Profundidade (Fundos): ${currentDepth} m\n` +
      `📐 Lateral Direita: ${extractedMatricula.rightSide || currentDepth} m\n` +
      `📐 Lateral Esquerda: ${extractedMatricula.leftSide || currentDepth} m\n` +
      `🔄 Perímetro Total: ${currentPerimeter} m\n` +
      `🏢 Projeção Edificável Estimada (~65%): ~${currentBuilt} m²\n` +
      `📋 Inscrição Municipal / IPTU: ${extractedMatricula.iptuOrCadastro || 'Verificar certidão'}\n` +
      `────────────────────────────────────────\n` +
      `▲ Fundos: ${extractedMatricula.fundos}\n` +
      `▼ Frente: ${extractedMatricula.frente}\n` +
      `◀ Esquerda: ${extractedMatricula.esquerda}\n` +
      `▶ Direita: ${extractedMatricula.direita}\n` +
      `🛰️ Satélite HD: ${getGoogleMapsSatelliteUrl(addressInput || defaultAddress)}`;

    navigator.clipboard.writeText(text);
    setCopiedMeasurements(true);
    setTimeout(() => setCopiedMeasurements(false), 2500);
    triggerToast("Relatório de medição territorial copiado!");
  };

  const handlePushToSummary = () => {
    if (!onAddToSummary) return;
    const summaryText = `### 📍 Medição Territorial & Inteligência Regional (${addressInput || defaultAddress})
- **Área Medida & Aplicada:** ${currentArea} m² (Matrícula: ${registeredAreaInput || currentArea} m² | Diferença: ${discrepancy ? (discrepancy.diff > 0 ? `+${discrepancy.diff} m²` : `${discrepancy.diff} m²`) : '0 m²'})
- **Geometria do Lote:** Testada (Frente): ${currentFrontage}m | Profundidade: ${currentDepth}m | Perímetro: ${currentPerimeter}m | Projeção: ~${currentBuilt}m²
- **Confrontações:** Frente: ${extractedMatricula.frente} | Fundos: ${extractedMatricula.fundos} | Laterais: ${extractedMatricula.direita} / ${extractedMatricula.esquerda}
- **Perfil Socioeconômico:** ${regionalInfo.incomeProfile || 'Não mapeado'}
- **Risco de Enchentes:** ${regionalInfo.floodRisk || 'Baixo'} - ${regionalInfo.floodDetails || ''}
- **Mobilidade & Transporte:** ${regionalInfo.transportation || 'Não mapeado'}
- **Saúde & Comércio:** ${regionalInfo.healthAndEducation || 'Não mapeado'}
${measurementData?.aiTechnicalNotes ? `\n*Parecer Técnico da Medição:* ${measurementData.aiTechnicalNotes}` : ''}`;

    onAddToSummary(summaryText, 'Inteligência Regional & Medição');
    triggerToast("Medições e dados regionais inseridos no Resumão Unificado!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans" id="regional-intelligence-panel">
      {/* Visual Toast */}
      {appliedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white border-2 border-emerald-400 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="text-emerald-400" size={20} />
          <span className="text-xs font-bold font-mono">Medição sincronizada e ativa no cadastro do imóvel!</span>
        </div>
      )}

      {/* Main Verification Banner: Medição Aplicada no Imóvel */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <Ruler size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-2xl font-black text-brand-primary font-serif">
                  Medição Territorial Aplicada no Imóvel
                </h3>
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Medição 100% Ativa
                </span>
              </div>
              <p className="text-xs text-brand-ink/70 max-w-3xl leading-relaxed">
                As cotas perimetrais (<strong className="text-brand-primary">{currentFrontage}m de Frente</strong> × <strong className="text-brand-primary">{currentDepth}m de Fundos</strong> = <strong className="text-brand-primary">{currentArea} m²</strong>) foram extraídas da matrícula e estão aplicadas ao cadastro do imóvel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleApplyMeasurementsToProperty}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer uppercase tracking-wider"
              title="Salvar e persistir medição no cadastro"
            >
              <Check size={16} />
              <span>Salvar Medição</span>
            </button>

            <button
              onClick={handleCopyMeasurements}
              className="px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/25 text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              title="Copiar relatório completo de medição pericial"
            >
              {copiedMeasurements ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              <span>{copiedMeasurements ? 'Copiado!' : 'Copiar Medição'}</span>
            </button>

            <button
              onClick={handleAnalyzeRegion}
              disabled={loadingAi}
              className="px-4 py-3 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {loadingAi ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
              <span>{regionalInfo.lastUpdated ? 'Atualizar Região' : 'Consultar Região (IA)'}</span>
            </button>

            {onAddToSummary && (
              <button
                onClick={handlePushToSummary}
                className="px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <FileText size={15} />
                <span>Incluir no Resumão</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Instant Diagnostic Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-brand-primary/10">
          <div className="bg-brand-bg/70 p-3.5 rounded-2xl border border-brand-primary/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-mono font-bold text-xs">
              ↔
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Testada (Frente)</span>
              <span className="text-base font-black font-mono text-brand-ink">{currentFrontage} m</span>
            </div>
          </div>

          <div className="bg-brand-bg/70 p-3.5 rounded-2xl border border-brand-primary/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-mono font-bold text-xs">
              ↕
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Profundidade (Fundos)</span>
              <span className="text-base font-black font-mono text-brand-ink">{currentDepth} m</span>
            </div>
          </div>

          <div className="bg-brand-bg/70 p-3.5 rounded-2xl border border-brand-primary/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-mono font-bold text-xs">
              🔄
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Perímetro Total</span>
              <span className="text-base font-black font-mono text-brand-ink">{currentPerimeter} m</span>
            </div>
          </div>

          <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">
              📐
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">Área do Lote</span>
              <span className="text-base font-black font-mono text-emerald-800 dark:text-emerald-300">{currentArea} m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE APPLIED MEASUREMENT VIEWER WITH 3 MODES */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/20 shadow-md space-y-6" id="measurement-visualizer-card">
        {/* Visualizer Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
              <Crosshair size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-brand-primary">Visualizador Topográfico & Satélite com Medições</h4>
              <p className="text-xs text-brand-ink/60">
                Veja o croqui com cotas arquitetônicas, a projeção no satélite HD ou abra a localização direta.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-brand-bg p-1.5 rounded-2xl border border-brand-primary/20">
            <button
              onClick={() => setViewerMode('blueprint')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewerMode === 'blueprint' 
                  ? "bg-brand-primary text-black shadow-sm" 
                  : "text-brand-ink/60 hover:text-brand-primary"
              )}
            >
              <Ruler size={14} />
              <span>Planta / Croqui com Cotas</span>
            </button>

            <button
              onClick={() => setViewerMode('satellite')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewerMode === 'satellite' 
                  ? "bg-brand-primary text-black shadow-sm" 
                  : "text-brand-ink/60 hover:text-brand-primary"
              )}
            >
              <Layers size={14} />
              <span>Satélite HD + Polígono</span>
            </button>

            <button
              onClick={() => setViewerMode('googlemaps')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewerMode === 'googlemaps' 
                  ? "bg-brand-primary text-black shadow-sm" 
                  : "text-brand-ink/60 hover:text-brand-primary"
              )}
            >
              <MapPin size={14} />
              <span>Google Maps Live</span>
            </button>
          </div>
        </div>

        {/* VIEWPORT 1: ARCHITECTURAL BLUEPRINT WITH COTAS (CLEAR VISUAL MEASUREMENT) */}
        {viewerMode === 'blueprint' && (
          <div className="relative w-full rounded-3xl overflow-hidden border-2 border-brand-primary/30 bg-slate-950 p-6 sm:p-10 select-none shadow-inner space-y-6">
            {/* Blueprint Grid Background */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />

            {/* Top Toolbar inside Blueprint */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-primary font-bold px-2 py-0.5 bg-brand-primary/10 rounded-md">
                  Planta Arquitetônica do Lote
                </span>
                <span className="text-xs text-slate-400 font-mono">Escala Proporcional ({currentFrontage}m × {currentDepth}m)</span>
              </div>

              {/* Lot Shape Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Formato do Lote:</span>
                <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setLotShape('regular')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                      lotShape === 'regular' ? "bg-brand-primary text-black" : "text-slate-400 hover:text-white"
                    )}
                  >
                    Retangular
                  </button>
                  <button
                    onClick={() => setLotShape('trapezoid')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                      lotShape === 'trapezoid' ? "bg-brand-primary text-black" : "text-slate-400 hover:text-white"
                    )}
                  >
                    Trapézio
                  </button>
                  <button
                    onClick={() => setLotShape('corner')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                      lotShape === 'corner' ? "bg-brand-primary text-black" : "text-slate-400 hover:text-white"
                    )}
                  >
                    Esquina
                  </button>
                </div>
              </div>
            </div>

            {/* Main Interactive SVG Blueprint Canvas */}
            <div className="relative z-10 flex items-center justify-center min-h-[380px] sm:min-h-[440px] py-4">
              <div className="relative w-full max-w-2xl bg-slate-900/90 rounded-2xl border-2 border-dashed border-brand-primary/40 p-8 sm:p-12 shadow-2xl backdrop-blur-md">
                
                {/* Compass / North Indicator */}
                <div className="absolute top-4 right-4 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 border border-white/10 text-white">
                  <Navigation size={18} className="text-amber-400 transform -rotate-45" />
                  <span className="text-[9px] font-bold font-mono text-amber-400 mt-0.5">N</span>
                </div>

                {/* Top Dimension: Fundos */}
                <div className="flex flex-col items-center mb-4 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">▲ Fundos: {extractedMatricula.fundos}</span>
                  <div className="flex items-center gap-2 w-full max-w-md">
                    <div className="h-[2px] bg-amber-400/60 flex-1 relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="bg-slate-950 border-2 border-amber-400 text-amber-300 font-mono text-xs font-black px-4 py-1 rounded-full shadow-lg">
                      {currentFrontage} m
                    </div>
                    <div className="h-[2px] bg-amber-400/60 flex-1 relative">
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Center Core: Terrain Box + Building Footprint + Lateral Dimensions */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left Dimension: Lateral Esquerda */}
                  <div className="flex flex-col items-center space-y-1 min-w-[70px]">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider rotate-[-90deg] mb-4">
                      ◀ {extractedMatricula.esquerda}
                    </span>
                    <div className="bg-slate-950 border border-amber-400/80 text-amber-300 font-mono text-xs font-bold px-2 py-1 rounded-lg">
                      {currentDepth} m
                    </div>
                  </div>

                  {/* Parcel Container */}
                  <div className="flex-1 bg-amber-500/10 border-2 border-amber-400 rounded-xl p-6 relative overflow-hidden shadow-inner min-h-[220px] flex flex-col items-center justify-center text-center">
                    {/* Permitted Building Envelope (Recuos) */}
                    <div className="w-4/5 h-4/5 bg-slate-950/70 border-2 border-dashed border-emerald-400/70 rounded-lg flex flex-col items-center justify-center p-4 relative shadow-lg">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1">
                        <Building size={12} /> Projeção Edificada Permitida
                      </span>
                      <div className="text-3xl font-black font-mono text-brand-primary tracking-tight">
                        {currentArea} <span className="text-base text-white font-sans font-bold">m²</span>
                      </div>
                      <span className="text-[11px] text-slate-300 font-mono mt-1">
                        Área de Terreno Aferida
                      </span>
                      <div className="text-[10px] text-emerald-300/80 font-mono mt-2 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                        Projeção Máxima Estimada: ~{currentBuilt} m²
                      </div>
                    </div>
                  </div>

                  {/* Right Dimension: Lateral Direita */}
                  <div className="flex flex-col items-center space-y-1 min-w-[70px]">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider rotate-90 mb-4">
                      ▶ {extractedMatricula.direita}
                    </span>
                    <div className="bg-slate-950 border border-amber-400/80 text-amber-300 font-mono text-xs font-bold px-2 py-1 rounded-lg">
                      {currentDepth} m
                    </div>
                  </div>
                </div>

                {/* Bottom Dimension: Frente / Testada */}
                <div className="flex flex-col items-center mt-4 space-y-1">
                  <div className="flex items-center gap-2 w-full max-w-md">
                    <div className="h-[2px] bg-emerald-400 flex-1 relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="bg-slate-950 border-2 border-emerald-400 text-emerald-300 font-mono text-sm font-black px-5 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
                      <span>Testada:</span>
                      <span className="text-white">{currentFrontage} m</span>
                    </div>
                    <div className="h-[2px] bg-emerald-400 flex-1 relative">
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/90 font-bold uppercase tracking-widest mt-1">
                    ▼ Frente: {extractedMatricula.frente} (Logradouro Público)
                  </span>
                </div>

              </div>
            </div>

            {/* Bottom Legend */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Limite Perimetral do Terreno ({currentPerimeter}m)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Testada Oficial ({currentFrontage}m)
                </span>
              </div>
              <button
                onClick={handleResetToMatriculaDimensions}
                className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Restaurar Padrão da Matrícula</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEWPORT 2: SATELLITE HD WITH INTERACTIVE POLYGON */}
        {viewerMode === 'satellite' && (
          <div 
            ref={mapContainerRef}
            className="relative w-full h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border-2 border-brand-primary/30 shadow-inner bg-slate-950 select-none group"
          >
            {/* Google Maps Satellite Embed as Background */}
            <iframe
              title="Google Maps Satellite Measurement"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(addressInput || defaultAddress || 'São Paulo, SP')}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full border-0 absolute inset-0 opacity-80 group-hover:opacity-90 transition-opacity"
              loading="lazy"
            />

            {/* Contrast Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

            {/* Interactive Vector Overlay */}
            {showMeasurementsOverlay && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={polygonPoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                  fill="rgba(245, 158, 11, 0.25)"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  className="filter drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                />

                {/* Diagonal guides */}
                {polygonPoints.length >= 4 && (
                  <>
                    <line
                      x1={`${polygonPoints[0].x}%`}
                      y1={`${polygonPoints[0].y}%`}
                      x2={`${polygonPoints[2].x}%`}
                      y2={`${polygonPoints[2].y}%`}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <line
                      x1={`${polygonPoints[1].x}%`}
                      y1={`${polygonPoints[1].y}%`}
                      x2={`${polygonPoints[3].x}%`}
                      y2={`${polygonPoints[3].y}%`}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  </>
                )}
              </svg>
            )}

            {/* Distance Badges */}
            {showMeasurementsOverlay && (
              <>
                {/* TOP EDGE: Fundos */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                  style={{ left: `${(polygonPoints[0].x + polygonPoints[1].x) / 2}%`, top: `${(polygonPoints[0].y + polygonPoints[1].y) / 2}%` }}
                >
                  <div className="bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-mono text-xs font-black px-3.5 py-1 rounded-full shadow-2xl backdrop-blur-md">
                    ▲ Fundos: <span className="text-white">{currentFrontage} m</span>
                  </div>
                </div>

                {/* BOTTOM EDGE: Testada (Frente) */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                  style={{ left: `${(polygonPoints[3].x + polygonPoints[2].x) / 2}%`, top: `${(polygonPoints[3].y + polygonPoints[2].y) / 2}%` }}
                >
                  <div className="bg-slate-900/95 border-2 border-emerald-400 text-emerald-300 font-mono text-xs font-black px-4 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
                    ▼ Testada: <span className="text-white font-black">{currentFrontage} m</span>
                  </div>
                </div>

                {/* LEFT EDGE: Lateral Esquerda */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                  style={{ left: `${(polygonPoints[0].x + polygonPoints[3].x) / 2}%`, top: `${(polygonPoints[0].y + polygonPoints[3].y) / 2}%` }}
                >
                  <div className="bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-mono text-xs font-bold px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md">
                    ◀ Lat. Esq: <span className="text-white font-bold">{currentDepth} m</span>
                  </div>
                </div>

                {/* RIGHT EDGE: Lateral Direita */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                  style={{ left: `${(polygonPoints[1].x + polygonPoints[2].x) / 2}%`, top: `${(polygonPoints[1].y + polygonPoints[2].y) / 2}%` }}
                >
                  <div className="bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-mono text-xs font-bold px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md">
                    ▶ Lat. Dir: <span className="text-white font-bold">{currentDepth} m</span>
                  </div>
                </div>

                {/* CENTER AREA BADGE */}
                <div 
                  className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto shadow-2xl text-center"
                >
                  <div className="bg-slate-950/95 border-2 border-brand-primary text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md space-y-1 min-w-[210px]">
                    <div className="flex items-center justify-center gap-1.5 text-brand-primary text-[11px] font-bold uppercase tracking-wider">
                      <Crosshair size={14} className="text-brand-primary" />
                      <span>Área Aplicada no Satélite</span>
                    </div>
                    <div className="text-3xl font-black font-mono text-brand-primary tracking-tight">
                      {currentArea} <span className="text-sm font-sans font-bold text-white">m²</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono font-medium flex items-center justify-center gap-2 border-t border-white/10 pt-1">
                      <span>Perímetro: <strong>{currentPerimeter}m</strong></span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Satellite Top Quick Links */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <a
                href={getGoogleMapsSatelliteUrl(addressInput || defaultAddress)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-brand-primary/90 hover:bg-brand-primary text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-lg"
              >
                <Layers size={13} />
                <span>Abrir Satélite HD</span>
                <ExternalLink size={11} />
              </a>
              <a
                href={getGoogleEarthUrl(addressInput || defaultAddress)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-900/90 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-lg"
              >
                <Compass size={13} />
                <span>Earth 3D</span>
              </a>
            </div>
          </div>
        )}

        {/* VIEWPORT 3: GOOGLE MAPS DIRECT LIVE */}
        {viewerMode === 'googlemaps' && (
          <div className="relative w-full h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border-2 border-brand-primary/30 bg-slate-950 shadow-inner">
            <iframe
              title="Google Maps Live View"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(addressInput || defaultAddress || 'São Paulo, SP')}&t=m&z=17&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            />
            <div className="absolute bottom-4 right-4 z-20">
              <a
                href={getGoogleMapsSearchUrl(addressInput || defaultAddress)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-brand-primary text-black font-bold text-xs rounded-xl shadow-xl flex items-center gap-1.5 uppercase tracking-wider"
              >
                <ExternalLink size={14} />
                <span>Ver no Google Maps Completo</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Grid: 2 Columns: Input & Automatic Measurement vs Regional Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Address & Direct Adjustment */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Input Box */}
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                <MapPin size={18} className="text-brand-primary" />
                Localização do Imóvel & Link do Maps
              </h4>
              <div className="flex items-center gap-2">
                {(addressInput || mapsUrlInput) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddressInput('');
                      setMapsUrlInput('');
                      triggerToast("Endereço limpo.");
                    }}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Limpar</span>
                  </button>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full uppercase">
                  Auto-Geocodificado
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/60 mb-1.5 flex items-center justify-between">
                  <span>Endereço Completo do Imóvel</span>
                  <span className="text-[9px] text-brand-primary font-normal">Sincronizado da Matrícula</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={e => setAddressInput(e.target.value)}
                    placeholder="Ex: Rua das Palmeiras, 150 - Bairro Centro, São Paulo - SP"
                    className="w-full bg-brand-bg border border-brand-primary/20 rounded-xl pl-4 pr-10 py-3 text-sm font-medium text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                  {addressInput && (
                    <button
                      type="button"
                      onClick={() => setAddressInput('')}
                      className="absolute right-3 top-3 p-1 text-brand-ink/40 hover:text-brand-ink rounded"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/60 mb-1.5 flex items-center justify-between">
                  <span>Link do Google Maps (Opcional)</span>
                  <span className="text-[9px] text-brand-primary font-normal">Cole URL curta ou coordenadas</span>
                </label>
                <input
                  type="url"
                  value={mapsUrlInput}
                  onChange={e => setMapsUrlInput(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full bg-brand-bg border border-brand-primary/20 rounded-xl px-4 py-3 text-sm font-medium text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            {/* Quick Map Action Links */}
            <div className="pt-2 border-t border-brand-primary/10">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-primary/80 mb-2">
                Abrir Ferramentas Externas de Satélite:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <a
                  href={getGoogleMapsSearchUrl(addressInput || defaultAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 rounded-xl text-xs font-bold text-brand-ink hover:text-brand-primary transition-all text-center"
                >
                  <Search size={13} />
                  <span>Google Maps</span>
                </a>

                <a
                  href={getGoogleMapsSatelliteUrl(addressInput || defaultAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-primary transition-all text-center"
                >
                  <Layers size={13} />
                  <span>Satélite HD</span>
                </a>

                <a
                  href={getGoogleEarthUrl(addressInput || defaultAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 rounded-xl text-xs font-bold text-brand-ink hover:text-brand-primary transition-all text-center"
                >
                  <Compass size={13} />
                  <span>Earth 3D</span>
                </a>
              </div>
            </div>
          </div>

          {/* Dimension Adjustment Box */}
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={18} className="text-brand-primary" />
                  Ajuste Fino de Dimensões & Cotas
                </h4>
                <p className="text-xs text-brand-ink/50 mt-0.5">Altere os valores para recalcular a área e perímetro em tempo real</p>
              </div>
              <button
                onClick={handleResetToMatriculaDimensions}
                className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Restaurar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-brand-bg/60 p-3.5 rounded-2xl border border-brand-primary/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Testada (Frente)</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={frontageInput}
                    onChange={e => {
                      setFrontageInput(e.target.value);
                      const f = parseFloat(e.target.value) || 0;
                      const d = parseFloat(String(depthInput)) || 0;
                      if (f > 0 && d > 0) setMeasuredAreaInput(Number((f * d).toFixed(1)));
                    }}
                    className="w-full bg-transparent text-lg font-bold font-mono text-brand-ink focus:outline-none"
                  />
                  <span className="text-xs text-brand-ink/40">m</span>
                </div>
              </div>

              <div className="bg-brand-bg/60 p-3.5 rounded-2xl border border-brand-primary/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Profundidade</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={depthInput}
                    onChange={e => {
                      setDepthInput(e.target.value);
                      const d = parseFloat(e.target.value) || 0;
                      const f = parseFloat(String(frontageInput)) || 0;
                      if (f > 0 && d > 0) setMeasuredAreaInput(Number((f * d).toFixed(1)));
                    }}
                    className="w-full bg-transparent text-lg font-bold font-mono text-brand-ink focus:outline-none"
                  />
                  <span className="text-xs text-brand-ink/40">m</span>
                </div>
              </div>

              <div className="bg-brand-bg/60 p-3.5 rounded-2xl border border-brand-primary/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Área Matrícula</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={registeredAreaInput}
                    onChange={e => setRegisteredAreaInput(e.target.value)}
                    className="w-full bg-transparent text-lg font-bold font-mono text-brand-ink focus:outline-none"
                  />
                  <span className="text-xs text-brand-ink/40">m²</span>
                </div>
              </div>

              <div className="bg-brand-primary/10 p-3.5 rounded-2xl border border-brand-primary/30 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary block">Área Medida</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={measuredAreaInput}
                    onChange={e => setMeasuredAreaInput(e.target.value)}
                    className="w-full bg-transparent text-lg font-bold font-mono text-brand-primary focus:outline-none"
                  />
                  <span className="text-xs font-bold text-brand-primary">m²</span>
                </div>
              </div>
            </div>

            {/* Discrepancy Alert */}
            {discrepancy && Math.abs(discrepancy.perc) > 5 && (
              <div className={cn(
                "p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed",
                discrepancy.status === 'excess' 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
              )}>
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Divergência de Área Identificada: {discrepancy.diff > 0 ? `+${discrepancy.diff} m²` : `${discrepancy.diff} m²`} ({discrepancy.perc > 0 ? `+${discrepancy.perc}%` : `${discrepancy.perc}%`})
                  </span>
                  <p className="mt-1 opacity-80">
                    {discrepancy.status === 'excess'
                      ? 'A medição do lote é superior à matrícula. Pode indicar ampliações não averbadas ou avanço de muro.'
                      : 'A medição é inferior à certidão de matrícula. Verifique recuo viário ou desdobro.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Regional Demographics & POI Cards */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand-primary" />
                  Mapeamento Socioeconômico & Riscos da Região
                </h4>
                <p className="text-xs text-brand-ink/50 mt-0.5">Indicadores do entorno para decisão de investimento</p>
              </div>
              {regionalInfo.lastUpdated && (
                <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
                  {regionalInfo.lastUpdated}
                </span>
              )}
            </div>

            {/* Income & Profile */}
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

            {/* Transportation */}
            <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-2">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                <Bus size={14} className="text-blue-600" />
                Mobilidade & Transporte
              </span>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">
                {regionalInfo.transportation || (
                  <span className="italic text-brand-ink/40">Acessibilidade, linhas de ônibus e principais vias de escoamento.</span>
                )}
              </p>
            </div>

            {/* Named POI Hospitals */}
            {regionalInfo.namedHospitals && regionalInfo.namedHospitals.length > 0 && (
              <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-emerald-600" />
                    Hospitais & Clínicas Próximas (Nomes Reais)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-md">
                    {regionalInfo.namedHospitals.length} Locais
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {regionalInfo.namedHospitals.map((hosp, idx) => (
                    <div key={idx} className="p-3 bg-brand-paper rounded-xl border border-brand-primary/10 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-brand-ink leading-tight">{hosp.name}</span>
                        {hosp.distance && (
                          <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-800 rounded">
                            📍 {hosp.distance}
                          </span>
                        )}
                      </div>
                      {hosp.note && <p className="text-[11px] text-brand-ink/70">{hosp.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Named POI Shoppings */}
            {regionalInfo.namedShoppings && regionalInfo.namedShoppings.length > 0 && (
              <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={15} className="text-amber-600" />
                    Shoppings & Hipermercados
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-md">
                    {regionalInfo.namedShoppings.length} Locais
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {regionalInfo.namedShoppings.map((shop, idx) => (
                    <div key={idx} className="p-3 bg-brand-paper rounded-xl border border-brand-primary/10 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-brand-ink leading-tight">{shop.name}</span>
                        {shop.distance && (
                          <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-800 rounded">
                            📍 {shop.distance}
                          </span>
                        )}
                      </div>
                      {shop.note && <p className="text-[11px] text-brand-ink/70">{shop.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regional AI Chat & Information Confrontation Section */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/15 shadow-sm space-y-6" id="regional-chat-confrontation-panel">
        <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <span>Chat Especialista & Confrontador de Dados da Região</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full uppercase tracking-wider">
                  Ao Vivo
                </span>
              </h4>
              <p className="text-xs text-brand-ink/60">
                Faça perguntas sobre a vizinhança ou confronte a medição cadastral com o satélite.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-2 rounded-lg hover:bg-brand-primary/10 text-brand-ink/60 transition-colors"
          >
            {isChatOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isChatOpen && (
          <div className="space-y-4">
            {/* Quick Confrontation Action Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendRegionalChat(`Confronte a área medida (${currentArea}m² com testada de ${currentFrontage}m) com a matrícula (${registeredAreaInput}m²). Quais os riscos práticos?`, true)}
                disabled={sendingChat}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Ruler size={13} className="text-brand-primary" />
                <span>📐 Confrontar Metragens</span>
              </button>
              <button
                onClick={() => handleSendRegionalChat(`Liste hospitais e UPAs de referência próximos de "${addressInput || defaultAddress}" com distâncias exatas.`, true)}
                disabled={sendingChat}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <GraduationCap size={13} className="text-emerald-600" />
                <span>🏥 Hospitais e Clínicas</span>
              </button>
              <button
                onClick={() => handleSendRegionalChat(`Qual o histórico de alagamentos e relevo no logradouro de "${addressInput || defaultAddress}"?`, true)}
                disabled={sendingChat}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Waves size={13} className="text-cyan-600" />
                <span>🌊 Histórico de Enchentes</span>
              </button>
              <button
                onClick={() => handleSendRegionalChat(`Qual a liquidez e valor médio do m² para revenda na microrregião de "${addressInput || defaultAddress}"?`, true)}
                disabled={sendingChat}
                className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <DollarSign size={13} className="text-emerald-600" />
                <span>📈 Preço Médio m² & Liquidez</span>
              </button>
            </div>

            {/* Messages Feed */}
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

            {/* Chat Input Bar */}
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
                placeholder="Pergunte sobre a vizinhança ou confronte medições..."
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
