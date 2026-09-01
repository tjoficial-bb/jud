/**
 * Hostinger & Production Node.js Startup Bridge (app.js)
 * 
 * This file acts as the bridge for Hostinger, cPanel, Passenger, or other hosting environments
 * that require a root-level startup file.
 * 
 * If dist/server.cjs is missing, it will automatically attempt to run 'npm run build'
 * and start the server seamlessly.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { exec, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, 'dist', 'server.cjs');
const logPath = path.join(__dirname, 'startup_error.log');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function logToFile(msg) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  } catch (e) {
    console.error("Failed to write to log file:", e);
  }
}

let isBuilding = false;
let buildLogs = [];
let fallbackServer = null;

function addBuildLog(msg) {
  console.log(`[Build Engine]: ${msg}`);
  buildLogs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
  if (buildLogs.length > 50) buildLogs.shift();
}

function runBuildAsync(callback) {
  if (isBuilding) return;
  isBuilding = true;
  addBuildLog("Iniciando compilação do projeto (npm run build)...");
  
  exec('npm run build', { cwd: __dirname }, (error, stdout, stderr) => {
    isBuilding = false;
    if (stdout) addBuildLog(`Saída:\n${stdout}`);
    if (stderr) addBuildLog(`Avisos/Erros:\n${stderr}`);

    if (error) {
      const errDetail = `Falha no build: ${error.message}`;
      addBuildLog(errDetail);
      logToFile(errDetail);
      if (callback) callback(error);
    } else {
      addBuildLog("Build concluído com sucesso! dist/server.cjs gerado.");
      logToFile("Build completed successfully via app.js auto-build.");
      if (callback) callback(null);
    }
  });
}

function startFallbackServer(error) {
  if (fallbackServer) return;
  
  logToFile(`Starting fallback server on port ${PORT}...`);
  
  try {
    fallbackServer = http.createServer((req, res) => {
      const url = req.url || '/';

      if (url === '/api/build' || url === '/run-build') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (!isBuilding) {
          runBuildAsync((err) => {
            if (!err && fs.existsSync(serverPath)) {
              setTimeout(() => {
                try {
                  fallbackServer.close();
                  import('./dist/server.cjs');
                } catch (e) {
                  console.error("Failed to transition server:", e);
                }
              }, 1000);
            }
          });
          res.end(JSON.stringify({ status: 'started', message: 'Compilação iniciada em segundo plano.' }));
        } else {
          res.end(JSON.stringify({ status: 'in_progress', message: 'Compilação já está em andamento.' }));
        }
        return;
      }

      if (url === '/api/build-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          isBuilding,
          buildSuccess: fs.existsSync(serverPath),
          logs: buildLogs
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Inicializando Servidor TJ Invest</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; background: #0f172a; color: #f8fafc; line-height: 1.6; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              .card { max-width: 700px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
              h1 { font-size: 22px; margin-bottom: 12px; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
              p { color: #94a3b8; font-size: 15px; margin-bottom: 20px; }
              .terminal { background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #a5f3fc; max-height: 220px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; margin-bottom: 24px; }
              .btn { display: inline-flex; align-items: center; justify-content: center; background: #0284c7; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
              .btn:hover { background: #0369a1; }
              .btn:disabled { opacity: 0.5; cursor: not-allowed; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #fbbf24; color: #78350f; margin-bottom: 16px; }
              .badge.ready { background: #34d399; color: #064e3b; }
              .instructions { margin-top: 24px; padding-top: 20px; border-top: 1px solid #334155; font-size: 13px; color: #64748b; }
              .instructions code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="card">
              <span id="badge" class="badge">Preparando Servidor</span>
              <h1>Compilação da Aplicação</h1>
              <p>O arquivo compilado <code>dist/server.cjs</code> está sendo gerado ou precisa ser compilado para iniciar a aplicação.</p>
              
              <div id="terminal" class="terminal">${buildLogs.join('\n') || error?.message || 'Aguardando ação de build...'}</div>
              
              <div style="display: flex; gap: 12px;">
                <button id="btnBuild" class="btn" onclick="triggerBuild()">⚡ Executar Build Agora</button>
                <button class="btn" style="background: #334155;" onclick="location.reload()">🔄 Atualizar Página</button>
              </div>

              <div class="instructions">
                <strong>No terminal da Hostinger / cPanel:</strong><br>
                Você também pode executar <code>npm run build</code> no terminal SSH ou no Gerenciador de Arquivos.
              </div>
            </div>

            <script>
              async function triggerBuild() {
                const btn = document.getElementById('btnBuild');
                btn.disabled = true;
                btn.innerText = '⏳ Compilando...';
                try {
                  await fetch('/run-build');
                } catch(e) {}
                startPolling();
              }

              let timer = null;
              function startPolling() {
                if (timer) return;
                timer = setInterval(async () => {
                  try {
                    const res = await fetch('/api/build-status');
                    const data = await res.json();
                    const term = document.getElementById('terminal');
                    term.innerText = data.logs.join('\\n');
                    term.scrollTop = term.scrollHeight;

                    if (data.buildSuccess) {
                      document.getElementById('badge').className = 'badge ready';
                      document.getElementById('badge').innerText = 'Servidor Pronto!';
                      setTimeout(() => location.reload(), 1500);
                    }
                  } catch (e) {}
                }, 2000);
              }

              // Auto-trigger build if dist is missing
              window.onload = function() {
                triggerBuild();
              };
            </script>
          </body>
        </html>
      `);
      res.end();
    });
    
    fallbackServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[app.js]: Helper server running on port ${PORT}`);
      logToFile(`Helper server listening on port ${PORT}`);
    });
  } catch (e) {
    console.error("Failed to start helper server:", e);
    logToFile(`Failed to start helper server: ${e?.stack || e}`);
  }
}

// Global error traps
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

console.log("DEBUG [app.js]: Starting application bootstrapper...");
logToFile("Startup script initiated.");

function loadCompiledServer() {
  console.log("DEBUG [app.js]: Compiled server found. Importing 'dist/server.cjs'...");
  logToFile("Importing dist/server.cjs...");
  
  import('./dist/server.cjs').then(() => {
    console.log("DEBUG [app.js]: Full-stack server imported and running successfully.");
    logToFile("Full-stack server running successfully.");
  }).catch((err) => {
    const importErrorMsg = `Failed to import dist/server.cjs: ${err?.stack || err}`;
    console.error(importErrorMsg);
    logToFile(importErrorMsg);
    startFallbackServer(err);
  });
}

if (!fs.existsSync(serverPath)) {
  addBuildLog("Arquivo 'dist/server.cjs' não encontrado. Tentando compilação automática...");
  logToFile("dist/server.cjs not found. Running auto-build...");
  
  try {
    // Try synchronous build first
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
    if (fs.existsSync(serverPath)) {
      addBuildLog("Auto-build completado com sucesso.");
      loadCompiledServer();
    } else {
      throw new Error("Build command completed but 'dist/server.cjs' was not produced.");
    }
  } catch (buildErr) {
    console.error("[app.js] Synchronous auto-build encountered an issue:", buildErr?.message);
    logToFile(`Auto-build error: ${buildErr?.message}`);
    startFallbackServer(buildErr);
  }
} else {
  loadCompiledServer();
}
