import { parseJsonResponse, robustFetch } from './apiService';
import { extractTextFromPdfClientSide } from '../lib/pdfExtractor';

function uploadFileWithProgress(
  url: string,
  formData: FormData,
  token: string,
  fileName: string,
  onProgress?: (status: string) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.timeout = 180000; // 3 minutes timeout

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.round((event.loaded / event.total) * 100);
        const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
        const totalMb = (event.total / (1024 * 1024)).toFixed(1);
        if (pct < 100) {
          onProgress(`Enviando ${fileName}: ${loadedMb}MB de ${totalMb}MB (${pct}%)`);
        } else {
          onProgress(`Processando e salvando ${fileName} no servidor...`);
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (e) {
          resolve({ success: true });
        }
      } else {
        let errorMsg = `Erro ao enviar o anexo "${fileName}" (${xhr.status})`;
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData?.error) errorMsg = errData.error;
        } catch {
          if (xhr.status === 413) {
            errorMsg = `O anexo "${fileName}" excede o tamanho máximo suportado pelo servidor.`;
          } else if (xhr.status === 504 || xhr.status === 502) {
            errorMsg = `O servidor demorou para processar o anexo "${fileName}".`;
          }
        }
        const err: any = new Error(errorMsg);
        err.status = xhr.status;
        reject(err);
      }
    };

    xhr.onerror = () => {
      const err: any = new Error(`Falha de conexão ao enviar o anexo "${fileName}". Verifique sua internet.`);
      err.isNetworkError = true;
      reject(err);
    };

    xhr.ontimeout = () => {
      const err: any = new Error(`Tempo limite excedido ao enviar "${fileName}".`);
      err.isTimeout = true;
      reject(err);
    };

    xhr.send(formData);
  });
}

async function uploadSingleChunkWithRetry(
  createFormData: () => FormData,
  token: string,
  maxRetries = 4
): Promise<any> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = createFormData();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use robustFetch with abort timeout controller for resilience
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

      try {
        const res = await robustFetch('/api/documents/upload-chunk', {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal
        }, 2, 800 * attempt);

        clearTimeout(timeoutId);

        const data = await parseJsonResponse(res);
        if (!res.ok) {
          const errorMsg = data?.error || `Erro no envio de pacote (${res.status})`;
          const err: any = new Error(errorMsg);
          err.status = res.status;
          throw err;
        }

        return data;
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }
    } catch (err: any) {
      lastError = err;
      const isClientCancel = err?.name === 'AbortError' && !err?.isTimeout;
      if (isClientCancel) {
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 5000);
        console.warn(`[documentService] Tentativa ${attempt}/${maxRetries} no envio de pacote. Reenviando em ${Math.round(delay)}ms...`, err?.message);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  throw lastError || new Error("Falha na transmissão do pacote do anexo. Verifique sua conexão e tente novamente.");
}

async function uploadLargeFileInChunks(
  file: File,
  docType: string,
  propertyId: string,
  token: string,
  clientExtractedText?: string,
  onProgress?: (status: string) => void
): Promise<any[]> {
  const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5MB per chunk (optimal for all connection speeds and proxy limits)
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const totalMb = (file.size / (1024 * 1024)).toFixed(1);

  let finalResponse: any = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);

    const pct = Math.round(((chunkIndex + 1) / totalChunks) * 100);
    const sentMb = (end / (1024 * 1024)).toFixed(1);

    if (onProgress) {
      if (chunkIndex === totalChunks - 1) {
        onProgress(`Finalizando anexo "${file.name}" (${sentMb}/${totalMb}MB - 100%)...`);
      } else {
        onProgress(`Enviando "${file.name}": pacote ${chunkIndex + 1}/${totalChunks} (${sentMb}/${totalMb}MB - ${pct}%)`);
      }
    }

    const createChunkFormData = () => {
      const chunkFormData = new FormData();
      chunkFormData.append('chunk', chunkBlob, file.name);
      chunkFormData.append('uploadId', uploadId);
      chunkFormData.append('chunkIndex', String(chunkIndex));
      chunkFormData.append('totalChunks', String(totalChunks));
      chunkFormData.append('filename', file.name);
      chunkFormData.append('doc_type', docType);
      chunkFormData.append('property_id', propertyId || '');
      chunkFormData.append('mimeType', file.type || 'application/pdf');
      if (clientExtractedText && chunkIndex === 0) {
        chunkFormData.append('extracted_text', clientExtractedText);
      }
      return chunkFormData;
    };

    const resp = await uploadSingleChunkWithRetry(createChunkFormData, token);
    if (chunkIndex === totalChunks - 1) {
      finalResponse = resp;
    }
  }

  if (Array.isArray(finalResponse)) {
    return finalResponse;
  }
  return [finalResponse];
}

export async function uploadDocuments(
  files: File[], 
  docType: string, 
  propertyId: string, 
  token: string,
  onProgress?: (status: string) => void
) {
  const allResults: any[] = [];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');

  for (const file of files) {
    let clientExtractedText = "";
    
    // Only attempt client-side preview extraction for smaller PDFs (<= 12MB) with timeout protection
    if (file.name.toLowerCase().endsWith('.pdf') && file.size <= 12 * 1024 * 1024) {
      if (onProgress) {
        onProgress(`Indexando prévia de ${file.name}...`);
      }
      try {
        const timeoutPromise = new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Extraction timeout')), 5000)
        );
        const extractPromise = extractTextFromPdfClientSide(file, (pct, page, total) => {
          if (onProgress) {
            onProgress(`Indexando prévia: ${page}/${total} págs (${pct}%)`);
          }
        });

        clientExtractedText = await Promise.race([extractPromise, timeoutPromise]);
        if (clientExtractedText) {
          console.log(`[documentService] Texto extraído com sucesso de ${file.name}: ${clientExtractedText.length} caracteres.`);
        }
      } catch (err: any) {
        console.warn(`[documentService] Falha ou timeout na extração local para ${file.name}:`, err.message);
        if (err?.message && (err.message.includes('protegido por senha') || err.message.includes('senha') || err.message.toLowerCase().includes('password'))) {
          throw new Error(`O anexo "${file.name}" está protegido por senha. Remova a senha antes de anexar.`);
        }
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `O arquivo "${file.name}" possui ${(file.size / (1024 * 1024)).toFixed(1)}MB e excede o limite de 100MB.\n\n` +
        `Para arquivos maiores que 100MB, divida o arquivo em partes menores ou utilize ferramentas para compactar.`
      );
    }

    // If file is larger than 2.5MB, use chunked upload directly to completely avoid any HTTP proxy or connection resets
    if (file.size > 2.5 * 1024 * 1024) {
      const chunkResults = await uploadLargeFileInChunks(
        file,
        docType,
        propertyId,
        activeToken,
        clientExtractedText,
        onProgress
      );
      allResults.push(...chunkResults);
      continue;
    }

    if (onProgress) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      onProgress(`Iniciando envio de ${file.name} (${sizeMb}MB)...`);
    }

    const formData = new FormData();
    formData.append('files', file);
    formData.append('doc_type', docType);
    formData.append('property_id', propertyId);
    if (clientExtractedText) {
      formData.append('extracted_text', clientExtractedText);
    }

    try {
      const data = await uploadFileWithProgress(
        '/api/documents',
        formData,
        activeToken,
        file.name,
        onProgress
      );
      
      if (Array.isArray(data)) {
        allResults.push(...data);
      } else {
        allResults.push(data);
      }
    } catch (uploadErr: any) {
      // Automatic fallback to chunked upload if direct POST fails due to connection/network/proxy/timeout/413
      console.warn(`[documentService] Upload direto falhou para ${file.name}. Tentando fallback via pacotes (chunked)...`, uploadErr.message);
      if (onProgress) {
        onProgress(`Reconectando e enviando ${file.name} em pacotes seguros...`);
      }

      const chunkResults = await uploadLargeFileInChunks(
        file,
        docType,
        propertyId,
        activeToken,
        clientExtractedText,
        onProgress
      );
      allResults.push(...chunkResults);
    }
  }
  
  return allResults;
}

export async function linkDocuments(
  tempPropertyId: string, 
  propertyId: string, 
  token: string
) {
  const res = await robustFetch('/api/documents/link', {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ temp_property_id: tempPropertyId, property_id: propertyId })
  });

  if (!res.ok) {
    const errorData = await parseJsonResponse(res).catch(() => ({}));
    throw new Error(errorData.error || "Erro ao vincular documentos");
  }
  
  return await parseJsonResponse(res);
}

export async function deleteDocument(
  documentId: string, 
  token: string
) {
  const res = await robustFetch(`/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await parseJsonResponse(res).catch(() => ({}));
    throw new Error(errorData.error || "Erro ao deletar documento");
  }
  
  return await parseJsonResponse(res);
}
