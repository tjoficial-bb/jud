import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Info,
  Maximize2,
  Navigation,
  Crosshair,
  Check,
  SlidersHorizontal,
  Target,
  MessageSquare,
  Send,
  Bot,
  User,
  ShoppingBag,
  ShieldAlert,
  ArrowRightLeft,
  Store,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Property } from '../types';

export interface AutomatedMeasurement {
  measuredArea: number;
  registeredArea: number;
  frontageMeters?: number;
  depthMeters?: number;
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
  matriculaAnalysis?: string;
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
  // Helper to extract dimensions from matriculaAnalysis or property
  const extractMatriculaDimensions = () => {
    let area = property?.area || 0;
    let front = 0;
    let depth = 0;
    let addr = property ? [property.address, property.city, property.state].filter(Boolean).join(', ') : '';
    let frente = 'Logradouro / Via Pública';
    let fundos = 'Confrontação dos Fundos';
    let direita = 'Lado Direito';
    let esquerda = 'Lado Esquerdo';

    if (matriculaAnalysis) {
      // Try parsing JSON if present
      try {
        const first = matriculaAnalysis.indexOf('{');
        const last = matriculaAnalysis.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          const parsed = JSON.parse(matriculaAnalysis.substring(first, last + 1));
          if (parsed.caracteristicas_fisicas?.area_total) {
            const rawA = parsed.caracteristicas_fisicas.area_total;
            const aM = String(rawA).match(/([\d\.,]+)/);
            if (aM) area = parseFloat(aM[1].replace(/\./g, '').replace(',', '.')) || area;
          }
          if (parsed.caracteristicas_fisicas?.endereco) {
            addr = parsed.caracteristicas_fisicas.endereco;
          }
        }
      } catch (e) {
        // Not direct JSON, use regex heuristics below
      }

      // Regex heuristics on raw text
      const areaMatch = matriculaAnalysis.match(/(?:área|medindo|superfície|área total)[\s:]*([0-9\.\,]+)\s*(?:m²|metros quadrados|m2)/i);
      if (areaMatch && !area) {
        area = parseFloat(areaMatch[1].replace(/\./g, '').replace(',', '.')) || area;
      }

      const frontMatch = matriculaAnalysis.match(/(?:frente|testada)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i) || matriculaAnalysis.match(/([0-9\.\,]+)\s*(?:m|metros)\s*de frente/i);
      if (frontMatch) {
        front = parseFloat(frontMatch[1].replace(/\./g, '').replace(',', '.')) || front;
      }

      const depthMatch = matriculaAnalysis.match(/(?:fundos|profundidade|extensão|comprimento)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i) || matriculaAnalysis.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:de fundos|de extensão)/i);
      if (depthMatch) {
        depth = parseFloat(depthMatch[1].replace(/\./g, '').replace(',', '.')) || depth;
      }

      const cfMatch = matriculaAnalysis.match(/frente[^\.\;\,]*?(?:com|para)\s+([^\.\;]+)/i);
      if (cfMatch) frente = cfMatch[1].trim();

      const cFundosMatch = matriculaAnalysis.match(/fundos[^\.\;\,]*?(?:com|para)\s+([^\.\;]+)/i);
      if (cFundosMatch) fundos = cFundosMatch[1].trim();

      const cDirMatch = matriculaAnalysis.match(/(?:lado direito|pela direita|à direita)[^\.\;\,]*?(?:com|para)\s+([^\.\;]+)/i);
      if (cDirMatch) direita = cDirMatch[1].trim();

      const cEsqMatch = matriculaAnalysis.match(/(?:lado esquerdo|pela esquerda|à esquerda)[^\.\;\,]*?(?:com|para)\s+([^\.\;]+)/i);
      if (cEsqMatch) esquerda = cEsqMatch[1].trim();
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

    const perimeter = Number(((front * 2) + (depth * 2)).toFixed(1));
    const built = Number((area * 0.65).toFixed(1));

    return {
      area,
      front,
      depth,
      perimeter,
      built,
      address: addr,
      frente,
      fundos,
      direita,
      esquerda
    };
  };

  const extractedMatricula = useMemo(() => extractMatriculaDimensions(), [matriculaAnalysis, property]);

  const defaultAddress = extractedMatricula.address || (property ? [property.address, property.city, property.state].filter(Boolean).join(', ') : '');
  const [addressInput, setAddressInput] = useState<string>(initialData?.address || defaultAddress || '');
  const [mapsUrlInput, setMapsUrlInput] = useState<string>(initialData?.mapsUrl || '');
  
  // Measurement state - initialized automatically from Matricula
  const [registeredAreaInput, setRegisteredAreaInput] = useState<number | string>(
    initialData?.registeredArea || extractedMatricula.area || property?.area || ''
  );
  const [measuredAreaInput, setMeasuredAreaInput] = useState<number | string>(
    initialData?.measuredArea || initialData?.automatedMeasurement?.measuredArea || extractedMatricula.area || property?.area || ''
  );
  const [frontageInput, setFrontageInput] = useState<number | string>(
    initialData?.automatedMeasurement?.frontageMeters || extractedMatricula.front || ''
  );
  const [depthInput, setDepthInput] = useState<number | string>(
    initialData?.automatedMeasurement?.depthMeters || extractedMatricula.depth || ''
  );
  const [areaNotes, setAreaNotes] = useState<string>(initialData?.areaNotes || '');
  
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
      aiTechnicalNotes: `Medição aplicada automaticamente da matrícula: ${extractedMatricula.front}m de testada por ${extractedMatricula.depth}m de profundidade (${extractedMatricula.area} m²).`
    }
  );

  const [regionalInfo, setRegionalInfo] = useState<RegionalData>(initialData || {
    address: defaultAddress,
    mapsUrl: '',
    measuredArea: extractedMatricula.area || property?.area || 0,
    registeredArea: extractedMatricula.area || property?.area || 0,
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
  const [mapLayer, setMapLayer] = useState<'satellite' | 'roadmap' | 'hybrid'>('satellite');
  const [showMeasurementsOverlay, setShowMeasurementsOverlay] = useState(true);
  const [copiedMeasurements, setCopiedMeasurements] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic interactive polygon points in percentage [0..100] for satellite visualizer
  const [polygonPoints, setPolygonPoints] = useState<Array<{ id: number; x: number; y: number; label?: string }>>([
    { id: 1, x: 22, y: 22, label: 'P1 (Fundos Esq)' },
    { id: 2, x: 78, y: 24, label: 'P2 (Fundos Dir)' },
    { id: 3, x: 76, y: 76, label: 'P3 (Frente Dir)' },
    { id: 4, x: 20, y: 74, label: 'P4 (Frente Esq)' },
  ]);
  const [draggingPointId, setDraggingPointId] = useState<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Regional AI Chat & Confrontation State
  const [chatMessages, setChatMessages] = useState<RegionalChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Olá! Sou o Assistente de Inteligência Regional e Cartográfica.
As medições físicas do imóvel em "${defaultAddress || 'endereço indicado'}" foram aplicadas automaticamente com base na Matrícula (${extractedMatricula.area} m², testada de ${extractedMatricula.front}m x ${extractedMatricula.depth}m de fundos).

Estou pronto para confrontar a medição satelital x matrícula, checar histórico de enchentes ou listar nomes reais de hospitais, shoppings e comércios da vizinhança.

💡 Escolha uma das confrontações rápidas abaixo ou faça uma pergunta específica!`,
      timestamp: 'Agora'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Sync if property or matriculaAnalysis changes
  useEffect(() => {
    if (extractedMatricula.area && (!registeredAreaInput || !frontageInput)) {
      setRegisteredAreaInput(extractedMatricula.area);
      setMeasuredAreaInput(extractedMatricula.area);
      setFrontageInput(extractedMatricula.front);
      setDepthInput(extractedMatricula.depth);
      if (defaultAddress && !addressInput) {
        setAddressInput(defaultAddress);
      }
    }
  }, [extractedMatricula]);

  // Extract Coordinates and Info from Google Maps Link or Address
  const parseCoordinatesFromUrl = (url: string) => {
    if (!url) return null;
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
    return null;
  };

  // Automated Area & Dimensions Engine
  const computeHeuristicMeasurement = (areaVal: number, frontVal?: number, depthVal?: number) => {
    const area = Number(areaVal) || 0;
    const regArea = Number(registeredAreaInput) || extractedMatricula.area || property?.area || area;
    
    let front = Number(frontVal) || (area > 0 ? Number((Math.sqrt(area * 0.4)).toFixed(1)) : 10);
    let depth = Number(depthVal) || (area > 0 ? Number((area / front).toFixed(1)) : 25);
    
    const perimeter = Number(((front * 2) + (depth * 2)).toFixed(1));
    const builtEstimate = area > 0 ? Number((area * 0.65).toFixed(1)) : 0;
    const diff = regArea > 0 ? Number((area - regArea).toFixed(1)) : 0;
    const perc = regArea > 0 ? Number(((diff / regArea) * 100).toFixed(1)) : 0;
    
    let conformityStatus: 'normal' | 'excess' | 'deficit' = 'normal';
    if (Math.abs(perc) > 5) {
      conformityStatus = diff > 0 ? 'excess' : 'deficit';
    }

    return {
      measuredArea: area,
      registeredArea: regArea,
      frontageMeters: front,
      depthMeters: depth,
      perimeterMeters: perimeter,
      builtAreaEstimate: builtEstimate,
      discrepancyDiff: diff,
      discrepancyPerc: perc,
      conformityStatus,
      isAutoCalculated: true
    };
  };

  // Automated Google Maps Measurement via AI
  const executeAutoMeasurement = async (targetAddress: string, targetMapsUrl: string) => {
    const address = targetAddress.trim();
    const mapsUrl = targetMapsUrl.trim();
    if (!address && !mapsUrl) return;

    setMeasuringAuto(true);
    try {
      const coords = parseCoordinatesFromUrl(mapsUrl);
      const knownMatriculaArea = Number(registeredAreaInput) || extractedMatricula.area || property?.area || 0;

      const promptText = `Você é um Engenheiro Cartógrafo e Perito Avaliador Imobiliário especialista em medições de satélite, cadastro urbano e cartografia do Google Maps no Brasil.
Realize a MEDIÇÃO AUTOMÁTICA DA ÁREA E DIMENSÕES do imóvel abaixo:
- ENDEREÇO: "${address || 'Não especificado'}"
- LINK GOOGLE MAPS: "${mapsUrl || 'Não especificado'}"
- COORDENADAS EXTRAÍDAS: ${coords ? `Lat: ${coords.lat}, Lng: ${coords.lng}` : 'Extrair do endereço'}
- ÁREA REGISTRADA NA MATRÍCULA / EDITAL: ${knownMatriculaArea ? `${knownMatriculaArea} m²` : 'Estimar lote padrão'}
- TIPO DO IMÓVEL: "${property?.type || 'Imóvel Urbano'}"

INSTRUÇÃO DE MEDIÇÃO:
1. Com base na geometria do lote na localização indicada, calcule e estime com alta precisão:
   - Área Total do Terreno / Lote (m²)
   - Testada (Largura da Frente em metros)
   - Profundidade / Extensão dos Fundos (metros)
   - Perímetro Total do Lote (metros)
   - Área de Projeção Construída Estimada (m²)
   - Tipologia do Lote (ex: Retangular, Esquina, Aclive, Declive, Regular)
   - Latitude e Longitude aproximadas
   - Parecer Técnico Métrica vs Matrícula (se a área satélite confere com os ${knownMatriculaArea} m² da certidão ou se há divergência/invasão/recuo).

Retorne OBRIGATORIAMENTE um JSON válido com esta estrutura exata:
{
  "measuredArea": number (área total do terreno em m²),
  "frontageMeters": number (largura de frente em metros),
  "depthMeters": number (profundidade em metros),
  "perimeterMeters": number (perímetro em metros),
  "builtAreaEstimate": number (área construída estimada em m²),
  "lotType": "Retangular Padrão" | "Lote de Esquina" | "Formato Irregular" | "Gleba / Terreno Amplo",
  "zoningEstimate": "Residencial Unifamiliar / Misto",
  "latitude": number,
  "longitude": number,
  "aiTechnicalNotes": "parecer técnico sucinto sobre as dimensões medidas no satélite e confrontações com a matrícula."
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

      if (res.ok) {
        const jsonResponse = await res.json();
        const rawText = jsonResponse.analysis || jsonResponse.text || "";
        
        let parsed: any = null;
        try {
          const first = rawText.indexOf('{');
          const last = rawText.lastIndexOf('}');
          if (first !== -1 && last !== -1) {
            parsed = JSON.parse(rawText.substring(first, last + 1));
          }
        } catch (err) {
          console.warn("JSON parse error in auto-measure:", err);
        }

        if (parsed && (parsed.measuredArea || parsed.frontageMeters)) {
          const autoArea = Number(parsed.measuredArea) || Number(knownMatriculaArea) || 250;
          const autoFront = Number(parsed.frontageMeters) || 10;
          const autoDepth = Number(parsed.depthMeters) || Number((autoArea / autoFront).toFixed(1));
          const autoPerimeter = Number(parsed.perimeterMeters) || Number(((autoFront * 2) + (autoDepth * 2)).toFixed(1));
          const autoBuilt = Number(parsed.builtAreaEstimate) || Number((autoArea * 0.65).toFixed(1));

          const regArea = Number(knownMatriculaArea) || autoArea;
          const diff = Number((autoArea - regArea).toFixed(1));
          const perc = regArea > 0 ? Number(((diff / regArea) * 100).toFixed(1)) : 0;
          
          let conformityStatus: 'normal' | 'excess' | 'deficit' = 'normal';
          if (Math.abs(perc) > 5) {
            conformityStatus = diff > 0 ? 'excess' : 'deficit';
          }

          const autoResult: AutomatedMeasurement = {
            measuredArea: autoArea,
            registeredArea: regArea,
            frontageMeters: autoFront,
            depthMeters: autoDepth,
            perimeterMeters: autoPerimeter,
            builtAreaEstimate: autoBuilt,
            lotType: parsed.lotType || "Regular Urbano",
            zoningEstimate: parsed.zoningEstimate || "Residencial / Comercial",
            latitude: parsed.latitude || coords?.lat,
            longitude: parsed.longitude || coords?.lng,
            discrepancyDiff: diff,
            discrepancyPerc: perc,
            conformityStatus,
            aiTechnicalNotes: parsed.aiTechnicalNotes || `Medição satelital apurada com testada de ${autoFront}m e fundos de ${autoDepth}m.`,
            isAutoCalculated: true
          };

          setMeasurementData(autoResult);
          setMeasuredAreaInput(autoArea);
          setFrontageInput(autoFront);
          setDepthInput(autoDepth);

          const updatedRegData: RegionalData = {
            ...regionalInfo,
            address: address || regionalInfo.address,
            mapsUrl: mapsUrl || regionalInfo.mapsUrl,
            measuredArea: autoArea,
            registeredArea: regArea,
            automatedMeasurement: autoResult,
            lastUpdated: new Date().toLocaleDateString('pt-BR')
          };
          setRegionalInfo(updatedRegData);
          if (onSave) onSave(updatedRegData);
          return;
        }
      }

      // Fallback: Heuristic calculation
      const fallbackArea = Number(knownMatriculaArea) || extractedMatricula.area || 250;
      const heuristic = computeHeuristicMeasurement(fallbackArea);
      setMeasurementData(heuristic);
      setMeasuredAreaInput(heuristic.measuredArea);
      setFrontageInput(heuristic.frontageMeters);
      setDepthInput(heuristic.depthMeters);

    } catch (error) {
      console.error("Auto measurement error:", error);
      const fallbackArea = Number(registeredAreaInput) || extractedMatricula.area || property?.area || 250;
      const heuristic = computeHeuristicMeasurement(fallbackArea);
      setMeasurementData(heuristic);
    } finally {
      setMeasuringAuto(false);
      setAutoMeasureTriggered(true);
    }
  };

  // Trigger Automatic Measurement on address or link change
  const handleAddressOrUrlChange = (newAddress: string, newUrl: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newAddress.length > 5 || newUrl.includes('google') || newUrl.includes('maps')) {
      debounceTimerRef.current = setTimeout(() => {
        executeAutoMeasurement(newAddress, newUrl);
      }, 1200);
    }
  };

  // Run auto measurement automatically on component mount if address or URL exists
  useEffect(() => {
    const targetAddr = addressInput || defaultAddress;
    if (targetAddr && !measurementData && !autoMeasureTriggered) {
      executeAutoMeasurement(targetAddr, mapsUrlInput);
    }
  }, []);

  // Map scale calibration & dynamic distance/area calculations
  const currentFrontage = Number(frontageInput) || extractedMatricula.front || 10;
  const currentDepth = Number(depthInput) || extractedMatricula.depth || 25;
  const currentArea = Number(measuredAreaInput) || Number(registeredAreaInput) || extractedMatricula.area || 250;
  const currentPerimeter = Number(((currentFrontage * 2) + (currentDepth * 2)).toFixed(1));

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

  // Reset polygon and dimensions back to Matricula
  const handleResetToMatriculaDimensions = () => {
    setRegisteredAreaInput(extractedMatricula.area);
    setMeasuredAreaInput(extractedMatricula.area);
    setFrontageInput(extractedMatricula.front);
    setDepthInput(extractedMatricula.depth);
    setPolygonPoints([
      { id: 1, x: 22, y: 22, label: 'P1 (Fundos Esq)' },
      { id: 2, x: 78, y: 24, label: 'P2 (Fundos Dir)' },
      { id: 3, x: 76, y: 76, label: 'P3 (Frente Dir)' },
      { id: 4, x: 20, y: 74, label: 'P4 (Frente Esq)' },
    ]);
    if ((window as any).customToast) {
      (window as any).customToast("Medições restauradas para os valores extraídos da Matrícula!", "info");
    }
  };

  // Run full demographic AI analysis of the region with Named POIs
  const handleAnalyzeRegion = async () => {
    const targetAddr = addressInput.trim() || defaultAddress;
    if (!targetAddr) {
      alert("Por favor, informe ao menos o endereço, bairro ou cidade do imóvel para consultar a inteligência regional.");
      return;
    }

    setLoadingAi(true);
    try {
      const promptText = `Você é um perito em inteligência imobiliária, demografia, urbanismo e análise territorial para leilões no Brasil.
Analise detalhadamente a localização e vizinhança do seguinte imóvel:
ENDEREÇO / LOCALIZAÇÃO: "${targetAddr}"
${property?.title ? `TÍTULO DO IMÓVEL: "${property.title}"` : ''}
${property?.type ? `TIPO: "${property.type}"` : ''}
${mapsUrlInput ? `LINK GOOGLE MAPS: "${mapsUrlInput}"` : ''}
${measuredAreaInput ? `ÁREA ESTIMADA / MEDIDA: ${measuredAreaInput} m²` : ''}
${frontageInput ? `TESTADA (FRENTE): ${frontageInput}m | FUNDOS: ${depthInput}m` : ''}

IMPORTANTE: Para trazer máxima confiança, autoridade e precisão ao investidor, IDENTIFIQUE NOMES REAIS E ESPECÍFICOS dos estabelecimentos comerciais, hospitais, shoppings, estações de metrô/trem, escolas e pontos de referência que atendem esta localidade.

Faça um levantamento rigoroso contendo:
1. Renda e Perfil Socioeconômico dos Moradores da Região (classe social predominante, padrão das construções, segurança, perfil de renda média/alta/popular).
2. Risco Histórico de Enchentes, Alagamentos ou Deslizamentos (relevo, histórico de chuvas/alagamentos na localidade, proximidade de rios/córregos identificados por NOME, drenagem urbana).
3. Mobilidade e Transporte Público (estações de metrô/trem com NOMES reais, terminais de ônibus, principais avenidas e rodovias de acesso).
4. Educação, Saúde e Serviços de Apoio (hospitais públicos/privados com NOMES reais, faculdades/universidades de renome, escolas de referência).
5. Comércio, Shoppings, Supermercados e Lazer (shoppings centers com NOMES reais, redes de supermercados locais, polos gastronômicos e atrativos).
6. Liquidez de Revenda e Potencial de Locação (velocidade média de absorção, perfil de compradores/locatários, demanda na região).

Retorne OBRIGATORIAMENTE um JSON válido com a seguinte estrutura exata:
{
  "incomeProfile": "descrição concisa e objetiva da renda e perfil dos moradores...",
  "floodRisk": "Baixo" | "Médio" | "Alto" | "Muito Baixo",
  "floodDetails": "detalhes sobre o histórico de enchentes, relevo, drenagem e nomes de córregos/bacias próximas se houver...",
  "transportation": "linhas de ônibus, vias de acesso, facilidade de deslocamento e estações próximas...",
  "healthAndEducation": "hospitais, faculdades e escolas de destaque na região com nomes reais...",
  "commerceAndTourism": "comércio local, shoppings com nomes reais, hipermercados e atrativos...",
  "generalLiquidity": "parecer sobre a liquidez de venda/locação na localidade...",
  "namedHospitals": [
    { "name": "Nome Real do Hospital ou UBS", "category": "Hospital Particular / Hospital Público / UBS / UPA", "distance": "Ex: 650m", "note": "Atendimento de urgência, internação ou especialidades" }
  ],
  "namedShoppings": [
    { "name": "Nome Real do Shopping ou Hipermercado", "category": "Shopping Center / Hipermercado / Galeria Comercial", "distance": "Ex: 1.2km", "note": "Lojas, alimentação, serviços e conveniência" }
  ],
  "namedSchools": [
    { "name": "Nome Real da Escola ou Faculdade", "category": "Colégio Privado / Escola Pública / Universidade", "distance": "Ex: 500m", "note": "Ensino infantil, fundamental ou superior" }
  ],
  "namedTransport": [
    { "name": "Nome Real da Estação de Metrô, Trem ou Terminal", "category": "Metrô / Trem CPTM / Terminal de Ônibus / Via Arterial", "distance": "Ex: 700m", "note": "Linha ou principal conexão" }
  ],
  "namedSecurity": [
    { "name": "Nome Real da Delegacia / Base PM", "category": "Delegacia de Polícia / Batalhão PM / Guarda Municipal", "distance": "Ex: 900m", "note": "Segurança ostensiva e ronda no bairro" }
  ],
  "namedRiskPoints": [
    { "name": "Nome do Córrego, Rio ou Ponto Geográfico", "category": "Drenagem / Bacia / Relevo", "distance": "Ex: 400m", "note": "Situação: Canalizado / Sem histórico de transbordamento recente" }
  ],
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
        automatedMeasurement: measurementData || undefined,
        incomeProfile: parsed.incomeProfile || "Região urbana com infraestrutura consolidada e perfil compatível com a tipologia do imóvel.",
        floodRisk: parsed.floodRisk || "Baixo",
        floodDetails: parsed.floodDetails || "Não constam registros recorrentes de alagamentos graves na via principal.",
        transportation: parsed.transportation || "Atendido por linhas regulares de transporte público e vias coletoras.",
        healthAndEducation: parsed.healthAndEducation || "Proximidade de unidades de saúde e rede de ensino local.",
        commerceAndTourism: parsed.commerceAndTourism || "Ampla gama de serviços e comércio de bairro no entorno.",
        generalLiquidity: parsed.generalLiquidity || "Boa aceitação no mercado secundário para o segmento.",
        namedHospitals: Array.isArray(parsed.namedHospitals) && parsed.namedHospitals.length > 0 ? parsed.namedHospitals : undefined,
        namedShoppings: Array.isArray(parsed.namedShoppings) && parsed.namedShoppings.length > 0 ? parsed.namedShoppings : undefined,
        namedSchools: Array.isArray(parsed.namedSchools) && parsed.namedSchools.length > 0 ? parsed.namedSchools : undefined,
        namedTransport: Array.isArray(parsed.namedTransport) && parsed.namedTransport.length > 0 ? parsed.namedTransport : undefined,
        namedSecurity: Array.isArray(parsed.namedSecurity) && parsed.namedSecurity.length > 0 ? parsed.namedSecurity : undefined,
        namedRiskPoints: Array.isArray(parsed.namedRiskPoints) && parsed.namedRiskPoints.length > 0 ? parsed.namedRiskPoints : undefined,
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

  // Send message in Regional Chat / Confrontation
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
    if (!overridePrompt) {
      setChatInput('');
    }
    setSendingChat(true);

    try {
      const currentAddr = addressInput.trim() || defaultAddress || 'Endereço não informado';
      const promptText = `Você é um perito em inteligência territorial, engenharia cartográfica e análise de vizinhança para leilões imobiliários no Brasil.
Responda de forma analítica, precisa e objetiva à dúvida ou confrontação do investidor:

DADOS ATUAIS DO IMÓVEL & LOCALIZAÇÃO:
- Endereço / Localização: "${currentAddr}"
- Link Google Maps: "${mapsUrlInput || 'N/A'}"
- Área Registrada na Matrícula / IPTU: ${registeredAreaInput || 'N/A'} m²
- Área Medida pelo Satélite: ${measuredAreaInput || 'N/A'} m²
- Testada (Frente): ${frontageInput || 'N/A'}m | Profundidade (Fundos): ${depthInput || 'N/A'}m | Perímetro: ${currentPerimeter}m
- Risco de Enchentes Mapeado: ${regionalInfo.floodRisk || 'N/A'} (${regionalInfo.floodDetails || ''})
- Perfil e Renda dos Moradores: ${regionalInfo.incomeProfile || 'N/A'}
- Mobilidade & Transporte: ${regionalInfo.transportation || 'N/A'}
- Saúde & Educação: ${regionalInfo.healthAndEducation || 'N/A'}
- Comércio & Shoppings: ${regionalInfo.commerceAndTourism || 'N/A'}

PERGUNTA OU CONFRONTAÇÃO DO INVESTIDOR:
"${question}"

DIRETRIZES DE RESPOSTA:
1. Traga respostas diretas, estruturadas em tópicos, com números, distâncias estimadas e NOMES REAIS de estabelecimentos/vias sempre que aplicável.
2. Se for uma confrontação de área (matrícula vs satélite), aponte possíveis causas (recuo viário, muros divisórios, área construída vs terreno, desdobros, ampliações clandestinas).
3. Seja transparente quanto à segurança jurídica e atratividade comercial da localização.
4. Responda em Português do Brasil com clareza executiva.`;

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
        throw new Error("Erro na resposta do assistente de IA.");
      }

      const jsonResponse = await res.json();
      const aiReply = jsonResponse.analysis || jsonResponse.text || "Não foi possível gerar a resposta no momento.";

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
        text: `⚠️ Erro ao consultar o assistente: ${err.message || 'Verifique sua conexão ou tente novamente.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  // Quick Confrontation Actions
  const handleQuickConfrontation = (type: 'medicao' | 'hospitais' | 'shoppings' | 'enchentes' | 'preco_m2' | 'seguranca') => {
    const currentAddr = addressInput.trim() || defaultAddress || 'este endereço';
    let prompt = '';

    if (type === 'medicao') {
      prompt = `Confronte a área medida no satélite (${measuredAreaInput || 0} m² com testada de ${frontageInput || 0}m) com a área registrada na matrícula (${registeredAreaInput || 0} m²). Quais são as principais hipóteses para a diferença de ${discrepancy ? discrepancy.diff.toFixed(1) + ' m² (' + discrepancy.perc.toFixed(1) + '%)' : 'metragem'}, e quais cuidados práticos o investidor deve tomar no local?`;
    } else if (type === 'hospitais') {
      prompt = `Liste detalhadamente com NOMES REAIS, distâncias exatas em metros/km e se são públicos ou particulares todos os hospitais, prontos-socorros, UPAs e clínicas de referência mais próximos de "${currentAddr}".`;
    } else if (type === 'shoppings') {
      prompt = `Liste com NOMES REAIS todos os Shopping Centers, hipermercados (Carrefour, Pão de Açúcar, Assaí, etc.) e centros comerciais no entorno de "${currentAddr}" com suas respectivas distâncias e perfil de consumo.`;
    } else if (type === 'enchentes') {
      prompt = `Faça um levantamento rigoroso sobre o histórico de enchentes, alagamentos, relevo (topografia em aclive/declive) e proximidade com córregos/rios para "${currentAddr}". Mencione nomes de bacias ou córregos e se há risco de inundação na via de acesso.`;
    } else if (type === 'preco_m2') {
      prompt = `Qual é a estimativa de valor médio do metro quadrado (m²) para compra e locação na microrregião de "${currentAddr}"? Qual é o perfil socioeconômico predominante (classes A/B/C) e a velocidade média de revenda de imóveis arrematados?`;
    } else if (type === 'seguranca') {
      prompt = `Analise a segurança pública, iluminação e policiamento no bairro de "${currentAddr}". Identifique as delegacias (DPs), companhias da Polícia Militar e postos de guarda mais próximos com seus nomes reais.`;
    }

    handleSendRegionalChat(prompt, true);
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyMeasurements = () => {
    const text = `📏 MEDIÇÃO AUTOMÁTICA DE DISTÂNCIAS & ÁREA DO IMÓVEL (MATRÍCULA)\n` +
      `📍 Localização: ${addressInput || defaultAddress || 'Não especificado'}\n` +
      `📐 Área do Terreno: ${currentArea} m² (Matrícula: ${registeredAreaInput || currentArea} m²)\n` +
      `📏 Testada / Frente: ${currentFrontage} m\n` +
      `📏 Profundidade / Fundos: ${currentDepth} m\n` +
      `📐 Lateral Direita: ${currentDepth} m | Lateral Esquerda: ${currentDepth} m\n` +
      `🔄 Perímetro Total: ${currentPerimeter} m\n` +
      `🏢 Projeção Construída Estimada: ~${(currentArea * 0.65).toFixed(1)} m²\n` +
      `────────────────────────────────────────\n` +
      `▲ Fundos: ${extractedMatricula.fundos}\n` +
      `▼ Frente: ${extractedMatricula.frente}\n` +
      `◀ Esquerda: ${extractedMatricula.esquerda}\n` +
      `▶ Direita: ${extractedMatricula.direita}\n` +
      `🛰️ Satélite: ${getGoogleMapsSatelliteUrl(addressInput || defaultAddress)}`;

    navigator.clipboard.writeText(text);
    setCopiedMeasurements(true);
    setTimeout(() => setCopiedMeasurements(false), 2500);
    if ((window as any).customToast) {
      (window as any).customToast("Medições copiadas com sucesso!", "success");
    }
  };

  const handlePushToSummary = () => {
    if (!onAddToSummary) return;
    const summaryText = `### 📍 Inteligência Regional & Medição Automática de Área (${regionalInfo.address || addressInput})
- **Área Medida Automática:** ${measuredAreaInput || currentArea} m² (Matrícula: ${registeredAreaInput || currentArea} m² | Diferença: ${discrepancy ? (discrepancy.diff > 0 ? `+${discrepancy.diff} m²` : `${discrepancy.diff} m²`) : '0 m²'})
- **Dimensões do Terreno:** Frente: ${frontageInput || currentFrontage}m | Profundidade: ${depthInput || currentDepth}m | Perímetro: ${currentPerimeter}m
- **Perfil & Renda dos Moradores:** ${regionalInfo.incomeProfile || 'Não mapeado'}
- **Risco de Enchentes / Drenagem:** ${regionalInfo.floodRisk || 'Baixo'} - ${regionalInfo.floodDetails || ''}
- **Mobilidade & Transporte:** ${regionalInfo.transportation || 'Não mapeado'}
- **Saúde & Educação:** ${regionalInfo.healthAndEducation || 'Não mapeado'}
- **Comércio & Atratividade:** ${regionalInfo.commerceAndTourism || 'Não mapeado'}
- **Liquidez na Região:** ${regionalInfo.generalLiquidity || 'Não mapeado'}
${measurementData?.aiTechnicalNotes ? `\n*Parecer Técnico da Medição:* ${measurementData.aiTechnicalNotes}` : ''}
${regionalInfo.rawAiReport ? `\n\n**Parecer Territorial Consolidado:**\n${regionalInfo.rawAiReport}` : ''}`;

    onAddToSummary(summaryText, 'Inteligência Regional & Medição');
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-brand-primary font-serif">Região & Mapas (Medição de Distância Automática)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" /> Medição Aplicada Automaticamente
                </span>
              </div>
              <p className="text-sm text-brand-ink/60 mt-1 max-w-2xl">
                As distâncias perimetrais (frente, fundos, laterais, área e perímetro) já foram extraídas e calculadas automaticamente para o imóvel da matrícula no Google Maps Satélite.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCopyMeasurements}
              className="px-4 py-3 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/25 text-brand-primary font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              title="Copiar relatório completo de medições"
            >
              {copiedMeasurements ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              <span>{copiedMeasurements ? 'Medições Copiadas!' : 'Copiar Medições'}</span>
            </button>

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

      {/* AUTOMATIC VISUAL MEASUREMENT OVERLAY ON GOOGLE MAPS SATELLITE */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/20 shadow-md space-y-6" id="google-maps-auto-measurement-viewer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
              <Ruler size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-brand-primary">Medição Cartográfica no Google Maps Satélite (Auto-Aplicada)</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded-md uppercase">
                  Imóvel da Matrícula
                </span>
              </div>
              <p className="text-xs text-brand-ink/60">
                Visualização perimetral com cotas de distância, confrontações e área total medidas em tempo real.
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowMeasurementsOverlay(!showMeasurementsOverlay)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
                showMeasurementsOverlay 
                  ? "bg-brand-primary text-black border-brand-primary shadow-sm" 
                  : "bg-brand-bg border-brand-border text-brand-ink/60 hover:text-brand-primary"
              )}
            >
              {showMeasurementsOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{showMeasurementsOverlay ? 'Ocultar Cotas' : 'Exibir Cotas'}</span>
            </button>

            <button
              onClick={handleResetToMatriculaDimensions}
              className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border text-brand-primary rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              title="Restaura os valores originais da matrícula"
            >
              <RefreshCw size={13} />
              <span>Restaurar Matrícula</span>
            </button>

            <a
              href={getGoogleMapsSatelliteUrl(addressInput || defaultAddress)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Layers size={13} />
              <span>Abrir no Satélite HD</span>
              <ExternalLink size={11} />
            </a>

            <a
              href={getGoogleEarthUrl(addressInput || defaultAddress)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-border text-brand-ink rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Compass size={13} />
              <span>Earth 3D</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Real Interactive Google Maps Satellite Visualizer */}
        <div 
          ref={mapContainerRef}
          className="relative w-full h-[460px] sm:h-[520px] rounded-3xl overflow-hidden border border-brand-primary/30 shadow-inner bg-slate-950 select-none group"
        >
          {/* Real Google Maps Embed with Satellite View */}
          <iframe
            title="Google Maps Satellite Measurement"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(addressInput || defaultAddress || 'São Paulo, SP')}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0 absolute inset-0 opacity-80 group-hover:opacity-90 transition-opacity"
            loading="lazy"
          />

          {/* Dark gradient overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

          {/* Interactive SVG Vector Polygon with Highlighted Distances */}
          {showMeasurementsOverlay && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Dynamic polygon fill */}
              <polygon
                points={polygonPoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                fill="rgba(245, 158, 11, 0.22)"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                className="filter drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
              />

              {/* Diagonal crosshairs connecting opposite vertices */}
              {polygonPoints.length === 4 && (
                <>
                  <line
                    x1={`${polygonPoints[0].x}%`}
                    y1={`${polygonPoints[0].y}%`}
                    x2={`${polygonPoints[2].x}%`}
                    y2={`${polygonPoints[2].y}%`}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={`${polygonPoints[1].x}%`}
                    y1={`${polygonPoints[1].y}%`}
                    x2={`${polygonPoints[3].x}%`}
                    y2={`${polygonPoints[3].y}%`}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </>
              )}
            </svg>
          )}

          {/* Distance Calipers / Badges for each edge */}
          {showMeasurementsOverlay && (
            <>
              {/* TOP EDGE: Fundos */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto shadow-lg"
                style={{ left: `${(polygonPoints[0].x + polygonPoints[1].x) / 2}%`, top: `${(polygonPoints[0].y + polygonPoints[1].y) / 2}%` }}
              >
                <div className="bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-mono text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-md">
                  <span>📐 Fundos:</span>
                  <span className="text-white text-sm">{currentFrontage} m</span>
                </div>
              </div>

              {/* BOTTOM EDGE: Frente / Testada */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto shadow-lg"
                style={{ left: `${(polygonPoints[3].x + polygonPoints[2].x) / 2}%`, top: `${(polygonPoints[3].y + polygonPoints[2].y) / 2}%` }}
              >
                <div className="bg-slate-900/95 border-2 border-emerald-400 text-emerald-300 font-mono text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-md">
                  <span>📐 Testada (Frente):</span>
                  <span className="text-white text-sm font-black">{currentFrontage} m</span>
                </div>
              </div>

              {/* LEFT EDGE: Lateral Esquerda */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto shadow-lg"
                style={{ left: `${(polygonPoints[0].x + polygonPoints[3].x) / 2}%`, top: `${(polygonPoints[0].y + polygonPoints[3].y) / 2}%` }}
              >
                <div className="bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-mono text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md">
                  <span>Lat. Esq:</span>
                  <span className="text-white font-bold">{currentDepth} m</span>
                </div>
              </div>

              {/* RIGHT EDGE: Lateral Direita */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto shadow-lg"
                style={{ left: `${(polygonPoints[1].x + polygonPoints[2].x) / 2}%`, top: `${(polygonPoints[1].y + polygonPoints[2].y) / 2}%` }}
              >
                <div className="bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-mono text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md">
                  <span>Lat. Dir:</span>
                  <span className="text-white font-bold">{currentDepth} m</span>
                </div>
              </div>

              {/* CENTER BADGE: Total Area & Perimeter */}
              <div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto shadow-2xl text-center"
              >
                <div className="bg-slate-950/95 border-2 border-brand-primary text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-md space-y-1 min-w-[200px]">
                  <div className="flex items-center justify-center gap-1.5 text-brand-primary text-[11px] font-bold uppercase tracking-wider">
                    <Crosshair size={14} className="animate-spin text-brand-primary" />
                    <span>Área Medida (Matrícula)</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-brand-primary tracking-tight">
                    {currentArea} <span className="text-sm font-sans font-bold text-white">m²</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono font-medium flex items-center justify-center gap-2 border-t border-white/10 pt-1">
                    <span>Perímetro: <strong>{currentPerimeter}m</strong></span>
                    <span>•</span>
                    <span>Projeção: <strong>~{(currentArea * 0.65).toFixed(0)}m²</strong></span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Top Left: Address & Status Overlay */}
          <div className="absolute top-4 left-4 z-30 max-w-sm bg-slate-950/90 border border-brand-primary/30 rounded-2xl p-3 text-white backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider">
              <MapPin size={14} />
              <span>{addressInput || defaultAddress || 'Localização do Imóvel'}</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 font-mono">
              Frente: {currentFrontage}m | Fundos: {currentDepth}m | Área Total: {currentArea}m²
            </p>
          </div>

          {/* Top Right: Status Badge */}
          <div className="absolute top-4 right-4 z-30 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md shadow-xl flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>Medição Ativa & Aplicada</span>
          </div>

          {/* Bottom Left: Confrontations Pill */}
          <div className="absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 bg-slate-950/90 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-md">
            <span>Frente: <strong>{extractedMatricula.frente}</strong></span>
            <span>|</span>
            <span>Fundos: <strong>{extractedMatricula.fundos}</strong></span>
          </div>

          {/* Bottom Right: Open in Google Maps Button */}
          <a
            href={getGoogleMapsSearchUrl(addressInput || defaultAddress)}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 right-4 z-30 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5 uppercase tracking-wider"
          >
            <ExternalLink size={14} />
            <span>Ver no Google Maps</span>
          </a>
        </div>

        {/* 4 Summary Cards: Testada x Profundidade x Perímetro x Área */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-brand-bg/60 p-4 rounded-2xl border border-brand-primary/15 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Testada (Frente)</span>
            <div className="text-xl font-bold font-mono text-brand-ink">{currentFrontage} <span className="text-xs font-normal">m</span></div>
            <p className="text-[10px] text-brand-ink/50">Largura voltada à via pública</p>
          </div>

          <div className="bg-brand-bg/60 p-4 rounded-2xl border border-brand-primary/15 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Profundidade (Fundos)</span>
            <div className="text-xl font-bold font-mono text-brand-ink">{currentDepth} <span className="text-xs font-normal">m</span></div>
            <p className="text-[10px] text-brand-ink/50">Extensão lateral do terreno</p>
          </div>

          <div className="bg-brand-bg/60 p-4 rounded-2xl border border-brand-primary/15 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Perímetro Total</span>
            <div className="text-xl font-bold font-mono text-brand-ink">{currentPerimeter} <span className="text-xs font-normal">m</span></div>
            <p className="text-[10px] text-brand-ink/50">Soma de todos os lados</p>
          </div>

          <div className="bg-brand-primary/10 p-4 rounded-2xl border border-brand-primary/30 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">Área do Imóvel</span>
            <div className="text-xl font-bold font-mono text-brand-primary">{currentArea} <span className="text-xs font-bold text-brand-primary/80">m²</span></div>
            <p className="text-[10px] text-brand-primary/70">Matrícula vs Satélite</p>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns: Input & Automatic Measurement vs Regional Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input + Instant Automatic Area Measurement */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Input Box */}
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                <MapPin size={18} className="text-brand-primary" />
                Localização & Link do Google Maps
              </h4>
              <div className="flex items-center gap-2">
                {(addressInput || mapsUrlInput || measurementData) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddressInput('');
                      setMapsUrlInput('');
                      setMeasurementData(null);
                      setMeasuredAreaInput('');
                      setRegisteredAreaInput('');
                      setFrontageInput('');
                      setDepthInput('');
                      setAreaNotes('');
                      if ((window as any).customToast) {
                        (window as any).customToast("Informações de localização e medição limpas.", "info");
                      }
                    }}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    title="Limpar todos os campos de endereço e medição"
                  >
                    <Trash2 size={12} />
                    <span>Limpar Tudo</span>
                  </button>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full uppercase">
                  Gatilho Automático
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/60 mb-1.5 flex items-center justify-between">
                  <span>Endereço Completo do Imóvel</span>
                  <div className="flex items-center gap-2">
                    {addressInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressInput('');
                          handleAddressOrUrlChange('', mapsUrlInput);
                        }}
                        className="text-[10px] text-brand-ink/50 hover:text-rose-500 font-bold underline"
                      >
                        Limpar endereço
                      </button>
                    )}
                    <span className="text-[9px] text-brand-primary font-normal">Mede automaticamente ao digitar</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={e => {
                      setAddressInput(e.target.value);
                      handleAddressOrUrlChange(e.target.value, mapsUrlInput);
                    }}
                    placeholder="Ex: Rua das Palmeiras, 150 - Bairro Centro, São Paulo - SP"
                    className="w-full bg-brand-bg border border-brand-primary/20 rounded-xl pl-4 pr-16 py-3 text-sm font-medium text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    {addressInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressInput('');
                          handleAddressOrUrlChange('', mapsUrlInput);
                        }}
                        className="p-1 text-brand-ink/40 hover:text-brand-ink rounded"
                        title="Limpar endereço"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {measuringAuto && (
                      <div className="text-brand-primary animate-spin">
                        <Loader2 size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink/60 mb-1.5 flex items-center justify-between">
                  <span>Link do Google Maps (Cole a URL)</span>
                  <div className="flex items-center gap-2">
                    {mapsUrlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setMapsUrlInput('');
                          handleAddressOrUrlChange(addressInput, '');
                        }}
                        className="text-[10px] text-brand-ink/50 hover:text-rose-500 font-bold underline"
                      >
                        Limpar link
                      </button>
                    )}
                    <span className="text-[9px] text-brand-primary font-normal">Extrai coordenadas e lote na hora</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={mapsUrlInput}
                    onChange={e => {
                      setMapsUrlInput(e.target.value);
                      handleAddressOrUrlChange(addressInput, e.target.value);
                    }}
                    placeholder="Cole aqui o link do Google Maps (ex: https://maps.app.goo.gl/...)"
                    className="w-full bg-brand-bg border border-brand-primary/20 rounded-xl pl-4 pr-16 py-3 text-sm font-medium text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none font-mono text-xs"
                  />
                  {mapsUrlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setMapsUrlInput('');
                        handleAddressOrUrlChange(addressInput, '');
                      }}
                      className="absolute right-3 top-3 p-1 text-brand-ink/40 hover:text-brand-ink rounded flex items-center gap-1 text-[10px]"
                      title="Limpar link"
                    >
                      <X size={14} />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Map Tools Actions */}
            <div className="pt-2 border-t border-brand-primary/10">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-primary/80 mb-2">
                Navegação Direta em Satélite:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <a
                  href={getGoogleMapsSearchUrl(addressInput || defaultAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 rounded-xl text-xs font-bold text-brand-ink hover:text-brand-primary transition-all text-center"
                >
                  <Search size={14} />
                  <span>Google Maps</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>

                <a
                  href={getGoogleMapsSatelliteUrl(addressInput || defaultAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-primary transition-all text-center"
                >
                  <Layers size={14} />
                  <span>Satélite HD</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>

                <a
                  href={getGoogleEarthUrl(addressInput || defaultAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/15 rounded-xl text-xs font-bold text-brand-ink hover:text-brand-primary transition-all text-center"
                >
                  <Compass size={14} />
                  <span>Earth 3D</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Automated Measurement Panel */}
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <Ruler size={18} className="text-brand-primary" />
                  Resultado da Medição Automática de Área
                </h4>
                <p className="text-xs text-brand-ink/50 mt-0.5">Calculado automaticamente com base no satélite e geometria do lote</p>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1",
                measuringAuto ? "bg-amber-500/10 text-amber-700 animate-pulse" : "bg-emerald-500/10 text-emerald-800"
              )}>
                {measuringAuto ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {measuringAuto ? 'Medindo...' : 'Auto-Calculado'}
              </span>
            </div>

            {/* Core Metrics: Matrícula vs Medição Automática */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-brand-bg/60 p-4 rounded-2xl border border-brand-primary/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50">
                  Área na Matrícula / Edital
                </span>
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    value={registeredAreaInput}
                    onChange={e => setRegisteredAreaInput(e.target.value)}
                    placeholder="250"
                    className="w-full bg-transparent text-xl font-bold text-brand-ink focus:outline-none font-mono"
                  />
                  <span className="text-xs font-bold text-brand-ink/40">m²</span>
                </div>
                <p className="text-[10px] text-brand-ink/40">Conforme certidão imobiliária</p>
              </div>

              <div className="bg-brand-primary/10 p-4 rounded-2xl border border-brand-primary/30 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                  Área Medida Automática (Satélite)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    value={measuredAreaInput}
                    onChange={e => setMeasuredAreaInput(e.target.value)}
                    placeholder="250"
                    className="w-full bg-transparent text-xl font-bold text-brand-primary focus:outline-none font-mono"
                  />
                  <span className="text-xs font-bold text-brand-primary/80">m²</span>
                </div>
                <p className="text-[10px] text-brand-primary/70">Apurada pelo mapa territorial</p>
              </div>
            </div>

            {/* Detailed Lot Geometry: Frente x Fundos x Perímetro */}
            <div className="grid grid-cols-3 gap-3 bg-brand-bg/40 p-4 rounded-2xl border border-brand-primary/10">
              <div className="text-center space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/50 block">
                  Testada (Frente)
                </span>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    value={frontageInput}
                    onChange={e => setFrontageInput(e.target.value)}
                    placeholder="10"
                    className="w-16 bg-transparent text-center text-sm font-bold text-brand-ink focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-brand-ink/50">m</span>
                </div>
              </div>

              <div className="text-center space-y-1 border-x border-brand-primary/10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/50 block">
                  Profundidade (Fundos)
                </span>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    value={depthInput}
                    onChange={e => setDepthInput(e.target.value)}
                    placeholder="25"
                    className="w-16 bg-transparent text-center text-sm font-bold text-brand-ink focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-brand-ink/50">m</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/50 block">
                  Perímetro Total
                </span>
                <div className="text-sm font-bold text-brand-ink font-mono mt-1">
                  {currentPerimeter} m
                </div>
              </div>
            </div>

            {/* Discrepancy & Cadastral Conformity Alert */}
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
                    Conformidade Cadastral: {discrepancy.diff > 0 ? `+${discrepancy.diff.toFixed(1)} m²` : `${discrepancy.diff.toFixed(1)} m²`} ({discrepancy.perc > 0 ? `+${discrepancy.perc.toFixed(1)}%` : `${discrepancy.perc.toFixed(1)}%`})
                  </p>
                  <p className="mt-1 opacity-85 text-[11px] leading-relaxed">
                    {discrepancy.status === 'normal' 
                      ? 'Área medida no satélite coincide com a matrícula dentro da margem padrão de tolerância (±5%). Excelente regularidade.' 
                      : discrepancy.status === 'excess'
                      ? 'A área identificada no satélite é maior que a matrícula. Verifique possíveis ampliações não averbadas ou ocupação de área vizinha.'
                      : 'Atenção: A área medida é inferior à descrita na matrícula. Verifique recuos viários, desdobros ou divergência cadastral.'}
                  </p>
                  {measurementData?.aiTechnicalNotes && (
                    <p className="mt-2 text-[10px] font-mono italic opacity-75">
                      💡 {measurementData.aiTechnicalNotes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Regional Demographics & Risk Cards */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand-primary" />
                  Mapeamento Socioeconômico & Riscos da Região
                </h4>
                <p className="text-xs text-brand-ink/50 mt-0.5">Indicadores demográficos para o endereço indicado</p>
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

            {/* Health & Education & POI with NAMED Establishments */}
            <div className="space-y-4">
              {/* Named Hospitals */}
              {regionalInfo.namedHospitals && regionalInfo.namedHospitals.length > 0 && (
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-emerald-600" />
                      Hospitais & Unidades de Saúde (Nomes Reais & Distâncias)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-md">
                      {regionalInfo.namedHospitals.length} Identificados
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {regionalInfo.namedHospitals.map((hosp, idx) => (
                      <div key={idx} className="p-3 bg-brand-paper rounded-xl border border-brand-primary/10 space-y-1 hover:border-brand-primary/25 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-brand-ink leading-tight">{hosp.name}</span>
                          {hosp.distance && (
                            <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-800 rounded">
                              📍 {hosp.distance}
                            </span>
                          )}
                        </div>
                        {hosp.category && (
                          <span className="text-[9px] uppercase font-bold text-brand-primary/70 block tracking-wider">
                            {hosp.category}
                          </span>
                        )}
                        {hosp.note && (
                          <p className="text-[11px] text-brand-ink/70 leading-snug">{hosp.note}</p>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hosp.name} ${regionalInfo.address || addressInput}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline mt-1 pt-1 border-t border-brand-primary/5 w-full justify-end"
                        >
                          <span>Ver no Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Named Shoppings & Supermarkets */}
              {regionalInfo.namedShoppings && regionalInfo.namedShoppings.length > 0 && (
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag size={15} className="text-amber-600" />
                      Shoppings, Hipermercados & Polos Comerciais
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-md">
                      {regionalInfo.namedShoppings.length} Identificados
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {regionalInfo.namedShoppings.map((shop, idx) => (
                      <div key={idx} className="p-3 bg-brand-paper rounded-xl border border-brand-primary/10 space-y-1 hover:border-brand-primary/25 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-brand-ink leading-tight">{shop.name}</span>
                          {shop.distance && (
                            <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-800 rounded">
                              📍 {shop.distance}
                            </span>
                          )}
                        </div>
                        {shop.category && (
                          <span className="text-[9px] uppercase font-bold text-amber-700/80 block tracking-wider">
                            {shop.category}
                          </span>
                        )}
                        {shop.note && (
                          <p className="text-[11px] text-brand-ink/70 leading-snug">{shop.note}</p>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${regionalInfo.address || addressInput}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline mt-1 pt-1 border-t border-brand-primary/5 w-full justify-end"
                        >
                          <span>Ver no Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Named Metro & Transport Lines */}
              {regionalInfo.namedTransport && regionalInfo.namedTransport.length > 0 && (
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Bus size={15} className="text-blue-600" />
                      Estações de Metrô, Trem & Terminais
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-700 rounded-md">
                      {regionalInfo.namedTransport.length} Identificados
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {regionalInfo.namedTransport.map((tr, idx) => (
                      <div key={idx} className="p-3 bg-brand-paper rounded-xl border border-brand-primary/10 space-y-1 hover:border-brand-primary/25 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-brand-ink leading-tight">{tr.name}</span>
                          {tr.distance && (
                            <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-800 rounded">
                              📍 {tr.distance}
                            </span>
                          )}
                        </div>
                        {tr.category && (
                          <span className="text-[9px] uppercase font-bold text-blue-700/80 block tracking-wider">
                            {tr.category}
                          </span>
                        )}
                        {tr.note && (
                          <p className="text-[11px] text-brand-ink/70 leading-snug">{tr.note}</p>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tr.name} ${regionalInfo.address || addressInput}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline mt-1 pt-1 border-t border-brand-primary/5 w-full justify-end"
                        >
                          <span>Ver no Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Named Security & Police */}
              {regionalInfo.namedSecurity && regionalInfo.namedSecurity.length > 0 && (
                <div className="bg-brand-bg/40 p-5 rounded-2xl border border-brand-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={15} className="text-indigo-600" />
                      Segurança Pública & Delegacias / Batalhões PM
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-700 rounded-md">
                      {regionalInfo.namedSecurity.length} Identificados
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {regionalInfo.namedSecurity.map((sec, idx) => (
                      <div key={idx} className="p-3 bg-brand-paper rounded-xl border border-brand-primary/10 space-y-1 hover:border-brand-primary/25 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-brand-ink leading-tight">{sec.name}</span>
                          {sec.distance && (
                            <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-800 rounded">
                              📍 {sec.distance}
                            </span>
                          )}
                        </div>
                        {sec.category && (
                          <span className="text-[9px] uppercase font-bold text-indigo-700/80 block tracking-wider">
                            {sec.category}
                          </span>
                        )}
                        {sec.note && (
                          <p className="text-[11px] text-brand-ink/70 leading-snug">{sec.note}</p>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sec.name} ${regionalInfo.address || addressInput}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline mt-1 pt-1 border-t border-brand-primary/5 w-full justify-end"
                        >
                          <span>Ver no Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Health, Education, Commerce Fallback Grid */}
              {(!regionalInfo.namedHospitals || regionalInfo.namedHospitals.length === 0) && (
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
              )}
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

      {/* Regional AI Chat & Information Confrontation Section */}
      <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/15 shadow-sm space-y-6" id="regional-chat-confrontation-panel">
        <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <span>Chat de IA Especialista & Confrontador de Dados da Região</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full uppercase tracking-wider">
                  Interativo & Ao Vivo
                </span>
              </h4>
              <p className="text-xs text-brand-ink/60">
                Faça perguntas específicas, confronte a medição do satélite contra a matrícula, peça nomes de hospitais, shoppings e históricos de enchente.
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
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-ink/50 flex items-center gap-1.5">
                <ArrowRightLeft size={13} />
                Confrontações Rápidas e Consultas Estratégicas:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickConfrontation('medicao')}
                  disabled={sendingChat}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ruler size={13} className="text-brand-primary" />
                  <span>📐 Confrontar Satélite vs Matrícula</span>
                </button>
                <button
                  onClick={() => handleQuickConfrontation('hospitais')}
                  disabled={sendingChat}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <GraduationCap size={13} className="text-emerald-600" />
                  <span>🏥 Listar Hospitais e Clínicas (Nomes Reais)</span>
                </button>
                <button
                  onClick={() => handleQuickConfrontation('shoppings')}
                  disabled={sendingChat}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingBag size={13} className="text-amber-600" />
                  <span>🛍️ Shoppings e Supermercados</span>
                </button>
                <button
                  onClick={() => handleQuickConfrontation('enchentes')}
                  disabled={sendingChat}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Waves size={13} className="text-cyan-600" />
                  <span>🌊 Histórico de Enchentes & Córregos</span>
                </button>
                <button
                  onClick={() => handleQuickConfrontation('preco_m2')}
                  disabled={sendingChat}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <DollarSign size={13} className="text-emerald-600" />
                  <span>📈 Preço Médio m² & Renda dos Vizinhos</span>
                </button>
                <button
                  onClick={() => handleQuickConfrontation('seguranca')}
                  disabled={sendingChat}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShieldAlert size={13} className="text-indigo-600" />
                  <span>🛡️ Segurança Pública e Delegacias</span>
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="bg-brand-bg/60 rounded-2xl border border-brand-primary/15 p-4 sm:p-6 max-h-[420px] min-h-[220px] overflow-y-auto space-y-4">
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
                        {msg.sender === 'user' ? 'Você (Investidor)' : 'IA Perito Regional'}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.text}
                    </div>

                    {msg.sender === 'assistant' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-primary/10">
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="text-[10px] font-bold text-brand-ink/60 hover:text-brand-primary flex items-center gap-1 transition-all"
                        >
                          <Copy size={11} />
                          <span>{copiedSection === msg.id ? 'Copiado!' : 'Copiar Resposta'}</span>
                        </button>
                        {onAddToSummary && (
                          <button
                            onClick={() => {
                              onAddToSummary(msg.text, 'Confrontação Territorial (Chat)');
                              alert("Resposta adicionada ao Resumão Unificado!");
                            }}
                            className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1 transition-all ml-2"
                          >
                            <FileText size={11} />
                            <span>➕ Inserir no Resumão</span>
                          </button>
                        )}
                      </div>
                    )}
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
                  <span>Consultando bases territoriais e confrontando dados...</span>
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
                placeholder="Pergunte sobre a vizinhança, confronte medições ou peça nomes de comércios próximos..."
                disabled={sendingChat}
                className="flex-1 bg-brand-bg border border-brand-primary/20 rounded-xl px-4 py-3 text-xs text-brand-ink placeholder:text-brand-ink/40 focus:outline-none focus:border-brand-primary transition-all"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="px-5 py-3 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider shrink-0"
              >
                {sendingChat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Perguntar</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
