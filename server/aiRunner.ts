import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import axios from "axios";

const fetchUrlContent = async (url: string): Promise<string> => {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return "";
  }
  
  let cleanedUrl = url;
  try {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
    let changed = false;
    for (const key of Array.from(params.keys())) {
      if (key.startsWith('utm_') || key === 'gclid' || key === 'fbclid' || key === 'clclid') {
        params.delete(key);
        changed = true;
      }
    }
    if (changed) {
      parsed.search = params.toString();
      cleanedUrl = parsed.toString();
    }
  } catch (e) {
    // Ignore URL parsing errors and fallback to original
  }

  try {
    console.log(`[Crawler] Iniciando captura rápida de URL do leilão: ${cleanedUrl}`);
    const res = await axios.get(cleanedUrl, {
      timeout: 8000,
      maxRedirects: 5, // Prevent slow infinite redirect loops
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
    console.warn(`[Crawler Error] Erro ao buscar URL de leiloeiro ${cleanedUrl}:`, err.message);
    return `[Este link de detalhes do leilão está sob proteção do Cloudflare, exige CAPTCHA, possui redirecionamento infinito de rastreamento ou está offline temporariamente. Erro: ${err.message}. Prossiga fornecendo as diretrizes e parecer de análise com base nos outros documentos disponíveis.]`;
  }
};

const callGeminiWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1500
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorStr = (error?.message || String(error)).toLowerCase();
      const errorObjStr = JSON.stringify(error || {}).toLowerCase();
      
      const isAuthError = 
        errorStr.includes("api key not valid") || 
        errorStr.includes("invalid api key") || 
        errorStr.includes("unregistered callers") || 
        errorStr.includes("key_invalid") || 
        errorStr.includes("api_key_invalid") || 
        errorStr.includes("not authorized") ||
        errorObjStr.includes("api key not valid") ||
        errorObjStr.includes("invalid_key") ||
        errorObjStr.includes("unregistered");

      const isQuotaError = 
        error?.status === 429 ||
        errorStr.includes("429") || 
        errorStr.includes("exhausted") || 
        errorStr.includes("quota") || 
        errorStr.includes("limit") ||
        errorObjStr.includes("429") ||
        errorObjStr.includes("exhausted") ||
        errorObjStr.includes("quota") ||
        errorObjStr.includes("limit");

      const isUnavailable = 
        error?.status === 503 || 
        errorStr.includes("503") || 
        errorStr.includes("unavailable") || 
        errorStr.includes("high demand") ||
        errorStr.includes("temporary") ||
        errorStr.includes("overloaded") ||
        errorObjStr.includes("unavailable") ||
        errorObjStr.includes("503") ||
        errorObjStr.includes("overloaded");

      // Attempt retry for transient network/server overloads or temporary quotas
      if ((isUnavailable || isQuotaError) && !isAuthError && attempt < retries) {
        const sleepTime = delayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
        console.warn(`[Gemini API Retry] Chamada sob alta demanda ou limite temporário (Tentativa ${attempt}/${retries}). Aguardando ${sleepTime}ms para tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        continue;
      }
      
      if (isAuthError) {
        throw new Error(`A chave de API do Gemini configurada é inválida ou não foi autorizada (Erro original: ${error.message || error}). Por favor, verifique se inseriu a chave de API correta nas Configurações da aplicação ou se definiu a variável de ambiente GEMINI_API_KEY corretamente no seu servidor.`);
      }

      if (isQuotaError) {
        throw new Error(`A chave de API do Gemini atingiu o limite de cota de requisições (Erro 429: ${error.message || error}).`);
      }

      if (isUnavailable) {
        throw new Error(`O modelo Gemini está com demanda temporária alta nos servidores da Google (Erro 503: Service Unavailable - ${error.message || error}).`);
      }
      
      throw error;
    }
  }
};

const generateContentWithFallback = async (
  ai: any,
  primaryModel: string,
  requestPayload: any,
  retries = 2,
  delayMs = 1500
): Promise<any> => {
  const initialModel = mapModelId(primaryModel);
  // Prioritized list of valid Gemini models for graceful degradation
  const fallbackModelPool = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
  
  // Build a distinct sequence starting with the requested model
  const modelQueue: string[] = [initialModel];
  for (const m of fallbackModelPool) {
    const mapped = mapModelId(m);
    if (!modelQueue.includes(mapped)) {
      modelQueue.push(mapped);
    }
  }

  let lastError: any = null;

  for (let i = 0; i < modelQueue.length; i++) {
    const currentModel = modelQueue[i];
    try {
      console.log(`[Gemini Request] Executando chamada (${i + 1}/${modelQueue.length}) com o modelo: ${currentModel}`);
      const payloadCopy = { ...requestPayload, model: currentModel };
      return await callGeminiWithRetry(() => ai.models.generateContent(payloadCopy), retries, delayMs);
    } catch (error: any) {
      lastError = error;
      console.warn(`[Gemini Request Warning] Modelo ${currentModel} falhou:`, error?.message || error);
      
      const errorStr = (error?.message || String(error)).toLowerCase();
      const errorObjStr = JSON.stringify(error || {}).toLowerCase();
      
      const isAuthError = 
        errorStr.includes("api key not valid") || 
        errorStr.includes("invalid api key") || 
        errorStr.includes("unregistered callers") || 
        errorStr.includes("key_invalid") || 
        errorStr.includes("api_key_invalid") || 
        errorStr.includes("not authorized") ||
        errorObjStr.includes("api key not valid") ||
        errorObjStr.includes("invalid_key") ||
        errorObjStr.includes("unregistered");

      // For authentication issues, changing models will not help
      if (isAuthError) {
        throw error;
      }

      const isFileError = 
        errorStr.includes("no pages") || 
        errorStr.includes("has no pages") ||
        errorStr.includes("invalid_argument") ||
        errorStr.includes("invalid argument") ||
        errorStr.includes("unsupported mime") ||
        errorStr.includes("mime type") ||
        errorObjStr.includes("no pages") ||
        errorObjStr.includes("invalid_argument") ||
        errorObjStr.includes("mime");

      if (isFileError) {
        let hasInlineData = false;
        let contents = requestPayload?.contents;
        let contentsCopy: any = null;

        if (Array.isArray(contents)) {
          contentsCopy = contents.map((item: any) => {
            if (item && Array.isArray(item.parts)) {
              const cleanedParts = item.parts.map((part: any) => {
                if (part && part.inlineData) {
                  hasInlineData = true;
                  return { 
                    text: `[Documento binário omitido devido a erro de leitura de formato ou ausência de páginas: ${part.inlineData.mimeType || 'PDF/Imagem'}. Prossiga fornecendo as orientações gerais possíveis.]` 
                  };
                }
                return part;
              });
              return { ...item, parts: cleanedParts };
            }
            return item;
          });
        } else if (contents && Array.isArray(contents.parts)) {
          const cleanedParts = contents.parts.map((part: any) => {
            if (part && part.inlineData) {
              hasInlineData = true;
              return { 
                text: `[Documento binário omitido devido a erro de leitura de formato ou ausência de páginas: ${part.inlineData.mimeType || 'PDF/Imagem'}. Prossiga fornecendo as orientações gerais possíveis.]` 
              };
            }
            return part;
          });
          contentsCopy = { ...contents, parts: cleanedParts };
        }

        if (hasInlineData && contentsCopy) {
          console.warn(`[Gemini Request Fallback] Erro de leitura de arquivo detectado. Convertendo inlineData para texto e tentando novamente com ${currentModel}...`);
          try {
            return await callGeminiWithRetry(() => ai.models.generateContent({ ...requestPayload, contents: contentsCopy, model: currentModel }), retries, delayMs);
          } catch (fallbackError) {
            console.error("[Gemini Request Fallback] Falha no retry sem inlineData:", fallbackError);
          }
        }
      }

      // If more models exist in queue, smoothly continue to the next model
      if (i < modelQueue.length - 1) {
        const nextModel = modelQueue[i + 1];
        console.warn(`[Gemini Fallback Triggered] Modelo ${currentModel} indisponível ou com erro. Tentando fallback automático para: ${nextModel}...`);
        continue;
      }
    }
  }

  throw lastError;
};

export const transcribeDocumentToMarkdown = async (
  buffer: Buffer,
  mimeType: string,
  filename: string = "documento.pdf"
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[OCR Transcribe] GEMINI_API_KEY não configurada no servidor.");
    return "";
  }

  try {
    console.log(`[OCR Transcribe] Iniciando OCR / Transcrição para Markdown de "${filename}" (${(buffer.length / 1024).toFixed(1)} KB)...`);
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const base64Data = buffer.toString("base64");
    
    let effectiveMime = mimeType || 'application/pdf';
    const lowerFn = (filename || '').toLowerCase();
    if (lowerFn.endsWith('.pdf') || effectiveMime.includes('pdf')) {
      effectiveMime = 'application/pdf';
    } else if (lowerFn.endsWith('.jpg') || lowerFn.endsWith('.jpeg') || effectiveMime.includes('jpeg') || effectiveMime.includes('jpg')) {
      effectiveMime = 'image/jpeg';
    } else if (lowerFn.endsWith('.png') || effectiveMime.includes('png')) {
      effectiveMime = 'image/png';
    } else if (lowerFn.endsWith('.webp') || effectiveMime.includes('webp')) {
      effectiveMime = 'image/webp';
    }

    const prompt = `Você é um especialista sênior em OCR avançado, visão computacional e transcrição documental de processos judiciais, cartórios de imóveis e tribunais de justiça no Brasil.
Sua missão é realizar a TRANSCRIÇÃO OCR EXATA, NA ÍNTEGRA, COMPLETA E SEM OMISSÕES deste documento ("${filename}") para o formato MARKDOWN limpo, organizado e estruturado.

DIRETRIZES DE TRANSCRIÇÃO OBRIGATÓRIAS PARA PROCESSO JUDICIAL E DOCUMENTOS:
1. LEIA E TRANSCREVA ABSOLUTAMENTE TUDO visível em TODAS as páginas (incluindo páginas antigas escaneadas, manuscritos, carimbos e selos):
   - Em Peças do Processo Judicial: transcreva todos os números de folhas (fls.), petições iniciais e intermediárias, certidões de citação e intimação, autos de penhora e avaliação, decisões interlocutórias, despachos, sentenças, recursos (agravos, apelações, embargos à execução/adjudicação), editais de leilão, nomes das partes, CPFs e valores.
   - Na Matrícula de Imóvel: transcreva o cabeçalho do Cartório, número da matrícula, ficha, CNM, descrição completa do imóvel, proprietários anteriores e atuais, registros (R-1, R-2, R-3...), averbações (AV-1, AV-2, AV-3...), gravames (hipotecas, penhoras, alienações fiduciárias, consolidação da propriedade, leilões negativos), cancelamentos, certidão final do escrevente/oficial e selo de fiscalização.
2. NUNCA resuma, abrevie ou omita partes alegando que "o documento continua" ou "conteúdo omitido". Transcreva cada parágrafo, despacho, carimbo, selo ou manuscrito legível.
3. Estruture com títulos Markdown nítidos:
   # Documento: ${filename}
   ## Página / Folha [Número/Fls.]
   ### [Petição / Decisão / Certidão / Registro Exato]
4. Mantenha as datas, números dos atos, CPFs/CNPJs e valores monetários (R$) exatamente como impressos no documento.
5. Retorne APENAS o texto transcrevido em Markdown, sem saudações ou explicações fora do documento.`;

    const requestPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: effectiveMime,
                data: base64Data
              }
            },
            { text: prompt }
          ]
        }
      ]
    };

    const response = await generateContentWithFallback(ai, 'gemini-3.7-flash', requestPayload);
    const transcribedText = response?.text?.trim() || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n')?.trim() || "";
    console.log(`[OCR Transcribe] Transcrição para Markdown concluída com sucesso para "${filename}". Tamanho: ${transcribedText.length} caracteres.`);
    return transcribedText;
  } catch (err: any) {
    console.error(`[OCR Transcribe] Erro ao transcrever documento "${filename}" com Gemini:`, err.message);
    return "";
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
    'gemini-3.7-flash': 'gemini-3.7-flash',
    'gemini-3.5-flash': 'gemini-3.7-flash',
    'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
    'gemini-3.1-flash-preview': 'gemini-3.7-flash',
    'gemini-3-flash-preview': 'gemini-3.7-flash',
    'gemini-flash-latest': 'gemini-flash-latest',
    'gemini-2.5-pro': 'gemini-3.1-pro-preview',
    'gemini-2.5-flash': 'gemini-3.7-flash',
    'gemini-2.0-flash': 'gemini-3.7-flash',
    'gemini-1.5-flash': 'gemini-3.7-flash',
    'gemini-1.5-pro': 'gemini-3.1-pro-preview',
    
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
  // Increased budget to 30MB to allow processing of larger documents (PDFs and images) safely.
  return 30 * 1024 * 1024;
};

const optimizePayload = (files: any[], budget: number, model?: string) => {
  const isMultiModalProvider = model ? (model.startsWith('gemini') || model.startsWith('claude')) : true;

  let currentFiles = files.map(f => {
    const hasData = !!f.data && f.data !== "" && f.data !== "null" && f.data !== "undefined";
    const hasText = !!f.extractedText && f.extractedText.trim().length > 0;
    
    // We check if it is a heavy binary (PDF or Image).
    let limit = 25 * 1024 * 1024; // 25MB limit for images and base64 PDFs
    if (f.mimeType === 'application/pdf') {
      limit = 30 * 1024 * 1024; // 30MB limit for PDFs
    }
    
    const isBase64TooLarge = hasData && f.data.length > limit;
    
    // For multimodal models (Gemini), if base64 binary is available and within size limits,
    // PREFER sending the binary (inlineData PDF) so Gemini can visually read all pages, stamps, and tables.
    // Only fall back to text-only mode if no binary data exists or if the binary exceeds size limits.
    let useText = !hasData || isBase64TooLarge || !isMultiModalProvider;
    
    if ((f.mimeType?.startsWith('text/') || f.mimeType?.includes('txt')) && hasText) {
      useText = true;
    }

    let optimizedText = "";
    
    if (hasText) {
      optimizedText = f.extractedText.length > 100000 
        ? f.extractedText.substring(0, 100000) + "\n... [Texto truncado por tamanho] ..." 
        : f.extractedText;
    } else if (isBase64TooLarge) {
      if (f.mimeType === 'application/pdf') {
        optimizedText = `[AVISO INTERNO: O arquivo PDF '${f.filename || 'Documento'}' excedeu o tamanho máximo de ${(limit / (1024 * 1024)).toFixed(1)}MB para análise rápida por imagem e foi convertido para texto de aviso para evitar timeout da rede. Por favor, forneça o melhor parecer técnico possível focando nos demais documentos e regras gerais.]`;
      } else {
        optimizedText = `[AVISO INTERNO: A imagem '${f.filename || 'Documento'}' é muito pesada (${(f.data.length / (1024 * 1024)).toFixed(1)}MB) e foi omitida para otimizar o tempo de resposta da rede. Prossiga fornecendo as orientações gerais possíveis.]`;
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

  // 1. Convert heavy binary files (useText === false) to text placeholders first, from largest to smallest,
  // to maximize the preservation of actual text content in text files.
  const binaryFiles = currentFiles
    .map((f, i) => ({ index: i, size: f.data?.length || 0, filename: f.filename, mimeType: f.mimeType }))
    .filter(f => !currentFiles[f.index].useText)
    .sort((a, b) => b.size - a.size);

  for (const item of binaryFiles) {
    const f = currentFiles[item.index];
    f.useText = true;
    f.optimizedText = `[AVISO DO SISTEMA: O arquivo original '${item.filename || 'Documento'}' (${(item.size / (1024 * 1024)).toFixed(1)}MB) era muito grande e foi convertido para texto de aviso para evitar timeout na rede. Forneça o melhor parecer técnico possível focando nas demais informações.]`;
    
    currentSize = calculateSize(currentFiles);
    if (currentSize <= budget) break;
  }

  // 2. If we are STILL above the budget, truncate the largest text files until we fit.
  if (currentSize > budget) {
    const textOnlyIndices = currentFiles
      .map((f, i) => ({ index: i, size: f.optimizedText?.length || 0 }))
      .filter(f => currentFiles[f.index].useText)
      .sort((a, b) => b.size - a.size);

    for (const item of textOnlyIndices) {
      const reductionNeeded = currentSize - budget;
      const currentTextSize = currentFiles[item.index].optimizedText.length;
      if (currentTextSize <= 1000) continue;

      const newSize = Math.max(1000, currentTextSize - reductionNeeded);
      currentFiles[item.index].optimizedText = currentFiles[item.index].optimizedText.substring(0, newSize) + "\n... [Texto truncado para caber no limite da API] ...";
      
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
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const mappedModel = mapModelId(model);
  const budget = getPayloadBudget(model);
  const optimizedFiles = optimizePayload(files, budget, model);
  const finalSize = optimizedFiles.reduce((acc, f) => acc + (f.useText ? (f.optimizedText?.length || 0) : (f.data?.length || 0)), 0);

  if (finalSize > budget + (1 * 1024 * 1024)) {
    throw new Error(`O volume de dados (${(finalSize / (1024 * 1024)).toFixed(1)}MB) excede o limite técnico de ${budget / (1024 * 1024)}MB mesmo após otimização extrema.`);
  }

  const parts = optimizedFiles.flatMap(file => {
    const fileParts: any[] = [];
    
    // 1. If OCR transcribed text is available, always include it as a rich text part so Gemini reads 100% of transcribed pages & text
    if (file.extractedText && file.extractedText.trim().length > 0) {
      fileParts.push({
        text: `[DOCUMENTO TRANSCRITO VIA OCR IA - CONTEÚDO ÍNTEGRO DE "${file.filename || 'Processo Judicial'}"]\n${file.optimizedText || file.extractedText}`
      });
    } else if (file.useText && file.optimizedText) {
      fileParts.push({
        text: `[Documento: ${file.filename || file.mimeType} - Conteúdo Extraído]\n${file.optimizedText}`
      });
    }

    // 2. If base64 binary is available and not flagged as too large, ALSO include the visual file binary
    if (file.data && !file.useText) {
      fileParts.push({
        inlineData: {
          data: file.data.includes(',') ? file.data.split(',')[1] : file.data,
          mimeType: file.mimeType || 'application/pdf'
        }
      });
    }

    // Fallback if neither was added
    if (fileParts.length === 0) {
      fileParts.push({
        text: `[Arquivo: ${file.filename || file.mimeType}]`
      });
    }

    return fileParts;
  });

  let promptText = "Analise os documentos de leilão fornecidos seguindo as instruções do sistema.";
  if (auctionUrls && auctionUrls.length > 0) {
    promptText += `\n\nAlém dos documentos, acesse as seguintes páginas do leilão para obter informações atualizadas:\n${auctionUrls.join('\n')}`;
  }

  const config: any = {
    systemInstruction,
    temperature: 0.2,
  };

  const response = await generateContentWithFallback(ai, mappedModel, {
    contents: {
      parts: [
        ...parts,
        { text: promptText }
      ]
    },
    config
  });

  return response.text || "";
};

const analyzeWithClaude = async (files: any[], systemInstruction: string, model: string, apiKey: string, auctionUrls?: string[]) => {
  const anthropic = new Anthropic({ apiKey });
  const mappedModel = mapModelId(model);
  const budget = getPayloadBudget(model);
  const optimizedFiles = optimizePayload(files, budget, model);
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
  const optimizedFiles = optimizePayload(files, budget, model);
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
  const optimizedFiles = optimizePayload(files, budget, model);
  
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
    specializedInstruction += "\n\nCRUCIAL - RETORNO DE DADOS ESTRUTURADOS (MANDATÓRIO):" +
      "\nNo final do seu texto de análise do edital, adicione OBRIGATORIAMENTE um bloco com a tag `<analysis_data>` contendo um objeto JSON válido correspondente às informações extraídas do edital do leilão." +
      "\nNão invente nem use placeholders se a informação não constar; retorne valores em branco ou omitidos." +
      "\nImportante: Certifique-se de fechar a tag `</analysis_data>` após o JSON." +
      "\nUse exatamente o seguinte esquema JSON:" +
      "\n{" +
      "\n  \"kpis\": {" +
      "\n    \"avaliacao\": \"R$ ...\"," +
      "\n    \"lance_minimo\": \"...%\"," +
      "\n    \"lance_minimo_subtexto\": \"...%\"," +
      "\n    \"comissao_leiloeiro\": \"5%\"," +
      "\n    \"primeira_praca\": \"YYYY-MM-DD\"," +
      "\n    \"segunda_praca\": \"YYYY-MM-DD\"" +
      "\n  }," +
      "\n  \"valores_lances\": {" +
      "\n    \"valor_avaliacao\": \"R$ ...\"," +
      "\n    \"lance_minimo_1a_praca\": \"...%\"," +
      "\n    \"lance_minimo_2a_praca\": \"...%\"," +
      "\n    \"percentual_minimo_2a_praca\": \"...%\"," +
      "\n    \"forma_leilao\": \"Eletrônico|Presencial|Misto\"" +
      "\n  }," +
      "\n  \"condicoes_pagamento\": {" +
      "\n    \"permite_parcelamento\": \"Sim|Não\"," +
      "\n    \"entrada_minima\": \"...%\"," +
      "\n    \"num_max_parcelas\": \"...\"," +
      "\n    \"correcao_parcelas\": \"...\"," +
      "\n    \"garantias_exigidas\": \"...\"," +
      "\n    \"formas_pagamento\": \"... YYYY-MM-DD ou À vista ...\"," +
      "\n    \"prazo_pagamento\": \"...\"," +
      "\n    \"parcelamento_especifico\": \"...\"," +
      "\n    \"tem_desconto_vista\": \"Sim|Não|Não informado\"," +
      "\n    \"percentual_desconto_vista\": \"X%|Não aplicável\"," +
      "\n    \"condicoes_diferenciadas\": \"...\"" +
      "\n  }," +
      "\n  \"comissao_leiloeiro_detalhe\": {" +
      "\n    \"percentual\": \"...%\"," +
      "\n    \"quem_paga\": \"Arrematante|Comitente\"," +
      "\n    \"momento_pagamento\": \"...\"" +
      "\n  }," +
      "\n  \"responsabilidade_dividas\": {" +
      "\n    \"propter_rem_no_edital\": \"Sim|Não\"," +
      "\n    \"sub_rogacao_no_preco\": \"Sim|Não\"," +
      "\n    \"responsabilidade_propter_rem\": \"...\"" +
      "\n  }," +
      "\n  \"situacao_juridica\": {" +
      "\n    \"onus_reais\": [\"...\"]" +
      "\n  }," +
      "\n  \"penalidades_desistencia\": {" +
      "\n    \"multa_inadimplencia\": \"...%\"," +
      "\n    \"perda_sinal\": \"...\"," +
      "\n    \"permite_desistencia\": \"Sim|Não|...\"," +
      "\n    \"penalidades_desistencia_detalhe\": \"...\"" +
      "\n  }," +
      "\n  \"datas_importantes\": {" +
      "\n    \"publicacao_edital\": \"YYYY-MM-DD\"," +
      "\n    \"primeira_praca\": \"YYYY-MM-DD\"," +
      "\n    \"segunda_praca\": \"YYYY-MM-DD\"," +
      "\n    \"inicio_lances\": \"YYYY-MM-DD HH:MM\"," +
      "\n    \"fim_lances\": \"YYYY-MM-DD HH:MM\"" +
      "\n  }," +
      "\n  \"identificacao_leilao\": {" +
      "\n    \"titulo\": \"...\", " +
      "\n    \"tipo_leilao\": \"Judicial|Extrajudicial|Administrativo\"," +
      "\n    \"modalidade\": \"Eletrônico|Presencial\"," +
      "\n    \"orgao_origem\": \"...\", " +
      "\n    \"processo\": \"...\", " +
      "\n    \"vara\": \"...\", " +
      "\n    \"comarca\": \"...\", " +
      "\n    \"tribunal\": \"...\"" +
      "\n  }," +
      "\n  \"leiloeiro_plataforma\": {" +
      "\n    \"leiloeiro\": \"...\", " +
      "\n    \"matricula_leiloeiro\": \"...\", " +
      "\n    \"telefone\": \"...\", " +
      "\n    \"email\": \"...\", " +
      "\n    \"site\": \"...\", " +
      "\n    \"plataforma\": \"...\", " +
      "\n    \"url_plataforma\": \"...\"" +
      "\n  }," +
      "\n  \"caracteristicas_imovel_edital\": {" +
      "\n    \"tipo_imovel\": \"...\", " +
      "\n    \"area_total\": \"...\", " +
      "\n    \"quartos\": \"...\", " +
      "\n    \"andar\": \"...\", " +
      "\n    \"uso_destinado\": \"Residencial|Comercial\", " +
      "\n    \"descricao_edital\": \"...\", " +
      "\n    \"endereco\": \"...\", " +
      "\n    \"matricula\": \"...\", " +
      "\n    \"cartorio\": \"...\", " +
      "\n    \"comarca_matricula\": \"...\"" +
      "\n  }," +
      "\n  \"clausulas_observacoes\": {" +
      "\n    \"clausulas_relevantes\": [\"...\"]," +
      "\n    \"observacoes_edital\": [\"...\"]" +
      "\n  }" +
      "\n}";
  } else if (analysisType === 'matricula') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE (MANDATÓRIO):" +
      "\nAnalise estritamente toda a MATRÍCULA DO IMÓVEL folha por folha, prestando atenção prioritária aos atos registrados sob as siglas 'R-' (Registro) e 'AV-' (Averbação)." +
      "\nVocê deve identificar e expor obrigatoriamente:" +
      "\n1. LOCALIZAÇÃO E CARTÓRIO EXATOS (CRÍTICO): Identifique com precisão absoluta o Estado (UF), Comarca, Cidade e o Cartório de Registro de Imóveis do lote específico analisado. Nunca assuma 'São Paulo' ou 'SP' ou qualquer outro local se não estiver expressamente indicado no texto para este lote específico. Erros de localização geográfica são gravíssimos." +
      "\n2. DIMENSÕES E METRAGEM (ÁREAS): Extraia com rigor as metragens (Área Total, Área Útil, Área Construída, Área do Terreno e Fração Ideal) e a descrição física. Não use placeholders ou valores fictícios." +
      "\n3. HISTÓRICO COMPLETO DE PROPRIETÁRIOS: Identifique TODOS os adquirentes, proprietários antigos e atuais mencionados nos registros de Compra e Venda (R-). Extraia: Nome Completo, CPF/CNPJ, Estado Civil, Cônjuge (se houver), Profissão, e Endereço Completo de residência." +
      "\n4. GARANTIAS E FIDUCIÁRIOS: Mapeie qualquer Alienação Fiduciária (geralmente sob R- ou AV-), apontando claramente quem é o Devedor Fiduciante e quem é o Credor Fiduciário (por exemplo, Banco do Brasil S/A, Bradesco, Caixa, etc.)." +
      "\n5. CANCELAMENTO DE GARANTIAS E CONSOLIDAÇÃO: Verifique se houve cancelamento de gravames antigos e, crucialmente, se há Averbação de Consolidação da Propriedade (AV-) em nome do banco credor por inadimplemento (o que legitima o leilão). Liste as datas exatas destes atos." +
      "\n6. ÔNUS, BLOQUEIOS E PENHORAS: Liste toda e qualquer penhora ativa, indisponibilidade de bens, hipotecas ou processos averbados." +
      "\n\nESTRUTURA DE RETORNO OBRIGATÓRIA:" +
      "\n- **Apresente uma Tabela Cronológica de Registros e Averbações (R e AV)** contendo: Código (Ex: R-4, AV-7), Ato (Compra e Venda, Alienação, Consolidação), Partes Envolvidas (com todos os CPFs, profissões e endereços identificados) e Detalhes Importantes." +
      "\n- **Apresente uma Segunda Tabela Resumo dos Proprietários Atuais e de Direito**, deixando claro quem é o proprietário fiduciante executado e quem é o credor titular de direito (Ex: Banco do Brasil S/A). Qualquer lacuna de dados devido a digitalização fraca deve ser indicada expressamente em vez de silenciada." +
      "\n\nCRUCIAL - RETORNO DE DADOS ESTRUTURADOS (MANDATÓRIO):" +
      "\nNo final do seu texto de análise da matrícula, adicione OBRIGATORIAMENTE um bloco com a tag `<analysis_data>` contendo um objeto JSON válido correspondente às informações extraídas do imóvel." +
      "\nNão invente nem use placeholders se a informação não constar; retorne valores em branco ou omitidos." +
      "\nImportante: Certifique-se de fechar a tag `</analysis_data>` após o JSON." +
      "\nUse exatamente o seguinte esquema JSON:" +
      "\n{" +
      "\n  \"kpis\": {" +
      "\n    \"num_vendas\": 2," +
      "\n    \"ultimo_venda_valor\": \"R$ 1.800.000,00\"," +
      "\n    \"num_onus_ativos\": 1," +
      "\n    \"num_processos_judiciais\": 1" +
      "\n  }," +
      "\n  \"proprietario_atual\": [\"Nome(s) Completo(s)\"]," +
      "\n  \"proprietarios_anteriores\": [" +
      "\n    {\"nome\": \"Nome Anterior\", \"documento\": \"CPF/CNPJ\"}" +
      "\n  ]," +
      "\n  \"valores_transacao\": [" +
      "\n    {\"valor\": \"R$ ...\", \"data\": \"dia-mes-ano\"}" +
      "\n  ]," +
      "\n  \"imovel_tipo\": \"Tipo do Imóvel\"," +
      "\n  \"localizacao_resumo\": \"Cidade/UF\"," +
      "\n  \"identificacao_matricula\": {" +
      "\n    \"numero_matricula\": \"...\", " +
      "\n    \"cartorio\": \"...\", " +
      "\n    \"comarca\": \"...\", " +
      "\n    \"uf\": \"...\", " +
      "\n    \"livro\": \"...\"" +
      "\n  }," +
      "\n  \"caracteristicas_fisicas\": {" +
      "\n    \"tipo_imovel\": \"...\", " +
      "\n    \"categoria\": \"RESIDENCIAL|COMERCIAL|etc\"," +
      "\n    \"endereco\": \"...\", " +
      "\n    \"area_total\": \"...\", " +
      "\n    \"fracao_ideal\": \"...\", " +
      "\n    \"unidade_autonoma\": \"...\", " +
      "\n    \"valor_fiscal\": \"... R$ ... (Valor Fiscal, Venal, Referência ou de Lançamento se constar)\", " +
      "\n    \"descricao_completa\": \"...\"" +
      "\n  }," +
      "\n  \"condominio\": {" +
      "\n    \"nome\": \"...\"" +
      "\n  }," +
      "\n  \"cadeia_registral\": [" +
      "\n    {\"tipo\": \"REGISTRO|AVERBACAO\", \"data\": \"...\", \"valor\": \"R$ ...\", \"descricao\": \"...\", \"partes\": \"...\", \"natureza\": \"...\", \"impacto\": \"...\"}" +
      "\n  ]," +
      "\n  \"proprietarios_e_partes\": {" +
      "\n    \"atuais\": [{\"nome\": \"...\", \"documento\": \"...\", \"tipo\": \"PF|PJ\", \"participacao\": \"...\", \"estado_civil\": \"...\", \"regime\": \"...\", \"detalhes\": \"...\"}]," +
      "\n    \"anteriores\": [{\"nome\": \"...\", \"documento\": \"...\", \"tipo\": \"PF|PJ\", \"detalhes\": \"...\"}]," +
      "\n    \"credores\": [{\"nome\": \"...\", \"documento\": \"...\", \"tipo\": \"PF|PJ\", \"detalhes\": \"...\"}]" +
      "\n  }," +
      "\n  \"onus_gravames\": [" +
      "\n    {\"tipo\": \"PENHORA|HIPOTECA|ALIENACAO|OUTROS\", \"status\": \"ATIVO|BAIXADO\", \"subtipo\": \"LEILÃO|etc\", \"prioridade\": \"ALTO|MEDIO|BAIXO\", \"valor\": \"R$ ...\", \"credor\": \"...\", \"devedor\": \"...\", \"data_constituicao\": \"...\"}" +
      "\n  ]," +
      "\n  \"restricoes_clausulas\": {" +
      "\n    \"inalienabilidade\": \"Sim|Não\", \"impenhorabilidade\": \"Sim|Não\", \"incomunicabilidade\": \"Sim|Não\"" +
      "\n  }," +
      "\n  \"eventos_leilao\": [" +
      "\n    {\"tipo\": \"...\", \"data\": \"...\", \"status\": \"...\", \"descricao\": \"...\", \"impacto_atual\": \"...\"}" +
      "\n  ]," +
      "\n  \"processos_judiciais\": [" +
      "\n    {\"numero\": \"...\", \"natureza\": \"...\", \"vara_comarca\": \"...\", \"fase\": \"...\", \"partes\": \"...\", \"impacto\": \"...\"}" +
      "\n  ]," +
      "\n  \"alertas\": {" +
      "\n    \"problemas_arrematacao\": \"...\", \"pendencias_juridicas\": \"...\", \"pontos_atencao\": \"...\"" +
      "\n  }," +
      "\n  \"qualidade_analise\": {" +
      "\n    \"qualidade_ocr\": \"BOA|REGULAR|RUIM\", \"confianca_extracao\": \"ALTO|MEDIO|BAIXO\", \"data_analise\": \"...\", \"arquivo_analisado\": \"...\"" +
      "\n  }" +
      "\n}";
  } else if (analysisType === 'processo') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE: Analise estritamente os PROCESSOS JUDICIAIS de ponta a ponta. Identifique todos os CPF/CNPJ, nomes completos e endereços de réus, autores, executados, credores hipotecários, e cônjuges. Identifique e relate todos os processos correlacionados ou incidentes judiciais ativos, o número completo da ação judicial, a vara/juiz correspondente, e faça uma avaliação minuciosa de risco quanto a vício de citação/intimação ou recursos pendentes do executado.";
    specializedInstruction += "\n\nCRUCIAL - RETORNO DE DADOS ESTRUTURADOS (MANDATÓRIO):" +
      "\nNo final do seu texto de análise do processo, adicione OBRIGATORIAMENTE um bloco com a tag `<analysis_data>` contendo um objeto JSON válido correspondente às informações extraídas do processo judicial." +
      "\nNão invente nem use placeholders se a informação não constar; retorne valores em branco ou omitidos." +
      "\nImportante: Certifique-se de fechar a tag `</analysis_data>` após o JSON." +
      "\nUse exatamente o seguinte esquema JSON:" +
      "\n{" +
      "\n  \"processo_principal\": {" +
      "\n    \"numero_processo\": \"...\"," +
      "\n    \"executante\": \"... Código / Nome / CPF-CNPJ / Advogados ...\"," +
      "\n    \"executado\": \"... Código / Nome / CPF-CNPJ / Advogados / Cônjuge ...\"," +
      "\n    \"terceiros_interessados\": \"...\"," +
      "\n    \"motivacao_judicial\": \"... Cobrança de condomínio | Execução de contrato | Execução fiscal ...\"," +
      "\n    \"segredo_justica\": \"Sim|Não\"," +
      "\n    \"principais_pecas\": [" +
      "\n      { \"peca\": \"...\", \"pagina\": \"...\", \"descricao\": \"...\" }" +
      "\n    ]" +
      "\n  }," +
      "\n  \"acoes_ex_mutuario\": {" +
      "\n    \"acoes_localizadas\": [" +
      "\n      { \"processo\": \"...\", \"tribunal\": \"...\", \"tipo\": \"...\", \"risco\": \"ALTO|MÉDIO|BAIXO\", \"motivacao_risco\": \"...\", \"status\": \"...\" }" +
      "\n    ]," +
      "\n    \"risco_geral_acoes\": \"ALTO|MÉDIO|BAIXO\"," +
      "\n    \"comentarios_pesquisa\": \"...\"" +
      "\n  }," +
      "\n  \"gravames_matricula_processo\": {" +
      "\n    \"gravames_analisados\": [" +
      "\n      { \"gravame\": \"... R-4 ou R-5 / Hipoteca / Penhora ...\", \"possui_risco\": \"Sim|Não\", \"analise\": \"...\" }" +
      "\n    ]" +
      "\n  }," +
      "\n  \"averbacao_area_construida\": {" +
      "\n    \"imovel_e_casa\": true|false," +
      "\n    \"status_averbacao\": \"Totalmente averbada|Parcialmente averbada|Não averbada|Não aplicável (apartamento)\"," +
      "\n    \"idade_construcao_anos\": \"...\"," +
      "\n    \"prescricao_iss_5_anos\": \"Sim (Prescreveu - sem ISS)|Não|Pendente de verificação\"," +
      "\n    \"estimativa_custos_regularizacao\": \"... R$ ...\"," +
      "\n    \"detalhes_regularizacao\": \"... Custos com engenheiro, taxas da prefeitura, etc ...\"" +
      "\n  }" +
      "\n}";
  } else if (analysisType === 'dossier') {
    specializedInstruction += "\n\nFOCO COMPLEMENTAR DE ALTÍSSIMA PRIORIDADE: Você é um ASSESSOR DE ARREMATAÇÃO E INTELIGÊNCIA JURÍDICO-FINANCEIRA SÊNIOR." +
      "\nSeu objetivo é gerar um DOSSIÊ DE ARREMATAÇÃO INTEGRADO E ALTAMENTE INTELIGENTE a partir de todos os documentos anexados (Edital, Matrícula, Processo e links/conteúdos extras)." +
      "\nSua resposta DEVE ser estruturada de forma impecável, usando Markdown rico e tabelas bonitas, cobrindo com precisão absoluta as 3 grandes seções descritas abaixo:" +
      "\n\n### 1. SEÇÃO DE VIABILIDADE" +
      "\n- **Cadastro do Leiloeiro**: Consultar e relatar informações do site/lista do leiloeiro ou edital, verificando se há sinais óbvios de golpe, se o leiloeiro é oficial/registrado e link de acesso direto para auditoria." +
      "\n- **Cadastro do Arrematante**: Prazos de habilitação prévia exigidos pelo leiloeiro (ex: habilitar com 24h ou 48h de antecedência) e regras de segurança." +
      "\n- **Forma de Pagamento**: Detalhar se permite à vista ou parcelado (sinal mínimo, parcelamento em até quantas vezes, incidência de correção monetária ou juros) e se há algum desconto percentual explícito." +
      "\n- **Comissão do Leiloeiro**: Porcentagem exata (geralmente 5%) e outras taxas de intermediação." +
      "\n- **Evicção**: Análise expressa se o edital prevê explicitamente a renúncia ou a garantia pelo direito de evicção (risco em caso de anulação do leilão)." +
      "\n- **Coerência da Descrição do Bem**: Fazer o cruzamento exato das informações do edital, do site do leiloeiro e da matrícula. Reporte qualquer incompatibilidade física de áreas, numeração ou logradouro." +
      "\n- **Vaga de Garagem**: Identificar na matrícula se a vaga possui matrícula própria ou se está integrada, se há custos associados ou se há pendência de identificação (geralmente necessitando validação com síndico)." +
      "\n- **Débitos Proponente e Responsabilidade**: Quem responde pelo condomínio, IPTU e outras pendências pretéritas de forma explícita? Há cláusula de sub-rogação dos débitos no preço do lance (CTN art 130)?" +
      "\n- **Análise sobre a Localização e Vizinhança**: Faça uma síntese inteligente sobre o endereço do imóvel mapeado nos documentos, avaliando em aproximadamente 20 linhas a região, facilidades de transporte, comércio, segurança, escolas, saúde, lazer e outros prós e contras visíveis." +
      "\n\n### 2. SEÇÃO FINANCEIRA" +
      "\n- **Análise de Mercado**: Compilado sugerido de valores com base em amostras encontradas em portais ou relatórios, liquidez estimada e preço sugerido de revenda/mercado." +
      "\n- **Sugestão de Lances e ROIs (Calculadora Smart)**: Estimar limites seguros para lance inicial, intermediário e teto máximo de arrematação. Apresentar os ROIs simulados comparando a modalidade de assessoria tradicional vs modelo estratégico 'caixa forte'." +
      "\n\n### 3. SEÇÃO JURÍDICA" +
      "\n- **Processo Principal / Execução**: Mapear o número do processo que originou a execução, Vara/Comarca judiciária, partes envolvidas (Executante, Executado/Ex-Mutuário, Terceiros interessados), motivação do leilão (ex: cobrança de cotas condominiais, execução de hipoteca) e páginas/peças principais que documentam a regularidade processual." +
      "\n- **Pesquisa Processual de Distribuidores (TRF/TJ)**: Analisar ocorrência de outras ações ativas contra o executado/ex-mutuário (TJ local, TRF correspondente), CPFs/CNPJs localizados, e se essas demandas trazem riscos reais ou reflexos de penhoras no bem arrematado." +
      "\n- **Gravames de Matrícula**: Identificar detalhadamente os principais gravames ativos (penhoras, hipotecas, indisponibilidades, servidões) com sua respectiva classificação de risco para o arrematante." +
      "\n- **Averbação do Imóvel**: Detalhar se a construção está totalmente averbada na matrícula. Se houver divergência entre a área construída do edital municipal e a matrícula, calcular a estimativa de custos de regularização prévia perante o cartório e incidência de ISS." +
      "\n\nSiga estritamente estes pontos para dar ao investidor de arrematação uma visão clara e cirúrgica para que ele possa alimentar o sistema de cadastro e lances com 100% de firmeza.";
  }

  // Inject critical bidder checklist and strategic brain consultation
  specializedInstruction += "\n\nDIRETRIZ CRÍTICA DE EXECUÇÃO (MANDATÓRIO): " +
    "\n- Você DEVE consultar ativamente o CONTEXTO ESTRATÉGICO DO USUÁRIO (CÉREBRO ESTRATÉGICO) fornecido nas instruções do sistema para extrair as lições, diretrizes e checklists de todos os professores, cursos e documentos cadastrados." +
    "\n- Em vez de se limitar estritamente a um único checklist rígido (como o PML), consolide todos os conhecimentos, checklists e estratégias presentes no Cérebro de forma natural e integrada. Gere um 'CHECKLIST CONSOLIDADO DE VIABILIDADE JURÍDICA E ESTRATÉGICA' contendo as principais regras de proteção de capital lidas no seu Cérebro Estratégico, atribuindo os status [CONFIRMADO], [PENDENTE] ou [ATENÇÃO] de maneira altamente fluida, natural e profissional.";

  const timeoutMessage = `Tempo limite de processamento de IA atingido (Limite de 300 segundos).

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

  return withTimeout(runTask(), 300000, timeoutMessage);
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
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const budget = getPayloadBudget(model);
    const optimizedFiles = optimizePayload(files, budget, model);

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

    const response = await generateContentWithFallback(ai, mappedModel, {
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
    });

    const text = response.text || "{}";
    return safeParseJSON(text);
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
    return safeParseJSON(content);
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
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await generateContentWithFallback(ai, mappedModel, {
      contents: contents as any,
      config: { systemInstruction }
    });

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

export const extractProcessDetailsFromText = async (
  text: string,
  apiKey: string
): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const prompt = `Analise o texto extraído de um processo judicial abaixo e extraia as seguintes informações estruturadas de forma precisa em formato JSON:
1. número do processo (cnj_number) no formato padrão CNJ (ex: 1017459-42.2025.8.26.0577).
2. tribunal (court), ex: TJSP, TJMG, etc.
3. classe judicial (class), ex: Ação Anulatória de Execução Extrajudicial, etc.
4. assunto (subject), ex: Alienação Fiduciária, etc.
5. órgão julgador ou vara (chamber), ex: 6ª Vara Cível da Comarca de São José dos Campos/SP.
6. partes do processo (parties) no formato "Autor vs Réu" (ex: Benito Felix da Silva vs Banco Santander (Brasil) S/A).
7. última movimentação relevante ou status identificado (last_movement), ex: Petição inicial protocolada, liminar deferida, etc.

Retorne APENAS o objeto JSON puro, sem formatação de bloco de código markdown, sem explicações, seguindo exatamente este modelo:
{
  "cnj_number": "...",
  "court": "...",
  "class": "...",
  "subject": "...",
  "chamber": "...",
  "parties": "...",
  "last_movement": "..."
}

Texto do processo:
${text.substring(0, 15000)}`;

    const response = await generateContentWithFallback(ai, 'gemini-3.7-flash', {
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const resText = response.text || "";
    console.log("[AI Process Detail Extraction] Response:", resText);
    return safeParseJSON(resText);
  } catch (err) {
    console.error("[AI Process Detail Extraction] Error:", err);
    return null;
  }
};

export function safeParseJSON(text: string): any {
  if (!text) return null;
  let clean = text.trim();

  // 1. Strip markdown code block wrappers if they exist
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  clean = clean.trim();

  // Remove control characters except space, tab, newline, carriage return
  clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, (match) => {
    if (match === '\n') return '\n';
    if (match === '\r') return '\r';
    if (match === '\t') return '\t';
    return '';
  });

  // Preprocess to escape unescaped control characters inside JSON strings
  let inString = false;
  let escaped = false;
  let builder = "";
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '\\' && inString) {
      escaped = !escaped;
      builder += char;
    } else if (char === '"') {
      if (!escaped) {
        inString = !inString;
      }
      escaped = false;
      builder += char;
    } else if (char === '\n' && inString) {
      builder += '\\n';
      escaped = false;
    } else if (char === '\r' && inString) {
      builder += '\\r';
      escaped = false;
    } else if (char === '\t' && inString) {
      builder += '\\t';
      escaped = false;
    } else {
      escaped = false;
      builder += char;
    }
  }
  clean = builder;

  try {
    return JSON.parse(clean);
  } catch (err) {
    try {
      // Remove trailing commas before closing braces/brackets
      const fixed = clean.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch (err2) {
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const candidate = clean.slice(firstBrace, lastBrace + 1);
          return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
        } catch (err3) {
          console.warn("[safeParseJSON] All standard and fixed JSON parses failed. Attempting regex extraction fallback.");
          const result: any = {};
          const keys = ["cnj_number", "court", "class", "subject", "chamber", "parties", "last_movement"];
          for (const key of keys) {
            const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i');
            const match = clean.match(regex);
            if (match) {
              result[key] = match[1];
            } else {
              const boolNumRegex = new RegExp(`"${key}"\\s*:\\s*(true|false|\\d+)`, 'i');
              const matchBN = clean.match(boolNumRegex);
              if (matchBN) {
                if (matchBN[1] === 'true') result[key] = true;
                else if (matchBN[1] === 'false') result[key] = false;
                else result[key] = Number(matchBN[1]);
              }
            }
          }
          if (Object.keys(result).length > 0) {
            return result;
          }
          throw err2;
        }
      }
      throw err;
    }
  }
}

export const validateProviderApiKey = async (provider: string, apiKey: string): Promise<{ success: boolean; message: string }> => {
  let key = (typeof apiKey === 'string' ? apiKey : "").trim();
  if (key.includes(' • ')) {
    key = key.split(' • ')[1].trim();
  }
  if (!key) {
    return { success: false, message: "A chave de API não foi informada." };
  }

  if (provider === 'gemini') {
    if (!key.startsWith('AIza') && !key.startsWith('AQ')) {
      return { success: false, message: "A chave Gemini parece inválida. Deve começar com 'AIza' ou 'AQ'." };
    }
    try {
      const ai = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: 'teste de conexao' }] }]
      });
      if (response) {
        return { success: true, message: "Conexão com Google Gemini realizada com sucesso!" };
      }
      return { success: false, message: "Resposta vazia do servidor Gemini." };
    } catch (err: any) {
      console.error("[Validate Gemini Key]", err);
      return { success: false, message: `Erro Gemini: ${err?.message || err}` };
    }
  } else if (provider === 'openai') {
    try {
      const openai = new OpenAI({ apiKey: key });
      await openai.models.list();
      return { success: true, message: "Conexão com OpenAI realizada com sucesso!" };
    } catch (err: any) {
      return { success: false, message: `Erro OpenAI: ${err?.message || err}` };
    }
  } else if (provider === 'claude') {
    if (!key.startsWith('sk-ant-')) {
      return { success: false, message: "Chave Claude inválida. Deve começar com 'sk-ant-'." };
    }
    try {
      const anthropic = new Anthropic({ apiKey: key });
      await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });
      return { success: true, message: "Conexão com Claude Anthropic realizada com sucesso!" };
    } catch (err: any) {
      return { success: false, message: `Erro Claude: ${err?.message || err}` };
    }
  } else if (provider === 'deepseek') {
    try {
      const deepseek = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' });
      await deepseek.models.list();
      return { success: true, message: "Conexão com DeepSeek realizada com sucesso!" };
    } catch (err: any) {
      return { success: false, message: `Erro DeepSeek: ${err?.message || err}` };
    }
  }

  return { success: false, message: `Provedor de IA desconhecido: ${provider}` };
};


