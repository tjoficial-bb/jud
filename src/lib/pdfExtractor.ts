let pdfjsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
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

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;

    script.onload = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib?.GlobalWorkerOptions) {
          try {
            const workerRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');
            if (workerRes.ok) {
              const workerCode = await workerRes.text();
              const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
              pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
            } else {
              pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            }
          } catch {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
          }
          resolve(pdfjsLib);
        } else {
          resolve((window as any).pdfjsLib || null);
        }
      } catch {
        resolve(null);
      }
    };

    script.onerror = () => {
      pdfjsPromise = null; // Reset on error
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

export async function extractTextFromPdfClientSide(
  file: File,
  onProgress?: (percent: number, page: number, total: number) => void
): Promise<string> {
  let isAborted = false;

  const extractionPromise = (async () => {
    try {
      const pdfjsLib = await loadPdfJs();
      if (!pdfjsLib || isAborted) {
        return "";
      }

      const arrayBuffer = await file.arrayBuffer();
      if (isAborted) return "";

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

      loadingTask.onPassword = (updatePassword: any) => {
        console.warn("[PDFjs client-side] Senha requerida pelo PDF");
        updatePassword(""); // signal empty/invalid to trigger PasswordException
      };

      const pdf = await loadingTask.promise;
      if (isAborted) return "";

      const numPages = pdf.numPages;
      let fullText = "";

      // Extract ALL pages of the PDF (up to 500 pages) so complete judicial processes are read end-to-end
      const maxPagesToRead = Math.min(numPages, 500);

      for (let i = 1; i <= maxPagesToRead; i++) {
        if (isAborted) break;
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ")
            .trim();
          if (pageText) {
            fullText += `\n--- [Página ${i}/${numPages}] ---\n${pageText}\n`;
          } else {
            fullText += `\n--- [Página ${i}/${numPages} - Imagem/Digitalizada] ---\n`;
          }
        } catch (pageErr) {
          console.warn(`Erro ao extrair página ${i} do PDF:`, pageErr);
        }

        if (onProgress && !isAborted) {
          onProgress(Math.round((i / maxPagesToRead) * 100), i, maxPagesToRead);
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
      isAborted = true;
      resolve("");
    }, 30000);
  });

  try {
    const result = await Promise.race([extractionPromise, timeoutPromise]);
    isAborted = true;
    return result;
  } finally {
    isAborted = true;
  }
}
