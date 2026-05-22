export const parseJsonResponse = async (res: Response) => {
  const text = await res.text();
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body') || trimmed.startsWith('<')) {
      console.warn(`API Warning: Received HTML instead of JSON for ${res.url}. Status: ${res.status}.`);
      const msg = "Sessão expirada ou cookies bloqueados.\n\nPor favor, tente abrir o sistema em uma nova aba para renovar a sessão.";
      throw new Error(msg);
    }
    return JSON.parse(trimmed);
  } catch (err: any) {
    if (err.message && err.message.includes("Sessão expirada")) {
      throw err;
    }
    console.error("Erro ao parsear JSON:", err, "Texto:", text.substring(0, 500));
    throw new Error("Erro ao processar resposta do servidor");
  }
};
