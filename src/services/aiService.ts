import { parseJsonResponse } from './apiService';

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
  model: string = "gemini-2.5-flash", 
  apiKey?: string,
  auctionUrls?: string[],
  analysisType?: 'geral' | 'edital' | 'matricula' | 'processo' | 'dossier' | 'smart_analysis'
) => {
  const token = localStorage.getItem("token") || "";
  
  // Use Gemini 3.5 Flash directly if we already downgraded to prevent multiple slow timeouts
  let activeModel = model;
  if (hasDowngradedToFlash && model.startsWith('gemini') && model !== 'gemini-3.5-flash') {
    activeModel = 'gemini-3.5-flash';
    console.log(`[AI SERVICE] Automatically using gemini-3.5-flash due to prior session downgrade.`);
  }

  try {
    const res = await fetch("/api/ai/analyze", {
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
    const errMessage = err.message || "";
    const isOverloaded = errMessage.includes('503') || 
                        errMessage.includes('UNAVAILABLE') || 
                        errMessage.includes('429') || 
                        errMessage.toLowerCase().includes('overloaded') || 
                        errMessage.toLowerCase().includes('unavailable') || 
                        errMessage.toLowerCase().includes('tempo limite') || 
                        errMessage.toLowerCase().includes('timeout') ||
                        errMessage.toLowerCase().includes('quota') ||
                        errMessage.toLowerCase().includes('excedeu') ||
                        errMessage.toLowerCase().includes('limite') ||
                        errMessage.toLowerCase().includes('exhausted') ||
                        errMessage.toLowerCase().includes('unregistered callers') ||
                        errMessage.toLowerCase().includes('permission_denied') ||
                        errMessage.toLowerCase().includes('rejeitado') ||
                        errMessage.toLowerCase().includes('negado') ||
                        errMessage.toLowerCase().includes('error 500') ||
                        errMessage.toLowerCase().includes('500');

    if (isOverloaded && activeModel !== 'gemini-3.5-flash') {
      console.warn(`[AI SERVICE FALLBACK] Model ${activeModel} failed with overloading/quota. Retrying automatically with gemini-3.5-flash...`);
      hasDowngradedToFlash = true; // Downgrade session-wide
      
      if (typeof window !== 'undefined' && (window as any).customToast) {
        (window as any).customToast("O modelo Pro está instável ou atingiu o limite de cota. Mudamos automaticamente para o Gemini 3.5 Flash para concluir sua análise em alta velocidade!", "success");
      }
      
      const retryRes = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ files, systemInstruction, model: 'gemini-3.5-flash', apiKey, auctionUrls, analysisType })
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
  model: string = "gemini-2.5-flash", 
  apiKey?: string
) => {
  const token = localStorage.getItem("token") || "";
  const res = await fetch("/api/ai/story", {
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
  model: string = "gemini-2.5-flash", 
  apiKey?: string
) => {
  const token = localStorage.getItem("token") || "";
  
  // Use Gemini 3.5 Flash directly if we already downgraded to prevent slow requests
  let activeModel = model;
  if (hasDowngradedToFlash && model.startsWith('gemini') && model !== 'gemini-3.5-flash') {
    activeModel = 'gemini-3.5-flash';
  }

  try {
    const res = await fetch("/api/ai/chat", {
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
    const errMessage = err.message || "";
    const isOverloaded = errMessage.includes('503') || 
                        errMessage.includes('UNAVAILABLE') || 
                        errMessage.includes('429') || 
                        errMessage.toLowerCase().includes('overloaded') || 
                        errMessage.toLowerCase().includes('unavailable') || 
                        errMessage.toLowerCase().includes('tempo limite') || 
                        errMessage.toLowerCase().includes('timeout') ||
                        errMessage.toLowerCase().includes('quota') ||
                        errMessage.toLowerCase().includes('excedeu') ||
                        errMessage.toLowerCase().includes('limite') ||
                        errMessage.toLowerCase().includes('exhausted') ||
                        errMessage.toLowerCase().includes('unregistered callers') ||
                        errMessage.toLowerCase().includes('permission_denied') ||
                        errMessage.toLowerCase().includes('rejeitado') ||
                        errMessage.toLowerCase().includes('negado') ||
                        errMessage.toLowerCase().includes('error 500') ||
                        errMessage.toLowerCase().includes('500');

    if (isOverloaded && activeModel !== 'gemini-3.5-flash') {
      console.warn(`[AI SERVICE FALLBACK] Chat model ${activeModel} failed with overloading/quota. Retrying automatically with gemini-3.5-flash...`);
      hasDowngradedToFlash = true; // Downgrade session-wide
      
      if (typeof window !== 'undefined' && (window as any).customToast) {
        (window as any).customToast("O modelo Pro está instável ou com limite de cota. Mudamos para o Gemini 3.5 Flash para responder sua pergunta rapidamente sem erros!", "success");
      }
      
      const retryRes = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ messages, systemInstruction, model: 'gemini-3.5-flash', apiKey })
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
