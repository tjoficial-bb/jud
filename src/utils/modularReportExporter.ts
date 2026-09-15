/**
 * Universal Modular Report Exporter
 * Provides rich Word (.doc) formatting with native tables, styled callout cards, 
 * clean clipboard copying (formatted Markdown/text), reliable printing, and share links.
 */

export interface ExportSectionItem {
  id: string;
  title: string;
  html?: string;
  text?: string;
  selected?: boolean;
}

export interface ModularExportPayload {
  reportTitle: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  sections: ExportSectionItem[];
  generatedAt?: string;
}

/**
 * Parses markdown report text into discrete selectable sections
 */
export function parseMarkdownToSections(markdownText?: string | null): ExportSectionItem[] {
  if (!markdownText || !markdownText.trim()) {
    return [];
  }

  const lines = markdownText.split('\n');
  const sections: ExportSectionItem[] = [];
  let currentTitle = 'Resumo Geral da Análise';
  let currentLines: string[] = [];
  let sectionIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);

    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({
          id: `sec-${sectionIndex++}`,
          title: currentTitle,
          text: currentLines.join('\n').trim(),
          selected: true
        });
        currentLines = [];
      }
      currentTitle = headingMatch[1].replace(/[*_~`]/g, '').trim();
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || sections.length === 0) {
    sections.push({
      id: `sec-${sectionIndex++}`,
      title: currentTitle,
      text: currentLines.join('\n').trim(),
      selected: true
    });
  }

  return sections;
}

/**
 * Intelligent parser that transforms plain text / structured lines into rich Word & HTML formatting
 */
export function convertTextToFormattedHtml(rawText?: string): string {
  if (!rawText || !rawText.trim()) {
    return '<p style="font-style: italic; color: #64748b; margin: 6px 0;">Nenhum detalhe informado nesta seção.</p>';
  }

  const text = rawText.trim();

  // If text already looks like full HTML markup
  if (text.startsWith('<div') || text.startsWith('<table') || text.startsWith('<p') || text.includes('</div>')) {
    return text;
  }

  const lines = text.split('\n');
  let html = '';
  let inList = false;
  let inCard = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      continue;
    }

    // Detect section headers with emojis or uppercase headers
    if (line.startsWith('📊') || line.startsWith('📜') || line.startsWith('⚠️') || line.startsWith('🚪') || line.startsWith('🛡️') || line.startsWith('🏗️') || line.startsWith('📋') || line.startsWith('🔨') || line.startsWith('💰') || line.startsWith('⚖️') || line.startsWith('📑')) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inCard) { html += '</div>'; inCard = false; }

      let headerBg = '#f8fafc';
      let headerBorder = '#047857';
      let headerColor = '#047857';

      if (line.includes('ÔNUS') || line.includes('PENHORA') || line.includes('RISCO') || line.includes('⚠️')) {
        headerBg = '#fef2f2';
        headerBorder = '#dc2626';
        headerColor = '#991b1b';
      } else if (line.includes('INDICADORES') || line.includes('PARECER') || line.includes('GERAL')) {
        headerBg = '#f0fdf4';
        headerBorder = '#16a34a';
        headerColor = '#166534';
      }

      html += `
        <div style="background-color: ${headerBg}; border: 1px solid #cbd5e1; border-left: 4px solid ${headerBorder}; padding: 8px 12px; margin: 12px 0 8px 0; border-radius: 4px;">
          <strong style="color: ${headerColor}; font-size: 11pt; text-transform: uppercase;">${escapeHtml(line)}</strong>
        </div>
      `;
      continue;
    }

    // Detect sub-cards for Acts: [Ato X], [Ônus X], [Peça X], [Item X]
    if (line.startsWith('[Ato ') || line.startsWith('[Ônus ') || line.startsWith('[Peça ') || line.startsWith('[Ação ') || line.startsWith('[Processo ')) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inCard) { html += '</div>'; inCard = false; }

      const isWarning = line.toLowerCase().includes('ônus') || line.toLowerCase().includes('penhora') || line.toLowerCase().includes('hipoteca') || line.toLowerCase().includes('indisponibilidade');
      const cardBg = isWarning ? '#fffbeb' : '#f8fafc';
      const borderLeft = isWarning ? '#d97706' : '#047857';
      const titleColor = isWarning ? '#92400e' : '#047857';

      inCard = true;
      html += `
        <div style="background-color: ${cardBg}; border: 1px solid #e2e8f0; border-left: 4px solid ${borderLeft}; padding: 10px 14px; margin: 10px 0; border-radius: 4px;">
          <div style="font-weight: bold; color: ${titleColor}; font-size: 10.5pt; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${escapeHtml(line)}
          </div>
      `;
      continue;
    }

    // Detect bullet points (• or -)
    if (line.startsWith('•') || line.startsWith('-')) {
      const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
      
      // Parse key-value structure e.g. "Chave: Valor"
      const colonIdx = cleanLine.indexOf(':');
      if (colonIdx > 0 && colonIdx < 50) {
        const key = cleanLine.substring(0, colonIdx).trim();
        const val = cleanLine.substring(colonIdx + 1).trim();

        let valFormatted = escapeHtml(val);
        // Highlight specific words (e.g. Ativa, Cancelada, Sim, Não, Risco)
        if (val.toLowerCase().includes('ativa') || val.toLowerCase().includes('alto')) {
          valFormatted = `<span style="background-color: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 3px; font-weight: bold;">${valFormatted}</span>`;
        } else if (val.toLowerCase().includes('cancelad') || val.toLowerCase().includes('regular') || val.toLowerCase().includes('baixo') || val.toLowerCase().includes('aprovado')) {
          valFormatted = `<span style="background-color: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 3px; font-weight: bold;">${valFormatted}</span>`;
        }

        html += `
          <div style="margin: 4px 0 4px 8px; font-size: 10pt; line-height: 1.5; color: #1e293b;">
            <strong style="color: #334155;">• ${escapeHtml(key)}:</strong> ${valFormatted}
          </div>
        `;
      } else {
        html += `
          <div style="margin: 4px 0 4px 8px; font-size: 10pt; line-height: 1.5; color: #1e293b;">
            • ${escapeHtml(cleanLine)}
          </div>
        `;
      }
      continue;
    }

    // Standard paragraph or statement
    if (line.startsWith('---') || line.startsWith('===') || line.startsWith('━━━')) {
      html += '<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 12px 0;" />';
    } else {
      html += `<p style="margin: 6px 0; font-size: 10pt; color: #334155; line-height: 1.5;">${escapeHtml(line)}</p>`;
    }
  }

  if (inList) html += '</ul>';
  if (inCard) html += '</div>';

  return html;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Copies selected sections formatted as clean Markdown / Plain text
 */
export async function copyModularSectionsToClipboard(payload: ModularExportPayload): Promise<boolean> {
  const dateStr = payload.generatedAt || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  let formattedText = `=====================================================\n`;
  formattedText += `📑 ${payload.reportTitle.toUpperCase()}\n`;
  if (payload.propertyTitle) formattedText += `🏢 Imóvel: ${payload.propertyTitle}\n`;
  if (payload.propertyAddress) formattedText += `📍 Endereço: ${payload.propertyAddress}${payload.propertyCity ? ` - ${payload.propertyCity}` : ''}\n`;
  formattedText += `📅 Emitido em: ${dateStr}\n`;
  formattedText += `⚖️ TJ INVEST - Inteligência em Leilões Imobiliários\n`;
  formattedText += `=====================================================\n\n`;

  const selectedSections = payload.sections.filter(s => s.selected !== false);
  if (selectedSections.length === 0) {
    throw new Error("Nenhuma seção foi selecionada para cópia.");
  }

  selectedSections.forEach((sec, idx) => {
    formattedText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    formattedText += `📌 ${idx + 1}. ${sec.title.toUpperCase()}\n`;
    formattedText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    formattedText += `${sec.text?.trim() || 'Nenhuma informação detalhada registrada nesta seção.'}\n\n`;
  });

  formattedText += `\n-----------------------------------------------------\n`;
  formattedText += `* Relatório confidencial gerado pela plataforma TJ INVEST.\n`;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(formattedText);
      return true;
    }
  } catch (err) {
    console.warn("Clipboard API falhou, tentando fallback com textarea...", err);
  }

  // Fallback using textarea element
  const textArea = document.createElement("textarea");
  textArea.value = formattedText;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);
  return successful;
}

/**
 * Downloads selected sections as a Word document (.doc), Markdown (.md), or Plain text (.txt)
 */
export function downloadModularSections(payload: ModularExportPayload, format: 'doc' | 'md' | 'txt' = 'doc'): void {
  const selectedSections = payload.sections.filter(s => s.selected !== false);
  if (selectedSections.length === 0) {
    throw new Error("Nenhuma seção selecionada para download.");
  }

  const safeFileName = `${(payload.propertyTitle || payload.reportTitle || 'relatorio')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .substring(0, 40)}_${Date.now()}`;

  if (format === 'doc') {
    // Generate clean Word-compatible HTML document with typography and structured blocks
    const dateStr = payload.generatedAt || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let htmlBody = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${payload.reportTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            margin: 20mm 15mm 20mm 15mm;
            size: A4 portrait;
          }
          body { 
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; 
            font-size: 11pt; 
            color: #1e293b; 
            line-height: 1.5; 
            padding: 10px; 
            background: #ffffff;
          }
          .doc-header {
            border-bottom: 3px solid #047857;
            padding-bottom: 10px;
            margin-bottom: 16px;
          }
          .doc-title {
            color: #047857;
            font-size: 20pt;
            font-weight: bold;
            margin: 0 0 4px 0;
          }
          .doc-subtitle {
            color: #475569;
            font-size: 11pt;
            font-weight: 600;
            margin: 0;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            margin-bottom: 24px;
            border-radius: 6px;
          }
          .meta-table td {
            padding: 8px 12px;
            font-size: 10pt;
            color: #334155;
            border: 1px solid #e2e8f0;
          }
          .section-block { 
            margin-bottom: 24px; 
            page-break-inside: avoid;
          }
          .section-heading { 
            color: #0f172a; 
            font-size: 13pt; 
            font-weight: bold;
            margin-top: 20px; 
            margin-bottom: 10px; 
            border-bottom: 1.5px solid #cbd5e1; 
            padding-bottom: 4px; 
            background-color: #f1f5f9;
            padding: 6px 10px;
            border-left: 4px solid #047857;
          }
          .footer-note { 
            font-size: 8.5pt; 
            color: #94a3b8; 
            text-align: center; 
            border-top: 1px solid #e2e8f0; 
            margin-top: 40px; 
            padding-top: 10px; 
          }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
          th { background-color: #f1f5f9; text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; }
          td { padding: 6px 10px; border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <table width="100%" style="border: 0; margin: 0;">
            <tr style="border: 0;">
              <td style="border: 0; padding: 0; vertical-align: bottom;">
                <div class="doc-title">${payload.reportTitle}</div>
                <div class="doc-subtitle">TJ INVEST - Inteligência & Análise de Leilões Imobiliários</div>
              </td>
              <td style="border: 0; padding: 0; text-align: right; vertical-align: bottom; font-size: 9pt; color: #64748b;">
                <div><strong>Data:</strong> ${dateStr}</div>
                <div><strong>Ref:</strong> ${payload.propertyTitle || 'Imóvel'}</div>
              </td>
            </tr>
          </table>
        </div>

        <table class="meta-table">
          <tr>
            <td width="50%"><strong>🏢 Imóvel:</strong> ${payload.propertyTitle || 'Não especificado'}</td>
            <td width="50%"><strong>📅 Emissão:</strong> ${dateStr}</td>
          </tr>
          ${payload.propertyAddress ? `
          <tr>
            <td colspan="2"><strong>📍 Localização:</strong> ${payload.propertyAddress}${payload.propertyCity ? ` - ${payload.propertyCity}` : ''}</td>
          </tr>
          ` : ''}
        </table>
    `;

    selectedSections.forEach((sec, idx) => {
      const sectionHtml = sec.html ? sec.html : convertTextToFormattedHtml(sec.text);

      htmlBody += `
        <div class="section-block">
          <div class="section-heading">${idx + 1}. ${sec.title}</div>
          <div style="padding: 4px 2px;">
            ${sectionHtml}
          </div>
        </div>
      `;
    });

    htmlBody += `
        <div class="footer-note">
          Relatório confidencial elaborado exclusivamente para tomada de decisão em leilões judiciais e extrajudiciais.<br/>
          TJ INVEST &copy; ${new Date().getFullYear()} - Todos os direitos reservados.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlBody], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Markdown or TXT
    let content = `# ${payload.reportTitle}\n\n`;
    if (payload.propertyTitle) content += `**Imóvel:** ${payload.propertyTitle}\n`;
    if (payload.propertyAddress) content += `**Localização:** ${payload.propertyAddress}${payload.propertyCity ? ` - ${payload.propertyCity}` : ''}\n`;
    content += `**Data de Emissão:** ${payload.generatedAt || new Date().toLocaleDateString('pt-BR')}\n\n---\n\n`;

    selectedSections.forEach((sec, idx) => {
      content += `## ${idx + 1}. ${sec.title}\n\n`;
      content += `${sec.text?.trim() || 'Nenhum detalhe disponível.'}\n\n---\n\n`;
    });

    const extension = format === 'md' ? 'md' : 'txt';
    const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob(['\ufeff', content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Universal print handler that bypasses iframe restrictions using a hidden iframe
 */
export function printModularSections(payload: ModularExportPayload): void {
  const selectedSections = payload.sections.filter(s => s.selected !== false);
  if (selectedSections.length === 0) {
    throw new Error("Nenhuma seção selecionada para impressão.");
  }

  const dateStr = payload.generatedAt || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>${payload.reportTitle}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 12mm 15mm 12mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          line-height: 1.5;
          font-size: 11pt;
          margin: 0;
          padding: 20px;
        }
        header {
          border-bottom: 2px solid #047857;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header-title {
          font-size: 18pt;
          font-weight: 800;
          color: #047857;
          margin: 0 0 4px 0;
        }
        .header-subtitle {
          font-size: 11pt;
          font-weight: 600;
          color: #334155;
          margin: 0;
        }
        .header-meta {
          text-align: right;
          font-size: 9pt;
          color: #64748b;
        }
        .prop-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }
        .section-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 18px;
          background: #ffffff;
          break-inside: avoid;
        }
        .section-title {
          font-size: 13pt;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 12px 0;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
        th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 700; }
        td { padding: 6px 8px; border: 1px solid #cbd5e1; }
        footer {
          margin-top: 30px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 8pt;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <header>
        <div>
          <h1 class="header-title">${payload.reportTitle}</h1>
          <p class="header-subtitle">${payload.propertyTitle || 'Relatório Analítico de Leilão'}</p>
        </div>
        <div class="header-meta">
          <div>TJ INVEST LEILÕES</div>
          <div>Emitido em: ${dateStr}</div>
        </div>
      </header>

      ${payload.propertyAddress ? `
        <div class="prop-box">
          <div style="font-size: 8pt; font-weight: 700; color: #047857; text-transform: uppercase;">Localização & Cadastro</div>
          <div style="font-size: 10pt; font-weight: 600; color: #1e293b; margin-top: 2px;">${payload.propertyAddress}${payload.propertyCity ? ` - ${payload.propertyCity}` : ''}</div>
        </div>
      ` : ''}

      <main>
        ${selectedSections.map((sec, idx) => `
          <div class="section-card">
            <h2 class="section-title">
              <span>${idx + 1}.</span>
              <span>${sec.title}</span>
            </h2>
            <div class="section-content">
              ${sec.html ? sec.html : convertTextToFormattedHtml(sec.text)}
            </div>
          </div>
        `).join('')}
      </main>

      <footer>
        Relatório Estratégico gerado confidencialmente pelo Sistema TJ INVEST - Inteligência em Leilões Imobiliários.
      </footer>
    </body>
    </html>
  `;

  // Use hidden iframe to guarantee printing in all environments
  let printIframe = document.getElementById('__report_print_frame__') as HTMLIFrameElement;
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = '__report_print_frame__';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(printDocumentHtml);
    iframeDoc.close();

    setTimeout(() => {
      try {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      } catch (e) {
        console.warn("Falha no print iframe, fallback window.print()", e);
        window.print();
      }
    }, 400);
  } else {
    window.print();
  }
}
