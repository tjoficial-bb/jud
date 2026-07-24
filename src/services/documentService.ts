import { parseJsonResponse } from './apiService';
import { extractTextFromPdfClientSide } from '../lib/pdfExtractor';

export async function uploadDocuments(
  files: File[], 
  docType: string, 
  propertyId: string, 
  token: string,
  onProgress?: (status: string) => void
) {
  const allResults: any[] = [];
  const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB (GCP Cloud Run hard limit is 32MB)

  for (const file of files) {
    let clientExtractedText = "";
    
    // Always extract text client-side for PDFs (highly resilient & modern)
    if (file.name.toLowerCase().endsWith('.pdf')) {
      if (onProgress) {
        onProgress(`Extraindo texto de ${file.name} localmente para agilizar a IA...`);
      }
      try {
        clientExtractedText = await extractTextFromPdfClientSide(file, (pct, page, total) => {
          if (onProgress) {
            onProgress(`Lendo PDF localmente: pág. ${page}/${total} (${pct}%)`);
          }
        });
        console.log(`[documentService] Texto extraído com sucesso de ${file.name}: ${clientExtractedText.length} caracteres.`);
      } catch (err: any) {
        console.warn(`[documentService] Falha na extração de texto via navegador para ${file.name}:`, err.message);
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`O arquivo "${file.name}" é muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB) e a extração local falhou: ${err.message}`);
        }
      }
    }

    // For PDFs, if text was extracted client-side, we pass it along, but for scanned/low-density PDFs or Matrículas where text might just be headers,
    // we always send the file binary to /api/documents so the server has the base64 binary for multimodal AI / OCR.
    // Only use text-only shortcut for extremely large PDFs (> 15MB) where uploading binary might be slow and text is genuine (> 5000 chars).
    if (file.name.toLowerCase().endsWith('.pdf') && file.size > 15 * 1024 * 1024 && clientExtractedText && clientExtractedText.trim().length > 5000) {
      if (onProgress) {
        onProgress(`Enviando texto extraído de ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB) para análise rápida...`);
      }

      const res = await fetch('/api/documents/text-only', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          doc_type: docType,
          property_id: propertyId,
          extracted_text: clientExtractedText
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erro ao enviar o texto do PDF: ${errText}`);
      }

      const data = await parseJsonResponse(res);
      if (Array.isArray(data)) {
        allResults.push(...data);
      } else {
        allResults.push(data);
      }
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `O arquivo "${file.name}" possui ${(file.size / (1024 * 1024)).toFixed(1)}MB e excede o limite de 30MB da infraestrutura contratada.\n\n` +
        `Para arquivos maiores que 30MB, utilize ferramentas gratuitas para:\n` +
        `1. Comprimir o arquivo;\n` +
        `2. Dividir em partes menores.`
      );
    }

    const formData = new FormData();
    formData.append('files', file);
    formData.append('doc_type', docType);
    formData.append('property_id', propertyId);
    if (clientExtractedText) {
      formData.append('extracted_text', clientExtractedText);
    }

    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      let errData;
      try {
        errData = JSON.parse(errText);
      } catch(e) {
        errData = { error: errText };
      }
      throw new Error(errData.error || `Erro ao enviar o arquivo "${file.name}"`);
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
  const res = await fetch('/api/documents/link', {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ temp_property_id: tempPropertyId, property_id: propertyId })
  });

  if (!res.ok) throw new Error("Erro ao vincular documentos");
  
  return await parseJsonResponse(res);
}

export async function deleteDocument(
  documentId: string, 
  token: string
) {
  const res = await fetch(`/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Erro ao deletar documento");
  
  return await parseJsonResponse(res);
}
