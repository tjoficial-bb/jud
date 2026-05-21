/**
 * Lightweight client-side proxy service for AI features.
 * All operations are run securely on the server-side to hide API keys from the browser
 * and bypass browser CORS limits.
 */

export const analyzeAuctionDocuments = async (
  files: { data: string; mimeType: string; extractedText?: string }[], 
  systemInstruction: string, 
  model: string = "gemini-2.5-flash", 
  apiKey?: string,
  auctionUrls?: string[],
  analysisType?: 'geral' | 'edital' | 'matricula' | 'processo'
) => {
  const token = localStorage.getItem("token") || "";
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ files, systemInstruction, model, apiKey, auctionUrls, analysisType })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro de análise (${res.status})`);
  }

  const data = await res.json();
  return data.result;
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro de geração de história (${res.status})`);
  }

  return await res.json();
};

export const sendChatMessage = async (
  messages: { role: 'user' | 'assistant'; content: string }[], 
  systemInstruction: string, 
  model: string = "gemini-2.5-flash", 
  apiKey?: string
) => {
  const token = localStorage.getItem("token") || "";
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ messages, systemInstruction, model, apiKey })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro de chat (${res.status})`);
  }

  const data = await res.json();
  return data.result;
};
