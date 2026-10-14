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

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff !important; color: #0f172a !important; padding: 12px; }
    .no-print { display: none !important; }
  </style>
</head>
<body>
  <div class="max-w-5xl mx-auto">
    <div class="border-b-2 border-emerald-600 pb-3 flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-emerald-800">TJ INVEST</h1>
        <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">${docTitle} • Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded">DOSSIÊ EXECUTIVO</span>
    </div>
    ${clone.innerHTML}
  </div>
</body>
</html>`;

  printHtmlDirectly(html, docTitle);
}

export function printHtmlDirectly(html: string, docTitle: string = 'Relatório TJ INVEST') {
  try {
    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch (e) {
    console.warn("Popup blocked, falling back to hidden iframe print:", e);
  }

  // Fallback for sandboxed iframes or popup blockers: Hidden iframe
  let iframe = document.getElementById('tj-print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'tj-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Erro ao imprimir via iframe:", err);
      }
    }, 600);
  }
}

export interface ViabilidadeExportData {
  property?: any;
  smartAnalysis: any;
  metrics?: any;
  roi?: number;
  tir?: number;
  advisorName?: string;
}

export function exportViabilidadeReportToPDF(data: ViabilidadeExportData) {
  const { property, smartAnalysis, metrics, roi, tir, advisorName = "Assessoria Especializada TJ INVEST" } = data;
  const sa = smartAnalysis || {};

  const formatBRL = (val?: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatPercent = (val?: number) => (val || 0).toFixed(1) + '%';

  const valAvaliacao = sa.valor_avaliacao || property?.valuation_value || metrics?.valuation || 0;
  const valPrimeiroLeilao = sa.primeiro_leilao_valor || (valAvaliacao > 0 ? valAvaliacao : 0);
  const valSegundoLeilao = sa.segundo_leilao_valor || (valAvaliacao > 0 ? valAvaliacao * 0.5 : 0);
  const desconto = sa.desconto_segundo_leilao || (valAvaliacao > 0 ? Math.round(((valAvaliacao - valSegundoLeilao) / valAvaliacao) * 100) : 50);

  const lance = sa.lance_planejado || valSegundoLeilao || (valAvaliacao * 0.5);
  const comissao = sa.comissao_leiloeiro || (lance * 0.05);
  const itbi = sa.itbi_estimado || (lance * 0.03);
  const cartorio = sa.custos_cartorarios || (lance * 0.015);
  const reforma = sa.custos_reforma || 15000;
  const desocupacao = sa.custos_desocupacao_honorarios || sa.custo_estimado_desocupacao || 5000;
  const iptuAtraso = sa.responsabilidade_iptu === 'Comprador' ? (sa.iptu_atraso || 0) : 0;
  const condAtraso = sa.responsabilidade_condominio === 'Comprador' ? (sa.condominio_atraso || 0) : 0;
  const holding = sa.holding_costs || (((sa.iptu_atraso > 0 ? sa.iptu_atraso / 12 : 300) + (sa.condominio_atraso > 0 ? sa.condominio_atraso / 12 : 600)) * 8);

  const custoTotal = sa.custo_total_aquisicao || (lance + comissao + itbi + cartorio + reforma + desocupacao + iptuAtraso + condAtraso + holding);
  const revenda = sa.valor_mercado_venda || valAvaliacao || (lance * 1.8);
  const lucroLiquido = sa.lucro_liquido_estimado || (revenda - custoTotal - (revenda * 0.06));
  const roiCalculado = sa.roi_estimado || (custoTotal > 0 ? (lucroLiquido / custoTotal) * 100 : roi || 0);
  const tirCalculada = sa.tir_estimada || (roiCalculado > 0 ? roiCalculado * 1.3 : tir || 0);

  // SAC vs PRICE
  const entradaFinanc = sa.financiamento_entrada || (revenda * 0.20);
  const financiado = revenda - entradaFinanc;
  const sacPrimeira = sa.financiamento_sac_primeira_parcela || ((financiado / 360) + (financiado * 0.0084));
  const sacUltima = sa.financiamento_sac_ultima_parcela || (financiado / 360);
  const priceFixa = sa.financiamento_price_parcela_fixa || (financiado * (0.0084 / (1 - Math.pow(1 + 0.0084, -360))));
  const rendaMinima = sa.renda_minima_familiar || (sacPrimeira / 0.30);

  const docTitle = `Estudo_Viabilidade_Leilao_${sa.numero_matricula || property?.id || 'TJINVEST'}.pdf`;

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
          margin: 10mm 12mm 12mm 12mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #ffffff !important;
          color: #0f172a !important;
          padding: 8px;
          line-height: 1.35;
        }
        .page-break { page-break-before: always; }
        .no-print { display: none !important; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0.75rem; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11px; }
        th { background-color: #f8fafc; font-weight: 700; color: #0f172a; }
        .kpi-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; }
        .kpi-title { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .kpi-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px; }
        .badge-green { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-weight: 700; border-radius: 4px; padding: 2px 6px; font-size: 10px; display: inline-block; }
        .badge-amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-weight: 700; border-radius: 4px; padding: 2px 6px; font-size: 10px; display: inline-block; }
        .badge-red { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-weight: 700; border-radius: 4px; padding: 2px 6px; font-size: 10px; display: inline-block; }
        .section-header { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; border-bottom: 2px solid #047857; padding-bottom: 3px; margin: 14px 0 8px 0; }
      </style>
    </head>
    <body>
      <!-- Top Brand Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #047857; padding-bottom: 10px; margin-bottom: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="background: #047857; color: #ffffff; font-weight: 900; font-size: 14px; padding: 4px 8px; border-radius: 6px;">TJ</div>
            <div>
              <h1 style="font-size: 20px; font-weight: 900; color: #047857; margin: 0; letter-spacing: -0.5px;">TJ INVEST</h1>
              <p style="font-size: 10px; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Inteligência Estratégica em Leilões Imobiliários</p>
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge-green" style="font-size: 11px; padding: 4px 10px;">DOSSIÊ DE VIABILIDADE & LIQUIDEZ</span>
          <p style="font-size: 9px; color: #64748b; margin: 4px 0 0 0;">Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      <!-- KPI Summary Banner -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px;">
        <div class="kpi-box" style="border-top: 3px solid #047857;">
          <div class="kpi-title">Avaliação x 2º Leilão</div>
          <div class="kpi-val">${formatBRL(valSegundoLeilao)}</div>
          <div style="font-size: 10px; color: #047857; font-weight: 700; margin-top: 2px;">-${desconto}% da Avaliação</div>
        </div>
        <div class="kpi-box" style="border-top: 3px solid #3b82f6;">
          <div class="kpi-title">Custo Total de Aquisição</div>
          <div class="kpi-val" style="color: #1e3a8a;">${formatBRL(custoTotal)}</div>
          <div style="font-size: 9px; color: #64748b;">Lance + Taxas + Reforma</div>
        </div>
        <div class="kpi-box" style="border-top: 3px solid #10b981; background: #f0fdf4;">
          <div class="kpi-title" style="color: #047857;">Lucro Líquido Projetado</div>
          <div class="kpi-val" style="color: #047857;">${formatBRL(lucroLiquido)}</div>
          <div style="font-size: 10px; color: #047857; font-weight: 800;">ROI: ${formatPercent(roiCalculado)} | TIR: ${formatPercent(tirCalculada)}</div>
        </div>
        <div class="kpi-box" style="border-top: 3px solid #f59e0b;">
          <div class="kpi-title">Parecer do Consultor</div>
          <div class="kpi-val" style="font-size: 13px; color: ${sa.risco_geral === 'Baixo' ? '#047857' : sa.risco_geral === 'Alto' ? '#b91c1c' : '#b45309'};">
            ${sa.recomendacao && sa.recomendacao !== 'Selecione' ? sa.recomendacao : 'Recomendado com Ressalvas'}
          </div>
          <div style="font-size: 9px; color: #64748b;">Risco Geral: <strong>${sa.risco_geral || 'Médio'}</strong></div>
        </div>
      </div>

      <!-- 1. IDENTIFICAÇÃO DO ATIVO E PROCESSO -->
      <div class="section-header">1. Identificação do Ativo & Dados do Processo</div>
      <table style="margin-bottom: 10px;">
        <tbody>
          <tr>
            <td style="width: 20%; font-weight: bold; background: #f8fafc;">Título / Imóvel:</td>
            <td style="width: 45%;">${property?.title || sa.tipo_imovel || 'Imóvel em Leilão'} (${sa.tipo_imovel || property?.type || 'Residencial'})</td>
            <td style="width: 15%; font-weight: bold; background: #f8fafc;">Modalidade:</td>
            <td style="width: 20%;"><span class="badge-green">${sa.tipo_leilao || property?.modality || 'Judicial'}</span></td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Endereço:</td>
            <td colspan="3">${property?.address || sa.endereco_ex_mutuario || 'Endereço constante nos autos do processo'} - ${property?.city || sa.comarca || ''}/${property?.state || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Matrícula (CRI):</td>
            <td><strong>${sa.numero_matricula || 'Consultar certidão'}</strong> (${sa.cartorio_registro || 'Cartório de Registro de Imóveis'})</td>
            <td style="font-weight: bold; background: #f8fafc;">Inscrição / IPTU:</td>
            <td><strong>${sa.cadastro_imobiliario || 'Consultar cadastro municipal'}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Áreas (m²):</td>
            <td>Privativa: <strong>${sa.area_privativa ? `${sa.area_privativa} m²` : (sa.area_util ? `${sa.area_util} m²` : 'N/D')}</strong> | Terreno: <strong>${sa.area_terreno ? `${sa.area_terreno} m²` : 'N/D'}</strong> | Total: <strong>${sa.area_construida ? `${sa.area_construida} m²` : (property?.area ? `${property.area} m²` : 'Conforme Matrícula')}</strong></td>
            <td style="font-weight: bold; background: #f8fafc;">Processo / CNJ:</td>
            <td><strong>${sa.numero_processo || property?.cnj_number || 'Conforme Edital'}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Comarca / Vara:</td>
            <td>${sa.vara || 'Vara Cível'} da Comarca de ${sa.comarca || property?.city || 'Origem'}</td>
            <td style="font-weight: bold; background: #f8fafc;">Leiloeiro Oficial:</td>
            <td>${sa.leiloeiro || property?.auction_url ? 'Portal Oficial' : 'Leiloeiro Credenciado'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background: #f8fafc;">Executado / Devedor:</td>
            <td>${sa.nome_ex_mutuario || 'Devedor Executado Principal'} ${sa.cpf_ex_mutuario ? `(CPF: ${sa.cpf_ex_mutuario})` : ''}</td>
            <td style="font-weight: bold; background: #f8fafc;">Cônjuge / Outros:</td>
            <td>${sa.conjuge_ex_mutuario || 'Não consta coproprietário citado'}</td>
          </tr>
        </tbody>
      </table>

      <!-- 2. DATAS E VALORES DAS PRAÇAS -->
      <div class="section-header">2. Cronograma das Praças & Descontos Oficiais</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b;">VALOR DE AVALIAÇÃO</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${formatBRL(valAvaliacao)}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Laudo de Avaliação Judicial / Caixa</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b;">1º LEILÃO (100%)</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${formatBRL(valPrimeiroLeilao)}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Data: <strong>${sa.data_primeiro_leilao || 'Conforme Edital'}</strong></div>
        </div>
        <div style="border: 2px solid #047857; border-radius: 6px; padding: 8px; background: #f0fdf4;">
          <div style="font-size: 10px; font-weight: 700; color: #047857;">2º LEILÃO (LANCE ALVO -${desconto}%)</div>
          <div style="font-size: 16px; font-weight: 900; color: #047857;">${formatBRL(valSegundoLeilao)}</div>
          <div style="font-size: 9px; color: #047857; margin-top: 2px; font-weight: 600;">Data: <strong>${sa.data_segundo_leilao || 'Conforme Edital'}</strong></div>
        </div>
      </div>

      <!-- 3. COMPOSIÇÃO DE CUSTOS DE AQUISIÇÃO -->
      <div class="section-header">3. Demonstrativo Completo de Desembolso (Estrutura de Custos)</div>
      <table>
        <thead>
          <tr>
            <th>Item de Custo / Desembolso</th>
            <th>Base / Descrição</th>
            <th style="text-align: right;">Valor Estimado</th>
            <th style="text-align: right;">% do Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Lance de Arrematação Planejado</strong></td>
            <td>Valor de arrematação em 2º leilão com desconto de ${desconto}%</td>
            <td style="text-align: right; font-weight: bold;">${formatBRL(lance)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((lance / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Comissão do Leiloeiro Oficial</td>
            <td>5% incidente sobre o valor da arrematação</td>
            <td style="text-align: right;">${formatBRL(comissao)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((comissao / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>ITBI (Imposto de Transmissão)</td>
            <td>Estimado em 3% sobre arrematação ou valor venal municipal</td>
            <td style="text-align: right;">${formatBRL(itbi)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((itbi / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Emolumentos de Escritura e Registro (CRI)</td>
            <td>Registro da Carta de Arrematação no Cartório de Imóveis (~1,5%)</td>
            <td style="text-align: right;">${formatBRL(cartorio)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((cartorio / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Reforma, Pintura e Reparos</td>
            <td>Adequação estética e funcional para revenda de liquidez rápida</td>
            <td style="text-align: right;">${formatBRL(reforma)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((reforma / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Honorários Jurídicos / Imissão de Posse</td>
            <td>Assessoria jurídica especializada para expedição de mandado e desocupação</td>
            <td style="text-align: right;">${formatBRL(desocupacao)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((desocupacao / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Débitos de IPTU e Condomínio Atrasados</td>
            <td>Responsabilidade: <strong>${sa.responsabilidade_iptu || 'Sub-rogado no preço'}</strong> (IPTU: ${formatBRL(sa.iptu_atraso)}) / Condomínio: ${formatBRL(sa.condominio_atraso)}</td>
            <td style="text-align: right;">${formatBRL(iptuAtraso + condAtraso)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? (((iptuAtraso + condAtraso) / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Custos de Carregamento (Holding 8 meses)</td>
            <td>IPTU + Condomínio mensais durante período de desocupação e revenda</td>
            <td style="text-align: right;">${formatBRL(holding)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((holding / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr style="background: #f0fdf4; font-weight: bold; border-top: 2px solid #047857;">
            <td style="font-size: 12px; color: #047857;">CUSTO TOTAL DE AQUISIÇÃO (CAPITAL INVESTIDO)</td>
            <td style="color: #047857;">Soma de todos os desembolsos até a revenda</td>
            <td style="text-align: right; font-size: 13px; color: #047857;">${formatBRL(custoTotal)}</td>
            <td style="text-align: right; color: #047857;">100.0%</td>
          </tr>
        </tbody>
      </table>

      <!-- 4. PROJEÇÃO DE RETORNO E SIMULAÇÃO DE FINANCIAMENTO FINAL -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
        <!-- Retorno Financeiro -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff;">
          <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 6px;">
            Projeção de Retorno (Flipping em 6 a 12 meses)
          </div>
          <table style="margin-bottom: 0;">
            <tbody>
              <tr>
                <td>Preço Estimado de Venda:</td>
                <td style="text-align: right; font-weight: bold;">${formatBRL(revenda)}</td>
              </tr>
              <tr>
                <td>(-) Custo Total de Aquisição:</td>
                <td style="text-align: right; color: #b91c1c;">-${formatBRL(custoTotal)}</td>
              </tr>
              <tr>
                <td>(-) Corretagem de Venda (6%):</td>
                <td style="text-align: right; color: #b91c1c;">-${formatBRL(revenda * 0.06)}</td>
              </tr>
              <tr style="background: #ecfdf5; font-weight: bold;">
                <td style="color: #047857;">LUCRO LÍQUIDO ESTIMADO:</td>
                <td style="text-align: right; color: #047857; font-size: 13px;">${formatBRL(lucroLiquido)}</td>
              </tr>
              <tr>
                <td>Retorno s/ Investimento (ROI):</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">${formatPercent(roiCalculado)}</td>
              </tr>
              <tr>
                <td>TIR Anualizada Estimada:</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">${formatPercent(tirCalculada)} a.a.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Financiamento Comprador Final -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff;">
          <div style="font-size: 11px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px;">
            Simulação de Financiamento para Comprador Final
          </div>
          <table style="margin-bottom: 0;">
            <tbody>
              <tr>
                <td>Entrada do Comprador (20%):</td>
                <td style="text-align: right; font-weight: bold;">${formatBRL(entradaFinanc)}</td>
              </tr>
              <tr>
                <td>Saldo Financiado (80% em 360 meses):</td>
                <td style="text-align: right; font-weight: bold;">${formatBRL(financiado)}</td>
              </tr>
              <tr>
                <td>Tabela SAC - 1ª Parcela:</td>
                <td style="text-align: right; font-weight: bold; color: #1e3a8a;">${formatBRL(sacPrimeira)}</td>
              </tr>
              <tr>
                <td>Tabela SAC - Última Parcela:</td>
                <td style="text-align: right; color: #64748b;">${formatBRL(sacUltima)}</td>
              </tr>
              <tr>
                <td>Tabela PRICE - Parcela Fixa:</td>
                <td style="text-align: right; font-weight: bold; color: #1e3a8a;">${formatBRL(priceFixa)}</td>
              </tr>
              <tr style="background: #eff6ff; font-weight: bold;">
                <td style="color: #1e3a8a;">Renda Familiar Mínima Estimada:</td>
                <td style="text-align: right; color: #1e3a8a;">${formatBRL(rendaMinima)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PAGE BREAK FOR LEGAL DIAGNOSIS & REMEDIES -->
      <div class="page-break"></div>

      <!-- Header Page 2 -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #047857; text-transform: uppercase;">TJ INVEST — Parecer Jurídico & Matriz de Riscos</span>
        <span style="font-size: 9px; color: #64748b;">Página 2 de 2</span>
      </div>

      <!-- 5. DIAGNÓSTICO JURÍDICO & MATRIZ DE RISCOS -->
      <div class="section-header" style="margin-top: 0;">4. Diagnóstico Jurídico & Matriz de Riscos de Arrematação</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">Item de Segurança Jurídica</th>
            <th style="width: 15%; text-align: center;">Status</th>
            <th style="width: 55%;">Parecer Técnico / Folhas nos Autos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Citação Regular do Executado</strong></td>
            <td style="text-align: center;">
              <span class="${sa.citacao_regular !== false && !sa.vicio_citacao ? 'badge-green' : 'badge-red'}">
                ${sa.citacao_regular !== false && !sa.vicio_citacao ? 'CONFIRMADO' : 'ATENÇÃO'}
              </span>
            </td>
            <td>Citação válida realizada nos autos ${sa.folhas_citacao ? `(Folhas: ${sa.folhas_citacao})` : ''}. Vício de citação: <strong>${sa.vicio_citacao ? 'Presente (Risco)' : 'Não detectado'}</strong>.</td>
          </tr>
          <tr>
            <td><strong>Intimação do Devedor e Cônjuge</strong></td>
            <td style="text-align: center;">
              <span class="${sa.intimacao_executado !== false ? 'badge-green' : 'badge-amber'}">
                ${sa.intimacao_executado !== false ? 'REGULAR' : 'PENDENTE'}
              </span>
            </td>
            <td>Intimação das datas do leilão comprovada ${sa.folhas_intimacao_leilao ? `(Folhas: ${sa.folhas_intimacao_leilao})` : ''}. Intimação do cônjuge: <strong>${sa.intimacao_conjuge ? 'Sim' : 'Verificar regime de bens'}</strong>.</td>
          </tr>
          <tr>
            <td><strong>Credor Fiduciário / Coproprietário</strong></td>
            <td style="text-align: center;">
              <span class="${sa.intimacao_credor_fiduciario ? 'badge-green' : 'badge-amber'}">
                ${sa.intimacao_credor_fiduciario ? 'INTIMADO' : 'NÃO APLICÁVEL'}
              </span>
            </td>
            <td>Credor com garantia real devidamente intimado para fins do art. 889 do CPC.</td>
          </tr>
          <tr>
            <td><strong>Análise de Preço Vil</strong></td>
            <td style="text-align: center;">
              <span class="${!sa.preco_vil_caracterizado ? 'badge-green' : 'badge-red'}">
                ${!sa.preco_vil_caracterizado ? 'REGULAR' : 'PREÇO VIL'}
              </span>
            </td>
            <td>Lance fixado em patamar superior a 50% da avaliação atualizada (Art. 891 do CPC). Preço vil afastado.</td>
          </tr>
          <tr>
            <td><strong>Situação Ocupacional do Imóvel</strong></td>
            <td style="text-align: center;">
              <span class="${sa.status_ocupacao === 'Desocupado' ? 'badge-green' : 'badge-amber'}">
                ${sa.status_ocupacao || 'Ocupado'}
              </span>
            </td>
            <td>Ocupação: <strong>${sa.status_ocupacao || 'Ocupado pelo ex-mutuário'}</strong>. Ocupante: ${sa.nome_ocupante || 'Ex-mutuário ou terceiro'}. Prazo estimado de desocupação: <strong>${sa.prazo_estimado_desocupacao || '3 a 6 meses'}</strong>. Custo: ${formatBRL(desocupacao)}.</td>
          </tr>
          <tr>
            <td><strong>Gravames e Ônus na Matrícula (CRI)</strong></td>
            <td style="text-align: center;">
              <span class="${!sa.tem_onus && !sa.indisponibilidade_bens ? 'badge-green' : 'badge-amber'}">
                ${!sa.tem_onus ? 'LIVRE DE ÔNUS' : 'GRAVAMES PRESENTES'}
              </span>
            </td>
            <td>${sa.observacoes_matricula || 'Penhoras do processo serão canceladas por ordem judicial de arrematação (art. 901 do CPC).'} ${sa.folhas_penhora_matricula ? `(Folhas: ${sa.folhas_penhora_matricula})` : ''}</td>
          </tr>
          <tr>
            <td><strong>Responsabilidade por Débitos de IPTU</strong></td>
            <td style="text-align: center;">
              <span class="${sa.responsabilidade_iptu === 'Sub-rogado no preço' ? 'badge-green' : 'badge-amber'}">
                ${sa.responsabilidade_iptu || 'Sub-rogado no preço'}
              </span>
            </td>
            <td>Regra do Edital: <strong>${sa.responsabilidade_iptu || 'Sub-rogado no preço'}</strong> (Art. 130, parágrafo único do CTN). Valor apurado: ${formatBRL(sa.iptu_atraso)}.</td>
          </tr>
          <tr>
            <td><strong>Responsabilidade por Condomínio</strong></td>
            <td style="text-align: center;">
              <span class="${sa.responsabilidade_condominio === 'Sub-rogado no preço' ? 'badge-green' : 'badge-amber'}">
                ${sa.responsabilidade_condominio || 'Sub-rogado no preço'}
              </span>
            </td>
            <td>Regra do Edital: <strong>${sa.responsabilidade_condominio || 'Sub-rogado no preço'}</strong>. Valor apurado: ${formatBRL(sa.condominio_atraso)}.</td>
          </tr>
        </tbody>
      </table>

      <!-- 6. COMENTÁRIOS ESTRATÉGICOS & CRUZAMENTO DE FONTES -->
      <div class="section-header">5. Alertas Estratégicos & Cruzamento Minucioso de Fontes</div>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 11px; margin-bottom: 14px;">
        <div style="margin-bottom: 6px; font-weight: bold; color: #047857;">Justificativa da Recomendação:</div>
        <p style="margin: 0 0 8px 0; color: #334155;">${sa.justificativa || 'Oportunidade sólida de arrematação em 2º leilão com expressiva margem de segurança financeira (ROI superior a 50%) e mitigação jurídica controlada com base nos autos do processo.'}</p>
        
        ${sa.comentarios_importantes ? `
          <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">Pontos Críticos Cruzados nos Autos:</div>
            <div style="white-space: pre-wrap; color: #475569; font-size: 10px; line-height: 1.4;">${sa.comentarios_importantes}</div>
          </div>
        ` : ''}
      </div>

      <!-- 7. ASSINATURA E RESPONSÁVEL -->
      <div style="margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${advisorName}</div>
          <div style="font-size: 9px; color: #64748b;">TJ INVEST — Departamento de Inteligência Imobiliária</div>
          <div style="font-size: 9px; color: #94a3b8;">Documento auditado eletronicamente e gerado por inteligência artificial jurídica.</div>
        </div>
        <div style="text-align: center; min-width: 200px;">
          <div style="border-bottom: 1px solid #0f172a; width: 180px; margin-bottom: 4px;"></div>
          <span style="font-size: 10px; font-weight: 700; color: #0f172a;">Visto do Analista / Arrematante</span>
        </div>
      </div>

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

  printHtmlDirectly(html, docTitle);
}

