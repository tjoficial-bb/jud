import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import multer from "multer";
import { createRequire } from 'module';
import fs from "fs";
const localRequire = typeof require !== 'undefined' ? require : createRequire(import.meta.url);
const pdf = localRequire('pdf-parse');

dotenv.config();

import { runBackendAnalysis, runBackendProcessStory, runBackendChatMessage } from "./server/aiRunner";


const upload = multer({ storage: multer.memoryStorage() });

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
      console.log(`[PDF] Iniciando extração de texto. Buffer size: ${buffer.length}`);
      // Handle potential default export differences between ESM/CJS
      let pdfParser = pdf;
      if (typeof pdf !== 'function' && pdf && typeof (pdf as any).default === 'function') {
        pdfParser = (pdf as any).default;
      }
      
      if (typeof pdfParser !== 'function') {
        console.error("[PDF] pdf-parse não é uma função válida. Type:", typeof pdf, "Keys:", Object.keys(pdf || {}));
        return "";
      }
      
      const data = await pdfParser(buffer);
      const text = data.text || "";
      console.log(`[PDF] Extração concluída. Texto extraído: ${text.length} caracteres.`);
      return text;
    } catch (err: any) {
      // Catch common PDF parsing exceptions
      const errorName = err.name || '';
      const errorMessage = (err.message || String(err)).toString();
      
      const knownExceptions = ['AbortException', 'FormatError', 'InvalidPDFException', 'PasswordException', 'ResponseException', 'UnknownErrorException', 'getException'];
      
      // Check if the error name or message contains any of the known exceptions (case-insensitive)
      const isKnownException = 
        knownExceptions.some(ex => 
          errorName.toLowerCase().includes(ex.toLowerCase()) || 
          errorMessage.toLowerCase().includes(ex.toLowerCase())
        );

      if (isKnownException) {
        console.warn(`[PDF] Ignorando exceção conhecida: ${errorName} - ${errorMessage}`);
        // Silently ignore known PDF parsing issues
        return "";
      }
      
      console.error(`[PDF] Erro inesperado na extração de texto (${errorName}):`, errorMessage);
      return "";
    }
  }
  return "";
}

console.log("DEBUG: Servidor iniciando...");

const DB_NAME = path.join(process.cwd(), "leiloes_pro.db");
let db: InstanceType<typeof Database>;

function initDbWithRetry() {
  const maxRetries = 5;
  let delay = 100;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = new Database(DB_NAME);
      conn.pragma("busy_timeout = 5000");
      
      const checkResult = conn.prepare("PRAGMA integrity_check").get() as any;
      const isOk = checkResult && checkResult.integrity_check === "ok";
      
      if (!isOk) {
        throw new Error("Database integrity check failed");
      }
      
      conn.close();
      
      db = new Database(DB_NAME);
      db.pragma("busy_timeout = 5000");
      console.log("Database initialized successfully with busy_timeout=5000.");
      return;
    } catch (err: any) {
      const errMsg = err.message || "";
      const isLockedOrBusy = errMsg.includes("locked") || errMsg.includes("busy") || errMsg.includes("resource temporarily unavailable");
      
      if (isLockedOrBusy && attempt < maxRetries) {
        console.warn(`[DB] Database is locked (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
        // Sync delay sleep
        const start = Date.now();
        while (Date.now() - start < delay) {}
        delay *= 2;
        continue;
      }
      
      if (!isLockedOrBusy) {
        console.error("CRITICAL: Database is malformed or corrupted. Attempting safe recovery...", err.message);
        if (fs.existsSync(DB_NAME)) {
          const backupName = path.join(process.cwd(), `leiloes_pro_corrupted_${Date.now()}.db`);
          try {
            fs.copyFileSync(DB_NAME, backupName);
            console.log(`Corrupted database backed up safely to ${backupName}`);
          } catch (backupErr: any) {
            console.error("Failed to back up corrupted database:", backupErr.message);
          }
        }
      }
      
      // Try to open it anyway as a fallback, configuring busy_timeout
      try {
        db = new Database(DB_NAME);
        db.pragma("busy_timeout = 5000");
        return;
      } catch (fallbackErr: any) {
        console.error("Failed to open database as fallback, initializing new one:", fallbackErr.message);
        try {
          if (fs.existsSync(DB_NAME)) {
            fs.unlinkSync(DB_NAME);
          }
        } catch (unLinkErr) {}
        db = new Database(DB_NAME);
        db.pragma("busy_timeout = 5000");
        return;
      }
    }
  }
}

initDbWithRetry();

const JWT_SECRET = process.env.JWT_SECRET || "tj-invest-secure-key-2026";

// Initialize database tables
try {
  console.log("Inicializando tabelas do banco de dados...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Operador', -- Admin, Operador
    status TEXT DEFAULT 'Ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT, -- Apartamento, Casa, Lote, etc.
    modality TEXT, -- Judicial, Extrajudicial
    address TEXT,
    city TEXT,
    state TEXT,
    area REAL,
    valuation_value REAL,
    min_bid REAL,
    planned_max_bid REAL,
    auctioned_value REAL,
    expected_sale_value REAL,
    actual_sale_value REAL,
    status TEXT DEFAULT 'Analise',
    observations TEXT,
    share_token TEXT UNIQUE,
    is_public INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    cnj_number TEXT UNIQUE,
    court TEXT,
    chamber TEXT,
    action_type TEXT,
    debt_value REAL,
    parties TEXT,
    status TEXT,
    observations TEXT,
    property_id TEXT,
    source TEXT DEFAULT 'Manual', -- Manual, DataJud
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    doc_type TEXT, -- Processo, Matricula, Edital, etc.
    property_id TEXT,
    process_id TEXT,
    data TEXT, -- Base64
    extracted_text TEXT,
    ia_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id),
    FOREIGN KEY(process_id) REFERENCES processes(id)
  );

  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    type TEXT, -- IPTU, Condominio, etc.
    value REAL,
    responsible TEXT, -- Arrematante, Processo
    calculation_date DATE,
    observations TEXT,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS ai_analyses (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    exec_summary TEXT,
    legal_analysis TEXT,
    financial_analysis TEXT,
    legal_risks TEXT,
    operational_risks TEXT,
    recommended_bid REAL,
    roi REAL,
    tir REAL,
    estimated_profit REAL,
    ia_used TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS process_stories (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    full_story TEXT,
    legal_glossary TEXT,
    timeline_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS strategic_brain (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    source TEXT,
    extracted_text TEXT,
    data TEXT,
    embeddings TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analysis_shares (
    token TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_config (
    id TEXT PRIMARY KEY,
    primary_ia TEXT DEFAULT 'Gemini',
    secondary_ia TEXT,
    gemini_key TEXT,
    openai_key TEXT,
    claude_key TEXT,
    deepseek_key TEXT,
    datajud_key TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS datajud_queries (
    id TEXT PRIMARY KEY,
    cnj_number TEXT NOT NULL,
    court TEXT,
    class TEXT,
    subject TEXT,
    chamber TEXT,
    parties TEXT,
    movements TEXT,
    last_movement_date TEXT,
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
  console.log("Tabelas base inicializadas.");

  // Migrations for strategic_brain
  try {
    console.log("Verificando migrações para strategic_brain...");
    const tableInfo: any[] = db.prepare("PRAGMA table_info(strategic_brain)").all();
    const columns = tableInfo.map(c => c.name);
    
    if (!columns.includes('url')) {
      console.log("Adicionando coluna 'url'...");
      db.prepare("ALTER TABLE strategic_brain ADD COLUMN url TEXT").run();
    }
    if (!columns.includes('username')) {
      console.log("Adicionando coluna 'username'...");
      db.prepare("ALTER TABLE strategic_brain ADD COLUMN username TEXT").run();
    }
    if (!columns.includes('password')) {
      console.log("Adicionando coluna 'password'...");
      db.prepare("ALTER TABLE strategic_brain ADD COLUMN password TEXT").run();
    }
    if (!columns.includes('is_automated')) {
      console.log("Adicionando coluna 'is_automated'...");
      db.prepare("ALTER TABLE strategic_brain ADD COLUMN is_automated INTEGER DEFAULT 0").run();
    }
    if (!columns.includes('last_sync')) {
      console.log("Adicionando coluna 'last_sync'...");
      db.prepare("ALTER TABLE strategic_brain ADD COLUMN last_sync DATETIME").run();
    }
    if (!columns.includes('module')) {
      console.log("Adicionando coluna 'module'...");
      db.prepare("ALTER TABLE strategic_brain ADD COLUMN module TEXT").run();
    }
    if (!columns.includes('lesson')) {
      console.log("Adicionando coluna 'lesson'...");
      db.prepare("ALTER TABLE strategic_brain ADD COLUMN lesson TEXT").run();
    }
    console.log("Migrações concluídas com sucesso.");
    
    // Seed strategic_brain with premium curated items
    console.log("Verificando e semeando dados no Cérebro Estratégico...");
    const seedItems = [
      {
        id: 'sb-1',
        title: 'Manual de Leilões Judiciais (CPC)',
        category: 'Jurídico',
        source: 'Código de Processo Civil - Lei 13.105/15',
        extracted_text: 'Diretrizes cruciais para análise de leilões judiciais baseadas no Código de Processo Civil (CPC). O leilão judicial decorre de processos judiciais de cobrança, execução fiscal, alienações, etc. Foco total em editais, intimações pessoais dos devedores (Art. 889 CPC), preço vil (Art. 891 CPC - proibido lance inferior a 50% do valor da avaliação se não fixado outro patamar pelo juiz) e prazos para embargos à arrematação (Art. 903). Diferente de leilões extrajudiciais, o próprio juiz do caso emite a Carta de Arrematação e o Mandado de Imissão na Posse diretamente nos autos.',
        url: '',
        is_automated: 0,
        module: '',
        lesson: ''
      },
      {
        id: 'sb-2',
        title: 'Estratégia CAIXA - Venda Direta Online',
        category: 'Estratégia',
        source: 'Manual Operacional CAIXA',
        extracted_text: 'Regras de ouro para a Venda Direta e Venda Online de imóveis recuperados pela CAIXA Econômica Federal. Na "Venda Online", o imóvel é vencido por quem der o maior lance até o fim do cronômetro. Na "Venda Direta Online", o primeiro que clicar em comprar e concluir as etapas leva o imóvel imediatamente pelo preço de venda do site. Principais vantagens: 1. Isenção total de dívidas de IPTU e condomínio anteriores à arrematação (a Caixa assume tudo e entrega o imóvel livre de ônus ao comprador, exceto se houver cláusula expressa contrária). 2. Assessoria gratuita de Corretores Credenciados CAIXA pagos pelo próprio banco para auxiliar o arrematante na compra, documentação e desocupação. 3. Possibilidade de financiar até 95% do valor do imóvel através de Crédito Habitacional CAIXA utilizando também os recursos do FGTS.',
        url: 'https://venda-imoveis.caixa.gov.br',
        is_automated: 1,
        module: '',
        lesson: ''
      },
      {
        id: 'sb-3',
        title: 'Checklist Crítico de Matrícula Imobiliária',
        category: 'Jurídico',
        source: 'Manual Prático Cartorário',
        extracted_text: 'Roteiro de inspeção visual na Certidão de Matrícula Atualizada (Inteiro Teor). Itens vermelhos/bloqueantes a verificar: 1. Penhoras anteriores (focar em penhoras de processos criminais ou federais, que exigem maior cautela). 2. Usufruto vitalício ou temporário registrado e não extinto (arrematar imóvel com usufruto significa comprar apenas a nu-propriedade, sem o direito de posse direta até extinção do usufruto). 3. Cláusulas de inalienabilidade ou impenhorabilidade (comuns em doações ou heranças, que precisam ser inspecionadas). 4. Gravames de indisponibilidade decretada por tribunais trabalhistas ou federais (exige pedido formal ao juízo do leilão para levantamento via sistema CNIB). 5. Registro de habite-se e conformidade da metragem de área construída.',
        url: '',
        is_automated: 0,
        module: '',
        lesson: ''
      },
      {
        id: 'sb-cur-1',
        title: 'Como Selecionar Leilões Altamente Lucrativos',
        category: 'Cursos',
        source: 'TJ INVEST Academy',
        extracted_text: 'Nesta videoaula, ensinamos o método prático para triar editais de leilões judiciais e extrajudiciais. Aprendemos a identificar o desconto real ou "deságio" comparando o valor de avaliação ou avaliação judicial contra o valor real de mercado praticado em portais imobiliários semelhantes na região (método comparativo direto). O foco deve estar em imóveis residenciais (apartamentos e casas em condomínio fechado) de médio padrão, pois possuem altíssima liquidez pós-venda e desocupação muito rápida e menos custos adicionais.',
        url: '',
        is_automated: 0,
        module: 'Módulo 1: Fundamentos de Leilões',
        lesson: 'Aula 1: Triagem de Oportunidades de Alto Deságio'
      },
      {
        id: 'sb-cur-2',
        title: 'Domando os Custos Invisíveis nos Cálculos',
        category: 'Cursos',
        source: 'TJ INVEST Academy',
        extracted_text: 'Como precificar e projetar os custos fiscais e de manutenção sem errar. Abordamos os custos cruciais para sua simulação: 1. ITBI (Imposto de Transmissão de Bens Imóveis): cobrado sobre o maior valor entre o da arrematação ou o de referência municipal, sob alíquota de 2% a 3%. 2. Custos Cartorários: Registro da Carta de Arrematação ou Escritura de Compra, segundo a tabela progressiva de custas de cada estado. 3. Custos de Desocupação: provisão para custas de ação com advogado (honorários) ou acordo consensual ("taxa de mudança" de R$ 3.000 a R$ 5.000). 4. Reformas e reparos: provisão padrão de 5% a 10% do valor de mercado. 5. Custos de holding: IPTU e condomínio mensais acumulados durante os meses estimados de giro (geralmente 8 a 12 meses).',
        url: '',
        is_automated: 0,
        module: 'Módulo 1: Fundamentos de Leilões',
        lesson: 'Aula 2: Planilhamento Real e Custos de Aquisição'
      },
      {
        id: 'sb-cur-3',
        title: 'A Venda Online e Venda Direta CAIXA por Dentro',
        category: 'Cursos',
        source: 'TJ INVEST Academy',
        extracted_text: 'Mergulho prático nas duas principais modalidades extrajudiciais da Caixa Econômica Federal. Na Venda Online, aprenda as estratégias de cronômetro: os lances cruciais devem ser dados nos últimos 10 a 15 segundos para evitar inflacionamento antecipado de disputa. Na Venda Direta Online, o sistema é de "clique rápido", sendo vital possuir cadastro de pré-aprovação de crédito previamente homologado junto a um Correspondente Caixa Aqui parceiro (CCA) para fins de agilidade no fechamento.',
        url: '',
        is_automated: 0,
        module: 'Módulo 2: Oportunidades CAIXA',
        lesson: 'Aula 1: Estratégias de Disputa e Clique Rápido'
      },
      {
        id: 'sb-cur-4',
        title: 'Como Financiar Imóveis Retomados e Uso de FGTS',
        category: 'Cursos',
        source: 'TJ INVEST Academy',
        extracted_text: 'Nesta aula mostramos todas as vantagens do financiamento Caixa de até 95% para os imóveis de propriedade própria adjudicados. Você pode dar apenas 5% de entrada em recursos próprios ou consorciados e o saldo restante financiado em até 420 meses. Além disso, pode usar seu saldo de conta vinculada do FGTS para abatimento total da entrada ou das taxas de custas iniciais de registro, desde que cumpra os requisitos do SFH (Sistemas Financeiros de Habitação): possuir 3 anos de carteira assinada, não possuir outro imóvel residencial no mesmo município e não estar em dívidas ativas.',
        url: '',
        is_automated: 0,
        module: 'Módulo 2: Oportunidades CAIXA',
        lesson: 'Aula 2: Operacionalizando o Financiamento'
      },
      {
        id: 'sb-cur-5',
        title: 'Método Desocupação Acelerada (Negociação vs Judicial)',
        category: 'Cursos',
        source: 'TJ INVEST Academy',
        extracted_text: 'O segredo dos grandes investidores de leilão está na desocupação inteligente e diplomática do imóvel arrematado. Dividimos o plano em duas frentes: 1. Negociação Consensual (Abordagem de Alto Valor): Visitar o ocupante logo após obter a folha de pagamento das custas do leilão. Conversar civilizadamente, empatizar com a situação, e propor um acordo financeiro amigável (ajuda de custo para mudança, geralmente de R$ 2.000 a R$ 5.000) condicionada à entrega imediata e pacífica das chaves do imóvel limpo em até 30 dias. 2. Ação de Imissão na Posse / Homologação Judicial: Se o ocupante se recusar, entra-se imediatamente em juízo munido de Carta de Arrematação registrada, requerendo liminar de desocupação forçada em 15 dias.',
        url: '',
        is_automated: 0,
        module: 'Módulo 3: Pós-Leilão de Sucesso',
        lesson: 'Aula 1: Estratégias de Desocupação Rápida'
      },
      {
        id: 'sb-doc-caixa',
        title: 'Normativo CAIXA de Venda de Imóveis no Portal de Oportunidades',
        category: 'Documentos',
        source: 'Regulamento Geral CAIXA CEF nº 212/26',
        extracted_text: 'Regulação interna e oficial de alienação dos imóveis retomados pela Caixa Econômica Federal. Normativa que garante formalmente ao comprador que a CAIXA arca com todos os débitos e encargos tributários de IPTU e contribuições condominiais pendentes até o dia do leilão ou da contratação do imóvel. O normativo estabelece que eventuais cobranças judiciais tributárias que cheguem ao novo arrematante anteriores ao faturamento devem ser repassadas imediatamente ao jurídico do banco para liquidação perante os órgãos competentes, preservando o patrimônio livre de ônus ao investidor.',
        url: 'https://venda-imoveis.caixa.gov.br',
        is_automated: 0,
        module: '',
        lesson: ''
      },
      {
        id: 'sb-doc-limp',
        title: 'Guia de Desocupação Amigável e Modelos de Acordo',
        category: 'Documentos',
        source: 'Jurídico TJ INVEST',
        extracted_text: 'Kit com minutas e modelos operacionais para aplicação prática na desocupação amigável de imóveis adquiridos. Contém: 1. Roteiro e script exato de conversa inicial com o ex-proprietário ou ocupante ilegal. 2. Modelo de Termo de Acordo Extrajudicial de Desocupação Amigável, prevendo cronograma de vistoria e entrega de chaves com quitação mútua. 3. Cláusula de liberação do pagamento da "ajuda de mudança" somente após a desocupação física, com entrega de chaves na portaria ou no imóvel sem avarias estruturais.',
        url: '',
        is_automated: 0,
        module: '',
        lesson: ''
      }
    ];

    const insert = db.prepare(`
      INSERT OR REPLACE INTO strategic_brain 
      (id, title, category, source, extracted_text, url, is_automated, module, lesson) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    seedItems.forEach(item => {
      insert.run(item.id, item.title, item.category, item.source, item.extracted_text, item.url, item.is_automated, item.module, item.lesson);
    });
    console.log("Cérebro Estratégico semeado/restaurado com os dados premium.");

    console.log("Verificando migrações para properties...");
    const propTableInfo: any[] = db.prepare("PRAGMA table_info(properties)").all();
    const propColumns = propTableInfo.map(c => c.name);
    if (!propColumns.includes('anonymize_property')) {
      console.log("Adicionando coluna 'anonymize_property'...");
      db.prepare("ALTER TABLE properties ADD COLUMN anonymize_property INTEGER DEFAULT 0").run();
    }
    if (!propColumns.includes('auction_url')) {
      console.log("Adicionando coluna 'auction_url'...");
      db.prepare("ALTER TABLE properties ADD COLUMN auction_url TEXT").run();
    }

    console.log("Verificando migrações para documents...");
    const docTableInfo: any[] = db.prepare("PRAGMA table_info(documents)").all();
    const docColumns = docTableInfo.map(c => c.name);
    if (!docColumns.includes('temp_property_id')) {
      console.log("Adicionando coluna 'temp_property_id'...");
      db.prepare("ALTER TABLE documents ADD COLUMN temp_property_id TEXT").run();
    }

    console.log("Verificando migrações para ai_config...");
    const aiConfigTableInfo: any[] = db.prepare("PRAGMA table_info(ai_config)").all();
    const aiConfigColumns = aiConfigTableInfo.map(c => c.name);
    
    if (!aiConfigColumns.includes('openai_key')) {
      console.log("Adicionando coluna 'openai_key'...");
      db.prepare("ALTER TABLE ai_config ADD COLUMN openai_key TEXT").run();
    }
    if (!aiConfigColumns.includes('claude_key')) {
      console.log("Adicionando coluna 'claude_key'...");
      db.prepare("ALTER TABLE ai_config ADD COLUMN claude_key TEXT").run();
    }
    if (!aiConfigColumns.includes('deepseek_key')) {
      console.log("Adicionando coluna 'deepseek_key'...");
      db.prepare("ALTER TABLE ai_config ADD COLUMN deepseek_key TEXT").run();
    }
    if (!aiConfigColumns.includes('datajud_key')) {
      console.log("Adicionando coluna 'datajud_key'...");
      db.prepare("ALTER TABLE ai_config ADD COLUMN datajud_key TEXT").run();
    }
    if (!aiConfigColumns.includes('primary_ia')) {
      console.log("Adicionando coluna 'primary_ia'...");
      db.prepare("ALTER TABLE ai_config ADD COLUMN primary_ia TEXT DEFAULT 'Gemini'").run();
    }
    if (!aiConfigColumns.includes('secondary_ia')) {
      console.log("Adicionando coluna 'secondary_ia'...");
      db.prepare("ALTER TABLE ai_config ADD COLUMN secondary_ia TEXT").run();
    }
    if (!aiConfigColumns.includes('custom_domain')) {
      console.log("Adicionando coluna 'custom_domain'...");
      db.prepare("ALTER TABLE ai_config ADD COLUMN custom_domain TEXT").run();
    }
  } catch (err) {
    console.error("Erro durante as migrações:", err);
  }
  console.log("Tabelas de configuração inicializadas.");
} catch (err) {
  console.error("Erro ao inicializar tabelas:", err);
}

// Seed default admin if not exists
const adminExists: any = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER('admin')").get();
if (!adminExists) {
  console.log("DEBUG: Criando usuário admin padrão...");
  const hashedPassword = bcrypt.hashSync("admin", 10);
  db.prepare("INSERT INTO users (id, name, email, username, password, role) VALUES (?, ?, ?, ?, ?, ?)").run(
    "admin-id", "Administrador", "admin@leiloes.pro", "admin", hashedPassword, "Admin"
  );
  console.log("DEBUG: Usuário admin criado.");
} else {
  console.log("DEBUG: Forçando atualização do usuário admin...");
  const hashedPassword = bcrypt.hashSync("admin", 10);
  db.prepare("UPDATE users SET username = 'admin', password = ?, name = 'Administrador', email = 'admin@leiloes.pro', role = 'Admin' WHERE id = ?").run(hashedPassword, adminExists.id);
}

// Seed tjinvest admin user
const tjinvestExists: any = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER('tjinvest')").get();
if (!tjinvestExists) {
  console.log("DEBUG: Criando usuário tjinvest...");
  const hashedPassword = bcrypt.hashSync("251204", 10);
  db.prepare("INSERT INTO users (id, name, email, username, password, role) VALUES (?, ?, ?, ?, ?, ?)").run(
    "tjinvest-id", "TJ Invest", "tjinvestoficial@gmail.com", "tjinvest", hashedPassword, "Admin"
  );
  console.log("DEBUG: Usuário tjinvest criado.");
} else {
  console.log("DEBUG: Forçando atualização do usuário tjinvest com a senha solicitada...");
  const hashedPassword = bcrypt.hashSync("251204", 10);
  db.prepare("UPDATE users SET username = 'tjinvest', password = ?, name = 'TJ Invest', email = 'tjinvestoficial@gmail.com', role = 'Admin' WHERE id = ?").run(hashedPassword, tjinvestExists.id);
  console.log("DEBUG: Usuário tjinvest atualizado.");
}

// Seed default AI config if not exists
const configExists = db.prepare("SELECT * FROM ai_config").get();
if (!configExists) {
  db.prepare("INSERT INTO ai_config (id, gemini_key) VALUES (?, ?)").run("default-config", "");
} else {
  const config: any = configExists;
  if (config.gemini_key === "AIzaSyCxuXCxQOonKnDIDNKuP6LvyWxPEK2Gnec") {
    db.prepare("UPDATE ai_config SET gemini_key = ? WHERE id = ?").run("", "default-config");
  }
}
try {
  db.prepare("UPDATE ai_config SET gemini_key = '' WHERE gemini_key = 'AIzaSyCxuXCxQOonKnDIDNKuP6LvyWxPEK2Gnec'").run();
} catch (e) {
  // Ignore if table/key is not fully available structure-wise
}

async function startServer() {
  console.log("Iniciando startServer...");
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '100mb' }));

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/auth/login", (req, res) => {
    const rawUsername = req.body.username || "";
    const username = typeof rawUsername === 'string' ? rawUsername.trim() : "";
    const password = req.body.password;
    console.log("DEBUG: Recebendo tentativa de login para:", username);
    
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER(TRIM(?))").get(username);
      console.log("DEBUG: Usuário encontrado no banco:", user ? "Sim" : "Não");
      
      if (!user) {
        console.log("DEBUG: Usuário não encontrado.");
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const passwordMatch = bcrypt.compareSync(password, user.password);
      console.log("DEBUG: Senha coincide:", passwordMatch ? "Sim" : "Não");

      if (!passwordMatch) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      console.log("DEBUG: Login bem-sucedido para:", username);
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
      console.error("DEBUG: Erro durante o login:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // --- Property Routes ---
  app.get("/api/properties", authenticateToken, (req, res) => {
    const properties = db.prepare("SELECT * FROM properties ORDER BY created_at DESC").all();
    res.json(properties);
  });

  app.post("/api/properties", authenticateToken, (req, res) => {
    try {
      const id = Math.random().toString(36).substring(7);
      const { title, type, modality, address, city, state, valuation_value, min_bid, expected_sale_value, auction_url } = req.body;
      db.prepare("INSERT INTO properties (id, title, type, modality, address, city, state, valuation_value, min_bid, expected_sale_value, auction_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        id, title, type, modality, address, city, state, valuation_value, min_bid, expected_sale_value || 0, auction_url || null
      );
      res.json({ id });
    } catch (error: any) {
      console.error("Erro ao inserir imóvel:", error.message);
      res.status(500).json({ error: "Erro ao inserir imóvel: " + error.message });
    }
  });

  app.put("/api/properties/:id", authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const { title, type, modality, address, city, state, valuation_value, min_bid, expected_sale_value, auction_url } = req.body;
      
      const existing = db.prepare("SELECT * FROM properties WHERE id = ?").get(id);
      if (!existing) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }

      db.prepare(`
        UPDATE properties 
        SET title = ?,
            type = ?,
            modality = ?,
            address = ?,
            city = ?,
            state = ?,
            valuation_value = ?,
            min_bid = ?,
            expected_sale_value = ?,
            auction_url = ?
        WHERE id = ?
      `).run(
        title !== undefined ? title : existing.title,
        type !== undefined ? type : existing.type,
        modality !== undefined ? modality : existing.modality,
        address !== undefined ? address : existing.address,
        city !== undefined ? city : existing.city,
        state !== undefined ? state : existing.state,
        valuation_value !== undefined ? valuation_value : existing.valuation_value,
        min_bid !== undefined ? min_bid : existing.min_bid,
        expected_sale_value !== undefined ? expected_sale_value : existing.expected_sale_value,
        auction_url !== undefined ? auction_url : existing.auction_url,
        id
      );

      res.json({ message: "Imóvel atualizado com sucesso" });
    } catch (error: any) {
      console.error("Erro ao atualizar imóvel:", error.message);
      res.status(500).json({ error: "Erro ao atualizar imóvel: " + error.message });
    }
  });

  // --- DataJud Integration ---
  app.post("/api/datajud/search", authenticateToken, async (req, res) => {
    const { cnj_number } = req.body;
    const config: any = db.prepare("SELECT datajud_key FROM ai_config").get();
    
    if (config?.datajud_key) {
      try {
        // Real DataJud API call
        const response = await axios.post('https://api-publica.datajud.cnj.jus.br/v1/search', {
          query: {
            match: {
              numeroProcesso: cnj_number.replace(/\D/g, '') // Remove non-digits
            }
          }
        }, {
          headers: {
            'Authorization': `APIKey ${config.datajud_key}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Transform DataJud response to our internal format if needed
        const hits = response.data.hits?.hits || [];
        if (hits.length > 0) {
          const process = hits[0]._source;
          return res.json({
            cnj_number: process.numeroProcesso,
            court: process.tribunal,
            class: process.classe?.nome || "Não informada",
            subject: process.assuntos?.[0]?.nome || "Não informado",
            chamber: process.orgaoJulgador?.nome || "Não informado",
            parties: process.movimentos?.slice(0, 5).map((m: any) => m.nome).join(", ") || "Dados protegidos",
            last_movement: process.movimentos?.[0]?.nome || "Sem movimentos",
            status: "Consultado via API"
          });
        }
      } catch (error: any) {
        console.error("DataJud API Error:", error.response?.data || error.message);
        // Fallback to mock if API fails but key was present (maybe expired?)
      }
    }

    // Mock response for demonstration if no key or API fails
    res.json({
      cnj_number,
      court: "TJMG",
      class: "Execução de Título Extrajudicial",
      subject: "Alienação Fiduciária",
      chamber: "2ª Vara Cível de Belo Horizonte",
      parties: "Banco X vs João Silva",
      last_movement: "Mandado de Penhora Expedido",
      status: "Demonstração (Configure sua API Key)"
    });
  });

  // --- AI Config Routes ---
  app.get("/api/ai-config", authenticateToken, (req, res) => {
    try {
      const config = db.prepare("SELECT * FROM ai_config LIMIT 1").get();
      console.log("AI Config fetched:", config ? "Found" : "Not found");
      res.json(config || {});
    } catch (error: any) {
      console.error("Error fetching AI config:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai-config", authenticateToken, (req, res) => {
    try {
      const currentConfig: any = db.prepare("SELECT * FROM ai_config LIMIT 1").get() || {};
      const { 
        primary_ia = currentConfig.primary_ia || 'Gemini', 
        secondary_ia = currentConfig.secondary_ia || '', 
        gemini_key = currentConfig.gemini_key || '', 
        openai_key = currentConfig.openai_key || '', 
        claude_key = currentConfig.claude_key || '', 
        deepseek_key = currentConfig.deepseek_key || '',
        datajud_key = currentConfig.datajud_key || '',
        custom_domain = currentConfig.custom_domain || ''
      } = req.body;
      
      const result = db.prepare(`
        UPDATE ai_config 
        SET primary_ia = ?, 
            secondary_ia = ?, 
            gemini_key = ?, 
            openai_key = ?, 
            claude_key = ?, 
            deepseek_key = ?, 
            datajud_key = ?, 
            custom_domain = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM ai_config LIMIT 1)
      `).run(
        primary_ia, secondary_ia, gemini_key, openai_key, claude_key, deepseek_key, datajud_key, custom_domain
      );

      if (result.changes === 0) {
        db.prepare(`
          INSERT INTO ai_config (id, primary_ia, secondary_ia, gemini_key, openai_key, claude_key, deepseek_key, datajud_key, custom_domain)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('default-config', primary_ia, secondary_ia, gemini_key, openai_key, claude_key, deepseek_key, datajud_key, custom_domain);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving AI config:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Backup and Restore Routes ---
  app.get("/api/backup", authenticateToken, (req, res) => {
    try {
      if (!fs.existsSync(DB_NAME)) {
        return res.status(404).json({ error: "Banco de dados não encontrado" });
      }
      
      const backupPath = path.join(process.cwd(), "leiloes_pro_backup_temp.db");
      db.backup(backupPath)
        .then(() => {
          res.download(backupPath, "leiloes_pro_backup.db", (err) => {
            try {
              if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
              }
            } catch (cleanupErr) {
              console.error("Erro ao deletar arquivo de backup temp:", cleanupErr);
            }
          });
        })
        .catch((backupErr) => {
          console.error("Erro ao realizar backup do banco:", backupErr);
          res.status(500).json({ error: "Erro ao gerar arquivo de backup: " + backupErr.message });
        });
    } catch (error: any) {
      console.error("Erro na API de backup:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/restore", authenticateToken, upload.single('backup_file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Arquivo de backup não fornecido" });
      }

      const tempRestorePath = path.join(process.cwd(), "leiloes_pro_restore_temp.db");
      fs.writeFileSync(tempRestorePath, req.file.buffer);

      // Perform integrity check using better-sqlite3
      try {
        const testDb = new Database(tempRestorePath);
        const integrity = testDb.prepare("PRAGMA integrity_check").get() as any;
        testDb.close();

        if (!integrity || integrity.integrity_check !== "ok") {
          throw new Error("Integrity check failed: " + JSON.stringify(integrity));
        }
      } catch (integrityErr: any) {
        if (fs.existsSync(tempRestorePath)) {
          fs.unlinkSync(tempRestorePath);
        }
        return res.status(400).json({ error: "Arquivo inválido ou corrompido. Certifique-se de enviar um banco SQLite correto. " + integrityErr.message });
      }

      // Overwrite current database
      console.log("[Restore] Integrity check passed. Replaced database starting...");
      
      db.close();
      fs.renameSync(tempRestorePath, DB_NAME);
      db = new Database(DB_NAME);

      console.log("[Restore] Database replaced and re-opened successfully.");
      res.json({ success: true, message: "Banco de dados restaurado com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao restaurar banco:", error.message);
      try {
        db = new Database(DB_NAME);
      } catch (recoveryErr) {
        console.error("Critical: Failed to re-initialize SQLite on restore failure:", recoveryErr);
      }
      res.status(500).json({ error: "Erro ao restaurar backup: " + error.message });
    }
  });

  app.get("/api/strategic-brain", authenticateToken, (req, res) => {
    const items = db.prepare("SELECT * FROM strategic_brain ORDER BY created_at DESC").all();
    res.json(items);
  });

  app.post("/api/strategic-brain/:id/sync", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const item: any = db.prepare("SELECT * FROM strategic_brain WHERE id = ?").get(id);
    
    if (!item || !item.url) {
      return res.status(404).json({ error: "Fonte não encontrada ou não possui URL" });
    }

    try {
      // Basic fetch for public or simple sites
      // For password protected sites, this is a placeholder for a more complex crawler
      const response = await axios.get(item.url, { timeout: 10000 });
      const html = response.data;
      
      // Use Gemini to extract meaningful text from HTML
      // This is a simplified version of "reading files and watching classes"
      const extractedText = `Conteúdo sincronizado de ${item.url} em ${new Date().toISOString()}.\n\n(Simulação de extração de dados automatizada)`;
      
      db.prepare("UPDATE strategic_brain SET extracted_text = ?, last_sync = CURRENT_TIMESTAMP WHERE id = ?").run(
        extractedText, id
      );
      
      res.json({ success: true, last_sync: new Date().toISOString() });
    } catch (error: any) {
      console.error("Erro no sync:", error.message);
      res.status(500).json({ error: "Erro ao sincronizar fonte externa: " + error.message });
    }
  });

  app.post("/api/strategic-brain", authenticateToken, async (req, res) => {
    try {
      const id = Math.random().toString(36).substring(7);
      const { title, category, source, extracted_text, data, url, username, password, is_automated, module, lesson } = req.body;
      
      let finalExtractedText = extracted_text || null;
      
      // Auto-extract text from manually uploaded PDF or Text files
      if (data && data.startsWith("data:")) {
        try {
          const parts = data.split(",");
          const meta = parts[0];
          const base64Data = parts[1];
          const mimeMatch = meta.match(/data:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "";
          const buffer = Buffer.from(base64Data, "base64");
          
          if (mimeType === 'application/pdf') {
            console.log(`[CÉREBRO] Extraindo texto do PDF anexado ao cérebro para o ID ${id}...`);
            const text = await extractTextFromBuffer(buffer, mimeType);
            if (text && text.trim().length > 0) {
              finalExtractedText = text;
              console.log(`[CÉREBRO] Extraído com sucesso. Tamanho: ${text.length} caracteres.`);
            }
          } else if (mimeType.startsWith('text/') || mimeType.includes('txt')) {
            const text = buffer.toString('utf-8');
            if (text && text.trim().length > 0) {
              finalExtractedText = text;
              console.log(`[CÉREBRO] Texto plano carregado. Tamanho: ${text.length} caracteres.`);
            }
          }
        } catch (err: any) {
          console.error("[CÉREBRO] Erro na extração automática ao salvar novo conhecimento:", err.message);
        }
      }

      db.prepare("INSERT INTO strategic_brain (id, title, category, source, extracted_text, data, url, username, password, is_automated, module, lesson) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        id, title, category, source, finalExtractedText || null, data || null, url || null, username || null, password || null, is_automated ? 1 : 0, module || null, lesson || null
      );
      res.json({ id });
    } catch (error: any) {
      console.error("Erro ao salvar cérebro:", error.message);
      res.status(500).json({ error: "Erro interno ao salvar conhecimento: " + error.message });
    }
  });

  app.delete("/api/strategic-brain/:id", authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM strategic_brain WHERE id = ?").run(id);
      res.status(200).json({ message: "Item excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // --- AI Analysis Routes ---
  app.get("/api/ai-analyses", authenticateToken, (req, res) => {
    const analyses = db.prepare("SELECT * FROM ai_analyses").all();
    res.json(analyses);
  });

  app.get("/api/ai-analyses/:propertyId", authenticateToken, (req, res) => {
    const analyses = db.prepare("SELECT * FROM ai_analyses WHERE property_id = ? ORDER BY created_at DESC").all(req.params.propertyId);
    res.json(analyses);
  });

  app.post("/api/ai-analyses", authenticateToken, (req, res) => {
    try {
      const id = Math.random().toString(36).substring(7);
      const { property_id, exec_summary, legal_analysis, financial_analysis, legal_risks, operational_risks, recommended_bid, roi, tir, estimated_profit, ia_used } = req.body;
      
      db.prepare(`
        INSERT INTO ai_analyses (id, property_id, exec_summary, legal_analysis, financial_analysis, legal_risks, operational_risks, recommended_bid, roi, tir, estimated_profit, ia_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, property_id, exec_summary, legal_analysis, financial_analysis, legal_risks, operational_risks, recommended_bid, roi, tir, estimated_profit, ia_used);
      
      res.json({ id });
    } catch (error: any) {
      console.error("Erro ao inserir análise:", error.message);
      res.status(500).json({ error: "Erro ao inserir análise: " + error.message });
    }
  });

  app.delete("/api/ai-analyses/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM ai_analyses WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar análise:", error.message);
      res.status(500).json({ error: "Erro ao deletar análise: " + error.message });
    }
  });

  app.put("/api/ai-analyses/:id", authenticateToken, (req, res) => {
    try {
      const { exec_summary, financial_analysis, recommended_bid, roi, tir, estimated_profit } = req.body;
      
      const fields: string[] = [];
      const values: any[] = [];
      
      if (exec_summary !== undefined) {
        fields.push("exec_summary = ?");
        values.push(exec_summary);
      }
      if (financial_analysis !== undefined) {
        fields.push("financial_analysis = ?");
        values.push(financial_analysis);
      }
      if (recommended_bid !== undefined) {
        fields.push("recommended_bid = ?");
        values.push(recommended_bid);
      }
      if (roi !== undefined) {
        fields.push("roi = ?");
        values.push(roi);
      }
      if (tir !== undefined) {
        fields.push("tir = ?");
        values.push(tir);
      }
      if (estimated_profit !== undefined) {
        fields.push("estimated_profit = ?");
        values.push(estimated_profit);
      }
      
      if (fields.length > 0) {
        values.push(req.params.id);
        const query = `UPDATE ai_analyses SET ${fields.join(", ")} WHERE id = ?`;
        db.prepare(query).run(...values);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao atualizar análise:", error.message);
      res.status(500).json({ error: "Erro ao atualizar análise: " + error.message });
    }
  });

  // --- User Management ---
  app.get("/api/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.sendStatus(403);
    const users = db.prepare("SELECT id, name, email, username, role, status, created_at FROM users").all();
    res.json(users);
  });

  app.post("/api/users", authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'Admin') return res.sendStatus(403);
      const { name, email, username, password, role } = req.body;
      const id = Math.random().toString(36).substring(7);
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (id, name, email, username, password, role) VALUES (?, ?, ?, ?, ?, ?)").run(
        id, name, email, username, hashedPassword, role
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error.message);
      res.status(400).json({ error: "Usuário ou email já existe: " + error.message });
    }
  });

  app.delete("/api/properties/:id", authenticateToken, (req, res) => {
    try {
      // Delete related records first if not using CASCADE
      db.prepare("DELETE FROM processes WHERE property_id = ?").run(req.params.id);
      db.prepare("DELETE FROM documents WHERE property_id = ?").run(req.params.id);
      db.prepare("DELETE FROM debts WHERE property_id = ?").run(req.params.id);
      db.prepare("DELETE FROM ai_analyses WHERE property_id = ?").run(req.params.id);
      db.prepare("DELETE FROM process_stories WHERE property_id = ?").run(req.params.id);
      
      db.prepare("DELETE FROM properties WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar imóvel:", error.message);
      res.status(500).json({ error: "Erro ao deletar imóvel: " + error.message });
    }
  });

  app.delete("/api/documents/:id", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar documento:", error.message);
      res.status(500).json({ error: "Erro ao deletar documento: " + error.message });
    }
  });

  app.delete("/api/documents-clear", authenticateToken, (req, res) => {
    try {
      db.prepare("DELETE FROM documents").run();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao limpar documentos:", error.message);
      res.status(500).json({ error: "Erro ao limpar documentos: " + error.message });
    }
  });

  app.delete("/api/users/:id", authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'Admin') return res.sendStatus(403);
      // Prevent deleting the last admin or yourself if needed, but for now simple delete
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error.message);
      res.status(500).json({ error: "Erro ao deletar usuário: " + error.message });
    }
  });

  // --- Process Routes ---
  app.get("/api/processes", authenticateToken, (req, res) => {
    const processes = db.prepare("SELECT * FROM processes").all();
    res.json(processes);
  });

  app.post("/api/processes", authenticateToken, (req, res) => {
    try {
      const id = Math.random().toString(36).substring(7);
      const { cnj_number, court, chamber, action_type, debt_value, parties, property_id } = req.body;
      db.prepare("INSERT INTO processes (id, cnj_number, court, chamber, action_type, debt_value, parties, property_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
        id, cnj_number, court, chamber, action_type, debt_value, parties, property_id
      );
      res.json({ id });
    } catch (error: any) {
      console.error("Erro ao inserir processo:", error.message);
      res.status(500).json({ error: "Erro ao inserir processo: " + error.message });
    }
  });

  // --- Document Routes ---
  app.get("/api/all-documents", authenticateToken, async (req, res) => {
    try {
      const docs = db.prepare(`
        SELECT d.id, d.filename, d.doc_type, d.property_id, d.ia_summary, d.created_at, p.title as property_title 
        FROM documents d
        LEFT JOIN properties p ON d.property_id = p.id
        ORDER BY d.created_at DESC
      `).all() as any[];
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/documents/:propertyId", authenticateToken, async (req, res) => {
    try {
      const docs = db.prepare("SELECT id, filename, doc_type, extracted_text, ia_summary, created_at FROM documents WHERE property_id = ? OR temp_property_id = ?").all(req.params.propertyId, req.params.propertyId) as any[];
      
      // On-the-fly extraction for existing docs
      for (const doc of docs) {
        if (!doc.extracted_text) {
          const row = db.prepare("SELECT data FROM documents WHERE id = ?").get(doc.id) as any;
          if (row && row.data) {
            try {
              const buffer = Buffer.from(row.data, 'base64');
              const mimeType = doc.filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'unknown';
              const text = await extractTextFromBuffer(buffer, mimeType);
              if (text) {
                db.prepare("UPDATE documents SET extracted_text = ? WHERE id = ?").run(text, doc.id);
                doc.extracted_text = text;
              }
            } catch (err) {
              console.error(`Erro na extração on-the-fly para doc ${doc.id}:`, err);
            }
          }
        }
      }
      
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/documents", authenticateToken, upload.array('files'), async (req, res) => {
    try {
      const { doc_type, property_id } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const results = [];
      for (const file of files) {
        const id = Math.random().toString(36).substring(7);
        const filename = file.originalname;
        const data = file.buffer.toString('base64');
        const extracted_text = await extractTextFromBuffer(file.buffer, file.mimetype);
        
        let final_property_id = property_id || null;
        let temp_property_id = null;
        if (property_id && property_id.startsWith('temp_')) {
          temp_property_id = property_id;
          final_property_id = null;
        }

        db.prepare("INSERT INTO documents (id, filename, doc_type, property_id, temp_property_id, data, extracted_text) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          id, filename, doc_type, final_property_id, temp_property_id, data, extracted_text
        );
        results.push({ id, extracted_text });
      }
      
      res.json(results);
    } catch (error: any) {
      console.error("Erro ao inserir documentos:", error.message);
      res.status(500).json({ error: "Erro ao inserir documentos: " + error.message });
    }
  });

  app.post("/api/documents/text-only", authenticateToken, async (req, res) => {
    try {
      const { filename, doc_type, property_id, extracted_text } = req.body;
      
      if (!filename || !doc_type) {
        return res.status(400).json({ error: "filename e doc_type são obrigatórios" });
      }

      const id = Math.random().toString(36).substring(7);
      
      let final_property_id = property_id || null;
      let temp_property_id = null;
      if (property_id && property_id.startsWith('temp_')) {
        temp_property_id = property_id;
        final_property_id = null;
      }

      db.prepare("INSERT INTO documents (id, filename, doc_type, property_id, temp_property_id, data, extracted_text) VALUES (?, ?, ?, ?, ?, NULL, ?)").run(
        id, filename, doc_type, final_property_id, temp_property_id, extracted_text || ""
      );
      
      res.json([{ id, extracted_text: extracted_text || "" }]);
    } catch (error: any) {
      console.error("Erro ao inserir documento de texto:", error.message);
      res.status(500).json({ error: "Erro ao inserir documento de texto: " + error.message });
    }
  });

  app.put("/api/documents/link", authenticateToken, (req, res) => {
    try {
      const { temp_property_id, property_id } = req.body;
      db.prepare("UPDATE documents SET property_id = ?, temp_property_id = NULL WHERE temp_property_id = ?").run(property_id, temp_property_id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao vincular documento:", error.message);
      res.status(500).json({ error: "Erro ao vincular documento: " + error.message });
    }
  });

  // --- Process Story Routes ---
  app.get("/api/process-stories/:propertyId", authenticateToken, (req, res) => {
    try {
      const story = db.prepare("SELECT * FROM process_stories WHERE property_id = ? ORDER BY created_at DESC LIMIT 1").get(req.params.propertyId);
      res.json(story || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/process-stories", authenticateToken, (req, res) => {
    try {
      const id = Math.random().toString(36).substring(7);
      const { property_id, full_story, legal_glossary, timeline_json } = req.body;
      
      db.prepare(`
        INSERT INTO process_stories (id, property_id, full_story, legal_glossary, timeline_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, property_id, full_story, legal_glossary, timeline_json);
      
      res.json({ id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/process-stories/:id", authenticateToken, (req, res) => {
    try {
      const { full_story, legal_glossary, timeline_json } = req.body;
      db.prepare(`
        UPDATE process_stories 
        SET full_story = ?, legal_glossary = ?, timeline_json = ?
        WHERE id = ?
      `).run(full_story, legal_glossary, timeline_json, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Debt Routes ---
  app.get("/api/debts/:propertyId", authenticateToken, (req, res) => {
    const debts = db.prepare("SELECT * FROM debts WHERE property_id = ?").all(req.params.propertyId);
    res.json(debts);
  });

  app.post("/api/debts", authenticateToken, (req, res) => {
    try {
      const id = Math.random().toString(36).substring(7);
      const { property_id, type, value, responsible, observations } = req.body;
      db.prepare("INSERT INTO debts (id, property_id, type, value, responsible, observations) VALUES (?, ?, ?, ?, ?, ?)").run(
        id, property_id, type, value, responsible, observations
      );
      res.json({ id });
    } catch (error: any) {
      console.error("Erro ao inserir dívida:", error.message);
      res.status(500).json({ error: "Erro ao inserir dívida: " + error.message });
    }
  });

  // --- Public Share Routes ---
  app.get("/api/public/property/:token", (req, res) => {
    const { token } = req.params;
    const property: any = db.prepare("SELECT * FROM properties WHERE share_token = ? AND is_public = 1").get(token);
    
    if (!property) {
      return res.status(404).json({ error: "Relatório não encontrado ou não está público." });
    }

    const analysis = db.prepare("SELECT * FROM ai_analyses WHERE property_id = ? ORDER BY created_at DESC LIMIT 1").get(property.id);
    const debts = db.prepare("SELECT * FROM debts WHERE property_id = ?").all(property.id);
    
    res.json({
      property,
      analysis,
      debts
    });
  });

  app.post("/api/properties/:id/share", authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const { is_public, anonymize_property } = req.body;
      
      let property: any = db.prepare("SELECT share_token FROM properties WHERE id = ?").get(id);
      if (!property) return res.status(404).json({ error: "Imóvel não encontrado" });

      let token = property.share_token;
      if (!token) {
        token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }

      db.prepare("UPDATE properties SET share_token = ?, is_public = ?, anonymize_property = ? WHERE id = ?").run(token, is_public ? 1 : 0, anonymize_property ? 1 : 0, id);
      res.json({ share_token: token, is_public, anonymize_property });
    } catch (error: any) {
      console.error("Erro ao compartilhar imóvel:", error.message);
      res.status(500).json({ error: "Erro ao compartilhar imóvel: " + error.message });
    }
  });

  // --- Secure Server-Side AI Proxy Endpoints ---
  app.post("/api/ai/analyze", authenticateToken, async (req, res) => {
    try {
      const { files, systemInstruction, model, apiKey, auctionUrls, analysisType } = req.body;
      const provider = model.startsWith('gemini') ? 'gemini' : 
                       model.startsWith('claude') ? 'claude' : 
                       (model.startsWith('gpt') || model.startsWith('o1')) ? 'openai' : 'deepseek';

      console.log(`[PROXY DIAGNOSTICS] analyze requested. Model: ${model}, Provider: ${provider}, incoming apiKey length: ${apiKey ? apiKey.length : 0}`);

      // Server-side file hydration to keep payloads small and protect transmission issues
      const hydratedFiles = [];
      if (Array.isArray(files)) {
        for (const f of files) {
          if (f.id) {
            const dbDoc = db.prepare("SELECT data, extracted_text, filename FROM documents WHERE id = ?").get(f.id) as any;
            if (dbDoc) {
              const mimeType = (dbDoc.filename || f.filename || "").toLowerCase().endsWith('.pdf') ? 'application/pdf' : f.mimeType;
              hydratedFiles.push({
                ...f,
                id: f.id,
                filename: dbDoc.filename || f.filename,
                data: dbDoc.data || f.data || "",
                mimeType: mimeType,
                extractedText: dbDoc.extracted_text || f.extractedText || ""
              });
              continue;
            }
          }
          hydratedFiles.push(f);
        }
      }

      let resolvedKey = apiKey || "";
      let foundInDb = false;
      if (!resolvedKey || resolvedKey.trim() === "") {
        const config: any = db.prepare("SELECT * FROM ai_config LIMIT 1").get() || {};
        foundInDb = true;
        if (provider === 'gemini') resolvedKey = config.gemini_key || "";
        else if (provider === 'openai') resolvedKey = config.openai_key || "";
        else if (provider === 'claude') resolvedKey = config.claude_key || "";
        else if (provider === 'deepseek') resolvedKey = config.deepseek_key || "";
        console.log(`[PROXY DIAGNOSTICS] Key resolved from DB config. Key length: ${resolvedKey ? resolvedKey.length : 0}`);
      }

      if (!resolvedKey || resolvedKey.trim() === "") {
        if (provider === 'gemini') {
          resolvedKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
          console.log(`[PROXY DIAGNOSTICS] Resolved from process.env (GEMINI_API_KEY / API_KEY). Length: ${resolvedKey ? resolvedKey.length : 0}`);
        } else if (provider === 'openai') {
          resolvedKey = process.env.OPENAI_API_KEY || "";
          console.log(`[PROXY DIAGNOSTICS] Resolved from process.env (OPENAI_API_KEY). Length: ${resolvedKey ? resolvedKey.length : 0}`);
        } else if (provider === 'claude') {
          resolvedKey = process.env.CLAUDE_API_KEY || "";
          console.log(`[PROXY DIAGNOSTICS] Resolved from process.env (CLAUDE_API_KEY). Length: ${resolvedKey ? resolvedKey.length : 0}`);
        } else if (provider === 'deepseek') {
          resolvedKey = process.env.DEEPSEEK_API_KEY || "";
          console.log(`[PROXY DIAGNOSTICS] Resolved from process.env (DEEPSEEK_API_KEY). Length: ${resolvedKey ? resolvedKey.length : 0}`);
        }
      }

      if (resolvedKey.includes(' • ')) {
        resolvedKey = resolvedKey.split(' • ')[1].trim();
      }

      if (!resolvedKey || resolvedKey.trim().length < 5) {
        console.error(`[PROXY ERROR] Key too short or empty for provider ${provider}: "${resolvedKey}" (length: ${resolvedKey ? resolvedKey.length : 0})`);
        return res.status(400).json({ error: `Configuração de IA incompleta: Nenhuma chave de API válida encontrada para o provedor ${provider.toUpperCase()}` });
      }

      console.log(`[Proxy] Iniciando análise de IA com provedor ${provider} de ${hydratedFiles.length} arquivos.`);
      const result = await runBackendAnalysis(hydratedFiles, systemInstruction, model, resolvedKey, auctionUrls, analysisType);
      res.json({ result });
    } catch (error: any) {
      console.error("Erro na API de análise server-side:", error);
      res.status(500).json({ error: error.message || "Erro desconhecido na análise." });
    }
  });

  app.post("/api/ai/story", authenticateToken, async (req, res) => {
    try {
      const { files, model, apiKey } = req.body;
      const provider = model.startsWith('gemini') ? 'gemini' : 
                       model.startsWith('claude') ? 'claude' : 
                       (model.startsWith('gpt') || model.startsWith('o1')) ? 'openai' : 'deepseek';

      // Server-side file hydration to keep payloads small and protect transmission issues
      const hydratedFiles = [];
      if (Array.isArray(files)) {
        for (const f of files) {
          if (f.id) {
            const dbDoc = db.prepare("SELECT data, extracted_text, filename FROM documents WHERE id = ?").get(f.id) as any;
            if (dbDoc) {
              const mimeType = (dbDoc.filename || f.filename || "").toLowerCase().endsWith('.pdf') ? 'application/pdf' : f.mimeType;
              hydratedFiles.push({
                ...f,
                id: f.id,
                filename: dbDoc.filename || f.filename,
                data: dbDoc.data || f.data || "",
                mimeType: mimeType,
                extractedText: dbDoc.extracted_text || f.extractedText || ""
              });
              continue;
            }
          }
          hydratedFiles.push(f);
        }
      }

      let resolvedKey = apiKey || "";
      if (!resolvedKey || resolvedKey.trim() === "") {
        const config: any = db.prepare("SELECT * FROM ai_config LIMIT 1").get() || {};
        if (provider === 'gemini') resolvedKey = config.gemini_key || "";
        else if (provider === 'openai') resolvedKey = config.openai_key || "";
        else if (provider === 'claude') resolvedKey = config.claude_key || "";
        else if (provider === 'deepseek') resolvedKey = config.deepseek_key || "";
      }

      if (!resolvedKey || resolvedKey.trim() === "") {
        if (provider === 'gemini') {
          resolvedKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        } else if (provider === 'openai') {
          resolvedKey = process.env.OPENAI_API_KEY || "";
        } else if (provider === 'claude') {
          resolvedKey = process.env.CLAUDE_API_KEY || "";
        } else if (provider === 'deepseek') {
          resolvedKey = process.env.DEEPSEEK_API_KEY || "";
        }
      }

      if (resolvedKey.includes(' • ')) {
        resolvedKey = resolvedKey.split(' • ')[1].trim();
      }

      if (!resolvedKey || resolvedKey.trim().length < 5) {
        return res.status(400).json({ error: `Configuração de IA incompleta: Nenhuma chave de API válida encontrada para o provedor ${provider.toUpperCase()}` });
      }

      console.log(`[Proxy] Iniciando geração da história do processo com provedor ${provider}.`);
      const result = await runBackendProcessStory(hydratedFiles, model, resolvedKey);
      res.json(result);
    } catch (error: any) {
      console.error("Erro na API de Process Story server-side:", error);
      res.status(500).json({ error: error.message || "Erro desconhecido ao gerar história." });
    }
  });

  app.post("/api/ai/chat", authenticateToken, async (req, res) => {
    try {
      const { messages, systemInstruction, model, apiKey } = req.body;
      const provider = model.startsWith('gemini') ? 'gemini' : 
                       model.startsWith('claude') ? 'claude' : 
                       (model.startsWith('gpt') || model.startsWith('o1')) ? 'openai' : 'deepseek';

      let resolvedKey = apiKey || "";
      if (!resolvedKey || resolvedKey.trim() === "") {
        const config: any = db.prepare("SELECT * FROM ai_config LIMIT 1").get() || {};
        if (provider === 'gemini') resolvedKey = config.gemini_key || "";
        else if (provider === 'openai') resolvedKey = config.openai_key || "";
        else if (provider === 'claude') resolvedKey = config.claude_key || "";
        else if (provider === 'deepseek') resolvedKey = config.deepseek_key || "";
      }

      if (!resolvedKey || resolvedKey.trim() === "") {
        if (provider === 'gemini') {
          resolvedKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        } else if (provider === 'openai') {
          resolvedKey = process.env.OPENAI_API_KEY || "";
        } else if (provider === 'claude') {
          resolvedKey = process.env.CLAUDE_API_KEY || "";
        } else if (provider === 'deepseek') {
          resolvedKey = process.env.DEEPSEEK_API_KEY || "";
        }
      }

      if (resolvedKey.includes(' • ')) {
        resolvedKey = resolvedKey.split(' • ')[1].trim();
      }

      if (!resolvedKey || resolvedKey.trim().length < 5) {
        return res.status(400).json({ error: `Configuração de IA incompleta: Nenhuma chave de API válida encontrada para o provedor ${provider.toUpperCase()}` });
      }

      console.log(`[Proxy] Iniciando chat interativo IA com provedor ${provider}.`);
      const result = await runBackendChatMessage(messages, systemInstruction, model, resolvedKey);
      res.json({ result });
    } catch (error: any) {
      console.error("Erro na API de Chat server-side:", error);
      res.status(500).json({ error: error.message || "Erro desconhecido no chat." });
    }
  });

  // API Routes 404 Handler
  app.use("/api/*", (req, res) => {
    console.error(`DEBUG: API endpoint not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando Vite em modo middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite middleware configurado.");

    // Catch-all to log requests hitting Vite
    app.use((req, res, next) => {
      console.log(`DEBUG: Request hitting Vite: ${req.method} ${req.originalUrl}`);
      next();
    });
  } else {
    const rootDir = path.resolve(__dirname, '..');
    app.use(express.static(path.join(rootDir, "dist")));

    // Serve source files for sourcemaps to work in production without 404s
    app.use("/src", express.static(path.join(process.cwd(), "src"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      }
    }));

    app.use("/src", express.static(path.join(rootDir, "src"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      }
    }));

    app.get("/src/*", (req, res) => {
      const cleanPath = req.params[0] || req.path.replace(/^\/src\//, '');
      const safePath = path.normalize(cleanPath).replace(/^(\.\.(\/|\\|$))+/, '');
      
      const fullPath = path.join(process.cwd(), "src", safePath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
        return res.sendFile(fullPath);
      }
      
      const fallbackPath = path.join(rootDir, "src", safePath);
      if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
        if (fallbackPath.endsWith('.ts') || fallbackPath.endsWith('.tsx')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
        return res.sendFile(fallbackPath);
      }
      
      res.status(404).send('Not found');
    });
    
    // Catch-all for non-asset and non-api routes to return index.html (SPA routing)
    // But exclude /src/ and /assets/ to prevent HTML being returned for sourcemaps/scripts
    app.get("*", (req, res, next) => {
      if (req.url.startsWith('/src/') || req.url.startsWith('/assets/')) {
        return res.status(404).send('Not found');
      }
      res.sendFile(path.join(rootDir, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("DEBUG: Falha crítica ao iniciar o servidor:", err);
});

console.log("DEBUG: Script server.ts carregado completamente.");
