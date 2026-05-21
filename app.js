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

console.log("DEBUG [app.js]: Starting startup script...");
console.log(`DEBUG [app.js]: Checking for compiled server at: ${serverPath}`);

if (!fs.existsSync(serverPath)) {
  console.error("Error [app.js]: The compiled server file 'dist/server.cjs' was not found.");
  console.error("Please ensure that 'npm run build' runs successfully in your Hostinger panel.");
  
  // Fallback HTTP server so the Hostinger port stays active and displays a helpful error message instead of 503
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("A aplicação ainda não foi compilada no servidor. Por favor, certifique-se de executar o comando de compilação (npm run build) no painel de controle da Hostinger.");
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[app.js]: Fallback server running on port ${PORT}`);
  });
} else {
  console.log("DEBUG [app.js]: Compiled server found. Dynamically importing 'dist/server.cjs'...");
  // ESM can import CommonJS (.cjs) files dynamically
  import('./dist/server.cjs').then(() => {
    console.log("DEBUG [app.js]: Full-stack server imported successfully.");
  }).catch((err) => {
    console.error("CRITICAL [app.js]: Failed to import dist/server.cjs:", err);
  });
}
