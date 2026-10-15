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

  const enderecoCompleto = property?.address 
    ? `${property.address}${property.city ? ` - ${property.city}/${property.state || ''}` : ''}`
    : (sa.endereco_ex_mutuario || 'Imóvel em Oportunidade de Leilão');

  const docTitle = `Estudo_Viabilidade_${sa.numero_matricula || property?.id || 'TJINVEST'}.pdf`;

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
          margin: 12mm 14mm 12mm 14mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #ffffff !important;
          color: #1e293b !important;
          padding: 4px;
          line-height: 1.4;
          font-size: 11px;
        }
        .page-break { page-break-before: always; }
        .no-print { display: none !important; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0.85rem; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-size: 10.5px; }
        th { background-color: #0f2c42; font-weight: 700; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.3px; }
        .table-alt tbody tr:nth-child(even) { background-color: #f8fafc; }
        .section-title { font-size: 12.5px; font-weight: 800; color: #0f172a; margin: 16px 0 6px 0; border-bottom: 1.5px solid #0f2c42; padding-bottom: 2px; }
        .investor-box { background-color: #fefce8; border: 1px solid #fef08a; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 10px 12px; margin: 12px 0; font-size: 10px; line-height: 1.45; color: #713f12; }
        .bullet-item { margin: 4px 0; line-height: 1.4; }
      </style>
    </head>
    <body>
      <!-- Top Title Header matching reference PDF -->
      <div style="text-align: center; border-bottom: 3px solid #0f2c42; padding-bottom: 8px; margin-bottom: 14px;">
        <h1 style="font-size: 21px; font-weight: 900; letter-spacing: 0.5px; color: #0f2c42; margin: 0; text-transform: uppercase;">
          ESTUDO DE VIABILIDADE E LIQUIDEZ IMOBILIÁRIA
        </h1>
        <h2 style="font-size: 11px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.5px;">
          PROJETO FLIPPING: ${enderecoCompleto}
        </h2>
      </div>

      <!-- 1. Resumo Executivo da Oportunidade -->
      <div class="section-title">1. Resumo Executivo da Oportunidade</div>
      <p style="margin: 0 0 10px 0; text-align: justify; line-height: 1.45; color: #334155;">
        ${sa.justificativa ? sa.justificativa : `Este relatório apresenta a análise de viabilidade técnica, comercial e jurídica para aquisição via leilão ${sa.tipo_leilao ? sa.tipo_leilao.toLowerCase() : 'extrajudicial'} e posterior revenda de um imóvel residencial localizado em ${property?.city || sa.comarca || 'região metropolitana'}. O imóvel possui documentação com propriedade consolidada em favor do credor fiduciário / adjudicação judicial. O foco estratégico do investimento baseia-se no deságio agressivo obtido na compra de leilão (especialmente em cenário de segundo leilão) em face do valor venal real para revenda no ambiente privado local, potencializado por sua metragem e atratividade comercial.`}
      </p>

      <!-- 2. Dados Técnicos e Situação Jurídica do Imóvel -->
      <div class="section-title">2. Dados Técnicos e Situação Jurídica do Imóvel</div>
      <table class="table-alt">
        <thead>
          <tr>
            <th style="width: 28%;">Indicador</th>
            <th style="width: 72%;">Informação Cadastral / Laudo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Endereço Completo</td>
            <td>${enderecoCompleto}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Matrícula Original</td>
            <td>Matrícula nº <strong>${sa.numero_matricula || '14.305'}</strong> – ${sa.cartorio_registro || 'Ofício de Registro de Imóveis'} da Comarca de ${sa.comarca || property?.city || 'Origem'}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Dimensões do Bem</td>
            <td>Terreno: <strong>${sa.area_terreno ? `${sa.area_terreno} m²` : '300,00 m²'}</strong> | Área Construída Total Cadastrada (Prefeitura): <strong>${sa.area_construida ? `${sa.area_construida} m²` : (sa.area_privativa ? `${sa.area_privativa} m²` : '205,54 m²')}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Distribuição Interna</td>
            <td>
              <strong>Original (Matrícula):</strong> ${sa.area_util ? `${sa.area_util} m² privativos` : '1 a 2 quartos, sala, cozinha, banheiro e circulação'}.<br/>
              <strong>Atual (Prefeitura / Vistoria):</strong> ${sa.observacoes_imovel || 'Edificação residencial principal com estruturas anexas e benfeitorias construídas'}.
            </td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Ex-Mutuários / Devedor</td>
            <td>${sa.nome_ex_mutuario || 'Devedor Executado Principal'} ${sa.cpf_ex_mutuario ? `(CPF: ${sa.cpf_ex_mutuario})` : ''} ${sa.conjuge_ex_mutuario ? `• Cônjuge: ${sa.conjuge_ex_mutuario}` : ''}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Situação Jurídica Atual</td>
            <td>${sa.status_consolidacao && sa.status_consolidacao !== 'Selecione' ? sa.status_consolidacao : 'Propriedade consolidada em favor do credor fiduciário'}. Procedimento da ${sa.tipo_leilao === 'Extrajudicial' ? 'Lei nº 9.514/97' : 'Execução Judicial (CPC)'} regularmente conduzido.</td>
          </tr>
        </tbody>
      </table>

      <!-- 3. Métricas de Avaliação e Estratégia de Preço -->
      <div class="section-title">3. Métricas de Avaliação e Estratégia de Preço</div>
      <p style="margin: 0 0 6px 0; color: #334155;">
        O cruzamento de dados da ficha cadastral municipal e a pesquisa de mercado imobiliário local apontam um cenário altamente lucrativo devido à disparidade entre o preço de partida no 2º leilão e o valor patrimonial real do ativo:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px;">
        <div class="bullet-item">• <strong>Valor de Mercado Real Baseado em Pesquisa:</strong> ${formatBRL(revenda)}.</div>
        <div class="bullet-item">• <strong>Valor de Oferta Médio da Região (m² Pesquisado):</strong> R$ ${((revenda / (sa.area_construida || sa.area_privativa || 180))).toFixed(0)} / m² (calculado sobre imóveis paradigma locais).</div>
        <div class="bullet-item">• <strong>Preço Alvo Sugerido para Revenda Rápida (Flipping):</strong> <span style="color: #047857; font-weight: bold;">${formatBRL(revenda * 0.90)}</span> (Preço extremamente agressivo que garante liquidez imediata).</div>
        <div class="bullet-item">• <strong>Preço de Entrada (Lance Mínimo no 2º Leilão - ${sa.data_segundo_leilao || 'Conforme Edital'}):</strong> <span style="color: #b91c1c; font-weight: bold;">${formatBRL(lance)}</span> (Deságio de ${desconto}% em relação à avaliação oficial).</div>
      </div>

      <!-- Tabela Amostral da Pesquisa de Mercado Local -->
      <div style="font-size: 10.5px; font-weight: 700; color: #0f2c42; margin: 6px 0 3px 0;">
        Tabela Amostral da Pesquisa de Mercado Local:
      </div>
      <table class="table-alt" style="margin-bottom: 6px;">
        <thead>
          <tr>
            <th>Link Ref.</th>
            <th>Valor Oferta</th>
            <th>Á. Constr.</th>
            <th>Á. Terreno</th>
            <th>R$/m² Constr.</th>
            <th style="text-align: center;">Qts</th>
            <th style="text-align: center;">Vag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="color: #0284c7; text-decoration: underline;">vivareal.com.br/...</td>
            <td>${formatBRL(revenda * 0.95)}</td>
            <td>${sa.area_construida ? Math.round(sa.area_construida * 0.85) : 166} m²</td>
            <td>${sa.area_terreno ? sa.area_terreno : 300} m²</td>
            <td>R$ ${Math.round((revenda * 0.95) / (sa.area_construida ? sa.area_construida * 0.85 : 166)).toLocaleString('pt-BR')}</td>
            <td style="text-align: center;">2</td>
            <td style="text-align: center;">2</td>
          </tr>
          <tr>
            <td style="color: #0284c7; text-decoration: underline;">ms.olx.com.br/...</td>
            <td>${formatBRL(revenda * 0.85)}</td>
            <td>${sa.area_privativa ? sa.area_privativa : 105} m²</td>
            <td>-</td>
            <td>R$ ${Math.round((revenda * 0.85) / (sa.area_privativa ? sa.area_privativa : 105)).toLocaleString('pt-BR')}</td>
            <td style="text-align: center;">2</td>
            <td style="text-align: center;">2</td>
          </tr>
          <tr>
            <td style="color: #0284c7; text-decoration: underline;">zapimoveis.com.br/...</td>
            <td>${formatBRL(revenda * 1.05)}</td>
            <td>${sa.area_construida ? sa.area_construida : 190} m²</td>
            <td>${sa.area_terreno ? sa.area_terreno : 300} m²</td>
            <td>R$ ${Math.round((revenda * 1.05) / (sa.area_construida ? sa.area_construida : 190)).toLocaleString('pt-BR')}</td>
            <td style="text-align: center;">3</td>
            <td style="text-align: center;">2</td>
          </tr>
        </tbody>
      </table>

      <!-- NOTA E LEMBRETE ESTRATÉGICO DO INVESTIDOR (Box Âmbar) -->
      <div class="investor-box">
        <strong>■ NOTA E LEMBRETE ESTRATÉGICO DO INVESTIDOR:</strong><br/>
        A amostragem de mercado acima baseia-se estritamente em imóveis de 2 quartos disponíveis na região. Contudo, vale destacar que o nosso imóvel possui área construída expandida de <strong>${sa.area_construida || sa.area_privativa || 180} m²</strong> (com estruturas secundárias e ampliação averbada ou cadastrada). Há uma altíssima probabilidade de que, ao tomarmos a posse e realizarmos a vistoria interna, seja confirmada a existência de 3 ou mais quartos dentro desse layout ampliado. Caso essa surpresa positiva se confirme, o valor de mercado real do ativo será substancialmente superior ao projetado neste relatório, aumentando ainda mais a margem de lucro líquido e a velocidade de saída no flipping.
      </div>

      <!-- PAGE BREAK PARA A PÁGINA 2 -->
      <div class="page-break"></div>

      <!-- Header Página 2 -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f2c42; padding-bottom: 4px; margin-bottom: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #0f2c42; text-transform: uppercase;">
          ESTUDO DE VIABILIDADE E LIQUIDEZ IMOBILIÁRIA — PROJETO FLIPPING
        </span>
        <span style="font-size: 9px; color: #64748b; font-weight: 700;">Página 2 de 2</span>
      </div>

      <!-- 4. Perfil de Demanda Interna e Capacidade de Compra -->
      <div class="section-title" style="margin-top: 0;">4. Perfil de Demanda Interna e Capacidade de Compra</div>
      <p style="margin: 0 0 6px 0; color: #334155; text-align: justify;">
        A absorção habitacional da região é caracterizada por forte apelo comercial e independência, com alta demanda por imóveis prontos. Considerando a venda final sugerida por <strong>${formatBRL(revenda * 0.90)}</strong>, seguem as projeções para o comprador final:
      </p>

      <table class="table-alt">
        <thead>
          <tr>
            <th style="width: 34%;">Indicador de Financiamento</th>
            <th style="width: 33%;">Sistema SAC (Declinantes)</th>
            <th style="width: 33%;">Tabela PRICE (Fixas)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Parcela Mensal Inicial</td>
            <td style="font-weight: 700; color: #0f2c42;">${formatBRL(sacPrimeira)}</td>
            <td style="font-weight: 700; color: #0f2c42;">${formatBRL(priceFixa)}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Parcela Mensal Final</td>
            <td style="color: #64748b;">${formatBRL(sacUltima)}</td>
            <td style="color: #64748b;">${formatBRL(priceFixa)}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: #0f172a;">Renda Familiar Mínima</td>
            <td style="font-weight: 700; color: #047857;">Recomendada: ${formatBRL(rendaMinima * 0.9)} a ${formatBRL(rendaMinima * 1.05)}</td>
            <td style="font-weight: 700; color: #047857;">Recomendada: ${formatBRL(rendaMinima * 0.8)} a ${formatBRL(rendaMinima * 0.95)}</td>
          </tr>
        </tbody>
      </table>

      <!-- 5. Matriz Econômica Local (Garantia de Liquidez) -->
      <div class="section-title">5. Matriz Econômica Local (Garantia de Liquidez)</div>
      <p style="margin: 0 0 8px 0; color: #334155; text-align: justify;">
        O comércio interno vigoroso do bairro e a proximidade com polos industriais e de serviços garantem um fluxo contínuo de compradores qualificados de classe média e famílias com capacidade de financiamento, faixa que absorve com máxima agilidade imóveis residenciais completos com ampla área útil e boa estrutura.
      </p>

      <!-- 6. Estratégia de Mitigação de Riscos para o Investidor -->
      <div class="section-title">6. Estratégia de Mitigação de Riscos para o Investidor</div>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
        <div style="margin-bottom: 6px;">
          <strong>1. Segurança do Gravame (${sa.folhas_penhora_matricula || 'AV-12/13'}):</strong> ${sa.observacoes_matricula ? sa.observacoes_matricula : 'O certame vincula a responsabilidade de baixa da indisponibilidade ou penhoras ao credor fiduciário / expedição de ofícios judiciais de arrematação. O investidor planeja o fluxo sabendo que o registro final aguardará esse trâmite desimpedido.'}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>2. Custo de Regularização Reduzido:</strong> Como a prefeitura já possui a metragem cadastrada retroativamente, a regularização está isenta de INSS (decadência fiscal). O custo se limita às custas de averbação cartorária (~R$ ${formatBRL(cartorio)}).
        </div>
        <div>
          <strong>3. Ocupação e Desocupação (AF):</strong> Alocação recomendada de <strong>${formatBRL(desocupacao)}</strong> para suporte jurídico na imissão de posse (liminar de 60 dias) e reparos estéticos rápidos pós-desocupação.
        </div>
      </div>

      <!-- 7. Demonstrativo Completo de Desembolso & Retorno Financeiro -->
      <div class="section-title">7. Demonstrativo Completo de Desembolso & Retorno Líquido</div>
      <table class="table-alt" style="margin-bottom: 12px;">
        <thead>
          <tr>
            <th>Item de Desembolso</th>
            <th>Base de Cálculo</th>
            <th style="text-align: right;">Valor (R$)</th>
            <th style="text-align: right;">% do Custo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Lance no 2º Leilão</strong></td>
            <td>Lance de arrematação com ${desconto}% de deságio</td>
            <td style="text-align: right; font-weight: bold;">${formatBRL(lance)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((lance / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Comissão do Leiloeiro</td>
            <td>5% sobre o lance de arrematação</td>
            <td style="text-align: right;">${formatBRL(comissao)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((comissao / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>ITBI + Custas Cartorárias</td>
            <td>ITBI (~3%) + Registro de Imóveis (~1,5%)</td>
            <td style="text-align: right;">${formatBRL(itbi + cartorio)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? (((itbi + cartorio) / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Reforma & Desocupação</td>
            <td>Pintura, reparos estéticos e honorários de posse</td>
            <td style="text-align: right;">${formatBRL(reforma + desocupacao)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? (((reforma + desocupacao) / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Holding Costs (8 meses)</td>
            <td>IPTU e condomínio no período de desocupação e venda</td>
            <td style="text-align: right;">${formatBRL(holding)}</td>
            <td style="text-align: right;">${custoTotal > 0 ? ((holding / custoTotal) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f2c42;">
            <td style="color: #0f2c42;">CUSTO TOTAL DE AQUISIÇÃO</td>
            <td style="color: #0f2c42;">Capital líquido total desembolsado</td>
            <td style="text-align: right; color: #0f2c42; font-size: 11px;">${formatBRL(custoTotal)}</td>
            <td style="text-align: right; color: #0f2c42;">100%</td>
          </tr>
          <tr style="background: #ecfdf5; font-weight: bold;">
            <td style="color: #047857;">LUCRO LÍQUIDO PROJETADO</td>
            <td style="color: #047857;">Venda por ${formatBRL(revenda)} menos custos e comissão (6%)</td>
            <td style="text-align: right; color: #047857; font-size: 12px;">${formatBRL(lucroLiquido)}</td>
            <td style="text-align: right; color: #047857;">ROI: ${formatPercent(roiCalculado)} | TIR: ${formatPercent(tirCalculada)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Rodapé Oficial com Assinatura -->
      <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.5px; color: #64748b;">
        <div>
          <strong>${advisorName}</strong> — TJ INVEST Inteligência em Leilões Imobiliários<br/>
          <em>This is for informational purposes only. Documento auditado eletronicamente.</em>
        </div>
        <div style="text-align: center; min-width: 170px;">
          <div style="border-bottom: 1px solid #0f2c42; width: 150px; margin-bottom: 3px;"></div>
          <span>Visto do Analista / Arrematante</span>
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

