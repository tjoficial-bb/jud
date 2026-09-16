let pdfjsPromise: Promise<any> | null = null;

export function loadPdfJs(): Promise<any> {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    // Load PDF.js main script
    try {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        try {
          const pdfjsLib = (window as any).pdfjsLib;
          if (pdfjsLib?.GlobalWorkerOptions) {
            try {
              // Use in-origin blob worker to avoid cross-origin Worker SecurityError in iframes
              const workerBlob = new Blob([
                `importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');`
              ], { type: 'application/javascript' });
              pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
            } catch {
              pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            }
          }
          console.log("[PDFJS Client] PDF.js carregado com sucesso.");
          resolve(pdfjsLib);
        } catch (err) {
          console.warn("[PDFJS Client] Aviso na configuração do worker:", err);
          resolve((window as any).pdfjsLib || null);
        }
      };
      script.onerror = (err) => {
        pdfjsPromise = null; // Reset on error
        console.warn("[PDFJS Client] Falha ao carregar script do PDF.js via CDN (usando extração servidor):", err);
        resolve(null);
      };
      document.head.appendChild(script);
    } catch (e) {
      resolve(null);
    }
  });

  return pdfjsPromise;
}

export async function extractTextFromPdfClientSide(
  file: File,
  onProgress?: (progress: number, currentPage: number, totalPages: number) => void
): Promise<string> {
  // Fast safety timeout: never let client-side extraction hang the upload (max 3 seconds)
  const extractionPromise = (async () => {
    try {
      const pdfjsLib = await loadPdfJs();
      if (!pdfjsLib) {
        return "";
      }
      const arrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      
      let isPasswordProtected = false;
      loadingTask.onPassword = (updatePassword: any, reason: number) => {
        isPasswordProtected = true;
        console.warn("[PDFjs client-side] Senha requerida pelo PDF");
        updatePassword(""); // signal empty/invalid to trigger PasswordException
      };

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = "";

      // Extract up to 30 pages in browser quickly
      const maxPagesToRead = Math.min(numPages, 30);

      for (let i = 1; i <= maxPagesToRead; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += pageText + "\n";
        } catch (pageErr) {
          console.warn(`Erro ao extrair página ${i} do PDF:`, pageErr);
        }
        
        if (onProgress) {
          onProgress(Math.round((i / numPages) * 100), i, numPages);
        }
      }

      return fullText;
    } catch (err: any) {
      const errorName = err?.name || err?.constructor?.name || '';
      const errorMessage = err?.message || String(err);
      
      if (errorName === 'PasswordException' || errorMessage.includes('password') || errorMessage.includes('Password') || errorMessage.includes('senha') || errorMessage.includes('Senha')) {
        throw new Error("Este PDF está protegido por senha. Por favor, remova a proteção de senha antes de enviar para análise.");
      }
      
      console.warn(`[PDFjs client-side] Extração local opcional ignorada (${errorName}): ${errorMessage}`);
      return "";
    }
  })();

  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve("");
    }, 3000);
  });

  return Promise.race([extractionPromise, timeoutPromise]);
}
