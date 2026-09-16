import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Info,
  Link as LinkIcon,
  RotateCcw,
  Plus,
  Move,
  MousePointer,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Property } from '../types';
import { GeneratedLinksHub } from './GeneratedLinksHub';

export interface Point2D {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

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
  points?: { x: number; y: number }[];
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
  const [activeMainTab, setActiveMainTab] = useState<'measurement' | 'links' | 'socioeconomic'>('measurement');
  
  // Measurement Mode Sub-tabs: 'interactive_points' (Google Maps style) | 'blueprint' | 'googlemaps_live'
  const [viewerMode, setViewerMode] = useState<'interactive_points' | 'blueprint' | 'googlemaps_live'>('interactive_points');

  // Input states
  const [addressInput, setAddressInput] = useState('');
  const [mapsUrlInput, setMapsUrlInput] = useState('');
  const [frontageInput, setFrontageInput] = useState<number | string>(10);
  const [depthInput, setDepthInput] = useState<number | string>(25);
  const [registeredAreaInput, setRegisteredAreaInput] = useState<number | string>(250);
  const [measuredAreaInput, setMeasuredAreaInput] = useState<number | string>(250);

  // Point-by-point interactive measurement state (Google Maps style)
  const [points, setPoints] = useState<Point2D[]>([
    { id: 'p-1', x: 30, y: 25 },
    { id: 'p-2', x: 70, y: 25 },
    { id: 'p-3', x: 70, y: 75 },
    { id: 'p-4', x: 30, y: 75 },
  ]);
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(true);
  const [isAddingPointsMode, setIsAddingPointsMode] = useState<boolean>(true);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  
  // Metric Scale Calibration (meters per 10% of container width)
  const [metersPer10Percent, setMetersPer10Percent] = useState<number>(2.5); // 10% = 2.5m => 40% = 10m
  const [mapScaleZoom, setMapScaleZoom] = useState<number>(19);

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<RegionalChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Olá! Sou o Assistente Territorial TJInvest. Posso analisar a área do imóvel, confrontar as metragens da matrícula com o satélite e verificar riscos de enchentes ou liquidez do bairro.',
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

  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to extract dimensions from Matricula text
  const extractMatriculaDimensions = useCallback(() => {
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

    const text = matriculaAnalysis || '';

    if (text) {
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
        }
      } catch (e) {
        // Fallback to regex
      }

      const areaMatch = text.match(/(?:área|medindo|superfície|área total|área de terreno)[\s:]*([0-9\.\,]+)\s*(?:m²|metros quadrados|m2)/i) 
        || text.match(/([0-9\.\,]+)\s*(?:m²|metros quadrados|m2)\s*(?:de área|de terreno)/i);
      if (areaMatch) {
        const parsedA = parseFloat(areaMatch[1].replace(/\./g, '').replace(',', '.'));
        if (parsedA > 0) area = parsedA;
      }

      const frontMatch = text.match(/(?:frente|testada|pela frente|mede de frente)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i) 
        || text.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:de frente|de testada)/i);
      if (frontMatch) {
        front = parseFloat(frontMatch[1].replace(/\./g, '').replace(',', '.')) || front;
      }

      const depthMatch = text.match(/(?:fundos|profundidade|extensão|comprimento|da frente aos fundos)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i) 
        || text.match(/([0-9\.\,]+)\s*(?:m|metros)\s*(?:de fundos|de extensão|da frente aos fundos)/i);
      if (depthMatch) {
        depth = parseFloat(depthMatch[1].replace(/\./g, '').replace(',', '.')) || depth;
      }

      const rightMatch = text.match(/(?:lado direito|pela direita|à direita)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i);
      if (rightMatch) rightSide = parseFloat(rightMatch[1].replace(/\./g, '').replace(',', '.')) || 0;

      const leftMatch = text.match(/(?:lado esquerdo|pela esquerda|à esquerda)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i);
      if (leftMatch) leftSide = parseFloat(leftMatch[1].replace(/\./g, '').replace(',', '.')) || 0;

      const rearMatch = text.match(/(?:fundos|pelos fundos|ao fundo)[\s:]*([0-9\.\,]+)\s*(?:m|metros)/i);
      if (rearMatch) rear = parseFloat(rearMatch[1].replace(/\./g, '').replace(',', '.')) || 0;

      const confFrente = text.match(/(?:frente|confronta na frente)[\s:]*(?:com|para)?\s*([^,\.;\n]+)/i);
      if (confFrente && confFrente[1].trim().length > 3) frente = confFrente[1].trim();

      const confFundos = text.match(/(?:fundos|confronta nos fundos)[\s:]*(?:com|para)?\s*([^,\.;\n]+)/i);
      if (confFundos && confFundos[1].trim().length > 3) fundos = confFundos[1].trim();

      const confDir = text.match(/(?:lado direito|confronta à direita)[\s:]*(?:com|para)?\s*([^,\.;\n]+)/i);
      if (confDir && confDir[1].trim().length > 3) direita = confDir[1].trim();

      const confEsq = text.match(/(?:lado esquerdo|confronta à esquerda)[\s:]*(?:com|para)?\s*([^,\.;\n]+)/i);
      if (confEsq && confEsq[1].trim().length > 3) esquerda = confEsq[1].trim();
    }

    if (area > 0 && front === 0 && depth === 0) {
      front = Number(Math.sqrt(area * 0.4).toFixed(1)) || 10;
      depth = Number((area / front).toFixed(1)) || 25;
    } else if (front > 0 && depth === 0 && area > 0) {
      depth = Number((area / front).toFixed(1));
    } else if (depth > 0 && front === 0 && area > 0) {
      front = Number((area / depth).toFixed(1));
    } else if (front > 0 && depth > 0 && area === 0) {
      area = Number((front * depth).toFixed(1));
    }

    return {
      area: area || 250,
      front: front || 10,
      depth: depth || 25,
      leftSide: leftSide || depth || 25,
      rightSide: rightSide || depth || 25,
      rear: rear || front || 10,
      address: addr,
      frente,
      fundos,
      direita,
      esquerda
    };
  }, [property, matriculaAnalysis]);

  const extracted = useMemo(() => extractMatriculaDimensions(), [extractMatriculaDimensions]);

  // Sync Initial Data on Mount or Property Change
  useEffect(() => {
    const defaultAddr = property ? [property.address, property.city, property.state].filter(Boolean).join(', ') : '';
    setAddressInput(initialData?.address || defaultAddr || extracted.address || '');
    setMapsUrlInput(initialData?.mapsUrl || '');

    const regA = initialData?.registeredArea || property?.area || extracted.area || 250;
    const front = initialData?.frontageMeters || extracted.front || 10;
    const dep = initialData?.depthMeters || extracted.depth || 25;
    const measA = initialData?.measuredArea || Number((front * dep).toFixed(1)) || regA;

    setRegisteredAreaInput(regA);
    setFrontageInput(front);
    setDepthInput(dep);
    setMeasuredAreaInput(measA);

    // If points exist in initial data
    if (initialData?.automatedMeasurement?.points && initialData.automatedMeasurement.points.length >= 3) {
      setPoints(initialData.automatedMeasurement.points.map((p, i) => ({ id: `p-${i + 1}`, x: p.x, y: p.y })));
    } else {
      // Create initial regular lot matching dimensions
      setPoints([
        { id: 'p-1', x: 30, y: 25 },
        { id: 'p-2', x: 70, y: 25 },
        { id: 'p-3', x: 70, y: 75 },
        { id: 'p-4', x: 30, y: 75 },
      ]);
    }

    if (initialData) {
      setRegionalInfo(initialData);
    }
  }, [property, initialData, extracted]);

  // Calibrate scale when frontage or depth changes
  useEffect(() => {
    const f = parseFloat(String(frontageInput)) || 10;
    // By default, width between p1(30%) and p2(70%) is 40%
    // 40% = frontage => 10% = frontage / 4
    if (f > 0) {
      setMetersPer10Percent(f / 4);
    }
  }, [frontageInput]);

  // ==========================================
  // DISTANCE & AREA CALCULATIONS (Shoelace Formula)
  // ==========================================

  // Calculate distance between two percentage points in real meters
  const calculateSegmentDistance = useCallback((p1: Point2D, p2: Point2D): number => {
    const dxPercent = p2.x - p1.x;
    const dyPercent = p2.y - p1.y;
    const distPercent = Math.sqrt(dxPercent * dxPercent + dyPercent * dyPercent);
    // 10% = metersPer10Percent meters
    const meters = (distPercent / 10) * metersPer10Percent;
    return Number(meters.toFixed(2));
  }, [metersPer10Percent]);

  // Segments calculation
  const segments = useMemo(() => {
    if (points.length < 2) return [];
    const list: { from: Point2D; to: Point2D; distance: number; midX: number; midY: number; index: number }[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const pA = points[i];
      const pB = points[i + 1];
      const d = calculateSegmentDistance(pA, pB);
      list.push({
        from: pA,
        to: pB,
        distance: d,
        midX: (pA.x + pB.x) / 2,
        midY: (pA.y + pB.y) / 2,
        index: i + 1
      });
    }

    // Closing segment if closed
    if (isPolygonClosed && points.length >= 3) {
      const pA = points[points.length - 1];
      const pB = points[0];
      const d = calculateSegmentDistance(pA, pB);
      list.push({
        from: pA,
        to: pB,
        distance: d,
        midX: (pA.x + pB.x) / 2,
        midY: (pA.y + pB.y) / 2,
        index: points.length
      });
    }

    return list;
  }, [points, isPolygonClosed, calculateSegmentDistance]);

  // Total Perimeter in meters
  const totalPerimeter = useMemo(() => {
    const total = segments.reduce((sum, s) => sum + s.distance, 0);
    return Number(total.toFixed(2));
  }, [segments]);

  // Calculate Area using Gauss's Area Formula (Shoelace Formula)
  const computedArea = useMemo(() => {
    if (points.length < 3) return 0;
    
    // Convert points to metric coordinates (meters from top-left)
    const metricCoords = points.map(p => ({
      x: (p.x / 10) * metersPer10Percent,
      y: (p.y / 10) * metersPer10Percent
    }));

    let sum1 = 0;
    let sum2 = 0;
    const n = metricCoords.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      sum1 += metricCoords[i].x * metricCoords[j].y;
      sum2 += metricCoords[j].x * metricCoords[i].y;
    }

    const areaM2 = Math.abs(sum1 - sum2) / 2;
    return Number(areaM2.toFixed(2));
  }, [points, metersPer10Percent]);

  // Update measuredAreaInput whenever computedArea changes
  useEffect(() => {
    if (computedArea > 0) {
      setMeasuredAreaInput(computedArea);
    }
  }, [computedArea]);

  // Center of Polygon (Centroid)
  const polygonCenter = useMemo(() => {
    if (points.length === 0) return { x: 50, y: 50 };
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x: avgX, y: avgY };
  }, [points]);

  // Discrepancy analysis
  const discrepancy = useMemo(() => {
    const reg = parseFloat(String(registeredAreaInput)) || 0;
    const meas = parseFloat(String(measuredAreaInput)) || computedArea || 0;
    if (reg <= 0 || meas <= 0) return null;
    const diff = Number((meas - reg).toFixed(2));
    const perc = Number(((diff / reg) * 100).toFixed(1));
    return {
      diff,
      perc,
      status: diff > 0 ? ('excess' as const) : diff < 0 ? ('deficit' as const) : ('normal' as const)
    };
  }, [registeredAreaInput, measuredAreaInput, computedArea]);

  // ==========================================
  // MAP CLICK & POINT INTERACTION HANDLERS
  // ==========================================

  // Click to add point on map (Google Maps style)
  const handleMapCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAddingPointsMode || draggingPointId) return;

    const svg = mapSvgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain inside bounds
    const boundedX = Math.max(2, Math.min(98, Number(clickX.toFixed(2))));
    const boundedY = Math.max(2, Math.min(98, Number(clickY.toFixed(2))));

    // If clicking close to the first point and we have at least 3 points, close polygon
    if (points.length >= 3 && !isPolygonClosed) {
      const p1 = points[0];
      const distToP1 = Math.hypot(p1.x - boundedX, p1.y - boundedY);
      if (distToP1 < 5) {
        setIsPolygonClosed(true);
        triggerToast("Polígono fechado com sucesso!");
        return;
      }
    }

    const newPoint: Point2D = {
      id: `p-${Date.now()}`,
      x: boundedX,
      y: boundedY
    };

    setPoints(prev => [...prev, newPoint]);
    triggerToast(`Ponto P${points.length + 1} adicionado (${boundedX.toFixed(1)}%, ${boundedY.toFixed(1)}%)`);
  };

  // Drag vertex point handler
  const handleVertexMouseDown = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation();
    setDraggingPointId(pointId);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingPointId) return;
    const svg = mapSvgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const moveX = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const moveY = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    setPoints(prev => prev.map(p => p.id === draggingPointId ? { ...p, x: Number(moveX.toFixed(2)), y: Number(moveY.toFixed(2)) } : p));
  };

  const handleSvgMouseUp = () => {
    if (draggingPointId) {
      setDraggingPointId(null);
    }
  };

  // Preset Layout Shapes
  const applyPresetShape = (type: 'regular_10x25' | 'matricula_box' | 'corner_5pt' | 'trapezoid' | 'clear') => {
    if (type === 'clear') {
      setPoints([]);
      setIsPolygonClosed(false);
      triggerToast("Mapa limpo. Clique no mapa para começar a medir ponto a ponto.");
      return;
    }

    if (type === 'regular_10x25') {
      setPoints([
        { id: 'p-1', x: 30, y: 25 },
        { id: 'p-2', x: 70, y: 25 },
        { id: 'p-3', x: 70, y: 75 },
        { id: 'p-4', x: 30, y: 75 },
      ]);
      setFrontageInput(10);
      setDepthInput(25);
      setMetersPer10Percent(2.5);
      setIsPolygonClosed(true);
      triggerToast("Lote Retangular 10x25m (250 m²) aplicado.");
      return;
    }

    if (type === 'matricula_box') {
      const f = extracted.front || 10;
      const d = extracted.depth || 25;
      setFrontageInput(f);
      setDepthInput(d);
      setRegisteredAreaInput(extracted.area || 250);
      setMetersPer10Percent(f / 4);
      setPoints([
        { id: 'p-1', x: 30, y: 25 },
        { id: 'p-2', x: 70, y: 25 },
        { id: 'p-3', x: 70, y: 75 },
        { id: 'p-4', x: 30, y: 75 },
      ]);
      setIsPolygonClosed(true);
      triggerToast(`Dimensões oficiais da Matrícula aplicadas: ${f}m x ${d}m.`);
      return;
    }

    if (type === 'corner_5pt') {
      setPoints([
        { id: 'p-1', x: 30, y: 25 },
        { id: 'p-2', x: 70, y: 25 },
        { id: 'p-3', x: 70, y: 65 },
        { id: 'p-4', x: 60, y: 75 }, // Chanfro da esquina
        { id: 'p-5', x: 30, y: 75 },
      ]);
      setIsPolygonClosed(true);
      triggerToast("Lote de Esquina com Chanfro de Calçada aplicado.");
      return;
    }

    if (type === 'trapezoid') {
      setPoints([
        { id: 'p-1', x: 35, y: 25 },
        { id: 'p-2', x: 65, y: 25 },
        { id: 'p-3', x: 75, y: 75 },
        { id: 'p-4', x: 25, y: 75 },
      ]);
      setIsPolygonClosed(true);
      triggerToast("Lote Trapezoidal / Irregular aplicado.");
      return;
    }
  };

  // Remove single point
  const handleRemovePoint = (pointId: string) => {
    setPoints(prev => prev.filter(p => p.id !== pointId));
    triggerToast("Ponto removido.");
  };

  // Undo last point
  const handleUndoLastPoint = () => {
    if (points.length === 0) return;
    setPoints(prev => prev.slice(0, -1));
    triggerToast("Último ponto desfeito.");
  };

  // Save measurement to property & parent state
  const handleSaveMeasurementToProperty = () => {
    const measArea = computedArea > 0 ? computedArea : parseFloat(String(measuredAreaInput)) || 0;
    const regArea = parseFloat(String(registeredAreaInput)) || property?.area || 0;
    const f = parseFloat(String(frontageInput)) || extracted.front || 0;
    const d = parseFloat(String(depthInput)) || extracted.depth || 0;

    const autoMeas: AutomatedMeasurement = {
      measuredArea: measArea,
      registeredArea: regArea,
      frontageMeters: f,
      depthMeters: d,
      perimeterMeters: totalPerimeter,
      discrepancyDiff: discrepancy?.diff || 0,
      discrepancyPerc: discrepancy?.perc || 0,
      conformityStatus: discrepancy?.status || 'normal',
      isAutoCalculated: true,
      points: points.map(p => ({ x: p.x, y: p.y }))
    };

    const updatedData: RegionalData = {
      ...regionalInfo,
      address: addressInput || property?.address || '',
      mapsUrl: mapsUrlInput,
      measuredArea: measArea,
      registeredArea: regArea,
      frontageMeters: f,
      depthMeters: d,
      automatedMeasurement: autoMeas,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    };

    setRegionalInfo(updatedData);
    if (onSave) onSave(updatedData);

    triggerToast("✅ Medição pericial salva com sucesso no cadastro do imóvel!");
  };

  // Copy measurement summary
  const handleCopyMeasurementReport = () => {
    const text = `📐 LAUDO DE MEDIÇÃO CARTOGRÁFICA & SATÉLITE - TJINVEST\n` +
      `📍 Imóvel: ${addressInput || property?.title || 'Não especificado'}\n` +
      `--------------------------------------------------\n` +
      `• Área Medida (Satélite): ${computedArea || measuredAreaInput} m²\n` +
      `• Área Registrada (Matrícula): ${registeredAreaInput} m²\n` +
      `• Testada (Frente): ${frontageInput} m\n` +
      `• Profundidade / Extensão: ${depthInput} m\n` +
      `• Perímetro Total Medido: ${totalPerimeter} m\n` +
      `• Vértices / Pontos de Divisa: ${points.length} pontos\n` +
      `• Divergência Cadastral: ${discrepancy ? `${discrepancy.diff > 0 ? `+${discrepancy.diff}` : discrepancy.diff} m² (${discrepancy.perc}%)` : 'Em conformidade'}\n` +
      `• Data da Aferição: ${new Date().toLocaleString('pt-BR')}\n` +
      `--------------------------------------------------\n` +
      `🔗 Google Maps: https://maps.google.com/maps?q=${encodeURIComponent(addressInput || 'Brasil')}`;

    navigator.clipboard.writeText(text);
    triggerToast("📋 Laudo de medição copiado para a área de transferência!");
  };

  // AI Regional Analysis Handler
  const handleRunRegionalAiAnalysis = async () => {
    if (!addressInput && !property?.address) {
      alert("Por favor, preencha o endereço completo para consultar a região.");
      return;
    }

    setIsAnalyzing(true);
    const targetAddress = addressInput || [property?.address, property?.city, property?.state].filter(Boolean).join(', ');

    try {
      const apiKeyToUse = userApiKey || '';
      const prompt = `Você é o maior especialista em Engenharia Cartográfica, Perícias Judiciais Imobiliárias e Inteligência Territorial de Investimentos em Leilões no Brasil.
Analise a região do imóvel: "${targetAddress}".
Dimensões cadastradas: Área Matrícula: ${registeredAreaInput}m², Área Medida: ${measuredAreaInput}m², Testada: ${frontageInput}m.

Forneça um diagnóstico estruturado em JSON estrito com os campos:
{
  "incomeProfile": "Perfil socioeconômico predominante, renda média familiar e padrão construtivo das edificações no bairro.",
  "floodRisk": "Baixo" | "Médio" | "Alto" | "Muito Baixo",
  "floodDetails": "Histórico de drenagem, proximidade com córregos, declividade do terreno e suscetibilidade a alagamentos.",
  "transportation": "Acessibilidade, principais avenidas de escoamento, linhas de ônibus, metrô ou terminais próximos.",
  "generalLiquidity": "Liquidez e velocidade estimada de revenda/locação para imóveis deste padrão na microrregião.",
  "namedHospitals": [
    { "name": "Nome do Hospital / UPA Real", "distance": "Ex: 1.2 km (4 min)", "note": "Referência em atendimento de urgência" }
  ],
  "namedShoppings": [
    { "name": "Nome do Shopping / Hipermercado Real", "distance": "Ex: 2.5 km (8 min)", "note": "Centro de compras e conveniência" }
  ],
  "namedSchools": [
    { "name": "Nome de Escola / Universidade", "distance": "Ex: 800 m", "note": "Polo educacional" }
  ]
}`;

      let aiResponseText = '';

      if (apiKeyToUse) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyToUse}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
          })
        });
        const data = await response.json();
        aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const response = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            prompt,
            model: selectedModel || 'gemini-3.7-flash',
            jsonMode: true
          })
        });
        const data = await response.json();
        aiResponseText = data.text || data.response || '';
      }

      if (aiResponseText) {
        const cleaned = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const updated: RegionalData = {
          ...regionalInfo,
          address: targetAddress,
          incomeProfile: parsed.incomeProfile || regionalInfo.incomeProfile,
          floodRisk: parsed.floodRisk || 'Baixo',
          floodDetails: parsed.floodDetails || '',
          transportation: parsed.transportation || '',
          generalLiquidity: parsed.generalLiquidity || '',
          namedHospitals: parsed.namedHospitals || [],
          namedShoppings: parsed.namedShoppings || [],
          namedSchools: parsed.namedSchools || [],
          lastUpdated: new Date().toLocaleDateString('pt-BR')
        };

        setRegionalInfo(updated);
        if (onSave) onSave(updated);
        triggerToast("🎉 Mapeamento territorial e de vizinhança atualizado com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro na análise regional:", err);
      triggerToast("Aviso: Falha na conexão com a IA territorial. Dados locais mantidos.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI Chat Confrontation Handler
  const handleSendRegionalChat = async (overrideText?: string, isDirectPill = false) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || sendingChat) return;

    const userMsg: RegionalChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isConfrontation: isDirectPill
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overrideText) setChatInput('');
    setSendingChat(true);

    try {
      const apiKeyToUse = userApiKey || '';
      const prompt = `Você é um Perito Engenheiro Avaliador e Especialista em Inteligência Imobiliária.
Contexto do Imóvel:
- Endereço: "${addressInput || property?.address || 'São Paulo, SP'}"
- Área da Matrícula: ${registeredAreaInput} m²
- Área Medida no Satélite: ${computedArea || measuredAreaInput} m²
- Testada (Frente): ${frontageInput} m
- Profundidade: ${depthInput} m
- Perímetro Medido: ${totalPerimeter} m
- Quantidade de Vértices: ${points.length} pontos

Pergunta do Usuário: "${textToSend}"

Responda de forma direta, técnica, acolhedora e precisa, focando em riscos de invasão, sobreposição de muros, recuos obrigatórios, alagamentos e valor de mercado.`;

      let reply = '';
      if (apiKeyToUse) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyToUse}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const response = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ prompt, model: selectedModel || 'gemini-3.7-flash' })
        });
        const data = await response.json();
        reply = data.text || data.response || '';
      }

      const botMsg: RegionalChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply || 'Não foi possível obter resposta no momento. Tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Erro ao conectar com o serviço de IA. Verifique sua chave de API nas configurações.',
        timestamp: 'Agora'
      }]);
    } finally {
      setSendingChat(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  };

  // Google Maps URLs
  const resolvedAddressQuery = encodeURIComponent(addressInput || [property?.address, property?.city, property?.state].filter(Boolean).join(', ') || 'São Paulo, SP');
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${resolvedAddressQuery}`;
  const googleMapsSatelliteUrl = `https://www.google.com/maps/search/?api=1&query=${resolvedAddressQuery}&t=k`;
  const googleEarthUrl = `https://earth.google.com/web/search/${resolvedAddressQuery}`;

  return (
    <div className="space-y-8 font-sans" id="regional-intelligence-map-root">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white border-2 border-brand-primary/60 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200">
          <Sparkles size={16} className="text-brand-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-primary/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveMainTab('measurement')}
            className={cn(
              "px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm",
              activeMainTab === 'measurement'
                ? "bg-brand-primary text-black"
                : "bg-brand-paper hover:bg-brand-primary/10 text-brand-ink/70 border border-brand-primary/10"
            )}
          >
            <Ruler size={16} />
            <span>Medição do Lote (Google Maps)</span>
          </button>

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
      {/* TAB 1: MEASUREMENT IDENTICAL TO GOOGLE MAPS */}
      {/* ========================================== */}
      {activeMainTab === 'measurement' && (
        <div className="space-y-6">
          
          {/* Top Instruction & Toolbar */}
          <div className="bg-brand-paper p-6 rounded-3xl border border-brand-primary/20 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-brand-primary flex items-center gap-2">
                    <Crosshair size={20} className="text-brand-primary" />
                    <span>Medição Perimetral de Terreno no Satélite</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Estilo Google Maps
                  </span>
                </div>
                <p className="text-xs text-brand-ink/70">
                  <strong>Como medir:</strong> Clique no mapa/satélite para ligar os pontos dos vértices do terreno. Arraste qualquer ponto para ajustar a divisa do muro ou cerca.
                </p>
              </div>

              {/* Viewport Modes */}
              <div className="flex items-center gap-1.5 bg-brand-bg/80 p-1.5 rounded-2xl border border-brand-primary/10">
                <button
                  onClick={() => setViewerMode('interactive_points')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    viewerMode === 'interactive_points' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/60 hover:text-brand-primary"
                  )}
                >
                  <Layers size={14} />
                  <span>Satélite HD Interativo</span>
                </button>
                <button
                  onClick={() => setViewerMode('blueprint')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    viewerMode === 'blueprint' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/60 hover:text-brand-primary"
                  )}
                >
                  <Building size={14} />
                  <span>Planta com Cotas</span>
                </button>
                <button
                  onClick={() => setViewerMode('googlemaps_live')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    viewerMode === 'googlemaps_live' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/60 hover:text-brand-primary"
                  )}
                >
                  <Compass size={14} />
                  <span>Google Maps Direto</span>
                </button>
              </div>
            </div>

            {/* Quick Action Presets & Tools Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brand-primary/10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 mr-1">
                  Formatos Rápidos:
                </span>
                <button
                  onClick={() => applyPresetShape('matricula_box')}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink text-xs font-bold rounded-xl transition-all"
                  title="Aplica dimensões extraídas da certidão de matrícula"
                >
                  📄 Padrão da Matrícula ({extracted.front}x{extracted.depth}m)
                </button>
                <button
                  onClick={() => applyPresetShape('regular_10x25')}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink text-xs font-bold rounded-xl transition-all"
                >
                  📐 Retângulo 10x25 (250m²)
                </button>
                <button
                  onClick={() => applyPresetShape('corner_5pt')}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink text-xs font-bold rounded-xl transition-all"
                >
                  📍 Lote de Esquina (Chanfro)
                </button>
                <button
                  onClick={() => applyPresetShape('trapezoid')}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink text-xs font-bold rounded-xl transition-all"
                >
                  🔺 Trapézio / Irregular
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsPolygonClosed(!isPolygonClosed)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                    isPolygonClosed 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                  )}
                >
                  <CheckCircle2 size={13} />
                  <span>{isPolygonClosed ? 'Polígono Fechado' : 'Fechar Polígono'}</span>
                </button>

                <button
                  onClick={handleUndoLastPoint}
                  disabled={points.length === 0}
                  className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/20 text-brand-ink text-xs font-bold rounded-xl transition-all flex items-center gap-1 disabled:opacity-40"
                  title="Desfazer o último ponto criado"
                >
                  <RotateCcw size={13} />
                  <span>Desfazer Ponto</span>
                </button>

                <button
                  onClick={() => applyPresetShape('clear')}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                  title="Zerar medição e começar do zero"
                >
                  <Trash2 size={13} />
                  <span>Limpar</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* VIEWPORT 1: SATELLITE WITH POINT-BY-POINT GOOGLE MAPS DRAWING */}
          {/* ========================================================= */}
          {viewerMode === 'interactive_points' && (
            <div className="relative w-full h-[520px] sm:h-[600px] rounded-[2.5rem] overflow-hidden border-2 border-brand-primary/30 shadow-2xl bg-slate-950 select-none group">
              
              {/* Google Maps Satellite Background Layer */}
              <iframe
                title="Google Maps Satellite Measurement Layer"
                src={`https://maps.google.com/maps?q=${resolvedAddressQuery}&t=k&z=${mapScaleZoom}&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0 absolute inset-0 opacity-85 group-hover:opacity-95 transition-opacity pointer-events-none"
                loading="lazy"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/40 pointer-events-none" />

              {/* Top Interactive Overlay Controls */}
              <div className="absolute top-4 left-4 z-30 flex items-center gap-2 flex-wrap">
                <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                  <MousePointer size={14} className="text-brand-primary animate-pulse" />
                  <span>{points.length} Vértices Marcados</span>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-mono flex items-center gap-2 shadow-lg">
                  <span className="text-slate-400">Escala:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={metersPer10Percent}
                    onChange={(e) => setMetersPer10Percent(parseFloat(e.target.value))}
                    className="w-20 accent-brand-primary cursor-pointer"
                    title="Calibrar escala em metros"
                  />
                  <span className="text-brand-primary font-bold">{metersPer10Percent.toFixed(1)}m / 10%</span>
                </div>
              </div>

              {/* Top Right Quick Links */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <a
                  href={googleMapsSatelliteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xl"
                >
                  <Layers size={13} />
                  <span>Satélite HD</span>
                  <ExternalLink size={11} />
                </a>

                <a
                  href={googleEarthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-slate-900/90 text-white border border-white/20 hover:bg-slate-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xl"
                >
                  <Compass size={13} />
                  <span>Earth 3D</span>
                </a>
              </div>

              {/* ======================================================= */}
              {/* INTERACTIVE SVG OVERLAY: LINES, POLYGON, VERTICES, COTAS */}
              {/* ======================================================= */}
              <svg
                ref={mapSvgRef}
                onClick={handleMapCanvasClick}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={handleSvgMouseUp}
                className={cn(
                  "absolute inset-0 w-full h-full z-20",
                  isAddingPointsMode ? "cursor-crosshair" : "cursor-default"
                )}
              >
                {/* Closed Polygon Fill */}
                {isPolygonClosed && points.length >= 3 && (
                  <polygon
                    points={points.map(p => `${p.x}%,${p.y}%`).join(' ')}
                    fill="rgba(245, 158, 11, 0.22)"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray="6 3"
                    className="filter drop-shadow-[0_0_15px_rgba(245,158,11,0.7)] transition-all"
                  />
                )}

                {/* Connecting Lines between Points (Segments) */}
                {segments.map((seg, idx) => (
                  <g key={`seg-${idx}`}>
                    <line
                      x1={`${seg.from.x}%`}
                      y1={`${seg.from.y}%`}
                      x2={`${seg.to.x}%`}
                      y2={`${seg.to.y}%`}
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </g>
                ))}

                {/* Open Line between points if polygon not closed */}
                {!isPolygonClosed && points.length > 1 && (
                  <polyline
                    points={points.map(p => `${p.x}%,${p.y}%`).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray="5 3"
                  />
                )}
              </svg>

              {/* Segment Distance Badges (Overlaid on line centers) */}
              {segments.map((seg, idx) => (
                <div
                  key={`badge-${idx}`}
                  className="absolute z-25 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${seg.midX}%`, top: `${seg.midY}%` }}
                >
                  <div className="bg-slate-950/90 border-2 border-emerald-400 text-emerald-300 font-mono text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xl backdrop-blur-md whitespace-nowrap">
                    {seg.distance} m
                  </div>
                </div>
              ))}

              {/* Interactive Draggable Vertex Markers (P1, P2, P3...) */}
              {points.map((pt, idx) => (
                <div
                  key={pt.id}
                  onMouseDown={(e) => handleVertexMouseDown(e, pt.id)}
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group/pt"
                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                >
                  {/* Outer Pulsing Ring */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/40 animate-ping absolute" />
                    <div className="w-7 h-7 rounded-full bg-slate-950 border-2 border-brand-primary text-brand-primary flex items-center justify-center font-mono text-[10px] font-black shadow-2xl">
                      P{idx + 1}
                    </div>
                  </div>

                  {/* Delete Hover Pill */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePoint(pt.id);
                    }}
                    className="absolute -top-6 -right-6 hidden group-hover/pt:flex w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full items-center justify-center shadow-lg transition-all"
                    title={`Remover Ponto P${idx + 1}`}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {/* Central Area & Perimeter Display Badge */}
              {points.length >= 3 && isPolygonClosed && (
                <div
                  className="absolute z-35 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto shadow-2xl text-center"
                  style={{ left: `${polygonCenter.x}%`, top: `${polygonCenter.y}%` }}
                >
                  <div className="bg-slate-950/95 border-2 border-brand-primary text-white p-4 sm:p-5 rounded-3xl shadow-2xl backdrop-blur-md space-y-1.5 min-w-[220px]">
                    <div className="flex items-center justify-center gap-1.5 text-brand-primary text-[10px] font-bold uppercase tracking-wider">
                      <Ruler size={13} className="text-brand-primary" />
                      <span>Área Medida no Satélite</span>
                    </div>

                    <div className="text-3xl sm:text-4xl font-black font-mono text-brand-primary tracking-tight">
                      {computedArea} <span className="text-base font-sans font-bold text-white">m²</span>
                    </div>

                    <div className="text-[11px] text-slate-300 font-mono font-medium flex items-center justify-center gap-3 border-t border-white/15 pt-1.5">
                      <span>Perímetro: <strong className="text-emerald-400">{totalPerimeter} m</strong></span>
                    </div>

                    {discrepancy && Math.abs(discrepancy.perc) > 0.5 && (
                      <div className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md font-bold mt-1",
                        discrepancy.diff > 0 ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                      )}>
                        Divergência: {discrepancy.diff > 0 ? `+${discrepancy.diff}m²` : `${discrepancy.diff}m²`} ({discrepancy.perc}%)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Helper Bar */}
              <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-2 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-xs text-white">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    Arestas: <strong>{segments.length}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-primary inline-block" />
                    Vértices: <strong>{points.length}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMeasurementReport}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Copy size={12} />
                    <span>Copiar Laudo</span>
                  </button>

                  <button
                    onClick={handleSaveMeasurementToProperty}
                    className="px-4 py-1.5 bg-brand-primary text-black font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition-all flex items-center gap-1.5 shadow-lg uppercase tracking-wider"
                  >
                    <Check size={14} />
                    <span>Salvar no Imóvel</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEWPORT 2: ARCHITECTURAL BLUEPRINT WITH CAD COTAS */}
          {/* ========================================================= */}
          {viewerMode === 'blueprint' && (
            <div className="bg-slate-950 p-6 sm:p-10 rounded-[2.5rem] border-2 border-brand-primary/30 shadow-2xl relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Building size={20} className="text-brand-primary" />
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Planta Cadastral & Cotas Oficiais</h4>
                    <p className="text-xs text-slate-400">Diagrama perimetral arquitetônico gerado conforme matrícula</p>
                  </div>
                </div>
                <button
                  onClick={() => applyPresetShape('matricula_box')}
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Sincronizar Matrícula</span>
                </button>
              </div>

              {/* Main Blueprint Box */}
              <div className="flex items-center justify-center min-h-[360px] py-4">
                <div className="relative w-full max-w-2xl bg-slate-900/90 rounded-2xl border-2 border-dashed border-brand-primary/40 p-8 sm:p-12 shadow-2xl backdrop-blur-md">
                  
                  {/* North Indicator */}
                  <div className="absolute top-4 right-4 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 border border-white/10 text-white">
                    <Navigation size={18} className="text-amber-400 transform -rotate-45" />
                    <span className="text-[9px] font-bold font-mono text-amber-400 mt-0.5">N</span>
                  </div>

                  {/* Top: Fundos */}
                  <div className="flex flex-col items-center mb-4 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">▲ Fundos: {extracted.fundos}</span>
                    <div className="bg-slate-950 border-2 border-amber-400 text-amber-300 font-mono text-xs font-black px-4 py-1 rounded-full shadow-lg">
                      {frontageInput} m
                    </div>
                  </div>

                  {/* Lateral & Center Container */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center space-y-1 min-w-[70px]">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider rotate-[-90deg] mb-4">
                        ◀ {extracted.esquerda}
                      </span>
                      <div className="bg-slate-950 border border-amber-400/80 text-amber-300 font-mono text-xs font-bold px-2 py-1 rounded-lg">
                        {depthInput} m
                      </div>
                    </div>

                    <div className="flex-1 bg-amber-500/10 border-2 border-amber-400 rounded-xl p-6 relative overflow-hidden shadow-inner min-h-[200px] flex flex-col items-center justify-center text-center">
                      <div className="w-4/5 h-4/5 bg-slate-950/80 border-2 border-dashed border-emerald-400/70 rounded-lg flex flex-col items-center justify-center p-4 relative shadow-lg">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1">
                          <Building size={12} /> Área Aferida do Lote
                        </span>
                        <div className="text-3xl font-black font-mono text-brand-primary tracking-tight">
                          {measuredAreaInput || computedArea} <span className="text-base text-white font-sans font-bold">m²</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1">
                          Perímetro: {totalPerimeter} m
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center space-y-1 min-w-[70px]">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider rotate-90 mb-4">
                        ▶ {extracted.direita}
                      </span>
                      <div className="bg-slate-950 border border-amber-400/80 text-amber-300 font-mono text-xs font-bold px-2 py-1 rounded-lg">
                        {depthInput} m
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Frente / Testada */}
                  <div className="flex flex-col items-center mt-4 space-y-1">
                    <div className="bg-slate-950 border-2 border-emerald-400 text-emerald-300 font-mono text-sm font-black px-5 py-1.5 rounded-full shadow-xl">
                      Testada: <span className="text-white">{frontageInput} m</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/90 font-bold uppercase tracking-widest mt-1">
                      ▼ Frente: {extracted.frente} (Logradouro)
                    </span>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEWPORT 3: GOOGLE MAPS DIRECT LIVE */}
          {/* ========================================================= */}
          {viewerMode === 'googlemaps_live' && (
            <div className="relative w-full h-[520px] rounded-[2.5rem] overflow-hidden border-2 border-brand-primary/30 bg-slate-950 shadow-inner">
              <iframe
                title="Google Maps Live View"
                src={`https://maps.google.com/maps?q=${resolvedAddressQuery}&t=m&z=17&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
              <div className="absolute bottom-4 right-4 z-20">
                <a
                  href={googleMapsSearchUrl}
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

          {/* Dimension Adjustment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Address Input & Map URLs */}
            <div className="lg:col-span-6 bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-brand-primary/10 pb-3">
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={18} className="text-brand-primary" />
                  Localização do Terreno
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full uppercase">
                  Georreferenciado
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/60 mb-1">
                    Endereço Completo do Imóvel
                  </label>
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Ex: Rua das Palmeiras, 150 - Bairro Centro, São Paulo - SP"
                    className="w-full bg-brand-bg border border-brand-primary/20 rounded-xl px-4 py-2.5 text-xs text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/60 mb-1">
                    Link do Google Maps (Opcional)
                  </label>
                  <input
                    type="text"
                    value={mapsUrlInput}
                    onChange={(e) => setMapsUrlInput(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full bg-brand-bg border border-brand-primary/20 rounded-xl px-4 py-2.5 text-xs font-mono text-brand-ink focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right: Fine Dimension Adjustments */}
            <div className="lg:col-span-6 bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-brand-primary/10 pb-3">
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={18} className="text-brand-primary" />
                  Ajuste Fino de Dimensões
                </h4>
                <button
                  onClick={() => applyPresetShape('matricula_box')}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Restaurar Matrícula
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-brand-bg/60 p-3 rounded-2xl border border-brand-primary/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Testada (Frente)</span>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={frontageInput}
                      onChange={(e) => setFrontageInput(e.target.value)}
                      className="w-full bg-transparent text-lg font-bold font-mono text-brand-ink focus:outline-none"
                    />
                    <span className="text-xs text-brand-ink/40">m</span>
                  </div>
                </div>

                <div className="bg-brand-bg/60 p-3 rounded-2xl border border-brand-primary/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Profundidade</span>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={depthInput}
                      onChange={(e) => setDepthInput(e.target.value)}
                      className="w-full bg-transparent text-lg font-bold font-mono text-brand-ink focus:outline-none"
                    />
                    <span className="text-xs text-brand-ink/40">m</span>
                  </div>
                </div>

                <div className="bg-brand-bg/60 p-3 rounded-2xl border border-brand-primary/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block">Área Matrícula</span>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={registeredAreaInput}
                      onChange={(e) => setRegisteredAreaInput(e.target.value)}
                      className="w-full bg-transparent text-lg font-bold font-mono text-brand-ink focus:outline-none"
                    />
                    <span className="text-xs text-brand-ink/40">m²</span>
                  </div>
                </div>

                <div className="bg-brand-primary/10 p-3 rounded-2xl border border-brand-primary/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary block">Área Medida</span>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={measuredAreaInput}
                      onChange={(e) => setMeasuredAreaInput(e.target.value)}
                      className="w-full bg-transparent text-lg font-bold font-mono text-brand-primary focus:outline-none"
                    />
                    <span className="text-xs font-bold text-brand-primary">m²</span>
                  </div>
                </div>
              </div>

              {discrepancy && Math.abs(discrepancy.perc) > 5 && (
                <div className={cn(
                  "p-3 rounded-2xl border flex items-start gap-2.5 text-xs leading-relaxed",
                  discrepancy.status === 'excess' 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                )}>
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      Divergência de Área Identificada: {discrepancy.diff > 0 ? `+${discrepancy.diff} m²` : `${discrepancy.diff} m²`} ({discrepancy.perc > 0 ? `+${discrepancy.perc}%` : `${discrepancy.perc}%`})
                    </span>
                    <p className="mt-0.5 opacity-80">
                      {discrepancy.status === 'excess'
                        ? 'A medição do lote é superior à matrícula. Pode indicar ampliações não averbadas ou avanço de muro.'
                        : 'A medição é inferior à certidão de matrícula. Verifique recuo viário ou desdobro.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: CENTRAL DE LINKS ORGANIZADOS */}
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
              </div>
            </div>

            {/* Right Column: POIs (Hospitals, Malls, Schools) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] border border-brand-primary/15 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
                  <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap size={18} className="text-emerald-600" />
                    Pontos de Interesse Próximos (POIs)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md">
                    {(regionalInfo.namedHospitals?.length || 0) + (regionalInfo.namedShoppings?.length || 0)} Locais
                  </span>
                </div>

                {/* Hospitals List */}
                {regionalInfo.namedHospitals && regionalInfo.namedHospitals.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-brand-ink/60 uppercase tracking-wider block">
                      🏥 Hospitais & Clínicas
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {regionalInfo.namedHospitals.map((hosp, idx) => (
                        <div key={idx} className="p-3 bg-brand-bg/50 rounded-xl border border-brand-primary/10 space-y-1">
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

                {/* Shoppings List */}
                {regionalInfo.namedShoppings && regionalInfo.namedShoppings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-brand-primary/10">
                    <span className="text-[11px] font-bold text-brand-ink/60 uppercase tracking-wider block">
                      🛍️ Shoppings & Centros Comerciais
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {regionalInfo.namedShoppings.map((shop, idx) => (
                        <div key={idx} className="p-3 bg-brand-bg/50 rounded-xl border border-brand-primary/10 space-y-1">
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

                {(!regionalInfo.namedHospitals || regionalInfo.namedHospitals.length === 0) && (!regionalInfo.namedShoppings || regionalInfo.namedShoppings.length === 0) && (
                  <div className="py-8 text-center bg-brand-bg/40 rounded-2xl border border-dashed border-brand-primary/20 space-y-2">
                    <Info size={24} className="mx-auto text-brand-ink/30" />
                    <p className="text-xs text-brand-ink/60">Nenhum ponto de interesse mapeado ainda.</p>
                    <button
                      onClick={handleRunRegionalAiAnalysis}
                      className="text-xs font-bold text-brand-primary hover:underline"
                    >
                      Clique para mapear POIs com a IA
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Chat & Confrontation Feed */}
          <div className="bg-brand-paper p-6 sm:p-8 rounded-[2.5rem] border border-brand-primary/15 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-primary flex items-center gap-2">
                    <span>Chat Especialista Territorial & Confrontador de Dados</span>
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
                className="p-2 rounded-lg hover:bg-brand-primary/10 text-brand-ink/60 transition-colors cursor-pointer"
              >
                {isChatOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {isChatOpen && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSendRegionalChat(`Confronte a área medida (${measuredAreaInput || computedArea}m² com testada de ${frontageInput}m) com a matrícula (${registeredAreaInput}m²). Quais os riscos práticos?`, true)}
                    disabled={sendingChat}
                    className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Ruler size={13} className="text-brand-primary" />
                    <span>📐 Confrontar Metragens</span>
                  </button>
                  <button
                    onClick={() => handleSendRegionalChat(`Liste hospitais e UPAs de referência próximos de "${addressInput || 'São Paulo'}" com distâncias exatas.`, true)}
                    disabled={sendingChat}
                    className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <GraduationCap size={13} className="text-emerald-600" />
                    <span>🏥 Hospitais e Clínicas</span>
                  </button>
                  <button
                    onClick={() => handleSendRegionalChat(`Qual o histórico de alagamentos e relevo no logradouro de "${addressInput || 'São Paulo'}"?`, true)}
                    disabled={sendingChat}
                    className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-ink font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Waves size={13} className="text-cyan-600" />
                    <span>🌊 Histórico de Enchentes</span>
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
      )}

    </div>
  );
};
