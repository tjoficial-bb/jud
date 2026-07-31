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
