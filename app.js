/**
 * Hostinger Node.js Startup File (app.js)
 * 
 * This file acts as the bridge for Hostinger or other hosting environments
 * that require a root-level startup file.
 */

const path = require('path');
const fs = require('fs');

const serverPath = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(serverPath)) {
  console.error("Error: The compiled server file 'dist/server.cjs' was not found.");
  console.error("Please run the build command ('npm run build') first before starting the server.");
  // Serve a simple message if started improperly
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("A aplicação ainda não foi compilada. Por favor, certifique-se de que o comando de build foi executado com sucesso (npm run build) no painel da Hostinger.");
  });
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Fallback server running on port ${PORT}`);
  });
} else {
  // Load the compiled full-stack server
  require(serverPath);
}
