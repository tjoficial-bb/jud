/**
 * Hostinger Node.js Startup File (app.js)
 * 
 * This file acts as the bridge for Hostinger or other hosting environments
 * that require a root-level startup file. Since package.json is configured
 * as "type": "module", this file is written using standard ES module import syntax
 * to prevent startup ReferenceErrors in Node.js.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, 'dist', 'server.cjs');
const logPath = path.join(__dirname, 'startup_error.log');

function logToFile(msg) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  } catch (e) {
    console.error("Failed to write to log file:", e);
  }
}

let fallbackServer = null;

function startFallbackServer(error) {
  if (fallbackServer) return; // Already running
  
  const PORT = process.env.PORT || 3000;
  logToFile(`Starting fallback server on port ${PORT}...`);
  
  try {
    fallbackServer = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.write(`
        <html>
          <head>
            <title>Erro na Inicialização da Aplicação</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #fff5f5; color: #c53030; line-height: 1.6; }
              h1 { border-bottom: 2px solid #feb2b2; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; }
              pre { background: #fff; padding: 20px; border: 1px solid #fed7d7; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 14px; color: #2d3748; white-space: pre-wrap; word-break: break-all; }
              .info { margin-top: 20px; color: #4a5568; font-size: 14px; }
            </style>
          </head>
          <body>
            <h1>Erro ao Iniciar o Servidor (Hostinger)</h1>
            <p>Ocorreu um erro ao carregar o arquivo compitado <strong>dist/server.cjs</strong>.</p>
            <h3>Mensagem de Erro / Stack Trace:</h3>
            <pre>${error?.stack || error || 'Erro desconhecido'}</pre>
            <p class="info">Dica: Verifique se todas as dependências estão devidamente instaladas e se a versão do Node.js é compatível.</p>
          </body>
        </html>
      `);
      res.end();
    });
    
    fallbackServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[app.js]: Fallback server running on port ${PORT}`);
      logToFile(`Fallback server successfully listening on port ${PORT}`);
    });
  } catch (e) {
    console.error("Failed to start fallback server:", e);
    logToFile(`Failed to start fallback server: ${e?.stack || e}`);
  }
}

// Global exception handlers to catch any background crashes too
process.on('uncaughtException', (err) => {
  const errMsg = `Uncaught Exception: ${err?.stack || err}`;
  console.error(errMsg);
  logToFile(errMsg);
  startFallbackServer(err);
});

process.on('unhandledRejection', (reason, promise) => {
  const errMsg = `Unhandled Rejection: ${reason?.stack || reason}`;
  console.error(errMsg);
  logToFile(errMsg);
  startFallbackServer(reason);
});

console.log("DEBUG [app.js]: Starting startup script...");
logToFile("Startup script initiated.");

if (!fs.existsSync(serverPath)) {
  const noBuildMsg = "The compiled server file 'dist/server.cjs' was not found. Please ensure that 'npm run build' runs successfully.";
  console.error(noBuildMsg);
  logToFile(noBuildMsg);
  startFallbackServer(new Error(noBuildMsg));
} else {
  console.log("DEBUG [app.js]: Compiled server found. Dynamically importing 'dist/server.cjs'...");
  logToFile("Attempting dynamic import of dist/server.cjs...");
  
  import('./dist/server.cjs').then(() => {
    console.log("DEBUG [app.js]: Full-stack server imported successfully.");
    logToFile("Full-stack server imported successfully.");
  }).catch((err) => {
    const importErrorMsg = `Failed to import dist/server.cjs: ${err?.stack || err}`;
    console.error(importErrorMsg);
    logToFile(importErrorMsg);
    startFallbackServer(err);
  });
}
