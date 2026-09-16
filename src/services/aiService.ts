import { parseJsonResponse, robustFetch } from './apiService';

/**
 * Lightweight client-side proxy service for AI features.
 * All operations are run securely on the server-side to hide API keys from the browser
 * and bypass browser CORS limits.
 */

// Simple persistent session-wide flag to prevent sequential slow timeouts
let hasDowngradedToFlash = false;

export const analyzeAuctionDocuments = async (
  files: { data: string; mimeType: string; extractedText?: string }[], 
  systemInstruction: string, 
  model: string = "gemini-3.8-flash", 
  apiKey?: string,
  auctionUrls?: string[],
  analysisType?: 'geral' | 'edital' | 'matricula' | 'processo' | 'dossier' | 'smart_analysis' | 'assessoria_analysis'
) => {
  const token = localStorage.getItem("token") || "";
  const activeModel = model;

  try {
    const res = await robustFetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ files, systemInstruction, model: activeModel, apiKey, auctionUrls, analysisType })
    });

    if (!res.ok) {
      const errorData = await parseJsonResponse(res).catch(() => ({}));
      throw new Error(errorData.error || `Erro de análise (${res.status})`);
    }

    const data = await parseJsonResponse(res);
    return data.result;
  } catch (err: any) {
    const errMessage = (err.message || "").toLowerCase();
    const isOverloaded = errMessage.includes('503') || 
                        errMessage.includes('unavailable') || 
                        errMessage.includes('indisponível') || 
                        errMessage.includes('indisponivel') || 
                        errMessage.includes('temporariamente') || 
                        errMessage.includes('429') || 
                        errMessage.includes('overloaded') || 
                        errMessage.includes('tempo limite') || 
                        errMessage.includes('timeout') ||
                        errMessage.includes('quota') ||
                        errMessage.includes('excedeu') ||
                        errMessage.includes('limite') ||
                        errMessage.includes('exhausted') ||
                        errMessage.includes('resource_exhausted');

    if (isOverloaded) {
      // For quota errors (429, TPM limits), fallback to gemini-3.1-flash-lite or gemini-2.5-flash which have massive quotas
      const fallbackTarget = activeModel === 'gemini-3.1-flash-lite' ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite';
        
      console.warn(`[AI SERVICE FALLBACK] Model ${activeModel} failed with overloading/quota. Retrying automatically with ${fallbackTarget}...`);
      
      if (typeof window !== 'undefined' && (window as any).customToast) {
        (window as any).customToast(`Limite de cota atingido em ${activeModel}. Alternando automaticamente para ${fallbackTarget}...`, "warning");
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryRes = await robustFetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ files, systemInstruction, model: fallbackTarget, apiKey, auctionUrls, analysisType })
      });

      if (!retryRes.ok) {
        const errorData = await parseJsonResponse(retryRes).catch(() => ({}));
        throw new Error(errorData.error || `Erro de análise no fallback (${retryRes.status})`);
      }

      const retryData = await parseJsonResponse(retryRes);
      return retryData.result;
    }
    throw err;
  }
};

export const generateProcessStory = async (
  files: { data: string; mimeType: string; extractedText?: string }[], 
  model: string = "gemini-3.8-flash", 
  apiKey?: string
) => {
  const token = localStorage.getItem("token") || "";
  const res = await robustFetch("/api/ai/story", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ files, model, apiKey })
  });

  if (!res.ok) {
    const errorData = await parseJsonResponse(res).catch(() => ({}));
    throw new Error(errorData.error || `Erro de geração de história (${res.status})`);
  }

  return await parseJsonResponse(res);
};

export const sendChatMessage = async (
  messages: { role: 'user' | 'assistant'; content: string }[], 
  systemInstruction: string, 
  model: string = "gemini-3.8-flash", 
  apiKey?: string
) => {
  const token = localStorage.getItem("token") || "";
  const activeModel = model;

  try {
    const res = await robustFetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ messages, systemInstruction, model: activeModel, apiKey })
    });

    if (!res.ok) {
      const errorData = await parseJsonResponse(res).catch(() => ({}));
      throw new Error(errorData.error || `Erro de chat (${res.status})`);
    }

    const data = await parseJsonResponse(res);
    return data.result;
  } catch (err: any) {
    const errMessage = (err.message || "").toLowerCase();
    const isOverloaded = errMessage.includes('503') || 
                        errMessage.includes('unavailable') || 
                        errMessage.includes('indisponível') || 
                        errMessage.includes('indisponivel') || 
                        errMessage.includes('temporariamente') || 
                        errMessage.includes('429') || 
                        errMessage.includes('overloaded') || 
                        errMessage.includes('tempo limite') || 
                        errMessage.includes('timeout') ||
                        errMessage.includes('quota') ||
                        errMessage.includes('excedeu') ||
                        errMessage.includes('limite') ||
                        errMessage.includes('exhausted') ||
                        errMessage.includes('resource_exhausted');

    if (isOverloaded) {
      const fallbackTarget = activeModel === 'gemini-3.1-flash-lite' ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite';
        
      console.warn(`[AI SERVICE FALLBACK] Chat model ${activeModel} failed with overloading/quota. Retrying with ${fallbackTarget}...`);
      
      if (typeof window !== 'undefined' && (window as any).customToast) {
        (window as any).customToast(`Limite de cota atingido em ${activeModel}. Redirecionando chat para ${fallbackTarget}...`, "warning");
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryRes = await robustFetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ messages, systemInstruction, model: fallbackTarget, apiKey })
      });

      if (!retryRes.ok) {
        const errorData = await parseJsonResponse(retryRes).catch(() => ({}));
        throw new Error(errorData.error || `Erro de chat no fallback (${retryRes.status})`);
      }

      const retryData = await parseJsonResponse(retryRes);
      return retryData.result;
    }
    throw err;
  }
};
