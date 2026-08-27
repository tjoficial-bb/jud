export const parseJsonResponse = async (res: Response) => {
  const text = await res.text();
  try {
    const trimmed = text.trim();
    if (!trimmed) {
      if (!res.ok) {
        throw new Error(`Erro no servidor (${res.status} ${res.statusText || ''})`);
      }
      return {};
    }
    const lowerTrimmed = trimmed.toLowerCase();
    if (lowerTrimmed.startsWith('<!doctype') || lowerTrimmed.includes('<html') || lowerTrimmed.includes('<body') || lowerTrimmed.startsWith('<')) {
      console.warn(`API Warning: Received HTML instead of JSON for ${res.url}. Status: ${res.status}.`);
      
      if (res.status === 401 || res.status === 403) {
        const msg = "Sessão expirada ou acesso não autorizado.\n\nPor favor, faça login novamente ou abra em uma nova aba.";
        throw new Error(msg);
      } else {
        const msg = `O servidor está temporariamente indisponível ou retornou status ${res.status}. Por favor, aguarde alguns segundos e tente novamente.`;
        throw new Error(msg);
      }
    }
    return JSON.parse(trimmed);
  } catch (err: any) {
    if (err.message && (err.message.includes("Sessão expirada") || err.message.includes("O servidor está temporariamente indisponível") || err.message.includes("Erro no servidor"))) {
      throw err;
    }
    console.error("Erro ao parsear JSON:", err, "Texto:", text.substring(0, 500));
    throw new Error("Erro ao processar resposta do servidor");
  }
};

/**
 * Robust fetch wrapper with automatic retry for network glitches / container restarts
 */
export const robustFetch = async (input: RequestInfo | URL, init?: RequestInit, retries = 1, delayMs = 800): Promise<Response> => {
  try {
    const res = await fetch(input, init);
    return res;
  } catch (err: any) {
    const isNetworkError = err instanceof TypeError || (err.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch')));
    if (retries > 0 && isNetworkError) {
      console.warn(`[robustFetch] Fetch failed (${err.message}). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return robustFetch(input, init, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
};
