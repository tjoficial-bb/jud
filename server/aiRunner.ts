import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import axios from "axios";

const fetchUrlContent = async (url: string): Promise<string> => {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return "";
  }
  try {
    console.log(`[Crawler] Iniciando captura rápida de URL do leilão: ${url}`);
    const res = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (typeof res.data === 'string') {
      const html = res.data;
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      const titleText = titleMatch ? titleMatch[1].trim() : "Portal-Leiloeiro";

      let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
      text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
      text = text.replace(/<\/p>|<\/div>|<br\s*\/?>|<\/tr>|<\/h[1-6]>/gi, '\n');
      text = text.replace(/<[^>]+>/g, ' ');
      text = text.trim();
      
      // Clean up whitespace beautifully
      text = text.replace(/[ \t]+/g, ' ');
      text = text.replace(/\n\s*\n+/g, '\n');

      console.log(`[Crawler] Captura concluída. Título: "${titleText}", Extraído: ${text.length} caracteres.`);
      return `Título do Portal: ${titleText}\n\nConteúdo:\n${text.substring(0, 12000)}`;
    }
    return "";
  } catch (err: any) {
    console.warn(`[Crawler Error] Erro ao buscar URL de leiloeiro ${url}:`, err.message);
    return `[Este link de detalhes do leilão está sob proteção do Cloudflare, exige CAPTCHA ou está offline temporariamente. Erro: ${err.message}. Prossiga fornecendo as diretrizes e parecer de análise com base nos outros documentos disponíveis.]`;
  }
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
        errorStr.includes("temporary") ||
        errorStr.includes("overloaded") ||
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
  // Keep the payload budget optimized yet generous since text-based files take almost 0 bytes.
  if (model && (model.includes('flash') || model.includes('gemini') || model.includes('claude') || model.includes('gpt-4') || model.includes('o1') || model.includes('deepseek'))) {
    return 30 * 1024 * 1024; // 30MB budget of base64 data (~22MB raw files)
  }
  return 12 * 1024 * 1024; // 12MB budget of base64 data (~9MB raw files)
};

const optimizePayload = (files: any[], budget: number) => {
  let currentFiles = files.map(f => {
    const hasText = !!f.extractedText && f.extractedText.trim().length > 0;
    
    // We check if it is a heavy binary (PDF or Image).
    // PDFs without text are processed visually by top-tier models using deep multi-modal features.
    // Up to 26MB base64 (~19MB raw) is fully supported for heavy scanned registry files.
    let limit = 8.0 * 1024 * 1024; // 8.0MB limit for images (approx 6MB raw)
    if (f.mimeType === 'application/pdf') {
      limit = 26.0 * 1024 * 1024; // 26.0MB limit for PDFs without text (approx 19MB raw)
    }
    
    const isBase64TooLarge = f.data && f.data.length > limit;
    
    let useText = hasText || !f.data || f.data === "" || f.data === "null" || isBase64TooLarge;
    let optimizedText = "";
    
    if (hasText) {
      optimizedText = f.extractedText.length > 800000 
        ? f.extractedText.substring(0, 800000) + "\n... [Texto truncado por tamanho] ..." 
        : f.extractedText;
    } else if (isBase64TooLarge) {
      if (f.mimeType === 'application/pdf') {
        optimizedText = `[AVISO INTERNO: O arquivo PDF '${f.filename || 'Documento'}' excedeu o tamanho máximo suportado para análise rápida por imagem e foi temporariamente omitido para garantir a performance da rede. Por favor, forneça o melhor parecer técnico possível focando nas demais peças anexadas e regras gerais de leilões.]`;
      } else {
        optimizedText = `[AVISO INTERNO: A imagem '${f.filename || 'Documento'}' é muito pesada e foi omitida para otimizar o tempo de resposta da rede. Prossiga fornecendo as orientações gerais possíveis com as informações disponíveis.]`;
      }
    }
    
    return {
      ...f,
      useText,
      optimizedText
    };
  });
  
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

const BB_AND_CAIXA_KNOWLEDGE = `
> **DIRETRIZES DE RECONHECIMENTO DE EDITAIS E DOCUMENTAÇÃO BANCÁRIA**
>
> Você deve identificar rigorosamente qual instituição financeira é a promotora do edital ou credora fiduciária (ex: Banco do Brasil S/A, Caixa Econômica Federal - CEF, Bradesco, Itaú, etc.) a partir da análise das primeiras páginas e do cabeçalho do documento de Edital. Jamais misture as regras ou marcas das instituições.
>
> **1. CASO O EDITAL SEJA DA CAIXA ECONÔMICA FEDERAL (CEF):**
> - **Regularizações e Débitos:** A Caixa geralmente é responsável pela baixa de gravames, cancelamento de alienações anteriores e pagamento de condomínio/IPTU até a data da contratação. Os custos de ITBI, escritura do imóvel e registro da venda no cartório de imóveis (RGI) correm por conta do adquirente sob regras gerais, a menos que conste de forma diferente no edital.
> - **Reembolso:** Para reaver valores indevidos que eram obrigações da CEF, o comprador deve enviar o comprovante de pagamento ao endereço indicado no edital para o respectivo reembolso administrativo.
> - **Financiamento:** O adquirente pode incluir até 5% do valor financiável para regular despesas cartorárias desde que estabelecido antes da contratação.
>
> **2. CASO O EDITAL SEJA DO BANCO DO BRASIL (BB):**
> - **Comissão de Leiloeiro:** Geralmente estipulada em 5% sobre o valor da arrematação, paga diretamente ao leiloeiro oficial pelo arrematante.
> - **Despesas e Custos de Regularização:** No Banco do Brasil, todas as despesas decorrentes de ITBI, lavratura de escritura pública (ou instrumento de compra e venda) e respectivos registros de transmissão correm exclusivamente por conta do arrematante investidor.
> - **Débitos Anteriores (IPTU e Condomínio):** Conforme regras padrão do BB, o banco se responsabiliza pelos débitos de IPTU (Imposto Predial e Territorial Urbano) e cotas de condomínio vencidos e não pagos até a data do leilão público (ou assinatura do contrato de venda direta), cabendo ao comprador formalizar o pedido de quitação/reembolso junto ao BB com as certidões e comprovantes exigidos pelo edital dentro do prazo decadencial (geralmente até 120 dias da arrematação). O investidor deve ser assessorado sobre essa solicitação.
> - **Desocupação:** No Banco do Brasil, a desocupação de imóveis ocupados por terceiros é de inteira e exclusiva responsabilidade do adquirente.
`;

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

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
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
    specializedInstruction += "\n\n" + BB_AND_CAIXA_KNOWLEDGE;
  } else if (analysisType === 'matricula') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE (MANDATÓRIO):" +
      "\nAnalise estritamente toda a MATRÍCULA DO IMÓVEL folha por folha, prestando atenção prioritária aos atos registrados sob as siglas 'R-' (Registro) e 'AV-' (Averbação)." +
      "\nVocê deve identificar e expor obrigatoriamente:" +
      "\n1. HISTÓRICO COMPLETO DE PROPRIETÁRIOS: Identifique TODOS os adquirentes, proprietários antigos e atuais mencionados nos registros de Compra e Venda (R-). Extraia: Nome Completo, CPF/CNPJ, Estado Civil, Cônjuge (se houver), Profissão, e Endereço Completo de residência." +
      "\n2. GARANTIAS E FIDUCIÁRIOS: Mapeie qualquer Alienação Fiduciária (geralmente sob R- ou AV-), apontando claramente quem é o Devedor Fiduciante e quem é o Credor Fiduciário (por exemplo, Banco do Brasil S/A, Bradesco, Caixa, etc.)." +
      "\n3. CANCELAMENTO DE GARANTIAS E CONSOLIDAÇÃO: Verifique se houve cancelamento de gravames antigos e, crucialmente, se há Averbação de Consolidação da Propriedade (AV-) em nome do banco credor por inadimplemento (o que legitima o leilão). Liste as datas exatas destes atos." +
      "\n4. ÔNUS, BLOQUEIOS E PENHORAS: Liste toda e qualquer penhora ativa, indisponibilidade de bens, hipotecas ou processos averbados." +
      "\n\nESTRUTURA DE RETORNO OBRIGATÓRIA:" +
      "\n- **Apresente uma Tabela Cronológica de Registros e Averbações (R e AV)** contendo: Código (Ex: R-4, AV-7), Ato (Compra e Venda, Alienação, Consolidação), Partes Envolvidas (com todos os CPFs, profissões e endereços identificados) e Detalhes Importantes." +
      "\n- **Apresente uma Segunda Tabela Resumo dos Proprietários Atuais e de Direito**, deixando claro quem é o proprietário fiduciante executado e quem é o credor titular de direito (Ex: Banco do Brasil S/A). Qualquer lacuna de dados devido a digitalização fraca deve ser indicada expressamente em vez de silenciada.";
  } else if (analysisType === 'processo') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE: Analise estritamente os PROCESSOS JUDICIAIS de ponta a ponta. Identifique todos os CPF/CNPJ, nomes completos e endereços de réus, autores, executados, credores hipotecários, e cônjuges. Identifique e relate todos os processos correlacionados ou incidentes judiciais ativos, o número completo da ação judicial, a vara/juiz correspondente, e faça uma avaliação minuciosa de risco quanto a vício de citação/intimação ou recursos pendentes do executado.";
  }

  // Inject critical bidder checklist and strategic brain consultation
  specializedInstruction += "\n\nDIRETRIZ CRÍTICA DE EXECUÇÃO (MANDATÓRIO): " +
    "\n- Você DEVE consultar ativamente o CONTEXTO ESTRATÉGICO DO USUÁRIO (CÉREBRO ESTRATÉGICO) fornecido nas instruções do sistema para alinhar todas as suas decisões e análises com os padrões e lições de proteção de capital do investidor." +
    "\n- Inclua OBRIGATORIAMENTE de forma visível e muito detalhada o 'CHECKLIST DO ARREMATADOR (PML) - ANÁLISE DE VIABILIDADE' na sua resposta. Valide cada um dos 5 macro-itens do Checklist do Arrematador listando seus respectivos pontos com os status: [CONFIRMADO], [PENDENTE] ou [ATENÇÃO], acompanhados de justificativa analítica fundamentada.";

  const timeoutMessage = `Tempo limite de processamento de IA atingido (Limite de 180 segundos).

Os arquivos enviados são muito extensos ou possuem muitas imagens/páginas escaneadas não-otimizadas que sobrecarregaram o modelo de processamento da IA neste momento.

Para resolver esta lentidão de forma imediata:
1️⃣ Troque o Cérebro de IA de 'Gemini 3.1 Pro' para 'Gemini 3.5 Flash (Ultra-Rápido)' no painel lateral/superior (o modelo Flash é até 10 vezes mais rápido e altamente eficiente para múltiplos arquivos).
2️⃣ Divida processos longos ou editais grandes em fatias ou blocos menores de 15 a 25 páginas para acelerar a análise.
3️⃣ Certifique-se de que os PDFs enviados tenham texto nativo pesquisável correspondente, evitando uploads de apenas imagens escaneadas.`;

  // Crawl URLs first in parallel and hydrate files
  let analyzedFiles = [...files];
  if (Array.isArray(auctionUrls) && auctionUrls.length > 0) {
    try {
      const crawled = await Promise.all(
        auctionUrls.map(async (url) => {
          const content = await fetchUrlContent(url);
          return { url, content };
        })
      );
      
      crawled.forEach((item, index) => {
        if (item.content) {
          analyzedFiles.push({
            id: `crawl-${index}`,
            filename: `Link_Leiloeiro_Extraido_${index + 1}.txt`,
            mimeType: 'text/plain',
            extractedText: item.content,
            data: "",
            useText: true,
            optimizedText: item.content
          });
        }
      });
    } catch (crawlErr: any) {
      console.warn("[runBackendAnalysis] Erro ao rastrear links integrados:", crawlErr.message);
    }
  }

  const runTask = async () => {
    if (provider === 'gemini') {
      return analyzeWithGemini(analyzedFiles, specializedInstruction, model, apiKey, auctionUrls);
    } else if (provider === 'claude') {
      return analyzeWithClaude(analyzedFiles, specializedInstruction, model, apiKey, auctionUrls);
    } else if (provider === 'openai') {
      return analyzeWithOpenAI(analyzedFiles, specializedInstruction, model, apiKey, auctionUrls);
    } else if (provider === 'deepseek') {
      return analyzeWithDeepSeek(analyzedFiles, specializedInstruction, model, apiKey, auctionUrls);
    }
    throw new Error("Provedor não suportado.");
  };

  return withTimeout(runTask(), 180000, timeoutMessage);
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
