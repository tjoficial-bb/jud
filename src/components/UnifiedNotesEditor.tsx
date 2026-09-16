import React, { useState, useEffect } from 'react';
import { 
  FileEdit, 
  Save, 
  Copy, 
  Check, 
  Sparkles, 
  Trash2, 
  BookOpen, 
  Gavel, 
  DollarSign, 
  ShieldCheck, 
  Download,
  Info
} from 'lucide-react';

interface UnifiedNotesEditorProps {
  initialNotes?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  onSaveNotes?: (notes: string) => void;
}

export const UnifiedNotesEditor: React.FC<UnifiedNotesEditorProps> = ({
  initialNotes = '',
  propertyTitle = '',
  propertyAddress = '',
  onSaveNotes
}) => {
  const [notes, setNotes] = useState<string>(initialNotes);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialNotes !== undefined) {
      setNotes(initialNotes);
    }
  }, [initialNotes]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (onSaveNotes) {
      onSaveNotes(notes);
    }
    // Also save to localStorage as backup
    try {
      localStorage.setItem('unified_summary_custom_notes', notes);
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }

    setIsSaved(true);
    if ((window as any).customToast) {
      (window as any).customToast("Informações do Resumo Unificado salvas com sucesso!", "success");
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if ((window as any).customToast) {
      (window as any).customToast("Informações copiadas para a área de transferência!", "success");
    }
  };

  const handleClear = () => {
    if (window.confirm("Deseja realmente limpar as informações deste campo?")) {
      setNotes('');
      if (onSaveNotes) onSaveNotes('');
      if ((window as any).customToast) {
        (window as any).customToast("Campo de informações limpo.", "info");
      }
    }
  };

  const insertTemplate = (templateType: 'executivo' | 'juridico' | 'leiloeiro' | 'financeiro') => {
    let templateText = '';
    const dateStr = new Date().toLocaleDateString('pt-BR');

    switch (templateType) {
      case 'executivo':
        templateText = `### 📌 PARECER EXECUTIVO UNIFICADO (${dateStr})\n` +
          `• **Imóvel:** ${propertyTitle || 'Oportunidade em Leilão'}\n` +
          `• **Endereço:** ${propertyAddress || 'Conforme Edital/Matrícula'}\n` +
          `• **Status de Ocupação:** [ ] Desocupado  [ ] Ocupado pelo executado  [ ] Locado a terceiros\n` +
          `• **Estado de Conservação:** [ ] Excelente  [ ] Bom  [ ] Necessita reforma média\n` +
          `• **Estratégia Recomendada:** [ ] Revenda rápida no estado  [ ] Reforma (Flipping)  [ ] Renda de locação\n` +
          `• **Parecer do Assessor:** Imóvel com excelente liquidez e desconto atrativo sobre o valor de mercado.`;
        break;

      case 'juridico':
        templateText = `### ⚖️ AUDITORIA JURÍDICA E DILIGÊNCIA PRÉVIA (${dateStr})\n` +
          `• **Risco Processual:** [ ] Baixo (Execução padrão com intimações regulares)  [ ] Médio  [ ] Alto\n` +
          `• **Intimações dos Devedores/Cônjuges:** [ ] 100% regulares nos autos\n` +
          `• **Baixa de Penhoras/Gravames:** Todos os ônus anteriores serão extintos via Carta de Arrematação (Art. 903 e 130 CTN).\n` +
          `• **Ações Conexas / Embargos:** [ ] Não identificadas ações de risco que impeçam a posse.\n` +
          `• **Observações Judiciais:** Processo transitado em fase final de hasta pública.`;
        break;

      case 'leiloeiro':
        templateText = `### 🏛️ CONTATOS & INFORMAÇÕES DO LEILÃO (${dateStr})\n` +
          `• **Leiloeiro Oficial:** [Nome do Leiloeiro / Portal]\n` +
          `• **Link Direto do Lote:** https://...\n` +
          `• **Telefone / Suporte do Leiloeiro:** (00) 0000-0000\n` +
          `• **Vara Judicial / Comarca:** [Ex: 2ª Vara Cível da Comarca]\n` +
          `• **Habilitação no Portal:** [ ] Concluída com sucesso\n` +
          `• **Condições de Pagamento:** [ ] À vista  [ ] Parcelamento (25% + até 30x)`;
        break;

      case 'financeiro':
        templateText = `### 💰 PARÂMETROS FINANCEIROS & METAS DE LANCE (${dateStr})\n` +
          `• **Lance Mínimo (2ª Praça):** R$ \n` +
          `• **Lance Teto Recomendado:** R$ \n` +
          `• **Comissão Leiloeiro (5%):** R$ \n` +
          `• **ITBI + Escritura/Registro (~4%):** R$ \n` +
          `• **Reserva para Desocupação/Custas:** R$ \n` +
          `• **Investimento Total Previsto:** R$ \n` +
          `• **Preço Alvo de Venda:** R$ \n` +
          `• **Lucro Líquido Estimado:** R$ `;
        break;
    }

    setNotes(prev => prev ? `${prev}\n\n${templateText}` : templateText);
    setIsSaved(false);
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  return (
    <div className="bg-brand-paper border border-brand-border rounded-3xl p-6 sm:p-7 shadow-md space-y-5 antialiased">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <FileEdit size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-ink tracking-tight">
              Informações & Notas do Resumo Unificado
            </h3>
            <p className="text-xs text-brand-ink/55 mt-0.5">
              Escreva observações personalizadas, parecer do assessor, contatos e dados do leilão
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {notes && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5"
              title="Limpar texto"
            >
              <Trash2 size={13} />
              <span>Limpar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!notes}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-bg hover:bg-brand-primary/10 text-brand-ink border border-brand-border transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-black transition-all flex items-center gap-1.5 shadow-sm shadow-brand-primary/20"
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            <span>{isSaved ? 'Salvo!' : 'Salvar Informações'}</span>
          </button>
        </div>
      </div>

      {/* Quick Template Inserters */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-wider block">
          Modelos Rápidos para Preenchimento:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => insertTemplate('executivo')}
            className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 text-brand-ink border border-brand-border rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Sparkles size={12} className="text-brand-primary" />
            <span>+ Parecer Executivo</span>
          </button>

          <button
            type="button"
            onClick={() => insertTemplate('juridico')}
            className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 text-brand-ink border border-brand-border rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>+ Diligência Jurídica</span>
          </button>

          <button
            type="button"
            onClick={() => insertTemplate('leiloeiro')}
            className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 text-brand-ink border border-brand-border rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Gavel size={12} className="text-amber-500" />
            <span>+ Contatos do Leiloeiro</span>
          </button>

          <button
            type="button"
            onClick={() => insertTemplate('financeiro')}
            className="px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 text-brand-ink border border-brand-border rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <DollarSign size={12} className="text-blue-500" />
            <span>+ Metas Financeiras</span>
          </button>
        </div>
      </div>

      {/* Text Area Field */}
      <div className="relative">
        <textarea
          rows={10}
          value={notes}
          onChange={handleTextChange}
          placeholder="Digite aqui quaisquer informações adicionais, parecer do assessor, anotações de diligência, contatos ou observações sobre este imóvel..."
          className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl p-4 sm:p-5 text-sm font-sans text-brand-ink placeholder:text-brand-ink/35 focus:outline-none focus:border-brand-primary/60 focus:bg-brand-bg/80 leading-relaxed resize-y transition-all"
        />

        {/* Floating live counter footer */}
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-brand-ink/45 font-mono">
          <div className="flex items-center gap-2">
            <Info size={12} />
            <span>Suporta formatação Markdown (títulos, listas, negrito)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{wordCount} palavras</span>
            <span>•</span>
            <span>{charCount} caracteres</span>
            {isSaved && (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <Check size={11} /> Salvo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
