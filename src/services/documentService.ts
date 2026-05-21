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
    if (file.size > MAX_FILE_SIZE) {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        if (onProgress) {
          onProgress(`Iniciando análise local de ${file.name}...`);
        }
        try {
          const text = await extractTextFromPdfClientSide(file, (pct, page, total) => {
            if (onProgress) {
              onProgress(`Lendo PDF localmente: pág. ${page}/${total} (${pct}%)`);
            }
          });

          if (onProgress) {
            onProgress(`Enviando texto extraído para análise...`);
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
              extracted_text: text
            })
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Erro ao enviar texto do PDF: ${errText}`);
          }

          const data = await parseJsonResponse(res);
          if (Array.isArray(data)) {
            allResults.push(...data);
          } else {
            allResults.push(data);
          }
          continue;
        } catch (err: any) {
          console.error("Client-side extraction failed:", err);
          throw new Error(`Erro ao processar PDF grande no navegador (${file.name}): ${err.message}`);
        }
      } else {
        throw new Error(
          `O arquivo "${file.name}" possui ${(file.size / (1024 * 1024)).toFixed(1)}MB e excede o limite de 30MB da infraestrutura contratada.\n\n` +
          `Para arquivos não-PDF ou maiores que 30MB, utilize ferramentas gratuitas para:\n` +
          `1. Comprimir o arquivo;\n` +
          `2. Dividir em partes menores.`
        );
      }
    }

    const formData = new FormData();
    formData.append('files', file);
    formData.append('doc_type', docType);
    formData.append('property_id', propertyId);

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
