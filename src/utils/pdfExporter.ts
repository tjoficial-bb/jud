export interface CustomReportExportOptions {
  title?: string;
  property?: any;
  metrics: any;
  roi: number;
  tir: number;
  processStory?: any;
  reportSummary?: string | null;
  smartAnalysis?: any;
  assessoriaAnalysis?: any;
  dossierAnalysis?: any;
  simulationData?: any;
  sections: {
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
  };
  anonymize?: boolean;
  includeWatermark?: boolean;
  advisorName?: string;
}

export function exportCustomReportToPDF(options: CustomReportExportOptions) {
  const {
    title = "Relatório Estratégico TJ INVEST",
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
    anonymize = false,
    includeWatermark = true,
    advisorName = "Assessoria TJ INVEST",
  } = options;

  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  if (!printWindow) {
    alert("Por favor, permita pop-ups no seu navegador para baixar e visualizar o relatório em PDF.");
    return;
  }

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatPercent = (val: number) => (val || 0).toFixed(2) + '%';

  // Build Sections HTML
  let contentHtml = '';

  // 1. Header & Property Identification
  if (sections.header) {
    const propTitle = anonymize ? "Oportunidade de Investimento em Leilão (Dados Anonimizados)" : (property?.title || "Imóvel Selecionado");
    const propAddress = anonymize ? "Bairro Estratégico (Endereço Ocultado)" : (property?.address || "Endereço não informado");
    const propCity = anonymize ? (property?.state ? `Estado: ${property.state}` : "Região Metropolitana") : `${property?.city || ""}${property?.state ? ` - ${property.state}` : ""}`;

    contentHtml += `
      <section style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
          <div>
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 1px;">Identificação do Ativo</span>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0;">${propTitle}</h2>
            <p style="font-size: 12px; color: #475569; margin: 2px 0;">${propAddress}</p>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0;">${propCity}</p>
          </div>
          <div style="text-align: right; min-width: 160px;">
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px;">
              <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block;">Valor de Avaliação</span>
              <span style="font-size: 15px; font-weight: 800; color: #0f172a;">${formatBRL(property?.valuation_value || simulationData?.valuation?.value || metrics.valuation)}</span>
            </div>
            <div style="margin-top: 6px;">
              <span style="font-size: 10px; color: #64748b;">Modalidade: <strong>${property?.modality || "Judicial"}</strong></span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // 2. Opportunity & ROI / TIR Badges
  if (sections.opportunity) {
    contentHtml += `
      <section style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #047857; margin: 0;">⭐️ Resumo da Oportunidade</h3>
            <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Análise de rentabilidade e retorno sobre capital empregado</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 16px; text-align: center;">
              <span style="font-size: 9px; font-weight: 800; color: #047857; text-transform: uppercase; display: block;">ROI Previsto</span>
              <span style="font-size: 18px; font-weight: 800; color: #047857;">${formatPercent(roi)}</span>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 16px; text-align: center;">
              <span style="font-size: 9px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; display: block;">TIR Estimada</span>
              <span style="font-size: 18px; font-weight: 800; color: #1d4ed8;">${formatPercent(tir)}</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // 3. Metrics Table
  if (sections.metrics_table) {
    contentHtml += `
      <section style="margin-bottom: 20px;">
        <h4 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 8px; letter-spacing: 0.5px;">📊 Principais Métricas Financeiras</h4>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Métrica Financeira</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Valor do Cenário</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Detalhamento</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #0f172a;">Valor de Revenda Estimado</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 800; text-align: right; color: #047857;">${formatBRL(metrics.saleValue)}</td>
              <td style="padding: 10px 14px; font-size: 11px; color: #64748b;">Preço de mercado pós-regularização e reforma</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #0f172a;">Lance Máximo Sugerido</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 800; text-align: right; color: #b91c1c;">${formatBRL(metrics.bid)}</td>
              <td style="padding: 10px 14px; font-size: 11px; color: #64748b;">Teto recomendado para arrematação segura</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #0f172a;">Prazo Estimado de Projeto</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 800; text-align: right; color: #0f172a;">${simulationData?.holdingMonths || 12} meses</td>
              <td style="padding: 10px 14px; font-size: 11px; color: #64748b;">Período entre leilão, posse e liquidação</td>
            </tr>
            <tr style="background: #ecfdf5;">
              <td style="padding: 12px 14px; font-size: 13px; font-weight: 800; color: #047857;">Resultado Líquido Projetado</td>
              <td style="padding: 12px 14px; font-size: 15px; font-weight: 800; text-align: right; color: #047857;">${formatBRL(metrics.netProfit)}</td>
              <td style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #047857;">Lucro livre após todos os custos e impostos</td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 4. Cash Flow & Estimated Costs
  if (sections.cash_flow) {
    contentHtml += `
      <section style="margin-bottom: 20px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px;">
        <h4 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #047857; margin-top: 0; margin-bottom: 12px;">📈 Fluxo de Caixa e Discriminação de Custos</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 6px 10px; font-size: 10px; text-align: left; color: #64748b; text-transform: uppercase;">Etapa / Rubrica</th>
              <th style="padding: 6px 10px; font-size: 10px; text-align: right; color: #64748b; text-transform: uppercase;">Valor (R$)</th>
              <th style="padding: 6px 10px; font-size: 10px; text-align: right; color: #64748b; text-transform: uppercase;">Natureza</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 10px; font-size: 12px; color: #0f172a;">(+) Valor de Venda</td>
              <td style="padding: 8px 10px; font-size: 12px; font-weight: 700; text-align: right; color: #047857;">${formatBRL(metrics.saleValue)}</td>
              <td style="padding: 8px 10px; font-size: 11px; text-align: right; color: #64748b;">Mercado</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 10px; font-size: 12px; color: #0f172a;">(-) Lance de Arrematação</td>
              <td style="padding: 8px 10px; font-size: 12px; font-weight: 700; text-align: right; color: #b91c1c;">-${formatBRL(metrics.bid)}</td>
              <td style="padding: 8px 10px; font-size: 11px; text-align: right; color: #64748b;">Aquisição</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 10px; font-size: 12px; color: #0f172a;">(-) Custos Operacionais Totais (Reforma, ITBI, Registro, etc.)</td>
              <td style="padding: 8px 10px; font-size: 12px; font-weight: 700; text-align: right; color: #b91c1c;">-${formatBRL(metrics.totalUpfrontExpenses)}</td>
              <td style="padding: 8px 10px; font-size: 11px; text-align: right; color: #64748b;">Operacional</td>
            </tr>
            <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1;">
              <td style="padding: 10px 10px; font-size: 12px; font-weight: 800; color: #0f172a;">(=) Lucro Líquido Final Estimado</td>
              <td style="padding: 10px 10px; font-size: 14px; font-weight: 800; text-align: right; color: #047857;">${formatBRL(metrics.netProfit)}</td>
              <td style="padding: 10px 10px; font-size: 11px; font-weight: 700; text-align: right; color: #047857;">Resultado</td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  // 5. Executive Summary / IA Report
  if (sections.executive_summary && reportSummary) {
    contentHtml += `
      <section style="margin-bottom: 24px;">
        <h4 style="font-size: 14px; font-weight: 800; color: #047857; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
          📝 Parecer Geral de Viabilidade & Resumo Executivo
        </h4>
        <div style="font-size: 12px; line-height: 1.6; color: #334155; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">
          ${reportSummary.replace(/```[a-z]*\n?/g, '').trim()}
        </div>
      </section>
    `;
  }

  // 6. Process Story
  if (sections.process_story && processStory?.full_story) {
    contentHtml += `
      <section style="margin-bottom: 24px; page-break-inside: avoid;">
        <h4 style="font-size: 14px; font-weight: 800; color: #047857; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
          📖 História do Processo Judicial
        </h4>
        <div style="font-size: 12px; line-height: 1.6; color: #1e293b; background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1;">
          ${processStory.full_story.replace(/```[a-z]*\n?/g, '').trim()}
        </div>
      </section>
    `;
  }

  // 7. Legal Glossary
  if (sections.legal_glossary && processStory?.legal_glossary) {
    contentHtml += `
      <section style="margin-bottom: 24px; page-break-inside: avoid;">
        <h4 style="font-size: 14px; font-weight: 800; color: #047857; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
          ⚖️ Glossário Jurídico Descomplicado
        </h4>
        <div style="font-size: 11px; line-height: 1.5; color: #334155; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
          ${processStory.legal_glossary.replace(/```[a-z]*\n?/g, '').trim()}
        </div>
      </section>
    `;
  }

  // 8. Timeline
  if (sections.timeline && processStory?.timeline && Array.isArray(processStory.timeline) && processStory.timeline.length > 0) {
    contentHtml += `
      <section style="margin-bottom: 24px; page-break-inside: avoid;">
        <h4 style="font-size: 14px; font-weight: 800; color: #047857; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
          ⏱️ Linha do Tempo dos Principais Fatos
        </h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px 10px; width: 100px; text-align: left;">Data / Marco</th>
              <th style="padding: 8px 10px; text-align: left;">Evento / Ocorrência Processual</th>
            </tr>
          </thead>
          <tbody>
            ${processStory.timeline.map((evt: any, i: number) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
                <td style="padding: 8px 10px; font-weight: 700; color: #047857;">${evt.date || 'Data N/D'}</td>
                <td style="padding: 8px 10px; color: #334155;">${evt.event || evt.description || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  // 9. Smart Analysis Risks
  if (sections.smart_risks && smartAnalysis) {
    contentHtml += `
      <section style="margin-bottom: 24px; page-break-inside: avoid;">
        <h4 style="font-size: 14px; font-weight: 800; color: #047857; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
          🛡️ Análise Smart de Riscos & Nulidades
        </h4>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; font-size: 11px; line-height: 1.5;">
          <p style="margin: 0 0 6px 0;"><strong>Risco Geral:</strong> ${smartAnalysis.risco_geral || 'Médio'}</p>
          <p style="margin: 0 0 6px 0;"><strong>Recomendação:</strong> ${smartAnalysis.recomendacao || 'Recomendo com ressalvas'}</p>
          <p style="margin: 0 0 6px 0;"><strong>Justificativa:</strong> ${smartAnalysis.justificativa || 'Análise técnica de regularidade realizada.'}</p>
          <p style="margin: 0;"><strong>Situação de Ocupação:</strong> ${smartAnalysis.status_ocupacao || 'Ocupado'}</p>
        </div>
      </section>
    `;
  }

  // 10. Assessoria Debts
  if (sections.assessoria_debts && assessoriaAnalysis) {
    contentHtml += `
      <section style="margin-bottom: 24px; page-break-inside: avoid;">
        <h4 style="font-size: 14px; font-weight: 800; color: #047857; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
          📑 Parecer de Débitos e Sub-rogação
        </h4>
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; font-size: 11px;">
          <p style="margin: 0 0 4px 0;"><strong>Responsabilidade por IPTU/Condomínio:</strong> ${assessoriaAnalysis.responsabilidade_debitos || 'Sub-rogado no preço'}</p>
          <p style="margin: 0 0 4px 0;"><strong>Estimativa de Débitos IPTU:</strong> ${formatBRL(assessoriaAnalysis.iptu_total || 0)}</p>
          <p style="margin: 0;"><strong>Estimativa de Débitos Condominiais:</strong> ${formatBRL(assessoriaAnalysis.condominio_total || 0)}</p>
        </div>
      </section>
    `;
  }

  // 11. Signatures & Disclaimer
  if (sections.signatures) {
    contentHtml += `
      <section style="margin-top: 36px; border-top: 2px solid #cbd5e1; padding-top: 20px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 30px;">
          <div style="max-width: 60%;">
            <p style="font-size: 9px; color: #64748b; margin: 0 0 8px 0; line-height: 1.4;">
              <strong>Aviso Legal:</strong> Este relatório possui caráter estritamente consultivo e informativo, fundamentado na documentação disponibilizada e nas práticas de mercado. A decisão final de investimento cabe ao arrematante.
            </p>
            <p style="font-size: 10px; font-weight: 700; color: #047857; margin: 0;">
              Emitido eletronicamente via TJ INVEST — Plataforma de Inteligência em Leilões
            </p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; width: 100%; margin-bottom: 4px;"></div>
            <p style="font-size: 11px; font-weight: 800; color: #0f172a; margin: 0;">${advisorName}</p>
            <p style="font-size: 9px; color: #64748b; margin: 0;">Responsável Técnico / Assessoria</p>
          </div>
        </div>
      </section>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 14mm 14mm 14mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #ffffff !important;
          color: #0f172a !important;
          padding: 10px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-break { page-break-before: always; }
        table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      ${includeWatermark ? `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #047857; padding-bottom: 10px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #047857; margin: 0; letter-spacing: -0.5px;">TJ INVEST — INTELIGÊNCIA DE LEILÕES</h1>
            <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0; font-weight: 600;">Relatório Executivo de Oportunidade e Viabilidade de Arrematação</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 10px; color: #64748b; margin: 0;">Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <span style="display: inline-block; margin-top: 4px; padding: 2px 8px; background-color: #ecfdf5; color: #047857; font-size: 10px; font-weight: bold; border-radius: 4px; border: 1px solid #a7f3d0;">
              DOCUMENTO OFICIAL
            </span>
          </div>
        </div>
      ` : ''}

      <main>
        ${contentHtml}
      </main>

      <footer style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #94a3b8; text-align: center;">
        TJ INVEST © ${new Date().getFullYear()} — Plataforma de Inteligência e Assessoria em Leilões Imobiliários. Todos os direitos reservados.
      </footer>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportElementToPDF(elementId: string, filename: string = "Relatorio_TJ_INVEST.pdf", docTitle: string = "Relatório Técnico TJ INVEST") {
  const element = document.getElementById(elementId);
  if (!element) {
    if ((window as any).customToast) {
      (window as any).customToast("Erro: Conteúdo do relatório não foi localizado para exportação em PDF.", "error");
    } else {
      alert("Erro: Conteúdo do relatório não localizado.");
    }
    return;
  }

  // Clone element content
  const clone = element.cloneNode(true) as HTMLElement;

  // Transform selects and inputs to visible text before stripping
  const selects = clone.querySelectorAll('select');
  selects.forEach(sel => {
    const textNode = document.createElement('span');
    textNode.className = 'font-bold text-slate-800';
    textNode.innerText = sel.options[sel.selectedIndex]?.text || sel.value || 'N/A';
    sel.parentNode?.replaceChild(textNode, sel);
  });

  const inputs = clone.querySelectorAll('input, textarea');
  inputs.forEach(inp => {
    if (inp instanceof HTMLInputElement && inp.type === 'checkbox') {
      const textNode = document.createElement('span');
      textNode.className = inp.checked ? 'font-bold text-emerald-700' : 'text-slate-500';
      textNode.innerText = inp.checked ? '[SIM]' : '[NÃO]';
      inp.parentNode?.replaceChild(textNode, inp);
    } else {
      const inputEl = inp as HTMLInputElement | HTMLTextAreaElement;
      const textNode = document.createElement('span');
      textNode.className = 'font-semibold text-slate-800';
      textNode.innerText = inputEl.value || '—';
      inputEl.parentNode?.replaceChild(textNode, inputEl);
    }
  });

  // Remove elements with class 'no-print' or action buttons
  const noPrints = clone.querySelectorAll('.no-print, button, svg.animate-spin, .document-upload-zone');
  noPrints.forEach(el => el.remove());

  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  if (!printWindow) {
    alert("Por favor, permita pop-ups no seu navegador para baixar e visualizar o relatório em PDF.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>${docTitle}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #ffffff !important;
          color: #0f172a !important;
          padding: 15px;
        }
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
        .bg-brand-paper, .bg-brand-bg, .bg-black\\/5 { background-color: #ffffff !important; color: #0f172a !important; }
        .border-brand-border, .border-black\\/10 { border-color: #cbd5e1 !important; }
        .text-brand-primary { color: #047857 !important; }
        .text-brand-ink, .text-brand-ink\\/90 { color: #0f172a !important; }
        .text-brand-ink\\/40, .text-brand-ink\\/50, .text-brand-ink\\/60 { color: #475569 !important; }
        .shadow-sm, .shadow-md, .shadow-xl { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; }
        th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
      </style>
    </head>
    <body class="bg-white text-slate-900">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #047857; padding-bottom: 12px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: #047857; margin: 0; letter-spacing: -0.5px;">TJ INVEST — INTELIGÊNCIA DE LEILÕES</h1>
          <p style="font-size: 11px; color: #475569; margin: 4px 0 0 0; font-weight: 600;">Relatório Oficial de Análise e Viabilidade Jurídica de Arrematação</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 10px; color: #64748b; margin: 0;">Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          <span style="display: inline-block; margin-top: 4px; padding: 2px 8px; background-color: #ecfdf5; color: #047857; font-size: 10px; font-weight: bold; border-radius: 4px; border: 1px solid #a7f3d0;">
            DOCUMENTO OFICIAL PDF
          </span>
        </div>
      </div>

      <main id="pdf-content">
        ${clone.innerHTML}
      </main>

      <footer style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center;">
        TJ INVEST © ${new Date().getFullYear()} — Plataforma de Inteligência e Assessoria em Leilões Imobiliários. Todos os direitos reservados.
      </footer>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
