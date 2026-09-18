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
            errorMsg = `O anexo "${fileName}" excede o tamanho máximo suportado (100MB).`;
          } else if (xhr.status === 504 || xhr.status === 502) {
            errorMsg = `O servidor demorou para processar o anexo "${fileName}". Tente novamente.`;
          }
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`Falha de conexão ao enviar o anexo "${fileName}". Verifique sua internet.`));
    };

    xhr.ontimeout = () => {
      reject(new Error(`Tempo limite excedido ao enviar "${fileName}". O arquivo é muito grande para sua conexão atual.`));
    };

    xhr.send(formData);
  });
}

function uploadSingleChunk(
  formData: FormData,
  token: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/documents/upload-chunk', true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          resolve({ success: true });
        }
      } else {
        let errorMsg = `Erro no envio de pacote (${xhr.status})`;
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData?.error) errorMsg = errData.error;
        } catch {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Falha de rede ao transmitir pacote do anexo. Verifique sua conexão."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Tempo limite excedido ao transmitir pacote."));
    };

    xhr.send(formData);
  });
}

async function uploadLargeFileInChunks(
  file: File,
  docType: string,
  propertyId: string,
  token: string,
  clientExtractedText?: string,
  onProgress?: (status: string) => void
): Promise<any[]> {
  const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk (always safe under Cloud Run / Nginx 32MB limit)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
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
        onProgress(`Finalizando envio de ${file.name} (${sentMb}/${totalMb}MB - 100%)...`);
      } else {
        onProgress(`Enviando ${file.name}: parte ${chunkIndex + 1}/${totalChunks} (${sentMb}/${totalMb}MB - ${pct}%)`);
      }
    }

    const chunkFormData = new FormData();
    chunkFormData.append('chunk', chunkBlob, file.name);
    chunkFormData.append('uploadId', uploadId);
    chunkFormData.append('chunkIndex', String(chunkIndex));
    chunkFormData.append('totalChunks', String(totalChunks));
    chunkFormData.append('filename', file.name);
    chunkFormData.append('doc_type', docType);
    chunkFormData.append('property_id', propertyId);
    chunkFormData.append('mimeType', file.type || 'application/pdf');
    if (clientExtractedText && chunkIndex === 0) {
      chunkFormData.append('extracted_text', clientExtractedText);
    }

    const resp = await uploadSingleChunk(chunkFormData, token);
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
    
    // Only attempt client-side preview extraction for smaller PDFs (<= 15MB)
    if (file.name.toLowerCase().endsWith('.pdf') && file.size <= 15 * 1024 * 1024) {
      if (onProgress) {
        onProgress(`Indexando prévia de ${file.name}...`);
      }
      try {
        clientExtractedText = await extractTextFromPdfClientSide(file, (pct, page, total) => {
          if (onProgress) {
            onProgress(`Indexando prévia: ${page}/${total} págs (${pct}%)`);
          }
        });
        if (clientExtractedText) {
          console.log(`[documentService] Texto extraído com sucesso de ${file.name}: ${clientExtractedText.length} caracteres.`);
        }
      } catch (err: any) {
        console.warn(`[documentService] Falha na extração local para ${file.name}:`, err.message);
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

    // If file is larger than 12MB, use chunked upload to completely avoid any HTTP proxy 413 limits
    if (file.size > 12 * 1024 * 1024) {
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
