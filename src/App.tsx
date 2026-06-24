import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SessionException } from './lib/exceptions';
import { 
  LayoutDashboard, 
  Home, 
  FileText, 
  Files, 
  DollarSign, 
  Brain, 
  Settings, 
  Users, 
  Search, 
  LogOut, 
  Plus, 
  Sliders,
  Trash2, 
  Edit, 
  Edit2,
  Gavel, 
  Eye,
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  Check,
  Scale,
  Loader2, 
  Download,
  Upload,
  ChevronRight,
  Menu,
  X,
  Cpu,
  Database,
  RefreshCw,
  FileDown,
  TrendingUp,
  Percent,
  Clock,
  MessageSquare,
  Send,
  Save,
  Printer,
  ChevronDown,
  Info,
  Calculator,
  Sparkles,
  Zap,
  Clipboard,
  ExternalLink,
  Sun,
  Moon,
  Globe,
  BookOpen,
  Star,
  Instagram,
  Video,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TIRCalculator } from './components/TIRCalculator';
import { CashFlowChart } from './components/CashFlowChart';
import { MatriculaReport } from './components/MatriculaReport';
import { EditalReport } from './components/EditalReport';
import { ProcessoReport } from './components/ProcessoReport';
import { User, Property, Process, AIConfig, StrategicBrainItem } from './types';
import { SYSTEM_PROMPT } from './constants';
import { analyzeAuctionDocuments, generateProcessStory, sendChatMessage } from './services/aiService';
import SmartAnalysisTab, { SmartAnalysisData, getEmptySmartAnalysis } from './components/SmartAnalysisTab';

const SimulationContext = React.createContext<{ 
  simulationData: any, 
  updateState: (s: any) => void, 
  onJumpToSimulation?: (id: string) => void,
  selectedPropertyId?: string,
  analysisId?: string | null,
  token?: string,
  report?: string | null,
  editalAnalysis?: string | null,
  matriculaAnalysis?: string | null,
  processAnalysis?: string | null,
  dossierAnalysis?: string | null,
  properties?: Property[],
  handleSaveAsProperty?: () => Promise<void>
}>({
  simulationData: null,
  updateState: () => {},
  onJumpToSimulation: () => {}
});

import { cn } from './lib/utils';
import { uploadDocuments } from './services/documentService';
import { Sidebar } from './components/layout/Sidebar';

type Tab = 'dashboard' | 'properties' | 'processes' | 'documents' | 'debts' | 'ai-analysis' | 'simulations' | 'brain' | 'ai-config' | 'users' | 'settings' | 'datajud';

type AIModel = 
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview' 
  | 'gemini-3.1-flash-preview'
  | 'gemini-3-flash-preview' 
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-flash-latest' 
  | 'claude-4-6-opus'
  | 'claude-4-6-sonnet'
  | 'claude-4-5-haiku'
  | 'claude-4-5-opus'
  | 'claude-4-5-sonnet'
  | 'gpt-5'
  | 'gpt-4o'
  | 'o1-preview'
  | 'deepseek-v3'
  | 'deepseek-r1';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const parseJsonResponse = async (res: Response) => {
  const text = await res.text();
  try {
    const trimmed = text.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    
    // Check if it looks like HTML
    if (lowerTrimmed.startsWith('<!doctype') || lowerTrimmed.includes('<html') || lowerTrimmed.includes('<body') || lowerTrimmed.startsWith('<')) {
      console.warn(`API Warning: Received HTML instead of JSON for ${res.url}. Status: ${res.status}.`);
      
      if (res.status === 401 || res.status === 403) {
        const msg = "Sessão expirada ou cookies bloqueados.\n\nPor favor, tente abrir o sistema em uma nova aba para renovar a sessão.";
        const error = new SessionException(msg);
        throw error;
      } else {
        const msg = `O servidor está temporariamente indisponível ou em processo de reinicialização (Status: ${res.status}). Por favor, aguarde alguns segundos e tente novamente.`;
        throw new Error(msg);
      }
    }
    
    return JSON.parse(trimmed);
  } catch (e: any) {
    if (e instanceof SessionException || e.name === 'SessionException' || (e.message && e.message.includes("Sessão expirada")) || (e.message && e.message.includes("O servidor está temporariamente indisponível"))) {
      throw e;
    }
    console.error(`Erro ao parsear JSON para ${res.url}. Status: ${res.status}. Content: ${text.substring(0, 200)}...`);
    throw new Error(`Resposta do servidor não é JSON para ${res.url} (Status: ${res.status})`);
  }
};

const formatErrorMessage = (err: any) => {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return "Erro de conexão. Verifique sua rede e tente novamente.";
  }
  return err instanceof Error ? err.message : String(err);
};

const resolveApiKey = (
  keySource: 'system_default' | 'openai_custom' | 'gemini_custom' | 'claude_custom' | 'deepseek_custom',
  config: AIConfig | null,
  model: AIModel
): string | undefined => {
  if (!config) return undefined;
  
  let key = "";
  if (keySource === 'system_default') {
    key = "";
  } else if (keySource === 'openai_custom') {
    key = config.openai_key?.trim() || "";
  } else if (keySource === 'gemini_custom') {
    key = config.gemini_key?.trim() || "";
  } else if (keySource === 'claude_custom') {
    key = config.claude_key?.trim() || "";
  } else if (keySource === 'deepseek_custom') {
    key = config.deepseek_key?.trim() || "";
  } else {
    // Fallback based on model name prefix
    if (model.startsWith('gemini')) key = config.gemini_key?.trim() || "";
    else if (model.startsWith('claude')) key = config.claude_key?.trim() || "";
    else if (model.startsWith('gpt') || model.startsWith('o1')) key = config.openai_key?.trim() || "";
    else if (model.startsWith('deepseek')) key = config.deepseek_key?.trim() || "";
  }

  if (key && key.includes(' • ')) {
    key = key.split(' • ')[1].trim();
  }
  return key || undefined;
};

const CostsEditor = ({ simulationData, updateSimulationData }: { simulationData: any, updateSimulationData: (data: any) => void }) => {
  const [saving, setSaving] = React.useState(false);
  if (!simulationData) return <div>Dados de simulação não disponíveis.</div>;

  const updateField = (field: string, value: number) => {
    updateSimulationData({
      ...simulationData,
      [field]: { ...simulationData[field], value }
    });
  };

  const fields = [
    { key: 'commission', label: 'Comissão Leiloeiro (%)' },
    { key: 'assessoria', label: 'Assessoria TJ INVEST (%)' },
    { key: 'entrada', label: 'Entrada TJ INVEST (R$)' },
    { key: 'desocupacaoAcordo', label: 'Desocupação Acordo (R$)' },
    { key: 'desocupacaoDespesas', label: 'Desocupação Despesas (R$)' },
    { key: 'preAnaliseImobiliaria', label: 'Pré-Análise Imobiliária (R$)' },
    { key: 'preAnaliseJuridica', label: 'Pré-Análise Jurídica (R$)' },
    { key: 'itbi', label: 'ITBI (R$)' },
    { key: 'impostos', label: 'Impostos/Taxas (R$)' },
    { key: 'custosRegistro', label: 'Custos de Registro (R$)' },
    { key: 'reforma', label: 'Reforma/Manutenção (R$)' },
    { key: 'holdingCosts', label: 'Custos de Manutenção/Holding (R$)' },
    { key: 'extraFees', label: 'Taxas Extras (R$)' },
  ];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-primary">Custos da Arrematação</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-primary text-black px-6 py-2 rounded-xl font-bold hover:bg-brand-primary/90 transition-all disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Custos'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">{field.label}</label>
            <input 
              type="number" 
              className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl p-3 text-brand-ink"
              value={simulationData[field.key]?.value || 0}
              onChange={(e) => updateField(field.key, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const getMasterBudgetConfigs = () => {
  const stored = localStorage.getItem('QUADRO_RESUMO_INVESTIMENTO_MASTER');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      console.error("Erro ao ler QUADRO_RESUMO_INVESTIMENTO_MASTER de localStorage", e);
    }
  }
  return {
    comissaoLeiloeiro: { value: 5, type: 'PERCENT' },
    itbi: { value: 3, type: 'PERCENT' },
    transfRegistro: { value: 1.5, type: 'PERCENT' },
    desocupacaoAcordo: { value: 0, type: 'BRL' },
    reforma: { value: 0, type: 'BRL' },
    assessoria: { value: 6, type: 'PERCENT' },
    entrada: { value: 1500, type: 'BRL' },
    extraFees: { value: 0, type: 'BRL' }
  };
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [theme, setTheme] = useState<'dark' | 'light'>(localStorage.getItem('theme') as 'dark' | 'light' || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sidebar responsiveness handler on window change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyDocs, setPropertyDocs] = useState<any[]>([]);
  const [propertyDebts, setPropertyDebts] = useState<any[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<any[]>([]);
  const [brainItems, setBrainItems] = useState<StrategicBrainItem[]>([]);
  const [loading, setLoading] = useState(false);



  // Custom confirm and toast state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (window as any).customConfirm = (title: string, message: string, onConfirmAction: () => void) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          onConfirmAction();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    };

    (window as any).customToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast(null);
      }, 4000);
    };
  }, []);

  const updateState = useCallback((updates: any) => {
    setAiAnalysisState(prev => {
      const resolvedUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...resolvedUpdates };
    });
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const token = path.split('/share/')[1];
      if (token) {
        loadPublicReport(token);
      }
    }
  }, []);

  const loadPublicReport = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/property/${token}`);
      if (!res.ok) throw new Error("Relatório não encontrado.");
      const data = await parseJsonResponse(res);
      
      updateState({
        isPublicView: true,
        shareToken: token,
        report: data.analysis?.exec_summary || "Análise não disponível.",
        anonymizeProperty: data.property.anonymize_property === 1,
        simulationData: {
          valuation: { value: data.property.valuation_value || 0, type: 'BRL' },
          bid: { value: data.property.min_bid || 0, type: 'BRL' },
          saleValue: { value: data.property.expected_sale_value || 0, type: 'BRL' },
          holdingMonths: 12,
          
          // Assessoria
          assessoria: { value: 0, type: 'PERCENT', base: 'bid' },
          entrada: { value: 0, type: 'BRL' },
          
          // Desocupação
          desocupacaoAcordo: { value: 0, type: 'BRL' },
          desocupacaoDespesas: { value: 0, type: 'BRL' },
          desocupacaoHonorarios: { value: 0, type: 'PERCENT', base: 'bid' },
          desocupacaoCustas: { value: 0, type: 'PERCENT', base: 'bid' },
          
          // Pré-Arrematação
          preAnaliseImobiliaria: { value: 0, type: 'BRL' },
          preAnaliseJuridica: { value: 0, type: 'BRL' },
          preCopiaProcessos: { value: 0, type: 'BRL' },
          preConsultas: { value: 0, type: 'BRL' },
          preMatricula: { value: 0, type: 'BRL' },
          
          // Reforma
          reforma: { value: 0, type: 'BRL', base: 'bid' },
          
          // Arrematação
          comissaoLeiloeiro: { value: data.property.modality === 'Venda Direta' ? 0 : 5, type: 'PERCENT', base: 'bid' },
          modality: data.property.modality || 'Judicial',
          
          // Realização
          despesasVenda: { value: 0, type: 'BRL' },
          
          // Despesas Mensais
          mensalCondominio: { value: (data.debts || []).filter((d: any) => d.type?.toLowerCase().includes('condo')).reduce((acc: number, d: any) => acc + (d.value || 0), 0) / 12, type: 'BRL' },
          mensalIPTU: { value: (data.debts || []).filter((d: any) => d.type?.toLowerCase().includes('iptu')).reduce((acc: number, d: any) => acc + (d.value || 0), 0) / 12, type: 'BRL' },
          mensalOutros: { value: 0, type: 'BRL' },
          
          // Despesas Pós-Operacionais
          posTaxaPerformance: { value: 0, type: 'PERCENT', base: 'profit' },
          posComissaoCorretor: { value: 5, type: 'PERCENT', base: 'saleValue' },
          posIR: { value: 15, type: 'PERCENT', base: 'capitalGain' },
          
          // Transferência
          transfEscritura: { value: 0, type: 'PERCENT', base: 'bid' },
          transfITBI: { value: 3, type: 'PERCENT', base: 'bid' },
          transfRegistro: { value: 0, type: 'PERCENT', base: 'bid' },
          transfCartorio: { value: 0, type: 'BRL' },
          transfAverbacoes: { value: 0, type: 'BRL' },
          transfLaudemio: { value: 0, type: 'BRL' },
          transfForo: { value: 0, type: 'BRL' },

          // Financing
          downPaymentPercent: 25,
          installments: 30,
          interestRate: 0,
          auctionType: 'judicial',
          strategy: data.simulation_data?.strategy || 'venda',
          expectedReturn: data.simulation_data?.expectedReturn || 15,
          customExpenses: data.simulation_data?.customExpenses || [],
          comparisonData: data.simulation_data?.comparisonData || {
            tesouro: { tir: 11.5, roi: 11.5 },
            cdb: { tir: 12.0, roi: 12.0 },
            poupanca: { tir: 6.5, roi: 6.5 }
          }
        }
      });
      setIsLoggedIn(true); // Bypass login for public view
      setActiveTab('ai-analysis');
      setAiAnalysisState(prev => ({ ...prev, activeSubTab: 'report' }));
    } catch (err: any) {
      if (!(err instanceof SessionException)) alert(formatErrorMessage(err));
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  // AI Analysis Persistent State
  const [aiAnalysisState, setAiAnalysisState] = useState<{
    activeSubTab: 'report' | 'processos' | 'documents' | 'simulations' | 'cnj' | 'investors' | 'edital' | 'matricula' | 'dossier' | 'instagram' | 'smart_analysis';
    selectedPropertyId: string;
    report: string | null;
    editalAnalysis: string | null;
    matriculaAnalysis: string | null;
    dossierAnalysis: string | null;
    smartAnalysis: SmartAnalysisData | null;
    adHocDocs: any[];
    cnjNumber: string;
    cnjResult: any;
    selectedModel: AIModel;
    chatMessages: ChatMessage[];
    simulationData: any;
    isPublicView: boolean;
    shareToken: string | null;
    showInlineEditor: boolean;
    anonymizeProperty: boolean;
    analysisId: string | null;
    isEditingReport: boolean;
    aiConfig: AIConfig | null;
    manualAuctionType: 'auto' | 'judicial' | 'extrajudicial';
    auctionUrls: string[];
    sessionId: string;
    processStory: any | null;
    processAnalysis: any | null;
    isGeneratingStory: boolean;
    isEditingStory: boolean;
    selectedKeySource: 'system_default' | 'openai_custom' | 'gemini_custom' | 'claude_custom' | 'deepseek_custom';
  }>(() => {
    const masterDefaults = getMasterBudgetConfigs();
    return {
      activeSubTab: 'report',
      selectedPropertyId: '',
      report: null,
      editalAnalysis: null,
      matriculaAnalysis: null,
      dossierAnalysis: null,
      smartAnalysis: null,
      adHocDocs: [],
      cnjNumber: '',
      cnjResult: null,
      selectedModel: (localStorage.getItem('saved_selected_model') || 'gemini-2.5-flash') as AIModel,
      chatMessages: [],
      simulationData: {
        valuation: { value: 0, type: 'BRL' },
        bid: { value: 0, type: 'BRL' },
        saleValue: { value: 0, type: 'BRL' },
        holdingMonths: 12,
        strategy: 'venda',
        expectedReturn: 15,
        customExpenses: [],
        
        // Assessoramento
        assessoria: { value: masterDefaults.assessoria?.value ?? 6, type: masterDefaults.assessoria?.type ?? 'PERCENT', base: 'bid' },
        entrada: { value: masterDefaults.entrada?.value ?? 1500, type: masterDefaults.entrada?.type ?? 'BRL' },
        
        // Desocupação
        desocupacaoAcordo: { value: masterDefaults.desocupacaoAcordo?.value ?? 0, type: masterDefaults.desocupacaoAcordo?.type ?? 'BRL' },
        desocupacaoDespesas: { value: 0, type: 'BRL' },
        desocupacaoHonorarios: { value: 0, type: 'PERCENT', base: 'bid' },
        desocupacaoCustas: { value: 0, type: 'PERCENT', base: 'bid' },
        
        // Pré-Arrematação
        preAnaliseImobiliaria: { value: 0, type: 'BRL' },
        preAnaliseJuridica: { value: 0, type: 'BRL' },
        preCopiaProcessos: { value: 0, type: 'BRL' },
        preConsultas: { value: 0, type: 'BRL' },
        preMatricula: { value: 0, type: 'BRL' },
        
        // Reforma
        reforma: { value: masterDefaults.reforma?.value ?? 0, type: masterDefaults.reforma?.type ?? 'BRL', base: 'bid' },
        
        // Arrematação
        comissaoLeiloeiro: { value: masterDefaults.comissaoLeiloeiro?.value ?? 5, type: masterDefaults.comissaoLeiloeiro?.type ?? 'PERCENT', base: 'bid' },
        commission: { value: masterDefaults.comissaoLeiloeiro?.value ?? 5, type: masterDefaults.comissaoLeiloeiro?.type ?? 'PERCENT', base: 'bid' },
        
        // Realização
        despesasVenda: { value: masterDefaults.extraFees?.value ?? 0, type: masterDefaults.extraFees?.type ?? 'BRL' },
        extraFees: { value: masterDefaults.extraFees?.value ?? 0, type: masterDefaults.extraFees?.type ?? 'BRL' },
        
        // Despesas Mensais (per month)
        mensalCondominio: { value: 0, type: 'BRL' },
        mensalIPTU: { value: 0, type: 'BRL' },
        mensalOutros: { value: 0, type: 'BRL' },
        
        // Despesas Pós-Operacionais
        posTaxaPerformance: { value: 0, type: 'PERCENT', base: 'profit' },
        posComissaoCorretor: { value: 5, type: 'PERCENT', base: 'saleValue' },
        posIR: { value: 15, type: 'PERCENT', base: 'capitalGain' },
        
        // Transferência
        transfEscritura: { value: 1.5, type: 'PERCENT', base: 'bid' },
        transfITBI: { value: masterDefaults.itbi?.value ?? 3, type: masterDefaults.itbi?.type ?? 'PERCENT', base: 'bid' },
        itbi: { value: masterDefaults.itbi?.value ?? 3, type: masterDefaults.itbi?.type ?? 'PERCENT', base: 'bid' },
        transfRegistro: { value: masterDefaults.transfRegistro?.value ?? 1.5, type: masterDefaults.transfRegistro?.type ?? 'PERCENT', base: 'bid' },
        transfCartorio: { value: 0, type: 'BRL' },
        transfAverbacoes: { value: 0, type: 'BRL' },
        transfLaudemio: { value: 0, type: 'BRL' },
        transfForo: { value: 0, type: 'BRL' },

        // Financing
        downPaymentPercent: 100,
        installments: 1,
        interestRate: 0,
        auctionType: 'judicial',
        comparisonData: {
          tesouro: { tir: 11.5, roi: 11.5 },
          cdb: { tir: 12.0, roi: 12.0 },
          poupanca: { tir: 6.5, roi: 6.5 }
        }
      },
      isPublicView: false,
      shareToken: null,
      showInlineEditor: false,
      anonymizeProperty: false,
      analysisId: null,
      isEditingReport: false,
      aiConfig: null,
      manualAuctionType: 'auto',
      auctionUrls: [''],
      sessionId: Math.random().toString(36).substring(7),
      processStory: null,
      processAnalysis: null,
      isGeneratingStory: false,
      isEditingStory: false,
      selectedKeySource: (localStorage.getItem('saved_selected_key_source') || 'system_default') as any,
    };
  });

  useEffect(() => {
    if (token) {
      // Validate token or fetch user info
      setIsLoggedIn(true);
      fetchProperties();
      fetchBrainItems();
      fetchAllAnalyses();
    }
  }, [token]);

  const currentDocs = useMemo(() => aiAnalysisState.selectedPropertyId ? propertyDocs : aiAnalysisState.adHocDocs, [aiAnalysisState.selectedPropertyId, propertyDocs, aiAnalysisState.adHocDocs]);
  const currentDebts = useMemo(() => aiAnalysisState.selectedPropertyId ? propertyDebts : [], [aiAnalysisState.selectedPropertyId, propertyDebts]);

  const fetchAllAnalyses = async () => {
    try {
      const res = await fetch('/api/ai-analyses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await parseJsonResponse(res);
        setAllAnalyses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrainItems = async () => {
    try {
      const res = await fetch('/api/strategic-brain', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await parseJsonResponse(res);
        setBrainItems(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await parseJsonResponse(res);
        setProperties(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const sanitizedLoginForm = {
        username: loginForm.username.trim().toLowerCase(),
        password: loginForm.password
      };
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedLoginForm)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const trimmed = errorText.trim().toLowerCase();
          if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
            throw new Error("Resposta do servidor é HTML");
          }
          const errorData = JSON.parse(errorText);
          setLoginError(errorData.error || 'Erro ao entrar');
        } catch (e) {
          setLoginError('Erro no servidor (Resposta inválida)');
        }
        return;
      }
      
      const data = await parseJsonResponse(res);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Erro de login:", err);
      if (!(err instanceof SessionException)) {
        setLoginError('Erro de conexão: ' + formatErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetch('/api/ai-config', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.ok ? parseJsonResponse(res) : null)
        .then(async data => {
          if (data) {
            const hasKeys = !!(data.gemini_key || data.openai_key || data.claude_key || data.deepseek_key || data.datajud_key);
            if (hasKeys) {
              localStorage.setItem('backup_ai_config', JSON.stringify(data));
              setAiAnalysisState(prev => ({ ...prev, aiConfig: data }));
            } else {
              const savedBackup = localStorage.getItem('backup_ai_config');
              if (savedBackup) {
                try {
                  const parsedBackup = JSON.parse(savedBackup);
                  console.log("Auto-restoring AI config from local browser backup...", parsedBackup);
                  
                  await fetch('/api/ai-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(parsedBackup)
                  });
                  
                  setAiAnalysisState(prev => ({ ...prev, aiConfig: parsedBackup }));
                } catch (backupErr) {
                  console.error("Erro ao restaurar backup local de IA:", backupErr);
                  setAiAnalysisState(prev => ({ ...prev, aiConfig: data }));
                }
              } else {
                setAiAnalysisState(prev => ({ ...prev, aiConfig: data }));
              }
            }
          }
        })
        .catch(err => console.error("Erro ao carregar config inicial:", err));
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (aiAnalysisState.selectedModel) {
      localStorage.setItem('saved_selected_model', aiAnalysisState.selectedModel);
    }
    if (aiAnalysisState.selectedKeySource) {
      localStorage.setItem('saved_selected_key_source', aiAnalysisState.selectedKeySource);
    }
  }, [aiAnalysisState.selectedModel, aiAnalysisState.selectedKeySource]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
  };

  if (loading && !isLoggedIn && window.location.pathname.startsWith('/share/')) {
    return (
      <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-brand-primary rounded-[2.5rem] flex items-center justify-center text-black mb-8 animate-pulse shadow-2xl shadow-brand-primary/20">
          <Gavel size={48} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-brand-primary mb-2">Carregando Relatório</h2>
        <p className="text-brand-ink/40 text-sm animate-pulse">Preparando análise estratégica...</p>
      </div>
    );
  }

  if (!isLoggedIn && !window.location.pathname.startsWith('/share/')) {
    return (
      <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Modern Corner Ambient Glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-brand-secondary to-brand-secondary" />
        <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Floating Top Header Options */}
        <div className="w-full max-w-md flex justify-between items-center mb-6 z-10 px-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-ink/30 font-bold">TJ INVEST</span>
          <button 
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-3 bg-brand-paper/40 backdrop-blur-md border border-brand-primary/10 rounded-xl text-brand-primary hover:bg-brand-primary/15 transition-all flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="text-[9px] font-bold uppercase tracking-wider">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
          </button>
        </div>
        
        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-brand-paper w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-[0_30px_70px_rgba(0,0,0,0.45)] border border-brand-primary/10 relative z-10"
        >
          {/* Logo and Brand Title Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-primary rounded-2xl sm:rounded-3xl flex items-center justify-center text-black mx-auto mb-5 shadow-xl shadow-brand-primary/15 filter drop-shadow-md">
              <Gavel size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-brand-primary">Leilões Pro</h1>
            <p className="text-brand-ink/40 font-semibold mt-2.5 text-xs sm:text-sm uppercase tracking-widest">Sistema Profissional de Análise</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-brand-ink/40 mb-2 ml-1">Usuário</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="Seu usuário"
                  className="w-full bg-brand-bg border border-brand-border/10 focus:border-brand-primary/40 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-5 sm:px-6 focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium text-sm sm:text-base outline-none text-brand-ink"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-brand-ink/40 mb-2 ml-1">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="Sua senha"
                  className="w-full bg-brand-bg border border-brand-border/10 focus:border-brand-primary/40 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-5 sm:px-6 pr-14 sm:pr-16 focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium text-sm sm:text-base outline-none text-brand-ink"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-brand-ink/30 hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message Section */}
            <AnimatePresence mode="wait">
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center rounded-xl"
                >
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-black py-3.5 sm:py-4.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-lg hover:shadow-brand-primary/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Acessar Painel"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex text-brand-ink selection:bg-brand-primary/20">
      {/* Sidebar */}
      {!aiAnalysisState.isPublicView && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
          onLogout={handleLogout}
        />
      )}

      {/* Backdrop overlay for mobile screens when Sidebar is open */}
      {isSidebarOpen && !aiAnalysisState.isPublicView && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden cursor-pointer backdrop-blur-sm transition-all duration-300"
        />
      )}

      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", isSidebarOpen && !aiAnalysisState.isPublicView && "lg:pl-64")}>
        {!aiAnalysisState.isPublicView && (
          <header className="h-24 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-primary/10 flex items-center justify-between px-4 sm:px-10 sticky top-0 z-40">
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-brand-primary/10 rounded-2xl transition-all text-brand-primary">
                {isSidebarOpen ? <Menu size={22} /> : <ChevronRight size={22} />}
              </button>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-3 hover:bg-brand-primary/10 rounded-2xl transition-all text-brand-primary flex items-center gap-3"
              >
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-4 sm:gap-8">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold tracking-tight">{user?.name || 'Administrador'}</p>
                <p className="text-[10px] text-brand-ink/30 uppercase tracking-[0.15em] font-bold">{user?.role || 'Admin'}</p>
              </div>
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-bold text-lg border border-brand-primary/10">
                {user?.name?.[0] || 'A'}
              </div>
              <button
                onClick={handleLogout}
                title="Desconectar"
                className="p-3 hover:bg-red-500/10 hover:text-red-500 text-brand-ink/40 rounded-2xl transition-all flex items-center gap-2 cursor-pointer no-print"
              >
                <LogOut size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Sair</span>
              </button>
            </div>
          </header>
        )}

        <div className="p-4 sm:p-10 w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  properties={properties} 
                  allAnalyses={allAnalyses}
                  brainItems={brainItems} 
                  onSelectProperty={(id) => {
                    setAiAnalysisState(prev => ({ ...prev, selectedPropertyId: id }));
                    setActiveTab('ai-analysis');
                  }}
                  onViewAll={() => setActiveTab('properties')}
                />
              )}
              {activeTab === 'properties' && (
                <PropertiesView 
                  properties={properties} 
                  onRefresh={fetchProperties} 
                  token={token!} 
                  onSelectProperty={(id) => {
                    setAiAnalysisState(prev => ({ ...prev, selectedPropertyId: id }));
                    setActiveTab('ai-analysis');
                  }}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentsView 
                  token={token!} 
                  properties={properties} 
                  onSelectProperty={(id) => {
                    setAiAnalysisState(prev => ({ ...prev, selectedPropertyId: id }));
                    setActiveTab('ai-analysis');
                  }} 
                />
              )}
              {activeTab === 'brain' && <BrainView token={token!} onRefresh={fetchBrainItems} />}
              {activeTab === 'ai-config' && (
                <AIConfigView 
                  token={token!} 
                  aiConfig={aiAnalysisState.aiConfig} 
                  onConfigUpdate={(config) => setAiAnalysisState(prev => ({ ...prev, aiConfig: config }))} 
                />
              )}
              {activeTab === 'ai-analysis' && (
                <AIAnalysisView 
                  token={token!} 
                  properties={properties} 
                  onPropertyCreated={fetchProperties}
                  state={aiAnalysisState}
                  setState={setAiAnalysisState}
                  setIsShareModalOpen={setIsShareModalOpen}
                  propertyDocs={propertyDocs}
                  propertyDebts={currentDebts}
                  setPropertyDocs={setPropertyDocs}
                  setPropertyDebts={setPropertyDebts}
                />
              )}
              {activeTab === 'users' && <UsersView token={token!} />}
              {activeTab === 'settings' && (
                <SettingsView 
                  token={token!} 
                  aiConfig={aiAnalysisState.aiConfig} 
                  onConfigUpdate={(config) => setAiAnalysisState(prev => ({ ...prev, aiConfig: config }))} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-paper w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-brand-primary/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Compartilhar Relatório</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={24} /></button>
            </div>
            
            <div className="space-y-8">
              <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                <p className="text-xs font-medium text-brand-ink/60 leading-relaxed">
                  Este link permite que investidores acessem a análise e a simulação financeira sem precisar de login.
                </p>
              </div>

              <div className="flex items-center justify-between p-6 bg-brand-bg/50 rounded-2xl border border-brand-primary/5">
                <div>
                  <p className="font-bold text-brand-primary">Ocultar Dados do Imóvel</p>
                  <p className="text-[10px] text-brand-ink/40 font-medium">Anonimiza endereço e título para o investidor.</p>
                </div>
                <div 
                  onClick={async () => {
                    const newValue = !aiAnalysisState.anonymizeProperty;
                    updateState({ anonymizeProperty: newValue });
                    if (aiAnalysisState.selectedPropertyId) {
                      await fetch(`/api/properties/${aiAnalysisState.selectedPropertyId}/share`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ is_public: true, anonymize_property: newValue })
                      });
                    }
                  }}
                  className={cn(
                    "w-14 h-7 rounded-full relative cursor-pointer transition-all",
                    aiAnalysisState.anonymizeProperty ? "bg-brand-primary" : "bg-black/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 bg-brand-primary rounded-full shadow-sm transition-all",
                    aiAnalysisState.anonymizeProperty ? "right-1" : "left-1"
                  )} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3">Link de Compartilhamento</label>
                <div className="flex gap-2">
                  <input 
                    readOnly
                    type="text" 
                    className="flex-1 bg-brand-bg border border-brand-primary/10 rounded-xl py-4 px-6 text-xs font-mono text-brand-primary"
                    value={(() => {
                      const customDomain = aiAnalysisState.aiConfig?.custom_domain?.trim();
                      let base = window.location.origin;
                      if (customDomain) {
                        const cleanDomain = customDomain.replace(/^(https?:\/\/)?(www\.)?/, '');
                        base = `https://${cleanDomain}`;
                      }
                      return `${base}/share/${aiAnalysisState.shareToken}`;
                    })()}
                  />
                  <button 
                    onClick={() => {
                      const customDomain = aiAnalysisState.aiConfig?.custom_domain?.trim();
                      let base = window.location.origin;
                      if (customDomain) {
                        const cleanDomain = customDomain.replace(/^(https?:\/\/)?(www\.)?/, '');
                        base = `https://${cleanDomain}`;
                      }
                      const finalUrl = `${base}/share/${aiAnalysisState.shareToken}`;
                      navigator.clipboard.writeText(finalUrl);
                      alert("Link copiado!");
                    }}
                    className="p-4 bg-brand-primary text-black rounded-xl hover:bg-brand-primary/90 transition-all"
                  >
                    <Clipboard size={20} />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-5 bg-brand-primary text-black rounded-2xl font-bold hover:bg-brand-primary/90 transition-all"
              >
                Concluído
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Confirm Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[250] p-4">
          <div className="bg-brand-paper border border-brand-primary/20 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-brand-primary">
              {confirmDialog.title}
            </h3>
            <p className="text-sm font-medium text-brand-ink/70">
              {confirmDialog.message}
            </p>
            <div className="flex gap-4 justify-end col-span-2">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-3 bg-brand-bg hover:bg-brand-ink/5 border border-brand-primary/10 rounded-xl text-xs font-bold uppercase tracking-widest text-brand-ink cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold uppercase tracking-widest text-white cursor-pointer transition-all shadow-lg shadow-red-900/30"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[250] max-w-sm w-full p-4 bg-brand-paper border border-brand-primary/20 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-lg",
            toast.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {toast.type === 'success' ? '✓' : '✗'}
          </div>
          <div className="flex-1 text-xs font-medium text-brand-ink">
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

// Sidebar replaced by ./components/layout/Sidebar.tsx
import { DashboardView } from './components/views/DashboardView';
import { DocumentsView } from './components/views/DocumentsView';
import { DashboardCharts } from './components/DashboardCharts';
import { NewsFeed } from './components/NewsFeed';
import { DocumentManager } from './components/DocumentManager';

// ... (existing imports)


// DashboardView moved to ./components/views/DashboardView.tsx

function PropertiesView({ properties, onRefresh, token, onSelectProperty }: { properties: Property[], onRefresh: () => void, token: string, onSelectProperty: (id: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Apartamento', modality: 'Judicial', address: '', city: '', state: '', valuation_value: 0, min_bid: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsModalOpen(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    const action = async () => {
      try {
        const res = await fetch(`/api/properties/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          onRefresh();
          if ((window as any).customToast) (window as any).customToast("Imóvel excluído com sucesso.");
          else alert("Imóvel excluído com sucesso.");
        } else {
          const errText = await res.text();
          let errData;
          try {
            const trimmed = errText.trim().toLowerCase();
            if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
              throw new Error("Resposta do servidor é HTML");
            }
            errData = JSON.parse(errText);
          } catch (e) {
            errData = { error: errText || res.statusText };
          }
          const msg = `Erro ao excluir imóvel: ${errData.error || errText || res.statusText}`;
          if ((window as any).customToast) (window as any).customToast(msg, 'error');
          else alert(msg);
        }
      } catch (err) {
        console.error(err);
        if ((window as any).customToast) (window as any).customToast("Erro ao excluir imóvel.", 'error');
        else alert("Erro ao excluir imóvel.");
      }
    };

    if ((window as any).customConfirm) {
      (window as any).customConfirm(
        "Excluir Imóvel",
        "Tem certeza que deseja excluir este imóvel e todos os seus dados relacionados? Esta ação não pode ser desfeita.",
        action
      );
    } else {
      if (confirm("Tem certeza que deseja excluir este imóvel e todos os seus dados relacionados? Esta ação não pode ser desfeita.")) {
        action();
      }
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-primary">Gestão de Imóveis</h2>
          <p className="text-brand-ink/40 font-medium text-lg">Gerencie todos os ativos em análise ou arrematados.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-black px-10 py-5 rounded-2xl font-bold flex items-center gap-3 hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20 group"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" /> Novo Imóvel
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-primary/5 text-brand-primary/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                <th className="px-4 md:px-10 py-8">Imóvel</th>
                <th className="px-4 md:px-10 py-8 hidden md:table-cell">Tipo / Modalidade</th>
                <th className="px-4 md:px-10 py-8 hidden sm:table-cell">Localização</th>
                <th className="px-4 md:px-10 py-8">Valores</th>
                <th className="px-4 md:px-10 py-8 hidden lg:table-cell">Status</th>
                <th className="px-4 md:px-10 py-8 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {properties.map(p => (
                <tr key={p.id} className="hover:bg-brand-primary/[0.02] transition-all group">
                  <td className="px-4 md:px-10 py-8">
                    <p className="font-bold text-lg tracking-tight text-brand-ink">{p.title}</p>
                    <p className="text-[10px] text-brand-ink/30 font-bold uppercase tracking-widest mt-1.5">ID: {p.id}</p>
                  </td>
                  <td className="px-4 md:px-10 py-8 hidden md:table-cell">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-base font-medium text-brand-ink/80">{p.type}</span>
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{p.modality}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-10 py-8 hidden sm:table-cell">
                    <p className="text-base font-medium text-brand-ink/70">{p.city}, {p.state}</p>
                  </td>
                  <td className="px-4 md:px-10 py-8">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-brand-ink/40 font-medium">Avaliação: R$ {p.valuation_value?.toLocaleString()}</p>
                      <p className="text-lg font-serif font-bold text-emerald-700">Mínimo: R$ {p.min_bid?.toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="px-4 md:px-10 py-8 hidden lg:table-cell">
                    <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => onSelectProperty(p.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-black transition-all"
                      >
                        <Search size={14} /> <span className="hidden md:inline">Ver Análise</span>
                      </button>
                      <button className="p-3 hover:bg-brand-primary/10 rounded-xl text-brand-ink/30 hover:text-brand-primary transition-all"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteProperty(p.id)} className="p-3 hover:bg-red-500/10 rounded-xl text-brand-ink/30 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {properties.length === 0 && (
          <div className="py-20 text-center text-black/30 font-medium">Nenhum imóvel cadastrado.</div>
        )}
      </div>

      {/* Modal placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-paper w-full max-w-2xl rounded-[2.5rem] p-12 shadow-2xl border border-brand-primary/10"
          >
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold text-brand-primary">Cadastrar Novo Imóvel</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-primary/10 rounded-full text-brand-primary transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Título do Imóvel</label>
                <input type="text" required className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Tipo</label>
                <select className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" value={form.type || ''} onChange={e => setForm({...form, type: e.target.value})}>
                  <option>Apartamento</option>
                  <option>Casa</option>
                  <option>Lote</option>
                  <option>Comercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Modalidade</label>
                <select className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" value={form.modality || ''} onChange={e => setForm({...form, modality: e.target.value})}>
                  <option>Judicial</option>
                  <option>Extrajudicial</option>
                  <option>Venda Direta</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Cidade</label>
                <input type="text" className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Estado</label>
                <input type="text" className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Valor Avaliação</label>
                <input type="number" className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" value={form.valuation_value} onChange={e => setForm({...form, valuation_value: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Lance Mínimo</label>
                <input type="number" className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" value={form.min_bid} onChange={e => setForm({...form, min_bid: Number(e.target.value)})} />
              </div>
              <div className="col-span-2 pt-6">
                <button type="submit" className="w-full bg-brand-primary text-black py-4 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all">Salvar Imóvel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}


function BrainView({ token, onRefresh }: { token: string, onRefresh: () => void }) {
  const [items, setItems] = useState<StrategicBrainItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    category: 'Estratégia', 
    source: '', 
    data: '',
    url: '',
    username: '',
    password: '',
    is_automated: false,
    module: '',
    lesson: ''
  });

  useEffect(() => {
    fetchBrain();
  }, []);

  const fetchBrain = async () => {
    const res = await fetch('/api/strategic-brain', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await parseJsonResponse(res);
      setItems(data);
    }
  };

  const handleStrategicBrainFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, data: reader.result as string, title: file.name });
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setIsReadingFile(false);
      alert("Erro ao ler o arquivo no navegador.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/strategic-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchBrain();
        onRefresh();
        setForm({ 
          title: '', 
          category: 'Leis', 
          source: '', 
          data: '',
          url: '',
          username: '',
          password: '',
          is_automated: false,
          module: '',
          lesson: ''
        });
      } else {
        const errText = await res.text();
        let errData;
        try {
          const trimmed = errText.trim().toLowerCase();
          if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
            throw new Error("Resposta do servidor é HTML");
          }
          errData = JSON.parse(errText);
        } catch (e) {
          errData = { error: errText || res.statusText };
        }
        alert(`Erro ao salvar: ${errData.error || errText || res.statusText}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strategic-brain/${id}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBrain();
      } else {
        const errText = await res.text();
        let errData;
        try {
          const trimmed = errText.trim().toLowerCase();
          if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
            throw new Error("Resposta do servidor é HTML");
          }
          errData = JSON.parse(errText);
        } catch (e) {
          errData = { error: errText || res.statusText };
        }
        alert(errData.error || "Erro ao sincronizar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-brand-primary">Cérebro Estratégico</h2>
          <p className="text-brand-ink/40 font-medium text-base md:text-lg">Sua base de conhecimento proprietária para decisões de investimento.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-black px-6 py-4 md:px-8 md:py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20 w-full md:w-auto shrink-0 font-sans"
        >
          <Plus size={20} /> Adicionar Conhecimento
        </button>
      </div>

      <div className="space-y-12">
        {Object.entries(items.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, any[]>)).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-2xl font-serif font-medium mb-8 text-brand-primary">{category} ({categoryItems.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryItems.map(item => (
                  <div key={item.id} className="relative premium-card p-8 group cursor-pointer bg-brand-paper border-brand-primary/10"
                    onClick={() => { if (item.data) window.open(item.data, '_blank'); }}
                  >
                    <button
                      onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Tem certeza que deseja excluir este documento?')) {
                              await fetch(`/api/strategic-brain/${item.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                              });
                              fetchBrain();
                          }
                      }}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2 z-20"
                    >
                      <Trash2 size={18} />
                    </button>
                  <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary mb-8 group-hover:bg-brand-primary group-hover:text-black transition-all duration-500">
                    {item.category === 'Links Relevantes' ? <Globe size={28} /> : 
                     item.category === 'Planilhas' ? <Database size={28} /> :
                     item.category === 'Leis' ? <Scale size={28} /> :
                     item.data ? <FileDown size={28} /> : <FileText size={28} />}
                  </div>
                  <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[10px] font-bold uppercase tracking-widest mb-5 inline-block">
                    {item.category} {item.data && '• 📎 Anexo'}
                  </span>
                  {item.is_automated && (
                    <span className="ml-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-5 inline-block">
                      Auto-Sync
                    </span>
                  )}
                  <h4 className="text-xl font-serif font-bold mb-3 group-hover:text-brand-primary transition-colors">{item.title}</h4>
                  {item.category === 'Cursos' && (item.module || item.lesson) && (
                    <p className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest mb-2">
                      {item.module} {item.lesson ? `• ${item.lesson}` : ''}
                    </p>
                  )}
                  <p className="text-sm text-brand-ink/40 line-clamp-3 leading-relaxed">{item.source || (item.url ? item.url : 'Documento indexado para análise estratégica.')}</p>
                  {item.is_automated && (
                    <div className="mt-6 pt-6 border-t border-brand-primary/5 flex items-center justify-between">
                      <span className="text-[10px] text-brand-ink/30 font-bold uppercase tracking-widest">
                        Último Sync: {item.last_sync ? new Date(item.last_sync).toLocaleDateString() : 'Nunca'}
                      </span>
                      <button 
                        onClick={() => handleSync(item.id)}
                        disabled={loading}
                        className={cn("text-brand-primary hover:scale-110 transition-transform", loading && "animate-spin")}
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-brand-primary/10 rounded-[40px]">
            <Brain size={48} className="mx-auto text-brand-primary/20 mb-6" />
            <p className="text-brand-ink/20 font-serif italic text-xl">Sua base de conhecimento está vazia.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-paper w-full max-w-2xl rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 md:p-12 shadow-2xl border border-brand-primary/10 my-auto"
          >
            <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-10">
              <h3 className="text-2xl sm:text-3xl font-serif font-medium text-brand-primary">Novo Conhecimento</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 sm:p-3 hover:bg-brand-primary/10 rounded-full text-brand-primary transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">Título</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">Categoria</label>
                  <select 
                    className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none appearance-none"
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                  >
                    <option>Leis</option>
                    <option>Cursos</option>
                    <option>Planilhas</option>
                    <option>Documentos</option>
                    <option>Jurisprudência</option>
                    <option>Links Relevantes</option>
                    <option>Estratégia</option>
                  </select>
                </div>
                {form.category === 'Cursos' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">Módulo</label>
                      <input type="text" className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none" value={form.module} onChange={e => setForm({...form, module: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">Aula</label>
                      <input type="text" className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none" value={form.lesson} onChange={e => setForm({...form, lesson: e.target.value})} />
                    </div>
                  </>
                )}
              </div>

              {form.category === 'Links Relevantes' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">URL do Site</label>
                  <input 
                    type="url" 
                    placeholder="https://exemplo.com.br"
                    className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none"
                    value={form.url}
                    onChange={e => setForm({...form, url: e.target.value})}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 p-4 sm:p-5 md:p-6 bg-brand-bg rounded-xl sm:rounded-2xl border border-brand-primary/10">
                <div 
                  onClick={() => setForm({...form, is_automated: !form.is_automated})}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer shrink-0 transition-all",
                    form.is_automated ? "bg-brand-primary" : "bg-brand-ink/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    form.is_automated ? "left-7" : "left-1"
                  )} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-widest">Sincronização Automática</p>
                  <p className="text-[9px] sm:text-[10px] text-brand-ink/40">Ative para ler sites, aulas e arquivos automaticamente.</p>
                </div>
              </div>

              {form.is_automated ? (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">URL do Site / Área de Membros</label>
                    <input 
                      type="url" 
                      placeholder="https://exemplo.com/login"
                      className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none"
                      value={form.url}
                      onChange={e => setForm({...form, url: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">Usuário / Email</label>
                      <input 
                        type="text" 
                        className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none"
                        value={form.username}
                        onChange={e => setForm({...form, username: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">Senha</label>
                      <input 
                        type="password" 
                        className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-1.5 sm:mb-2 ml-1">Fonte / Origem</label>
                    <input 
                      type="text" 
                      className="w-full bg-brand-bg border border-brand-primary/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 md:py-5 md:px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm sm:text-base md:text-lg text-brand-ink outline-none"
                      value={form.source}
                      onChange={e => setForm({...form, source: e.target.value})}
                    />
                  </div>

                  <div className="border-2 border-dashed border-brand-primary/15 rounded-xl sm:rounded-3xl p-6 sm:p-10 md:p-12 text-center hover:bg-brand-primary/5 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      onChange={handleStrategicBrainFileUpload}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isReadingFile}
                    />
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-primary mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                      {isReadingFile ? <Loader2 className="animate-spin" size={28} /> : <Download size={28} />}
                    </div>
                    <p className="text-base sm:text-lg md:text-xl font-serif font-medium mb-1.5 sm:mb-2 max-w-full truncate px-4">
                      {isReadingFile ? (
                        <span className="text-brand-primary">Lendo e otimizando arquivo...</span>
                      ) : form.data ? (
                        form.title
                      ) : (
                        'Arraste ou clique para upload'
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-brand-ink/30">PDF, DOC, TXT ou Imagens (Máx 50MB)</p>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-4 sm:pt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:flex-1 py-3 sm:py-4 md:py-5 border border-brand-primary/10 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-brand-primary/5 transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading || isReadingFile}
                  className="w-full sm:flex-1 py-3 sm:py-4 md:py-5 bg-brand-primary text-black rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-2 sm:gap-3 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Processando e Indexando...</span>
                    </>
                  ) : "Salvar Conhecimento"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AIConfigView({ token, aiConfig, onConfigUpdate }: { token: string, aiConfig: AIConfig | null, onConfigUpdate: (config: AIConfig) => void }) {
  const [localConfig, setLocalConfig] = useState<AIConfig>(aiConfig || {
    primary_ia: 'Gemini',
    secondary_ia: '',
    gemini_key: '',
    openai_key: '',
    claude_key: '',
    deepseek_key: '',
    datajud_key: '',
    custom_domain: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aiConfig) {
      setLocalConfig(aiConfig);
    } else {
      fetch('/api/ai-config', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(async res => {
          if (!res.ok) throw new Error("Erro ao carregar configurações");
          return await parseJsonResponse(res);
        })
        .then(data => {
          setLocalConfig(data);
          onConfigUpdate(data);
        })
        .catch(err => console.error(err));
    }
  }, [aiConfig, token]);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const handleTestKey = async (provider: 'gemini' | 'openai' | 'claude' | 'deepseek', rawKey: string) => {
    if (!rawKey) {
      setTestResult({ success: false, message: "Por favor, insira uma chave antes de testar." });
      return;
    }

    let keyToTest = rawKey.trim();

    // Handle AI Studio's display format "Label • Key" if the user accidentally copied it
    if (keyToTest.includes(' • ')) {
      keyToTest = keyToTest.split(' • ')[1].trim();
    }

    if (provider === 'gemini' && !keyToTest.startsWith('AIza')) {
      setTestResult({ success: false, message: "A chave parece inválida. Uma chave Gemini válida deve começar com 'AIza'." });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${keyToTest}`);
        const data = await parseJsonResponse(response);
        if (!response.ok) throw new Error(data.error?.message || "Erro ao validar chave Gemini");
        setTestResult({ success: true, message: "Conexão Gemini estabelecida com sucesso!" });
      } else if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${keyToTest}` }
        });
        const data = await parseJsonResponse(response);
        if (!response.ok) throw new Error(data.error?.message || "Erro ao validar chave OpenAI");
        setTestResult({ success: true, message: "Conexão OpenAI estabelecida com sucesso!" });
      } else if (provider === 'claude') {
        if (!keyToTest.startsWith('sk-ant-')) throw new Error("Chave Claude inválida. Deve começar com 'sk-ant-'");
        setTestResult({ success: true, message: "Formato de chave Claude parece correto (sk-ant-...)" });
      } else if (provider === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/models', {
          headers: { 'Authorization': `Bearer ${keyToTest}` }
        });
        const data = await parseJsonResponse(response);
        if (!response.ok) throw new Error(data.error?.message || "Erro ao validar chave DeepSeek");
        setTestResult({ success: true, message: "Conexão DeepSeek estabelecida com sucesso!" });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Erro: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let geminiKey = localConfig.gemini_key?.trim();
    
    // Handle AI Studio's display format "Label • Key"
    if (geminiKey && geminiKey.includes(' • ')) {
      geminiKey = geminiKey.split(' • ')[1].trim();
    }

    const trimmedConfig = {
      ...localConfig,
      gemini_key: geminiKey,
      openai_key: localConfig.openai_key?.trim(),
      claude_key: localConfig.claude_key?.trim(),
      deepseek_key: localConfig.deepseek_key?.trim(),
      datajud_key: localConfig.datajud_key?.trim(),
      custom_domain: localConfig.custom_domain?.trim()
    };
    try {
      await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(trimmedConfig)
      });
      setLocalConfig(trimmedConfig);
      onConfigUpdate(trimmedConfig);
      setTestResult({ success: true, message: "Configurações salvas com sucesso!" });
    } catch (err) {
      setTestResult({ success: false, message: "Erro ao salvar configurações." });
    } finally {
      setSaving(false);
    }
  };

  const [restoring, setRestoring] = useState(false);

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Falha ao gerar o arquivo de backup");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leiloes_pro_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      if ((window as any).customToast) {
        (window as any).customToast("Backup baixado com sucesso!", "success");
      } else {
        alert("Backup baixado com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao realizar backup: " + err.message);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Atenção: Ao restaurar este backup, TODOS os dados atuais de imóveis, documentos e relatórios serão SUBSTITUÍDOS. Esta ação não pode ser desfeita. Deseja continuar?")) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    const formData = new FormData();
    formData.append('backup_file', file);

    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Erro desconhecido ao restaurar o banco de dados.");
      }

      if ((window as any).customToast) {
        (window as any).customToast("Banco de dados restaurado com sucesso!", "success");
      } else {
        alert("Banco de dados restaurado com sucesso!");
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert("Falha ao restaurar banco de dados: " + err.message);
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-6 mb-16">
        <div className="w-24 h-24 bg-brand-primary rounded-[2.5rem] flex items-center justify-center text-black mx-auto shadow-2xl shadow-brand-primary/20">
          <Database size={48} />
        </div>
        <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-primary">Configuração de IA</h2>
        <p className="text-brand-ink/40 max-w-lg mx-auto text-lg">Configure os motores de inteligência artificial que alimentarão suas análises.</p>
      </div>

      {window.location.hostname.includes('run.app') && (
        <div className="bg-brand-primary/5 border border-brand-primary/20 p-8 rounded-[2rem] space-y-4">
          <div className="flex items-center gap-3 text-brand-primary">
            <Info size={20} />
            <h4 className="font-bold uppercase tracking-widest text-xs">Diagnóstico de Erro 403</h4>
          </div>
          <p className="text-sm text-brand-ink/60 leading-relaxed">
            Vimos que sua chave não tem restrições de site (conforme seu print). Isso confirma que o problema é a <strong>API Desativada</strong>.
          </p>
          <div className="p-6 bg-brand-paper rounded-2xl border border-brand-primary/10 space-y-4">
            <p className="text-sm font-bold text-brand-primary">Passo Final para Corrigir:</p>
            <p className="text-xs text-brand-ink/60">
              Clique no link abaixo e verifique se o botão azul diz <strong>"ATIVAR"</strong>. Se disser, clique nele.
            </p>
            <a 
              href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" 
              target="_blank"
              className="inline-flex items-center gap-2 bg-brand-primary text-black px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all"
            >
              Ativar Generative Language API <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      <div className="premium-card p-6 sm:p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-4 ml-1">IA Principal</label>
            <select 
              className="w-full bg-brand-bg border-none rounded-2xl py-5 px-8 focus:ring-2 focus:ring-brand-primary font-bold text-brand-primary text-sm md:text-lg"
              value={localConfig.primary_ia || ''}
              onChange={e => setLocalConfig({...localConfig, primary_ia: e.target.value})}
            >
              <option>Gemini</option>
              <option>ChatGPT</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-4 ml-1">IA Secundária (Fallback)</label>
            <select 
              className="w-full bg-brand-bg border-none rounded-2xl py-5 px-8 focus:ring-2 focus:ring-brand-primary font-bold text-brand-primary text-sm md:text-lg"
              value={localConfig.secondary_ia || ''}
              onChange={e => setLocalConfig({...localConfig, secondary_ia: e.target.value})}
            >
              <option value="">Nenhuma</option>
              <option>Gemini</option>
              <option>ChatGPT</option>
            </select>
          </div>
        </div>

        <div className="space-y-8 pt-10 border-t border-brand-primary/5">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <AIKeyInput label="Chave de API do Gemini" value={localConfig.gemini_key} onChange={val => setLocalConfig({...localConfig, gemini_key: val})} />
            </div>
            <button 
              onClick={() => handleTestKey('gemini', localConfig.gemini_key)}
              disabled={testing}
              className="mb-1 bg-brand-bg border border-brand-primary/20 text-brand-primary px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/5 transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 className="animate-spin" size={16} /> : "Testar"}
            </button>
          </div>
          
          {testResult && (
            <div className={cn(
              "p-4 rounded-xl text-xs font-bold flex items-center gap-3",
              testResult.success ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}>
              {testResult.success ? <Check size={16} /> : <AlertTriangle size={16} />}
              {testResult.message}
            </div>
          )}

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <AIKeyInput label="Chave de API da OpenAI (ChatGPT)" value={localConfig.openai_key} onChange={val => setLocalConfig({...localConfig, openai_key: val})} />
            </div>
            <button 
              onClick={() => handleTestKey('openai', localConfig.openai_key)}
              disabled={testing}
              className="mb-1 bg-brand-bg border border-brand-primary/20 text-brand-primary px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/5 transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 className="animate-spin" size={16} /> : "Testar"}
            </button>
          </div>

          <AIKeyInput label="Chave de API DataJud (CNJ)" value={localConfig.datajud_key || ''} onChange={val => setLocalConfig({...localConfig, datajud_key: val})} />
          
          <div className="pt-6 border-t border-brand-primary/5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-3 ml-1">Domínio Customizado para Compartilhamento (Opcional)</label>
            <input 
              type="text"
              placeholder="Ex: jud.tjinvest.com.br"
              className="w-full bg-brand-bg border-none rounded-2xl py-5 px-8 focus:ring-2 focus:ring-brand-primary transition-all font-medium text-lg"
              value={localConfig.custom_domain || ''}
              onChange={e => setLocalConfig({...localConfig, custom_domain: e.target.value})}
            />
            <p className="text-[11px] text-brand-ink/40 mt-2 ml-1">
              Insira o seu domínio customizado para garantir que os links gerados ao compartilhar relatórios utilizem o endereço correto (ex: <code>jud.tjinvest.com.br/share/xxx</code>).
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-brand-primary text-black py-6 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            Salvar Configurações de IA
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Isso removerá todas as suas chaves customizadas e usará o padrão do sistema. Continuar?")) {
                const defaultConfig = {
                  primary_ia: 'Gemini',
                  secondary_ia: '',
                  gemini_key: '',
                  openai_key: '',
                  claude_key: '',
                  deepseek_key: '',
                  datajud_key: '',
                  custom_domain: ''
                };
                setLocalConfig(defaultConfig);
                onConfigUpdate(defaultConfig);
                handleSave();
              }
            }}
            className="px-8 bg-brand-paper border border-red-500/20 text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all"
          >
            Resetar para Padrão
          </button>
        </div>
      </div>

      {/* CARD DE BACKUP E RESTAURAÇÃO */}
      <div className="premium-card p-6 sm:p-12 space-y-8 mt-12">
        <div>
          <h3 className="text-xl font-serif font-bold text-brand-primary flex items-center gap-3">
            <Database size={20} />
            Backup e Restauração de Dados
          </h3>
          <p className="text-brand-ink/40 text-[11px] mt-2 leading-relaxed">
            Seus arquivos, imóveis cadastrados e análises são armazenados localmente. Use esta ferramenta para fazer backups manuais periódicos ou recuperar seus dados em caso de alterações no ambiente de hospedagem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-primary/5">
          {/* Fazer Backup */}
          <div className="bg-brand-bg/45 p-6 rounded-2xl border border-brand-primary/5 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="font-bold text-brand-primary text-xs uppercase tracking-wider mb-2">Exportar Banco de Dados</h4>
              <p className="text-brand-ink/50 text-[10px] leading-relaxed">
                Baixe o arquivo de banco de dados <code>.db</code> completo contendo todo o histórico de imóveis, documentos processados, cérebro estratégico e chaves.
              </p>
            </div>
            <button
              onClick={handleBackup}
              className="w-full bg-brand-bg border border-brand-primary/25 hover:border-brand-primary/50 text-brand-primary py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Fazer Download do Backup
            </button>
          </div>

          {/* Restaurar Backup */}
          <div className="bg-brand-bg/45 p-6 rounded-2xl border border-brand-primary/5 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="font-bold text-brand-primary text-xs uppercase tracking-wider mb-2">Importar Banco de Dados</h4>
              <p className="text-brand-ink/50 text-[10px] leading-relaxed">
                Suba um arquivo de backup do sistema (<code>leiloes_pro_backup.db</code>) para restaurar instantaneamente todo o seu painel de leilões ao estado anterior.
              </p>
            </div>
            <label className={cn(
              "w-full bg-brand-primary text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-brand-primary/10",
              restoring ? "opacity-50 cursor-not-allowed" : ""
            )}>
              {restoring ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Restaurando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Enviar arquivo de Backup
                </>
              )}
              <input
                type="file"
                accept=".db"
                disabled={restoring}
                onChange={handleRestore}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("premium-card p-10", className)}>
      <h3 className="text-2xl font-serif font-medium text-brand-primary mb-10">{title}</h3>
      {children}
    </div>
  );
}

function DataJudField({ label, value }: { label: string, value: string }) {
  return (
    <div className="group">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-2 group-hover:text-brand-primary transition-colors">{label}</p>
      <p className="font-serif text-xl font-bold text-brand-primary">{value}</p>
    </div>
  );
}

function SimulationEditor() {
  const { simulationData, updateState } = React.useContext(SimulationContext);
  if (!simulationData) return null;

  const getVal = (field: any) => {
    if (!field || !field.type) return 0;
    if (field.type === 'BRL') return field.value;
    // All percentages (ITBI, Commission, Assessoria) are calculated over the Arrematação (bid)
    return (simulationData.bid?.value || 0) * ((field.value || 0) / 100);
  };

  const totalInvestment = 
    (simulationData.bid?.value || 0) + 
    getVal(simulationData.desocupacaoAcordo) + 
    getVal(simulationData.transfRegistro) + 
    getVal(simulationData.reforma) + 
    getVal(simulationData.comissaoLeiloeiro) + 
    getVal(simulationData.transfITBI) +
    getVal(simulationData.assessoria) +
    getVal(simulationData.entrada) +
    getVal(simulationData.desocupacaoHonorarios) +
    getVal(simulationData.despesasVenda) +
    getVal(simulationData.holdingCosts);

  const finalTotal = totalInvestment;
  const initialCash = 
    getVal(simulationData.entrada) + 
    getVal(simulationData.desocupacaoAcordo) + 
    getVal(simulationData.transfRegistro) + 
    getVal(simulationData.reforma) + 
    getVal(simulationData.comissaoLeiloeiro) + 
    getVal(simulationData.transfITBI) +
    getVal(simulationData.assessoria) +
    getVal(simulationData.desocupacaoHonorarios) +
    getVal(simulationData.despesasVenda) +
    getVal(simulationData.holdingCosts);

  const grossProfit = (simulationData.saleValue?.value || 0) - finalTotal;
  const roi = finalTotal > 0 ? (grossProfit / finalTotal) * 100 : 0;

  const handleUpdateField = React.useCallback((key: string, field: string, value: any) => {
    updateState((prev: any) => {
      const newData = {
        ...prev.simulationData,
        [key]: {
          ...(prev.simulationData[key] || {}),
          [field]: value
        }
      };

      // If updating IPTU or Condo, update the total debts
      if (key === 'debtsIPTU' || key === 'debtsCondo') {
        const iptu = key === 'debtsIPTU' ? value : (newData.debtsIPTU?.value || 0);
        const condo = key === 'debtsCondo' ? value : (newData.debtsCondo?.value || 0);
        newData.desocupacaoAcordo = {
          ...newData.desocupacaoAcordo,
          value: iptu + condo
        };
      }

      return { simulationData: newData };
    });
  }, [updateState]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SimulationInput 
          label="Valor de Avaliação" 
          value={simulationData.valuation?.value || 0} 
          type={simulationData.valuation?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('valuation', 'type', t)}
          onChange={v => handleUpdateField('valuation', 'value', v)} 
        />
        <SimulationInput 
          label="Valor da Arrematação" 
          value={simulationData.bid?.value || 0} 
          type={simulationData.bid?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('bid', 'type', t)}
          onChange={v => handleUpdateField('bid', 'value', v)} 
        />
        <SimulationInput 
          label="Débitos (Total)" 
          value={simulationData.desocupacaoAcordo?.value || 0} 
          type={simulationData.desocupacaoAcordo?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('desocupacaoAcordo', 'type', t)}
          onChange={v => handleUpdateField('desocupacaoAcordo', 'value', v)} 
        />
        <div className="grid grid-cols-2 gap-4 md:col-span-2 bg-brand-bg/20 p-6 rounded-3xl border border-brand-primary/5">
          <SimulationInput 
            label="IPTU Acumulado" 
            value={simulationData.debtsIPTU?.value || 0} 
            type={simulationData.debtsIPTU?.type || 'BRL'}
            onTypeChange={t => handleUpdateField('debtsIPTU', 'type', t)}
            onChange={v => handleUpdateField('debtsIPTU', 'value', v)} 
          />
          <SimulationInput 
            label="Condomínio" 
            value={simulationData.debtsCondo?.value || 0} 
            type={simulationData.debtsCondo?.type || 'BRL'}
            onTypeChange={t => handleUpdateField('debtsCondo', 'type', t)}
            onChange={v => handleUpdateField('debtsCondo', 'value', v)} 
          />
        </div>
        <SimulationInput 
          label="Custos Registro" 
          value={simulationData.transfRegistro?.value || 0} 
          type={simulationData.transfRegistro?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('transfRegistro', 'type', t)}
          onChange={v => handleUpdateField('transfRegistro', 'value', v)} 
        />
        <SimulationInput 
          label="Custos Jurídicos / Advogado" 
          value={simulationData.desocupacaoHonorarios?.value || 0} 
          type={simulationData.desocupacaoHonorarios?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('desocupacaoHonorarios', 'type', t)}
          onChange={v => handleUpdateField('desocupacaoHonorarios', 'value', v)} 
        />
        <SimulationInput 
          label="Reforma/Desocupação" 
          value={simulationData.reforma?.value || 0} 
          type={simulationData.reforma?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('reforma', 'type', t)}
          onChange={v => handleUpdateField('reforma', 'value', v)} 
        />
        <SimulationInput 
          label="Condomínio/IPTU (Desocupação)" 
          value={simulationData.holdingCosts?.value || 0} 
          type={simulationData.holdingCosts?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('holdingCosts', 'type', t)}
          onChange={v => handleUpdateField('holdingCosts', 'value', v)} 
        />
        <SimulationInput 
          label="Valor de Venda Estimado" 
          value={simulationData.saleValue?.value || 0} 
          type={simulationData.saleValue?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('saleValue', 'type', t)}
          onChange={v => handleUpdateField('saleValue', 'value', v)} 
        />
        <SimulationInput 
          label="Assessoria TJ INVEST" 
          value={simulationData.assessoria?.value || 0} 
          type={simulationData.assessoria?.type || 'PERCENT'}
          onTypeChange={t => handleUpdateField('assessoria', 'type', t)}
          onChange={v => handleUpdateField('assessoria', 'value', v)} 
        />
        <SimulationInput 
          label="Entrada TJ INVEST" 
          value={simulationData.entrada?.value || 0} 
          type={simulationData.entrada?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('entrada', 'type', t)}
          onChange={v => handleUpdateField('entrada', 'value', v)} 
        />
        <SimulationInput 
          label="Outras Taxas / Extras" 
          value={simulationData.despesasVenda?.value || 0} 
          type={simulationData.despesasVenda?.type || 'BRL'}
          onTypeChange={t => handleUpdateField('despesasVenda', 'type', t)}
          onChange={v => handleUpdateField('despesasVenda', 'value', v)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-brand-primary/5 rounded-[32px] border border-brand-primary/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Custo Total de Aquisição</p>
          <p className="text-3xl font-serif font-bold text-brand-primary">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
          </p>
          <p className="text-[10px] text-brand-ink/30 mt-2 italic">Lance + Todas as taxas e custos</p>
        </div>
        <div className="p-8 bg-brand-primary/5 rounded-[32px] border border-brand-primary/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Aporte Inicial (Cash)</p>
          <p className="text-3xl font-serif font-bold text-brand-primary">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialCash)}
          </p>
          <p className="text-[10px] text-brand-ink/30 mt-2 italic">Entrada + Taxas e Reformas</p>
        </div>
        <div className="p-8 bg-emerald-500/10 rounded-[32px] border border-emerald-500/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Lucro Líquido Estimado</p>
          <p className="text-3xl font-serif font-bold text-emerald-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossProfit)}
          </p>
          <p className="text-[10px] font-bold text-emerald-600/60 mt-2 tracking-widest uppercase">ROI: {roi.toFixed(1)}%</p>
        </div>
      </div>

      <div className="p-8 bg-[#5A5A40]/5 rounded-[2rem] border border-[#5A5A40]/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Custo Total</p>
            <p className="text-2xl font-serif font-bold text-brand-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
            </p>
          </div>
          <div className="text-center border-x border-brand-primary/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Aporte Inicial</p>
            <p className="text-2xl font-serif font-bold text-brand-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialCash)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-2">ROI Estimado</p>
            <p className="text-2xl font-serif font-bold text-emerald-600">
              {roi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 bg-[#5A5A40]/5 rounded-[2rem] border border-[#5A5A40]/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3 block">Comissão Leiloeiro (%)</label>
            <input 
              type="range" min="0" max="10" step="0.5"
              value={simulationData.commission?.value || 0}
              onChange={e => updateState({ simulationData: { ...simulationData, commission: { ...(simulationData.commission || {}), value: parseFloat(e.target.value) } } })}
              className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-[#5A5A40]">
              <span>0%</span>
              <span>{(simulationData.commission?.value || 0).toLocaleString('pt-BR')}%</span>
              <span>10%</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3 block">ITBI (%)</label>
            <input 
              type="range" min="0" max="5" step="0.1"
              value={simulationData.itbi?.value || 0}
              onChange={e => updateState({ simulationData: { ...simulationData, itbi: { ...(simulationData.itbi || {}), value: parseFloat(e.target.value) } } })}
              className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-[#5A5A40]">
              <span>0%</span>
              <span>{(simulationData.itbi?.value || 0).toLocaleString('pt-BR')}%</span>
              <span>5%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#5A5A40] text-white p-10 rounded-[2.5rem] shadow-xl shadow-[#5A5A40]/20 space-y-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Investimento Total</p>
          <p className="text-4xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
          </p>
        </div>

        <div className="space-y-4 pt-8 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium opacity-60">Lucro Bruto Estimado</span>
            <span className="font-bold text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium opacity-60">ROI (%)</span>
            <span className="text-2xl font-bold">
              {roi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </span>
          </div>
        </div>

        <div className="pt-4">
          <div className={cn(
            "py-3 px-4 rounded-xl text-center text-[10px] font-bold uppercase tracking-widest",
            roi > 30 
              ? "bg-emerald-500/20 text-emerald-400" 
              : "bg-amber-500/20 text-amber-400"
          )}>
            {roi > 30 
              ? "Alta Viabilidade" 
              : "Viabilidade Moderada"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulationInput({ 
  label, 
  value, 
  type, 
  onChange, 
  onTypeChange,
  base,
  onBaseChange,
  showBase = false
}: { 
  label: string, 
  value: number, 
  type: 'BRL' | 'PERCENT',
  onChange: (v: number) => void,
  onTypeChange: (t: 'BRL' | 'PERCENT') => void,
  base?: string,
  onBaseChange?: (b: string) => void,
  showBase?: boolean
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [localValue, setLocalValue] = React.useState('');

  // Sync local value with prop when not focused
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));
    }
  }, [value, type, isFocused]);

  const parseNumeric = (val: string): number => {
    const cleanVal = val.replace(/[^\d,.]/g, '');
    if (cleanVal.includes(',')) {
      return parseFloat(cleanVal.replace(/\./g, '').replace(',', '.')) || 0;
    } else if (cleanVal.includes('.')) {
      const parts = cleanVal.split('.');
      if (parts[parts.length - 1].length === 3 && parts.length > 1) {
        return parseFloat(cleanVal.replace(/\./g, '')) || 0;
      } else {
        return parseFloat(cleanVal) || 0;
      }
    }
    return parseFloat(cleanVal) || 0;
  };

  // Debounced update to parent state
  React.useEffect(() => {
    if (!isFocused) return;

    const timer = setTimeout(() => {
      const numeric = parseNumeric(localValue);
      if (numeric !== value) {
        onChange(numeric);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, isFocused, onChange, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numeric = parseNumeric(localValue);
    if (numeric !== value) {
      onChange(numeric);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-wider">{label}</label>
        <div className="flex gap-1 bg-brand-bg p-0.5 rounded-lg border border-brand-border">
          <button 
            onClick={() => onTypeChange('BRL')}
            className={cn("px-2 py-0.5 text-[8px] font-bold rounded-md transition-all", type === 'BRL' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-ink")}
          >$</button>
          <button 
            onClick={() => onTypeChange('PERCENT')}
            className={cn("px-2 py-0.5 text-[8px] font-bold rounded-md transition-all", type === 'PERCENT' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-ink")}
          >%</button>
        </div>
      </div>
      <div className="relative group">
        <input
          type="text"
          value={localValue}
          onFocus={() => { setIsFocused(true); setLocalValue(value.toString().replace('.', ',')); }}
          onBlur={handleBlur}
          onChange={handleInputChange}
          className="w-full bg-white border border-brand-border rounded-xl px-4 py-2 text-sm font-medium text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-right"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-ink/20">
          {type === 'BRL' ? 'R$' : '%'}
        </div>
      </div>
    </div>
  );
}

const GLOSSARY: Record<string, string> = {
  'Edital': 'Documento oficial que contém todas as regras, condições e prazos do leilão.',
  'Matrícula': 'Documento que registra todo o histórico de um imóvel, incluindo proprietários e ônus.',
  'Ônus': 'Encargos, dívidas ou restrições que recaem sobre o imóvel (ex: hipoteca, penhora).',
  'Arrematação': 'Ato de comprar o bem em leilão pelo maior lance.',
  'Comitente': 'Pessoa ou empresa que coloca o bem à venda no leilão.',
  'Lance': 'Oferta de valor feita por um participante para adquirir o bem.',
  'DataJud': 'Plataforma do CNJ que centraliza dados processuais de todos os tribunais do Brasil.',
  'Citação': 'Ato pelo qual se dá ciência ao réu de que contra ele corre uma ação judicial.',
  'Penhora': 'Apreensão judicial de bens do devedor para garantir o pagamento da dívida.',
  'Imissão na Posse': 'Ato judicial que transfere a posse efetiva do imóvel ao arrematante.',
  'Agravo de Instrumento': 'Recurso contra decisões urgentes tomadas pelo juiz durante o processo.',
  'Embargos à Arrematação': 'Ação judicial para contestar a validade do leilão após a compra.',
  'Carta de Arrematação': 'Documento oficial que serve como título de propriedade para registrar o imóvel no cartório.',
  'Auto de Arrematação': 'Documento assinado logo após o leilão que formaliza quem comprou o bem.',
  'Propter Rem': 'Dívidas que acompanham o imóvel, independentemente de quem seja o dono (ex: IPTU e Condomínio).',
  'Evicção': 'Perda do bem por uma decisão judicial que reconhece o direito de um terceiro anterior à compra.'
};

const FINANCIAL_TERMS: Record<string, string> = {
  'ROI': 'Retorno sobre o Investimento',
  'Custo Total': 'Soma de todos os gastos envolvidos na arrematação',
  'Lucro Líquido': 'Diferença entre o valor de venda e o custo total',
  'TIR': 'Taxa Interna de Retorno',
  'Lance': 'Valor da oferta',
  'IPTU': 'Imposto Predial e Territorial Urbano',
  'Condomínio': 'Despesa mensal de condomínio'
};

function CompactSimulationInput({ 
  label, 
  value, 
  type, 
  onChange, 
  onTypeChange,
  highlight = false,
  base,
  onBaseChange,
  showBase = false
}: { 
  label?: string, 
  value: number, 
  type: 'BRL' | 'PERCENT' | 'NUMBER',
  onChange: (v: number) => void,
  onTypeChange?: (t: 'BRL' | 'PERCENT' | 'NUMBER') => void,
  highlight?: boolean,
  base?: string,
  onBaseChange?: (b: string) => void,
  showBase?: boolean
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [localValue, setLocalValue] = React.useState('');
  const [isHighlighted, setIsHighlighted] = React.useState(false);

  React.useEffect(() => {
    const highlightField = localStorage.getItem('highlightField');
    if (highlightField && label === highlightField) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
        localStorage.removeItem('highlightField');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [label]);

  const parseNumeric = (val: string): number => {
    const cleanVal = val.replace(/[^\d,.]/g, '');
    if (cleanVal.includes(',')) {
      return parseFloat(cleanVal.replace(/\./g, '').replace(',', '.')) || 0;
    } else if (cleanVal.includes('.')) {
      const parts = cleanVal.split('.');
      if (parts[parts.length - 1].length === 3 && parts.length > 1) {
        return parseFloat(cleanVal.replace(/\./g, '')) || 0;
      } else {
        return parseFloat(cleanVal) || 0;
      }
    }
    return parseFloat(cleanVal) || 0;
  };

  // Sync local value with prop when not focused
  React.useEffect(() => {
    if (!isFocused) {
      if (type === 'NUMBER') {
        setLocalValue(value.toString());
      } else {
        setLocalValue(value.toLocaleString('pt-BR', { 
          minimumFractionDigits: type === 'PERCENT' ? 1 : 2,
          maximumFractionDigits: type === 'PERCENT' ? 1 : 2
        }));
      }
    }
  }, [value, type, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numeric = parseNumeric(localValue);
    if (numeric !== value) {
      onChange(numeric);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-brand-bg/10 hover:bg-brand-bg/30 transition-all border border-brand-primary/5 hover:border-brand-primary/20">
      <div className="flex flex-col gap-2 group/input">
        <label className="text-[10px] font-bold text-brand-ink/65 uppercase tracking-wider block">{label}</label>
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex bg-brand-bg/50 rounded-lg p-0.5 border border-brand-primary/5 shrink-0">
            <button 
              type="button"
              onClick={() => onTypeChange?.('BRL')}
              className={cn(
                "px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded transition-all",
                type === 'BRL' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/30 hover:text-brand-primary"
              )}
            >
              R$
            </button>
            <button 
              type="button"
              onClick={() => onTypeChange?.('PERCENT')}
              className={cn(
                "px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded transition-all",
                type === 'PERCENT' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/30 hover:text-brand-primary"
              )}
            >
              %
            </button>
          </div>
          <div className="relative flex-1 group/field">
            {type === 'BRL' && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-brand-ink/30">R$</span>}
            <input 
              type="text" 
              value={localValue} 
              onFocus={() => { setIsFocused(true); setLocalValue(value.toString().replace('.', ',')); }}
              onBlur={handleBlur}
              onChange={handleInputChange}
              className={cn(
                "w-full bg-transparent border-b border-transparent hover:border-brand-primary/20 focus:border-brand-primary focus:ring-0 text-right text-xs font-bold p-1 transition-all",
                (highlight || isHighlighted) ? "text-emerald-500 bg-emerald-500/10 border-emerald-500" : (highlight ? "text-brand-primary" : "text-brand-ink"),
                type === 'BRL' ? "pl-6" : "pr-4"
              )}
              placeholder="0,00"
            />
            {type === 'PERCENT' && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-brand-ink/30">%</span>}
          </div>
        </div>
      </div>
      {type === 'PERCENT' && showBase && onBaseChange && (
        <div className="flex items-center justify-end gap-1">
          <select 
            value={base}
            onChange={(e) => onBaseChange(e.target.value)}
            className="bg-transparent border-none p-0 text-[8px] font-bold text-brand-ink/30 uppercase focus:ring-0 cursor-pointer hover:text-brand-primary transition-colors text-right"
          >
            <option value="bid">Lance Máximo</option>
            <option value="valuation">Valor Avaliação</option>
            <option value="saleValue">Valor de Venda</option>
            <option value="profit">Lucro Líquido</option>
            <option value="capitalGain">Ganho Capital</option>
          </select>
        </div>
      )}
    </div>
  );
}

// Financial calculation engine
const calculateSimulationMetrics = (data: any, customBid?: number) => {
  const bid = customBid ?? (data.bid?.value || 0);
  const saleValue = data.saleValue?.value || 0;
  
  const getVal = (field: any) => {
    if (!field || !field.type) return 0;
    if (field.type === 'BRL') return field.value;
    
    const base = field.base || 'bid';
    let baseValue = 0;
    
    switch (base) {
      case 'valuation': baseValue = data.valuation?.value || 0; break;
      case 'bid': baseValue = bid; break;
      case 'saleValue': baseValue = saleValue; break;
      case 'profit': 
        baseValue = Math.max(0, saleValue - bid); 
        break;
      case 'capitalGain':
        baseValue = Math.max(0, saleValue - bid); 
        break;
      default: baseValue = bid;
    }
    
    return baseValue * ((field.value || 0) / 100);
  };

  // Sum categories
  const assessoria = getVal(data.assessoria) + (data.entrada?.value || 0);
  
  const desocupacao = 
    (data.desocupacaoAcordo?.value || 0) + 
    (data.desocupacaoDespesas?.value || 0) + 
    getVal(data.desocupacaoHonorarios) + 
    getVal(data.desocupacaoCustas);
    
  const preArrematacao = 
    (data.preAnaliseImobiliaria?.value || 0) + 
    (data.preAnaliseJuridica?.value || 0) + 
    (data.preCopiaProcessos?.value || 0) + 
    (data.preConsultas?.value || 0) + 
    (data.preMatricula?.value || 0);
    
  const reforma = (data.reforma?.value || 0) + getVal(data.reforma);
  const comissaoLeiloeiro = getVal(data.commission || data.comissaoLeiloeiro);
  const despesasVenda = (data.despesasVenda?.value || 0) + (data.extraFees?.value || 0);
  
  const mensalTotal = 
    (data.mensalCondominio?.value || 0) + 
    (data.mensalIPTU?.value || 0) + 
    (data.mensalOutros?.value || 0);
    
  const holdingCosts = (data.holdingCosts?.value || 0) > 0 ? data.holdingCosts.value : (mensalTotal * (data.holdingMonths || 12));
  
  const transferencia = 
    getVal(data.transfEscritura) + 
    (data.itbi?.value || 0) + 
    getVal(data.transfITBI) + 
    (data.custosRegistro?.value || 0) + 
    getVal(data.transfRegistro) + 
    (data.transfCartorio?.value || 0) + 
    (data.transfAverbacoes?.value || 0) + 
    (data.transfLaudemio?.value || 0) + 
    (data.transfForo?.value || 0) +
    (data.impostos?.value || 0);

  const customExpensesTotal = (data.customExpenses || []).reduce((acc: number, exp: any) => acc + getVal(exp), 0);

  const totalUpfrontExpenses = assessoria + desocupacao + preArrematacao + reforma + comissaoLeiloeiro + transferencia + holdingCosts + customExpensesTotal;
  const assetCost = bid + totalUpfrontExpenses;
  
  const profitBeforePostOp = saleValue - assetCost - despesasVenda;
  
  const performanceFee = data.posTaxaPerformance?.type === 'PERCENT' ? Math.max(0, profitBeforePostOp) * (data.posTaxaPerformance.value / 100) : (data.posTaxaPerformance?.value || 0);
  const brokerFee = data.posComissaoCorretor?.type === 'PERCENT' ? saleValue * (data.posComissaoCorretor.value / 100) : (data.posComissaoCorretor?.value || 0);
  
  const capitalGain = Math.max(0, saleValue - assetCost);
  const incomeTax = data.posIR?.type === 'PERCENT' ? capitalGain * (data.posIR.value / 100) : (data.posIR?.value || 0);
  
  const totalPostOpExpenses = performanceFee + brokerFee + incomeTax + despesasVenda;
  
  const finalTotalExpenses = totalUpfrontExpenses + totalPostOpExpenses;
  const finalTotalCost = bid + finalTotalExpenses;
  
  const netProfit = saleValue - finalTotalCost;
  
  // Financing
  const downPaymentPercent = data.downPaymentPercent?.value ?? 100;
  const installments = data.installments?.value ?? 1;
  const interestRate = data.interestRate?.value ?? 0;
  const holdingMonths = data.holdingMonths?.value ?? 12;
  
  const downPaymentAmount = bid * (downPaymentPercent / 100);
  const financedAmount = bid - downPaymentAmount;
  const monthlyRate = interestRate / 100 / 12;

  let installment = 0;
  if (monthlyRate > 0 && installments > 0) {
    installment = (financedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
  } else if (installments > 0) {
    installment = financedAmount / installments;
  }

  let remainingDebt = 0;
  if (holdingMonths < installments) {
    if (monthlyRate > 0) {
      remainingDebt = financedAmount * Math.pow(1 + monthlyRate, holdingMonths) - 
                      (installment * (Math.pow(1 + monthlyRate, holdingMonths) - 1)) / monthlyRate;
    } else {
      remainingDebt = financedAmount - (installment * holdingMonths);
    }
  }

  const totalPaidDuringHolding = installment * Math.min(holdingMonths, installments);
  const principalPaidDuringHolding = financedAmount - remainingDebt;
  const interestDuringHolding = Math.max(0, totalPaidDuringHolding - principalPaidDuringHolding);

  const totalCashInvested = downPaymentAmount + totalUpfrontExpenses + totalPaidDuringHolding;
  const roi = totalCashInvested > 0 ? (netProfit / totalCashInvested) * 100 : 0;

  return {
    bid,
    saleValue,
    assessoria,
    desocupacao,
    preArrematacao,
    reforma,
    comissaoLeiloeiro,
    transferencia,
    holdingCosts,
    mensalTotal,
    despesasVenda,
    performanceFee,
    brokerFee,
    incomeTax,
    totalUpfrontExpenses,
    totalPostOpExpenses,
    totalExpenses: totalUpfrontExpenses + totalPostOpExpenses,
    assetCost,
    finalTotalCost,
    netProfit,
    interestDuringHolding,
    totalCashInvested,
    totalInvestment: totalCashInvested,
    roi,
    installment,
    remainingDebt,
    totalPaidDuringHolding,
    capitalGain,
    profitBeforePostOp,
    downPaymentAmount
  };
};

// Utility for IRR calculation using Newton-Raphson
function calculateIRR(cashFlows: number[], estimate = 0.1): number | null {
  const maxIter = 100;
  const precision = 1e-7;
  let irr = estimate;

  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dNpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + irr, t);
      npv += cashFlows[t] / factor;
      dNpv -= (t * cashFlows[t]) / (factor * (1 + irr));
    }
    
    if (Math.abs(dNpv) < 1e-10) return null;
    
    const nextIrr = irr - npv / dNpv;
    if (Math.abs(nextIrr - irr) < precision) return nextIrr;
    irr = nextIrr;
  }
  return null;
}

function calculateTIR(
  bidValOrMetrics: number | any, 
  saleVal?: number, 
  expenses?: number, 
  downPaymentPercent?: number, 
  installments?: number, 
  interestRate?: number, 
  holdingMonths?: number,
  simulationData?: any
): number {
  let metrics: any;
  let hm = holdingMonths;
  let inst = installments;

  if (typeof bidValOrMetrics === 'object' && bidValOrMetrics !== null) {
    metrics = bidValOrMetrics;
    hm = hm ?? metrics.holdingMonths ?? 12;
    inst = inst ?? metrics.installments ?? 1;
  } else {
    const bidVal = bidValOrMetrics as number;
    if (simulationData) {
      metrics = calculateSimulationMetrics(simulationData, bidVal);
      hm = hm ?? metrics.holdingMonths ?? 12;
      inst = inst ?? metrics.installments ?? 1;
    } else {
      const dp = downPaymentPercent ?? 100;
      const instVal = installments ?? 1;
      const ir = interestRate ?? 0;
      const hmVal = holdingMonths ?? 12;
      const sv = saleVal ?? 0;
      const ex = expenses ?? 0;

      const downPayment = bidVal * (dp / 100);
      const financed = bidVal - downPayment;
      const monthlyRate = ir / 100 / 12;
      
      let installment = 0;
      if (monthlyRate > 0 && instVal > 0) {
        installment = (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -instVal));
      } else if (instVal > 0) {
        installment = financed / instVal;
      }

      let remainingDebt = 0;
      if (hmVal < instVal) {
        if (monthlyRate > 0) {
          remainingDebt = financed * Math.pow(1 + monthlyRate, hmVal) - 
                          (installment * (Math.pow(1 + monthlyRate, hmVal) - 1)) / monthlyRate;
        } else {
          remainingDebt = financed - (installment * hmVal);
        }
      }
      metrics = {
        bid: bidVal,
        saleValue: sv,
        totalUpfrontExpenses: ex,
        totalPostOpExpenses: 0,
        installment,
        remainingDebt,
        downPaymentAmount: downPayment,
        holdingMonths: hmVal,
        installments: instVal
      };
      hm = hmVal;
      inst = instVal;
    }
  }

  const initialInvestment = metrics.downPaymentAmount + metrics.totalUpfrontExpenses;
  if (initialInvestment <= 0) return 0;

  const cashFlows: number[] = [];
  // Month 0: Down payment + initial expenses
  cashFlows.push(-initialInvestment);
  
  // Months 1 to holdingMonths - 1: Installments
  for (let i = 1; i < hm; i++) {
    cashFlows.push(-metrics.installment);
  }
  
  // Month holdingMonths: Sale - Last Installment - Remaining Debt - Post Op
  const finalCashFlow = metrics.saleValue - (hm <= inst ? metrics.installment : 0) - Math.max(0, metrics.remainingDebt) - (metrics.totalPostOpExpenses || 0);
  cashFlows.push(finalCashFlow);

  const irrMonthly = calculateIRR(cashFlows);
  if (irrMonthly === null) return 0;
  
  return (Math.pow(1 + irrMonthly, 12) - 1) * 100;
}

function BidMap({ simulationData }: { simulationData: any }) {
  const baseBid = simulationData.bid?.value || 0;
  const bidSteps = [0.8, 0.9, 1, 1.1, 1.2]; // Multipliers for base bid
  const monthSteps = [3, 6, 9, 12, 18, 24];

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-ink flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-primary" />
          Mapa de Lances x Prazo de Venda
        </h3>
        <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-brand-ink/40">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
            <span>Excelente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500/20"></div>
            <span>Moderado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
            <span>Baixo</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-brand-border bg-brand-paper shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-bg border-b border-brand-border">
              <th className="py-4 px-6 text-left text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 border-r border-brand-border">Valor do Lance</th>
              {monthSteps.map(m => (
                <th key={m} className="py-4 px-6 text-center text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">
                  {m} Meses
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bidSteps.map(step => {
              const currentBid = baseBid * step;
              return (
                <tr key={step} className="border-b border-brand-border last:border-0 hover:bg-brand-bg/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold text-brand-ink border-r border-brand-border">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentBid)}
                    <span className="block text-[9px] text-brand-ink/30 font-normal">({(step * 100).toFixed(0)}% do mín.)</span>
                  </td>
                  {monthSteps.map(m => {
                    const metrics = calculateSimulationMetrics({ ...simulationData, holdingMonths: m }, currentBid);
                    const tir = calculateTIR(currentBid, metrics.saleValue, 0, simulationData.downPaymentPercent, simulationData.installments, simulationData.interestRate, m, { ...simulationData, holdingMonths: m });
                    
                    let bgColor = "bg-red-500/5";
                    let textColor = "text-red-600";
                    if (tir > 30) { bgColor = "bg-emerald-500/10"; textColor = "text-emerald-600"; }
                    else if (tir > 15) { bgColor = "bg-amber-500/10"; textColor = "text-amber-600"; }

                    return (
                      <td key={m} className={cn("py-4 px-6 text-center transition-colors", bgColor)}>
                        <div className={cn("text-xs font-bold", textColor)}>{tir.toFixed(1)}% <span className="text-[8px] opacity-60">a.a.</span></div>
                        <div className="text-[9px] text-brand-ink/40 mt-1">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(metrics.netProfit)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-brand-ink/40 italic text-center">
        * A TIR (Taxa Interna de Retorno) considera o fluxo de caixa mensal, incluindo entrada, parcelas e quitação na venda.
      </p>
    </div>
  );
}

function InteractiveSimulationTable() {
  const { 
    simulationData, 
    updateState, 
    selectedPropertyId, 
    analysisId, 
    token, 
    report,
    editalAnalysis,
    matriculaAnalysis,
    processAnalysis,
    dossierAnalysis,
    properties,
    handleSaveAsProperty
  } = React.useContext(SimulationContext);
  if (!simulationData) return null;

  const [saving, setSaving] = React.useState(false);

  const handleSaveSimulation = async () => {
    if (!token) {
      if ((window as any).customToast) {
        (window as any).customToast("Você precisa estar autenticado para salvar uma simulação.", "error");
      } else {
        alert("Você precisa estar autenticado para salvar uma simulação.");
      }
      return;
    }
    if (!selectedPropertyId && !analysisId) {
      if ((window as any).customToast) {
        (window as any).customToast("Para salvar a simulação, selecione um imóvel ou execute uma Análise IA primeiro.", "error");
      } else {
        alert("Para salvar a simulação, selecione um imóvel ou execute uma Análise IA primeiro.");
      }
      return;
    }

    setSaving(true);
    try {
      const currentMetrics = calculateSimulationMetrics(simulationData);
      const bidVal = simulationData.bid?.value || 0;
      const saleVal = simulationData.saleValue?.value || 0;
      const valVal = simulationData.valuation?.value || 0;

      // 1. Save core property pricing metrics to `/api/properties/:id` if custom property exists
      if (selectedPropertyId) {
        const propRes = await fetch(`/api/properties/${selectedPropertyId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            valuation_value: valVal,
            min_bid: bidVal,
            expected_sale_value: saleVal
          })
        });

        if (!propRes.ok) {
          throw new Error("Erro ao sincronizar parâmetros financeiros com o imóvel.");
        }
      }

      // 2. If a document analysis exists, update it in `/api/ai-analyses/:id`, otherwise create it for the property
      if (selectedPropertyId && !analysisId) {
        const otherExpenses = currentMetrics.totalUpfrontExpenses;
        const downPaymentPercent = simulationData.downPaymentPercent || 100;
        const installments = simulationData.installments || 1;
        const interestRate = simulationData.interestRate || 0;
        const holdingMonths = simulationData.holdingMonths || 12;
        const computedTir = calculateTIR(bidVal, saleVal, otherExpenses, downPaymentPercent, installments, interestRate, holdingMonths);

        const createRes = await fetch(`/api/ai-analyses`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            property_id: selectedPropertyId,
            exec_summary: "Simulação Manual do Usuário (Sem Relatório IA)",
            financial_analysis: JSON.stringify(simulationData),
            recommended_bid: bidVal,
            roi: currentMetrics.roi,
            tir: computedTir,
            estimated_profit: currentMetrics.netProfit,
            edital_analysis: editalAnalysis || null,
            matricula_analysis: matriculaAnalysis || null,
            process_analysis: processAnalysis || null,
            dossier_analysis: dossierAnalysis || null,
            ia_used: "Manual"
          })
        });

        if (createRes.ok) {
          const createData = await parseJsonResponse(createRes);
          updateState({ analysisId: createData.id });
        } else {
          throw new Error("Erro ao criar registro da simulação financeira.");
        }
      } else if (analysisId) {
        const otherExpenses = currentMetrics.totalUpfrontExpenses;
        const downPaymentPercent = simulationData.downPaymentPercent || 100;
        const installments = simulationData.installments || 1;
        const interestRate = simulationData.interestRate || 0;
        const holdingMonths = simulationData.holdingMonths || 12;
        const computedTir = calculateTIR(bidVal, saleVal, otherExpenses, downPaymentPercent, installments, interestRate, holdingMonths);

        const analysisRes = await fetch(`/api/ai-analyses/${analysisId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            financial_analysis: JSON.stringify(simulationData),
            recommended_bid: bidVal,
            roi: currentMetrics.roi,
            tir: computedTir,
            estimated_profit: currentMetrics.netProfit,
            edital_analysis: editalAnalysis || null,
            matricula_analysis: matriculaAnalysis || null,
            process_analysis: processAnalysis || null,
            dossier_analysis: dossierAnalysis || null
          })
        });

        if (!analysisRes.ok) {
          throw new Error("Erro ao sincronizar dados da simulação na analise documental.");
        }
      }

      if ((window as any).customToast) {
        (window as any).customToast(
          selectedPropertyId 
            ? "Simulação financeira e parâmetros salvos para este imóvel com sucesso!" 
            : "Simulação de análise avulsa salva e sincronizada com sucesso!",
          "success"
        );
      } else {
        alert(
          selectedPropertyId 
            ? "Simulação financeira e parâmetros salvos para este imóvel com sucesso!" 
            : "Simulação de análise avulsa salva e sincronizada com sucesso!"
        );
      }
    } catch (err: any) {
      console.error(err);
      if ((window as any).customToast) {
        (window as any).customToast(`Erro ao salvar simulação: ${err.message}`, "error");
      } else {
        alert(`Erro ao salvar simulação: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const metrics = calculateSimulationMetrics(simulationData);
  const totalInvestment = metrics.assetCost;
  const grossProfit = metrics.netProfit;
  const roi = metrics.roi;

  const handleUpdateField = (key: string, field: string, value: any) => {
    updateState((prev: any) => {
      const isDirect = key === 'saleValue' || key === 'bid';
      const newData = {
        ...prev.simulationData,
        [key]: isDirect ? { value, type: 'BRL' } : {
          ...(prev.simulationData[key] || {}),
          [field]: value
        }
      };
      return { simulationData: newData };
    });
  };

  const handleApplyMasterParams = () => {
    const master = getMasterBudgetConfigs();
    updateState((prev: any) => {
      const newData = {
        ...prev.simulationData,
        comissaoLeiloeiro: { ...(prev.simulationData.comissaoLeiloeiro || {}), value: master.comissaoLeiloeiro?.value ?? 5, type: master.comissaoLeiloeiro?.type ?? 'PERCENT' },
        commission: { ...(prev.simulationData.commission || {}), value: master.comissaoLeiloeiro?.value ?? 5, type: master.comissaoLeiloeiro?.type ?? 'PERCENT' },
        itbi: { ...(prev.simulationData.itbi || {}), value: master.itbi?.value ?? 3, type: master.itbi?.type ?? 'PERCENT' },
        transfITBI: { ...(prev.simulationData.transfITBI || {}), value: master.itbi?.value ?? 3, type: master.itbi?.type ?? 'PERCENT' },
        transfRegistro: { ...(prev.simulationData.transfRegistro || {}), value: master.transfRegistro?.value ?? 1.5, type: master.transfRegistro?.type ?? 'PERCENT' },
        desocupacaoAcordo: { ...(prev.simulationData.desocupacaoAcordo || {}), value: master.desocupacaoAcordo?.value ?? 0, type: master.desocupacaoAcordo?.type ?? 'BRL' },
        reforma: { ...(prev.simulationData.reforma || {}), value: master.reforma?.value ?? 0, type: master.reforma?.type ?? 'BRL' },
        assessoria: { ...(prev.simulationData.assessoria || {}), value: master.assessoria?.value ?? 6, type: master.assessoria?.type ?? 'PERCENT' },
        entrada: { ...(prev.simulationData.entrada || {}), value: master.entrada?.value ?? 1500, type: master.entrada?.type ?? 'BRL' },
        extraFees: { ...(prev.simulationData.extraFees || {}), value: master.extraFees?.value ?? 0, type: master.extraFees?.type ?? 'BRL' },
        despesasVenda: { ...(prev.simulationData.despesasVenda || {}), value: master.extraFees?.value ?? 0, type: master.extraFees?.type ?? 'BRL' }
      };
      return { simulationData: newData };
    });
    if ((window as any).customToast) {
      (window as any).customToast("Parâmetros do Quadro Resumo (MASTER) aplicados com sucesso!", "success");
    } else {
      alert("Parâmetros do Quadro Resumo (MASTER) aplicados!");
    }
  };

  const getFieldValue = (key: string) => {
    return simulationData[key]?.value ?? (typeof simulationData[key] === 'number' ? simulationData[key] : 0);
  };

  const getFieldType = (key: string) => {
    return simulationData[key]?.type ?? 'BRL';
  };

  const getVal = (field: any) => {
    if (!field || !field.type) return 0;
    if (field.type === 'BRL') return field.value;
    const bidValue = simulationData.bid?.value || 0;
    return bidValue * ((field.value || 0) / 100);
  };

  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 py-4 font-sans leading-normal">
      {/* Column 1: Configuração Simples */}
      <div className="xl:col-span-7 space-y-6">
        <div className="bg-brand-paper rounded-3xl border border-brand-primary/10 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-brand-border/40 pb-4">
            <h4 className="text-lg font-bold text-brand-primary font-sans">Valores Fundamentais</h4>
            <p className="text-xs text-brand-ink/40 mt-1">Configure o preço estimado de mercado de venda e o lance planejado.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-widest block font-sans">Preço Estimado de Venda</label>
              <div className="flex items-center gap-2 bg-brand-bg/40 rounded-2xl px-4 py-3 border border-brand-border focus-within:border-brand-primary/40 transition-all">
                <span className="text-brand-ink/40 text-sm font-bold font-mono">R$</span>
                <input 
                  type="number"
                  value={getFieldValue('saleValue')}
                  onChange={(e) => handleUpdateField('saleValue', 'value', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0 text-brand-ink outline-none font-mono"
                  placeholder="0,00"
                />
              </div>
              <p className="text-[10px] text-brand-ink/40 font-sans">Valor projetado para a revenda do imóvel.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-ink/60 uppercase tracking-widest block text-brand-primary font-sans">Lance da Arrematação</label>
              <div className="flex items-center gap-2 bg-brand-bg/40 rounded-2xl px-4 py-3 border border-brand-primary/25 focus-within:border-brand-primary/55 transition-all">
                <span className="text-brand-primary text-sm font-bold font-mono">R$</span>
                <input 
                  type="number"
                  value={getFieldValue('bid')}
                  onChange={(e) => handleUpdateField('bid', 'value', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0 text-brand-primary outline-none font-mono"
                  placeholder="0,00"
                />
              </div>
              <p className="text-[10px] text-brand-ink/40 font-sans">Valor reservado para ofertar no leilão.</p>
            </div>
          </div>
        </div>

        {/* Acquisition & Service Fees */}
        <div className="bg-brand-paper rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-brand-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-brand-primary font-sans">Custos da Arrematação</h4>
              <p className="text-xs text-brand-ink/40 mt-1">Apenas os valores necessários para a regularização e o assessoramento jurídico-financeiro.</p>
            </div>
            <button
              type="button"
              onClick={handleApplyMasterParams}
              className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-all px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto shrink-0 border border-brand-primary/20 cursor-pointer"
            >
              <RefreshCw size={12} className="text-brand-primary animate-pulse" />
              Carregar Padrão MASTER
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <CompactSimulationInput 
                label="Comissão do Leiloeiro"
                value={getFieldValue('commission')}
                type={getFieldType('commission')}
                onTypeChange={t => handleUpdateField('commission', 'type', t)}
                onChange={v => handleUpdateField('commission', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="ITBI Estimado"
                value={getFieldValue('itbi')}
                type={getFieldType('itbi')}
                onTypeChange={t => handleUpdateField('itbi', 'type', t)}
                onChange={v => handleUpdateField('itbi', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="Registro e Custas"
                value={getFieldValue('transfRegistro')}
                type={getFieldType('transfRegistro')}
                onTypeChange={t => handleUpdateField('transfRegistro', 'type', t)}
                onChange={v => handleUpdateField('transfRegistro', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="Dívidas IPTU / Condo"
                value={getFieldValue('desocupacaoAcordo')}
                type={getFieldType('desocupacaoAcordo')}
                onTypeChange={t => handleUpdateField('desocupacaoAcordo', 'type', t)}
                onChange={v => handleUpdateField('desocupacaoAcordo', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="Reforma / Desocupação"
                value={getFieldValue('reforma')}
                type={getFieldType('reforma')}
                onTypeChange={t => handleUpdateField('reforma', 'type', t)}
                onChange={v => handleUpdateField('reforma', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="Assessoria TJ INVEST"
                value={getFieldValue('assessoria')}
                type={getFieldType('assessoria')}
                onTypeChange={t => handleUpdateField('assessoria', 'type', t)}
                onChange={v => handleUpdateField('assessoria', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="Entrada TJ INVEST"
                value={getFieldValue('entrada')}
                type={getFieldType('entrada')}
                onTypeChange={t => handleUpdateField('entrada', 'type', t)}
                onChange={v => handleUpdateField('entrada', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="Despesas Extra / Outros"
                value={getFieldValue('extraFees')}
                type={getFieldType('extraFees')}
                onTypeChange={t => handleUpdateField('extraFees', 'type', t)}
                onChange={v => handleUpdateField('extraFees', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="Comissão de Venda"
                value={getFieldValue('posComissaoCorretor')}
                type={getFieldType('posComissaoCorretor')}
                onTypeChange={t => handleUpdateField('posComissaoCorretor', 'type', t)}
                onChange={v => handleUpdateField('posComissaoCorretor', 'value', v)}
              />
            </div>

            <div className="space-y-1">
              <CompactSimulationInput 
                label="IPRF Ganho de Capital"
                value={getFieldValue('posIR')}
                type={getFieldType('posIR')}
                onTypeChange={t => handleUpdateField('posIR', 'type', t)}
                onChange={v => handleUpdateField('posIR', 'value', v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Elegant summary card */}
      <div className="xl:col-span-5">
        <div className="bg-brand-paper rounded-3xl border-2 border-brand-primary/20 p-6 sm:p-8 shadow-xl xl:sticky xl:top-8 space-y-6">
          <div className="border-b border-brand-border pb-4">
            <h4 className="text-base font-bold uppercase tracking-wider text-brand-ink/80 flex items-center gap-2 font-sans">
              <Calculator size={16} className="text-brand-primary" />
              Resumo Operacional
            </h4>
            <p className="text-xs text-brand-ink/40 mt-1 font-sans">Visão simplificada do ativo para complementar sua análise jurídica documental.</p>
          </div>

          <div className="space-y-4 font-mono">
            <div className="flex justify-between items-center text-sm font-sans">
              <span className="text-brand-ink/50 text-xs uppercase tracking-wider font-sans">Valor Estimado de Venda</span>
              <span className="font-bold text-brand-ink font-mono">{format(getFieldValue('saleValue'))}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-brand-border/30 pb-3 font-sans">
              <span className="text-brand-primary text-xs uppercase tracking-wider font-bold font-sans">Lance da Arrematação</span>
              <span className="font-extrabold text-brand-primary font-mono">{format(getFieldValue('bid'))}</span>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/60 font-sans">Custos Detalhados</div>
              {[
                { label: 'Comissão Leiloeiro', val: getVal(simulationData.commission) },
                { label: 'Imposto ITBI', val: getVal(simulationData.itbi) },
                { label: 'Registro/Cartório', val: getVal(simulationData.transfRegistro) },
                { label: 'Dívidas IPTU/Cond.', val: getVal(simulationData.desocupacaoAcordo) },
                { label: 'Reformas/Imprevistos', val: getVal(simulationData.reforma) },
                { label: 'Assessoria TJ INVEST', val: getVal(simulationData.assessoria) },
                { label: 'Entrada TJ INVEST', val: getVal(simulationData.entrada) },
                { label: 'Comissão de Venda (5%)', val: metrics.brokerFee },
                { label: 'IR Ganho de Capital (15%)', val: metrics.incomeTax },
                { label: 'Custos Extras', val: getVal(simulationData.extraFees) }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-brand-ink/70">
                  <span className="font-sans">{item.label}</span>
                  <span className="font-semibold font-mono">{format(item.val)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm border-t border-brand-border/50 pt-4 font-sans">
              <span className="text-brand-ink/50 text-xs uppercase tracking-wider font-sans">Custos Totais Adicionais</span>
              <span className="font-bold text-red-500 font-mono">-{format(metrics.totalUpfrontExpenses)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-brand-border pb-4 font-sans">
              <span className="text-brand-ink/50 text-xs uppercase tracking-wider font-bold font-sans">Custo de Aquisição Total</span>
              <span className="font-bold text-brand-ink font-mono">{format(totalInvestment)}</span>
            </div>

            {/* Final profit indicator */}
            <div className="pt-4 space-y-3 font-sans font-sans">
              <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex justify-between items-center whitespace-nowrap">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary block font-sans">Lucro Líquido Estimado</span>
                  <span className="text-xs text-brand-ink/55 font-sans">Diferença estimada pós-custos</span>
                </div>
                <span className="text-2xl font-black text-brand-primary font-mono">{format(grossProfit)}</span>
              </div>

              <div className="bg-brand-secondary/10 border border-brand-border rounded-2xl p-4 flex justify-between items-center whitespace-nowrap">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/55 block font-sans">ROI sobre Investimento</span>
                  <span className="text-xs text-brand-ink/55 font-sans">Percentual de retorno</span>
                </div>
                <span className="text-xl font-bold text-green-500 font-mono">{roi.toFixed(1)}%</span>
              </div>

              {/* Save Simulation Action Block */}
              <div className="pt-4 border-t border-brand-border/40">
                <button
                  type="button"
                  onClick={(!selectedPropertyId && !analysisId && handleSaveAsProperty) ? handleSaveAsProperty : handleSaveSimulation}
                  disabled={saving}
                  className={cn(
                    "w-full py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-brand-primary shadow-lg cursor-pointer bg-brand-primary text-black hover:bg-brand-primary/95 shadow-brand-primary/10"
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin text-black shrink-0" size={14} />
                      <span>Salvando Parâmetros...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{(!selectedPropertyId && !analysisId) ? "Salvar como Novo Imóvel" : "Salvar e Sincronizar Análise"}</span>
                    </>
                  )}
                </button>
                {!selectedPropertyId && !analysisId && (
                  <p className="text-[9px] text-brand-ink/40 text-center mt-2 font-semibold">
                    * Ao salvar como Novo Imóvel, esta simulação financeira será gravada em um novo cadastro no sistema.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const getVal = (field: any) => {
                      if (!field) return 0;
                      if (field.type === 'BRL') return field.value || 0;
                      const bidVal = simulationData.bid?.value || 0;
                      return ((field.value || 0) * bidVal / 100);
                    };

                    const params = new URLSearchParams();
                    params.append("valuation", (simulationData.valuation?.value || 0).toString());
                    params.append("bid", (simulationData.bid?.value || 0).toString());
                    params.append("saleValue", (simulationData.saleValue?.value || 0).toString());
                    params.append("holdingMonths", (simulationData.holdingMonths || 12).toString());
                    params.append("downPaymentPercent", (simulationData.downPaymentPercent || 100).toString());
                    params.append("interestRate", (simulationData.interestRate || 0).toString());
                    params.append("installments", (simulationData.installments || 1).toString());
                    params.append("strategy", (simulationData.strategy || "Venda").toString());

                    // Individual Expense values (pre-calculated to BRL)
                    params.append("desocupacaoAcordo", getVal(simulationData.desocupacaoAcordo).toString());
                    params.append("reforma", getVal(simulationData.reforma).toString());
                    params.append("transfRegistro", getVal(simulationData.transfRegistro).toString());
                    params.append("comissaoLeiloeiro", getVal(simulationData.comissaoLeiloeiro).toString());
                    params.append("transfITBI", getVal(simulationData.transfITBI).toString());
                    params.append("assessoria", getVal(simulationData.assessoria).toString());
                    params.append("desocupacaoHonorarios", getVal(simulationData.desocupacaoHonorarios).toString());
                    params.append("despesasVenda", getVal(simulationData.despesasVenda).toString());
                    params.append("holdingCosts", getVal(simulationData.holdingCosts).toString());

                    // Metrics
                    const currentMetrics = calculateSimulationMetrics(simulationData);
                    params.append("netProfit", currentMetrics.netProfit.toString());
                    params.append("roi", roi.toFixed(2));

                    const targetUrl = `https://calculadora.tjinvest.com.br/?${params.toString()}`;
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full mt-3 py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-brand-border hover:bg-brand-ink/5 text-brand-ink cursor-pointer"
                >
                  <Calculator size={14} />
                  <span>Exportar p/ Calculadora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveSimulationTableOLD() {
  const { simulationData, updateState } = React.useContext(SimulationContext);
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [showDebtsBreakdown, setShowDebtsBreakdown] = React.useState(false);
  const [showComparison, setShowComparison] = React.useState(false);
  const [showUpfrontExpenses, setShowUpfrontExpenses] = React.useState(false);
  const [showInstallmentCashOut, setShowInstallmentCashOut] = React.useState(false);

  if (!simulationData) return null;

  const metrics = calculateSimulationMetrics(simulationData);
  const tir = calculateTIR(metrics);
  const totalInvestment = metrics.assetCost;
  const tableInitialCash = metrics.totalCashInvested;
  const grossProfit = metrics.netProfit;
  const roi = metrics.roi;
  const finalTotal = metrics.finalTotalCost;

  const handleUpdateField = React.useCallback((key: string, field: string, value: any) => {
    updateState((prev: any) => {
      const isDirect = key === 'saleValue' || key === 'bid';
      const newData = {
        ...prev.simulationData,
        [key]: isDirect ? { value, type: 'BRL' } : {
          ...(prev.simulationData[key] || {}),
          [field]: value
        }
      };

      // If updating IPTU or Condo, update the total debts
      if (key === 'debtsIPTU' || key === 'debtsCondo') {
        const iptu = key === 'debtsIPTU' ? value : (newData.debtsIPTU?.value || 0);
        const condo = key === 'debtsCondo' ? value : (newData.debtsCondo?.value || 0);
        newData.desocupacaoAcordo = {
          ...newData.desocupacaoAcordo,
          value: iptu + condo
        };
      }

      // If updating paymentType, update downPaymentPercent
      if (key === 'paymentType') {
        newData.downPaymentPercent = value === 'vista' ? 100 : 25;
      }

      return { simulationData: newData };
    });
  }, [updateState]);

  const handleUpdateDirect = (key: string, value: any) => {
    updateState((prev: any) => ({
      simulationData: {
        ...prev.simulationData,
        [key]: value
      }
    }));
  };

  const handleUpdateModality = (modality: string) => {
    updateState((prev: any) => {
      const newData = {
        ...prev.simulationData,
        modality: modality,
        comissaoLeiloeiro: {
          ...prev.simulationData.comissaoLeiloeiro,
          value: modality === 'Venda Direta' ? 0 : 5
        }
      };
      return { simulationData: newData };
    });
  };

  const handleAddCustomExpense = () => {
    handleUpdateDirect('customExpenses', [
      ...(simulationData.customExpenses || []),
      { label: 'Nova Despesa', value: 0, type: 'BRL', base: 'bid' }
    ]);
  };

  const handleUpdateCustomExpense = (index: number, field: string, value: any) => {
    const newExpenses = [...(simulationData.customExpenses || [])];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    handleUpdateDirect('customExpenses', newExpenses);
  };

  const handleRemoveCustomExpense = (index: number) => {
    const newExpenses = (simulationData.customExpenses || []).filter((_: any, i: number) => i !== index);
    handleUpdateDirect('customExpenses', newExpenses);
  };

  const groups = [
    {
      title: 'Resumo de Investimento (Master)',
      rows: [
        { label: 'Valor de Venda do Imóvel', key: 'saleValue' },
        { label: 'Custos da Arrematação (Lance)', key: 'bid', highlight: true },
        { label: 'Total de Custos de Aquisição', key: 'totalInvestment', isComputed: true },
        { label: 'Lucro Estimado', key: 'netProfit', isComputed: true, color: 'text-emerald-600 font-bold' },
        { label: 'ROI (%)', key: 'roi', isComputed: true, color: 'text-brand-primary font-bold' },
        { label: 'TIR (%)', key: 'tir', isComputed: true, color: 'text-brand-primary font-bold' },
      ]
    },
    {
      title: 'Forma de Pagamento',
      rows: [
        { label: 'Entrada (%)', key: 'downPaymentPercent' },
        { label: 'Parcelas', key: 'installments' },
        { label: 'Taxa de Juros (%)', key: 'interestRate' },
      ]
    },
    {
      title: 'Custos de Aquisição (Transferência)',
      rows: [
        { label: 'Comissão Leiloeiro', key: 'comissaoLeiloeiro' },
        { label: 'ITBI Estimado', key: 'transfITBI' },
        { label: 'Custos de Registro/Escritura', key: 'transfRegistro' },
        { label: 'Escritura Pública', key: 'transfEscritura' },
      ]
    },
    {
      title: 'Regularização e Operação',
      rows: [
        { label: 'Débitos Acumulados', key: 'desocupacaoAcordo', color: 'text-red-600' },
        { label: 'Reformas/Desocupação', key: 'reforma' },
        { label: 'Custos Jurídicos / Advogado', key: 'desocupacaoHonorarios' },
        { label: 'Condomínio/IPTU (Desocupação)', key: 'mensalCondominio' },
        { label: 'Outras Taxas / Extras', key: 'despesasVenda' },
      ]
    },
    {
      title: 'TJ INVEST (Assessoramento)',
      rows: [
        { label: 'Assessoria TJ INVEST', key: 'assessoria' },
        { label: 'Entrada TJ INVEST', key: 'entrada' },
      ]
    }
  ];

  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getVal = (field: any) => field?.value || 0;
  const bid = simulationData.bid?.value || 0;
  const otherExpenses = metrics.totalUpfrontExpenses - (simulationData.commission?.value || 0) / 100 * bid;
  const downPaymentPercent = simulationData.downPaymentPercent || 100;
  const installments = simulationData.installments || 1;
  const interestRate = simulationData.interestRate || 0;
  const holdingMonths = simulationData.holdingMonths || 12;
  const downPaymentAmount = metrics.downPaymentAmount;
  const totalFinancingCostFullTerm = (metrics.installment * installments) + downPaymentAmount;
  const assetCost = metrics.totalInvestment;
  const interestDuringHolding = metrics.installment * Math.min(holdingMonths, installments) - (bid - downPaymentAmount) * (Math.min(holdingMonths, installments) / installments); // Simplified interest calc for display

  const calculateScenario = (dpPercent: number) => {
    const scenarioData = { ...simulationData, downPaymentPercent: dpPercent };
    const scenarioMetrics = calculateSimulationMetrics(scenarioData);
    return {
      roi: scenarioMetrics.roi,
      grossProfit: scenarioMetrics.netProfit,
      totalInvestment: scenarioMetrics.assetCost,
      finalTotal: scenarioMetrics.finalTotalCost
    };
  };

  return (
    <div className="my-8 space-y-6">
      {/* <FinancialSummaryCard simulationData={simulationData} /> */}

      {/* Strategy and Expected Return */}
      <div className="bg-brand-paper rounded-3xl border border-brand-border p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Modalidade</label>
            <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border/50">
              {['Judicial', 'Extrajudicial', 'Venda Direta'].map((m) => (
                <button 
                  key={m}
                  type="button"
                  onClick={() => handleUpdateModality(m)}
                  className={cn(
                    "flex-1 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                    (simulationData.modality || 'Judicial') === m ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Tese / Estratégia</label>
            <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border/50">
              {['venda', 'aluguel'].map((s) => (
                <button 
                  key={s}
                  type="button"
                  onClick={() => handleUpdateDirect('strategy', s)}
                  className={cn(
                    "flex-1 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                    (simulationData.strategy || 'venda') === s ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Retorno Esperado (a.a. %)</label>
            <div className="flex items-center gap-2 bg-brand-bg/30 rounded-xl px-3 py-2 border border-brand-border/30">
              <input 
                type="number" 
                value={simulationData.expectedReturn || 15}
                onChange={(e) => handleUpdateDirect('expectedReturn', parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
              />
              <span className="text-xs font-bold text-brand-ink/30">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financing Configuration */}
      <div className="bg-brand-paper rounded-3xl border border-brand-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 flex items-center gap-2">
            <Calculator size={14} className="text-brand-primary" />
            Configuração de Pagamento
          </h4>
          <div className="flex gap-2">
            <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border/50">
              <button 
                type="button"
                onClick={() => handleUpdateDirect('downPaymentPercent', 100)}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  downPaymentPercent === 100 ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                )}
              >
                À Vista
              </button>
              <button 
                type="button"
                onClick={() => handleUpdateDirect('downPaymentPercent', 25)}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  downPaymentPercent !== 100 ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                )}
              >
                Parcelado
              </button>
            </div>
            <button 
              type="button"
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-brand-primary text-black shadow-sm transition-all hover:bg-brand-primary/80"
            >
              Comparar Cenários
            </button>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Entrada (%)</label>
              <div className="flex items-center gap-2 bg-brand-bg/30 rounded-xl px-3 py-2 border border-brand-border/30">
                <input 
                  type="number" 
                  value={downPaymentPercent}
                  onChange={(e) => handleUpdateDirect('downPaymentPercent', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
                />
                <span className="text-xs font-bold text-brand-ink/30">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Parcelas</label>
              <div className="flex items-center gap-2 bg-brand-bg/30 rounded-xl px-3 py-2 border border-brand-border/30">
                <input 
                  type="number" 
                  value={installments}
                  onChange={(e) => handleUpdateDirect('installments', parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Juros Anual (%)</label>
              <div className="flex items-center gap-2 bg-brand-bg/30 rounded-xl px-3 py-2 border border-brand-border/30">
                <input 
                  type="number" 
                  value={interestRate}
                  onChange={(e) => handleUpdateDirect('interestRate', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
                />
                <span className="text-xs font-bold text-brand-ink/30">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Tempo Revenda (Meses)</label>
              <div className="flex items-center gap-2 bg-brand-bg/30 rounded-xl px-3 py-2 border border-brand-border/30">
                <input 
                  type="number" 
                  value={holdingMonths}
                  onChange={(e) => handleUpdateDirect('holdingMonths', parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
                />
              </div>
            </div>
          </div>
      </div>

      {/* Comparison: Upfront vs Installments */}
      <button 
        type="button"
        onClick={() => setShowComparison(!showComparison)}
        className="w-full text-center text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-primary/80 transition-all"
      >
        {showComparison ? 'Ocultar Comparativo' : 'Comparar Cenários (À Vista vs Parcelado)'}
      </button>

      {showComparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-brand-bg rounded-3xl border border-brand-border">
          {['À Vista', 'Parcelado'].map((type, i) => {
            const scenario = calculateScenario(type === 'À Vista' ? 100 : 25);
            return (
              <div key={type} className="space-y-2">
                <h5 className="text-sm font-bold text-brand-ink">{type}</h5>
                <div className="text-xs text-brand-ink/60">ROI: {scenario.roi.toFixed(2)}%</div>
                <div className="text-xs text-brand-ink/60">Lucro: {format(scenario.grossProfit)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn(
          "p-6 rounded-3xl border transition-all",
          downPaymentPercent >= 100 ? "bg-brand-primary/10 border-brand-primary shadow-md" : "bg-brand-paper border-brand-border"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">Pagamento à Vista</h5>
            {downPaymentPercent >= 100 && <CheckCircle2 size={16} className="text-brand-primary" />}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[9px] uppercase text-brand-ink/40">Lance à Vista</span>
              <span className="text-lg font-bold text-brand-ink">{format(bid)}</span>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setShowUpfrontExpenses(!showUpfrontExpenses)}
                className="flex items-center gap-1 text-[9px] uppercase text-brand-ink/40 hover:text-brand-primary transition-colors"
              >
                Outras Despesas
                <ChevronDown size={10} className={cn("transition-transform", showUpfrontExpenses && "rotate-180")} />
              </button>
              <span className="text-sm font-bold text-brand-ink/60">{format(otherExpenses)}</span>
            </div>
            
            <AnimatePresence>
              {showUpfrontExpenses && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-4 bg-brand-bg rounded-2xl space-y-2 border border-brand-border">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Detalhamento de Custos</div>
                    {[
                      { label: 'Comissão Leiloeiro', val: getVal(simulationData.commission) },
                      { label: 'ITBI', val: getVal(simulationData.itbi) },
                      { label: 'Custos Registro', val: getVal(simulationData.costs) },
                      { label: 'Custos Jurídicos', val: getVal(simulationData.legalFees) },
                      { label: 'Débitos Acumulados', val: getVal(simulationData.debts) },
                      { label: 'Reformas/Desocupação', val: getVal(simulationData.renovation) },
                      { label: 'Condomínio/IPTU', val: getVal(simulationData.holdingCosts) },
                      { label: 'Assessoria TJ INVEST', val: getVal(simulationData.assessoria) },
                      { label: 'Entrada TJ INVEST', val: getVal(simulationData.entrada) },
                      { label: 'Custos Extras', val: getVal(simulationData.extraFees) },
                    ].filter(item => item.val > 0).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-brand-ink/70">
                        <span>{item.label}</span>
                        <span className="font-bold">{format(item.val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold text-brand-ink border-t border-brand-border pt-2 mt-2">
                      <span>Total de Despesas</span>
                      <span>{format(otherExpenses)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-end">
              <span className="text-[9px] uppercase text-brand-ink/40">Investimento Total</span>
              <span className="text-sm font-bold text-brand-ink/80">{format(bid + otherExpenses)}</span>
            </div>
            <div className="pt-2 border-t border-brand-border/50 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-brand-primary flex items-center gap-1">
                ROI
                <span title="Retorno Sobre o Investimento. Mostra o lucro total em relação ao valor investido. Ex: Um ROI de 20% significa que para cada R$ 100 investidos, você ganhou R$ 20 de lucro líquido. Nota: Em investimentos alavancados (com financiamento), o ROI pode parecer muito alto devido ao baixo capital próprio investido inicialmente.">
                  <Info size={10} />
                </span>
              </span>
              <span className="text-xl font-bold text-brand-primary">
                {(((simulationData.saleValue?.value || 0) - (bid + otherExpenses)) / (bid + otherExpenses) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => handleUpdateDirect('downPaymentPercent', 100)}
            className="w-full mt-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-brand-primary/20 rounded-xl hover:bg-brand-primary hover:text-black transition-all"
          >
            Selecionar à Vista
          </button>
        </div>

        <div className={cn(
          "p-6 rounded-3xl border transition-all",
          downPaymentPercent < 100 ? "bg-brand-primary/10 border-brand-primary shadow-md" : "bg-brand-paper border-brand-border"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">Pagamento Parcelado</h5>
            {downPaymentPercent < 100 && <CheckCircle2 size={16} className="text-brand-primary" />}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[9px] uppercase text-brand-ink/40">Valor da Arrematação</span>
              <span className="text-sm font-bold text-brand-ink/60">{format(bid)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[9px] uppercase text-brand-ink/40">Entrada ({downPaymentPercent}%)</span>
              <span className="text-lg font-bold text-brand-ink">{format(downPaymentAmount)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[9px] uppercase text-brand-ink/40">Saldo Remanescente</span>
              <span className="text-sm font-bold text-brand-ink/60">{format(bid - downPaymentAmount)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[9px] uppercase text-brand-ink/40">Parcelamento</span>
              <span className="text-sm font-bold text-brand-ink/60">
                {installments}x {format(totalFinancingCostFullTerm / installments)}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <button 
                onClick={() => setShowInstallmentCashOut(!showInstallmentCashOut)}
                className="flex items-center gap-1 text-[9px] uppercase text-brand-ink/40 hover:text-brand-primary transition-colors"
              >
                Aporte Inicial (Cash Out)
                <ChevronDown size={10} className={cn("transition-transform", showInstallmentCashOut && "rotate-180")} />
              </button>
              <span className="text-sm font-bold text-brand-primary">{format(tableInitialCash)}</span>
            </div>

            <AnimatePresence>
              {showInstallmentCashOut && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-4 bg-black/5 rounded-2xl space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Detalhamento do Aporte</div>
                    <div className="flex justify-between text-xs font-bold text-brand-ink border-b border-brand-border pb-2 mb-2">
                      <span>Entrada ({downPaymentPercent}%)</span>
                      <span>{format(downPaymentAmount)}</span>
                    </div>
                    {[
                      { label: 'Comissão Leiloeiro', val: getVal(simulationData.commission) },
                      { label: 'ITBI', val: getVal(simulationData.itbi) },
                      { label: 'Custos Registro', val: getVal(simulationData.costs) },
                      { label: 'Custos Jurídicos', val: getVal(simulationData.legalFees) },
                      { label: 'Débitos Acumulados', val: getVal(simulationData.debts) },
                      { label: 'Reformas/Desocupação', val: getVal(simulationData.renovation) },
                      { label: 'Condomínio/IPTU', val: getVal(simulationData.holdingCosts) },
                      { label: 'Assessoria TJ INVEST', val: getVal(simulationData.assessoria) },
                      { label: 'Entrada TJ INVEST', val: getVal(simulationData.entrada) },
                      { label: 'Custos Extras', val: getVal(simulationData.extraFees) },
                    ].filter(item => item.val > 0).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-brand-ink/70">
                        <span>{item.label}</span>
                        <span className="font-bold">{format(item.val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold text-brand-ink border-t border-brand-border pt-2 mt-2">
                      <span>Total do Aporte</span>
                      <span>{format(tableInitialCash)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2 border-t border-brand-border/50 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase text-brand-primary flex items-center gap-1">
                ROI s/ Investimento
                <span title="Retorno Sobre o Investimento considerando apenas o capital próprio investido (entrada + parcelas pagas até a venda).">
                  <Info size={10} />
                </span>
              </span>
              <span className="text-xl font-bold text-brand-primary">
                {metrics.roi.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => handleUpdateDirect('downPaymentPercent', simulationData.auctionType === 'judicial' ? 25 : 20)}
            className="w-full mt-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-brand-primary/20 rounded-xl hover:bg-brand-primary hover:text-black transition-all"
          >
            Configurar Parcelamento
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-brand-border rounded-[2rem] -mx-4 sm:mx-0">
        <table className="w-full border-collapse min-w-[760px]">
          <tbody className="divide-y divide-brand-border/50">
            {groups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                <tr className="bg-brand-bg">
                  <td colSpan={3} className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-brand-ink/60">
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row, i) => (
                  <React.Fragment key={i}>
                    <tr className="border-b border-brand-primary/5 hover:bg-brand-bg/10 transition-colors group">
                      <td className={cn(
                        "py-4 px-6 text-sm font-medium flex items-center gap-2", 
                        row.highlight ? "text-brand-primary font-bold" : (row.color || "text-brand-ink/60")
                      )}>
                        {row.key === 'desocupacaoAcordo' && (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowDebtsBreakdown(!showDebtsBreakdown); }}
                            className="p-1 hover:bg-brand-primary/10 rounded-full transition-colors"
                          >
                            <ChevronDown size={14} className={cn("transition-transform", showDebtsBreakdown && "rotate-180")} />
                          </button>
                        )}
                        {row.label}
                      </td>
                      <td className="py-2 px-6 text-right">
                        {row.isComputed ? (
                          <div className={cn("text-sm font-bold", row.color)}>
                            {row.key === 'roi' || row.key === 'tir' 
                              ? `${(row.key === 'roi' ? metrics.roi : tir).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                              : format(metrics[row.key] || 0)}
                          </div>
                        ) : (
                          <CompactSimulationInput 
                            label={row.label}
                            value={simulationData[row.key]?.value ?? (typeof simulationData[row.key] === 'number' ? simulationData[row.key] : 0)}
                            type={simulationData[row.key]?.type || (row.key === 'downPaymentPercent' || row.key === 'installments' || row.key === 'interestRate' || row.key === 'saleValue' || row.key === 'bid' ? 'NUMBER' : 'BRL')}
                            highlight={row.highlight}
                            onTypeChange={row.key === 'saleValue' || row.key === 'bid' ? undefined : t => handleUpdateField(row.key, 'type', t)}
                            onChange={v => handleUpdateField(row.key, 'value', v)}
                          />
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-black/40 italic">
                        {row.key === 'bid' ? 'Mínimo aceitável' : row.key === 'transfITBI' ? 'Sobre o valor do lance' : 'Estimado'}
                      </td>
                    </tr>
                    {row.key === 'desocupacaoAcordo' && showDebtsBreakdown && (
                      <tr className="bg-brand-bg/10">
                        <td colSpan={3} className="px-12 py-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-brand-ink/60">IPTU</label>
{/*
                              <CompactSimulationInput 
                                label="IPTU"
                                value={simulationData.debtsIPTU?.value || 0}
                                type="BRL"
                                onTypeChange={t => handleUpdateField('debtsIPTU', 'type', t)}
                                onChange={v => handleUpdateField('debtsIPTU', 'value', v)}
                              /> 
                              */}
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-brand-ink/60">Condomínio</label>
                              <CompactSimulationInput 
                                label="Condomínio"
                                value={simulationData.debtsCondo?.value || 0}
                                type="BRL"
                                onTypeChange={t => handleUpdateField('debtsCondo', 'type', t)}
                                onChange={v => handleUpdateField('debtsCondo', 'value', v)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}

            {/* Custom Expenses Section */}
            <tr className="bg-brand-bg">
              <td colSpan={3} className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-brand-ink/60 flex items-center justify-between">
                Outras Despesas Personalizadas
                <button 
                  type="button"
                  onClick={handleAddCustomExpense}
                  className="flex items-center gap-1 text-[10px] text-brand-primary hover:underline"
                >
                  <Plus size={12} /> Adicionar Despesa
                </button>
              </td>
            </tr>
            {(simulationData.customExpenses || []).map((exp: any, index: number) => (
              <tr key={index} className="border-b border-brand-primary/5 hover:bg-brand-bg/10 transition-colors group">
                <td className="py-4 px-6 text-sm font-medium text-brand-ink/60 flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleRemoveCustomExpense(index)}
                    className="p-1 text-red-400 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                  <input 
                    type="text"
                    value={exp.label}
                    onChange={(e) => handleUpdateCustomExpense(index, 'label', e.target.value)}
                    className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium w-full"
                  />
                </td>
                <td className="py-2 px-6 text-right">
                  <CompactSimulationInput 
                    label={exp.label}
                    value={exp.value}
                    type={exp.type}
                    onTypeChange={t => handleUpdateCustomExpense(index, 'type', t)}
                    onChange={v => handleUpdateCustomExpense(index, 'value', v)}
                  />
                </td>
                <td className="py-4 px-6 text-xs text-black/40 italic">Personalizado</td>
              </tr>
            ))}
          <tr 
            className="bg-brand-primary/5 cursor-pointer hover:bg-brand-primary/10 transition-colors"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            <td className="py-6 px-6 text-sm font-bold text-brand-primary flex items-center gap-2">
              {showBreakdown ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronDown size={16} className="transition-transform" />}
              Custo Total de Aquisição
            </td>
            <td className="py-6 px-6 text-right text-lg font-bold text-brand-primary">{format(assetCost)}</td>
            <td className="py-6 px-6 text-[10px] text-brand-primary/60 italic flex items-center gap-1">
              Lance + Despesas
              <span title="O valor total que o imóvel custará ao final do processo (Lance + todas as taxas e reformas).">
                <Info size={10} />
              </span>
            </td>
          </tr>
          {interestDuringHolding > 0 && (
            <tr className="border-b border-brand-primary/5 bg-red-500/10">
              <td className="py-3 px-6 text-[10px] font-bold uppercase tracking-widest text-red-600">
                Custo Financeiro ({holdingMonths} meses)
              </td>
              <td className="py-3 px-6 text-right text-sm font-bold text-red-600">{format(interestDuringHolding)}</td>
              <td className="py-3 px-6 text-[10px] text-red-600/90 italic">
                Juros do período
              </td>
            </tr>
          )}

          <AnimatePresence>
            {showBreakdown && (
              <tr>
                <td colSpan={3} className="p-0">
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-brand-bg/20"
                  >
                    <div className="p-6 space-y-4 border-t border-brand-primary/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        <div className="space-y-2">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-brand-primary/60 mb-2">Aquisição e Impostos</h5>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Valor da Arrematação</span>
                            <span className="font-bold text-brand-ink/80">{format(simulationData.bid?.value || 0)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Comissão Leiloeiro ({simulationData.commission?.value || 0}%)</span>
                            <span className="font-bold text-brand-ink/80">{format(getVal(simulationData.commission))}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>ITBI ({simulationData.itbi?.value || 0}%)</span>
                            <span className="font-bold text-brand-ink/80">{format(getVal(simulationData.itbi))}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Custos Registro</span>
                            <span className="font-bold text-brand-ink/80">{format(getVal(simulationData.costs))}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Custos Jurídicos</span>
                            <span className="font-bold text-brand-ink/80">{format(getVal(simulationData.legalFees))}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-brand-primary/60 mb-2">Manutenção e Serviços</h5>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Débitos Acumulados</span>
                            <span className="font-bold text-brand-ink/80">{format(getVal(simulationData.debts))}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Reformas/Desocupação</span>
                            <span className="font-bold text-brand-ink/80">{format(getVal(simulationData.renovation))}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Condomínio/IPTU (Desocupação)</span>
                            <span className="font-bold text-brand-ink/80">{format(getVal(simulationData.holdingCosts))}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Assessoria TJ INVEST ({simulationData.assessoria?.value || 0}%)</span>
                            <span className="font-bold text-brand-primary">{format(getVal(simulationData.assessoria))}</span>
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-ink/40">
                            <span>Entrada TJ INVEST</span>
                            <span className="font-bold text-brand-primary">{format(getVal(simulationData.entrada))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </td>
              </tr>
            )}
          </AnimatePresence>

          <tr className="bg-brand-bg border-t border-brand-border">
            <td className="py-4 px-6 text-sm font-bold text-brand-ink/60">Custo Total da Operação</td>
            <td className="py-4 px-6 text-right text-sm font-bold text-brand-ink/80">{format(totalInvestment)}</td>
            <td className="py-4 px-6 text-[10px] text-brand-ink/40 italic">Lance + Juros + Despesas</td>
          </tr>

          <tr className="bg-brand-primary/10">
            <td className="py-6 px-6 text-sm font-bold text-brand-primary">Aporte Inicial Necessário (Cash Out)</td>
            <td className="py-6 px-6 text-right text-lg font-bold text-brand-primary">{format(tableInitialCash)}</td>
            <td className="py-6 px-6 text-[10px] text-brand-primary/60 italic flex items-center gap-1">
              Entrada + Despesas
              <span title="O dinheiro que você precisa desembolsar agora (Entrada + todas as taxas e reformas).">
                <Info size={10} />
              </span>
            </td>
          </tr>
          <tr className="bg-emerald-500/10 border-t border-emerald-500/20">
            <td className="py-6 px-6 text-sm font-bold text-emerald-600">Lucro Líquido Estimado</td>
            <td className="py-6 px-6 text-right text-lg font-bold text-emerald-600">{format(grossProfit)}</td>
            <td className="py-6 px-6 text-xs font-bold text-emerald-600 uppercase tracking-widest">
              <div className="flex flex-col items-end">
                <span>ROI ESTIMADO</span>
                <span className="text-xl">{roi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

      {/* Scenario Comparison Section */}
      <div className="bg-brand-bg/30 p-8 border-t border-brand-border">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-primary" />
            Comparativo de Cenários (Venda)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conservador */}
          <div className="p-6 rounded-2xl border border-brand-border/30 bg-brand-bg/20">
            <div className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest mb-4">Cenário Conservador</div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-brand-ink/60">Venda (-10%)</span>
                <span className="font-bold text-brand-ink/80">{format((simulationData.saleValue?.value || 0) * 0.9)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-ink/60">Prazo (+6 meses)</span>
                <span className="font-bold text-brand-ink/80">{holdingMonths + 6} meses</span>
              </div>
              <div className="pt-3 border-t border-brand-border/30 flex justify-between items-end">
                <div className="text-[9px] font-bold text-brand-ink/30 uppercase">ROI Est.</div>
                <div className="text-lg font-bold text-brand-ink/80">
                  {(((((simulationData.saleValue?.value || 0) * 0.9) - finalTotal) / totalInvestment) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Atual (Base) */}
          <div className="p-6 rounded-2xl border-2 border-brand-primary/20 bg-brand-primary/5 shadow-sm">
            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-4">Cenário Base (Atual)</div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-brand-ink/60">Venda</span>
                <span className="font-bold text-brand-ink/80">{format(simulationData.saleValue?.value || 0)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-ink/60">Prazo</span>
                <span className="font-bold text-brand-ink/80">{holdingMonths} meses</span>
              </div>
              <div className="pt-3 border-t border-brand-primary/20 flex justify-between items-end">
                <div className="text-[9px] font-bold text-brand-primary uppercase">ROI Est.</div>
                <div className="text-lg font-bold text-brand-primary">
                  {roi.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Otimista */}
          <div className="p-6 rounded-2xl border border-brand-border/30 bg-brand-bg/20">
            <div className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest mb-4">Cenário Otimista</div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-brand-ink/60">Venda (+10%)</span>
                <span className="font-bold text-brand-ink/80">{format((simulationData.saleValue?.value || 0) * 1.1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-brand-ink/60">Prazo (-4 meses)</span>
                <span className="font-bold text-brand-ink/80">{Math.max(1, holdingMonths - 4)} meses</span>
              </div>
              <div className="pt-3 border-t border-brand-border/30 flex justify-between items-end">
                <div className="text-[9px] font-bold text-brand-ink/30 uppercase">ROI Est.</div>
                <div className="text-lg font-bold text-brand-ink/80">
                  {(((((simulationData.saleValue?.value || 0) * 1.1) - finalTotal) / totalInvestment) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Strategy Comparison Section */}
      <div className="bg-brand-bg/30 p-8 border-t border-brand-border">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-primary" />
            Estratégia de Pagamento (À Vista vs Parcelado)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* À Vista */}
          {(() => {
            const scenario = calculateScenario(100);
            return (
              <div className={cn(
                "p-6 rounded-2xl border transition-all",
                downPaymentPercent >= 100 ? "border-brand-primary/20 bg-brand-primary/5 shadow-sm" : "border-brand-border/30 bg-brand-bg/20"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">Pagamento À Vista</div>
                  {downPaymentPercent >= 100 && <span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase">Selecionado</span>}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-ink/60">Investimento Inicial</span>
                    <span className="font-bold text-brand-ink/80">{format(scenario.totalInvestment)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-ink/60">Custo Total</span>
                    <span className="font-bold text-brand-ink/80">{format(scenario.finalTotal)}</span>
                  </div>
                  <div className="pt-3 border-t border-brand-border/30 flex justify-between items-end">
                    <div className="text-[9px] font-bold text-brand-ink/30 uppercase">ROI Est.</div>
                    <div className="text-lg font-bold text-brand-ink/80">
                      {scenario.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Parcelado */}
          {(() => {
            const scenario = calculateScenario(25);
            return (
              <div className={cn(
                "p-6 rounded-2xl border transition-all",
                downPaymentPercent < 100 ? "border-brand-primary/20 bg-brand-primary/5 shadow-sm" : "border-brand-border/30 bg-brand-bg/20"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">Pagamento Parcelado (25% Entrada)</div>
                  {downPaymentPercent < 100 && <span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase">Selecionado</span>}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-ink/60">Investimento Inicial</span>
                    <span className="font-bold text-brand-ink/80">{format(scenario.totalInvestment)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-ink/60">Custo Total</span>
                    <span className="font-bold text-brand-ink/80">{format(scenario.finalTotal)}</span>
                  </div>
                  <div className="pt-3 border-t border-brand-border/30 flex justify-between items-end">
                    <div className="text-[9px] font-bold text-brand-ink/30 uppercase">ROI Est. (Alavancado)</div>
                    <div className="text-lg font-bold text-brand-ink/80">
                      {scenario.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Market Comparison Section */}
      <div className="bg-brand-bg/30 p-8 border-t border-brand-border">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-primary" />
            Comparativo de Mercado (Anualizado)
          </h4>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4 pb-2 border-b border-brand-border/30">
            <div className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/30">Investimento</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/30 text-right">Lucro (R$)</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/30 text-right">TIR (a.a.)</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/30 text-right">ROI (Total)</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/30 text-right">Prêmio</div>
          </div>
          
          {[
            { label: 'Este Imóvel (TJ INVEST)', profit: grossProfit, tir: calculateTIR(metrics), roi: roi, isPrimary: true },
            { label: 'Tesouro Direto (SELIC)', profit: (totalInvestment * (simulationData.comparisonData?.tesouro?.roi || 11.5) / 100), tir: simulationData.comparisonData?.tesouro?.tir || 11.5, roi: simulationData.comparisonData?.tesouro?.roi || 11.5 },
            { label: 'CDB (100% CDI)', profit: (totalInvestment * (simulationData.comparisonData?.cdb?.roi || 12.0) / 100), tir: simulationData.comparisonData?.cdb?.tir || 12.0, roi: simulationData.comparisonData?.cdb?.roi || 12.0 },
            { label: 'Poupança', profit: (totalInvestment * (simulationData.comparisonData?.poupanca?.roi || 6.5) / 100), tir: simulationData.comparisonData?.poupanca?.tir || 6.5, roi: simulationData.comparisonData?.poupanca?.roi || 6.5 },
            { label: 'Investimento em Aluguel', profit: (totalInvestment * (simulationData.comparisonData?.aluguel?.roi || 8.5) / 100), tir: simulationData.comparisonData?.aluguel?.tir || 8.5, roi: simulationData.comparisonData?.aluguel?.roi || 8.5 },
          ].map((row, idx) => (
            <div key={idx} className={cn(
              "grid grid-cols-5 gap-4 py-2 items-center transition-all",
              row.isPrimary ? "bg-brand-primary/10 rounded-xl px-4 -mx-4" : ""
            )}>
              <div className={cn("text-xs", row.isPrimary ? "font-bold text-brand-ink" : "text-brand-ink/60")}>{row.label}</div>
              <div className={cn("text-xs font-mono text-right", row.isPrimary ? "font-bold text-brand-primary" : "text-brand-ink/60")}>{format(row.profit)}</div>
              <div className={cn("text-xs font-mono text-right", row.isPrimary ? "font-bold text-brand-primary" : "text-brand-ink/60")}>{row.tir.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
              <div className={cn("text-xs font-mono text-right", row.isPrimary ? "font-bold text-brand-primary" : "text-brand-ink/60")}>{row.roi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
              <div className="text-right">
                {!row.isPrimary ? (
                  <span className="text-[10px] font-bold text-emerald-500">
                    +{ Math.max(0, calculateTIR(metrics) - row.tir).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) }%
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter">Target</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[9px] text-brand-ink/30 italic leading-relaxed">
          * O prêmio de risco representa o ganho adicional anualizado deste imóvel em relação aos ativos de renda fixa tradicionais.
        </p>
      </div>
    </div>
  );
}

function FinancialSummaryCard({ simulationData }: { simulationData: any }) {
  const metrics = calculateSimulationMetrics(simulationData);
  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="bg-brand-paper rounded-3xl border border-brand-border p-6 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Resumo Financeiro</h4>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-[9px] uppercase text-brand-ink/40">ROI</div>
                <div className="text-sm font-bold text-brand-primary">{metrics.roi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase text-brand-ink/40">TIR</div>
                <div className="text-sm font-bold text-brand-primary">{calculateTIR(metrics).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-brand-ink/60">Receitas (+)</span>
              <span className="font-bold text-emerald-600">{format(metrics.saleValue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-brand-ink/60">Despesas Operacionais (-)</span>
              <span className="font-bold text-red-500">{format(metrics.totalUpfrontExpenses)}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-brand-border pt-2">
              <span className="font-bold text-brand-ink">Resultado Operacional (=)</span>
              <span className="font-bold text-brand-ink">{format(metrics.saleValue - metrics.totalUpfrontExpenses)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-brand-ink/60">Despesas Pós-operacionais (-)</span>
              <span className="font-bold text-red-500">{format(metrics.totalPostOpExpenses)}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-brand-border pt-2">
              <span className="font-bold text-brand-primary">Resultado Líquido (=)</span>
              <span className="font-bold text-brand-primary">{format(metrics.netProfit)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-l border-brand-border pl-8">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Configuração da Tese</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-brand-ink/40">Estratégia</label>
              <div className="text-sm font-bold text-brand-ink capitalize">{simulationData.strategy || 'Venda'}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-brand-ink/40">Retorno Esperado (a.a.)</label>
              <div className="text-sm font-bold text-brand-ink">{simulationData.expectedReturn || 15}%</div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-brand-ink/40">Prazo Estimado</label>
              <div className="text-sm font-bold text-brand-ink">{simulationData.holdingMonths || 12} meses</div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-brand-ink/40">Forma de Pagamento</label>
              <div className="text-sm font-bold text-brand-ink">{simulationData.downPaymentPercent >= 100 ? 'À Vista' : 'Parcelado'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlossaryMarkdown({ content, onJumpToSimulation, simulationData, updateState, children }: { 
  content: string, 
  onJumpToSimulation?: () => void,
  simulationData?: any,
  updateState?: (s: any) => void,
  children?: React.ReactNode
}) {
  const processedContent = React.useMemo(() => {
    let text = content;

    // Dynamic Value Replacement Logic
    if (simulationData) {
      const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      const getVal = (field: any) => (field && field.type === 'BRL') ? (field.value || 0) : (field ? (simulationData.bid?.value || 0) * ((field.value || 0) / 100) : 0);
      
      const bid = simulationData.bid?.value || 0;
      const downPaymentPercent = simulationData.downPaymentPercent ?? 100;
      const interestRate = simulationData.interestRate ?? 0;
      const holdingMonths = simulationData.holdingMonths ?? 12;
      const installments = simulationData.installments ?? 1;
      
      const downPaymentAmount = bid * (downPaymentPercent / 100);
      const financedAmount = bid - downPaymentAmount;
      const monthlyRate = interestRate / 100 / 12;

      let installment = 0;
      if (monthlyRate > 0 && installments > 0) {
        installment = (financedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
      } else if (installments > 0) {
        installment = financedAmount / installments;
      }

      let remainingDebt = 0;
      if (holdingMonths < installments) {
        if (monthlyRate > 0) {
          remainingDebt = financedAmount * Math.pow(1 + monthlyRate, holdingMonths) - 
                          (installment * (Math.pow(1 + monthlyRate, holdingMonths) - 1)) / monthlyRate;
        } else {
          remainingDebt = financedAmount - (installment * holdingMonths);
        }
      }

      const totalPaidDuringHolding = installment * Math.min(holdingMonths, installments);
      const principalPaidDuringHolding = financedAmount - remainingDebt;
      const interestDuringHolding = Math.max(0, totalPaidDuringHolding - principalPaidDuringHolding);

      const otherExpenses = 
        getVal(simulationData.desocupacaoAcordo) + 
        getVal(simulationData.transfRegistro) + 
        getVal(simulationData.reforma) + 
        getVal(simulationData.comissaoLeiloeiro) + 
        getVal(simulationData.transfITBI) + 
        getVal(simulationData.assessoria) + 
        getVal(simulationData.entrada) +
        getVal(simulationData.desocupacaoHonorarios) +
        getVal(simulationData.despesasVenda) +
        getVal(simulationData.holdingCosts);

      const assetCost = bid + otherExpenses;
      const totalInvestment = downPaymentAmount + otherExpenses + totalPaidDuringHolding;
      const finalTotal = assetCost + interestDuringHolding;
      const profit = (simulationData.saleValue?.value || 0) - finalTotal;
      const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
      const tir = calculateTIR(bid, simulationData.saleValue?.value || 0, otherExpenses, downPaymentPercent, installments, interestRate, holdingMonths);

      const mappings = [
        { labels: ['avaliação', 'avaliado', 'valor de avaliação', 'valor avaliado'], value: simulationData.valuation?.value || 0 },
        { labels: ['arrematação', 'arrematado', 'lance', 'lance mínimo', 'valor de arrematação'], value: simulationData.bid?.value || 0 },
        { labels: ['venda', 'mercado', 'comercial', 'valor de venda', 'preço de venda'], value: simulationData.saleValue?.value || 0 },
        { labels: ['débitos', 'dívidas', 'total de débitos', 'pendências'], value: getVal(simulationData.desocupacaoAcordo) },
        { labels: ['reformas', 'reforma', 'custo de reforma'], value: getVal(simulationData.reforma) },
        { labels: ['custos', 'despesas', 'outros custos'], value: getVal(simulationData.transfRegistro) },
        { labels: ['lucro', 'resultado', 'lucro estimado', 'lucro líquido'], value: profit },
        { labels: ['itbi'], value: getVal(simulationData.transfITBI) },
        { labels: ['comissão', 'leiloeiro'], value: getVal(simulationData.comissaoLeiloeiro) },
        { labels: ['assessoria'], value: getVal(simulationData.assessoria) },
        { labels: ['jurídico', 'advogado', 'custos jurídicos'], value: getVal(simulationData.desocupacaoHonorarios) },
        { labels: ['extras', 'taxas extras'], value: getVal(simulationData.despesasVenda) },
        { labels: ['condomínio desocupação', 'iptu desocupação'], value: getVal(simulationData.holdingCosts) },
        { labels: ['custo total', 'investimento total'], value: assetCost },
      ];

      mappings.forEach(m => {
        m.labels.forEach(label => {
          // Match label followed by optional characters, then R$, then a number
          const regex = new RegExp(`(${label}[^R$]{0,50}R\\$\\s?)([\\d.,]+)`, 'gi');
          text = text.replace(regex, (match, p1) => {
            return p1 + format(m.value).replace('R$', '').trim();
          });
        });
      });

      // ROI Replacement
      const roiRegex = new RegExp(`(ROI[^\\d]*)([\\d.,]+)%`, 'gi');
      text = text.replace(roiRegex, (match, p1) => {
        return p1 + roi.toFixed(2).replace('.', ',') + '%';
      });

      // TIR Replacement
      const tirRegex = new RegExp(`(TIR[^\\d]*)([\\d.,]+)%`, 'gi');
      text = text.replace(tirRegex, (match, p1) => {
        return p1 + tir.toFixed(2).replace('.', ',') + '%';
      });
    }

    const sortedTerms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
    
    sortedTerms.forEach(term => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<!<[^>]*)\\b${escapedTerm}\\b(?![^<]*>)`, 'gi');
      text = text.replace(regex, match => `<span data-glossary="${term}">${match}</span>`);
    });

    const sortedFinancialTerms = Object.keys(FINANCIAL_TERMS).sort((a, b) => b.length - a.length);
    
    sortedFinancialTerms.forEach(term => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<!<[^>]*)\\b${escapedTerm}\\b(?![^<]*>)`, 'gi');
      text = text.replace(regex, match => `<span data-financial="${term}">${match}</span>`);
    });
    return text;
  }, [content, simulationData]);

  const components = React.useMemo(() => ({
    span: ({ node, children, ...props }: any) => {
      const termKey = props['data-glossary'] as string;
      const financialKey = props['data-financial'] as string;
      
      if (termKey) {
        return (
          <span 
            className="cursor-help border-b border-dotted border-brand-primary text-brand-primary font-semibold inline-block"
            title={GLOSSARY[termKey] || ''}
          >
            {children}
          </span>
        );
      }
      
      if (financialKey) {
        return (
          <span 
            className="cursor-pointer border-b border-dotted border-emerald-600 text-emerald-600 font-semibold inline-block hover:bg-emerald-50"
            onClick={() => {
              if (onJumpToSimulation) onJumpToSimulation();
              if (updateState) updateState({ highlightField: financialKey });
            }}
          >
            {children}
          </span>
        );
      }
      return <span {...props}>{children}</span>;
    },
    table: ({ children }: any) => {
      const getText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(getText).join(' ');
        if (node?.props?.children) return getText(node.props.children);
        return '';
      };
      
      const tableText = getText(children);
      
      // Keywords that indicate a simulation/investment table
      const simulationKeywords = [
        "Valor (R$)", "Valor Estimado", "Custo Total", "QUADRO RESUMO", 
        "RECEITA", "AQUISIÇÃO", "Lance Sugerido", "Comissão Leiloeiro", 
        "ITBI Estimado", "Valor de Mercado", "Valor de Avaliação", 
        "Débitos Acumulados", "Assessoria TJ INVEST", "Entrada TJ INVEST", 
        "Lucro Líquido", "ROI", "Investimento", "Custo de Aquisição",
        "Resumo de Investimento", "Quadro de Investimento", "Item", "Observação",
        "MASTER", "CATEGORIA", "DETALHAMENTO"
      ];
      
      const matchCount = simulationKeywords.filter(kw => {
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return regex.test(tableText);
      }).length;
      
      // If it looks like any financial analysis table, we use the Master Table logic
      const isFinancialTable = matchCount >= 2 || 
        tableText.includes("TJ INVEST") || 
        tableText.includes("MASTER") ||
        (tableText.includes("COMPARATIVO") && (tableText.includes("MERCADO") || tableText.includes("INVESTIMENTOS") || tableText.includes("CENÁRIOS"))) ||
        (tableText.includes("Cenário") && (tableText.includes("Disputa") || tableText.includes("Lance") || tableText.includes("ROI")));

      const extractTableData = (node: any): { headers: string[], rows: string[][] } => {
        const headers: string[] = [];
        const rows: string[][] = [];

        const getElementText = (n: any): string => {
          if (!n) return '';
          if (typeof n === 'string' || typeof n === 'number') return String(n);
          if (Array.isArray(n)) return n.map(getElementText).join('');
          if (n.props && n.props.children) return getElementText(n.props.children);
          return '';
        };

        const traverse = (curr: any) => {
          if (!curr) return;
          if (Array.isArray(curr)) {
            curr.forEach(traverse);
            return;
          }
          if (curr.type === 'thead') {
            const trs = Array.isArray(curr.props.children) ? curr.props.children : [curr.props.children];
            trs.forEach((tr: any) => {
              if (tr && tr.props && tr.props.children) {
                const ths = Array.isArray(tr.props.children) ? tr.props.children : [tr.props.children];
                ths.forEach((th: any) => {
                  headers.push(getElementText(th).trim());
                });
              }
            });
          } else if (curr.type === 'tbody') {
            const trs = Array.isArray(curr.props.children) ? curr.props.children : [curr.props.children];
            trs.forEach((tr: any) => {
              if (tr && tr.props && tr.props.children) {
                const cells: string[] = [];
                const tds = Array.isArray(tr.props.children) ? tr.props.children : [tr.props.children];
                tds.forEach((td: any) => {
                  cells.push(getElementText(td).trim());
                });
                if (cells.length > 0) {
                  rows.push(cells);
                }
              }
            });
          } else {
            if (curr.props && curr.props.children) {
              traverse(curr.props.children);
            }
          }
        };

        traverse(node);
        return { headers, rows };
      };

      if (isFinancialTable) {
        const parsedData = extractTableData(children);
        if (parsedData.rows.length > 0) {
          return (
            <div className="my-8 space-y-4 avoid-break">
              <div className="border-b-2 border-brand-primary/20 pb-3">
                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
                  📊 Quadro Resumo de Investimento (MASTER de Análise)
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedData.rows.map((row, idx) => {
                  let category = "Geral";
                  let item = "";
                  let value = "";
                  let detail = "";
                  
                  if (row.length >= 4) {
                    category = row[0];
                    item = row[1];
                    value = row[2];
                    detail = row[3];
                  } else if (row.length === 3) {
                    category = "Métrica";
                    item = row[0];
                    value = row[1];
                    detail = row[2];
                   } else if (row.length === 2) {
                    category = "Métrica";
                    item = row[0];
                    value = row[1];
                  } else {
                    item = row[0] || "";
                  }
                  
                  // Style highlights for important rows (receipts, totals, net profit, return rate)
                  const isHeadingRow = 
                    item.toLowerCase().includes('total') || 
                    item.toLowerCase().includes('lucro') || 
                    item.toLowerCase().includes('receita') || 
                    item.toLowerCase().includes('roi') || 
                    item.toLowerCase().includes('tir') || 
                    item.startsWith('**') && item.endsWith('**') ||
                    value.startsWith('**');
                    
                  const cleanItem = item.replace(/\*\*/g, '').trim();
                  const cleanValue = value.replace(/\*\*/g, '').trim();
                  const cleanDetail = detail.replace(/\*\*/g, '').trim();
                  const cleanCategory = category.replace(/\*\*/g, '').trim();

                  if (!cleanItem && !cleanValue) return null;

                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "rounded-2xl border p-4 shadow-sm flex flex-col justify-between gap-3 transition-all duration-300 avoid-break",
                        isHeadingRow 
                          ? "bg-brand-primary/5 border-brand-primary/35 shadow-brand-primary/5" 
                          : "bg-brand-paper border-brand-primary/10 hover:border-brand-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md font-sans",
                          isHeadingRow ? "bg-brand-primary/20 text-brand-primary" : "bg-brand-primary/10 text-brand-primary/80"
                        )}>
                          {cleanCategory}
                        </span>
                        <span className={cn(
                          "text-xs font-mono font-bold",
                          isHeadingRow ? "text-brand-primary text-sm font-black" : "text-brand-ink/90"
                        )}>
                          {cleanValue}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className={cn(
                          "text-[10px] sm:text-xs font-bold font-sans uppercase tracking-wide",
                          isHeadingRow ? "text-brand-primary" : "text-brand-ink/80"
                        )}>
                          {cleanItem}
                        </h5>
                        {cleanDetail && (
                          <p className="text-[10px] sm:text-xs text-brand-ink/50 leading-relaxed font-sans font-medium">
                            {cleanDetail}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      }

      return (
        <div className="my-8 overflow-x-auto rounded-2xl border border-brand-primary/10 shadow-sm max-w-full">
          <table className="w-full text-left border-collapse bg-brand-bg/20 min-w-[600px]">
            {children}
          </table>
        </div>
      );
    },
    thead: ({ children }: any) => <thead className="bg-brand-primary/5 text-brand-primary uppercase text-[10px] font-bold tracking-widest">{children}</thead>,
    th: ({ children }: any) => <th className="px-6 py-4 border-b border-brand-primary/10">{children}</th>,
    td: ({ children }: any) => <td className="px-6 py-4 border-b border-brand-primary/5 text-sm">{children}</td>,
    h1: ({ children }: any) => <h1 className="text-3xl font-serif font-bold text-brand-primary mt-12 mb-6 border-b border-brand-primary/10 pb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-serif font-bold text-brand-primary mt-10 mb-5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold text-brand-primary mt-8 mb-4">{children}</h3>,
    p: ({ children }: any) => <p className="mb-6 leading-relaxed text-brand-ink/80">{children}</p>,
    ul: ({ children }: any) => <ul className="mb-8 space-y-3 list-none">{children}</ul>,
    li: ({ children }: any) => (
      <li className="flex items-start gap-3">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
        <span className="text-brand-ink/80">{children}</span>
      </li>
    ),
  }), [simulationData, onJumpToSimulation]);

  // Reset the master table rendered flag before each render
  if (typeof window !== 'undefined') {
    (window as any)._masterTableRendered = false;
  }

  return (
    <SimulationContext.Provider value={{ simulationData, updateState: updateState || (() => {}), onJumpToSimulation: onJumpToSimulation || (() => {}) }}>
      {children}
    </SimulationContext.Provider>
  );
}

function MarketComparisonTable({ metrics, roi, simulationData, format }: { metrics: any, roi: number, simulationData: any, format: (val: number) => string }) {
  return null;
}

function InvestorsTabContent({ simulationData, report }: { simulationData: any, report: string }) {
  const { updateState } = React.useContext(SimulationContext);
  const [localData, setLocalData] = React.useState(simulationData);
  
  React.useEffect(() => {
    setLocalData(simulationData);
  }, [simulationData]);

  const handleSave = () => {
    updateState({ simulationData: localData });
  };

  if (!localData) return <div>Dados de simulação não disponíveis.</div>;
  
  let metrics;
  try {
    metrics = calculateSimulationMetrics(localData);
  } catch (e) {
    return <div>Erro ao calcular métricas.</div>;
  }
  
  const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  
  const tir = React.useMemo(() => {
    try {
      return calculateTIR(metrics);
    } catch (e) {
      console.error("Erro ao calcular TIR:", e);
      return 0;
    }
  }, [metrics]);
  const roi = metrics.roi || 0;

  // Extract a summary from the report if possible
  const summary = React.useMemo(() => {
    if (!report || report.trim() === '') return null;
    const sections = report.split(/#+\s+/);
    const summarySection = sections.find(s => 
      s.toLowerCase().includes('resumo') || 
      s.toLowerCase().includes('conclusão') || 
      s.toLowerCase().includes('veredito')
    );
    if (summarySection) {
      const content = summarySection.split('\n').slice(1).join('\n').trim();
      if (content) return content;
    }
    const fallback = report.split('\n').slice(0, 10).join('\n').trim();
    return fallback || null;
  }, [report]);

  const handleUpdate = (key: string, value: number) => {
    setLocalData((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], value: isNaN(value) ? 0 : value }
    }));
  };

  const costFields = [
    { key: 'saleValue', label: 'Valor de Venda' },
    { key: 'bid', label: 'Valor da Arrematação' },
    { key: 'comissaoLeiloeiro', label: 'Comissão Leiloeiro (%)' },
    { key: 'transfITBI', label: 'ITBI (%)' },
    { key: 'transfRegistro', label: 'Registro/Escritura (%)' },
    { key: 'assessoria', label: 'Assessoria (%)' },
    { key: 'entrada', label: 'Entrada Assessoria (R$)' },
    { key: 'posIR', label: 'Imposto de Renda (%)' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-brand-paper p-8 rounded-3xl border border-brand-border shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-ink">Editar Custos e Valores</h4>
            <p className="text-xs text-brand-ink/50 mt-1">Ajuste os parâmetros para recalcular a simulação.</p>
          </div>
          <button 
            onClick={handleSave}
            className="px-6 py-3 bg-brand-primary text-black text-xs font-bold rounded-xl hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20"
          >
            Salvar Alterações
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {costFields.map(field => (
            <div key={field.key} className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-brand-ink/40 uppercase">{field.label}</label>
              <input 
                type="number" 
                value={localData[field.key]?.value ?? 0} 
                onChange={e => handleUpdate(field.key, parseFloat(e.target.value))} 
                className="p-4 border border-brand-border rounded-xl bg-brand-bg focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium" 
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/20 rounded-xl text-brand-primary">
              <TrendingUp size={20} />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">Retorno Estimado</h4>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-brand-primary">{format(metrics.netProfit)}</div>
            <div className="text-[10px] text-brand-ink/40 uppercase font-medium">Lucro Líquido Projetado</div>
          </div>
        </div>

        <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <Percent size={20} />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">Rentabilidade (ROI)</h4>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-emerald-600">{roi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
            <div className="text-[10px] text-brand-ink/40 uppercase font-medium">Retorno sobre Investimento</div>
          </div>
        </div>

        <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Clock size={20} />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">Taxa Interna (TIR)</h4>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-indigo-600">{tir.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
            <div className="text-[10px] text-brand-ink/40 uppercase font-medium">Taxa Interna de Retorno (a.a.)</div>
          </div>
        </div>
      </div>

      <MarketComparisonTable metrics={metrics} roi={roi} simulationData={simulationData} format={format} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-brand-paper rounded-3xl border border-brand-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-brand-border bg-brand-bg/30">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">Estrutura de Investimento</h4>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-brand-border/50">
              <span className="text-sm text-brand-ink/60">Valor de Venda Estimado</span>
              <span className="text-sm font-bold text-brand-ink">{format(metrics.saleValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-brand-border/50">
              <span className="text-sm text-brand-ink/60">Custo de Arrematação</span>
              <span className="text-sm font-bold text-brand-ink">{format(metrics.bid)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-brand-border/50">
              <span className="text-sm text-brand-ink/60">Total de Custos e Despesas</span>
              <span className="text-sm font-bold text-red-600">{format(metrics.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center py-4 bg-brand-primary/5 px-4 -mx-4 mt-4">
              <span className="text-sm font-bold text-brand-primary uppercase tracking-wider">Investimento Total</span>
              <span className="text-lg font-bold text-brand-primary">{format(metrics.totalInvestment)}</span>
            </div>
          </div>
        </div>

        <div className="bg-brand-paper rounded-3xl border border-brand-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-brand-border bg-brand-bg/30">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">Detalhamento de Custos</h4>
          </div>
          <div className="p-6 space-y-3">
            {[
              { label: 'Comissão do Leiloeiro', value: metrics.comissaoLeiloeiro },
              { label: 'ITBI e Registro', value: metrics.transferencia },
              { label: 'Débitos do Imóvel', value: metrics.desocupacao },
              { label: 'Reforma e Desocupação', value: metrics.reforma },
              { label: 'Custos de Carregamento', value: metrics.holdingCosts },
              { label: 'Assessoria TJ INVEST', value: metrics.assessoria },
            ].filter(c => c.value > 0).map((cost, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-brand-ink/60">{cost.label}</span>
                <span className="font-medium text-brand-ink/80">{format(cost.value)}</span>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t border-brand-border flex justify-between items-center">
              <span className="text-sm font-bold text-brand-ink">Total de Despesas</span>
              <span className="text-sm font-bold text-brand-ink">{format(metrics.totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-paper text-brand-ink rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-6">Resumo Executivo para Investidor</h4>
          <div className="prose prose-invert max-w-none">
            {summary ? (
              <div className="text-lg leading-relaxed text-white/80 markdown-body !text-white/80">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-white/80">
                O investimento projetado para este ativo é de <span className="text-brand-primary font-bold">{format(metrics?.totalInvestment || 0)}</span>, 
                com uma expectativa de lucro líquido de <span className="text-brand-primary font-bold">{format(metrics?.netProfit || 0)}</span> após todos os custos e impostos.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ponto de Equilíbrio (Break-even)</div>
                <div className="text-xl font-bold">{format(metrics.totalInvestment)}</div>
                <p className="text-xs text-white/60">Valor mínimo de venda para não haver prejuízo.</p>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Margem de Segurança</div>
                <div className="text-xl font-bold">{((metrics.saleValue - metrics.totalInvestment) / metrics.saleValue * 100).toFixed(1)}%</div>
                <p className="text-xs text-white/60">Percentual que o valor de venda pode cair antes de atingir o break-even.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const getPlainText = (children: any): string => {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getPlainText).join(' ');
  if (children.props && children.props.children) return getPlainText(children.props.children);
  return '';
};

const isRiskOrWarning = (text: string): boolean => {
  const lowercase = text.toLowerCase();
  return (
    lowercase.includes('risco') ||
    lowercase.includes('nulidade') ||
    lowercase.includes('irregularidade') ||
    lowercase.includes('suspens') ||
    lowercase.includes('perigo') ||
    lowercase.includes('alerta') ||
    lowercase.includes('atenção') ||
    lowercase.includes('bloqueio') ||
    lowercase.includes('cancelamento') ||
    lowercase.includes('embargos') ||
    lowercase.includes('impugna')
  );
};

const reportComponents = {
  h1: ({node, ...props}: any) => {
    const text = getPlainText(props.children);
    if (/extração de dados|extracao de dados|dados extraídos|dados extraidos/i.test(text)) {
      return null;
    }
    return <h1 className="text-3xl font-bold text-brand-primary mb-6 mt-8" {...props} />;
  },
  h2: ({node, ...props}: any) => {
    const text = getPlainText(props.children);
    if (/extração de dados|extracao de dados|dados extraídos|dados extraidos/i.test(text)) {
      return null;
    }
    if (isRiskOrWarning(text)) {
      return (
        <div className="my-6 p-6 bg-red-500/10 border-l-4 border-red-500 rounded-r-2xl flex items-start gap-4">
          <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-red-500 mb-0 mt-0" {...props} />
          </div>
        </div>
      );
    }
    return <h2 className="text-2xl font-bold text-brand-primary mb-4 mt-6" {...props} />;
  },
  h3: ({node, ...props}: any) => {
    const text = getPlainText(props.children);
    if (/extração de dados|extracao de dados|dados extraídos|dados extraidos/i.test(text)) {
      return null;
    }
    if (isRiskOrWarning(text)) {
      return (
        <div className="my-5 p-5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-amber-500 mb-0 mt-0" {...props} />
          </div>
        </div>
      );
    }
    return <h3 className="text-xl font-bold text-brand-primary mb-3 mt-4" {...props} />;
  },
  p: ({node, ...props}: any) => {
    const text = getPlainText(props.children);
    const lowercase = text.toLowerCase();
    if (lowercase.startsWith('alerta:') || lowercase.startsWith('risco:') || lowercase.startsWith('perigo:') || (isRiskOrWarning(text) && (lowercase.includes('alto risco') || lowercase.includes('risco alto') || lowercase.includes('anulação') || lowercase.includes('cancelamento')))) {
      return (
        <p className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 font-medium leading-relaxed mb-4 rounded-xl flex items-start gap-2">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <span>{props.children}</span>
        </p>
      );
    }
    return <p className="text-brand-ink/80 leading-relaxed mb-4" {...props} />;
  },
  table: ({ children, ...props }: any) => {
    const getText = (node: any): string => {
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(getText).join(' ');
      if (node?.props?.children) return getText(node.props.children);
      return '';
    };
    
    const tableText = getText(children);
    
    const simulationKeywords = [
      "Valor (R$)", "Valor Estimado", "Custo Total", "QUADRO RESUMO", 
      "RECEITA", "AQUISIÇÃO", "Lance Sugerido", "Comissão Leiloeiro", 
      "ITBI Estimado", "Valor de Mercado", "Valor de Avaliação", 
      "Débitos Acumulados", "Assessoria TJ INVEST", "Entrada TJ INVEST", 
      "Lucro Líquido", "ROI", "Investimento", "Custo de Aquisição",
      "Resumo de Investimento", "Quadro de Investimento", "Item", "Observação",
      "MASTER", "CATEGORIA", "DETALHAMENTO"
    ];
    
    const matchCount = simulationKeywords.filter(kw => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return regex.test(tableText);
    }).length;
    
    const isFinancialTable = matchCount >= 2 || 
      tableText.includes("TJ INVEST") || 
      tableText.includes("MASTER") ||
      tableText.includes("Quadro de Investimento") ||
      tableText.includes("Quadro Resumo") ||
      (tableText.includes("COMPARATIVO") && (tableText.includes("MERCADO") || tableText.includes("INVESTIMENTOS") || tableText.includes("CENÁRIOS"))) ||
      (tableText.includes("Cenário") && (tableText.includes("Disputa") || tableText.includes("Lance") || tableText.includes("ROI")));

    if (isFinancialTable) {
      const getElementText = (n: any): string => {
        if (!n) return '';
        if (typeof n === 'string' || typeof n === 'number') return String(n);
        if (Array.isArray(n)) return n.map(getElementText).join('');
        if (n.props && n.props.children) return getElementText(n.props.children);
        return '';
      };

      const headers: string[] = [];
      const rows: string[][] = [];

      const traverse = (curr: any) => {
        if (!curr) return;
        if (Array.isArray(curr)) {
          curr.forEach(traverse);
          return;
        }
        if (curr.type === 'thead') {
          const trs = Array.isArray(curr.props.children) ? curr.props.children : [curr.props.children];
          trs.forEach((tr: any) => {
            if (tr && tr.props && tr.props.children) {
              const ths = Array.isArray(tr.props.children) ? tr.props.children : [tr.props.children];
              ths.forEach((th: any) => {
                headers.push(getElementText(th).trim());
              });
            }
          });
        } else if (curr.type === 'tbody') {
          const trs = Array.isArray(curr.props.children) ? curr.props.children : [curr.props.children];
          trs.forEach((tr: any) => {
            if (tr && tr.props && tr.props.children) {
              const cells: string[] = [];
              const tds = Array.isArray(tr.props.children) ? tr.props.children : [tr.props.children];
              tds.forEach((td: any) => {
                cells.push(getElementText(td).trim());
              });
              if (cells.length > 0) {
                rows.push(cells);
              }
            }
          });
        } else {
          if (curr.props && curr.props.children) {
            traverse(curr.props.children);
          }
        }
      };

      traverse(children);

      if (rows.length > 0) {
        return (
          <div className="my-8 space-y-4 avoid-break">
            <div className="border-b-2 border-brand-primary/20 pb-2">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
                📊 Quadro Resumo de Investimento (MASTER de Análise)
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((row, idx) => {
                let category = "Métrica";
                let item = "";
                let value = "";
                let detail = "";
                
                if (row.length >= 4) {
                  category = row[0];
                  item = row[1];
                  value = row[2];
                  detail = row[3];
                } else if (row.length === 3) {
                  category = "Métrica";
                  item = row[0];
                  value = row[1];
                  detail = row[2];
                } else if (row.length === 2) {
                  category = "Métrica";
                  item = row[0];
                  value = row[1];
                } else {
                  item = row[0] || "";
                }
                
                const isHeadingRow = 
                  item.toLowerCase().includes('total') || 
                  item.toLowerCase().includes('lucro') || 
                  item.toLowerCase().includes('receita') || 
                  item.toLowerCase().includes('roi') || 
                  item.toLowerCase().includes('tir') || 
                  item.startsWith('**') && item.endsWith('**') ||
                  value.startsWith('**');
                  
                const cleanItem = item.replace(/\*\*/g, '').trim();
                const cleanValue = value.replace(/\*\*/g, '').trim();
                const cleanDetail = detail.replace(/\*\*/g, '').trim();
                const cleanCategory = category.replace(/\*\*/g, '').trim();

                if (!cleanItem && !cleanValue) return null;

                return (
                  <div 
                    key={idx} 
                    className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between gap-2 transition-all duration-300 avoid-break ${
                      isHeadingRow 
                        ? 'bg-brand-primary/5 border-brand-primary/30 shadow-sm shadow-brand-primary/5' 
                        : 'bg-brand-paper border-brand-primary/10 hover:border-brand-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md font-sans ${
                        isHeadingRow ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-primary/10 text-brand-primary/80'
                      }`}>
                        {cleanCategory}
                      </span>
                      <span className={`text-xs font-mono font-bold ${
                        isHeadingRow ? 'text-brand-primary text-sm font-black' : 'text-brand-ink/90'
                      }`}>
                        {cleanValue}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <h5 className={`text-[10px] sm:text-xs font-bold font-sans uppercase tracking-wide ${
                        isHeadingRow ? 'text-brand-primary font-bold' : 'text-brand-ink/80'
                      }`}>
                        {cleanItem}
                      </h5>
                      {cleanDetail && (
                        <p className="text-[10px] sm:text-xs text-brand-ink/50 leading-relaxed font-sans font-medium">
                          {cleanDetail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    return (
      <div className="overflow-x-auto my-6 rounded-2xl border border-brand-primary/10 shadow-sm max-w-full">
        <table className="min-w-full divide-y divide-brand-border" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th: ({node, ...props}: any) => <th className="px-4 py-3 bg-brand-bg/50 text-left text-xs font-bold text-brand-primary uppercase tracking-wider" {...props} />,
  td: ({node, ...props}: any) => <td className="px-4 py-3 text-sm text-brand-ink/90 border-t border-brand-border" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-bold text-brand-primary" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc list-inside mb-4 space-y-2 text-brand-ink/80" {...props} />,
  li: ({node, ...props}: any) => <li className="ml-4" {...props} />,
  pre: ({node, ...props}: any) => null,
  code: ({node, inline, ...props}: any) => {
    if (!inline) return null;
    return <code className="bg-brand-bg px-2 py-0.5 rounded text-amber-500 font-mono text-sm" {...props} />;
  }
};

function MasterReportView({ 
  state, 
  setState, 
  property, 
  metrics, 
  tir, 
  roi,
  token
}: { 
  state: any, 
  setState: React.Dispatch<React.SetStateAction<any>>,
  property?: Property,
  metrics: any,
  tir: number,
  roi: number,
  token: string
}) {
  const { processStory, isGeneratingStory, isEditingStory } = state;

  const [activeInstaTab, setActiveInstaTab] = useState<'video' | 'post'>('video');
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [isGeneratingInsta, setIsGeneratingInsta] = useState(false);

  const handleCopyInsta = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInsta(true);
    setTimeout(() => setCopiedInsta(false), 2000);
  };

  const handleForceGenerateInsta = async () => {
    if (!processStory?.full_story) {
      alert("Por favor, certifique-se de que a história do processo está disponível.");
      return;
    }
    setIsGeneratingInsta(true);
    try {
      const promptText = `Gere do zero um roteiro de vídeo (Instagram Reels/Stories) de prospecção e uma cópia de post de feed para o Instagram.
O público-alvo são médicos, empresários, investidores de alto padrão ou famílias que desejam morar bem pagando barato, mas que NÃO têm tempo para estudar leilões, NÃO desejam lidar com as burocracias pesadas e complexas do judiciário, e querem total comodidade, delegando tudo para profissionais.

DIRETRIZ DE DESENVOLVIMENTO (ESTRATÉGIA DAS 4 IMPRESSÕES PARA VIRALIZAR):
Adapte o conteúdo das copys do Reels e do Feed para despertar simultaneamente estes 4 sentimentos no espectador premium:
1. "Isso é muito eu" (Identificação imediata da rotina/dor): O espectador se identifica com a falta de tempo, o estresse da rotina e o cansaço mental de querer investir sem ter tempo sequer para ler um edital.
2. "Isso é muito você" (Caracterização direta de frustração/sonho): Toque direto na dor dele: "Você sonha em adquirir excelentes imóveis com até 50% de desconto mas desiste ou se assusta toda vez que olha para um edital burocrático de 40 páginas."
3. "Isso é muito verdade" (Sinceridade e autoridade nua e crua): Seja honesto ao revelar que leilão NÃO é dinheiro fácil. Diga que sem profissionais especializados (como a equipe da TJ INVEST) o risco de perder dinheiro é real, mostrando as dores e pegadinhas reais do processo em análise.
4. "Isso eu consigo fazer" (Praticidade total por delegação): Deixe claro que para colocar isso em prática ele NÃO precisa adquirir cursos ou estudar leis, mas sim delegar a operação total: "Isso eu consigo realizar de forma impecável: apenas agendando uma reunião com a equipe da TJ INVEST para que eles analisem, arrematem e cuidem de tudo por mim."

- NÃO dê dicas educativas de como o espectador fazer isso "sozinho".
- NÃO foque em ensinar conteúdo. Foque em gerar desejo, comodidade e alertar sobre os riscos graves que apenas especialistas sabem contornar.
- Posicione a Assessoria TJ INVEST como a solução definitiva fim-a-fim ("turnkey"): desde a triagem minuciosa de riscos do processo, simulação de lucros, lances no leilão, defesa em recursos pós-arrematação, até a desocupação rápida amigável e entrega das chaves prontas na mão.
- O roteiro deve ter um gancho eletrizante baseado nos lucros ou desconto real deste caso específico, revelar riscos processuais superados e finalizar com uma forte chamada para ação (CTA) direcionando o investidor para agendar uma reunião de assessoria com a TJ INVEST.

Baseie-se estritamente na história e análise deste caso de leilão:
${processStory.full_story}

Responda APENAS um objeto JSON válido, sem aspas adicionais, sem bloco de código markdown, com as chaves "video_script" e "feed_post" exatamente. Exemplo de retorno esperado: {"video_script": "...", "feed_post": "..."}`;
      const responseText = await sendChatMessage(
        [{ role: 'user', content: promptText }],
        "Você é um copywriter de marketing e vendas sênior e altamente estratégico, focado em atrair clientes de alto padrão para delegar o processo completo de leilão de imóveis para a assessoria premium de ponta a ponta da TJ INVEST.",
        state.selectedModel || "gemini-2.5-flash",
        state.userApiKey || undefined
      );

      const firstCurly = responseText.indexOf('{');
      const lastCurly = responseText.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1) {
        const jsonStr = responseText.substring(firstCurly, lastCurly + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed.video_script || parsed.feed_post) {
          const updatedInstaContent = {
            video_script: parsed.video_script || "",
            feed_post: parsed.feed_post || ""
          };

          setState((prev: any) => ({
            ...prev,
            processStory: {
              ...prev.processStory,
              instagram_content: updatedInstaContent
            }
          }));

          // Auto-save to database to persist this generated content
          if (property?.id) {
            try {
              const res = await fetch(`/api/process-stories/${property.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              let existing = null;
              if (res.ok) {
                existing = await parseJsonResponse(res);
              }
              
              if (existing) {
                await fetch(`/api/process-stories/${existing.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                    full_story: processStory.full_story,
                    legal_glossary: processStory.legal_glossary,
                    timeline_json: JSON.stringify({
                      timeline: processStory.timeline || [],
                      instagram_content: updatedInstaContent
                    })
                  })
                });
              } else {
                await fetch('/api/process-stories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                    property_id: property.id,
                    full_story: processStory.full_story,
                    legal_glossary: processStory.legal_glossary,
                    timeline_json: JSON.stringify({
                      timeline: processStory.timeline || [],
                      instagram_content: updatedInstaContent
                    })
                  })
                });
              }
              console.log("DEBUG: Instagram content saved successfully after generation.");
            } catch (saveErr) {
              console.error("Erro ao salvar instagram_content no banco:", saveErr);
            }
          }
        }
      } else {
        throw new Error("Formato inválido de JSON recebido do Gemini");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar roteiros. Verifique as chaves e tente novamente.");
    } finally {
      setIsGeneratingInsta(false);
    }
  };

  const handleSaveStory = async () => {
    if (!property?.id || !processStory) return;
    try {
      const res = await fetch(`/api/process-stories/${property.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let existing = null;
      if (res.ok) {
        existing = await parseJsonResponse(res);
      }
      
      if (existing) {
        await fetch(`/api/process-stories/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            full_story: processStory.full_story,
            legal_glossary: processStory.legal_glossary,
            timeline_json: JSON.stringify({
              timeline: processStory.timeline || [],
              instagram_content: processStory.instagram_content || null
            })
          })
        });
      } else {
        await fetch('/api/process-stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            property_id: property.id,
            full_story: processStory.full_story,
            legal_glossary: processStory.legal_glossary,
            timeline_json: JSON.stringify({
              timeline: processStory.timeline || [],
              instagram_content: processStory.instagram_content || null
            })
          })
        });
      }
      setState((prev: any) => ({ ...prev, isEditingStory: false }));
      alert("Relatório Master salvo com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar relatório.");
    }
  };

  if (isGeneratingStory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-brand-primary mb-2">Construindo a História do Processo</h3>
          <p className="text-brand-ink/40 text-sm">Lendo documentos, identificando marcos e traduzindo termos jurídicos...</p>
        </div>
      </div>
    );
  }

  if (!processStory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary">
          <BookOpen size={40} />
        </div>
        <div className="max-w-md">
          <h3 className="text-xl font-bold text-brand-primary mb-2">Relatório Master não gerado</h3>
          <p className="text-brand-ink/40 text-sm mb-8">Execute a análise IA para gerar a história completa do processo e o relatório detalhado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Repeating Watermark, Header and Footer for PDF/Print */}
      <div className="print-watermark hidden">
        TJ INVEST - Documento Confidencial
      </div>
      <div className="print-header hidden">
        <span>TJ INVEST Assessoria em Leilões</span>
        <span>Relatório de Análise Técnica</span>
      </div>
      <div className="print-footer hidden">
        <span>Emitido em: {new Date().toLocaleDateString('pt-BR')}</span>
        <span>Documento Confidencial - Uso Restrito</span>
      </div>

      {/* Executive Report Print Header */}
      <div className="hidden print:block print-only border-b-2 border-brand-primary pb-8 mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif font-bold text-brand-primary tracking-tight">TJ INVEST</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/60 font-bold">Relatório Consolidado de Análise e Leilão</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Data de Emissão</p>
            <p className="text-sm font-mono font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-[10px] uppercase font-bold text-black/40">Imóvel</p>
            <p className="font-bold text-lg">{property?.title || "Imóvel Sem Nome"}</p>
            <p className="text-black/60">{property?.address || ""}</p>
            <p className="text-black/60">{property?.city || ""}{property?.state ? ` - ${property.state}` : ""}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-black/40">Modalidade</p>
              <p className="font-mono font-bold text-black">{property?.modality || "Judicial"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-black/40">Área Privativa</p>
              <p className="font-mono font-bold text-black">{property?.area ? `${property.area} m²` : "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-black/40">ROI Previsto</p>
              <p className="font-bold text-green-600 font-mono">{roi.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-black/40">TIR Estimada</p>
              <p className="font-bold text-blue-600 font-mono">{tir.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header / Opportunity */}
      <section className="bg-brand-paper p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-brand-primary/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-black">
              <Star size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-primary">Oportunidade</h2>
              <p className="text-sm text-brand-ink/40">{property?.title || "Imóvel em Análise"}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-500/60 mb-1">ROI</p>
              <p className="text-xl font-bold text-green-500">{roi.toFixed(2)}%</p>
            </div>
            <div className="text-center px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500/60 mb-1">TIR</p>
              <p className="text-xl font-bold text-blue-500">{tir.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-brand-border bg-brand-paper shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg/50">
              <tr>
                <th className="px-6 py-4 font-bold text-brand-ink/60 uppercase text-[10px] tracking-widest">Métrica</th>
                <th className="px-6 py-4 font-bold text-brand-ink/60 uppercase text-[10px] tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              <tr>
                <td className="px-6 py-4 font-bold text-brand-ink/60 uppercase text-[10px] tracking-widest">Valor de Venda</td>
                <td className="px-6 py-4 font-bold text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saleValue || 0)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-brand-ink/60 uppercase text-[10px] tracking-widest text-brand-primary">Lance Máximo</td>
                <td className="px-6 py-4 font-bold text-right text-brand-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.bid || 0)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-brand-ink/60 uppercase text-[10px] tracking-widest">Prazo do Projeto</td>
                <td className="px-6 py-4 font-bold text-right">{state.simulationData?.holdingMonths || 12} meses</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold text-brand-ink/60 uppercase text-[10px] tracking-widest">Resultado Líquido</td>
                <td className="px-6 py-4 font-bold text-right text-green-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.netProfit || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* The Story */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 print-section-2">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-brand-primary flex items-center gap-3">
              <BookOpen size={24} />
              História do Processo
            </h3>
            <button 
              onClick={() => isEditingStory ? handleSaveStory() : setState((prev: any) => ({ ...prev, isEditingStory: true }))}
              className="p-2 hover:bg-brand-primary/10 rounded-xl text-brand-primary transition-all"
            >
              {isEditingStory ? <Save size={20} /> : <Edit size={20} />}
            </button>
          </div>
          
          {isEditingStory ? (
            <textarea 
              className="w-full bg-brand-paper border border-brand-primary/20 rounded-3xl p-8 min-h-[400px] focus:ring-2 focus:ring-brand-primary outline-none text-brand-ink"
              value={processStory.full_story}
              onChange={(e) => setState((prev: any) => ({ 
                ...prev, 
                processStory: { ...prev.processStory, full_story: e.target.value } 
              }))}
            />
          ) : (
            <div className="prose prose-brand max-w-none bg-brand-paper/30 p-8 rounded-3xl border border-brand-primary/5">
              <ReactMarkdown>{processStory.full_story}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h3 className="text-xl font-bold text-brand-primary flex items-center gap-3">
            <Scale size={20} />
            Glossário Jurídico
          </h3>
          {isEditingStory ? (
            <textarea 
              className="w-full bg-brand-paper border border-brand-primary/20 rounded-3xl p-6 min-h-[300px] focus:ring-2 focus:ring-brand-primary outline-none text-brand-ink text-sm"
              value={processStory.legal_glossary}
              onChange={(e) => setState((prev: any) => ({ 
                ...prev, 
                processStory: { ...prev.processStory, legal_glossary: e.target.value } 
              }))}
            />
          ) : (
            <div className="bg-brand-primary/5 p-6 rounded-3xl border border-brand-primary/10 text-sm">
              <ReactMarkdown>{processStory.legal_glossary}</ReactMarkdown>
            </div>
          )}

          <h3 className="text-xl font-bold text-brand-primary flex items-center gap-3 mt-12">
            <Clock size={20} />
            Linha do Tempo
          </h3>
          <div className="space-y-4">
            {processStory.timeline?.map((event: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-start group">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brand-primary mt-1.5" />
                  {idx < processStory.timeline.length - 1 && <div className="w-0.5 h-12 bg-brand-primary/20" />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{event.date}</p>
                  <p className="text-sm text-brand-ink/70 group-hover:text-brand-ink transition-colors">{event.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Analysis - Quick View */}
      <section className="bg-brand-paper/50 p-8 rounded-[2.5rem] border border-brand-primary/10 print-section-3">
        <h3 className="text-xl font-bold text-brand-primary mb-8 flex items-center gap-3">
          <TrendingUp size={20} />
          Fluxo de Caixa Estimado
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-primary/10">
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-brand-ink/30">Item</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 text-right">Valor</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 text-right">Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              <tr>
                <td className="py-4 text-sm">Valor de Venda</td>
                <td className="py-4 text-sm font-bold text-right text-green-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saleValue || 0)}
                </td>
                <td className="py-4 text-xs text-brand-ink/40 text-right">Mercado</td>
              </tr>
              <tr>
                <td className="py-4 text-sm">Lance (Investimento)</td>
                <td className="py-4 text-sm font-bold text-right text-red-500">
                  -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.bid || 0)}
                </td>
                <td className="py-4 text-xs text-brand-ink/40 text-right">Arrematação</td>
              </tr>
              <tr>
                <td className="py-4 text-sm">Custos Totais (Reforma, ITBI, etc)</td>
                <td className="py-4 text-sm font-bold text-right text-red-500">
                  -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalUpfrontExpenses || 0)}
                </td>
                <td className="py-4 text-xs text-brand-ink/40 text-right">Operacional</td>
              </tr>
              <tr className="bg-brand-primary/5">
                <td className="py-4 px-4 text-sm font-bold">Lucro Líquido Estimado</td>
                <td className="py-4 px-4 text-sm font-bold text-right text-green-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.netProfit || 0)}
                </td>
                <td className="py-4 px-4 text-xs text-brand-ink/40 text-right">Final</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InstagramMarketingView({
  state,
  setState,
  property,
  metrics,
  tir,
  roi,
  token
}: {
  state: any,
  setState: React.Dispatch<React.SetStateAction<any>>,
  property?: Property,
  metrics: any,
  tir: number,
  roi: number,
  token: string
}) {
  const { processStory, isGeneratingStory, isEditingStory } = state;

  const [activeInstaTab, setActiveInstaTab] = useState<'video' | 'post'>('video');
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [isGeneratingInsta, setIsGeneratingInsta] = useState(false);

  // Customization state for Instagram script generation
  const [targetAudience, setTargetAudience] = useState<'investor' | 'dwelling' | 'both'>('both');
  const [copyFramework, setCopyFramework] = useState<'AIDA' | 'PAS' | 'BAB' | 'HSO'>('HSO');
  const [videoDuration, setVideoDuration] = useState<'30' | '60' | '90'>('60');
  const [customBrief, setCustomBrief] = useState('');

  const handleCopyInsta = (text: string) => {
    let cleanText = text;
    if (activeInstaTab === 'video') {
      cleanText = cleanText
        // Remove markdown labels at the start of a line or after a newline, followed by an optional space/separator
        // For stage labels/brackets and custom labels (case-insensitive)
        .replace(/^\s*\*\*?(gancho|hook|story|história|historias|historia|desenvolvimento|oferta|offer|chamada para ação|chamada para acao|cta|introdução|introducao|fechamento|roteiro|fala|apresentador|narrador|dica|cena\s*\d+|scene\s*\d+)\*\*?\s*(:|:|-|—)?\s*/gmi, '')
        .replace(/\n\s*\*\*?(gancho|hook|story|história|historias|historia|desenvolvimento|oferta|offer|chamada para ação|chamada para acao|cta|introdução|introducao|fechamento|roteiro|fala|apresentador|narrador|dica|cena\s*\d+|scene\s*\d+)\*\*?\s*(:|:|-|—)?\s*/gmi, '\n')
        // General clean for any bold words at start of line followed by a colon or dash, e.g., **Apresentador**:
        .replace(/^\s*\*\*?[\w\sÀ-ÿ\-\(\)]+\*\*?\s*(:|:|-|—)\s*/gm, '')
        // Clean leftover bracket notations like [Cena 1] or [Música]
        .replace(/\[[^\]]+\]/g, '')
        // Clean parenthesized remarks like (sorrindo) or (aponta para tela)
        .replace(/\([^)]+\)/g, '')
        // Remove three or more newlines
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
    navigator.clipboard.writeText(cleanText);
    setCopiedInsta(true);
    setTimeout(() => setCopiedInsta(false), 2000);
  };

  const handleForceGenerateInsta = async () => {
    if (!processStory?.full_story) {
      alert("Por favor, certifique-se de que a história do processo está disponível.");
      return;
    }
    setIsGeneratingInsta(true);
    try {
      const frameworkDesc = {
        'AIDA': 'AIDA (Atenção, Interesse, Desejo, Ação)',
        'PAS': 'PAS (Problema, Agitação, Solução)',
        'BAB': 'BAB (Before-After-Bridge / Antes, Depois, Ponte)',
        'HSO': 'HSO (Hook-Story-Offer / Gancho, História, Oferta)'
      }[copyFramework];

      const audienceDesc = {
        'investor': 'Investidores puros de alto padrão, médicos, empresários (Focado em lucratividade alta, ROI líquido expressivo de investimento patrimonial, proteção de capital e delegação completa do estresse burocrático)',
        'dwelling': 'Famílias ou pessoas físicas focando em Moradia ou uso próprio (Focado em realizar o sonho de morar extremamente bem com desconto seguro de até 50% em leilão judicial, economizando centenas de milhares de reais e delegando riscos)',
        'both': 'Público Misto de Alto Padrão (Atendendo de forma inteligente tanto o interesse de investimento/lucro financeiro robusto quanto o desejo de morar em excelente imóvel pagando muito abaixo de mercado)'
      }[targetAudience];

      const durationDesc = {
        '30': 'Vídeo curto, dinâmico e direto de no máximo 30 segundos (ritmo rápido, gancho avassalador inicial, poucas frases de impacto com foco total na delegação e dor de tempo)',
        '60': 'Vídeo equilibrado de 60 segundos (ritmo comercial e fluído com bom tempo de retenção, explanação na medida certa do caso real, dores de quem quer comprar e delegação total dos riscos)',
        '90': 'Vídeo detalhado e aprofundado de 90 segundos (ritmo explicativo e seguro, gera alta autoridade, aborda as curiosidades jurídicas do caso e dores reais, acalmando o espectador com segurança técnica)'
      }[videoDuration];

      const customContextPrompt = customBrief.trim() ? `\n\nDIRETRIZES PERSONALIZADAS ADICIONAIS DO USUÁRIO:\n${customBrief.trim()}` : "";

      const promptText = `Gere do zero um roteiro de vídeo (Instagram Reels/Stories) de prospecção e uma cópia de post de feed para o Instagram.
O público-alvo são médicos, empresários, investidores de alto padrão ou famílias.

Desta vez, o foco da prospecção e posicionamento deve ser:
- PÚBLICO E DIRECIONAMENTO ESTRATÉGICO: ${audienceDesc}
- FRAMEWORK DE MARKETING: ${frameworkDesc}
- DURAÇÃO ESTIMADA DO ROTEIRO: ${durationDesc}
${customContextPrompt}

DIRETRIZ DE DESENVOLVIMENTO (ESTRATÉGIA DAS 4 IMPRESSÕES PARA VIRALIZAR):
Adapte o conteúdo das copys do Reels e do Feed para despertar simultaneamente estes 4 sentimentos no espectador premium:
1. "Isso é muito eu" (Identificação imediata da rotina/dor): O espectador se identifica com a falta de tempo, o estresse da rotina e o cansaço mental de querer investir sem ter tempo sequer para ler um edital.
2. "Isso é muito você" (Caracterização direta de frustração/sonho): Toque direto na dor dele: "Você sonha em adquirir excelentes imóveis com até 50% de desconto mas desiste ou se assusta toda vez que olha para um edital burocrático de 40 páginas."
3. "Isso é muito verdade" (Sinceridade e autoridade nua e crua): Seja honesto ao revelar que leilão NÃO é dinheiro fácil. Diga que sem profissionais especializados (como a equipe da TJ INVEST) o risco de perder dinheiro é real, mostrando as dores e pegadinhas reais do processo em análise.
4. "Isso eu consigo fazer" (Praticidade total por delegação): Deixe claro que para colocar isso em prática ele NÃO precisa adquirir cursos ou estudar leis, mas sim delegar a operação total: "Isso eu consigo realizar de forma impecável: apenas agendando uma reunião com a equipe da TJ INVEST para que eles analisem, arrematem e cuidem de tudo por mim."

- ATENÇÃO CRÍTICA PARA O SCRIPT DO VÍDEO (REELS/STORIES): Não inclua NENHUMA marcação de cena, gestos, indicação de câmera, efeitos sonoros ou blocos como "[Cena 1]", "[Corte para o imóvel]", "[Música sobe]", "Cena 2:", ou qualquer instrução de direção de vídeo, nem títulos/etiquetas das etapas (como "Gancho:", "Desenvolvimento:", "História:", "Chamada para ação:", "CTA:", "Oferta:", etc.). O script do vídeo deve ser redigido APENAS como um TEXTO CORRIDO, direto e fluido da fala completa que o apresentador irá falar na gravação, sem interrupções nem marcas descritivas, contendo unicamente o áudio a ser gravado para facilitar a leitura automática da IA ou teleprompter.
- NÃO dê dicas educativas de como o espectador fazer isso "sozinho".
- NÃO foque em ensinar conteúdo. Foque em gerar desejo, comodidade e alertar sobre os riscos graves que apenas especialistas sabem contornar.
- Posicione a Assessoria TJ INVEST como a solução definitiva fim-a-fim ("turnkey"): desde a triagem minuciosa de riscos do processo, simulação de lucros, lances no leilão, defesa em recursos pós-arrematação, até a desocupação rápida amigável e entrega das chaves prontas na mão.
- O roteiro deve ter um gancho eletrizante baseado nos lucros ou desconto real deste caso específico, revelar riscos processuais superados e finalizar com uma forte chamada para ação (CTA) direcionando o investidor para agendar uma reunião de assessoria com a TJ INVEST.

VALORES REAIS DO CASO (OBRIGATÓRIO USAR NA LEGENDAS E SCRIPTS):
- Imóvel: ${property?.title || "Imóvel Selecionado"}
- Localização: ${property?.city || "N/A"} - ${property?.state || "N/A"}
- Retorno sobre o Investimento estimado (ROI): ${roi.toFixed(1)}%
- Lucro Líquido Real Estimado BRL: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.netProfit || 0)}

Retorne a resposta estritamente formatada em formato JSON válido com as seguintes duas chaves de strings:
{
  "video_script": "roteiro do Reels aqui...",
  "feed_post": "legenda do Feed aqui..."
}`;

      const selectedModel = state.selectedModel || 'gemini-2.5-flash';
      const userApiKey = (() => {
        const source = state.selectedKeySource;
        const config = state.aiConfig;
        if (source === 'custom' && config) {
          if (selectedModel.startsWith('gemini') || selectedModel.startsWith('external-gemini')) {
            return config.gemini_key;
          } else if (selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1-') || selectedModel.startsWith('o3-')) {
            return config.openai_key;
          } else if (selectedModel.startsWith('claude-')) {
            return config.claude_key;
          } else if (selectedModel.startsWith('deepseek-')) {
            return config.deepseek_key;
          }
        }
        return "";
      })();

      const finalApiKey = userApiKey || null;
      console.log(`DEBUG CAPTACAO: Geração de copy de marketing para modelo ${selectedModel}.`);
      
      const analysisJson = await analyzeAuctionDocuments([], promptText, selectedModel, finalApiKey || undefined);
      
      if (!analysisJson) throw new Error("A IA retornou uma resposta vazia.");
      
      let parsed = null;
      try {
        const firstBrace = analysisJson.indexOf('{');
        const lastBrace = analysisJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = analysisJson.substring(firstBrace, lastBrace + 1);
          parsed = JSON.parse(jsonStr);
        }
      } catch (jsonErr) {
        console.warn("Retorno da IA não é um JSON perfeito. Usando fallback.", jsonErr);
      }

      const updatedContent = parsed || {
        video_script: analysisJson,
        feed_post: analysisJson
      };

      setState((prev: any) => {
        const nextStory = {
          ...(prev.processStory || {}),
          instagram_content: updatedContent
        };
        // Auto-save to database
        fetch(`/api/process-stories/${prev.processStory?.id || ''}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            full_story: nextStory.full_story || "",
            legal_glossary: nextStory.legal_glossary || "",
            timeline_json: JSON.stringify({
              timeline: nextStory.timeline || [],
              instagram_content: nextStory.instagram_content
            })
          })
        }).catch(err => console.error("Erro ao salvar instagram_content automaticamente:", err));

        return {
          ...prev,
          processStory: nextStory
        };
      });

    } catch (err: any) {
      console.error(err);
      alert("Erro ao gerar conteúdo de captação: " + (err.message || err));
    } finally {
      setIsGeneratingInsta(false);
    }
  };

  if (isGeneratingStory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-center bg-brand-paper/50 p-6 rounded-3xl border border-brand-primary/10">
          <h3 className="text-xl font-bold text-brand-primary mb-2">Analisando Dados</h3>
          <p className="text-brand-ink/40 text-sm">Buscando os bastidores do caso para estruturar a copy...</p>
        </div>
      </div>
    );
  }

  if (!processStory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary shadow-sm border border-brand-primary/20">
          <Instagram size={40} />
        </div>
        <div className="max-w-md">
          <h3 className="text-xl font-bold text-brand-primary mb-2">Máquina de Captação não carregada</h3>
          <p className="text-brand-ink/40 text-sm">Execute a análise IA no painel "Relatório" primeiro para extrair a história do processo e habilitar a criação dos criativos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-brand-paper p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-brand-primary/10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20">
              <Instagram size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-primary font-serif">Máquina de Captação & Prospecção (Instagram)</h3>
              <p className="text-xs text-brand-ink/50 mt-1">Atraia investidores e gere autoridade contando as curiosidades jurídicas do caso no Instagram de forma profissional</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditingStory && (
              <button
                type="button"
                disabled={isGeneratingInsta}
                onClick={handleForceGenerateInsta}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary/10 border border-brand-primary/20 hover:border-brand-primary text-brand-primary hover:bg-brand-primary/20 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={14} className={isGeneratingInsta ? "animate-spin" : ""} />
                {isGeneratingInsta ? "Mapeando caso..." : "Gerar Roteiros & Post"}
              </button>
            )}
          </div>
        </div>

        {/* CUSTOMIZATION OPTIONS PANEL */}
        <div className="bg-brand-bg/50 border border-brand-primary/10 rounded-2xl p-5 mb-8 relative z-10 space-y-5">
          <div className="flex items-center gap-2 text-brand-primary border-b border-brand-primary/10 pb-3">
            <Sliders size={18} className="text-brand-primary" />
            <h4 className="text-sm font-bold uppercase tracking-wider font-sans">Estratégia & Parâmetros do Criativo</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Target Audience Profile */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 flex items-center gap-1.5">
                <Users size={12} className="text-brand-primary" />
                Direcionamento / Objetivo
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'both', label: 'Moradia ou Investimento (Misto)' },
                  { id: 'dwelling', label: 'Foco em Moradia (Viver Bem)' },
                  { id: 'investor', label: 'Foco em Investimento (Lucro)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetAudience(opt.id as any)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                      targetAudience === opt.id
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm'
                        : 'bg-brand-paper/40 border-brand-primary/5 text-brand-ink/70 hover:bg-brand-paper/80'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {targetAudience === opt.id && <Check size={12} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Copywriting Framework */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 flex items-center gap-1.5">
                <Sparkles size={12} className="text-brand-primary" />
                Framework de Vendas (Copy)
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'HSO', label: 'HSO (Gancho, História, Oferta)' },
                  { id: 'AIDA', label: 'AIDA (Atenção, Interesse, Desejo, Ação)' },
                  { id: 'PAS', label: 'PAS (Problema, Agitação, Solução)' },
                  { id: 'BAB', label: 'BAB (Antes, Depois, Ponte)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCopyFramework(opt.id as any)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                      copyFramework === opt.id
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm'
                        : 'bg-brand-paper/40 border-brand-primary/5 text-brand-ink/70 hover:bg-brand-paper/80'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {copyFramework === opt.id && <Check size={12} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Duration */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 flex items-center gap-1.5">
                <Clock size={12} className="text-brand-primary" />
                Tempo do Vídeo (Duração)
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: '30', label: '30 segundos (Impacto Rápido)' },
                  { id: '60', label: '60 segundos (Foco em Venda)' },
                  { id: '90', label: '90 segundos (Aprofundado / Autoridade)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVideoDuration(opt.id as any)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                      videoDuration === opt.id
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm'
                        : 'bg-brand-paper/40 border-brand-primary/5 text-brand-ink/70 hover:bg-brand-paper/80'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {videoDuration === opt.id && <Check size={12} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guidelines Custom Text Input */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 flex items-center gap-1.5">
              <FileText size={12} className="text-brand-primary" />
              Diretrizes Adicionais / Informações Importantes (Opcional)
            </label>
            <textarea
              value={customBrief}
              onChange={(e) => setCustomBrief(e.target.value)}
              placeholder="Ex: Enfatizar que aceita parcelamento em até 30 meses; reforçar que o imóvel é de alto padrão no bairro X; mudar CTA para enviar 'QUERO' por direct..."
              rows={2}
              className="w-full bg-brand-paper/40 border border-brand-primary/10 focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs text-brand-ink outline-none placeholder:text-brand-ink/30 transition-all font-sans resize-none"
            />
          </div>
        </div>

        {isGeneratingInsta ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
            <p className="text-xs text-brand-ink/60">Analisando dados estratégicos e estruturando os roteiros...</p>
          </div>
        ) : !processStory.instagram_content ? (
          <div className="flex flex-col items-center justify-center py-14 text-center space-y-4 bg-brand-bg/40 rounded-3xl p-8 border border-brand-border/40">
            <Sparkles className="w-10 h-10 text-brand-primary/60" />
            <p className="text-sm text-brand-ink/60 max-w-md">
              Ainda não geramos a cópia de prospecção do Instagram para este caso. Selecione suas preferências de estratégia e clique abaixo para gerar.
            </p>
            <button
              onClick={handleForceGenerateInsta}
              className="px-6 py-3 bg-brand-primary text-black hover:bg-brand-primary/90 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              Criar Roteiros & Post de Prospecção
            </button>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {/* Tabs selector */}
            <div className="flex border-b border-brand-border">
              <button
                type="button"
                onClick={() => setActiveInstaTab('video')}
                className={`py-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all -mb-[2px] cursor-pointer ${
                  activeInstaTab === 'video' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-brand-ink/50 hover:text-brand-ink'
                }`}
              >
                <Video size={16} />
                Script de Vídeo (Reels/Stories)
              </button>
              <button
                type="button"
                onClick={() => setActiveInstaTab('post')}
                className={`py-3 px-5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all -mb-[2px] cursor-pointer ${
                  activeInstaTab === 'post' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-brand-ink/50 hover:text-brand-ink'
                }`}
              >
                <FileText size={16} />
                Legenda do Post (Feed)
              </button>
            </div>

            {/* Content area */}
            <div className="bg-brand-bg/30 rounded-2xl p-6 border border-brand-border/50 relative">
              <button
                onClick={() => handleCopyInsta(
                  activeInstaTab === 'video' 
                    ? processStory.instagram_content.video_script 
                    : processStory.instagram_content.feed_post
                )}
                className="absolute top-4 right-4 bg-brand-paper hover:bg-brand-primary/10 border border-brand-border/50 hover:border-brand-primary text-brand-ink/70 hover:text-brand-primary p-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm text-xs cursor-pointer z-20"
                title="Copiar para área de transferência"
              >
                {copiedInsta ? (
                  <>
                    <Check size={14} className="text-green-500" />
                    <span className="text-green-500 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <div className="prose prose-brand max-w-none text-sm text-brand-ink whitespace-pre-wrap leading-relaxed pr-20 pt-2 selection:bg-brand-primary/20">
                {activeInstaTab === 'video' 
                  ? processStory.instagram_content.video_script 
                  : processStory.instagram_content.feed_post}
              </div>

              {activeInstaTab === 'video' && (
                <div className="mt-4 pt-3 border-t border-brand-border/30 text-[10px] text-brand-primary/60 flex items-center gap-1.5 select-none">
                  <Sparkles size={11} className="text-brand-primary shrink-0" />
                  <span>Nota: Ao copiar, os títulos de etapas (Gancho, História, CTA, etc.) e marcações de cena são automaticamente removidos para colagem direta em ferramentas de narração/geração de vídeo.</span>
                </div>
              )}
            </div>
            
            {/* Advice badge */}
            <div className="text-[11px] text-brand-ink/60 bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10 flex items-center gap-2">
              <Sparkles size={14} className="text-brand-primary shrink-0 animate-pulse" />
              <span>
                <strong>Dica de Captação:</strong> Grave o vídeo com tom profissional e seguro. Use a legenda do Feed com as métricas reais (ROI de {roi.toFixed(1)}% e lucro estimado de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.netProfit || 0)}) para consolidar a autoridade da sua assessoria de leilões!
              </span>
            </div>
          </div>
        )}

        {isEditingStory && processStory.instagram_content && (
          <div className="mt-6 p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 space-y-4">
            <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
              <Instagram size={16} />
              Editar Conteúdo do Instagram (Prospecção)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-ink/60 mb-2">Editor - Roteiro de Vídeo (Reels)</label>
                <textarea
                  className="w-full bg-brand-paper border border-brand-primary/20 rounded-xl p-4 min-h-[220px] text-brand-ink text-xs outline-none focus:ring-1 focus:ring-brand-primary"
                  value={processStory.instagram_content.video_script || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setState((prev: any) => ({
                      ...prev,
                      processStory: {
                        ...prev.processStory,
                        instagram_content: {
                          ...(prev.processStory.instagram_content || {}),
                          video_script: val
                        }
                      }
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-ink/60 mb-2">Editor - Legenda do Post (Feed)</label>
                <textarea
                  className="w-full bg-brand-paper border border-brand-primary/20 rounded-xl p-4 min-h-[220px] text-brand-ink text-xs outline-none focus:ring-1 focus:ring-brand-primary"
                  value={processStory.instagram_content.feed_post || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setState((prev: any) => ({
                      ...prev,
                      processStory: {
                        ...prev.processStory,
                        instagram_content: {
                          ...(prev.processStory.instagram_content || {}),
                          feed_post: val
                        }
                      }
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AIAnalysisView({ token, properties, onPropertyCreated, state, setState, setIsShareModalOpen, propertyDocs, propertyDebts, setPropertyDocs, setPropertyDebts }: { 
  token: string, 
  properties: Property[], 
  onPropertyCreated: () => void,
  state: any,
  setState: React.Dispatch<React.SetStateAction<any>>,
  setIsShareModalOpen: (open: boolean) => void,
  propertyDocs: any[],
  propertyDebts: any[],
  setPropertyDocs: React.Dispatch<React.SetStateAction<any[]>>,
  setPropertyDebts: React.Dispatch<React.SetStateAction<any[]>>
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [searchingCNJ, setSearchingCNJ] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Sub-tab chats states
  const [matriculaChatMessages, setMatriculaChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Olá! Compartilhe suas dúvidas sobre o registro da matrícula, proprietários anteriores, gravames e indisponibilidades deste imóvel.' }
  ]);
  const [matriculaChatInput, setMatriculaChatInput] = useState('');
  const [sendingMatriculaChat, setSendingMatriculaChat] = useState(false);

  const [processosChatMessages, setProcessosChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Olá! Estudo processual iniciado. Pergunte sobre os prazos de recursos, penhoras no processo ou riscos de suspensão do leilão.' }
  ]);
  const [processosChatInput, setProcessosChatInput] = useState('');
  const [sendingProcessosChat, setSendingProcessosChat] = useState(false);

  const [documentsChatMessages, setDocumentsChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Olá! Sou seu assistente de gestão documental. Pergunte qualquer informação de dados ou incoerências nas peças enviadas.' }
  ]);
  const [documentsChatInput, setDocumentsChatInput] = useState('');
  const [sendingDocumentsChat, setSendingDocumentsChat] = useState(false);

  // Copy state variables
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedEdital, setCopiedEdital] = useState(false);
  const [copiedMatricula, setCopiedMatricula] = useState(false);
  const [copiedProcessos, setCopiedProcessos] = useState(false);

  const handleCopyText = async (text: string, setCopiedState: (v: boolean) => void) => {
    if (!text) return;

    // Clean formatting characters (markdown symbols, etc)
    const cleanText = (() => {
      let clean = text;
      // 1. Remove bold/italic markup (e.g. **** or ** or *)
      clean = clean.replace(/\*{1,4}/g, '');
      clean = clean.replace(/_{1,4}/g, '');
      
      // 2. Remove markdown title hashes (e.g. ### Title -> Title)
      clean = clean.replace(/^[ \t]*#+[ \t]+/gm, '');
      
      // 3. Remove equal/dash line dividers (e.g. ====== or ------ or ---)
      clean = clean.replace(/^[=\-]{3,}$/gm, '');
      clean = clean.replace(/^---$/gm, '');
      
      // 4. Remove blockquote markers at start of a line (e.g. > Quote -> Quote)
      clean = clean.replace(/^[ \t]*>[ \t]*/gm, '');
      
      // 5. Remove HTML open/close tags
      clean = clean.replace(/<\/?[^>]+(>|$)/g, "");

      // 6. Restructure spacing to be perfectly readable and remove excessive empty lines (more than 2)
      clean = clean.replace(/\n{3,}/g, '\n\n');
      
      return clean.trim();
    })();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanText);
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
        return;
      }
    } catch (e) {
      console.warn("Navigator clipboard copy failed, trying fallback:", e);
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = cleanText;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) {
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
      } else {
        alert("Não foi possível copiar automaticamente. Por favor, selecione e copie o texto manualmente.");
      }
    } catch (err) {
      console.error("Fallback clipboard copy failed:", err);
      alert("Erro ao copiar.");
    }
  };
  const { 
    activeSubTab, 
    selectedPropertyId, 
  } = state;
  const analysisDocs = selectedPropertyId ? propertyDocs : state.adHocDocs; // Use the passed props
  const currentDebts = selectedPropertyId ? propertyDebts : [];

  const handleNewAnalysis = () => {
    if (window.confirm("Deseja iniciar uma nova análise? Todos os dados da análise atual serão redefinidos.")) {
      const masterDefaults = getMasterBudgetConfigs();
      setState(prev => ({
        ...prev,
        activeSubTab: 'report',
        selectedPropertyId: '',
        report: null,
        adHocDocs: [],
        smartAnalysis: null,
        cnjNumber: '',
        cnjResult: null,
        chatMessages: [],
        simulationData: {
          valuation: { value: 0, type: 'BRL' },
          bid: { value: 0, type: 'BRL' },
          saleValue: { value: 0, type: 'BRL' },
          holdingMonths: 12,
          strategy: 'venda',
          expectedReturn: 15,
          customExpenses: [],
          assessoria: { value: masterDefaults.assessoria?.value ?? 6, type: masterDefaults.assessoria?.type ?? 'PERCENT', base: 'bid' },
          entrada: { value: masterDefaults.entrada?.value ?? 1500, type: masterDefaults.entrada?.type ?? 'BRL' },
          desocupacaoAcordo: { value: masterDefaults.desocupacaoAcordo?.value ?? 0, type: masterDefaults.desocupacaoAcordo?.type ?? 'BRL' },
          desocupacaoDespesas: { value: 0, type: 'BRL' },
          reformaMin: { value: masterDefaults.reforma?.value ?? 0, type: masterDefaults.reforma?.type ?? 'BRL' },
          iptuAtraso: { value: 0, type: 'BRL' },
          condominioAtraso: { value: 0, type: 'BRL' },
          outrosAtraso: { value: 0, type: 'BRL' },
          itbi: { value: masterDefaults.itbi?.value ?? 3, type: masterDefaults.itbi?.type ?? 'PERCENT', base: 'bid' },
          escritura: { value: 1000, type: 'BRL' },
          registro: { value: masterDefaults.transfRegistro?.value ?? 1.5, type: masterDefaults.transfRegistro?.type ?? 'PERCENT', base: 'bid' },
          comissaoVenda: { value: 5, type: 'PERCENT', base: 'saleValue' },
          outrosCustos: { value: masterDefaults.extraFees?.value ?? 0, type: masterDefaults.extraFees?.type ?? 'BRL' },
          vendaHoldingMonths: { value: 0, type: 'BRL' },
          vendaCondominioMonths: { value: 0, type: 'BRL' },
          vendaIptuMonths: { value: 0, type: 'BRL' },
          vendaOutrosMonths: { value: 0, type: 'BRL' },
          downPaymentPercent: 100,
          installments: 1,
          interestRate: 0,
          comparisonData: {
            tesouro: { tir: 11.5, roi: 11.5 },
            cdb: { tir: 12.0, roi: 12.0 },
            poupanca: { tir: 6.5, roi: 6.5 }
          }
        },
        analysisId: null,
        processStory: null,
        processAnalysis: null,
        editalAnalysis: undefined,
        matriculaAnalysis: undefined,
        manualAuctionType: 'auto',
        auctionUrls: [],
        isEditingReport: false,
        isEditingStory: false
      }));
    }
  };

  const [analyzingSmart, setAnalyzingSmart] = useState(false);

  const handleSaveSmartAnalysis = async (updatedData: SmartAnalysisData) => {
    try {
      const selectedPropertyId = state.selectedPropertyId;
      const analysisId = state.analysisId;
      
      if (!selectedPropertyId) {
        updateState({ smartAnalysis: updatedData });
        if ((window as any).customToast) {
          (window as any).customToast("Análise Smart salva temporariamente (vincule a um imóvel para persistir)!", "info");
        }
        return;
      }
      
      const smartJson = JSON.stringify(updatedData);
      
      if (!analysisId) {
        const createRes = await fetch(`/api/ai-analyses`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            property_id: selectedPropertyId,
            exec_summary: "Análise Smart - Preenchido pelo Usuário",
            financial_analysis: JSON.stringify(state.simulationData),
            smart_analysis_json: smartJson,
            ia_used: "Manual"
          })
        });

        if (createRes.ok) {
          const createData = await parseJsonResponse(createRes);
          updateState({ analysisId: createData.id, smartAnalysis: updatedData });
          fetchPropertyData(selectedPropertyId);
        } else {
          throw new Error("Erro ao criar registro da análise.");
        }
      } else {
        const updateRes = await fetch(`/api/ai-analyses/${analysisId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            smart_analysis_json: smartJson
          })
        });

        if (updateRes.ok) {
          updateState({ smartAnalysis: updatedData });
          fetchPropertyData(selectedPropertyId);
        } else {
          throw new Error("Erro ao atualizar análise.");
        }
      }
      
      if ((window as any).customToast) {
        (window as any).customToast("Análise Smart salva com sucesso!", "success");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar Análise Smart: " + err.message);
    }
  };

  const handleAnalyzeSmart = async () => {
    setAnalyzingSmart(true);
    try {
      if (analysisDocs.length === 0) {
        throw new Error("Nenhum documento encontrado para análise. Faça o upload de pelo menos um documento.");
      }
      
      const fileParts = analysisDocs.map((doc: any) => {
        let mimeType = 'application/pdf';
        if (doc.filename.toLowerCase().endsWith('.jpg') || doc.filename.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (doc.filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (doc.filename.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

        const hasText = doc.extracted_text && doc.extracted_text.trim().length > 0;
        return {
          id: doc.id,
          filename: doc.filename,
          data: !hasText && doc.data ? (doc.data.startsWith('data:') ? doc.data : `data:${mimeType};base64,${doc.data}`) : "",
          mimeType: mimeType,
          extractedText: doc.extracted_text || ""
        };
      });

      const userApiKey = resolveApiKey(state.selectedKeySource, state.aiConfig, state.selectedModel || 'gemini-2.5-flash') || "";
      const finalApiKey = userApiKey || undefined;
      
      const prompt = `Você é um advogado imobiliário sênior e especialista em leilões de imóveis (judiciais e extrajudiciais) no Brasil.
Sua tarefa é analisar minuciosamente todos os documentos fornecidos do leilão (Edital, Matrícula de Cartório de Registro de Imóveis, e peças do processo judicial correspondente) e preencher um relatório estruturado em formato JSON contendo as informações jurídicas, de ocupação, financeiras e de riscos do leilão.

Você deve responder APENAS com um objeto JSON válido, sem texto explicativo antes ou depois, seguindo estritamente este esquema de chaves e tipos de valores:

{
  "risco_geral": "Baixo" | "Médio" | "Alto",
  "recomendacao": "Recomendo arrematar" | "Recomendo com ressalvas" | "Não recomendo arrematar",
  "justificativa": "Texto explicativo detalhado de até 5 linhas sobre o motivo da sua recomendação e os pontos de atenção",
  
  "tipo_leilao": "Judicial" | "Extrajudicial",
  "responsabilidade_iptu": "Vendedor (Banco)" | "Comprador" | "Sub-rogado no preço",
  "responsabilidade_condominio": "Vendedor (Banco)" | "Comprador" | "Sub-rogado no preço",
  "observacoes_edital": "Observações sobre datas, regras do edital, parcelamentos autorizados, etc. Seja minucioso.",
  
  "iptu_atraso": 1500.00,
  "condominio_atraso": 3000.00,
  "outros_debitos": 0.00,
  "observacoes_debitos": "Detalhamento das dívidas de IPTU, Condomínio, foro/laudêmio, etc.",
  
  "nivel_risco_desocupacao": "Baixo" | "Médio" | "Alto",
  "liminar_bloqueando": false,
  "acao_anulatoria": false,
  "embargos_pendentes": false,
  "recurso_pendente": false,
  "prazo_estimado_desocupacao": "6 a 12 meses" | "3 a 6 meses" | "mais de 12 meses",
  "observacoes_desocupacao": "Análise da dificuldade esperada de desocupação baseada no tipo de ocupante e nos recursos vigentes",
  
  "risco_geral_nulidade": "Baixo" | "Médio" | "Alto",
  "vicio_citacao": false,
  "vicio_avaliacao": false,
  "vicio_publicacao": false,
  "vicio_procedimental": false,
  "observacoes_nulidade": "Análise crítica dos riscos de nulidade ou anulação do leilão pelas defesas do executado",
  
  "status_consolidacao": "Regular" | "Irregular" | "Pendente" | "Não verificado",
  "intimacao_purga_mora": false,
  "intimacao_leiloes": false,
  "averbacao_consolidacao": false,
  "observacoes_consolidacao": "Análise de regularidade do procedimento de consolidação extrajudicial (Lei 9.514/97)",
  
  "matricula_atualizada": false,
  "tem_onus": false,
  "tem_penhora": false,
  "tem_hipoteca": false,
  "alienacao_fiduciaria": false,
  "indisponibilidade": false,
  "acao_reipersecutoria": false,
  "observacoes_matricula": "Destaque todos os ônus, penhoras e restrições encontrados na matrícula e seus respectivos cancelamentos ou riscos",
  
  "status_ocupacao": "Ocupado pelo ex-mutuário" | "Ocupado por terceiro" | "Invasão" | "Desocupado",
  "relacao_ex_mutuario": "O próprio" | "Parente" | "Inquilino" | "Desconhecido",
  "nome_ocupante": "Nome completo do ocupante se mencionado nos autos ou edital, senão vazio",
  "cpf_ocupante": "CPF do ocupante se mencionado, senão vazio",
  "telefone_ocupante": "Telefone ou contato se mencionado, senão vazio",
  "tempo_ocupacao": "Tempo estimado que o ocupante já está no imóvel se puder ser deduzido, senão vazio",
  "risco_usucapiao": "Baixo" | "Médio" | "Alto",
  "observacoes_ocupacao": "Histórico de tentativas de desocupação amigável ou imissões de posse anteriores se houver",

  "tipo_imovel": "Casa" | "Apartamento" | "Terreno" | "Comercial" | "Outros" | "Selecione",
  "numero_matricula": "Número de matrícula do imóvel se encontrado, senão vazio",
  "cartorio_registro": "Nome do Cartório de Registro de Imóveis (ex: 1º CRI de São Paulo) se encontrado, senão vazio",
  "area_terreno": 250.00,
  "area_privativa": 69.00,
  "area_util": 69.00,
  "area_construida": 110.00,
  "observacoes_imovel": "Descrição física detalhada do imóvel encontrada na matrícula (ex: número de quartos, garagens, confrontações, etc.)",

  "nome_ex_mutuario": "Nome completo do devedor / ex-mutuário / executado principal",
  "cpf_ex_mutuario": "CPF ou CNPJ do devedor / ex-mutuário / executado principal",
  "estado_civil_ex_mutuario": "Estado civil do devedor / ex-mutuário / executado principal se mencionado, senão vazio",
  "profissao_ex_mutuario": "Profissão do devedor / ex-mutuário / executado principal se mencionada, senão vazio",
  "conjuge_ex_mutuario": "Nome e CPF/CNPJ do cônjuge, companheiro(a) ou outros coproprietários devedores, se houver",
  "endereco_ex_mutuario": "Endereço completo e detalhado do ex-mutuário / devedor mencionado nos documentos (ex: residência anterior, endereço citado no processo judicial ou notificação)",
  "observacoes_ex_mutuario": "Histórico e anotações adicionais sobre os ex-mutuários e devedores (ex: herdeiros, óbito, processos relacionados, tentativas de intimação)"
}

Importante: se uma informação não for encontrada nos documentos, use o valor correspondente neutro (como false para booleanos, 0 para números, "Não avaliado"/"Selecione"/"Não verificado" para dropdowns, ou texto vazio/explicando que não foi encontrado para campos de texto). Seja extremamente técnico e preciso em suas observações legais baseadas no Direito brasileiro.`;
      
      const rawResult = await analyzeAuctionDocuments(
        fileParts, 
        prompt, 
        state.selectedModel || 'gemini-2.5-flash', 
        finalApiKey, 
        state.auctionUrls, 
        'smart_analysis'
      );
      
      let parsedData: SmartAnalysisData;
      try {
        let cleanJson = rawResult || "";
        if (cleanJson.includes("```json")) {
          cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
        } else if (cleanJson.includes("```")) {
          cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
        }
        parsedData = JSON.parse(cleanJson);
      } catch (err) {
        console.error("Erro ao parsear JSON do resultado da IA:", rawResult, err);
        throw new Error("A IA não retornou um formato JSON estruturado compatível. Tente novamente.");
      }
      
      const mergedData = { ...getEmptySmartAnalysis(), ...parsedData };
      await handleSaveSmartAnalysis(mergedData);
      
    } catch (err: any) {
      console.error(err);
      alert("Erro ao realizar Análise Smart: " + err.message);
    } finally {
      setAnalyzingSmart(false);
    }
  };

  const handleAnalyzeEdital = async () => {
    const docs = analysisDocs.filter(d => d.doc_type === 'Edital');
    if (docs.length === 0) { alert("Nenhum Edital encontrado."); return; }
    setAnalyzing(true);
    try {
      const fileParts = docs.map(doc => {
        let mimeType = 'application/pdf';
        if (doc.filename.toLowerCase().endsWith('.jpg') || doc.filename.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (doc.filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (doc.filename.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

        const hasText = doc.extracted_text && doc.extracted_text.trim().length > 0;
        return {
          id: doc.id,
          filename: doc.filename,
          data: !hasText && doc.data ? (doc.data.startsWith('data:') ? doc.data : `data:${mimeType};base64,${doc.data}`) : "",
          mimeType: mimeType,
          extractedText: doc.extracted_text || ""
        };
      });
      const userApiKey = resolveApiKey(state.selectedKeySource, state.aiConfig, state.selectedModel || 'gemini-2.5-flash') || "";
      const analysis = await analyzeAuctionDocuments(fileParts, "Analise o Edital", state.selectedModel || 'gemini-2.5-flash', userApiKey || undefined, [], 'edital');
      setState(prev => ({ ...prev, editalAnalysis: analysis }));
    } catch (err) { console.error(err); alert("Erro ao analisar Edital."); } finally { setAnalyzing(false); }
  };

  const handleAnalyzeMatricula = async () => {
    const docs = analysisDocs.filter(d => d.doc_type === 'Matrícula');
    if (docs.length === 0) { alert("Nenhuma Matrícula encontrada."); return; }
    setAnalyzing(true);
    try {
      const fileParts = docs.map(doc => {
        let mimeType = 'application/pdf';
        if (doc.filename.toLowerCase().endsWith('.jpg') || doc.filename.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (doc.filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (doc.filename.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

        const hasText = doc.extracted_text && doc.extracted_text.trim().length > 0;
        return {
          id: doc.id,
          filename: doc.filename,
          data: !hasText && doc.data ? (doc.data.startsWith('data:') ? doc.data : `data:${mimeType};base64,${doc.data}`) : "",
          mimeType: mimeType,
          extractedText: doc.extracted_text || ""
        };
      });
      const userApiKey = resolveApiKey(state.selectedKeySource, state.aiConfig, state.selectedModel || 'gemini-2.5-flash') || "";
      const analysis = await analyzeAuctionDocuments(fileParts, "Analise a Matrícula", state.selectedModel || 'gemini-2.5-flash', userApiKey || undefined, [], 'matricula');
      setState(prev => ({ ...prev, matriculaAnalysis: analysis }));
    } catch (err) { console.error(err); alert("Erro ao analisar Matrícula."); } finally { setAnalyzing(false); }
  };

  const handleAnalyzeProcesses = async () => {
    let processDocs = analysisDocs.filter(d => d.doc_type === 'Processo Judicial');
    
    // Fallback: use other documents (like Edital/Matrícula) which usually describe process details
    if (processDocs.length === 0) {
      processDocs = analysisDocs.filter(d => d.doc_type === 'Edital' || d.doc_type === 'Matrícula');
    }
    if (processDocs.length === 0) {
      processDocs = analysisDocs;
    }
    
    // Only block if we have absolutely nothing uploaded at all
    if (processDocs.length === 0) {
      alert("Nenhum documento (Edital, Matrícula ou Processo) disponível para análise. Envie pelo menos um documento.");
      return;
    }
    
    setAnalyzing(true);
    try {
      const fileParts = processDocs.map(doc => {
        let mimeType = 'application/pdf';
        if (doc.filename.toLowerCase().endsWith('.jpg') || doc.filename.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (doc.filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (doc.filename.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

        const hasText = doc.extracted_text && doc.extracted_text.trim().length > 0;
        return {
          id: doc.id,
          filename: doc.filename,
          data: !hasText && doc.data ? (doc.data.startsWith('data:') ? doc.data : `data:${mimeType};base64,${doc.data}`) : "",
          mimeType: mimeType,
          extractedText: doc.extracted_text || ""
        };
      });
      
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      const propertyContext = selectedProperty ? `\n\nIMÓVEL EM LEILÃO: ${selectedProperty.title}` : "\n\nIMÓVEL EM LEILÃO: Não especificado.";
      const prompt = `Analise detalhadamente cada documento ou peça do processo judicial anexado para identificar e resumir quaisquer riscos relacionados à arrematação do imóvel.

      ${propertyContext}

      Para cada documento analisado, identifique os seguintes pontos de impacto:
      1. NOME DETALHADO DO DOCUMENTO (Petição, Decisão, Recurso, Certidão, etc.).
      2. OBJETIVO PRINCIPAL: Qual a pretensão da peça ou o teor da decisão?
      3. DISCUSSÕES SOBRE NULIDADES: Há alguma alegação de falta de intimação regular (de cônjuge, coproprietário, credor hipotecário, etc.), preço vil ou irregularidade processual?
      4. RECURSOS PENDENTES: Quais recursos estão tramitando ou podem ser interpostos? Há pedidos de suspensão do leilão em andamento?
      5. IMPACTO POTENCIAL NA POSSE: Qual o efeito da peça na imissão/obtenção da posse pelo arrematante (ex: resistência ativa dos ocupantes, embargos à adjudicação ou à execução)?

      Ao final, apresente um PARECER CONSOLIDADO DE RISCO PROCESSUAL:
      - Classificação Geral de Risco (Baixo, Médio ou Alto).
      - Risco de Anulação do Leilão (Sim/Não - Justificado).
      - Estimativa de Tempo de Desocupação / Ganho de Posse.
      - Recomendação Estratégica Executiva (Se vale a pena arrematar e quais cautelas adotar).

      Formate toda a resposta em português do Brasil, utilizando uma estrutura visual rica e limpa em Markdown, destacando os alertas cruciais.`;
      
      const userApiKey = resolveApiKey(state.selectedKeySource, state.aiConfig, state.selectedModel || 'gemini-2.5-flash') || "";
      const analysis = await analyzeAuctionDocuments(fileParts, prompt, state.selectedModel || 'gemini-2.5-flash', userApiKey || undefined, [], 'processo');
      setState(prev => ({ ...prev, processAnalysis: analysis }));
    } catch (err) {
      console.error(err);
      alert("Erro ao analisar processos.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeDossier = async () => {
    const docs = analysisDocs;
    if (docs.length === 0) {
      alert("Nenhum documento encontrado. Envie a matrícula, edital e processos primeiro.");
      return;
    }
    setAnalyzing(true);
    try {
      const fileParts = docs.map(doc => {
        let mimeType = 'application/pdf';
        if (doc.filename.toLowerCase().endsWith('.jpg') || doc.filename.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (doc.filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (doc.filename.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

        const hasText = doc.extracted_text && doc.extracted_text.trim().length > 0;
        return {
          id: doc.id,
          filename: doc.filename,
          data: !hasText && doc.data ? (doc.data.startsWith('data:') ? doc.data : `data:${mimeType};base64,${doc.data}`) : "",
          mimeType: mimeType,
          extractedText: doc.extracted_text || ""
        };
      });
      const userApiKey = resolveApiKey(state.selectedKeySource, state.aiConfig, state.selectedModel || 'gemini-2.5-flash') || "";
      const analysis = await analyzeAuctionDocuments(fileParts, "Gere o Dossiê de Arrematação Inteligente", state.selectedModel || 'gemini-2.5-flash', userApiKey || undefined, state.auctionUrls, 'dossier');
      setState(prev => ({ ...prev, dossierAnalysis: analysis }));

      // Auto-save if there's an active analysis and property
      if (state.selectedPropertyId && state.analysisId) {
        await fetch(`/api/ai-analyses/${state.analysisId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            dossier_analysis: analysis
          })
        });
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar Dossiê de Arrematação.");
    } finally {
      setAnalyzing(false);
    }
  };

  const [pasteTitle, setPasteTitle] = useState('');

  // Local state for property-specific data (still fetched on mount/change)
  const [propertyAnalyses, setPropertyAnalyses] = useState<any[]>([]);

  const { 
    report, 
    adHocDocs, 
    cnjNumber, 
    cnjResult, 
    selectedModel, 
    chatMessages, 
    simulationData,
    isPublicView,
    shareToken,
    anonymizeProperty
  } = state;

  const { onJumpToSimulation } = React.useContext(SimulationContext);

  const currentMetrics = React.useMemo(() => {
    if (!simulationData) return { metrics: { totalUpfrontExpenses: 0, netProfit: 0 }, tir: 0, roi: 0 };
    const bid = (simulationData as any).bid?.value || 0;
    const saleValue = (simulationData as any).saleValue?.value || 0;
    const holdingMonths = (simulationData as any).holdingMonths || 12;
    const downPaymentPercent = (simulationData as any).downPaymentPercent || 100;
    const installments = (simulationData as any).installments || 1;
    const interestRate = (simulationData as any).interestRate || 0;

    const metrics = calculateSimulationMetrics(simulationData, bid) as any;
    const tir = calculateTIR(bid, saleValue, 0, downPaymentPercent, installments, interestRate, holdingMonths, simulationData);
    
    const roi = metrics.roi;
    const totalInvestment = metrics.totalInvestment;

    return { metrics, tir, roi };
  }, [simulationData]);

  const { metrics, tir, roi } = currentMetrics;

  const handlePrint = () => {
    window.print();
  };

  const generateShareLink = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/share`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ is_public: true, anonymize_property: anonymizeProperty })
      });
      if (!res.ok) throw new Error("Erro ao gerar link de compartilhamento");
      const data = await parseJsonResponse(res);
      updateState({ shareToken: data.share_token });
      return data.share_token;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleShare = async () => {
    let propertyId = selectedPropertyId;
    
    // If not saved yet, save it first
    if (!propertyId) {
      try {
        const title = cnjResult ? `Leilão: ${cnjResult.cnj_number}` : `Análise IA: ${new Date().toLocaleDateString()}`;
        const res = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title: title,
            type: 'Apartamento',
            modality: 'Judicial',
            address: 'Endereço extraído do processo...',
            city: 'Cidade extraída',
            state: 'Estado',
            valuation_value: simulationData.valuation?.value || 0,
            min_bid: simulationData.bid?.value || 0,
            expected_sale_value: simulationData.saleValue?.value || 0
          })
        });
        if (res.ok) {
          const data = await parseJsonResponse(res);
          propertyId = data.id;
          updateState({ selectedPropertyId: propertyId });
          // Link documents if any
          if (adHocDocs.length > 0) {
            await fetch('/api/documents/link', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                temp_property_id: `temp_${state.sessionId}`,
                property_id: propertyId
              })
            });
          }
        } else {
          throw new Error("Falha ao salvar imóvel para compartilhar");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao preparar compartilhamento: " + (err as Error).message);
        return;
      }
    } else {
      // Property already exists, but we want to save our screen's customized financial values into the db
      try {
        await fetch(`/api/properties/${propertyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            valuation_value: simulationData.valuation?.value || 0,
            min_bid: simulationData.bid?.value || 0,
            expected_sale_value: simulationData.saleValue?.value || 0
          })
        });
      } catch (err) {
        console.error("Erro ao atualizar dados do imóvel para compartilhar:", err);
      }
    }

    try {
      await generateShareLink(propertyId!);
      setIsShareModalOpen(true);
    } catch (err) {
      alert("Erro ao gerar link de compartilhamento: " + (err as Error).message);
    }
  };

  const updateState = React.useCallback((updates: any) => {
    setState((prev: any) => {
      const resolvedUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...resolvedUpdates };
    });
  }, [setState]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchPropertyData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchPropertyData = async (id: string) => {
    try {
      const [docsRes, debtsRes, analysisRes, storyRes] = await Promise.all([
        fetch(`/api/documents/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/debts/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/ai-analyses/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/process-stories/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (docsRes.ok) {
        const data = await parseJsonResponse(docsRes);
        setPropertyDocs(data);
      }
      if (debtsRes.ok) {
        const data = await parseJsonResponse(debtsRes);
        setPropertyDebts(data);
      }
      if (analysisRes.ok) {
        const analyses = await parseJsonResponse(analysisRes);
        setPropertyAnalyses(analyses);
        if (analyses && analyses.length > 0) {
          const latest = analyses[0];
          let parsedSimulationData = null;
          if (latest.financial_analysis) {
            try {
              parsedSimulationData = JSON.parse(latest.financial_analysis);
            } catch (e) {
              console.error("Erro ao parsear simulationData de banco:", e);
            }
          }
          let parsedSmartAnalysis = null;
          if (latest.smart_analysis_json) {
            try {
              parsedSmartAnalysis = JSON.parse(latest.smart_analysis_json);
            } catch (e) {
              console.error("Erro ao parsear smart_analysis_json de banco:", e);
            }
          }
          updateState({ 
            report: latest.exec_summary, 
            selectedModel: latest.ia_used,
            analysisId: latest.id,
            editalAnalysis: latest.edital_analysis || null,
            matriculaAnalysis: latest.matricula_analysis || null,
            processAnalysis: latest.process_analysis || null,
            dossierAnalysis: latest.dossier_analysis || null,
            smartAnalysis: parsedSmartAnalysis || getEmptySmartAnalysis(),
            ...(parsedSimulationData ? { simulationData: parsedSimulationData } : {})
          });
        } else {
          const prop = properties.find(p => p.id === id);
          if (prop) {
            updateState((prev: any) => ({
              analysisId: null,
              report: null,
              editalAnalysis: null,
              matriculaAnalysis: null,
              processAnalysis: null,
              dossierAnalysis: null,
              smartAnalysis: getEmptySmartAnalysis(),
              simulationData: {
                ...(prev.simulationData || {}),
                valuation: { value: prop.valuation_value || 0, type: 'BRL' },
                bid: { value: prop.min_bid || 0, type: 'BRL' },
                saleValue: { value: prop.expected_sale_value || 0, type: 'BRL' }
              }
            }));
          } else {
            updateState({ 
              analysisId: null, 
              report: null,
              editalAnalysis: null,
              matriculaAnalysis: null,
              processAnalysis: null,
              dossierAnalysis: null,
              smartAnalysis: getEmptySmartAnalysis()
            });
          }
        }
      }
      if (storyRes.ok) {
        const story = await parseJsonResponse(storyRes);
        if (story) {
          let timeline = [];
          let instagramContent = null;
          try {
            const parsedJson = typeof story.timeline_json === 'string' ? JSON.parse(story.timeline_json) : story.timeline_json;
            if (Array.isArray(parsedJson)) {
              timeline = parsedJson;
            } else if (parsedJson && typeof parsedJson === 'object') {
              timeline = parsedJson.timeline || parsedJson.events || [];
              instagramContent = parsedJson.instagram_content || null;
            }
          } catch (e) {
            console.error("Erro ao parsear timeline_json:", e);
          }

          updateState({ 
            processStory: {
              ...story,
              timeline,
              instagram_content: instagramContent
            }
          });
        } else {
          updateState({ processStory: null });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCnjSearch = async () => {
    setSearchingCNJ(true);
    try {
      const res = await fetch('/api/datajud/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cnj_number: cnjNumber })
      });
      if (!res.ok) throw new Error("Erro na consulta CNJ");
      const data = await parseJsonResponse(res);
      updateState({ cnjResult: data, activeSubTab: 'cnj' });
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingCNJ(false);
    }
  };

  const handleSaveAsProperty = async () => {
    try {
      const defaultTitle = cnjResult ? `Leilão: ${cnjResult.cnj_number}` : `Análise IA: ${new Date().toLocaleDateString('pt-BR')}`;
      const titleInput = window.prompt("Escolha um nome para salvar a análise:", defaultTitle);
      if (titleInput === null) return; // cancelado pelo usuário
      const title = titleInput.trim() || defaultTitle;
      
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: title,
          type: 'Apartamento',
          modality: 'Judicial',
          address: 'Endereço extraído do processo...',
          city: 'Cidade extraída',
          state: 'Estado',
          valuation_value: simulationData.valuation?.value || 0,
          min_bid: simulationData.bid?.value || 0,
          expected_sale_value: simulationData.saleValue?.value || 0
        })
      });
      if (res.ok) {
        const { id } = await parseJsonResponse(res);
        
        // Link documents
        await fetch('/api/documents/link', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              temp_property_id: `temp_${state.sessionId}`,
              property_id: id
            })
        });

        // Save AI Analysis if exists
        if (state.report) {
          await fetch('/api/ai-analyses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              property_id: id,
              exec_summary: state.report,
              ia_used: selectedModel,
              recommended_bid: simulationData.bid?.value || 0,
              estimated_profit: (() => {
                const metrics = calculateSimulationMetrics(simulationData);
                return metrics.netProfit;
              })()
            })
          });
        }

        if (cnjResult) {
          const res = await fetch('/api/processes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              cnj_number: cnjResult.cnj_number,
              court: cnjResult.court,
              chamber: cnjResult.chamber,
              action_type: cnjResult.class,
              debt_value: simulationData.debts?.value || 0,
              parties: cnjResult.parties,
              property_id: id
            })
          });

          if (!res.ok) {
            let errorMsg = 'Erro ao criar processo';
            const errorText = await res.text();
            try {
              const trimmed = errorText.trim().toLowerCase();
              if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
                throw new Error("Resposta do servidor é HTML");
              }
              const errorData = JSON.parse(errorText);
              errorMsg = errorData.error || errorMsg;
            } catch (e) {
              // Ignore JSON parse error if response is not JSON
            }
            throw new Error(errorMsg);
          }
        }

        if (state.processStory) {
          await fetch('/api/process-stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              property_id: id,
              full_story: state.processStory.full_story,
              legal_glossary: state.processStory.legal_glossary,
              timeline_json: JSON.stringify({
                timeline: state.processStory.timeline || [],
                instagram_content: state.processStory.instagram_content || null
              })
            })
          });
        }

        updateState({ selectedPropertyId: id, adHocDocs: [] });
        onPropertyCreated();
        alert("Imóvel cadastrado com sucesso! Todos os documentos, análises e relatórios master foram vinculados.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalysisFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    
    try {
        setUploading(true);
        const propertyId = selectedPropertyId || `temp_${state.sessionId}`;
        
        if (!token) {
          throw new Error("Sessão expirada. Por favor, faça o login novamente.");
        }
        
        const newDocs = await uploadDocuments(files, docType, propertyId, token, (status) => {
          setUploadProgressText(status);
        });
        const newAdHocDocs = await Promise.all(
          newDocs.map(async (doc: any, index: number) => {
            const file = files[index];
            let dataChunk = "";
            if (file.size <= 30 * 1024 * 1024) {
              const base64Data = await fileToBase64(file);
              dataChunk = base64Data.split(',')[1];
            }
            return {
              id: doc.id,
              filename: file.name,
              doc_type: docType,
              data: dataChunk,
              extracted_text: doc.extracted_text,
              created_at: new Date().toISOString()
            };
          })
        );
      
      if (!selectedPropertyId) {
        setState((prev: any) => ({
          ...prev,
          adHocDocs: [...prev.adHocDocs, ...newAdHocDocs]
        }));
      } else {
        // Direct state update for propertyDocs instead of just re-fetching
        setPropertyDocs(prev => [...prev, ...newAdHocDocs]);
        // Also fetchPropertyData to ensure consistency (background)
        fetchPropertyData(selectedPropertyId);
      }
      
      // Specifically handle Judicial Process document matching
      if (docType === 'Processo Judicial') {
        const cnjPattern = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
        for (const file of files) {
          const match = file.name.match(cnjPattern);
          if (match) {
            updateState({ cnjNumber: match[0] });
            await performCnjSearch(match[0]);
            break; // Just use the first one found
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Erro ao enviar arquivos: ${formatErrorMessage(err)}`);
    } finally {
      setUploading(false);
      setUploadProgressText("");
      e.target.value = '';
    }
  };

  const handlePasteText = () => {
    if (!pasteText.trim()) return;
    const newDoc = {
      id: `temp-${Date.now()}`,
      filename: pasteTitle || `Texto Copiado - ${new Date().toLocaleTimeString()}`,
      doc_type: 'Texto Copiado',
      data: `data:text/plain;base64,${btoa(pasteText)}`,
      created_at: new Date().toISOString()
    };
    updateState({ adHocDocs: [...adHocDocs, newDoc] });
    setIsPasteModalOpen(false);
    setPasteText('');
    setPasteTitle('');
  };

  const performCnjSearch = async (number: string) => {
    setSearchingCNJ(true);
    try {
      const res = await fetch('/api/datajud/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cnj_number: number })
      });
      if (!res.ok) throw new Error("Erro na consulta CNJ");
      const data = await parseJsonResponse(res);
      updateState({ cnjResult: data, activeSubTab: 'cnj' });
      return data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setSearchingCNJ(false);
    }
  };

  const handleDeleteAnalysis = async () => {
    if (!state.analysisId) return;
    if (!confirm("Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita.")) return;
    
    try {
      const res = await fetch(`/api/ai-analyses/${state.analysisId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        updateState({ report: null, analysisId: null });
        alert("Análise excluída com sucesso.");
      } else {
        const errText = await res.text();
        let errData;
        try {
          const trimmed = errText.trim().toLowerCase();
          if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
            throw new Error("Resposta do servidor é HTML");
          }
          errData = JSON.parse(errText);
        } catch (e) {
          errData = { error: errText || res.statusText };
        }
        alert(`Erro ao excluir análise: ${errData.error || errText || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir análise.");
    }
  };

  const handleSaveAnalysisEdit = async () => {
    if (!state.analysisId) return;
    
    try {
      const res = await fetch(`/api/ai-analyses/${state.analysisId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ exec_summary: state.report })
      });
      if (res.ok) {
        updateState({ isEditingReport: false });
        alert("Análise atualizada com sucesso.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar análise.");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    console.log("DEBUG: Excluindo documento no frontend e backend:", id);
    try {
      // Enforce optimistic update on both states immediately
      setPropertyDocs((prev: any) => prev.filter((d: any) => d.id !== id));
      setState((prev: any) => ({
        ...prev,
        adHocDocs: prev.adHocDocs.filter((d: any) => d.id !== id)
      }));

      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        console.log("DEBUG: Exclusão concluída no backend com sucesso.");
        if (selectedPropertyId) {
          const docsRes = await fetch(`/api/documents/${selectedPropertyId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (docsRes.ok) {
            const data = await parseJsonResponse(docsRes);
            setPropertyDocs(data);
          }
        }
        if ((window as any).customToast) {
          (window as any).customToast("Documento excluído com sucesso.");
        } else {
          alert("Documento excluído com sucesso.");
        }
      } else {
        const errText = await res.text();
        let errData;
        try {
          const trimmed = errText.trim().toLowerCase();
          if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
            throw new Error("Resposta do servidor é HTML");
          }
          errData = JSON.parse(errText);
        } catch (e) {
          errData = { error: errText || res.statusText };
        }
        const msg = `Erro ao excluir documento: ${errData.error || errText || res.statusText}`;
        if ((window as any).customToast) {
          (window as any).customToast(msg, 'error');
        } else {
          alert(msg);
        }
      }
    } catch (err) {
      console.error(err);
      if ((window as any).customToast) {
        (window as any).customToast("Erro ao excluir documento.", 'error');
      } else {
        alert("Erro ao excluir documento.");
      }
    }
  };

  const handleClearCustomKey = async () => {
    try {
      await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ gemini_key: '' })
      });
      if (state.aiConfig) {
        setState((prev: any) => ({ ...prev, aiConfig: { ...prev.aiConfig, gemini_key: '' } }));
      }
      alert("Chave customizada removida. O sistema agora usará a chave padrão. Reiniciando análise...");
      handleAnalyze();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    updateState({ 
      report: "### 🔄 Iniciando Análise Estratégica...\n\nO sistema está processando seus documentos e consultando o **Cérebro Estratégico** para gerar um parecer completo.\n\n**Isso pode levar de 30 a 60 segundos.** Por favor, não feche esta aba ou mude de aba para garantir a conclusão.", 
      activeSubTab: 'report' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    let userApiKey = "";
    
    try {
      console.log("DEBUG: Iniciando handleAnalyze");
      
      let userApiKey = "";
      
      // Force fetch the latest config to ensure we have the user's keys
      console.log("DEBUG: Buscando aiConfig atualizado antes da análise...");
      const configRes = await fetch('/api/ai-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let currentAiConfig = state.aiConfig;
      
      if (configRes.ok) {
        currentAiConfig = await parseJsonResponse(configRes);
        setState(prev => ({ ...prev, aiConfig: currentAiConfig }));
        console.log("DEBUG: aiConfig carregado com sucesso para análise.");
      }

      userApiKey = resolveApiKey(state.selectedKeySource, currentAiConfig, selectedModel) || "";

      // If user explicitly wants to use system key, we can pass null to the service
      const finalApiKey = userApiKey || null;
      const isUsingCustomKey = !!userApiKey;

      console.log(`DEBUG FRONTEND (ANALYZE): Modelo ${selectedModel}. Chave (tamanho): ${userApiKey?.length || 0}. Usando customizada: ${isUsingCustomKey}`);

      let docs = [];
      if (selectedPropertyId) {
        const docsRes = await fetch(`/api/documents/${selectedPropertyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!docsRes.ok) {
          const text = await docsRes.text();
          console.error("Erro ao buscar documentos:", text);
          throw new Error(`Erro ao carregar documentos (${docsRes.status}).`);
        }
        docs = await parseJsonResponse(docsRes);
      } else {
        docs = adHocDocs;
      }
      
      if (docs.length === 0) {
        throw new Error("Nenhum documento encontrado para análise. Por favor, faça o upload de pelo menos um documento.");
      }
      
      const brainRes = await fetch('/api/strategic-brain', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let brainItems = [];
      if (brainRes.ok) {
        brainItems = await parseJsonResponse(brainRes);
      } else {
        console.warn(`Aviso: Falha ao carregar Cérebro Estratégico (${brainRes.status}). Continuando sem contexto.`);
      }
      
      let brainContextText = Array.isArray(brainItems) 
        ? brainItems.map((item: any) => {
            if (!item.extracted_text) return "";
            const textToUse = item.extracted_text.length > 20000 
              ? item.extracted_text.substring(0, 20000) + "\n... [Texto truncado para otimização de performance] ..."
              : item.extracted_text;
            return `[${item.category}] ${item.title}:\n${textToUse}`;
          }).filter(Boolean).join('\n\n')
        : "";

      if (brainContextText.length > 40000) {
        brainContextText = brainContextText.substring(0, 40000) + "\n\n... [AVISO: O contexto acumulado do Cérebro Estratégico foi limitado a 40 mil caracteres para garantir estabilidade, evitar erros de processamento (Timeout) e manter excelente velocidade de análise] ...";
      }

      let promptWithBrain = `${SYSTEM_PROMPT}\n\nCONTEXTO ESTRATÉGICO DO USUÁRIO (CÉREBRO ESTRATÉGICO):\n${brainContextText}\n\nUse o contexto acima para guiar sua análise e recomendações.`;
      
      if (state.manualAuctionType !== 'auto') {
        promptWithBrain += `\n\nATENÇÃO: Este leilão foi identificado manualmente pelo usuário como sendo do tipo: ${state.manualAuctionType.toUpperCase()}. Por favor, foque sua análise e cálculos financeiros especificamente nas regras deste tipo de leilão.`;
      }

      const fileParts = docs.map(doc => {
        let mimeType = 'application/pdf';
        if (doc.filename.toLowerCase().endsWith('.jpg') || doc.filename.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (doc.filename.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (doc.filename.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

        const hasText = doc.extracted_text && doc.extracted_text.trim().length > 0;
        return {
          id: doc.id,
          filename: doc.filename,
          data: !hasText && doc.data ? (doc.data.startsWith('data:') ? doc.data : `data:${mimeType};base64,${doc.data}`) : "",
          mimeType: mimeType,
          extractedText: doc.extracted_text || ""
        };
      });

      if (fileParts.length === 0) {
        throw new Error("Os documentos selecionados não possuem conteúdo válido para análise.");
      }

      // Filter documents to pass only labeled ones when available, or fall back to all documents
      const editalDocs = docs.filter(d => d.doc_type === 'Edital');
      const matriculaDocs = docs.filter(d => d.doc_type === 'Matrícula');
      const processDocs = docs.filter(d => d.doc_type === 'Processo Judicial');

      const makeFileParts = (filteredDocs: any[]) => {
        const sourceDocs = filteredDocs.length > 0 ? filteredDocs : docs;
        return sourceDocs.map(doc => {
          let mType = 'application/pdf';
          if (doc.filename.toLowerCase().endsWith('.jpg') || doc.filename.toLowerCase().endsWith('.jpeg')) mType = 'image/jpeg';
          else if (doc.filename.toLowerCase().endsWith('.png')) mType = 'image/png';
          else if (doc.filename.toLowerCase().endsWith('.webp')) mType = 'image/webp';

          const hasTxt = doc.extracted_text && doc.extracted_text.trim().length > 0;
          return {
            id: doc.id,
            filename: doc.filename,
            data: !hasTxt && doc.data ? (doc.data.startsWith('data:') ? doc.data : `data:${mType};base64,${doc.data}`) : "",
            mimeType: mType,
            extractedText: doc.extracted_text || ""
          };
        });
      };

      const editalFileParts = makeFileParts(editalDocs);
      const matriculaFileParts = makeFileParts(matriculaDocs);
      const processFileParts = makeFileParts(processDocs);

      const activeProperty = properties.find(p => p.id === selectedPropertyId);
      const propertyContext = activeProperty ? `\n\nIMÓVEL EM LEILÃO: ${activeProperty.title}` : "\n\nIMÓVEL EM LEILÃO: Não especificado.";
      const processesPrompt = `Analise detalhadamente cada documento ou peça do processo judicial anexado para identificar e resumir quaisquer riscos relacionados à arrematação do imóvel.

      ${propertyContext}

      Para cada documento analisado, identifique os seguintes pontos de impacto:
      1. NOME DETALHADO DO DOCUMENTO (Petição, Decisão, Recurso, Certidão, etc.).
      2. OBJETIVO PRINCIPAL: Qual a pretensão da peça ou o teor da decisão?
      3. DISCUSSÕES SOBRE NULIDADES: Há alguma alegação de falta de intimação regular (de cônjuge, coproprietário, credor hipotecário, etc.), preço vil ou irregularidade processual?
      4. RECURSOS PENDENTES: Quais recursos estão tramitando ou podem ser interpostos? Há pedidos de suspensão do leilão em andamento?
      5. IMPACTO POTENCIAL NA POSSE: Qual o efeito da peça na imissão/obtenção da posse pelo arrematante (ex: resistência ativa dos ocupantes, embargos à adjudicação ou à execução)?

      Ao final, apresente um PARECER CONSOLIDADO DE RISCO PROCESSUAL:
      - Classificação Geral de Risco (Baixo, Médio ou Alto).
      - Risco de Anulação do Leilão (Sim/Não - Justificado).
      - Estimativa de Tempo de Desocupação / Ganho de Posse.
      - Recomendação Estratégica Executiva (Se vale a pena arrematar e quais cautelas adotar).

      Formate toda a resposta em português do Brasil, utilizando uma estrutura visual rica e limpa em Markdown, destacando os alertas cruciais.`;

      // Run analysis (unified)
      setState(prev => ({ ...prev, isGeneratingStory: true }));
      
      let aggregatedUrls = [...(state.auctionUrls || [])];
      if (activeProperty && activeProperty.auction_url && activeProperty.auction_url.trim().length > 0) {
        const cleanUrl = activeProperty.auction_url.trim();
        if (!aggregatedUrls.some(u => u.trim() === cleanUrl)) {
          aggregatedUrls.push(cleanUrl);
        }
      }
      aggregatedUrls = aggregatedUrls.filter(u => u && u.trim().length > 5);

      console.log("DEBUG: Iniciando análise simultânea em paralelo para Relatório, Edital, Matrícula, Processo e Dossiê...");

      updateState({ 
        report: "### 🔄 [Passo 1/1] Analisando todos os documentos de forma integrada...\n\nO sistema está processando o Edital, a Matrícula, os Processos e o Dossiê em paralelo para máxima velocidade. Sincronizando com as diretrizes e estratégias extraídas do seu Cérebro Estratégico...", 
        editalAnalysis: "### 🔄 Analisando Edital do Leilão em paralelo...\n\nMapeando datas de leilão, débitos condomínio/IPTU, impostos e multas judiciais...",
        matriculaAnalysis: "### 🔄 Analisando Certidão de Matrícula em paralelo...\n\nMapeando cadeia de proprietários de direito e alienações fiduciárias registradas...",
        processAnalysis: "### 🔄 Analisando Riscos de Processos Judiciais em paralelo...\n\nRelacionando CPFs dos envolvidos e buscando possíveis nulidades processuais...",
        dossierAnalysis: "### 🔄 Compilando Dossiê Estratégico Consolidado em paralelo...\n\nSistematizando riscos de desocupação e gerando recomendações executivas..."
      });

      const [
        analysis,
        editalAnalysis,
        matriculaAnalysis,
        processAnalysis,
        dossierAnalysisResult
      ] = await Promise.all([
        analyzeAuctionDocuments(fileParts, promptWithBrain, selectedModel, finalApiKey || undefined, aggregatedUrls),
        analyzeAuctionDocuments(editalFileParts, "Analise o Edital", selectedModel, finalApiKey || undefined, [], 'edital').catch(err => { 
          console.error("Erro ao analisar edital automaticamente:", err); 
          return "Falha ao gerar análise automática de Edital."; 
        }),
        analyzeAuctionDocuments(matriculaFileParts, "Analise a Matrícula", selectedModel, finalApiKey || undefined, [], 'matricula').catch(err => { 
          console.error("Erro ao analisar certidão de matrícula automaticamente:", err); 
          return "Falha ao gerar análise automática de Certidão de Matrícula."; 
        }),
        analyzeAuctionDocuments(processFileParts, processesPrompt, selectedModel, finalApiKey || undefined, [], 'processo').catch(err => { 
          console.error("Erro ao analisar processos judiciais automaticamente:", err); 
          return "Falha ao gerar análise de riscos processuais."; 
        }),
        analyzeAuctionDocuments(fileParts, "Gere o Dossiê de Arrematação Inteligente", selectedModel, finalApiKey || undefined, aggregatedUrls, 'dossier').catch(err => { 
          console.error("Erro ao gerar dossiê inteligente automaticamente:", err); 
          return "Falha ao gerar Dossiê de Arrematação Inteligente correlacionado."; 
        })
      ]);
      
      let finalReport = analysis || "Falha ao gerar relatório.";
      
      let extractedData = {
        valuation: { value: 0, type: 'BRL' },
        bid: { value: 0, type: 'BRL' },
        desocupacaoAcordo: { value: 0, type: 'BRL' },
        debtsIPTU: { value: 0, type: 'BRL' },
        debtsCondo: { value: 0, type: 'BRL' },
        costs: { value: 0, type: 'BRL' },
        comissaoLeiloeiro: { value: 5, type: 'PERCENT' },
        transfITBI: { value: 3, type: 'PERCENT' },
        reforma: { value: 0, type: 'BRL' },
        saleValue: { value: 0, type: 'BRL' },
        assessoria: { value: 6, type: 'PERCENT' },
        entrada: { value: 1500, type: 'BRL' },
        desocupacaoHonorarios: { value: 0, type: 'BRL' },
        extraFees: { value: 0, type: 'BRL' },
        holdingCosts: { value: 0, type: 'BRL' },
        holdingMonths: 12,
        auctionType: 'judicial',
        modality: '',
        downPaymentPercent: 100,
        installments: 1,
        interestRate: 0,
        transfEscritura: { value: 1.5, type: 'PERCENT' },
        transfRegistro: { value: 1.5, type: 'PERCENT' },
        comparisonData: {
          tesouro: { tir: 11.5, roi: 11.5 },
          cdb: { tir: 12.0, roi: 12.0 },
          poupanca: { tir: 6.5, roi: 6.5 },
          aluguel: { tir: 8.5, roi: 8.5 }
        }
      };

      let extractedStoryData: any = null;

      try {
        // Try to find the first '{' and last '}'
        const firstBrace = analysis?.indexOf('{');
        const lastBrace = analysis?.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = analysis!.substring(firstBrace!, lastBrace! + 1);
          const trimmed = jsonStr.toLowerCase();
          if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
            console.error("AI retornou HTML em vez de JSON:", jsonStr);
            throw new Error("Resposta da IA inválida (HTML retornado)");
          }
          try {
            const parsed = JSON.parse(jsonStr);
            // Extract process story if present in the unified JSON
            const processStoryData = parsed.process_story || parsed.processStory;
            if (processStoryData) {
              extractedStoryData = processStoryData;
              setState(prev => ({ 
                ...prev, 
                processStory: processStoryData,
                isGeneratingStory: false 
              }));
            } else {
              setState(prev => ({ ...prev, isGeneratingStory: false }));
            }

            // Map parsed values to our structure
            const mappedData: any = { ...extractedData };
            Object.keys(parsed).forEach(key => {
              if (key === 'comparisonData') {
                mappedData.comparisonData = { ...mappedData.comparisonData, ...parsed[key] };
              } else if (mappedData[key] && typeof mappedData[key] === 'object' && 'value' in mappedData[key]) {
                // Ensure we only take numeric values
                const val = parseFloat(parsed[key]);
                if (!isNaN(val)) {
                  mappedData[key].value = val;
                }
              } else {
                // Handle non-object fields (auctionType, modality, etc)
                mappedData[key] = parsed[key];
              }
            });
            extractedData = mappedData;
          } catch (e) {
            console.warn("Falha ao parsear JSON estruturado da análise:", e);
          }
        }
      } catch (e) {
        console.warn("Falha ao extrair dados estruturados da análise:", e);
      }

      // Save analysis to database if property is selected
      if (selectedPropertyId) {
        try {
          // Update the property values in the database with the extracted values
          await fetch(`/api/properties/${selectedPropertyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              valuation_value: extractedData.valuation?.value || 0,
              min_bid: extractedData.bid?.value || 0,
              expected_sale_value: extractedData.saleValue?.value || 0
            })
          });

          // Save process story if extracted to prevent it being wiped by background fetches
          if (extractedStoryData) {
            try {
              const checkRes = await fetch(`/api/process-stories/${selectedPropertyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              let existing = null;
              if (checkRes.ok) {
                existing = await parseJsonResponse(checkRes);
              }
              if (existing) {
                await fetch(`/api/process-stories/${existing.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                    full_story: extractedStoryData.full_story,
                    legal_glossary: extractedStoryData.legal_glossary,
                    timeline_json: JSON.stringify({
                      timeline: extractedStoryData.timeline || [],
                      instagram_content: extractedStoryData.instagram_content || extractedStoryData.instagramContent || null
                    })
                  })
                });
              } else {
                await fetch('/api/process-stories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                    property_id: selectedPropertyId,
                    full_story: extractedStoryData.full_story,
                    legal_glossary: extractedStoryData.legal_glossary,
                    timeline_json: JSON.stringify({
                      timeline: extractedStoryData.timeline || [],
                      instagram_content: extractedStoryData.instagram_content || extractedStoryData.instagramContent || null
                    })
                  })
                });
              }
              console.log("DEBUG: Process story successfully auto-saved to database in handleAnalyze.");
            } catch (storyErr) {
              console.error("Erro ao salvar história do processo:", storyErr);
            }
          }

          const saveRes = await fetch('/api/ai-analyses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              property_id: selectedPropertyId,
              exec_summary: finalReport,
              financial_analysis: JSON.stringify(extractedData),
              ia_used: selectedModel,
              recommended_bid: extractedData.bid.value,
              estimated_profit: (() => {
                const getV = (f: any) => (f?.type === 'BRL') ? (f.value || 0) : (extractedData.bid.value * ((f?.value || 0) / 100));
                return (extractedData.saleValue.value || 0) - (
                  (extractedData.bid.value || 0) + 
                  getV(extractedData.debtsIPTU) + getV(extractedData.debtsCondo) +
                  getV(extractedData.costs)
                );
              })(),
              edital_analysis: editalAnalysis,
              matricula_analysis: matriculaAnalysis,
              process_analysis: processAnalysis,
              dossier_analysis: dossierAnalysisResult
            })
          });
          if (saveRes.ok) {
            const saveData = await parseJsonResponse(saveRes);
            updateState({ analysisId: saveData.id });
            fetchPropertyData(selectedPropertyId); // Refresh history
            await generateShareLink(selectedPropertyId);
          }
        } catch (err) {
          console.error("Erro ao salvar análise:", err);
        }
      }

      updateState({ 
        report: finalReport,
        editalAnalysis: editalAnalysis,
        matriculaAnalysis: matriculaAnalysis,
        processAnalysis: processAnalysis,
        dossierAnalysis: dossierAnalysisResult,
        chatMessages: [{ role: 'assistant', content: "Análise concluída. Como posso ajudar a aprofundar algum ponto?" }],
        simulationData: extractedData
      });
      
    } catch (err: any) {
      console.error("Erro detalhado da análise:", err);
      let errorMessage = err.message || "Ocorreu um erro inesperado.";
      
      if (err.message?.includes('503') || err.message?.includes('UNAVAILABLE')) {
        errorMessage = "O servidor de IA está temporariamente sobrecarregado. Por favor, aguarde 30 segundos e tente novamente.";
      } else if (err.message?.includes('504') || err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('gateway')) {
        errorMessage = "Tempo limite excedido (Erro 504: Gateway Timeout). Os documentos enviados contêm muitas páginas ou imagens pesadas não otimizadas que levam mais de 60 segundos para processar nativamente.\n\n" +
          "✅ Correção automática aplicada! O sistema agora removeu automaticamente formatos pesados e otimizou os arquivos grandes. Se o erro persistir, tente mudar o modelo de IA para 'Flash' nas configurações laterais ou divida o PDF em arquivos menores de até 15 páginas.";
      } else if (err.message?.includes('429')) {
        errorMessage = "Limite de requisições (Quota) atingido. Por favor, aguarde um minuto.";
      } else if (err.message?.includes('404') || err.message?.includes('not_found')) {
        const providerName = selectedModel.startsWith('claude') ? 'Anthropic' : 
                             selectedModel.startsWith('gpt') ? 'OpenAI' : 'Google';
        errorMessage = `Modelo não encontrado (404). O modelo '${selectedModel}' não está disponível para sua chave de API no provedor ${providerName}.`;
        
        const keyPreview = userApiKey ? `CHAVE CUSTOMIZADA (${userApiKey.substring(0, 4)}...${userApiKey.substring(userApiKey.length - 4)})` : "CHAVE PADRÃO DO SISTEMA";
        
        updateState({ 
          report: `### ERRO NA ANÁLISE (404)\n\n${errorMessage}\n\n**Chave em uso:** \`${keyPreview}\`\n\n**Log Técnico:** \`${err.message}\`\n\n---\n\n### Como resolver:\n\n1. **Verifique o Tier da Conta:** Algumas chaves de API novas (Tier 0) não têm acesso a modelos avançados até que o primeiro depósito de créditos seja feito.\n2. **Use o Gemini:** Os modelos Gemini Flash estão disponíveis gratuitamente no sistema e são excelentes para esta tarefa.\n3. **Limpe a Chave:** Clique no botão abaixo para usar a chave padrão do sistema.`,
          isGeneratingStory: false
        });
        return;
      } else if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
        const rawError = err.message || "";
        
        if (rawError.includes("configurações de IA")) {
          errorMessage = `Erro de Autenticação Interna (403). Não foi possível carregar suas configurações. Tente sair e entrar novamente no sistema.`;
        } else {
          const providerName = selectedModel.startsWith('claude') ? 'Anthropic' : 
                               selectedModel.startsWith('gpt') ? 'OpenAI' : 'Google';
          errorMessage = `Acesso negado (403). O modelo '${selectedModel}' foi rejeitado pelo provedor ${providerName}.`;
        }
        
        const keyPreview = userApiKey ? `CHAVE CUSTOMIZADA (${userApiKey.substring(0, 4)}...${userApiKey.substring(userApiKey.length - 4)})` : "CHAVE PADRÃO DO SISTEMA";
        let detailedError = "";
        
        if (rawError.includes("unregistered callers") || rawError.includes("authentication")) {
          detailedError = `\n\n**ERRO DE IDENTIDADE (CHAVE AUSENTE):** O provedor não recebeu sua chave de API. Isso acontece se a chave estiver vazia ou se o sistema não conseguiu carregar a chave padrão.\n\n**Chave em uso:** \`${keyPreview}\``;
        } else if (rawError.includes("API_KEY_INVALID") || rawError.includes("invalid-api-key")) {
          detailedError = `\n\n**CHAVE INVÁLIDA:** A chave fornecida não é reconhecida. Verifique se você copiou a chave completa.\n\n**Chave em uso:** \`${keyPreview}\``;
        } else {
          detailedError = `\n\n**ERRO DE PERMISSÃO:** O acesso foi rejeitado. Verifique se sua chave está ativa e se você possui créditos/saldo na sua conta do provedor.\n\n**Chave em uso:** \`${keyPreview}\``;
        }
        
        const keyPrefix = selectedModel.startsWith('claude') ? 'sk-ant-...' : 
                          selectedModel.startsWith('gemini') ? 'AIza...' : 'sk-...';

        updateState({ 
          report: `### ERRO NA ANÁLISE (403)\n\n${errorMessage}${detailedError}\n\n**Log Técnico:** \`${rawError}\`\n\n---\n\n### Como resolver definitivamente:\n\n1. **Verifique sua Chave:** Vá em Configuração IA e confirme se sua chave começa com '${keyPrefix}'.\n2. **Saldo/Créditos:** Verifique no console do provedor se você possui saldo disponível.\n3. **Use o Padrão:** Clique no botão laranja abaixo para limpar sua chave e usar o motor padrão do sistema.`,
          isGeneratingStory: false
        });
        return;
      } else if (err.message?.includes('API_KEY_INVALID')) {
        errorMessage = "Chave de API inválida. Verifique se a chave foi copiada corretamente nas configurações de IA.";
      } else if ((err.message?.includes('limit') || err.message?.includes('too large')) && !err.message?.includes('excede o limite') && !err.message?.includes('Tempo limite')) {
        errorMessage = "O volume de dados é muito grande para uma única análise. Tente reduzir o número de páginas ou arquivos.";
      }
      
      updateState({ 
        report: `### Erro na Análise\n${errorMessage}\n\n*Dica: Se você atualizou seu plano, selecione **Padrão do Sistema** no provedor de IA (no menu lateral esquerdo) para usar o motor integrado de alta velocidade do seu plano atual sem limitações de chave própria.*`,
        isGeneratingStory: false
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !report) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    updateState({ chatMessages: newMessages });
    setChatInput('');
    setSendingChat(true);
    try {
      let userApiKey = "";
      const aiConfig = state.aiConfig;
      
      if (aiConfig) {
        userApiKey = resolveApiKey(state.selectedKeySource, aiConfig, selectedModel) || "";
      } else {
        const configRes = await fetch('/api/ai-config', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (configRes.ok) {
          const fetchedConfig = await parseJsonResponse(configRes);
          setState((prev: any) => ({ ...prev, aiConfig: fetchedConfig }));
          userApiKey = resolveApiKey(state.selectedKeySource, fetchedConfig, selectedModel) || "";
        }
      }

      console.log(`DEBUG FRONTEND (CHAT): Modelo ${selectedModel}. Chave (tamanho): ${userApiKey?.length || 0}`);

      // Query any chat attachments uploaded in the active session
      const selectedPropertyId = state.selectedPropertyId;
      const activeDocs = selectedPropertyId ? propertyDocs : state.adHocDocs;
      const chatAttachments = activeDocs.filter((d: any) => d.doc_type === 'Anexo Chat');
      
      let attachmentsCtx = "";
      if (chatAttachments.length > 0) {
        attachmentsCtx = "\n\nO usuário anexou os seguintes documentos adicionais ao chat para consulta/referência:\n";
        chatAttachments.forEach((doc: any, i: number) => {
          attachmentsCtx += `--- INÍCIO DO ARQUIVO ANEXADO ${i + 1}: ${doc.filename || 'Sem Nome'} ---\n`;
          attachmentsCtx += `Conteúdo extraído:\n${doc.extracted_text || '(Nenhum conteúdo de texto pôde ser extraído ou o arquivo está vazio)'}\n`;
          attachmentsCtx += `--- FIM DO ARQUIVO ANEXADO ${i + 1} ---\n\n`;
        });
      }

      const response = await sendChatMessage(
        newMessages, 
        `Relatório Original:\n${report}\n${attachmentsCtx}\n\n${SYSTEM_PROMPT}\n\nPor favor, responda o assunto considerando com extrema atenção e integridade os documentos adicionados pelo usuário no anexo do chat acima. Responda sempre em português do Brasil.`, 
        selectedModel, 
        userApiKey || undefined
      );
      
      const updatedReport = `${report}\n\n---\n\n### Adendo do Chat\n\n**Pergunta:** ${userMsg.content}\n\n**Resposta:**\n${response}`;
      
      updateState({ 
        chatMessages: [...newMessages, { role: 'assistant', content: response || 'Sem resposta.' }],
        report: updatedReport
      });
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Erro ao processar sua pergunta. Tente novamente.";
      if (err.message?.includes('503') || err.message?.includes('UNAVAILABLE')) {
        errorMessage = "O servidor de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns segundos.";
      }
      updateState({ chatMessages: [...newMessages, { role: 'assistant', content: `❌ ${errorMessage}` }] });
    } finally {
      setSendingChat(false);
    }
  };

  const handleSendTabChat = async (tab: 'matricula' | 'processos' | 'documents') => {
    let input = "";
    let chatMsgs: ChatMessage[] = [];
    let setInput: any = null;
    let setMsgs: any = null;
    let setSending: any = null;
    let promptContext = "";

    if (tab === 'matricula') {
      input = matriculaChatInput;
      chatMsgs = matriculaChatMessages;
      setInput = setMatriculaChatInput;
      setMsgs = setMatriculaChatMessages;
      setSending = setSendingMatriculaChat;
      promptContext = `Análise de Matrícula Atual:\n${state.matriculaAnalysis || "Nenhuma análise de matrícula executada ainda."}`;
    } else if (tab === 'processos') {
      input = processosChatInput;
      chatMsgs = processosChatMessages;
      setInput = setProcessosChatInput;
      setMsgs = setProcessosChatMessages;
      setSending = setSendingProcessosChat;
      promptContext = `Análise de Processos Atual:\n${state.processAnalysis || "Nenhuma análise de processos executada ainda."}`;
    } else if (tab === 'documents') {
      input = documentsChatInput;
      chatMsgs = documentsChatMessages;
      setInput = setDocumentsChatInput;
      setMsgs = setDocumentsChatMessages;
      setSending = setSendingDocumentsChat;
      
      const filesSummary = analysisDocs.map((doc: any, i: number) => {
        return `[Documento ${i+1}: ${doc.filename} (Tipo: ${doc.doc_type})]\n${(doc.extracted_text || "").substring(0, 8000)}`;
      }).join("\n\n");
      promptContext = `Resumo dos documentos do Dossiê:\n${filesSummary || "Nenhum documento anexado ao dossiê."}`;
    }

    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    const newMessages = [...chatMsgs, userMsg];
    setMsgs(newMessages);
    setInput('');
    setSending(true);

    try {
      let userApiKey = "";
      const aiConfig = state.aiConfig;
      if (aiConfig) {
        userApiKey = resolveApiKey(state.selectedKeySource, aiConfig, selectedModel) || "";
      } else {
        const configRes = await fetch('/api/ai-config', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (configRes.ok) {
          const fetchedConfig = await parseJsonResponse(configRes);
          setState((prev: any) => ({ ...prev, aiConfig: fetchedConfig }));
          userApiKey = resolveApiKey(state.selectedKeySource, fetchedConfig, selectedModel) || "";
        }
      }

      const response = await sendChatMessage(
        newMessages, 
        `Contexto Relacionado à Aba ${tab.toUpperCase()}:\n${promptContext}\n\n${SYSTEM_PROMPT}\n\nPor favor, responda o assunto sobre ${tab} considerando com extrema atenção e integridade os dados jurídicos e os documentos acima. Responda sempre em português do Brasil e de forma direta.`, 
        selectedModel, 
        userApiKey || undefined
      );

      setMsgs([...newMessages, { role: 'assistant', content: response || "Sem resposta." }]);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Erro ao processar sua pergunta. Tente novamente.";
      if (err.message?.includes('503') || err.message?.includes('UNAVAILABLE')) {
        errorMessage = "O servidor de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns segundos.";
      }
      setMsgs([...newMessages, { role: 'assistant', content: `❌ ${errorMessage}` }]);
    } finally {
      setSending(false);
    }
  };

  const renderTabChat = (tab: 'matricula' | 'processos' | 'documents') => {
    let title = "";
    let placeholder = "";
    let inputVal = "";
    let setInputVal: any = null;
    let msgs: ChatMessage[] = [];
    let sending = false;

    if (tab === 'matricula') {
      title = "Dúvidas sobre a Matrícula";
      placeholder = "Pergunte algo sobre gravames, adquirentes federais ou indisponibilidades...";
      inputVal = matriculaChatInput;
      setInputVal = setMatriculaChatInput;
      msgs = matriculaChatMessages;
      sending = sendingMatriculaChat;
    } else if (tab === 'processos') {
      title = "Discussão do Processo Judicial";
      placeholder = "Pergunte sobre prazos judiciais, andamento ou incidentes relatados...";
      inputVal = processosChatInput;
      setInputVal = setProcessosChatInput;
      msgs = processosChatMessages;
      sending = sendingProcessosChat;
    } else if (tab === 'documents') {
      title = "Análise de Documentos e Evidências";
      placeholder = "Pergunte sobre contradições de datas, falta de certidões ou termos ocultos...";
      inputVal = documentsChatInput;
      setInputVal = setDocumentsChatInput;
      msgs = documentsChatMessages;
      sending = sendingDocumentsChat;
    }

    return (
      <div className="space-y-6 pt-10 border-t border-black/5 no-print" id={`chat-section-${tab}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-black">
            <MessageSquare size={20} />
          </div>
          <h5 className="text-lg font-bold text-brand-primary">{title}</h5>
        </div>

        <div className="bg-brand-bg rounded-[2rem] p-6 space-y-6 max-h-[350px] overflow-y-auto border border-brand-primary/10">
          {msgs.map((msg, idx) => (
            <div key={idx} className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                msg.role === 'assistant' ? "bg-brand-primary text-black" : "bg-brand-ink/10 text-brand-ink/40"
              )}>
                {msg.role === 'assistant' ? <Cpu size={14} /> : <Users size={14} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                msg.role === 'assistant' ? "bg-brand-paper shadow-sm markdown-body !text-sm text-brand-ink" : "bg-brand-primary text-black whitespace-pre-wrap"
              )}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-black shrink-0">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-brand-paper shadow-sm text-sm font-medium text-brand-ink/20 italic">
                IA está pensando...
              </div>
            </div>
          )}
        </div>

        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendTabChat(tab)}
              placeholder={placeholder}
              className="w-full bg-brand-bg border border-brand-primary/10 rounded-2xl py-5 px-6 pr-16 focus:ring-2 focus:ring-brand-primary outline-none font-medium text-brand-ink"
            />
            <button 
              onClick={() => handleSendTabChat(tab)}
              disabled={sending || !inputVal.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-primary text-black rounded-xl flex items-center justify-center hover:bg-brand-primary/90 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-primary">Central de Inteligência</h2>
          <p className="text-brand-ink/40 font-medium text-lg">Fluxo completo: Consulta CNJ, Documentos e Análise de IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar: Configuration */}
        {!isPublicView && (
          <div className="lg:col-span-1 space-y-8 no-print">
            <Card title="Contexto da Análise">
            <div className="space-y-6">
              <select 
                className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary font-bold text-sm text-brand-primary"
                value={selectedPropertyId || ''}
                onChange={e => {
                  updateState({ 
                    selectedPropertyId: e.target.value,
                    report: null,
                    chatMessages: [],
                    adHocDocs: e.target.value ? adHocDocs : []
                  });
                }}
              >
                <option value="">Análise Avulsa (Sem Imóvel)</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              
              
              <div className="pt-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-2 block font-sans">1. Provedor / API Key</label>
                <select 
                  className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary font-bold text-xs text-brand-primary"
                  value={state.selectedKeySource}
                  onChange={e => {
                    const nextSource = e.target.value as any;
                    let nextModel = state.selectedModel;
                    if (nextSource === 'system_default' || nextSource === 'gemini_custom') {
                      nextModel = 'gemini-2.5-flash';
                    } else if (nextSource === 'openai_custom') {
                      nextModel = 'gpt-4o';
                    }
                    updateState({ selectedKeySource: nextSource, selectedModel: nextModel });
                  }}
                >
                  <option value="system_default">Padrão do Sistema (Google AI Studio - Gemini)</option>
                  <option value="openai_custom">OpenAI / ChatGPT (Minha Chave)</option>
                  <option value="gemini_custom">Google Gemini (Minha Chave)</option>
                </select>
                
                  {/* Status Indicator Badge */}
                  <div className="mt-2 ml-1 text-[10px] font-medium transition-all">
                    {state.selectedKeySource === 'system_default' && (
                      <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
                        Chave Integrada Ativa (Plano Atual Ativo)
                      </span>
                    )}
                  {state.selectedKeySource === 'openai_custom' && (
                    state.aiConfig?.openai_key?.trim() ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Chave OpenAI Cadastrada</span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Chave não cadastrada (Configuração de IA)</span>
                    )
                  )}
                  {state.selectedKeySource === 'gemini_custom' && (
                    state.aiConfig?.gemini_key?.trim() ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Chave Gemini Cadastrada</span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Chave não cadastrada (Configuração de IA)</span>
                    )
                  )}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-2 block font-sans">2. Cérebro de IA (Modelo)</label>
                <select 
                  className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary font-bold text-xs text-brand-primary"
                  value={selectedModel}
                  onChange={e => updateState({ selectedModel: e.target.value as AIModel })}
                >
                  {(state.selectedKeySource === 'system_default' || state.selectedKeySource === 'gemini_custom') && (
                    <optgroup label="Google Gemini">
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (Ultra-Rápido - Recomendado)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                      <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash (Preview)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Preciso - Pago)</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido - Pago)</option>
                      <option value="gemini-3-flash-preview">Gemini 3 Flash (Rápido/Eficiente)</option>
                      <option value="gemini-flash-latest">Gemini 1.5 Flash (Legado)</option>
                    </optgroup>
                  )}
                  {state.selectedKeySource === 'openai_custom' && (
                    <optgroup label="OpenAI GPT">
                      <option value="gpt-5">GPT-5 (Nova Geração)</option>
                      <option value="gpt-4o">GPT-4o (Omni)</option>
                      <option value="o1-preview">OpenAI o1 (Raciocínio)</option>
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-4 block">Tipo de Leilão (Precisão)</label>
                <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border/50">
                  <button 
                    onClick={() => updateState({ manualAuctionType: 'auto' })}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      state.manualAuctionType === 'auto' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                    )}
                  >
                    Auto
                  </button>
                  <button 
                    onClick={() => updateState({ manualAuctionType: 'judicial' })}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      state.manualAuctionType === 'judicial' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                    )}
                  >
                    Judicial
                  </button>
                  <button 
                    onClick={() => updateState({ manualAuctionType: 'extrajudicial' })}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      state.manualAuctionType === 'extrajudicial' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                    )}
                  >
                    Extra
                  </button>
                </div>
                <p className="text-[9px] text-brand-ink/30 italic mt-2 px-1">
                  {state.manualAuctionType === 'auto' ? 'A IA detectará o tipo automaticamente.' : 
                   state.manualAuctionType === 'judicial' ? 'Força análise para leilão judicial.' : 
                   'Força análise para leilão extrajudicial (Caixa/Bancos).'}
                </p>
              </div>

              {!selectedPropertyId && (
                <div className="p-5 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-relaxed">
                    Você está em modo de análise avulsa. Suba os documentos abaixo para analisar sem cadastrar um imóvel.
                  </p>
                </div>
              )}
            </div>
          </Card>


          <button 
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-brand-primary text-black py-5 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="animate-spin" size={20} /> : <Cpu size={20} />}
            Executar Análise IA
          </button>
        </div>
        )}

        {/* Main Area: Results & Tabs */}
        <div className={cn("space-y-6", isPublicView ? "lg:col-span-4" : "lg:col-span-3")}>
          <div className="bg-brand-paper rounded-[2.5rem] border border-brand-primary/10 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            {/* Tabs Header */}
            <div className="flex border-b border-brand-primary/10 bg-brand-bg/30 overflow-x-auto no-print">
              <AnalysisTab active={activeSubTab === 'report'} onClick={() => updateState({ activeSubTab: 'report' })} icon={<Brain size={16} />} label="Relatório" />
              <AnalysisTab active={activeSubTab === 'smart_analysis'} onClick={() => updateState({ activeSubTab: 'smart_analysis' })} icon={<Cpu size={16} />} label="Análise Smart" />
              <AnalysisTab active={activeSubTab === 'dossier'} onClick={() => updateState({ activeSubTab: 'dossier' })} icon={<Clipboard size={16} />} label="Dossiê de Arrematação" />
              <AnalysisTab active={activeSubTab === 'edital'} onClick={() => updateState({ activeSubTab: 'edital' })} icon={<FileText size={16} />} label="Edital" />
              <AnalysisTab active={activeSubTab === 'matricula'} onClick={() => updateState({ activeSubTab: 'matricula' })} icon={<BookOpen size={16} />} label="Matrícula" />
              <AnalysisTab active={activeSubTab === 'processos'} onClick={() => updateState({ activeSubTab: 'processos' })} icon={<Search size={16} />} label="Processos" />
              {!isPublicView && <AnalysisTab active={activeSubTab === 'documents'} onClick={() => updateState({ activeSubTab: 'documents' })} icon={<Files size={16} />} label="Documentos" />}
              <AnalysisTab active={activeSubTab === 'simulations'} onClick={() => updateState({ activeSubTab: 'simulations' })} icon={<TrendingUp size={16} />} label="Simulação" />
              <AnalysisTab active={activeSubTab === 'investors'} onClick={() => updateState({ activeSubTab: 'investors' })} icon={<Users size={16} />} label="Investidores" />
              <AnalysisTab active={activeSubTab === 'instagram'} onClick={() => updateState({ activeSubTab: 'instagram' })} icon={<Instagram size={16} />} label="Captação" />
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 sm:p-6 md:p-10">
              {activeSubTab === 'report' && (
                <MasterReportView 
                  state={state} 
                  setState={setState} 
                  property={selectedProperty} 
                  metrics={metrics} 
                  tir={tir} 
                  roi={roi}
                  token={token}
                />
              )}
              {activeSubTab === 'dossier' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-brand-primary">Dossiê de Arrematação Inteligente</h3>
                      <p className="text-sm text-brand-ink/50 mt-1">
                        Sintetiza de forma automatizada e cruzada os dados da Matrícula, Edital e Processos para preenchimento de sistemas de arrematação.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={handleAnalyzeDossier} 
                        disabled={analyzing} 
                        className="bg-brand-primary text-black px-6 py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-brand-primary/10"
                      >
                        {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {state.dossierAnalysis ? 'Atualizar Dossiê com IA' : 'Gerar Dossiê com IA'}
                      </button>
                    </div>
                  </div>

                  {!state.dossierAnalysis && !analyzing && (
                    <div className="bg-brand-bg/10 rounded-3xl border border-brand-primary/10 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 mt-6">
                      <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mx-auto border border-brand-primary/10">
                        <Clipboard size={32} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-brand-primary">Gerar Dossiê de Arrematação</h4>
                        <p className="text-sm text-brand-ink/60">
                          Este recurso inovador reúne e analisa os documentos de Matrícula, Edital e Processos Judiciais juntos para gerar um dossiê integrado completo de viabilidade, jurídico e financeiro.
                        </p>
                      </div>
                      <button 
                        onClick={handleAnalyzeDossier}
                        className="bg-brand-primary text-black px-8 py-3.5 rounded-xl font-bold hover:bg-brand-primary/90 transition-all font-sans"
                      >
                        Iniciar Compilação Inteligente
                      </button>
                    </div>
                  )}

                  {analyzing && !state.dossierAnalysis && (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="animate-spin text-brand-primary" size={48} />
                      <div className="text-center">
                        <p className="font-bold text-lg text-brand-primary">Gerando Dossiê Integrado...</p>
                        <p className="text-xs text-brand-ink/40 mt-1">Nossos agentes de IA estão analisando matrícula, edital e o processo para extrair o dossiê consolidado.</p>
                      </div>
                    </div>
                  )}

                  {state.dossierAnalysis && (
                    <div className="space-y-6">
                      {/* Integrabilidade com a Calculadora TJInvest */}
                      <div className="bg-brand-primary/5 rounded-3xl border border-brand-primary/10 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                            <Calculator size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-primary"> Integração d'Arremate (Calculadora TJInvest)</h4>
                            <p className="text-xs text-brand-ink/50">Transmita facilmente estes dados para sua calculadora externa em <code className="text-brand-primary font-mono text-[11px]">calculadora.tjinvest.com.br</code></p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="bg-brand-bg/40 p-4 rounded-2xl border border-brand-primary/5 space-y-2">
                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Cópia Rápida para Cadastro</span>
                            <p className="text-xs text-brand-ink/60">Use a cópia rápida abaixo para copiar os dados limpos em formato estruturado pronto para colar em tabelas e calculadoras de lances.</p>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(state.dossierAnalysis || '');
                                alert("Dossiê copiado com sucesso em Markdown!");
                              }}
                              className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2"
                            >
                              <Copy size={12} /> Copiar Dossiê Completo
                            </button>
                          </div>
                          <div className="bg-brand-bg/40 p-4 rounded-2xl border border-brand-primary/5 space-y-2">
                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Cópia Rápida dos Valores Chave</span>
                            <p className="text-xs text-brand-ink/60">Copia de uma vez as variáveis numéricas tratadas (Valor Mercado, Lance Mínimo, Lance Máximo Sugerido) para alimentar a calculadora.</p>
                            <button 
                              onClick={() => {
                                const numericPayload = {
                                  valuation: metrics?.valuation || 0,
                                  min_bid: metrics?.bid || 0,
                                  suggested_max_bid: (metrics?.bid || 0) * 1.3,
                                  condominium_debts: metrics?.debtsCondo || 0,
                                  iptu_debts: metrics?.debtsIPTU || 0,
                                  address: selectedProperty?.address || "",
                                  city: selectedProperty?.city || "",
                                  state: selectedProperty?.state || ""
                                };
                                navigator.clipboard.writeText(JSON.stringify(numericPayload, null, 2));
                                alert("Valores numéricos copiados no formato JSON!");
                              }}
                              className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2"
                            >
                              <Copy size={12} /> Copiar JSON de Integração
                            </button>
                          </div>
                        </div>
                      </div>

                      <Card title="Resultado do Dossiê Integrado">
                        <div className="flex justify-between items-center mb-6 border-b border-brand-primary/10 pb-4 no-print gap-4 flex-wrap">
                          <span className="text-xs font-mono text-brand-ink/40">Análise gerada via {selectedModel}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(state.dossierAnalysis || '');
                                alert("Copiado!");
                              }}
                              className="flex items-center gap-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              <Copy size={14} /> Copiar Texto
                            </button>
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="flex items-center gap-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              <Printer size={14} /> Imprimir Dossiê
                            </button>
                          </div>
                        </div>
                        <div className="markdown-body font-sans text-brand-ink/90 leading-relaxed text-sm antialiased space-y-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.dossierAnalysis}</ReactMarkdown>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              )}
              {activeSubTab === 'edital' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-brand-primary">Análise de Edital</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <Card title="Edital">
                      <button onClick={handleAnalyzeEdital} disabled={analyzing} className="w-full bg-brand-primary text-black py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-all disabled:opacity-50">
                        {analyzing ? 'Analisando...' : 'Executar Análise de Edital'}
                      </button>
                    </Card>
                    {state.editalAnalysis && (
                      <Card title="Resultado da Análise de Edital">
                        {!isPublicView && (
                          <div className="flex justify-end gap-3 mb-4 no-print">
                            <button
                              type="button"
                              onClick={handleShare}
                              className="flex items-center gap-2 bg-brand-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-sm"
                            >
                              <Globe size={14} /> Compartilhar / Gerar Link Público
                            </button>
                          </div>
                        )}
                        <div className="p-1 sm:p-2 bg-brand-paper rounded-3xl border border-brand-border shadow-lg">
                          <EditalReport 
                            rawAnalysis={state.editalAnalysis} 
                            propertyAddress={selectedProperty?.address}
                            propertyCity={selectedProperty?.city}
                            propertyState={selectedProperty?.state}
                            valuation={metrics?.valuation}
                          />
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              {activeSubTab === 'matricula' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-brand-primary">Análise de Matrícula</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <Card title="Matrícula">
                      <button onClick={handleAnalyzeMatricula} disabled={analyzing} className="w-full bg-brand-primary text-black py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-all disabled:opacity-50">
                        {analyzing ? 'Analisando...' : 'Executar Análise de Matrícula'}
                      </button>
                    </Card>
                    {state.matriculaAnalysis && (
                      <Card title="Resultado da Análise de Matrícula">
                        {!isPublicView && (
                          <div className="flex justify-end gap-3 mb-4 no-print">
                            <button
                              type="button"
                              onClick={handleShare}
                              className="flex items-center gap-2 bg-brand-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-sm"
                            >
                              <Globe size={14} /> Compartilhar / Gerar Link Público
                            </button>
                          </div>
                        )}
                        <div className="p-1 sm:p-2 bg-brand-paper rounded-3xl border border-brand-border shadow-lg">
                          <MatriculaReport 
                            rawAnalysis={state.matriculaAnalysis} 
                            propertyAddress={selectedProperty?.address}
                            propertyCity={selectedProperty?.city}
                            propertyState={selectedProperty?.state}
                            valuation={metrics?.valuation}
                            bidValue={metrics?.bid}
                          />
                        </div>
                      </Card>
                    )}
                  </div>
                  {renderTabChat('matricula')}
                </div>
              )}
              {activeSubTab === 'processos' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-brand-primary">Análise de Processos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Upload de Processos">
                      <p className="text-brand-ink/60 mb-4">Gerencie os processos judiciais vinculados a este imóvel.</p>
                      <button 
                        onClick={handleAnalyzeProcesses}
                        disabled={analyzing}
                        className="w-full bg-brand-primary text-black py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                      >
                        {analyzing ? 'Analisando...' : 'Executar Análise de Processos'}
                      </button>
                    </Card>
                  </div>
                  {state.processAnalysis && (
                    <Card title="Resultado da Análise de Processos">
                      {!isPublicView && (
                        <div className="flex justify-end gap-3 mb-4 no-print">
                          <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-brand-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-sm"
                          >
                            <Globe size={14} /> Compartilhar / Gerar Link Público
                          </button>
                        </div>
                      )}
                      <div className="p-1 sm:p-2 bg-brand-paper rounded-3xl border border-brand-border shadow-lg">
                        <ProcessoReport 
                          rawAnalysis={state.processAnalysis} 
                          propertyAddress={selectedProperty?.address}
                          propertyCity={selectedProperty?.city}
                          propertyState={selectedProperty?.state}
                          valuation={metrics?.valuation}
                        />
                      </div>
                    </Card>
                  )}
                  {renderTabChat('processos')}
                </div>
              )}
              {isPasteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-brand-paper w-full max-w-2xl rounded-[2.5rem] p-12 shadow-2xl border border-brand-primary/10"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold text-brand-primary">Colar Texto para Análise</h3>
                      <button onClick={() => setIsPasteModalOpen(false)} className="p-2 hover:bg-brand-primary/10 rounded-full text-brand-primary"><X size={24} /></button>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Título da Nota</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Notas sobre a vistoria"
                          className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary text-brand-ink" 
                          value={pasteTitle}
                          onChange={e => setPasteTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">Conteúdo</label>
                        <textarea 
                          rows={8}
                          className="w-full bg-brand-bg border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-primary resize-none text-brand-ink"
                          placeholder="Cole aqui o texto, links ou observações..."
                          value={pasteText}
                          onChange={e => setPasteText(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={handlePasteText}
                        className="w-full bg-brand-primary text-black py-4 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all"
                      >
                        Adicionar ao Dossiê
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {activeSubTab === 'report' && (
                <div className="space-y-10">
                  {report ? (
                    <div className="space-y-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-8 gap-6">
                        <div className="space-y-2">
                          <h4 className="text-3xl font-serif font-bold text-brand-primary">
                            {anonymizeProperty ? "Análise Estratégica de Oportunidade" : (selectedPropertyId ? properties.find(p => p.id === selectedPropertyId)?.title : "Relatório Estratégico")}
                          </h4>
                          {!anonymizeProperty && selectedPropertyId && (
                            <div className="flex items-center gap-2 text-brand-ink/40 text-sm font-medium">
                              <Search size={14} />
                              <span>{properties.find(p => p.id === selectedPropertyId)?.address}, {properties.find(p => p.id === selectedPropertyId)?.city} - {properties.find(p => p.id === selectedPropertyId)?.state}</span>
                            </div>
                          )}
                          
                          {propertyAnalyses.length > 0 && (
                            <div className="flex items-center gap-3 mt-4 no-print">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/30">Versão:</span>
                              <select 
                                className="bg-brand-bg border border-brand-primary/10 rounded-lg px-3 py-1 text-xs font-bold text-brand-primary outline-none"
                                value={state.analysisId || ''}
                                onChange={(e) => {
                                  const selected = propertyAnalyses.find(a => a.id === e.target.value);
                                  if (selected) {
                                    updateState({ 
                                      report: selected.exec_summary, 
                                      selectedModel: selected.ia_used,
                                      analysisId: selected.id
                                    });
                                  }
                                }}
                              >
                                {propertyAnalyses.map((a, idx) => (
                                  <option key={a.id} value={a.id}>
                                    {idx === 0 ? 'Última Análise' : `Análise #${propertyAnalyses.length - idx}`} ({a.ia_used}) - {new Date(a.created_at).toLocaleDateString()}
                                  </option>
                                ))}
                              </select>
                              <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-lg text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                                IA: {selectedModel}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 no-print">
                          <div className="flex bg-brand-bg rounded-xl p-1">
                            <button 
                              className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", simulationData.paymentType === 'vista' ? "bg-brand-primary text-black" : "text-brand-ink/40")}
                              onClick={() => updateState({ simulationData: { ...simulationData, paymentType: 'vista' } })}
                            >
                              À Vista
                            </button>
                            <button 
                              className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", simulationData.paymentType === 'parcelado' ? "bg-brand-primary text-black" : "text-brand-ink/40")}
                              onClick={() => updateState({ simulationData: { ...simulationData, paymentType: 'parcelado' } })}
                            >
                              Parcelado
                            </button>
                          </div>
                          <button 
                            onClick={() => updateState({ activeSubTab: 'documents' })}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-brand-bg text-brand-ink hover:bg-brand-bg/80 transition-all"
                          >
                            <Files size={16} />
                            Adicionar Documentos
                          </button>
                          <button 
                            onClick={() => updateState({ activeSubTab: 'simulations' })}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-brand-primary text-black hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                          >
                            <TrendingUp size={16} />
                            Editar Simulação
                          </button>
                          {!isPublicView && (
                            <>
                              {!selectedPropertyId && (
                                <button 
                                  onClick={handleSaveAsProperty}
                                  className="flex items-center gap-2 bg-brand-primary text-black px-6 py-3 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                                >
                                  <Save size={16} /> Salvar
                                </button>
                              )}
                              <button 
                                onClick={handleShare}
                                className="flex items-center gap-2 bg-brand-primary text-black px-6 py-3 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                              >
                                <Globe size={16} /> Compartilhar / Gerar Link Público
                              </button>
                            </>
                          )}
                          <button 
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-brand-paper border border-brand-border text-brand-ink/60 px-6 py-3 rounded-xl text-xs font-bold hover:text-brand-primary hover:border-brand-primary/30 transition-all font-sans"
                            title="Salvar como PDF ou Imprimir o relatório completo"
                          >
                            <Printer size={16} /> Salvar PDF / Imprimir
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleCopyText(report || '', setCopiedReport)}
                            className="flex items-center gap-2 bg-brand-paper border border-brand-border text-brand-ink/60 px-6 py-3 rounded-xl text-xs font-bold hover:text-brand-primary hover:border-brand-primary/30 transition-all font-sans"
                            title="Copiar relatório formatado em texto para a área de transferência"
                          >
                            {copiedReport ? (
                              <>
                                <Check size={16} className="text-emerald-500" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy size={16} /> Copiar Relatório
                              </>
                            )}
                          </button>
                          {!isPublicView && (
                            <button 
                              type="button"
                              onClick={handleNewAnalysis}
                              className="flex items-center gap-2 bg-brand-bg border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 px-6 py-3 rounded-xl text-xs font-bold transition-all font-sans"
                              title="Iniciar uma nova análise jurídica/financeira do zero"
                            >
                              <RefreshCw size={16} /> Nova Análise
                            </button>
                          )}
                          {state.analysisId && !isPublicView && (
                            <div className="flex gap-2">
                              <button 
                                type="button"
                                onClick={() => updateState({ isEditingReport: !state.isEditingReport })}
                                className={cn(
                                  "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all",
                                  state.isEditingReport ? "bg-brand-primary text-black" : "bg-brand-paper border border-brand-border text-brand-ink/60 hover:text-brand-primary"
                                )}
                              >
                                <Edit size={16} /> {state.isEditingReport ? "Visualizar" : "Editar"}
                              </button>
                              <button 
                                type="button"
                                onClick={handleDeleteAnalysis}
                                className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={16} /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        <div className="bg-brand-paper/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-brand-border">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 mb-2">Valor de Venda</p>
                          <p className="text-sm sm:text-lg font-bold text-brand-ink break-all">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saleValue || 0)}
                          </p>
                        </div>
                        <div className="bg-brand-paper/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-brand-border">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 mb-2">Custos da Arrematação</p>
                          <p className="text-sm sm:text-lg font-bold text-brand-primary break-all">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalInvestment || 0)}
                          </p>
                        </div>
                        <div className="bg-brand-paper/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-brand-border">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 mb-2">Lucro Estimado</p>
                          <p className="text-sm sm:text-lg font-bold text-emerald-500 break-all">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.netProfit)}
                          </p>
                        </div>
                        <div className="bg-brand-paper/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-brand-border">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 mb-2">ROI (Total)</p>
                          <p className="text-sm sm:text-lg font-bold text-brand-primary break-all">
                            {metrics.roi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </p>
                        </div>
                        <div className="bg-brand-paper/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-brand-border">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 mb-2">TIR (Anual)</p>
                          <p className="text-sm sm:text-lg font-bold text-brand-primary break-all">
                            {tir.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </p>
                        </div>
                      </div>

                      <div className="bg-brand-paper rounded-2xl sm:rounded-[2.5rem] border border-brand-border shadow-inner overflow-hidden">
                        <div className="p-4 sm:p-6 md:p-10 markdown-body max-w-none text-brand-ink break-words">
                          {report ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportComponents}>{report}</ReactMarkdown>
                          ) : (
                            <div className="p-8 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 text-center">
                              <p className="text-brand-primary font-bold">Análise concluída, mas o relatório textual não foi gerado.</p>
                              <p className="text-brand-ink/60 mt-2">Os dados da simulação foram extraídos com sucesso e estão disponíveis no dashboard.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chat with AI */}
                      <div className="space-y-6 pt-10 border-t border-black/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-black">
                            <MessageSquare size={20} />
                          </div>
                          <h5 className="text-lg font-bold text-brand-primary">Enriquecer Análise</h5>
                        </div>

                        <div className="bg-brand-bg rounded-[2rem] p-8 space-y-6 max-h-[400px] overflow-y-auto border border-brand-primary/10">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={cn(
                              "flex gap-4 max-w-[85%]",
                              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}>
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                msg.role === 'assistant' ? "bg-brand-primary text-black" : "bg-brand-ink/10 text-brand-ink/40"
                              )}>
                                {msg.role === 'assistant' ? <Cpu size={14} /> : <Users size={14} />}
                              </div>
                              <div className={cn(
                                "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                                msg.role === 'assistant' ? "bg-brand-paper shadow-sm markdown-body !text-sm" : "bg-brand-primary text-black"
                              )}>
                                {msg.role === 'assistant' ? (
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                ) : (
                                  msg.content
                                )}
                              </div>
                            </div>
                          ))}
                          {sendingChat && (
                            <div className="flex gap-4 max-w-[85%]">
                              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-black shrink-0">
                                <Loader2 size={14} className="animate-spin" />
                              </div>
                              <div className="p-4 rounded-2xl bg-brand-paper shadow-sm text-sm font-medium text-brand-ink/20 italic">
                                IA está pensando...
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Attached files list */}
                        {analysisDocs.filter((d: any) => d.doc_type === 'Anexo Chat').length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto p-1 border-b border-brand-primary/5 pb-3">
                            {analysisDocs.filter((d: any) => d.doc_type === 'Anexo Chat').map((doc: any) => (
                              <div 
                                key={doc.id} 
                                className="flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/25 text-brand-primary rounded-xl px-3.5 py-2 text-xs font-semibold select-none shadow-sm animate-fade-in"
                              >
                                <FileText size={14} className="shrink-0 text-brand-primary/70" />
                                <span className="truncate max-w-[180px] text-brand-ink">{doc.filename}</span>
                                <button 
                                  type="button"
                                  onClick={async () => {
                                    // Local optimistic delete
                                    setPropertyDocs((prev: any) => prev.filter((d: any) => d.id !== doc.id));
                                    setState((prev: any) => ({
                                      ...prev,
                                      adHocDocs: prev.adHocDocs.filter((d: any) => d.id !== doc.id)
                                    }));
                                    // Backend delete
                                    try {
                                      await fetch(`/api/documents/${doc.id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });
                                    } catch (e) {
                                      console.error("Erro ao deletar anexo:", e);
                                    }
                                  }}
                                  className="text-brand-ink/40 hover:text-red-500 cursor-pointer transition-colors p-0.5 rounded-full hover:bg-red-500/10 ml-1"
                                  title="Remover anexo do chat"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="relative flex gap-3">
                          <div className="relative flex-1">
                            <input 
                              type="text" 
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                              placeholder="Pergunte algo sobre o edital, riscos ou cálculos..."
                              className="w-full bg-brand-bg border border-brand-primary/10 rounded-2xl py-5 px-6 pr-16 focus:ring-2 focus:ring-brand-primary outline-none font-medium text-brand-ink"
                            />
                            <button 
                              onClick={handleSendChat}
                              disabled={sendingChat || !chatInput.trim()}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-primary text-black rounded-xl flex items-center justify-center hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                            >
                              <Send size={20} />
                            </button>
                          </div>
                          <label className="w-14 h-14 bg-brand-bg border border-brand-primary/20 text-brand-primary rounded-2xl flex items-center justify-center cursor-pointer hover:bg-brand-primary/5 transition-all shrink-0">
                            {uploading ? (
                              <Loader2 size={24} className="animate-spin text-brand-primary" />
                            ) : (
                              <Plus size={24} />
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              multiple 
                              disabled={uploading}
                              onChange={(e) => handleAnalysisFileUpload(e, 'Anexo Chat')} 
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-brand-ink/40 font-semibold mt-1 flex items-center gap-1">
                          <Info size={12} className="text-brand-primary" />
                          <span>Envie novos documentos (+) para incluir no contexto desta conversa com a IA.</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mx-auto mb-6">
                          <Files size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-brand-primary">
                          {selectedPropertyId ? "Dossiê Digital do Imóvel" : "Dossiê de Análise Avulsa"}
                        </h3>
                        <p className="text-brand-ink/40 font-medium">
                          {selectedPropertyId 
                            ? "Complete as informações essenciais para uma análise de IA precisa." 
                            : "Suba os documentos abaixo para realizar uma análise rápida sem cadastrar o imóvel."}
                        </p>
                      </div>

                      
                      <div className="flex flex-col items-center pt-8 border-t border-black/5">
                        <button 
                          onClick={handleAnalyze}
                          disabled={analyzing}
                          className="bg-[#5A5A40] text-white px-12 py-5 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all shadow-xl shadow-[#5A5A40]/20 flex items-center gap-3 disabled:opacity-50 disabled:shadow-none"
                        >
                          {analyzing ? <Loader2 className="animate-spin" size={20} /> : <Cpu size={20} />}
                          Iniciar Análise Estratégica
                        </button>
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-black/30">
                          {analysisDocs.length > 0 ? "Pronto para analisar os documentos enviados." : "Suba ao menos um documento para iniciar."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'smart_analysis' && (
                <SmartAnalysisTab 
                  data={state.smartAnalysis}
                  onSave={handleSaveSmartAnalysis}
                  onTriggerAI={handleAnalyzeSmart}
                  isAnalyzing={analyzingSmart}
                  hasDocuments={analysisDocs.length > 0}
                />
              )}

              {activeSubTab === 'investors' && (
                <InvestorsTabContent simulationData={simulationData} report={report} />
              )}

              {activeSubTab === 'instagram' && (
                <InstagramMarketingView 
                  state={state} 
                  setState={setState} 
                  property={selectedProperty} 
                  metrics={metrics} 
                  tir={tir} 
                  roi={roi}
                  token={token}
                />
              )}

              {activeSubTab === 'cnj' && (
                <div className="space-y-10">
                  {cnjResult ? (
                    <div className="space-y-12">
                      <div className="flex items-center justify-between border-b border-brand-primary/5 pb-8">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/10">
                            <Gavel size={32} />
                          </div>
                          <div>
                            <h4 className="text-3xl font-serif font-medium text-brand-primary">Processo {cnjResult.cnj_number}</h4>
                            <p className="text-[10px] font-bold text-brand-ink/30 uppercase tracking-[0.2em] mt-1">Consulta DataJud em tempo real</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleSaveAsProperty}
                          className="flex items-center gap-3 bg-brand-primary text-black px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20"
                        >
                          <Save size={18} /> Salvar como Novo Imóvel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <DataJudField label="Tribunal" value={cnjResult.court} />
                        <DataJudField label="Classe" value={cnjResult.class} />
                        <DataJudField label="Órgão Julgador" value={cnjResult.chamber} />
                        <DataJudField label="Partes" value={cnjResult.parties} />
                        <DataJudField label="Data de Distribuição" value="12/04/2023" />
                        <DataJudField label="Última Movimentação" value={cnjResult.last_movement} />
                      </div>

                      <div className="space-y-8 pt-12 border-t border-brand-primary/5">
                        <h5 className="text-xl font-serif font-medium flex items-center gap-3 text-brand-primary">
                          <Files size={24} className="text-brand-primary/40" />
                          Documentos Relevantes do Processo
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { name: 'Planilha de Débitos Atualizada.pdf', type: 'Débitos', date: 'Há 2 dias' },
                            { name: 'Certidão de Citação.pdf', type: 'Citação', date: 'Há 15 dias' },
                            { name: 'Auto de Avaliação.pdf', type: 'Avaliação', date: 'Há 1 mês' },
                            { name: 'Edital de Leilão.pdf', type: 'Edital', date: 'Há 5 dias' }
                          ].map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-brand-bg/30 rounded-3xl border border-brand-primary/5 hover:border-brand-primary/30 transition-all group cursor-pointer">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary shadow-sm group-hover:bg-brand-primary group-hover:text-black transition-all duration-500 border border-brand-primary/10">
                                  <FileText size={24} />
                                </div>
                                <div>
                                  <p className="font-bold text-base tracking-tight">{file.name}</p>
                                  <div className="flex gap-3 mt-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg">{file.type}</span>
                                    <span className="text-[10px] text-brand-ink/30 font-medium uppercase tracking-widest">{file.date}</span>
                                  </div>
                                </div>
                              </div>
                              <button className="p-3 hover:bg-brand-primary/10 rounded-xl text-brand-ink/20 hover:text-brand-primary transition-all">
                                <Download size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-black/10 space-y-4">
                      <Search size={64} />
                      <p className="font-bold uppercase tracking-widest text-xs">Realize uma consulta CNJ na barra lateral</p>
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'documents' && !isPublicView && (
                <div className="space-y-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h4 className="text-2xl font-serif font-medium text-brand-primary">Repositório Organizado</h4>
                    {!isPublicView && (
                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-2 bg-brand-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-sm"
                      >
                        <Globe size={14} /> Compartilhar / Gerar Link Público
                      </button>
                    )}
                  </div>
                  
                  {/* Link do leiloeiro */}
                  {selectedProperty ? (
                    <div className="premium-card p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 space-y-4">
                      <div>
                        <h5 className="text-sm font-bold text-brand-primary flex items-center gap-2 uppercase tracking-wider">
                          <Globe size={16} className="text-brand-primary animate-pulse" />
                          Link do Leilão / Leiloeiro (Imóvel Cadastrado)
                        </h5>
                        <p className="text-xs text-brand-ink/65 mt-1 leading-relaxed">
                          Adicione a URL oficial do lote no portal do leiloeiro. O Cérebro da IA irá rastrear este link para extrair regras de parcelamento, valores atualizados e dados do leilão direto da fonte.
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input 
                          type="url"
                          placeholder="https://www.leiloeiro.com.br/lote/..."
                          value={state.auctionUrlInputValue !== undefined ? state.auctionUrlInputValue : (selectedProperty.auction_url || '')}
                          onChange={(e) => updateState({ auctionUrlInputValue: e.target.value })}
                          className="flex-1 px-4 py-3.5 text-xs bg-brand-bg rounded-xl border border-brand-primary/10 text-brand-ink focus:border-brand-primary focus:outline-none"
                        />
                        <button 
                          onClick={async () => {
                            const urlValue = state.auctionUrlInputValue !== undefined ? state.auctionUrlInputValue : (selectedProperty.auction_url || '');
                            updateState({ isSavingAuctionUrl: true, auctionUrlSaveSuccess: false, auctionUrlSaveError: null });
                            try {
                              const res = await fetch(`/api/properties/${selectedProperty.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                  ...selectedProperty,
                                  auction_url: urlValue
                                })
                              });
                              if (!res.ok) throw new Error('Não foi possível salvar o link.');
                              
                              if (onPropertyCreated) {
                                onPropertyCreated();
                              }
                              updateState({ auctionUrlSaveSuccess: true, isSavingAuctionUrl: false });
                              setTimeout(() => {
                                updateState({ auctionUrlSaveSuccess: false });
                              }, 3000);
                            } catch (err: any) {
                              updateState({ auctionUrlSaveError: err.message || 'Erro ao salvar o link.', isSavingAuctionUrl: false });
                            }
                          }}
                          disabled={state.isSavingAuctionUrl}
                          className="px-6 py-3.5 bg-brand-primary hover:bg-brand-primary hover:scale-[1.01] text-black text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 select-none"
                        >
                          {state.isSavingAuctionUrl ? (
                            <>
                              <Loader2 size={14} className="animate-spin text-black" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <span>Salvar Link</span>
                          )}
                        </button>
                      </div>
                      
                      {state.auctionUrlSaveSuccess && (
                        <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-bounce mt-2">
                          <Check size={14} /> Link do leiloeiro atualizado com sucesso!
                        </div>
                      )}
                      
                      {state.auctionUrlSaveError && (
                        <div className="text-xs text-red-500 font-bold flex items-center gap-1.5 mt-2">
                          <AlertTriangle size={14} /> {state.auctionUrlSaveError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="premium-card p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 space-y-4 font-sans">
                      <div>
                        <h5 className="text-sm font-bold text-brand-primary flex items-center gap-2 uppercase tracking-wider">
                          <Globe size={16} className="text-brand-primary animate-pulse" />
                          Link do Leilão / Leiloeiro (Análise Avulsa)
                        </h5>
                        <p className="text-xs text-brand-ink/65 mt-1 leading-relaxed">
                          Adicione a URL oficial do lote no portal do leiloeiro. O Cérebro da IA irá ler e rastrear este link em tempo real durante a execução da análise para extrair regras de parcelamento e dados atualizados.
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input 
                          type="url"
                          placeholder="https://www.leiloeiro.com.br/lote/..."
                          value={state.auctionUrls && state.auctionUrls[0] ? state.auctionUrls[0] : ''}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            updateState({ auctionUrls: [newUrl] });
                          }}
                          className="flex-1 px-4 py-3.5 text-xs bg-brand-bg rounded-xl border border-brand-primary/10 text-brand-ink focus:border-brand-primary focus:outline-none"
                        />
                        <button 
                          className="px-6 py-3.5 bg-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-default whitespace-nowrap flex items-center justify-center gap-2 select-none"
                          disabled={true}
                        >
                          <Check size={14} className="text-brand-primary" />
                          <span>Link Ativo</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-brand-ink/40">
                        O link inserido acima será enviado e analisado junto com os seus documentos quando você clicar no botão <strong>"Executar Análise IA"</strong>.
                      </p>
                    </div>
                  )}
                  
                  {['Edital', 'Matrícula', 'Processo Judicial', 'Outros'].map(category => (
                    <DocumentManager 
                      key={category} 
                      label={category} 
                      docs={analysisDocs} 
                      onUpload={(e, type) => handleAnalysisFileUpload(e, type)}
                      onDelete={handleDeleteDocument}
                      uploading={uploading}
                    />
                  ))}
                  
                  {analysisDocs.length === 0 && (
                    <div className="py-20 text-center text-black/20 font-bold uppercase tracking-widest text-xs">
                      Nenhum documento vinculado.
                    </div>
                  )}
                  {renderTabChat('documents')}
                </div>
              )}

              {activeSubTab === 'simulations' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
                    <div>
                      <h4 className="text-2xl font-bold text-brand-primary font-sans">Parâmetros Financeiros Resumidos</h4>
                      <p className="text-xs text-brand-ink/40 mt-1 font-sans">Defina os valores do imóvel e custos para complementar sua viabilidade documental.</p>
                    </div>
                  </div>

                  <SimulationContext.Provider 
                    value={{ 
                      simulationData, 
                      updateState, 
                      onJumpToSimulation: onJumpToSimulation || (() => {}),
                      selectedPropertyId: state.selectedPropertyId,
                      analysisId: state.analysisId,
                      token,
                      report: state.report,
                      editalAnalysis: state.editalAnalysis,
                      matriculaAnalysis: state.matriculaAnalysis,
                      processAnalysis: state.processAnalysis,
                      dossierAnalysis: state.dossierAnalysis,
                      handleSaveAsProperty,
                      properties: properties
                    }}
                  >
                    <InteractiveSimulationTable />
                  </SimulationContext.Provider>
                </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {uploadProgressText && (
        <div className="fixed bottom-8 right-8 z-[9999] bg-brand-paper border border-brand-primary/20 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 max-w-sm">
          <Loader2 className="animate-spin text-brand-primary shrink-0" size={24} />
          <div>
            <h5 className="text-sm font-bold text-brand-primary">Processando Documento</h5>
            <p className="text-xs font-semibold text-brand-ink/60 mt-1">{uploadProgressText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-10 py-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 shrink-0 whitespace-nowrap",
        active ? "bg-brand-paper border-brand-primary text-brand-primary" : "border-transparent text-brand-ink/30 hover:text-brand-primary/60"
      )}
    >
      {icon}
      {label}
    </button>
  );
}


function DossierCard({ title, description, icon, hasFile, onUpload, uploading }: { title: string, description: string, icon: React.ReactNode, hasFile: boolean, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, uploading: boolean }) {
  const id = `dossier-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className={cn(
      "bg-brand-paper p-8 rounded-[2rem] border transition-all flex flex-col h-full",
      hasFile ? "border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "border-brand-primary/10 hover:border-brand-primary/30"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
        hasFile ? "bg-emerald-500 text-white" : "bg-brand-bg text-brand-ink/40"
      )}>
        {hasFile ? <CheckCircle2 size={24} /> : icon}
      </div>
      <h4 className="text-lg font-bold mb-2 text-brand-primary">{title}</h4>
      <p className="text-sm text-brand-ink/40 font-medium mb-8 flex-1">{description}</p>
      
      <div className="relative mt-auto">
        <input 
          type="file" 
          id={id}
          className="hidden" 
          onChange={onUpload}
          disabled={uploading}
        />
        <label 
          htmlFor={id}
          className={cn(
            "w-full py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all",
            hasFile 
              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" 
              : "bg-brand-primary text-black hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/10"
          )}
        >
          {uploading ? <Loader2 className="animate-spin" size={14} /> : (hasFile ? <RefreshCw size={14} /> : <Plus size={14} />)}
          {hasFile ? "Substituir" : "Subir Documento"}
        </label>
      </div>
    </div>
  );
}

function AIKeyInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/30 mb-3 ml-1">{label}</label>
      <input 
        type="password" 
        className={cn(
          "w-full bg-brand-bg border-none rounded-2xl py-5 px-8 focus:ring-2 focus:ring-brand-primary font-mono text-sm text-brand-primary",
          value && label.includes("Gemini") && !value.trim().startsWith("AIza") && "ring-2 ring-red-200"
        )}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={label.includes("Gemini") ? "Insira a chave AIza..." : "Insira a chave sk-..."}
      />
      {value && label.includes("Gemini") && !value.trim().startsWith("AIza") && (
        <p className="text-[10px] text-red-500 mt-2 ml-1 font-bold">Atenção: Chaves Gemini devem começar com 'AIza'</p>
      )}
    </div>
  );
}

function UsersView({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao carregar usuários");
        return parseJsonResponse(res);
      })
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
        alert("Usuário excluído com sucesso.");
      } else {
        const errText = await res.text();
        let errData;
        try {
          const trimmed = errText.trim().toLowerCase();
          if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
            throw new Error("Resposta do servidor é HTML");
          }
          errData = JSON.parse(errText);
        } catch (e) {
          errData = { error: errText || res.statusText };
        }
        alert(`Erro ao excluir usuário: ${errData.error || errText || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir usuário.");
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-primary">Gestão de Usuários</h2>
          <p className="text-brand-ink/40 font-medium text-lg">Administre os acessos ao sistema profissional.</p>
        </div>
        <button className="bg-brand-primary text-black px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all">
          <Plus size={20} /> Novo Usuário
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-bg text-brand-ink/30 text-[10px] font-bold uppercase tracking-[0.2em]">
              <th className="px-10 py-8">Nome</th>
              <th className="px-10 py-8">Usuário / Email</th>
              <th className="px-10 py-8">Cargo</th>
              <th className="px-10 py-8">Status</th>
              <th className="px-10 py-8 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/5">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-brand-bg/30 transition-all group">
                <td className="px-10 py-8 font-serif text-xl font-bold text-brand-primary">{u.name}</td>
                <td className="px-10 py-8">
                  <p className="text-base font-bold tracking-tight">{u.username}</p>
                  <p className="text-xs text-brand-ink/40 font-medium">{u.email}</p>
                </td>
                <td className="px-10 py-8">
                  <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {u.role}
                  </span>
                </td>
                <td className="px-10 py-8">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {u.status}
                  </span>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-3 hover:bg-brand-paper rounded-xl text-brand-ink/20 hover:text-brand-primary transition-all shadow-sm"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-3 hover:bg-red-500/10 rounded-xl text-brand-ink/20 hover:text-red-500 transition-all shadow-sm"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsView({ 
  token, 
  aiConfig, 
  onConfigUpdate 
}: { 
  token: string; 
  aiConfig: AIConfig | null; 
  onConfigUpdate: (config: AIConfig) => void; 
}) {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'general'>('ai');
  const [master, setMaster] = useState(() => {
    return getMasterBudgetConfigs();
  });

  const handleUpdate = (key: string, field: 'value' | 'type', val: any) => {
    setMaster((prev: any) => {
      const updated = {
        ...prev,
        [key]: {
          ...(prev[key] || { value: 0, type: 'BRL' }),
          [field]: val
        }
      };
      return updated;
    });
  };

  const handleSaveMaster = () => {
    localStorage.setItem('QUADRO_RESUMO_INVESTIMENTO_MASTER', JSON.stringify(master));
    if ((window as any).customToast) {
      (window as any).customToast("Quadro Resumo (MASTER) atualizado com sucesso!", "success");
    } else {
      alert("Quadro Resumo (MASTER) cadastrado com sucesso!");
    }
  };

  const fields = [
    { key: 'comissaoLeiloeiro', label: 'Comissão do Leiloeiro', desc: 'Default da taxa para arremate, tipicamente 5%' },
    { key: 'itbi', label: 'ITBI Estimado', desc: 'Imposto Estadual de Transmissão de Bens Imóveis' },
    { key: 'transfRegistro', label: 'Registro e Custas', desc: 'Emolumentos de cartório e taxas de averbação' },
    { key: 'desocupacaoAcordo', label: 'Dívidas IPTU / Condo', desc: 'Pendências de impostos e condomínio associados ao imóvel' },
    { key: 'reforma', label: 'Reforma / Desocupação', desc: 'Provisão de recursos para reforma ou remoção do ocupante' },
    { key: 'assessoria', label: 'Assessoria TJ INVEST', desc: 'Comissão devida pelo assessoramento integral' },
    { key: 'entrada', label: 'Entrada TJ INVEST', desc: 'Pagamento inicial fixo de consultoria jurídica' },
    { key: 'extraFees', label: 'Despesas Extra / Outros', desc: 'Margem para despesas não listadas ou imprevistos' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-primary/10 pb-6">
        <div>
          <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-primary">Configurações</h2>
          <p className="text-brand-ink/40 font-medium text-lg">Gerencie as chaves de API das Inteligências Artificiais e parâmetros globais do sistema.</p>
        </div>
        
        {/* Tab system inside settings */}
        <div className="flex bg-brand-bg/50 p-1.5 rounded-2xl border border-brand-primary/10 self-start md:self-auto uppercase tracking-wider text-[10px] font-bold">
          <button
            onClick={() => setActiveSubTab('ai')}
            className={cn(
              "px-5 py-2.5 rounded-xl transition-all cursor-pointer",
              activeSubTab === 'ai' 
                ? "bg-brand-primary text-black shadow-lg" 
                : "text-brand-ink/40 hover:text-brand-primary"
            )}
          >
            Configuração de IA
          </button>
          <button
            onClick={() => setActiveSubTab('general')}
            className={cn(
              "px-5 py-2.5 rounded-xl transition-all cursor-pointer",
              activeSubTab === 'general' 
                ? "bg-brand-primary text-black shadow-lg" 
                : "text-brand-ink/40 hover:text-brand-primary"
            )}
          >
            Parâmetros Gerais
          </button>
        </div>
      </div>

      <div className="pt-4 animate-fade-in">
        {activeSubTab === 'ai' ? (
          <AIConfigView 
            token={token} 
            aiConfig={aiConfig} 
            onConfigUpdate={onConfigUpdate} 
          />
        ) : (
          <div className="space-y-8">
            <Card title="QUADRO RESUMO DE INVESTIMENTO (MASTER)">
              <div className="space-y-8">
                <div className="p-6 bg-brand-primary/5 rounded-3xl border border-brand-primary/10">
                  <p className="text-xs text-brand-primary font-sans leading-relaxed">
                    ⚙️ **Configuração Master Global**: Defina aqui o padrão de cálculo para todas as simulações do sistema. Quando uma nova análise for executada, ela será calculada inicialmente com estes parâmetros. Caso deseje alterá-los para um caso específico, você poderá sobrescrevê-los diretamente na aba de **Simulação** do imóvel para garantir flexibilidade ("não ficar engessado").
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fields.map(f => {
                    const fd = master[f.key] || { value: 0, type: 'BRL' };
                    return (
                      <div key={f.key} className="flex flex-col gap-2 p-5 bg-brand-bg/30 rounded-3xl border border-brand-border hover:border-brand-primary/20 transition-all">
                        <div className="flex items-center justify-between font-sans">
                          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">{f.label}</span>
                          
                          <div className="flex bg-brand-bg rounded-lg p-0.5 border border-brand-border">
                            <button 
                              type="button"
                              onClick={() => handleUpdate(f.key, 'type', 'BRL')}
                              className={cn(
                                "px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer",
                                fd.type === 'BRL' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                              )}
                            >
                              R$
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleUpdate(f.key, 'type', 'PERCENT')}
                              className={cn(
                                "px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer",
                                fd.type === 'PERCENT' ? "bg-brand-primary text-black shadow-sm" : "text-brand-ink/40 hover:text-brand-primary"
                              )}
                            >
                              %
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-brand-bg/40 rounded-2xl px-4 py-2.5 border border-brand-border">
                          <span className="text-brand-ink/40 text-xs font-bold font-mono">
                            {fd.type === 'BRL' ? 'R$' : '%'}
                          </span>
                          <input 
                            type="number"
                            step="any"
                            value={fd.value}
                            onChange={(e) => handleUpdate(f.key, 'value', parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0 text-brand-ink outline-none font-mono"
                            placeholder="0,00"
                          />
                        </div>
                        <span className="text-[9px] text-brand-ink/30 italic font-sans">{f.desc}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-end pt-4 border-t border-brand-border/40">
                  <button
                    onClick={handleSaveMaster}
                    className="bg-brand-primary text-black px-8 py-4 rounded-2xl font-bold hover:bg-brand-primary/95 transition-all shadow-lg shadow-brand-primary/10 flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
                  >
                    <Save size={14} />
                    Salvar Quadro Resumo (MASTER)
                  </button>
                </div>
              </div>
            </Card>

            <Card title="Preferências do Sistema">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-brand-bg/50 rounded-3xl border border-brand-border/45">
                  <span className="font-bold text-brand-primary text-xs uppercase tracking-wider font-sans">Alertas de Novos Leilões</span>
                  <div className="w-14 h-7 bg-brand-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-brand-bg/50 rounded-3xl border border-brand-border/45">
                  <span className="font-bold text-brand-primary text-xs uppercase tracking-wider font-sans">Relatórios de IA por Email</span>
                  <div className="w-14 h-7 bg-brand-ink/10 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}