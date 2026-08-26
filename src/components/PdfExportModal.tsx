import React, { useState } from 'react';
import { 
  X, Printer, Download, CheckSquare, Square, FileText, 
  TrendingUp, Star, BookOpen, Scale, Clock, Shield, DollarSign,
  Image as ImageIcon, Check, Sparkles, Layers, Sliders, Eye
} from 'lucide-react';
import { Property } from '../types';
import { exportCustomReportToPDF } from '../utils/pdfExporter';

export interface PdfExportSections {
  header: boolean;
  opportunity: boolean;
  metrics_table: boolean;
  cash_flow: boolean;
  executive_summary: boolean;
  process_story: boolean;
  legal_glossary: boolean;
  timeline: boolean;
  smart_risks: boolean;
  assessoria_debts: boolean;
  dossier: boolean;
  photos: boolean;
  signatures: boolean;
}

export const defaultPdfSections: PdfExportSections = {
  header: true,
  opportunity: true,
  metrics_table: true,
  cash_flow: true,
  executive_summary: true,
  process_story: true,
  legal_glossary: true,
  timeline: true,
  smart_risks: false,
  assessoria_debts: false,
  dossier: false,
  photos: true,
  signatures: true,
};

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property;
  metrics: any;
  roi: number;
  tir: number;
  processStory?: any;
  reportSummary?: string | null;
  smartAnalysis?: any;
  assessoriaAnalysis?: any;
  dossierAnalysis?: any;
  simulationData?: any;
  anonymizeProperty?: boolean;
}

export function PdfExportModal({
  isOpen,
  onClose,
  property,
  metrics,
  roi,
  tir,
  processStory,
  reportSummary,
  smartAnalysis,
  assessoriaAnalysis,
  dossierAnalysis,
  simulationData,
  anonymizeProperty = false,
}: PdfExportModalProps) {
  const [sections, setSections] = useState<PdfExportSections>(defaultPdfSections);
  const [anonymize, setAnonymize] = useState(anonymizeProperty);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [reportTitle, setReportTitle] = useState(
    property?.title ? `Relatório Estratégico - ${property.title}` : "Relatório de Análise e Viabilidade de Leilão"
  );
  const [advisorName, setAdvisorName] = useState("Assessoria TJ INVEST");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const toggleSection = (key: keyof PdfExportSections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectPreset = (preset: 'all' | 'investor' | 'legal' | 'onepage') => {
    if (preset === 'all') {
      setSections({
        header: true,
        opportunity: true,
        metrics_table: true,
        cash_flow: true,
        executive_summary: true,
        process_story: true,
        legal_glossary: true,
        timeline: true,
        smart_risks: true,
        assessoria_debts: true,
        dossier: true,
        photos: true,
        signatures: true,
      });
    } else if (preset === 'investor') {
      setSections({
        header: true,
        opportunity: true,
        metrics_table: true,
        cash_flow: true,
        executive_summary: true,
        process_story: true,
        legal_glossary: false,
        timeline: false,
        smart_risks: false,
        assessoria_debts: true,
        dossier: false,
        photos: true,
        signatures: true,
      });
    } else if (preset === 'legal') {
      setSections({
        header: true,
        opportunity: true,
        metrics_table: false,
        cash_flow: false,
        executive_summary: true,
        process_story: true,
        legal_glossary: true,
        timeline: true,
        smart_risks: true,
        assessoria_debts: true,
        dossier: true,
        photos: false,
        signatures: true,
      });
    } else if (preset === 'onepage') {
      setSections({
        header: true,
        opportunity: true,
        metrics_table: true,
        cash_flow: true,
        executive_summary: false,
        process_story: false,
        legal_glossary: false,
        timeline: false,
        smart_risks: false,
        assessoria_debts: false,
        dossier: false,
        photos: false,
        signatures: false,
      });
    }
  };

  const totalSelected = Object.values(sections).filter(Boolean).length;

  const handleExportPDF = () => {
    exportCustomReportToPDF({
      title: reportTitle,
      property,
      metrics,
      roi,
      tir,
      processStory,
      reportSummary,
      smartAnalysis,
      assessoriaAnalysis,
      dossierAnalysis,
      simulationData,
      sections,
      anonymize,
      includeWatermark,
      advisorName,
    });
    onClose();
  };

  const handleCopyText = () => {
    let text = `# ${reportTitle}\n`;
    text += `Emitido em: ${new Date().toLocaleDateString('pt-BR')} por ${advisorName}\n\n`;

    if (sections.header && property) {
      text += `## IDENTIFICAÇÃO DO IMÓVEL\n`;
      text += `Imóvel: ${anonymize ? "Oportunidade em Leilão (Dados Confidenciais)" : property.title || "Imóvel"}\n`;
      if (!anonymize && property.address) text += `Endereço: ${property.address} - ${property.city || ''}/${property.state || ''}\n`;
      text += `Avaliação: R$ ${(property.valuation_value || 0).toLocaleString('pt-BR')}\n\n`;
    }

    if (sections.opportunity) {
      text += `## RESUMO DA OPORTUNIDADE\n`;
      text += `ROI Estimado: ${roi.toFixed(2)}%\n`;
      text += `TIR Estimada: ${tir.toFixed(2)}%\n`;
      text += `Valor de Venda Estimado: R$ ${(metrics.saleValue || 0).toLocaleString('pt-BR')}\n`;
      text += `Lance Máximo: R$ ${(metrics.bid || 0).toLocaleString('pt-BR')}\n`;
      text += `Lucro Líquido Estimado: R$ ${(metrics.netProfit || 0).toLocaleString('pt-BR')}\n\n`;
    }

    if (sections.cash_flow) {
      text += `## FLUXO DE CAIXA ESTIMADO\n`;
      text += `(+) Valor de Venda: R$ ${(metrics.saleValue || 0).toLocaleString('pt-BR')}\n`;
      text += `(-) Lance: R$ ${(metrics.bid || 0).toLocaleString('pt-BR')}\n`;
      text += `(-) Custos Totais: R$ ${(metrics.totalUpfrontExpenses || 0).toLocaleString('pt-BR')}\n`;
      text += `(=) Lucro Líquido Final: R$ ${(metrics.netProfit || 0).toLocaleString('pt-BR')}\n\n`;
    }

    if (sections.executive_summary && reportSummary) {
      text += `## PARECER GERAL DE VIABILIDADE\n${reportSummary}\n\n`;
    }

    if (sections.process_story && processStory?.full_story) {
      text += `## HISTÓRIA DO PROCESSO\n${processStory.full_story}\n\n`;
    }

    if (sections.legal_glossary && processStory?.legal_glossary) {
      text += `## GLOSSÁRIO JURÍDICO\n${processStory.legal_glossary}\n\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-brand-paper border border-brand-primary/20 rounded-[2rem] max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-brand-primary/10 flex items-center justify-between bg-brand-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-brand-primary font-serif">
                Personalizar Relatório em PDF
              </h3>
              <p className="text-xs text-brand-ink/50">
                Selecione os blocos e informações que você deseja incluir no documento final
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-ink/40 hover:text-brand-ink hover:bg-black/5 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm text-brand-ink">
          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-brand-ink/40 mb-2.5 block flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-primary" />
              Modelos Rápidos Pré-configurados
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => selectPreset('all')}
                className="p-3 text-left rounded-xl border border-brand-border hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-xs font-semibold"
              >
                <span className="block font-bold text-brand-primary mb-0.5">🌟 Completo</span>
                <span className="text-[10px] text-brand-ink/50">Todas as seções</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('investor')}
                className="p-3 text-left rounded-xl border border-brand-border hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-xs font-semibold"
              >
                <span className="block font-bold text-brand-primary mb-0.5">💼 Investidor</span>
                <span className="text-[10px] text-brand-ink/50">Foco financeiro & ROI</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('legal')}
                className="p-3 text-left rounded-xl border border-brand-border hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-xs font-semibold"
              >
                <span className="block font-bold text-brand-primary mb-0.5">⚖️ Jurídico</span>
                <span className="text-[10px] text-brand-ink/50">Processos & riscos</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('onepage')}
                className="p-3 text-left rounded-xl border border-brand-border hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-xs font-semibold"
              >
                <span className="block font-bold text-brand-primary mb-0.5">🎯 1 Página</span>
                <span className="text-[10px] text-brand-ink/50">Métricas & fluxo</span>
              </button>
            </div>
          </div>

          {/* Title and General Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-bg/30 p-4 rounded-2xl border border-brand-border/60">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Título do Relatório no PDF</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="p-2.5 bg-brand-paper border border-brand-border rounded-xl text-xs outline-none focus:border-brand-primary"
                placeholder="Título do Relatório"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Assinatura / Responsável Técnico</label>
              <input
                type="text"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                className="p-2.5 bg-brand-paper border border-brand-border rounded-xl text-xs outline-none focus:border-brand-primary"
                placeholder="Ex: Assessoria TJ INVEST"
              />
            </div>
          </div>

          {/* Section Selection Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-brand-ink/40 flex items-center gap-1.5">
                <Layers size={14} className="text-brand-primary" />
                Seções do Relatório ({totalSelected} selecionadas)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectPreset('all')}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Marcar Todas
                </button>
                <span className="text-brand-ink/20">•</span>
                <button
                  type="button"
                  onClick={() => setSections({
                    header: false,
                    opportunity: false,
                    metrics_table: false,
                    cash_flow: false,
                    executive_summary: false,
                    process_story: false,
                    legal_glossary: false,
                    timeline: false,
                    smart_risks: false,
                    assessoria_debts: false,
                    dossier: false,
                    photos: false,
                    signatures: false,
                  })}
                  className="text-[11px] font-bold text-brand-ink/40 hover:underline"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Header */}
              <div
                onClick={() => toggleSection('header')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.header ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.header ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">🏛️ Cabeçalho & Dados do Imóvel</p>
                  <p className="text-[10px] text-brand-ink/40">Título, endereço, avaliação e data de emissão</p>
                </div>
              </div>

              {/* Opportunity */}
              <div
                onClick={() => toggleSection('opportunity')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.opportunity ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.opportunity ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">⭐️ Destaque da Oportunidade (ROI / TIR)</p>
                  <p className="text-[10px] text-brand-ink/40">Badges de rentabilidade percentual e atratividade</p>
                </div>
              </div>

              {/* Metrics Table */}
              <div
                onClick={() => toggleSection('metrics_table')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.metrics_table ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.metrics_table ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">📊 Tabela de Métricas Principais</p>
                  <p className="text-[10px] text-brand-ink/40">Valor de Venda, Lance Máximo, Prazo e Lucro Líquido</p>
                </div>
              </div>

              {/* Cash Flow */}
              <div
                onClick={() => toggleSection('cash_flow')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.cash_flow ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.cash_flow ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">📈 Fluxo de Caixa Estimado & Custos</p>
                  <p className="text-[10px] text-brand-ink/40">Discriminação de despesas (reforma, ITBI, comissão)</p>
                </div>
              </div>

              {/* Executive Summary */}
              <div
                onClick={() => toggleSection('executive_summary')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.executive_summary ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.executive_summary ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">📝 Parecer Geral de Viabilidade</p>
                  <p className="text-[10px] text-brand-ink/40">Resumo executivo estratégico gerado pela IA</p>
                </div>
              </div>

              {/* Process Story */}
              <div
                onClick={() => toggleSection('process_story')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.process_story ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.process_story ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">📖 História do Processo</p>
                  <p className="text-[10px] text-brand-ink/40">Narrativa completa dos autos judiciais traduzida</p>
                </div>
              </div>

              {/* Legal Glossary */}
              <div
                onClick={() => toggleSection('legal_glossary')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.legal_glossary ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.legal_glossary ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">⚖️ Glossário Jurídico Descomplicado</p>
                  <p className="text-[10px] text-brand-ink/40">Termos técnicos explicados de forma simples</p>
                </div>
              </div>

              {/* Timeline */}
              <div
                onClick={() => toggleSection('timeline')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.timeline ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.timeline ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">⏱️ Linha do Tempo dos Fatos</p>
                  <p className="text-[10px] text-brand-ink/40">Datas dos principais marcos e decisões do leilão</p>
                </div>
              </div>

              {/* Smart Risks */}
              <div
                onClick={() => toggleSection('smart_risks')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.smart_risks ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.smart_risks ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">🛡️ Análise Smart de Riscos & Nulidades</p>
                  <p className="text-[10px] text-brand-ink/40">Checklist de vícios, citação, preço vil e ocupação</p>
                </div>
              </div>

              {/* Assessoria Debts */}
              <div
                onClick={() => toggleSection('assessoria_debts')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.assessoria_debts ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.assessoria_debts ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">📑 Parecer de Assessoria & Débitos</p>
                  <p className="text-[10px] text-brand-ink/40">Responsabilidade de IPTU, condomínio e custas</p>
                </div>
              </div>

              {/* Dossier */}
              <div
                onClick={() => toggleSection('dossier')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.dossier ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.dossier ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">📋 Dossiê Técnico Integrado</p>
                  <p className="text-[10px] text-brand-ink/40">Síntese cruzada de Matrícula, Edital e Processos</p>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div
                onClick={() => toggleSection('signatures')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  sections.signatures ? 'border-brand-primary/40 bg-brand-primary/5 font-medium' : 'border-brand-border bg-brand-paper/50 opacity-70'
                }`}
              >
                <div className="mt-0.5 text-brand-primary">
                  {sections.signatures ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-ink">✍️ Campo de Parecer & Assinatura</p>
                  <p className="text-[10px] text-brand-ink/40">Bloco formal com carimbo e assinatura do assessor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="border-t border-brand-border/60 pt-4 flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded focus:ring-0"
              />
              <span>Ocultar endereço e dados sensíveis (Modo Confidencial)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded focus:ring-0"
              />
              <span>Incluir Cabeçalho e Marca D'água Oficial TJ INVEST</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-brand-primary/10 bg-brand-bg/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-4 py-2.5 rounded-xl border border-brand-border bg-brand-paper text-brand-ink text-xs font-bold hover:bg-black/5 transition-all flex items-center gap-2"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <FileText size={14} />}
            {copied ? 'Copiado para Clipboard!' : 'Copiar Texto Selecionado'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brand-border bg-brand-paper text-brand-ink text-xs font-bold hover:bg-black/5 transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={totalSelected === 0}
              className="px-6 py-2.5 rounded-xl bg-brand-primary text-black text-xs font-bold hover:bg-brand-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50"
            >
              <Download size={16} />
              Gerar e Salvar PDF ({totalSelected} {totalSelected === 1 ? 'seção' : 'seções'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
