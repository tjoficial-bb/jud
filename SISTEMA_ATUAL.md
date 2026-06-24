# DOCUMENTAÇÃO TÉCNICA E ESTRUTURAL DO SISTEMA (TJ INVEST)

Este documento descreve detalhadamente a arquitetura, banco de dados, APIs, regras de inteligência artificial e componentes de interface do sistema **TJ Invest (Central de Inteligência de Leilões)**. Ele foi projetado para servir como um manual completo para que outra Inteligência Artificial compreenda perfeitamente o estado atual do software e consiga continuar o desenvolvimento sem fricção.

---

## 1. VISÃO GERAL DO SISTEMA

O **TJ Invest** é uma plataforma SaaS full-stack de inteligência de investimentos focada na análise avançada de leilões de imóveis (judiciais e extrajudiciais). 

### Objetivos do Sistema:
* **Ingestão Multimodal:** Recebimento e processamento de editais, certidões de matrícula de imóveis, laudos de avaliação e petições processuais.
* **Orquestração de IA:** Análise avançada de riscos jurídicos, passivos financeiros (débitos de IPTU/condomínio) e extração de dados estruturados usando o SDK oficial do Google GenAI.
* **Linha do Tempo Processual:** Reconstrução histórica inteligente do processo de execução judicial ("História do Processo") com geração de visualizações interativas.
* **Calculadora Financeira Avançada:** Projeções de TIR (Taxa Interna de Retorno), ROI (Retorno sobre Investimento) e fluxos de caixa complexos com comparadores de mercado (CDB, Poupança, Tesouro Direto, Aluguel).
* **Base de Conhecimento Estratégica (Cérebro Estratégico):** Sistema de RAG (Geração Aumentada por Recuperação) alimentado por links, leis e arquivos gerais para contextualizar as decisões da IA.

---

## 2. ARQUITETURA TÉCNICA (TECH STACK)

* **Runtime:** Node.js (Ambiente TypeScript unificado).
* **Frontend:** React 18 (SPA), Vite, Tailwind CSS para estilo utilitário e responsivo, e `motion/react` para animações fluidas.
* **Backend:** Express Server acoplado com o ecossistema de desenvolvimento do Vite (em desenvolvimento) e executado de forma estática compilada em CJS no ambiente de produção.
* **Banco de Dados:** SQLite integrado através da biblioteca síncrona de alto desempenho `better-sqlite3`.
* **Serviços de IA:** Integração nativa com o SDK `@google/genai` da Google Cloud para execução dos modelos Gemini 3.5 e Gemini 3.1, com suporte parametrizável para OpenAI (GPT-4o/o1), Anthropic (Claude 3.5) e DeepSeek (v3/R1).

---

## 3. ARVORE DE DIRETÓRIOS E COMPONENTES

```text
/ (Raiz do Projeto)
├── server.ts               # Servidor Express Full-stack (Rotas API, middlewares e autenticação)
├── package.json            # Scripts de build, dev, start e dependências npm
├── tsconfig.json           # Configurações do compilador TypeScript
├── vite.config.ts          # Configuração de build do Vite e injeção do Tailwind CSS
├── SISTEMA_ATUAL.md        # Esta documentação detalhada (disponível na raiz)
│
├── /server                 # Código exclusivo do servidor backend
│   └── aiRunner.ts         # Orquestrador de IA, limites de payload, prompt design e tratamento de erros
│
├── /src                    # Código-fonte do cliente (React)
│   ├── main.tsx            # Ponto de entrada do React
│   ├── App.tsx             # Componente central, controle de estados, roteamento local e renderização de abas
│   ├── index.css           # Estilização global e variáveis de fonte do Tailwind CSS
│   ├── db.ts               # Utilitário SQLite para manipulação síncrona local
│   ├── types.ts            # Definições globais de interfaces TypeScript (User, Property, Process, etc.)
│   ├── constants.ts        # Valores constantes do sistema
│   │
│   ├── /components         # Componentes React modulares
│   │   ├── Sidebar.tsx             # Menu lateral principal com controle de visão (Dashboard, IA, Configurações)
│   │   ├── DocumentManager.tsx     # Gerenciamento avançado de uploads e listagem de documentos
│   │   ├── DocumentUploadSlot.tsx  # Componente drag-and-drop de área de upload de arquivos
│   │   ├── TIRCalculator.tsx       # Motor de simulação financeira e comparativo de investimentos
│   │   ├── CashFlowChart.tsx       # Gráfico do fluxo de caixa e amortização do projeto
│   │   ├── DashboardCharts.tsx     # Gráficos e painéis de desempenho do Dashboard principal
│   │   ├── NewsFeed.tsx            # Feed de notícias e atualizações integrado ao painel
│   │   │
│   │   ├── /views                  # Visões de tela cheia do sistema
│   │   │   ├── DashboardView.tsx   # Painel bento-grid com cards de ativos, andamento de análises e métricas
│   │   │   └── DocumentsView.tsx   # Tela cheia dedicada ao controle documental geral
│   │   │
│   │   └── /layout                 # Componentes estruturais de interface
│   │       ├── EditalReport.tsx     # Relatório visual de análises do Edital de Leilão
│   │       ├── MatriculaReport.tsx  # Visualizador de análises jurídicas da Matrícula do Imóvel
│   │       ├── ProcessoReport.tsx   # Relatório detalhado dos autos do Processo Judicial
│   │       └── SmartAnalysisTab.tsx # Aba centralizada unificando os insights consolidados da IA
│   │
│   └── /services           # Serviços de integração de APIs
│       ├── aiService.ts            # Chamadas API cliente para IA, com algoritmo de downgrade automático
│       ├── apiService.ts           # Requisições REST CRUD para imóveis, processos, usuários e configurações
│       └── documentService.ts      # Controle de requisições de documentos de ativos
```

---

## 4. SCHEMA DO BANCO DE DADOS (SQLite - better-sqlite3)

O banco de dados é inicializado em `server.ts` de forma robusta com as seguintes tabelas e chaves estrangeiras:

### 4.1. Tabela `users`
Armazena os usuários e operadores credenciados do sistema.
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Operador', -- 'Admin' ou 'Operador'
  status TEXT DEFAULT 'Ativo',  -- 'Ativo' ou 'Inativo'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2. Tabela `properties`
Cadastro principal de imóveis levados a leilão.
```sql
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,                       -- Apartamento, Casa, Lote, Comercial, etc.
  modality TEXT,                   -- Judicial, Extrajudicial, Venda Direta
  address TEXT,
  city TEXT,
  state TEXT,
  area REAL,
  valuation_value REAL,            -- Valor de Avaliação de Mercado
  min_bid REAL,                    -- Lance Mínimo (1º ou 2º leilão)
  planned_max_bid REAL,            -- Lance Máximo Planejado pelo Investidor
  auctioned_value REAL,            -- Valor Efetivo de Arrematação
  expected_sale_value REAL,        -- Valor Esperado de Revenda
  actual_sale_value REAL,          -- Valor Efetivo de Venda (pós-arrematação)
  status TEXT DEFAULT 'Análise',   -- Análise, Arrematado, Desocupação, Vendido, Descartado
  observations TEXT,
  auction_url TEXT,                -- Link do portal do Leiloeiro Oficial
  share_token TEXT UNIQUE,         -- Token de compartilhamento público criptografado
  is_public INTEGER DEFAULT 0,     -- Flag boleana (0 ou 1) para acesso anônimo externo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3. Tabela `processes`
Processos judiciais relacionados às execuções de leilão.
```sql
CREATE TABLE IF NOT EXISTS processes (
  id TEXT PRIMARY KEY,
  cnj_number TEXT UNIQUE,          -- Código CNJ padronizado do processo brasileiro
  court TEXT,                      -- Tribunal (ex: TJSP, TRF3, TJMG)
  chamber TEXT,                    -- Vara Cível ou Câmara Julgadora
  action_type TEXT,                -- Execução de Título Extrajudicial, Cobrança de Condomínio, etc.
  debt_value REAL,                 -- Valor da causa ou da dívida cobrada
  parties TEXT,                    -- Autor vs. Réu (Armazenado de forma linearizada)
  status TEXT,                     -- Situação processual
  observations TEXT,
  property_id TEXT,
  source TEXT DEFAULT 'Manual',    -- 'Manual' ou extraído via 'DataJud'
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);
```

### 4.4. Tabela `documents`
Guarda os caminhos, metadados e os textos puros extraídos dos PDFs para análise direta da IA.
```sql
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  doc_type TEXT,                   -- Processo, Matricula, Edital, Dossier, Outros
  property_id TEXT,
  process_id TEXT,
  mime_type TEXT,
  data TEXT,                       -- Conteúdo do arquivo codificado em Base64 para envio multimodal
  extracted_text TEXT,             -- OCR ou texto puro extraído do documento para RAG rápido
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY(process_id) REFERENCES processes(id) ON DELETE CASCADE
);
```

### 4.5. Tabela `debts`
Controle analítico de débitos incidentes sobre o imóvel analisado.
```sql
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  type TEXT,                       -- IPTU, Condomínio, Taxas Municipais, Outros
  value REAL,
  responsible TEXT,                -- 'Arrematante' (comprador) ou 'Processo' (sub-rogado no preço)
  calculation_date DATE,
  observations TEXT,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);
```

### 4.6. Tabela `ai_analyses`
Histórico e relatórios consolidados gerados pelo Cérebro Estratégico de IA.
```sql
CREATE TABLE IF NOT EXISTS ai_analyses (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  exec_summary TEXT,               -- Sumário Executivo de Viabilidade Geral (Markdown)
  legal_analysis TEXT,             -- Parecer de Risco Jurídico Completo (Markdown)
  financial_analysis TEXT,         -- Parecer Financeiro e Tributário (Markdown)
  risk_level TEXT DEFAULT 'MÉDIO', -- BAIXO, MÉDIO, ALTO (Mapeado nos painéis de alerta)
  smart_analysis_json TEXT,        -- Objeto JSON contendo parâmetros estruturados inferidos pela IA
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);
```

### 4.7. Tabela `process_stories`
Reconstrução narrativa da "História do Processo" para que o investidor entenda o fluxo sem ler os autos.
```sql
CREATE TABLE IF NOT EXISTS process_stories (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  full_story TEXT,                 -- História traduzida em termos humanos simples (Markdown)
  legal_glossary TEXT,             -- Glossário explicativo dos termos jurídicos difíceis do processo
  timeline_json TEXT,              -- Array de objetos [{date, title, description, badge}] para o componente visual
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);
```

### 4.8. Tabela `strategic_brain`
A base de conhecimento interna para alimentar o contexto estendido da Inteligência Artificial (RAG).
```sql
CREATE TABLE IF NOT EXISTS strategic_brain (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,                   -- Jurisprudência, Leis, Regulamentos Caixa, Instrução Interna
  source TEXT,                     -- 'url', 'file', 'text'
  extracted_text TEXT,             -- Conteúdo textual indexado
  data TEXT,                       -- Arquivo anexo codificado em Base64 (opcional)
  embeddings TEXT,                 -- Representação vetorial (opcional)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.9. Tabela `ai_config`
Configurações globais de provedores de IA e chaves secretas de API para bypass de cotas.
```sql
CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY,
  primary_ia TEXT DEFAULT 'Gemini',-- Provedor Ativo (Gemini, OpenAI, Claude, DeepSeek)
  secondary_ia TEXT,
  gemini_key TEXT,
  openai_key TEXT,
  claude_key TEXT,
  deepseek_key TEXT,
  datajud_key TEXT,                -- Chave pública ou token DataJud (CNJ)
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. MIDDLEWARES E ROTAS DE API (server.ts)

Todas as rotas privadas de API são protegidas pelo middleware `authenticateToken` utilizando cabeçalho `Authorization: Bearer <JWT_TOKEN>` assinado na autenticação.

### 5.1. Autenticação
* `POST /api/auth/login`: Realiza validação de credenciais de usuários em hash e gera um token JWT expirável em 24h.

### 5.2. Cadastro de Ativos (properties)
* `GET /api/properties`: Retorna lista completa de imóveis.
* `POST /api/properties`: Cria novo imóvel.
* `PUT /api/properties/:id`: Atualiza dados cadastrais, financeiros e status.
* `DELETE /api/properties/:id`: Remove imóvel e todos os registros aninhados (Cascade local simulado).
* `POST /api/properties/:id/share`: Cria/Regera um link público encriptado de compartilhamento temporário.
* `GET /api/public/property/:token`: Rota pública, permite que terceiros acessem o relatório estratégico sem necessitar de login no sistema.

### 5.3. Integração Governamental (DataJud API CNJ)
* `POST /api/datajud/search`: Consulta e indexa dados de processos judiciais de qualquer tribunal do Brasil usando credenciais da API pública do CNJ (DataJud) e retorna os andamentos formatados.

### 5.4. Base RAG (strategic-brain)
* `GET /api/strategic-brain`: Lista todos os conhecimentos estratégicos indexados.
* `POST /api/strategic-brain`: Cadastra arquivos, leis ou URLs à base de dados.
* `POST /api/strategic-brain/:id/sync`: Executa o raspador interno ou conversor OCR para ler o material e sincronizar o texto puro.
* `DELETE /api/strategic-brain/:id`: Remove o item do cérebro estratégico.

### 5.5. Documentação de Imóveis (documents)
* `GET /api/all-documents`: Retorna todos os metadados de arquivos.
* `GET /api/documents/:propertyId`: Filtra arquivos carregados para um ativo específico.
* `POST /api/documents`: Recebe arquivos em lotes via multipart/form-data (usando middleware `multer`), salva localmente codificado em Base64 no banco de dados SQLite para estabilidade operacional, e extrai texto prévio.
* `POST /api/documents/text-only`: Registra um conteúdo de texto digitado manualmente associado a um tipo de documento fictício.
* `PUT /api/documents/link`: Associa uma URL externa ou link de portal de leiloeiro ao ativo.

### 5.6. Gestão Financeira (debts)
* `GET /api/debts/:propertyId`: Retorna todos os passivos financeiros cadastrados sobre o imóvel.
* `POST /api/debts`: Insere um novo débito (ex: Condomínio atrasado) para rateio de responsabilidade jurídica.

---

## 6. INTELIGÊNCIA ARTIFICIAL: MOTOR E ORQUESTRADOR (`server/aiRunner.ts`)

A lógica de processamento e inteligência artificial reside em `server/aiRunner.ts`. É aqui que estão os prompts detalhados e as funções de execução LLM.

### 6.1. Biblioteca Utilizada
O sistema utiliza o pacote mais recente e moderno da Google:
```ts
import { GoogleGenAI } from "@google/genai";
```
Este SDK é inicializado dinamicamente dentro dos endpoints para garantir isolamento e permitir que o sistema use o token padrão do servidor (`process.env.GEMINI_API_KEY`) ou a chave fornecida pelo usuário (`ai_config.gemini_key`) sem quebras globais.

### 6.2. Gerenciador de Erros e Downgrade Automático (Mecanismo Resiliente)
Para blindar o sistema contra falhas de conexão, sobrecarga e estouro de limites de cota da API (erros HTTP 429 / 503 / 500 / Quota Exhausted):
1. **Filtro de Erros Temporários:** O sistema mapeia os termos mais comuns de limite excedido e instabilidade:
   `quota`, `limit`, `exhausted`, `overloaded`, `temporary`, `503`, `429`, `unregistered callers`.
2. **Retry Exponencial:** Executa tentativas internas de reenvio com atrasos progressivos.
3. **Downgrade Session-wide (Front-to-Back):** Se o modelo avançado selecionado (ex: Gemini 3.1 Pro) falhar devido a limites de cota, o sistema:
   * Dispara um aviso amigável na tela (via toast customizado) informando que o modelo Pro está instável.
   * Altera dinamicamente o motor de execução para o **Gemini 3.5 Flash** (que possui altíssima cota e velocidade).
   * Ativa uma flag persistente em memória (`hasDowngradedToFlash = true`) para que as requisições subsequentes de análise ou chat usem o modelo Flash imediatamente, evitando múltiplos timeouts e lentidões na navegação do usuário.

### 6.3. Otimização de Carga Útil (Payload Budget)
Imagens em alta definição e PDFs pesados de processos podem estourar o limite de buffer do gateway de tráfego. 
O sistema possui a função `optimizePayload()` que calcula e restringe o payload multimodal enviado à API em no máximo **2MB**. Textos são priorizados, e arquivos de mídia pesados têm sua fidelidade de dados mantida de forma compactada.

### 6.4. Endpoints de Orquestração
* **`/api/ai/analyze` (Análise de Documentos):**
  Direciona a IA para realizar a análise documental segmentada. Com base na aba selecionada pelo usuário, a IA muda de persona e executa um prompt hiperespecializado:
  * `geral` (Viabilidade Geral): Compila um parecer de negócios completo e cospe um JSON estruturado para alimentar as variáveis financeiras da tela.
  * `edital` (Edital de Leilão): Lê prazos, comissão do leiloeiro, regras de parcelamento e multas.
  * `matricula` (Matrícula): Analisa a cadeia de proprietários, alienações fiduciárias, penhoras de terceiros e se o devedor foi intimado.
  * `processo` (Autos Judiciais): Analisa riscos de nulidades processuais e recursos pendentes de julgamento.
  * `dossier` (Dossiê Inteligente): Consolida em formato executivo um relatório final pronto para impressão ou envio.
* **`/api/ai/story` (História do Processo):**
  Lê a petição inicial e as decisões judiciais para gerar uma narrativa amigável estruturada, dividida em capítulos humanos com um glossário jurídico dinâmico traduzindo jargões, acompanhado de um objeto JSON contendo marcos temporais marcantes para plotagem de timeline.
* **`/api/ai/chat` (Chat Contextual):**
  Atua como consultor de investimentos sênior. Ele consome o texto extraído de todos os documentos anexados ao ativo atual e responde dúvidas específicas do investidor em tempo real, fornecendo respostas embasadas nos autos do processo e no edital do leilão.

---

## 7. REGRAS DO MOTOR FINANCEIRO E PROJEÇÕES (`TIRCalculator.tsx`)

O sistema não se limita a analisar textos, ele possui um motor financeiro de alta precisão que calcula a viabilidade econômica do investimento.

### 7.1. Modelo de Entrada de Custos (Desembolso):
O usuário ou a IA preenchem os seguintes campos (em R$ ou porcentagem):
* **Lance Estimado (Arrematação):** Base do cálculo.
* **Custos Extras de Entrada:** Taxas fixas (ex: R$ 1.500,00).
* **Comissão do Leiloeiro:** Geralmente 5% da arrematação.
* **ITBI (Imposto de Transmissão):** Calculado sobre o valor da compra ou avaliação (ex: 2% a 4%).
* **Escritura e Registro:** Taxas de cartório de imóveis (ex: 1.5% cada).
* **Reforma Estimada:** Custo de melhoria do imóvel para venda.
* **Assessoria Jurídica/Comercial:** Percentual sobre o lance ou venda.
* **Custos Mensais de Carregamento (Holding):** IPTU e Condomínio que serão pagos enquanto o imóvel não for vendido, multiplicado pelo número de meses estimado de carregamento (ex: 12 meses).

### 7.2. Cálculo de TIR (Taxa Interna de Retorno) e ROI
O motor financeiro gera um fluxo de caixa distribuído no tempo:
1. **Mês 0 (Investimento Inicial):** Soma de todos os desembolsos de entrada (Lance + Comissão + Custos Extras + ITBI + Reforma).
2. **Mês 1 ao Mês de Venda - 1:** Saídas mensais constantes referentes ao carregamento (Holding Costs).
3. **Mês de Carregamento Final (Entrada de Caixa):** Valor de revenda esperado do imóvel (Cash Inflow) subtraído de comissões de corretagem ou assessoria de saída.

O sistema calcula recursivamente a **TIR** anualizada resolvendo a equação polinomial de Newton-Raphson:
$$\sum_{t=0}^{N} \frac{FC_t}{(1 + TIR)^t} = 0$$

### 7.3. Comparativo de Portfólio (Benchmark)
Com base na TIR e ROI do projeto obtidos do imóvel, o sistema compara em tempo real em um gráfico interativo as taxas do leilão contra investimentos conservadores do mercado financeiro brasileiro:
* **Tesouro Direto IPCA+ / SELIC** (ex: Benchmark de 11.5% a.a.)
* **CDB de Liquidez** (ex: 12.0% a.a.)
* **Poupança** (ex: 6.5% a.a.)
* **Rendimento de Aluguel Comum** (ex: 8.5% a.a.)

---

## 8. DESIGN DE INTERFACE (UI/UX)

* **Tema Visual:** O sistema segue uma identidade visual de luxo focada em investidores institucionais. Utiliza cores escuras de alta classe (Fundo cinza-carvão escuro, bordas finas douradas e detalhes em amarelo-âmbar brilhante).
* **Bento Grid:** O painel distribui as informações em cards organizados de forma proporcional com generoso espaçamento negativo para evitar poluição visual.
* **Navegação Inteligente:** Controle total por abas reativas na barra superior ("Dossiê de Arrematação", "Edital", "Matrícula", "Processos", "Documentos Anexados", "História do Processo", "Calculadora TIR/ROI").
* **Visualização Gráfica:** Utiliza a biblioteca `recharts` para plotar curvas dinâmicas de viabilidade e simulações financeiras de fluxo de caixa em barras empilhadas e áreas sombreadas de alta performance visual.

---

## 9. ORIENTAÇÃO PARA EXTENSÃO E MELHORIAS (Para Outras IAs)

Caso você queira adicionar recursos ou migrar este sistema para outra infraestrutura, siga estas regras de engenharia:

1. **Alterações de Banco de Dados:** Adicione novas tabelas ou colunas diretamente no script de inicialização do SQLite em `server.ts` de forma idempotente (`IF NOT EXISTS`). O banco local é ideal para rapidez e isolamento.
2. **Novos Modelos de IA:** Se optar por integrar novos provedores (como os modelos o3 ou Claude 3.7), faça-o estendendo a função `mapModelId` e o objeto de payload em `/server/aiRunner.ts`.
3. **Preservação de OCR/Textos puros:** Nunca force o envio direto de PDFs de centenas de páginas às APIs sem usar a coluna `extracted_text` da tabela `documents`. Use o serviço de texto e OCR integrado para economizar tokens e evitar gargalos de latência.
4. **Regras de Negócio de Leilões no Brasil:** Os prompts estruturados em `aiRunner.ts` contêm conceitos jurídicos complexos como *Adjudicação*, *Arrematação*, *Meação de Cônjuge*, *Intimação Pessoal do Executado* e *Efeito Suspensivo de Embargos*. Preserve a densidade desses termos nos prompts para que as análises geradas continuem no mais alto nível de precisão jurídica brasileira.
