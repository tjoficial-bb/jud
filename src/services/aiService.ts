import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const getEnvKey = (provider: string) => {
  const env = (import.meta as any).env || {};
  const keyMap: Record<string, string | undefined> = {
    gemini: env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : undefined),
    openai: env.VITE_OPENAI_API_KEY,
    claude: env.VITE_CLAUDE_API_KEY,
    deepseek: env.VITE_DEEPSEEK_API_KEY,
  };
  const key = keyMap[provider];
  if (!key || key === "undefined" || key === "null" || key === "") return undefined;
  return key;
};

const callGeminiWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorStr = (error?.message || String(error)).toLowerCase();
      const errorObjStr = JSON.stringify(error || {}).toLowerCase();
      
      const isUnavailable = 
        error?.status === 503 || 
        error?.status === 429 ||
        errorStr.includes("503") || 
        errorStr.includes("429") || 
        errorStr.includes("unavailable") || 
        errorStr.includes("high demand") ||
        errorStr.includes("temp") ||
        errorObjStr.includes("unavailable") ||
        errorObjStr.includes("503") ||
        errorObjStr.includes("429");

      if (isUnavailable && attempt < retries) {
        const sleepTime = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[Gemini API Retry] Modelo indisponível ou sob alta demanda (Tentativa ${attempt}/${retries}). Tentando novamente em ${sleepTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        continue;
      }
      
      if (isUnavailable) {
        throw new Error("O modelo Gemini está com demanda temporária extremamente alta nos servidores da Google (Erro 503: Service Unavailable).\n\n" +
          "Por favor, tente novamente em alguns instantes ou, se persistir, experimente selecionar outro provedor/modelo de inteligência artificial (como Anthropic Claude ou OpenAI) no menu superior ou configurações.");
      }
      throw error;
    }
  }
};

export const CEF_DOCUMENTATION_KNOWLEDGE = `
> **HIGHLIGHT: RECUPERAÇÃO DE VALORES DE DOCUMENTAÇÃO (CAIXA)**
>
> A recuperação de valores referentes à documentação (como ITBI, registro e escritura) em financiamentos da Caixa Econômica Federal depende do tipo de edital (licitação ou venda direta) e das condições contratadas.
>
> **Pontos chave:**
> 1. **Onde Verificar no Edital (Venda de Imóveis):** Procure cláusulas sobre "Despesas" (geralmente em "Condições de Pagamento"). Geralmente, a Caixa assume custos de regularização prévia.
> 2. **Formas de Reembolso:** Se pagou algo indevido, envie o edital, comprovante de pagamento e contrato ao e-mail indicado no edital.
> 3. **Financiamento Habitacional:** É possível incluir até 5% do valor do imóvel para documentação, mas isso deve ser acordado antes da assinatura.
> 4. **Como Proceder:** Use o App Habitação CAIXA, procure um Correspondente ou a agência.
> 5. **Atenção:** Em licitações, a comissão do leiloeiro (geralmente 5%) é paga pelo comprador.
`;

export const analyzeAuctionDocuments = async (
  files: { data: string; mimeType: string; extractedText?: string }[], 
  systemInstruction: string, 
  model: string = "gemini-2.5-flash", 
  apiKey?: string,
  auctionUrls?: string[],
  analysisType?: 'geral' | 'edital' | 'matricula' | 'processo'
) => {
  const provider = getProviderFromModel(model);
  const finalApiKey = apiKey || getEnvKey(provider);

  if (!finalApiKey || finalApiKey.length < 5) {
    throw new Error(`Configuração de IA incompleta: Nenhuma chave de API encontrada para o provedor ${provider}.`);
  }

  let specializedInstruction = systemInstruction;
  if (analysisType === 'edital') {
    specializedInstruction += "\n\nFOCO: Analise estritamente o EDITAL. Identifique obrigações, prazos, ônus, valor de leilão, descrição do imóvel e condições de desocupação.";
    specializedInstruction += "\n\n" + CEF_DOCUMENTATION_KNOWLEDGE;
  } else if (analysisType === 'matricula') {
    specializedInstruction += "\n\nFOCO: Analise estritamente a MATRÍCULA. Identifique o proprietário, histórico de transmissões, ônus reais, hipotecas, penhoras e averbações.";
  } else if (analysisType === 'processo') {
    specializedInstruction += "\n\nFOCO: Analise estritamente os PROCESSOS JUDICIAIS para identificar e resumir quaisquer riscos relacionados à arrematação do imóvel, incluindo discussões sobre nulidades, recursos pendentes e o impacto potencial na posse do arrematante. Detalhe os incidentes processuais, defesas do executado, se as intimações foram regulares, e se há qualquer outra ação conexa discutindo a execução.";
  }

  if (provider === 'gemini') {
    return analyzeWithGemini(files, specializedInstruction, model, finalApiKey, auctionUrls);
  } else if (provider === 'claude') {
    return analyzeWithClaude(files, specializedInstruction, model, finalApiKey, auctionUrls);
  } else if (provider === 'openai') {
    return analyzeWithOpenAI(files, specializedInstruction, model, finalApiKey, auctionUrls);
  } else if (provider === 'deepseek') {
    return analyzeWithDeepSeek(files, specializedInstruction, model, finalApiKey, auctionUrls);
  }

  throw new Error("Provedor de IA não suportado.");
};

export const generateProcessStory = async (
  files: { data: string; mimeType: string; extractedText?: string }[], 
  model: string = "gemini-2.5-flash", 
  apiKey?: string
) => {
  const provider = getProviderFromModel(model);
  const finalApiKey = apiKey || getEnvKey(provider);

  if (!finalApiKey) throw new Error("Configuração de IA incompleta.");

  const systemInstruction = `Você é um advogado sênior especialista em leilões e direito processual civil brasileiro. 
Sua tarefa é ler todos os documentos anexados (petições, decisões, editais, matrículas, certidões) e reconstruir a "história" do processo judicial do início ao fim de forma extremamente detalhada e didática.

O relatório deve ser dividido em:
1. NARRATIVA COMPLETA: Conte a história do processo como se fosse um livro. Comece pela causa (por que o processo existe?), passe pelos marcos principais (citações, penhoras, avaliações, recursos) e termine no estado atual (leilão marcado, suspenso, etc). Use nomes das partes e datas.
2. GLOSSÁRIO JURÍDICO: Identifique termos técnicos complexos usados no processo (ex: "propter rem", "alienação fiduciária", "embargos", "carta precatória") e explique-os de forma que um leigo entenda.
3. LINHA DO TEMPO: Uma lista cronológica de eventos.

Formate a resposta estritamente em JSON com a seguinte estrutura:
{
  "full_story": "texto longo em markdown",
  "legal_glossary": "texto em markdown",
  "timeline": [
    {"date": "DD/MM/AAAA", "event": "descrição curta do evento"}
  ]
}`;

  if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    const mappedModel = mapModelId(model);
    
    const budget = getPayloadBudget(model);
    const optimizedFiles = optimizePayload(files, budget);

    const parts = optimizedFiles.map(file => {
      if (file.useText) {
        return { text: `[Documento: ${file.mimeType} - Conteúdo Extraído]\n${file.extractedText}` };
      }
      return {
        inlineData: {
          data: file.data.split(',')[1] || file.data,
          mimeType: file.mimeType
        }
      };
    });

    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: mappedModel,
      contents: {
        parts: [
          ...parts,
          { text: "Gere a história completa do processo judicial com base nos documentos fornecidos." }
        ]
      },
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    }));

    try {
      const text = response.text || "{}";
      const trimmed = text.trim().toLowerCase();
      if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
        throw new Error("Resposta do servidor é HTML");
      }
      return JSON.parse(text);
    } catch (e) {
      console.error("Erro ao parsear JSON da história:", response.text);
      return { full_story: response.text, legal_glossary: "", timeline: [] };
    }
  } else {
    // Fallback for other providers (simplified)
    const openai = new OpenAI({ apiKey: finalApiKey, dangerouslyAllowBrowser: true });
    const response = await openai.chat.completions.create({
      model: mapModelId(model),
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: "Gere a história do processo." }
      ],
      response_format: { type: "json_object" }
    });
    const content = response.choices[0].message.content || "{}";
    const trimmed = content.trim().toLowerCase();
    if (trimmed.includes('<!doctype') || trimmed.includes('<html') || trimmed.includes('<body')) {
      throw new Error("Resposta do servidor é HTML");
    }
    return JSON.parse(content);
  }
};

const getProviderFromModel = (model: string): string => {
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('claude')) return 'claude';
  if (model.startsWith('gpt') || model.startsWith('o1')) return 'openai';
  if (model.startsWith('deepseek')) return 'deepseek';
  return 'gemini';
};

const mapModelId = (model: string): string => {
  const mapping: Record<string, string> = {
    // Gemini - Using official IDs from Google documentation
    'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
    'gemini-3.1-flash-preview': 'gemini-3-flash-preview',
    'gemini-3-flash-preview': 'gemini-3-flash-preview',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-flash-latest': 'gemini-flash-latest',
    
    // Claude - Using specific versioned models
    'claude-4-6-opus': 'claude-3-5-sonnet-20241022', 
    'claude-4-6-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-4-5-haiku': 'claude-3-5-haiku-20241022',
    'claude-4-5-opus': 'claude-3-5-sonnet-20241022',
    'claude-4-5-sonnet': 'claude-3-5-sonnet-20241022',
    
    // OpenAI
    'gpt-5': 'gpt-4o',
    'gpt-4o': 'gpt-4o',
    'o1-preview': 'o1-preview',
    
    // DeepSeek
    'deepseek-v3': 'deepseek-chat',
    'deepseek-r1': 'deepseek-reasoner',
  };

  const mapped = mapping[model] || model;
  console.log(`DEBUG AI SERVICE: Original Model: ${model} -> Mapped Model: ${mapped}`);
  return mapped;
};

const getPayloadBudget = (model: string): number => {
  if (model.startsWith('claude')) return 25 * 1024 * 1024; // 25MB for Claude
  return 18 * 1024 * 1024; // 18MB for Gemini/Others (safe margin for 20MB limit)
};

const optimizePayload = (files: any[], budget: number) => {
  // Initial state: all files as base64 unless there is no base64 data available
  let currentFiles = files.map(f => ({ 
    ...f, 
    useText: !f.data || f.data === "" || f.data === "null",
    // Truncate text to 1M characters (~500k tokens) per file to avoid token limits
    optimizedText: f.extractedText ? (f.extractedText.length > 1000000 ? f.extractedText.substring(0, 1000000) + "\n... [Texto truncado por tamanho] ..." : f.extractedText) : ""
  }));
  
  const calculateSize = (items: any[]) => {
    return items.reduce((acc, item) => {
      if (item.useText) return acc + (item.optimizedText?.length || 0);
      return acc + (item.data?.length || 0);
    }, 0);
  };

  let currentSize = calculateSize(currentFiles);
  if (currentSize <= budget) return currentFiles;

  // Sort files by base64 size descending to convert the largest ones first
  const sortedIndices = currentFiles
    .map((f, i) => ({ index: i, size: f.data?.length || 0, hasText: !!f.optimizedText }))
    .filter(f => f.hasText)
    .sort((a, b) => b.size - a.size);

  for (const item of sortedIndices) {
    currentFiles[item.index].useText = true;
    currentSize = calculateSize(currentFiles);
    if (currentSize <= budget) break;
  }

  // If still over budget, we have to truncate even the text-only files further
  if (currentSize > budget) {
    const textOnlyIndices = currentFiles
      .map((f, i) => ({ index: i, size: f.optimizedText?.length || 0 }))
      .filter(f => currentFiles[f.index].useText)
      .sort((a, b) => b.size - a.size);

    for (const item of textOnlyIndices) {
      const reductionNeeded = currentSize - budget;
      const currentTextSize = currentFiles[item.index].optimizedText.length;
      const newSize = Math.max(1000, currentTextSize - reductionNeeded);
      
      currentFiles[item.index].optimizedText = currentFiles[item.index].optimizedText.substring(0, newSize) + "\n... [Texto truncado para caber no limite da API] ...";
      currentSize = calculateSize(currentFiles);
      if (currentSize <= budget) break;
    }
  }

  // If STILL over budget, it means there are base64 files without text that are too large.
  // We must drop them and replace with a warning text.
  if (currentSize > budget) {
    const base64OnlyIndices = currentFiles
      .map((f, i) => ({ index: i, size: f.data?.length || 0 }))
      .filter(f => !currentFiles[f.index].useText)
      .sort((a, b) => b.size - a.size);

    for (const item of base64OnlyIndices) {
      currentFiles[item.index].useText = true;
      currentFiles[item.index].optimizedText = `[AVISO DO SISTEMA: O arquivo original '${currentFiles[item.index].filename || 'Documento'}' era muito grande (aprox. ${(item.size / (1024 * 1024)).toFixed(1)}MB) e não pôde ser enviado para a IA devido aos limites técnicos da API. O conteúdo deste arquivo foi omitido da análise.]`;
      
      currentSize = calculateSize(currentFiles);
      if (currentSize <= budget) break;
    }
  }

  return currentFiles;
};

const analyzeWithGemini = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const mappedModel = mapModelId(model);
    
    const budget = getPayloadBudget(model);
    const optimizedFiles = optimizePayload(files, budget);
    const finalSize = optimizedFiles.reduce((acc, f) => acc + (f.useText ? (f.optimizedText?.length || 0) : (f.data?.length || 0)), 0);

    console.log(`[AI Service] Payload Optimization:
      - Original Files: ${files.length}
      - Budget: ${(budget / (1024 * 1024)).toFixed(2)}MB
      - Final Size: ${(finalSize / (1024 * 1024)).toFixed(2)}MB
      - Files as Text: ${optimizedFiles.filter(f => f.useText).length}
      - Files as Base64: ${optimizedFiles.filter(f => !f.useText).length}
    `);

    if (finalSize > budget + (1 * 1024 * 1024)) { // 1MB grace
      throw new Error(`O volume de dados (${(finalSize / (1024 * 1024)).toFixed(1)}MB) excede o limite técnico de ${budget / (1024 * 1024)}MB mesmo após otimização extrema. Tente remover arquivos grandes ou desmarcar alguns documentos.`);
    }

    const parts = optimizedFiles.map(file => {
      if (file.useText) {
        return { text: `[Documento: ${file.mimeType} - Conteúdo Extraído]\n${file.optimizedText}` };
      }
      return {
        inlineData: {
          data: file.data.split(',')[1] || file.data,
          mimeType: file.mimeType
        }
      };
    });

    let promptText = "Analise os documentos de leilão fornecidos seguindo as instruções do sistema.";
    if (auctionUrls && auctionUrls.length > 0) {
      promptText += `\n\nAlém dos documentos, acesse as seguintes páginas do leilão para obter informações atualizadas:\n${auctionUrls.join('\n')}`;
    }

    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.2,
    };

    if (auctionUrls && auctionUrls.length > 0) {
      config.tools = [{ urlContext: {} }, { googleSearch: {} }];
    }

    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: mappedModel,
      contents: {
        parts: [
          ...parts,
          { text: promptText }
        ]
      },
      config
    }));

    return response.text;
  } catch (error: any) {
    console.error("ERRO GEMINI DETALHADO:", error);
    throw new Error(error.message || `Erro Gemini (${error.status || '404'}): Modelo não encontrado ou erro na API`);
  }
};

const analyzeWithClaude = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  try {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const mappedModel = mapModelId(model);
    
    const budget = getPayloadBudget(model);
    const optimizedFiles = optimizePayload(files, budget);
    const finalSize = optimizedFiles.reduce((acc, f) => acc + (f.useText ? (f.optimizedText?.length || 0) : (f.data?.length || 0)), 0);

    if (finalSize > budget + (1 * 1024 * 1024)) {
      throw new Error(`O volume de dados (${(finalSize / (1024 * 1024)).toFixed(1)}MB) excede o limite técnico de ${budget / (1024 * 1024)}MB mesmo após otimização extrema. Tente remover arquivos grandes ou desmarcar alguns documentos.`);
    }

    let promptText = "Analise os documentos de leilão fornecidos seguindo as instruções do sistema.";
    if (auctionUrls && auctionUrls.length > 0) {
      promptText += `\n\nAlém dos documentos, acesse as seguintes páginas do leilão para obter informações atualizadas:\n${auctionUrls.join('\n')}`;
    }
    
    const content: any[] = optimizedFiles.map(file => {
      if (file.useText) {
        return {
          type: 'text',
          text: `[Documento: ${file.mimeType} - Conteúdo Extraído]\n${file.optimizedText}`
        };
      }
      // Claude supports images (base64)
      if (file.mimeType.startsWith('image/')) {
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.mimeType,
            data: file.data.split(',')[1] || file.data,
          },
        };
      }
      // Claude 3.5 Sonnet supports PDF documents
      if (file.mimeType === 'application/pdf') {
        return {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file.data.split(',')[1] || file.data,
          },
        };
      }
      // For other types, send as text if possible or placeholder
      return {
        type: 'text',
        text: `[Arquivo: ${file.mimeType}] (Conteúdo processado via OCR ou extração de texto)`
      };
    });

    const response = await anthropic.messages.create({
      model: mappedModel,
      max_tokens: 4096,
      system: systemInstruction,
      messages: [
        {
          role: 'user',
          content: [
            ...content,
            { type: 'text', text: promptText }
          ],
        },
      ],
    });

    return (response.content[0] as any).text;
  } catch (error: any) {
    console.error("ERRO CLAUDE DETALHADO:", error);
    throw new Error(error.message || `Erro Claude (${error.status || '404'}): Modelo não encontrado ou erro na API`);
  }
};

const analyzeWithOpenAI = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const mappedModel = mapModelId(model);
    
    const budget = getPayloadBudget(model);
    const optimizedFiles = optimizePayload(files, budget);
    const finalSize = optimizedFiles.reduce((acc, f) => acc + (f.useText ? (f.optimizedText?.length || 0) : (f.data?.length || 0)), 0);

    if (finalSize > budget + (1 * 1024 * 1024)) {
      throw new Error(`O volume de dados (${(finalSize / (1024 * 1024)).toFixed(1)}MB) excede o limite técnico de ${budget / (1024 * 1024)}MB mesmo após otimização extrema. Tente remover arquivos grandes ou desmarcar alguns documentos.`);
    }

    let promptText = "Analise os documentos de leilão fornecidos seguindo as instruções do sistema.";
    if (auctionUrls && auctionUrls.length > 0) {
      promptText += `\n\nAlém dos documentos, acesse as seguintes páginas do leilão para obter informações atualizadas:\n${auctionUrls.join('\n')}`;
    }
    
    const content: any[] = optimizedFiles.map(file => {
      if (file.useText) {
        return {
          type: 'text',
          text: `[Documento: ${file.mimeType} - Conteúdo Extraído]\n${file.optimizedText}`
        };
      }
      if (file.mimeType.startsWith('image/')) {
        return {
          type: 'image_url',
          image_url: {
            url: file.data.startsWith('data:') ? file.data : `data:${file.mimeType};base64,${file.data}`,
          },
        };
      }
      // OpenAI doesn't support native PDF in chat completions yet (only via Assistants API)
      // So we fallback to extracted text if available
      if (file.mimeType === 'application/pdf' && file.optimizedText) {
        return {
          type: 'text',
          text: `[Documento PDF - Conteúdo Extraído]\n${file.optimizedText}`
        };
      }
      return {
        type: 'text',
        text: `[Arquivo: ${file.mimeType}] (Conteúdo não suportado diretamente)`
      };
    });

    const response = await openai.chat.completions.create({
      model: mappedModel,
      messages: [
        { role: 'system', content: systemInstruction },
        {
          role: 'user',
          content: [
            ...content,
            { type: 'text', text: promptText }
          ],
        },
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("ERRO OPENAI DETALHADO:", error);
    throw new Error(error.message || `Erro OpenAI (${error.status || '404'}): Modelo não encontrado ou erro na API`);
  }
};

const analyzeWithDeepSeek = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  try {
    const openai = new OpenAI({ 
      apiKey, 
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: true 
    });
    const mappedModel = mapModelId(model);

    const budget = getPayloadBudget(model);
    const optimizedFiles = optimizePayload(files, budget);
    
    // DeepSeek is text-only, so we always use text
    const textContent = optimizedFiles.map(file => {
      if (file.extractedText) {
        return `[Documento: ${file.mimeType} - Conteúdo Extraído]\n${file.extractedText}`;
      }
      return `[Arquivo: ${file.mimeType}] (Conteúdo não disponível em texto)`;
    }).join('\n\n');

    let promptText = "Analise os documentos de leilão fornecidos (processados em texto).";
    if (auctionUrls && auctionUrls.length > 0) {
      promptText += `\n\nAlém dos documentos, acesse as seguintes páginas do leilão para obter informações atualizadas:\n${auctionUrls.join('\n')}`;
    }
    
    const response = await openai.chat.completions.create({
      model: mappedModel,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `${textContent}\n\n${promptText}` }
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("ERRO DEEPSEEK DETALHADO:", error);
    throw new Error(error.message || `Erro DeepSeek (${error.status || '404'}): Modelo não encontrado ou erro na API`);
  }
};

export const sendChatMessage = async (
  messages: { role: 'user' | 'assistant'; content: string }[], 
  systemInstruction: string, 
  model: string = "gemini-2.5-flash", 
  apiKey?: string
) => {
  const provider = getProviderFromModel(model);
  const finalApiKey = apiKey || getEnvKey(provider);
  const mappedModel = mapModelId(model);

  if (!finalApiKey) throw new Error("Configuração de IA incompleta.");

  if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: mappedModel,
      contents: contents as any,
      config: { systemInstruction }
    }));

    return response.text;
  } else if (provider === 'claude') {
    const anthropic = new Anthropic({ apiKey: finalApiKey, dangerouslyAllowBrowser: true });
    const response = await anthropic.messages.create({
      model: mappedModel,
      max_tokens: 4096,
      system: systemInstruction,
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })) as any,
    });
    return (response.content[0] as any).text;
  } else {
    // OpenAI and DeepSeek
    const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com' : undefined;
    const openai = new OpenAI({ apiKey: finalApiKey, baseURL, dangerouslyAllowBrowser: true });
    const response = await openai.chat.completions.create({
      model: mappedModel,
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })) as any
      ],
    });
    return response.choices[0].message.content;
  }
};
