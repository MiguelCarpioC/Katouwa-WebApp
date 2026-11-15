// Servidor estático mínimo para Railway (sin dependencias).
// Sirve index.html, sala.html y sus recursos. Railway define PORT.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

// Solo se publica lo que la web necesita
const PUBLIC = /^\/(index\.html|sala\.html|styles\.css|main\.js|assets\/|sala\/|data\/|docs\/)/;

http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { url = '/'; }
  if (url === '/') url = '/index.html';
  if (url === '/sala/') { res.writeHead(301, { Location: '/sala' }); return res.end(); }
  if (url === '/sala') url = '/sala.html';
  if (url === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }

  const file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT + path.sep) || !PUBLIC.test(url)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('No encontrado');
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    const ext = path.extname(file).toLowerCase();
    // HTML, CSS, JS and data are revalidated on every visit (ETag), so a new
    // deploy never mixes fresh HTML with stale styles. Images can be cached.
    const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const revalidate = ['.html', '.css', '.js', '.json', '.csv', '.md'].includes(ext);
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': revalidate ? 'no-cache' : 'public, max-age=86400',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
    };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, () => console.log(`KATOUWA en el puerto ${PORT}`));
