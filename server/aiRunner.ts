import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

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

const getProviderFromModel = (model: string): string => {
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('claude')) return 'claude';
  if (model.startsWith('gpt') || model.startsWith('o1')) return 'openai';
  if (model.startsWith('deepseek')) return 'deepseek';
  return 'gemini';
};

const mapModelId = (model: string): string => {
  const mapping: Record<string, string> = {
    'gemini-3.5-flash': 'gemini-3.5-flash',
    'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
    'gemini-3.1-flash-preview': 'gemini-3.5-flash',
    'gemini-3-flash-preview': 'gemini-3.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-3.5-flash',
    'gemini-flash-latest': 'gemini-3.5-flash',
    
    'claude-4-6-opus': 'claude-3-5-sonnet-20241022', 
    'claude-4-6-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-4-5-haiku': 'claude-3-5-haiku-20241022',
    'claude-4-5-opus': 'claude-3-5-sonnet-20241022',
    'claude-4-5-sonnet': 'claude-3-5-sonnet-20241022',
    
    'gpt-5': 'gpt-4o',
    'gpt-4o': 'gpt-4o',
    'o1-preview': 'o1-preview',
    
    'deepseek-v3': 'deepseek-chat',
    'deepseek-r1': 'deepseek-reasoner',
  };
  return mapping[model] || model;
};

const getPayloadBudget = (model: string): number => {
  if (model.startsWith('claude')) return 25 * 1024 * 1024;
  return 18 * 1024 * 1024;
};

const optimizePayload = (files: any[], budget: number) => {
  let currentFiles = files.map(f => ({ 
    ...f, 
    useText: (!!f.extractedText && f.extractedText.trim().length > 0) || !f.data || f.data === "" || f.data === "null",
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

  const sortedIndices = currentFiles
    .map((f, i) => ({ index: i, size: f.data?.length || 0, hasText: !!f.optimizedText }))
    .filter(f => f.hasText)
    .sort((a, b) => b.size - a.size);

  for (const item of sortedIndices) {
    currentFiles[item.index].useText = true;
    currentSize = calculateSize(currentFiles);
    if (currentSize <= budget) break;
  }

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

const EF_DOCUMENTATION_KNOWLEDGE = `
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

const analyzeWithGemini = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  const ai = new GoogleGenAI({ apiKey });
  const mappedModel = mapModelId(model);
  const budget = getPayloadBudget(model);
  const optimizedFiles = optimizePayload(files, budget);
  const finalSize = optimizedFiles.reduce((acc, f) => acc + (f.useText ? (f.optimizedText?.length || 0) : (f.data?.length || 0)), 0);

  if (finalSize > budget + (1 * 1024 * 1024)) {
    throw new Error(`O volume de dados (${(finalSize / (1024 * 1024)).toFixed(1)}MB) excede o limite técnico de ${budget / (1024 * 1024)}MB mesmo após otimização extrema.`);
  }

  const parts = optimizedFiles.map(file => {
    if (file.useText) {
      return { text: `[Documento: ${file.mimeType} - Conteúdo Extraído]\n${file.optimizedText}` };
    }
    return {
      inlineData: {
        data: file.data.includes(',') ? file.data.split(',')[1] : file.data,
        mimeType: file.mimeType
      }
    };
  });

  let promptText = "Analise os documentos de leilão fornecidos seguindo as instruções do sistema.";
  if (auctionUrls && auctionUrls.length > 0) {
    promptText += `\n\nAlém dos documentos, acesse as seguintes páginas do leilão para obter informações atualizadas:\n${auctionUrls.join('\n')}`;
  }

  const config: any = {
    systemInstruction,
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

  return response.text || "";
};

const analyzeWithClaude = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  const anthropic = new Anthropic({ apiKey });
  const mappedModel = mapModelId(model);
  const budget = getPayloadBudget(model);
  const optimizedFiles = optimizePayload(files, budget);
  const finalSize = optimizedFiles.reduce((acc, f) => acc + (f.useText ? (f.optimizedText?.length || 0) : (f.data?.length || 0)), 0);

  if (finalSize > budget + (1 * 1024 * 1024)) {
    throw new Error(`O volume de dados (${(finalSize / (1024 * 1024)).toFixed(1)}MB) excede o limite técnico de ${budget / (1024 * 1024)}MB mesmo após otimização extrema.`);
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
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.mimeType,
          data: file.data.includes(',') ? file.data.split(',')[1] : file.data,
        },
      };
    }
    if (file.mimeType === 'application/pdf') {
      return {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: file.data.includes(',') ? file.data.split(',')[1] : file.data,
        },
      };
    }
    return {
      type: 'text',
      text: `[Arquivo: ${file.mimeType}]`
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
};

const analyzeWithOpenAI = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  const openai = new OpenAI({ apiKey });
  const mappedModel = mapModelId(model);
  const budget = getPayloadBudget(model);
  const optimizedFiles = optimizePayload(files, budget);
  const finalSize = optimizedFiles.reduce((acc, f) => acc + (f.useText ? (f.optimizedText?.length || 0) : (f.data?.length || 0)), 0);

  if (finalSize > budget + (1 * 1024 * 1024)) {
    throw new Error(`O volume de dados (${(finalSize / (1024 * 1024)).toFixed(1)}MB) excede o limite técnico de ${budget / (1024 * 1024)}MB mesmo após otimização extrema.`);
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
    if (file.mimeType === 'application/pdf' && file.optimizedText) {
      return {
        type: 'text',
        text: `[Documento PDF - Conteúdo Extraído]\n${file.optimizedText}`
      };
    }
    return {
      type: 'text',
      text: `[Arquivo: ${file.mimeType}]`
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
};

const analyzeWithDeepSeek = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  const openai = new OpenAI({ 
    apiKey, 
    baseURL: 'https://api.deepseek.com'
  });
  const mappedModel = mapModelId(model);
  const budget = getPayloadBudget(model);
  const optimizedFiles = optimizePayload(files, budget);
  
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
};

export const runBackendAnalysis = async (
  files: any[],
  systemInstruction: string,
  model: string,
  apiKey: string,
  auctionUrls?: string[],
  analysisType?: string
) => {
  const provider = getProviderFromModel(model);
  let specializedInstruction = systemInstruction;

  if (analysisType === 'edital') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE: Analise estritamente o EDITAL linha por linha. Dedique atenção extrema aos débitos de IPTU (dívida ativa municipal) e Condomínio, alertando se o arrematante assume os débitos anteriores ou se há sub-rogação pelo lance nos termos do Art. 130 do CTN. Identifique obrigações adicionais, prazos de pagamento, leiloeiro, comissão, descrição física do imóvel e condições e prazos para a desocupação de forma explícita.";
    specializedInstruction += "\n\n" + EF_DOCUMENTATION_KNOWLEDGE;
  } else if (analysisType === 'matricula') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE: Analise estritamente a MATRÍCULA. É obrigatório identificar e expor detalhadamente todos os dados do proprietário, executado e adquirente anterior mencionados no documento, incluindo Nome Completo, CPF/CNPJ, Estado Civil, Profissão e Endereço Completo de residência ou sede. Mapeie cirurgicamente o histórico de transmissões, ônus reais, hipotecas, penhoras, indisponibilidades, averbações de processos associados e divórcios/partilhas.";
  } else if (analysisType === 'processo') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE: Analise estritamente os PROCESSOS JUDICIAIS de ponta a ponta. Identifique todos os CPF/CNPJ, nomes completos e endereços de réus, autores, executados, credores hipotecários, e cônjuges. Identifique e relate todos os processos correlacionados ou incidentes judiciais ativos, o número completo da ação judicial, a vara/juiz correspondente, e faça uma avaliação minuciosa de risco quanto a vício de citação/intimação ou recursos pendentes do executado.";
  }

  if (provider === 'gemini') {
    return analyzeWithGemini(files, specializedInstruction, model, apiKey, auctionUrls);
  } else if (provider === 'claude') {
    return analyzeWithClaude(files, specializedInstruction, model, apiKey, auctionUrls);
  } else if (provider === 'openai') {
    return analyzeWithOpenAI(files, specializedInstruction, model, apiKey, auctionUrls);
  } else if (provider === 'deepseek') {
    return analyzeWithDeepSeek(files, specializedInstruction, model, apiKey, auctionUrls);
  }
  throw new Error("Provedor não suportado.");
};

export const runBackendProcessStory = async (
  files: any[],
  model: string,
  apiKey: string
) => {
  const provider = getProviderFromModel(model);
  const mappedModel = mapModelId(model);

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
    const ai = new GoogleGenAI({ apiKey });
    const budget = getPayloadBudget(model);
    const optimizedFiles = optimizePayload(files, budget);

    const parts = optimizedFiles.map(file => {
      if (file.useText) {
        return { text: `[Documento: ${file.mimeType} - Conteúdo Extraído]\n${file.extractedText}` };
      }
      return {
        inlineData: {
          data: file.data.includes(',') ? file.data.split(',')[1] : file.data,
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

    const text = response.text || "{}";
    return JSON.parse(text);
  } else {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: mappedModel,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: "Gere a história do processo." }
      ],
      response_format: { type: "json_object" }
    });
    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  }
};

export const runBackendChatMessage = async (
  messages: any[],
  systemInstruction: string,
  model: string,
  apiKey: string
) => {
  const provider = getProviderFromModel(model);
  const mappedModel = mapModelId(model);

  if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey });
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: mappedModel,
      contents: contents as any,
      config: { systemInstruction }
    }));

    return response.text || "";
  } else if (provider === 'claude') {
    const anthropic = new Anthropic({ apiKey });
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
    const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com' : undefined;
    const openai = new OpenAI({ apiKey, baseURL });
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
    return response.choices[0].message.content || "";
  }
};
