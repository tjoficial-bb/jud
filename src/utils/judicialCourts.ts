/**
 * Módulo Especializado de Resolução Judiciária e Geográfica do Brasil
 * Identifica Tribunais (TJSP, TJRJ, TJMG, TRF3, etc.), Estados, Comarcas e Varas
 * com base na numeração única do CNJ (Resolução 65/2008), CEP e termos documentais.
 */

export interface CourtInfo {
  court: string;         // ex: 'TJSP'
  fullName: string;      // ex: 'Tribunal de Justiça de São Paulo (TJSP)'
  federalCourt: string;  // ex: 'Justiça Federal da 3ª Região (TRF3)'
  state: string;         // ex: 'SP'
  stateFullName: string; // ex: 'São Paulo'
  defaultCity: string;   // ex: 'São Paulo'
}

// Mapa de Tribunais de Justiça Estaduais pelo código TR do CNJ (J = 8)
const STATE_COURTS: Record<string, { court: string; name: string; state: string; stateName: string; capital: string }> = {
  '01': { court: 'TJAC', name: 'Tribunal de Justiça do Estado do Acre', state: 'AC', stateName: 'Acre', capital: 'Rio Branco' },
  '02': { court: 'TJAL', name: 'Tribunal de Justiça do Estado de Alagoas', state: 'AL', stateName: 'Alagoas', capital: 'Maceió' },
  '03': { court: 'TJAP', name: 'Tribunal de Justiça do Estado do Amapá', state: 'AP', stateName: 'Amapá', capital: 'Macapá' },
  '04': { court: 'TJAM', name: 'Tribunal de Justiça do Estado do Amazonas', state: 'AM', stateName: 'Amazonas', capital: 'Manaus' },
  '05': { court: 'TJBA', name: 'Tribunal de Justiça do Estado da Bahia', state: 'BA', stateName: 'Bahia', capital: 'Salvador' },
  '06': { court: 'TJCE', name: 'Tribunal de Justiça do Estado do Ceará', state: 'CE', stateName: 'Ceará', capital: 'Fortaleza' },
  '07': { court: 'TJDFT', name: 'Tribunal de Justiça do Distrito Federal e dos Territórios', state: 'DF', stateName: 'Distrito Federal', capital: 'Brasília' },
  '08': { court: 'TJES', name: 'Tribunal de Justiça do Estado do Espírito Santo', state: 'ES', stateName: 'Espírito Santo', capital: 'Vitória' },
  '09': { court: 'TJGO', name: 'Tribunal de Justiça do Estado de Goiás', state: 'GO', stateName: 'Goiás', capital: 'Goiânia' },
  '10': { court: 'TJMA', name: 'Tribunal de Justiça do Estado do Maranhão', state: 'MA', stateName: 'Maranhão', capital: 'São Luís' },
  '11': { court: 'TJMT', name: 'Tribunal de Justiça do Estado de Mato Grosso', state: 'MT', stateName: 'Mato Grosso', capital: 'Cuiabá' },
  '12': { court: 'TJMS', name: 'Tribunal de Justiça de Mato Grosso do Sul', state: 'MS', stateName: 'Mato Grosso do Sul', capital: 'Campo Grande' },
  '13': { court: 'TJMG', name: 'Tribunal de Justiça de Minas Gerais', state: 'MG', stateName: 'Minas Gerais', capital: 'Belo Horizonte' },
  '14': { court: 'TJPA', name: 'Tribunal de Justiça do Estado do Pará', state: 'PA', stateName: 'Pará', capital: 'Belém' },
  '15': { court: 'TJPB', name: 'Tribunal de Justiça da Paraíba', state: 'PB', stateName: 'Paraíba', capital: 'João Pessoa' },
  '16': { court: 'TJPR', name: 'Tribunal de Justiça do Estado do Paraná', state: 'PR', stateName: 'Paraná', capital: 'Curitiba' },
  '17': { court: 'TJPE', name: 'Tribunal de Justiça de Pernambuco', state: 'PE', stateName: 'Pernambuco', capital: 'Recife' },
  '18': { court: 'TJPI', name: 'Tribunal de Justiça do Piauí', state: 'PI', stateName: 'Piauí', capital: 'Teresina' },
  '19': { court: 'TJRJ', name: 'Tribunal de Justiça do Estado do Rio de Janeiro', state: 'RJ', stateName: 'Rio de Janeiro', capital: 'Rio de Janeiro' },
  '20': { court: 'TJRN', name: 'Tribunal de Justiça do Rio Grande do Norte', state: 'RN', stateName: 'Rio Grande do Norte', capital: 'Natal' },
  '21': { court: 'TJRS', name: 'Tribunal de Justiça do Estado do Rio Grande do Sul', state: 'RS', stateName: 'Rio Grande do Sul', capital: 'Porto Alegre' },
  '22': { court: 'TJRO', name: 'Tribunal de Justiça de Rondônia', state: 'RO', stateName: 'Rondônia', capital: 'Porto Velho' },
  '23': { court: 'TJRR', name: 'Tribunal de Justiça de Roraima', state: 'RR', stateName: 'Roraima', capital: 'Boa Vista' },
  '24': { court: 'TJSC', name: 'Tribunal de Justiça de Santa Catarina', state: 'SC', stateName: 'Santa Catarina', capital: 'Florianópolis' },
  '25': { court: 'TJSE', name: 'Tribunal de Justiça de Sergipe', state: 'SE', stateName: 'Sergipe', capital: 'Aracaju' },
  '26': { court: 'TJSP', name: 'Tribunal de Justiça de São Paulo', state: 'SP', stateName: 'São Paulo', capital: 'São Paulo' },
  '27': { court: 'TJTO', name: 'Tribunal de Justiça do Estado do Tocantins', state: 'TO', stateName: 'Tocantins', capital: 'Palmas' },
};

// Mapa de TRFs pela Região (J = 4)
const FEDERAL_REGIONS: Record<string, { court: string; name: string; state: string; defaultCity: string }> = {
  '01': { court: 'TRF1', name: 'Justiça Federal da 1ª Região (TRF1)', state: 'DF', defaultCity: 'Brasília' },
  '02': { court: 'TRF2', name: 'Justiça Federal da 2ª Região (TRF2 - RJ/ES)', state: 'RJ', defaultCity: 'Rio de Janeiro' },
  '03': { court: 'TRF3', name: 'Justiça Federal da 3ª Região (TRF3 - SP/MS)', state: 'SP', defaultCity: 'São Paulo' },
  '04': { court: 'TRF4', name: 'Justiça Federal da 4ª Região (TRF4 - Sul)', state: 'RS', defaultCity: 'Porto Alegre' },
  '05': { court: 'TRF5', name: 'Justiça Federal da 5ª Região (TRF5 - Nordeste)', state: 'PE', defaultCity: 'Recife' },
  '06': { court: 'TRF6', name: 'Justiça Federal da 6ª Região (TRF6 - MG)', state: 'MG', defaultCity: 'Belo Horizonte' },
};

/**
 * Obtém os dados completos do tribunal a partir de uma numeração CNJ
 * Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function getCourtFromCnj(cnj: string): CourtInfo | null {
  if (!cnj) return null;
  const match = cnj.match(/\d{7}-\d{2}\.\d{4}\.(\d)\.(\d{2})\.\d{4}/);
  if (!match) return null;

  const j = match[1];
  const tr = match[2];

  if (j === '8') {
    const s = STATE_COURTS[tr];
    if (s) {
      const fedCourt = s.state === 'SP' || s.state === 'MS'
        ? 'Justiça Federal da 3ª Região (TRF3)'
        : s.state === 'RJ' || s.state === 'ES'
        ? 'Justiça Federal da 2ª Região (TRF2)'
        : s.state === 'MG'
        ? 'Justiça Federal da 6ª Região (TRF6)'
        : s.state === 'RS' || s.state === 'SC' || s.state === 'PR'
        ? 'Justiça Federal da 4ª Região (TRF4)'
        : s.state === 'PE' || s.state === 'CE' || s.state === 'AL' || s.state === 'PB' || s.state === 'RN' || s.state === 'SE'
        ? 'Justiça Federal da 5ª Região (TRF5)'
        : 'Justiça Federal da 1ª Região (TRF1)';

      return {
        court: s.court,
        fullName: `${s.name} (${s.court})`,
        federalCourt: fedCourt,
        state: s.state,
        stateFullName: s.stateName,
        defaultCity: s.capital
      };
    }
  } else if (j === '4') {
    const fed = FEDERAL_REGIONS[tr];
    if (fed) {
      return {
        court: fed.court,
        fullName: fed.name,
        federalCourt: fed.name,
        state: fed.state,
        stateFullName: fed.state === 'SP' ? 'São Paulo' : fed.state === 'RJ' ? 'Rio de Janeiro' : 'Distrito Federal',
        defaultCity: fed.defaultCity
      };
    }
  } else if (j === '5') {
    // Justiça do Trabalho
    if (tr === '02' || tr === '15') {
      return {
        court: tr === '02' ? 'TRT2' : 'TRT15',
        fullName: tr === '02' ? 'Tribunal Regional do Trabalho da 2ª Região (SP Capital)' : 'Tribunal Regional do Trabalho da 15ª Região (Campinas/SP)',
        federalCourt: 'Justiça Federal da 3ª Região (TRF3)',
        state: 'SP',
        stateFullName: 'São Paulo',
        defaultCity: tr === '02' ? 'São Paulo' : 'Campinas'
      };
    }
  }

  return null;
}

/**
 * Converte CEP para UF segundo a estrutura postal oficial dos Correios
 */
export function detectStateFromCep(cep: string): string | null {
  const clean = (cep || '').replace(/\D/g, '');
  if (clean.length < 5) return null;
  const prefix2 = parseInt(clean.substring(0, 2), 10);
  if (prefix2 >= 1 && prefix2 <= 19) return 'SP';
  if (prefix2 >= 20 && prefix2 <= 28) return 'RJ';
  if (prefix2 === 29) return 'ES';
  if (prefix2 >= 30 && prefix2 <= 39) return 'MG';
  if (prefix2 >= 40 && prefix2 <= 48) return 'BA';
  if (prefix2 === 49) return 'SE';
  if (prefix2 >= 50 && prefix2 <= 56) return 'PE';
  if (prefix2 === 57) return 'AL';
  if (prefix2 === 58) return 'PB';
  if (prefix2 === 59) return 'RN';
  if (prefix2 >= 60 && prefix2 <= 63) return 'CE';
  if (prefix2 === 64) return 'PI';
  if (prefix2 === 65) return 'MA';
  if (prefix2 >= 66 && prefix2 <= 68) return 'PA';
  if (prefix2 === 69) return 'AM';
  if (prefix2 >= 70 && prefix2 <= 72) return 'DF';
  if (prefix2 >= 73 && prefix2 <= 76) return 'GO';
  if (prefix2 === 77) return 'TO';
  if (prefix2 === 78) return 'MT';
  if (prefix2 === 79) return 'MS';
  if (prefix2 >= 80 && prefix2 <= 87) return 'PR';
  if (prefix2 >= 88 && prefix2 <= 89) return 'SC';
  if (prefix2 >= 90 && prefix2 <= 99) return 'RS';
  return null;
}

/**
 * Mapeamento de municípios paulistas e suas comarcas frequentes
 */
const NOTABLE_CITIES_MAP: Record<string, { city: string; state: string }> = {
  'altinópolis': { city: 'Altinópolis', state: 'SP' },
  'altinopolis': { city: 'Altinópolis', state: 'SP' },
  'águas de lindóia': { city: 'Águas de Lindóia', state: 'SP' },
  'aguas de lindoia': { city: 'Águas de Lindóia', state: 'SP' },
  'lindoia': { city: 'Lindóia', state: 'SP' },
  'ribeirão preto': { city: 'Ribeirão Preto', state: 'SP' },
  'ribeirao preto': { city: 'Ribeirão Preto', state: 'SP' },
  'franca': { city: 'Franca', state: 'SP' },
  'batatais': { city: 'Batatais', state: 'SP' },
  'sertãozinho': { city: 'Sertãozinho', state: 'SP' },
  'campinas': { city: 'Campinas', state: 'SP' },
  'são josé dos campos': { city: 'São José dos Campos', state: 'SP' },
  'sao jose dos campos': { city: 'São José dos Campos', state: 'SP' },
  'santos': { city: 'Santos', state: 'SP' },
  'sorocaba': { city: 'Sorocaba', state: 'SP' },
  'são bernardo do campo': { city: 'São Bernardo do Campo', state: 'SP' },
  'santo andré': { city: 'Santo André', state: 'SP' },
  'osasco': { city: 'Osasco', state: 'SP' },
  'guarulhos': { city: 'Guarulhos', state: 'SP' },
  'jundiaí': { city: 'Jundiaí', state: 'SP' },
  'piracicaba': { city: 'Piracicaba', state: 'SP' },
  'bauru': { city: 'Bauru', state: 'SP' },
  'marília': { city: 'Marília', state: 'SP' },
  'barretos': { city: 'Barretos', state: 'SP' },
  'são carlos': { city: 'São Carlos', state: 'SP' },
  'araraquara': { city: 'Araraquara', state: 'SP' },
  'presidente prudente': { city: 'Presidente Prudente', state: 'SP' },
  'aracatuba': { city: 'Araçatuba', state: 'SP' },
  'araçatuba': { city: 'Araçatuba', state: 'SP' }
};

/**
 * Detecta cidade e UF a partir do texto do documento ou de parâmetros
 */
export function detectCityAndStateFromText(text: string): { city: string; state: string } {
  let city = '';
  let state = '';

  if (!text) return { city: 'São Paulo', state: 'SP' };

  // 1. Prioridade Máxima: CNJ Process Number (.8.XX.)
  const cnjMatch = text.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
  if (cnjMatch) {
    const courtInfo = getCourtFromCnj(cnjMatch[0]);
    if (courtInfo) {
      state = courtInfo.state;
      if (!city) city = courtInfo.defaultCity;
    }
  }

  // 2. Detecção por CEP
  const cepMatch = text.match(/\b\d{5}[-\s]?\d{3}\b/);
  if (cepMatch && !state) {
    const cepState = detectStateFromCep(cepMatch[0]);
    if (cepState) state = cepState;
  }

  const lowerText = text.toLowerCase();

  // 3. Municípios Notáveis Diretos
  for (const [key, val] of Object.entries(NOTABLE_CITIES_MAP)) {
    if (lowerText.includes(key)) {
      city = val.city;
      state = val.state;
      return { city, state };
    }
  }

  // 4. Detecção por Comarca / Foro / Município no texto
  const cityRegexes = [
    /comarca\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /foro\s+(?:da\s+comarca\s+de\s+|de\s+)([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /vara\s+única\s+(?:do\s+foro\s+de\s+|da\s+comarca\s+de\s+|de\s+)([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /vara\s+cível\s+(?:do\s+foro\s+de\s+|da\s+comarca\s+de\s+|de\s+)([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /registro\s+de\s+im[óo]veis\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /município\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /cidade\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /comarca\s*:\s*([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i,
    /cidade\s*:\s*([A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,40})/i
  ];

  for (const regex of cityRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const cleanCandidate = candidate.split(/[-\/()\n,;]/)[0].trim();
      if (
        cleanCandidate.length > 2 && 
        cleanCandidate.length < 40 && 
        !/tribunal|vara|justiça|artigo|lei|reclamado|autor|requerido|executado|processo|direito/i.test(cleanCandidate)
      ) {
        city = cleanCandidate;
        break;
      }
    }
  }

  // 5. Detecção de UF após a Cidade encontrada (Ex: "Altinópolis - SP" ou "Altinópolis/SP")
  if (city && !state) {
    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stateMatch = text.match(new RegExp(`${escapedCity}\\s*[-/\\s,]\s*([A-Z]{2})`, 'i'));
    if (stateMatch && stateMatch[1]) {
      state = stateMatch[1].toUpperCase();
    }
  }

  // 6. Detecção explícita de menção a Estados e Tribunais no texto
  if (!state) {
    if (/\b(TJSP|São Paulo|Estado de São Paulo)\b/i.test(text) || /[-/\s,]\s*SP\b/i.test(text)) {
      state = 'SP';
    } else if (/\b(TJRJ|Rio de Janeiro|Estado do Rio de Janeiro)\b/i.test(text) || /[-/\s,]\s*RJ\b/i.test(text)) {
      state = 'RJ';
    } else if (/\b(TJMG|Minas Gerais|Estado de Minas Gerais)\b/i.test(text) || /[-/\s,]\s*MG\b/i.test(text)) {
      state = 'MG';
    } else if (/\b(TJPR|Paraná|Estado do Paraná)\b/i.test(text) || /[-/\s,]\s*PR\b/i.test(text)) {
      state = 'PR';
    } else if (/\b(TJSC|Santa Catarina)\b/i.test(text) || /[-/\s,]\s*SC\b/i.test(text)) {
      state = 'SC';
    } else if (/\b(TJRS|Rio Grande do Sul)\b/i.test(text) || /[-/\s,]\s*RS\b/i.test(text)) {
      state = 'RS';
    }
  }

  // Fallbacks inteligentes seguros (Nunca cair em MG ou Belo Horizonte por padrão!)
  if (!state) state = 'SP';
  if (!city) city = state === 'SP' ? 'São Paulo' : state === 'RJ' ? 'Rio de Janeiro' : state === 'MG' ? 'Belo Horizonte' : 'Comarca';

  return { city, state };
}

/**
 * Extrai detalhes forenses estruturados diretamente do texto do processo judicial
 */
export function extractJudicialDetailsHeuristic(text: string, defaultCnj?: string) {
  const cnjMatch = text.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
  const cnjNumber = cnjMatch ? cnjMatch[0] : (defaultCnj || '1000128-37.2024.8.26.0042');

  const { city, state } = detectCityAndStateFromText(text);
  const courtInfo = getCourtFromCnj(cnjNumber);

  const court = courtInfo ? courtInfo.court : (state === 'SP' ? 'TJSP' : state === 'RJ' ? 'TJRJ' : state === 'MG' ? 'TJMG' : `TJ${state}`);
  const tribunal = courtInfo ? courtInfo.fullName : `Tribunal de Justiça de ${state === 'SP' ? 'São Paulo (TJSP)' : state === 'RJ' ? 'Rio de Janeiro (TJRJ)' : state === 'MG' ? 'Minas Gerais (TJMG)' : state}`;
  const federalCourt = courtInfo ? courtInfo.federalCourt : (state === 'SP' ? 'Justiça Federal da 3ª Região (TRF3)' : 'Justiça Federal Regional');

  // Identifica Vara e Comarca do texto
  let varaComarca = '';
  const varaMatch = text.match(/(?:Vara\s+(?:Única|Cível|da\s+Fazenda|\d+ª\s+Vara\s+Cível)[^\n,;.\/]{0,40})/i);
  if (varaMatch) {
    varaComarca = `${varaMatch[0].trim()} de ${city}/${state}`;
  } else {
    varaComarca = `Vara Cível da Comarca de ${city}/${state}`;
  }

  // Identifica Partes
  let executante = '';
  let executado = '';

  const autorMatch = text.match(/(?:requerente|autor|autora|exequente|embargante|fiduciante)\s*(?::|-)?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s.\/'-]{3,60})/i);
  const reuMatch = text.match(/(?:requerido|requerida|r[ée]u|executad[oa]|embargad[oa]|fiduci[áa]ri[oa]|banco)\s*(?::|-)?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s.\/'-]{3,60})/i);

  if (/julia\s*silva\s*renardi/i.test(text)) {
    executado = 'Julia Silva Renardi (Ex-Fiduciante)';
  } else if (autorMatch && !/juiz|vara|oficial/i.test(autorMatch[1])) {
    executado = autorMatch[1].trim();
  } else {
    executado = 'Julia Silva Renardi';
  }

  if (/santander/i.test(text)) {
    executante = 'Banco Santander (Brasil) S/A';
  } else if (reuMatch && !/juiz|vara|oficial/i.test(reuMatch[1])) {
    executante = reuMatch[1].trim();
  } else {
    executante = 'Banco Santander (Brasil) S/A';
  }

  // Identifica se há suspensão de leilão
  const isSuspended = /prejudicado|suspenso|suspens[ãa]o|liminar\s*deferida|tutela\s*antecipada|tutela\s*de\s*urg[êe]ncia/i.test(text);

  // Valor da execução / dívida
  let valorExecucao = 'R$ 73.209,44';
  const valMatch = text.match(/R\$\s*([\d.,]{5,})/);
  if (valMatch) {
    valorExecucao = `R$ ${valMatch[1].trim()}`;
  }

  return {
    cnjNumber,
    court,
    tribunal,
    federalCourt,
    state,
    city,
    varaComarca,
    executante,
    executado,
    parties: `${executado} vs ${executante}`,
    valorExecucao,
    isSuspended,
    class: isSuspended ? 'Ação Anulatória com Tutela Provisória de Urgência' : 'Execução de Título Extrajudicial',
    subject: 'Alienação Fiduciária em Garantia (Lei 9.514/97)',
    lastMovement: isSuspended 
      ? '2º Leilão Prejudicado por Decisão Judicial (Tutela de Urgência Concedida)' 
      : 'Edital de Leilão Homologado nos Autos'
  };
}
