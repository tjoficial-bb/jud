let pdfjsPromise: Promise<any> | null = null;

export function loadPdfJs(): Promise<any> {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    // Load PDF.js main script
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = async () => {
      const pdfjsLib = (window as any).pdfjsLib;
      try {
        // Fetch worker text and create Blob URL to bypass Same-Origin Policy for workers
        const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');
        if (!response.ok) throw new Error("Status " + response.status);
        const workerText = await response.text();
        const blob = new Blob([workerText], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log("[PDFJS Client] Worker initialized successfully using Blob URL.");
      } catch (err) {
        console.warn("[PDFJS Client] Falha ao criar worker Blob, usando URL direta:", err);
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch (e) {
          // Ignore failure
        }
      }
      resolve(pdfjsLib);
    };
    script.onerror = (err) => {
      pdfjsPromise = null; // Reset on error
      reject(err);
    };
    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

export async function extractTextFromPdfClientSide(
  file: File,
  onProgress?: (progress: number, currentPage: number, totalPages: number) => void
): Promise<string> {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    
    // Disable worker options if they cause CORS issues, but using the cloudflare cdn worker is usually highly compatible
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    // Handle password requests gracefully inside pdfjs loading task
    loadingTask.onPassword = (updatePassword: any, reason: number) => {
      console.warn("[PDFjs client-side] Senha requerida pelo PDF");
      updatePassword(""); // cancel/fail the load to trigger PasswordException
    };

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = "";

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      } catch (pageErr) {
        console.warn(`Erro ao extrair página ${i} do PDF, pulando página:`, pageErr);
      }
      
      if (onProgress) {
        onProgress(Math.round((i / numPages) * 100), i, numPages);
      }
    }

    return fullText;
  } catch (err: any) {
    const errorName = err?.name || err?.constructor?.name || '';
    const errorMessage = err?.message || String(err);
    console.warn(`[PDFjs client-side] Erro ao carregar/processar PDF: ${errorName} - ${errorMessage}`);
    
    if (errorName === 'PasswordException' || errorMessage.includes('password') || errorMessage.includes('Password') || errorMessage.includes('senha') || errorMessage.includes('Senha')) {
      throw new Error("Este PDF está protegido por senha. Por favor, remova a proteção de senha antes de enviar para análise.");
    }
    if (errorName === 'InvalidPDFException' || errorMessage.includes('Invalid PDF') || errorMessage.includes('invalid pdf') || errorMessage.includes('corrupt') || errorMessage.includes('corrompido')) {
      throw new Error("Arquivo PDF inválido ou corrompido. Certifique-se de que o download foi concluído com sucesso.");
    }
    if (errorName === 'FormatError' || errorMessage.includes('FormatError') || errorMessage.includes('format')) {
      throw new Error("Formato do PDF não reconhecido ou incompatível.");
    }
    if (errorName === 'AbortException') {
      throw new Error("O processamento do PDF foi interrompido.");
    }
    
    // Throw standard mapped error message
    throw new Error(`Erro ao extrair texto do PDF (${errorName || 'Erro do Leitor'}): ${errorMessage}`);
  }
}
