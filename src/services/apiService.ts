export const parseJsonResponse = async (res: Response) => {
  const text = await res.text();
  try {
    const trimmed = text.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    if (lowerTrimmed.startsWith('<!doctype') || lowerTrimmed.includes('<html') || lowerTrimmed.includes('<body') || lowerTrimmed.startsWith('<')) {
      console.warn(`API Warning: Received HTML instead of JSON for ${res.url}. Status: ${res.status}.`);
      
      if (res.status === 401 || res.status === 403) {
        const msg = "Sessão expirada ou cookies bloqueados.\n\nPor favor, tente abrir o sistema em uma nova aba para renovar a sessão.";
        throw new Error(msg);
      } else {
        const msg = `O servidor está temporariamente indisponível ou em processo de reinicialização (Status: ${res.status}). Por favor, aguarde alguns segundos e tente novamente.`;
        throw new Error(msg);
      }
    }
    return JSON.parse(trimmed);
  } catch (err: any) {
    if (err.message && (err.message.includes("Sessão expirada") || err.message.includes("O servidor está temporariamente indisponível"))) {
      throw err;
    }
    console.error("Erro ao parsear JSON:", err, "Texto:", text.substring(0, 500));
    throw new Error("Erro ao processar resposta do servidor");
  }
};
