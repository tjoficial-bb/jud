import { parseJsonResponse, robustFetch } from './apiService';
import { extractTextFromPdfClientSide } from '../lib/pdfExtractor';

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
    
    // Always extract text client-side for PDFs if fast
    if (file.name.toLowerCase().endsWith('.pdf')) {
      if (onProgress) {
        onProgress(`Lendo prévia de ${file.name}...`);
      }
      try {
        clientExtractedText = await extractTextFromPdfClientSide(file, (pct, page, total) => {
          if (onProgress) {
            onProgress(`Lendo PDF: pág. ${page}/${total} (${pct}%)`);
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

    if (onProgress) {
      onProgress(`Enviando ${file.name} ao servidor...`);
    }

    const formData = new FormData();
    formData.append('files', file);
    formData.append('doc_type', docType);
    formData.append('property_id', propertyId);
    if (clientExtractedText) {
      formData.append('extracted_text', clientExtractedText);
    }

    const res = await robustFetch('/api/documents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${activeToken}` },
      body: formData
    });

    if (!res.ok) {
      let errorMsg = `Erro ao enviar o anexo "${file.name}" (${res.status})`;
      try {
        const errorData = await parseJsonResponse(res);
        if (errorData?.error) {
          errorMsg = errorData.error;
        }
      } catch (e: any) {
        if (res.status === 413) {
          errorMsg = `O anexo "${file.name}" excede o tamanho máximo suportado (100MB).`;
        } else if (res.status === 504 || res.status === 502) {
          errorMsg = `O servidor demorou para processar o anexo "${file.name}". Experimente reenviar ou dividir o arquivo.`;
        }
      }
      throw new Error(errorMsg);
    }
    
    const data = await parseJsonResponse(res);
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
